'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/hooks/useProjects';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Eye, 
  Edit, 
  MoreHorizontal, 
  Calendar, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  PlayCircle,
  PauseCircle,
  Building2,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectsTableProps {
  className?: string;
}

type StatusFilter = 'all' | 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
type HealthFilter = 'all' | 'excellent' | 'good' | 'warning' | 'critical';

export function ProjectsTable({ className }: ProjectsTableProps) {
  const router = useRouter();
  const { projects, summary, loading, error, refreshProjects } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
  const [selectedHealth, setSelectedHealth] = useState<HealthFilter>('all');
  const [sortField, setSortField] = useState<'name' | 'client' | 'value' | 'progress' | 'health' | 'start_date'>('start_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleViewProject = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning':
        return <Calendar className="h-4 w-4" />;
      case 'in_progress':
        return <PlayCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'on_hold':
        return <PauseCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getHealthIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (score >= 70) return <TrendingUp className="h-4 w-4 text-orange-600" />;
    if (score >= 50) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-orange-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter and sort projects
  const filteredAndSortedProjects = projects
    .filter(project => {
      const matchesSearch = 
        project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.project_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client?.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
      
      const projectHealth = project.stats?.healthScore || 0;
      const matchesHealth = selectedHealth === 'all' || 
        (selectedHealth === 'excellent' && projectHealth >= 90) ||
        (selectedHealth === 'good' && projectHealth >= 70 && projectHealth < 90) ||
        (selectedHealth === 'warning' && projectHealth >= 50 && projectHealth < 70) ||
        (selectedHealth === 'critical' && projectHealth < 50);

      return matchesSearch && matchesStatus && matchesHealth;
    })
    .sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.project_name;
          bValue = b.project_name;
          break;
        case 'client':
          aValue = a.client?.full_name || '';
          bValue = b.client?.full_name || '';
          break;
        case 'value':
          aValue = a.contract_value || 0;
          bValue = b.contract_value || 0;
          break;
        case 'progress':
          aValue = a.progress_percentage || 0;
          bValue = b.progress_percentage || 0;
          break;
        case 'health':
          aValue = a.stats?.healthScore || 0;
          bValue = b.stats?.healthScore || 0;
          break;
        case 'start_date':
          aValue = new Date(a.start_date);
          bValue = new Date(b.start_date);
          break;
        default:
          aValue = a.created_at;
          bValue = b.created_at;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading projects...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <XCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading projects</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={refreshProjects}
                className="bg-red-100 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-200 rounded-md"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white shadow rounded-lg', className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <Building2 className="h-5 w-5 text-orange-600 mr-2" />
              Project Management
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Comprehensive project oversight • {summary.totalProjects} total • R{formatCurrency(summary.totalContractValue).replace('ZAR', '').trim()} total value
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={refreshProjects}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              <Building2 className="h-4 w-4 mr-2" />
              New Project
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          <div className="text-center">
            <dt className="text-sm font-medium text-gray-500">Active</dt>
            <dd className="mt-1 text-2xl font-semibold text-orange-600">{summary.activeProjects}</dd>
          </div>
          <div className="text-center">
            <dt className="text-sm font-medium text-gray-500">Completed</dt>
            <dd className="mt-1 text-2xl font-semibold text-green-600">{summary.completedProjects}</dd>
          </div>
          <div className="text-center">
            <dt className="text-sm font-medium text-gray-500">On Hold</dt>
            <dd className="mt-1 text-2xl font-semibold text-yellow-600">{summary.onHoldProjects}</dd>
          </div>
          <div className="text-center">
            <dt className="text-sm font-medium text-gray-500">Avg Progress</dt>
            <dd className="mt-1 text-2xl font-semibold text-blue-600">{summary.averageProgress}%</dd>
          </div>
          <div className="text-center">
            <dt className="text-sm font-medium text-gray-500">Health Score</dt>
            <dd className="mt-1 text-2xl font-semibold text-purple-600">{summary.averageHealthScore}/100</dd>
          </div>
          <div className="text-center">
            <dt className="text-sm font-medium text-gray-500">Need Attention</dt>
            <dd className="mt-1 text-2xl font-semibold text-red-600">{summary.projectsNeedingAttention}</dd>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects, addresses, or clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as StatusFilter)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All Statuses</option>
              <option value="planning">Planning</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Health Filter */}
          <div className="sm:w-48">
            <select
              value={selectedHealth}
              onChange={(e) => setSelectedHealth(e.target.value as HealthFilter)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All Health Scores</option>
              <option value="excellent">Excellent (90-100)</option>
              <option value="good">Good (70-89)</option>
              <option value="warning">Warning (50-69)</option>
              <option value="critical">Critical (&lt;50)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden">
        {filteredAndSortedProjects.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedStatus !== 'all' || selectedHealth !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : 'Get started by creating your first project.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    Project Details
                    {sortField === 'name' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('client')}
                  >
                    Client
                    {sortField === 'client' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('progress')}
                  >
                    Progress
                    {sortField === 'progress' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('value')}
                  >
                    Contract Value
                    {sortField === 'value' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('health')}
                  >
                    Health Score
                    {sortField === 'health' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timeline
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {project.project_name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {project.project_address}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Phase: {project.current_phase}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {project.client?.full_name || 'Unknown Client'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {project.client?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                        getStatusColor(project.status)
                      )}>
                        {getStatusIcon(project.status)}
                        <span className="ml-1 capitalize">{project.status.replace('_', ' ')}</span>
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                          <div
                            className="bg-orange-600 h-2 rounded-full"
                            style={{ width: `${project.progress_percentage || 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {project.progress_percentage || 0}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {project.stats?.completedMilestones || 0}/{project.stats?.totalMilestones || 0} milestones
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(project.contract_value || 0)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {project.stats?.activeContractors || 0} contractors
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getHealthIcon(project.stats?.healthScore || 0)}
                        <span className={cn(
                          'ml-2 text-sm font-medium',
                          getHealthColor(project.stats?.healthScore || 0)
                        )}>
                          {project.stats?.healthScore || 0}/100
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>Start: {formatDate(project.start_date)}</div>
                      <div>Due: {formatDate(project.expected_completion)}</div>
                      {project.actual_completion && (
                        <div className="text-green-600">
                          Completed: {formatDate(project.actual_completion)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleViewProject(project.id)}
                          className="text-orange-600 hover:text-orange-900"
                          title="View project details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="text-gray-600 hover:text-gray-900"
                          title="Edit project"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="text-gray-600 hover:text-gray-900"
                          title="More actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Results Summary */}
      {filteredAndSortedProjects.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            Showing {filteredAndSortedProjects.length} of {summary.totalProjects} projects
            {(searchTerm || selectedStatus !== 'all' || selectedHealth !== 'all') && ' (filtered)'}
          </div>
        </div>
      )}
    </div>
  );
} 
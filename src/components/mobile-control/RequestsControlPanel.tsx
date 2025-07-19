'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { RequestDetailModal } from '@/components/requests/RequestDetailModal';
import { useRequests } from '@/hooks/useRequests';
import { AdminRequest } from '@/types/requests';
import {
  MessageSquare,
  Clock,
  BarChart3,
  List,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  User,
  Calendar,
  Filter,
  Search,
  ExternalLink,
  ArrowRight,
  PlusCircle,
  Users,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface RequestsControlPanelProps {
  projectId: string;
  onDataSync?: (data: any) => void;
}

type ViewType = 'list' | 'timeline' | 'stats';

export function RequestsControlPanel({ projectId, onDataSync }: RequestsControlPanelProps) {
  const [activeView, setActiveView] = useState<ViewType>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'reviewing' | 'in_progress' | 'completed'>('all');
  const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get requests filtered by project
  const { 
    requests, 
    stats, 
    loading, 
    error, 
    refetch 
  } = useRequests({
    includeStats: true,
    filters: {
      project_id: projectId,
      search: searchQuery || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }
  });

  // Notify parent of data sync
  useEffect(() => {
    if (onDataSync && stats) {
      onDataSync({
        type: 'requests',
        projectId,
        stats,
        totalRequests: requests.length,
        lastUpdated: new Date().toISOString()
      });
    }
  }, [stats, requests, projectId, onDataSync]);

  const handleRequestClick = (request: AdminRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const handleRequestUpdate = () => {
    refetch();
  };

  const viewOptions = [
    { id: 'list' as const, label: 'List View', icon: List, description: 'View all requests in a detailed list' },
    { id: 'timeline' as const, label: 'Timeline', icon: Clock, description: 'See request activity over time' },
    { id: 'stats' as const, label: 'Statistics', icon: BarChart3, description: 'Analyze request patterns and metrics' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Requests', count: requests.length },
    { value: 'submitted', label: 'Submitted', count: requests.filter(r => r.status === 'submitted').length },
    { value: 'reviewing', label: 'Reviewing', count: requests.filter(r => r.status === 'reviewing').length },
    { value: 'in_progress', label: 'In Progress', count: requests.filter(r => r.status === 'in_progress').length },
    { value: 'completed', label: 'Completed', count: requests.filter(r => r.status === 'completed').length },
  ];

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <LoadingSpinner />
          <span className="ml-2 text-gray-600">Loading project requests...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Requests</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <Button onClick={refetch} className="mt-4">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Quick Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-orange-600" />
            Project Requests
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage and track service and material requests for this project
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Quick stats badges */}
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
            <Activity className="h-3 w-3 mr-1" />
            {requests.length} Total
          </Badge>
          <Badge variant="destructive" className="bg-orange-50 text-orange-700 border-orange-200">
            <Clock className="h-3 w-3 mr-1" />
            {requests.filter(r => r.status === 'submitted' || r.status === 'reviewing').length} Pending
          </Badge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open('/requests', '_blank')}
            className="text-orange-600 border-orange-600 hover:bg-orange-50"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            View All Requests
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search requests by title, description, or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              {statusOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={statusFilter === option.value ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(option.value as any)}
                  className={cn(
                    "text-xs",
                    statusFilter === option.value && "bg-orange-500 hover:bg-orange-600"
                  )}
                >
                  {option.label}
                  <Badge variant="secondary" className="ml-1">
                    {option.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {viewOptions.map((view) => {
            const Icon = view.icon;
            return (
              <Button
                key={view.id}
                variant={activeView === view.id ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveView(view.id)}
                className={cn(
                  "flex items-center",
                  activeView === view.id && "bg-orange-500 hover:bg-orange-600"
                )}
              >
                <Icon className="h-4 w-4 mr-2" />
                {view.label}
              </Button>
            );
          })}
        </div>

        <div className="text-sm text-gray-500">
          {requests.length === 0 ? 'No requests found' : 
           `Showing ${requests.length} request${requests.length === 1 ? '' : 's'}`}
        </div>
      </div>

      {/* View Content */}
      <div>
        {activeView === 'list' && (
          <ProjectRequestsList 
            requests={requests} 
            onRequestClick={handleRequestClick}
          />
        )}
        {activeView === 'timeline' && (
          <ProjectRequestsTimeline 
            requests={requests} 
            onRequestClick={handleRequestClick}
          />
        )}
        {activeView === 'stats' && (
          <ProjectRequestsStats 
            requests={requests} 
            stats={stats}
            projectId={projectId}
          />
        )}
      </div>

      {/* Request Detail Modal */}
      <RequestDetailModal
        request={selectedRequest}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onUpdate={handleRequestUpdate}
      />
    </div>
  );
}

// Project Requests List View Component
interface ProjectRequestsListProps {
  requests: AdminRequest[];
  onRequestClick: (request: AdminRequest) => void;
}

function ProjectRequestsList({ requests, onRequestClick }: ProjectRequestsListProps) {
  if (requests.length === 0) {
    return (
      <Card className="p-8 text-center">
        <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No Requests Found</h3>
        <p className="mt-1 text-sm text-gray-500">
          No requests have been submitted for this project yet.
        </p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.open('/requests', '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View All Requests
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card 
          key={request.id} 
          className="hover:shadow-md transition-shadow cursor-pointer group"
          onClick={() => onRequestClick(request)}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="flex items-center space-x-2">
                    {request.category === 'service' ? (
                      <span className="text-lg">🏗️</span>
                    ) : (
                      <span className="text-lg">🧱</span>
                    )}
                    <h4 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                      {request.title}
                    </h4>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
                </div>
                
                <p className="text-gray-600 mb-3 line-clamp-2">
                  {request.description}
                </p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {request.client?.full_name || 'Unknown Client'}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {format(new Date(request.created_at), 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    {request.category}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end space-y-2">
                <Badge 
                  className={cn(
                    "text-white",
                    request.status === 'completed' && "bg-green-500",
                    request.status === 'in_progress' && "bg-blue-500",
                    (request.status === 'submitted' || request.status === 'reviewing') && "bg-orange-500",
                    (request.status === 'approved' || request.status === 'rejected') && "bg-gray-500"
                  )}
                >
                  {request.status.replace('_', ' ')}
                </Badge>
                
                <Badge 
                  variant="outline"
                  className={cn(
                    request.priority === 'urgent' && "border-red-500 text-red-700",
                    request.priority === 'high' && "border-orange-500 text-orange-700",
                    request.priority === 'medium' && "border-yellow-500 text-yellow-700",
                    request.priority === 'low' && "border-green-500 text-green-700"
                  )}
                >
                  {request.priority} priority
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Project Requests Timeline View Component
interface ProjectRequestsTimelineProps {
  requests: AdminRequest[];
  onRequestClick: (request: AdminRequest) => void;
}

function ProjectRequestsTimeline({ requests, onRequestClick }: ProjectRequestsTimelineProps) {
  // Group requests by date
  const groupedRequests = requests.reduce((groups, request) => {
    const date = format(new Date(request.created_at), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(request);
    return groups;
  }, {} as Record<string, AdminRequest[]>);

  const sortedDates = Object.keys(groupedRequests).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  if (requests.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Clock className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No Timeline Data</h3>
        <p className="mt-1 text-sm text-gray-500">
          No requests to display in timeline view.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((date, dateIndex) => (
        <div key={date} className="relative">
          {/* Timeline line */}
          {dateIndex < sortedDates.length - 1 && (
            <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200"></div>
          )}
          
          {/* Date header */}
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full border-4 border-white shadow-sm z-10">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div className="ml-4">
              <h4 className="font-semibold text-gray-900">
                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
              </h4>
              <p className="text-sm text-gray-500">
                {groupedRequests[date].length} request{groupedRequests[date].length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          
          {/* Requests for this date */}
          <div className="ml-16 space-y-3">
            {groupedRequests[date].map((request) => (
              <Card 
                key={request.id}
                className="hover:shadow-md transition-shadow cursor-pointer group border-l-4 border-l-orange-500"
                onClick={() => onRequestClick(request)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {request.category === 'service' ? (
                        <span className="text-lg">🏗️</span>
                      ) : (
                        <span className="text-lg">🧱</span>
                      )}
                      <div>
                        <h5 className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
                          {request.title}
                        </h5>
                        <p className="text-sm text-gray-600 line-clamp-1">
                          {request.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge 
                        className={cn(
                          "text-white text-xs",
                          request.status === 'completed' && "bg-green-500",
                          request.status === 'in_progress' && "bg-blue-500",
                          (request.status === 'submitted' || request.status === 'reviewing') && "bg-orange-500"
                        )}
                      >
                        {request.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {format(new Date(request.created_at), 'HH:mm')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Project Requests Statistics View Component
interface ProjectRequestsStatsProps {
  requests: AdminRequest[];
  stats: any;
  projectId: string;
}

function ProjectRequestsStats({ requests, stats, projectId }: ProjectRequestsStatsProps) {
  // Calculate additional project-specific stats
  const serviceRequests = requests.filter(r => r.category === 'service');
  const materialRequests = requests.filter(r => r.category === 'material');
  const avgResponseTime = 4.2; // Mock data - could be calculated from actual response times
  const clientSatisfaction = 4.6; // Mock data - could come from ratings
  
  const statusDistribution = [
    { status: 'completed', count: requests.filter(r => r.status === 'completed').length, color: 'bg-green-500' },
    { status: 'in_progress', count: requests.filter(r => r.status === 'in_progress').length, color: 'bg-blue-500' },
    { status: 'reviewing', count: requests.filter(r => r.status === 'reviewing').length, color: 'bg-yellow-500' },
    { status: 'submitted', count: requests.filter(r => r.status === 'submitted').length, color: 'bg-orange-500' },
  ];

  const priorityDistribution = [
    { priority: 'urgent', count: requests.filter(r => r.priority === 'urgent').length, color: 'bg-red-500' },
    { priority: 'high', count: requests.filter(r => r.priority === 'high').length, color: 'bg-orange-500' },
    { priority: 'medium', count: requests.filter(r => r.priority === 'medium').length, color: 'bg-yellow-500' },
    { priority: 'low', count: requests.filter(r => r.priority === 'low').length, color: 'bg-green-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Response</p>
                <p className="text-2xl font-bold text-gray-900">{avgResponseTime}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {requests.length > 0 ? Math.round((requests.filter(r => r.status === 'completed').length / requests.length) * 100) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Satisfaction</p>
                <p className="text-2xl font-bold text-gray-900">{clientSatisfaction}/5.0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-orange-600" />
              Request Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-lg mr-2">🏗️</span>
                  <span className="font-medium">Service Requests</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-orange-600">{serviceRequests.length}</span>
                  <div className="text-xs text-gray-500">
                    {requests.length > 0 ? Math.round((serviceRequests.length / requests.length) * 100) : 0}% of total
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-lg mr-2">🧱</span>
                  <span className="font-medium">Material Requests</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-green-600">{materialRequests.length}</span>
                  <div className="text-xs text-gray-500">
                    {requests.length > 0 ? Math.round((materialRequests.length / requests.length) * 100) : 0}% of total
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-orange-600" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusDistribution.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={cn("w-3 h-3 rounded-full mr-3", item.color)}></div>
                    <span className="font-medium capitalize">{item.status.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold">{item.count}</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className={cn("h-2 rounded-full", item.color)}
                        style={{
                          width: requests.length > 0 ? `${(item.count / requests.length) * 100}%` : '0%'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
            Priority Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {priorityDistribution.map((item) => (
              <div key={item.priority} className="text-center">
                <div className={cn("w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center", item.color)}>
                  <span className="text-2xl font-bold text-white">{item.count}</span>
                </div>
                <p className="font-medium capitalize">{item.priority} Priority</p>
                <p className="text-sm text-gray-500">
                  {requests.length > 0 ? Math.round((item.count / requests.length) * 100) : 0}%
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
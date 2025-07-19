'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequests } from '@/hooks/useRequests';
import { AdminRequest } from '@/types/requests';
import { RequestDetailModal } from '@/components/requests/RequestDetailModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  Wrench,
  Package,
  Calendar,
  User,
  MapPin,
  ArrowRight,
  RefreshCw,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTimeAgo, getStatusColor, getPriorityColor } from '@/types/requests';

type ActiveTab = 'overview' | 'pending' | 'in_progress' | 'completed' | 'all';
type FilterStatus = 'all' | 'submitted' | 'reviewing' | 'in_progress' | 'completed';
type FilterPriority = 'all' | 'low' | 'medium' | 'high' | 'urgent';

export default function RequestsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('all');
  const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get requests with filters
  const { 
    requests, 
    stats, 
    loading, 
    error, 
    pagination,
    refetch 
  } = useRequests({
    includeStats: true,
    filters: {
      search: searchQuery || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      priority: priorityFilter === 'all' ? undefined : priorityFilter
    }
  });

  const tabs = [
    { 
      id: 'overview' as const, 
      label: 'Overview', 
      icon: BarChart3,
      count: stats?.total || 0
    },
    { 
      id: 'pending' as const, 
      label: 'Pending', 
      icon: Clock,
      count: stats?.pending || 0,
      color: 'text-orange-600'
    },
    { 
      id: 'in_progress' as const, 
      label: 'In Progress', 
      icon: AlertCircle,
      count: stats?.inProgress || 0,
      color: 'text-blue-600'
    },
    { 
      id: 'completed' as const, 
      label: 'Completed', 
      icon: CheckCircle,
      count: stats?.completed || 0,
      color: 'text-green-600'
    },
    { 
      id: 'all' as const, 
      label: 'All Requests', 
      icon: MessageSquare,
      count: stats?.total || 0
    },
  ];

  const filteredRequests = requests.filter(request => {
    if (activeTab === 'overview') return true;
    if (activeTab === 'pending') return request.status === 'submitted';
    if (activeTab === 'in_progress') return request.status === 'reviewing' || request.status === 'in_progress';
    if (activeTab === 'completed') return request.status === 'completed' || request.status === 'approved';
    if (activeTab === 'all') return true;
    return true;
  });

  const getRequestTypeIcon = (requestType: string) => {
    if (requestType.includes('service')) return '🏗️';
    if (requestType.includes('material')) return '🧱';
    return '📋';
  };

  const handleRequestClick = (request: AdminRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const handleRequestUpdate = (requestId: string, updates: Partial<AdminRequest>) => {
    // Refetch data to get updated request
    refetch();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Requests</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={refetch}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Request Management</h1>
              <p className="text-gray-600 mt-2">
                Manage service and material requests from mobile app users
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="px-3 py-1">
                {requests.length} of {pagination.total} requests
              </Badge>
              <Button onClick={refetch} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors",
                      activeTab === tab.id
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <Badge 
                        variant="secondary" 
                        className={cn("ml-2", tab.color)}
                      >
                        {tab.count}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <MessageSquare className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Requests</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-50 rounded-lg">
                      <Clock className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending Review</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.pending || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <AlertCircle className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">In Progress</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.inProgress || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.completed || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Category Breakdown */}
            {stats?.byCategory && (
              <Card>
                <CardHeader>
                  <CardTitle>Requests by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(stats.byCategory).map(([category, count]) => (
                      <div key={category} className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{count}</div>
                        <div className="text-sm text-gray-600 capitalize">{category.replace('_', ' ')}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Priority Breakdown */}
            {stats?.byPriority && (
              <Card>
                <CardHeader>
                  <CardTitle>Requests by Priority</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(stats.byPriority).map(([priority, count]) => (
                      <div key={priority} className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{count}</div>
                        <Badge className={getPriorityColor(priority)}>{priority}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* List Views (for pending, in_progress, completed, all tabs) */}
        {activeTab !== 'overview' && (
          <div className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search requests..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as FilterStatus)}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="reviewing">Reviewing</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as FilterPriority)}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Request List */}
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
                    <span className="text-gray-600">Loading requests...</span>
                  </div>
                </div>
              ) : filteredRequests.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
                      <p className="text-gray-600">
                        {searchQuery ? 'Try adjusting your search criteria' : 'No requests match the current filters'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                filteredRequests.map((request) => (
                  <Card 
                    key={request.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleRequestClick(request)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{getRequestTypeIcon(request.request_type)}</span>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                              <p className="text-gray-600">{request.description}</p>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <User className="h-4 w-4" />
                              <span>{request.client?.full_name || 'Unknown Client'}</span>
                            </div>
                            {request.project && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-4 w-4" />
                                <span>{request.project.project_name}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatTimeAgo(request.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                          <Badge className={getPriorityColor(request.priority)}>
                            {request.priority}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                </p>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={!pagination.hasPrev}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={!pagination.hasNext}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
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
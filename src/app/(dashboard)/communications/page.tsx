'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { AlertCircle, MessageSquare, CheckCircle, Clock, Users, TrendingUp, Send, Bell, ArrowRight, Phone, Mail, FileText, Calendar, MapPin, User } from 'lucide-react';
import { useCommunications } from '@/hooks/useCommunications';
import { cn } from '@/lib/utils';

type TabType = 'overview' | 'messages' | 'approvals' | 'notifications';

export default function CommunicationsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const { data, isLoading, error, refetch } = useCommunications({
    autoRefresh: false,  // Disable auto-refresh to prevent constant reloading
    refreshInterval: 300000  // 5 minutes if manually enabled
  });

  const tabs = [
    {
      id: 'overview' as TabType,
      label: 'Overview',
      icon: TrendingUp,
      description: 'Communication dashboard and analytics'
    },
    {
      id: 'messages' as TabType,
      label: 'Messages',
      icon: MessageSquare,
      description: 'Project conversations and messaging'
    },
    {
      id: 'approvals' as TabType,
      label: 'Approvals',
      icon: CheckCircle,
      description: 'Approval requests and responses'
    },
    {
      id: 'notifications' as TabType,
      label: 'Notifications',
      icon: Bell,
      description: 'System notifications and alerts'
    }
  ];

  const getConversationTypeColor = (type: string) => {
    switch (type) {
      case 'emergency':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'milestone_specific':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'client_contractor':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'approval_workflow':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'in_review':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Error Loading Communications
            </CardTitle>
            <CardDescription>
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={refetch} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Communication Data</CardTitle>
            <CardDescription>
              No communication data available at this time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={refetch} className="w-full">
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Communications</h1>
          <p className="text-gray-600">
            Manage all project communications, approvals, and notifications
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={refetch}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600"
            size="sm"
          >
            <Send className="h-4 w-4" />
            Send Broadcast
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{data.stats.totalConversations}</div>
                  <p className="text-xs text-muted-foreground">Active project discussions</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{data.stats.pendingApprovals}</div>
                  <p className="text-xs text-muted-foreground">Awaiting response</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{data.stats.unreadMessages}</div>
                  <p className="text-xs text-muted-foreground">Need attention</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{data.stats.responseRate}%</div>
                  <p className="text-xs text-muted-foreground">Avg. response time: {data.stats.averageResponseTime}h</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Recent Communication Activity
                </CardTitle>
                <CardDescription>
                  Latest messages, approvals, and notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.recentCommunications.slice(0, 10).map((comm, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          comm.priority === 'urgent' ? 'bg-red-500' :
                          comm.priority === 'high' ? 'bg-orange-500' :
                          comm.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        )} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{comm.subject}</p>
                          <span className="text-xs text-gray-500">
                            {formatDate(comm.communication_date)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {comm.from_person} → {comm.to_person}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {comm.projects?.project_name || 'General'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Project Conversations
                </CardTitle>
                <CardDescription>
                  Active discussions and project communications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.conversations.map((conversation) => (
                    <div key={conversation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{conversation.conversation_name}</h3>
                          <Badge
                            variant="outline"
                            className={getConversationTypeColor(conversation.conversation_type)}
                          >
                            {conversation.conversation_type.replace('_', ' ')}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={getPriorityColor(conversation.priority_level)}
                          >
                            {conversation.priority_level}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{conversation.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {conversation.participants.length} participants
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {conversation.message_count} messages
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(conversation.last_message_at)}
                          </span>
                          {conversation.project && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {conversation.project.project_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {conversation.unread_count > 0 && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            {conversation.unread_count} unread
                          </Badge>
                        )}
                        <Button variant="ghost" size="sm">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'approvals' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Approval Requests
                </CardTitle>
                <CardDescription>
                  Pending approvals and request management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.approvalRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{request.title}</h3>
                          <Badge
                            variant="outline"
                            className={getStatusColor(request.status)}
                          >
                            {request.status}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={getPriorityColor(request.priority_level)}
                          >
                            {request.priority_level}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {request.request_type.replace('_', ' ')}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {request.requester?.full_name || 'Unknown'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {request.days_pending} days pending
                          </span>
                          {request.estimated_cost_impact && (
                            <span className="flex items-center gap-1">
                              <span className="text-orange-600 font-medium">
                                {formatCurrency(request.estimated_cost_impact)}
                              </span>
                              cost impact
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {request.status === 'pending' && (
                          <>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              Reject
                            </Button>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              Approve
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="sm">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  System Notifications
                </CardTitle>
                <CardDescription>
                  Alerts, reminders, and system messages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.notifications.map((notification) => (
                    <div key={notification.id} className={cn(
                      'flex items-center justify-between p-4 rounded-lg transition-colors',
                      notification.is_read ? 'bg-gray-50' : 'bg-blue-50 border-l-4 border-blue-500'
                    )}>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={cn(
                            'font-medium',
                            !notification.is_read && 'text-blue-900'
                          )}>
                            {notification.title}
                          </h3>
                          <Badge
                            variant="outline"
                            className={getPriorityColor(notification.priority_level)}
                          >
                            {notification.priority_level}
                          </Badge>
                          {!notification.is_read && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Bell className="h-3 w-3" />
                            {notification.notification_type.replace('_', ' ')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(notification.created_at)}
                          </span>
                          {notification.project && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {notification.project.project_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!notification.is_read && (
                          <Button variant="outline" size="sm">
                            Mark Read
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 
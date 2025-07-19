'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUsers } from '@/hooks/useUsers';
import { useProjects } from '@/hooks/useProjects';
import { useFinances } from '@/hooks/useFinances';
import { useMessages } from '@/hooks/useMessages';
import { useContractors } from '@/hooks/useContractors';
import { useSchedule } from '@/hooks/useSchedule';
import { useDocumentsNotifications } from '@/hooks/useDocumentsNotifications';
import { useRequests } from '@/hooks/useRequests';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { 
  Users, 
  FolderOpen, 
  DollarSign, 
  MessageCircle,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  BarChart3,
  FileText,
  Bell,
  Activity,
  UserPlus,
  Plus,
  UserCheck,
  Calendar,
  Clock,
  AlertTriangle,
  Eye,
  Building2,
  CreditCard,
  Wrench,
  Truck,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  loading?: boolean;
  onClick?: () => void;
  badge?: number;
}

function MetricCard({ title, value, subtitle, icon: Icon, trend, color = 'blue', loading, onClick, badge }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
  };

  const CardContent = (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <div className={cn("p-2 rounded-lg", colorClasses[color])}>
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          {badge && badge > 0 && (
            <Badge variant="destructive" className="bg-red-500 text-white text-xs px-2 py-1">
              {badge}
            </Badge>
          )}
        </div>
        
        <div className="mt-2">
          {loading ? (
            <div className="flex items-center space-x-2">
              <LoadingSpinner />
              <span className="text-gray-400">Loading...</span>
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </>
          )}
        </div>
      </div>
      
      {trend && !loading && (
        <div className={cn(
          "flex items-center space-x-1 text-sm",
          trend.isPositive ? "text-green-600" : "text-red-600"
        )}>
          <TrendingUp className={cn("w-4 h-4", trend.isPositive ? "" : "rotate-180")} />
          <span>{trend.value}%</span>
          <span className="text-gray-500">{trend.label}</span>
        </div>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="bg-white rounded-lg border border-gray-200 p-6 hover:border-orange-300 hover:shadow-md transition-all duration-200 text-left w-full group"
      >
        {CardContent}
        <div className="flex items-center justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight className="w-4 h-4 text-orange-600" />
        </div>
      </button>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {CardContent}
    </div>
  );
}

export default function DashboardOverview() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'contractors' | 'schedule' | 'documents' | 'requests' | 'notifications'>('overview');
  
  // Data hooks
  const { users, loading: usersLoading, error: usersError, stats: userStats } = useUsers();
  const { projects, loading: projectsLoading, error: projectsError, summary: projectSummary } = useProjects();
  const { financialData, isLoading: financesLoading, error: financesError } = useFinances();
  const { loading: messagesLoading, error: messagesError, stats: messageStats } = useMessages();
  
  // New notification-enabled hooks
  const { stats: contractorStats, notifications: contractorNotifications, loading: contractorsLoading } = useContractors();
  const { stats: scheduleStats, notifications: scheduleNotifications, loading: scheduleLoading } = useSchedule();
  const { stats: documentStats, notifications: documentNotifications, loading: documentsLoading } = useDocumentsNotifications();
  const { stats: requestStats, notifications: requestNotifications, loading: requestsLoading } = useRequests({ includeStats: true, limit: 10 });

  // Aggregate all notifications
  const allNotifications = [
    ...contractorNotifications,
    ...scheduleNotifications,
    ...documentNotifications,
    ...requestNotifications,
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const unreadNotificationsCount = allNotifications.filter(n => !n.is_read).length;

  // Extract financial stats from financialData
  const financeStats = financialData?.overview ? {
    totalRevenue: financialData.overview.totalPayments || 0,
    monthlyRevenue: financialData.overview.totalPayments * 0.1 || 0,
    pendingApprovals: financialData.overview.pendingApprovalsCount || 0,
    overduePayments: financialData.overview.overduePaymentsCount || 0
  } : {
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingApprovals: 0,
    overduePayments: 0
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'contractors', label: 'Contractors', icon: UserCheck, badge: contractorStats.unreadNotifications },
    { id: 'schedule', label: 'Schedule', icon: Calendar, badge: scheduleStats.unreadNotifications },
    { id: 'documents', label: 'Documents', icon: FileText, badge: documentStats.unreadNotifications },
    { id: 'requests', label: 'Requests', icon: MessageSquare, badge: requestNotifications.filter(n => !n.is_read).length },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotificationsCount },
  ];

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_assignment':
      case 'pending_approval':
        return UserCheck;
      case 'overdue_task':
      case 'upcoming_deadline':
        return Clock;
      case 'document_uploaded':
      case 'version_updated':
        return FileText;
      case 'approval_overdue':
      case 'document_expired':
        return AlertTriangle;
      case 'new_request':
      case 'request_updated':
      case 'request_status_changed':
        return MessageSquare;
      default:
        return Bell;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Construction Project Management Overview</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            System Online
          </Badge>
          {unreadNotificationsCount > 0 && (
            <Badge variant="destructive" className="bg-red-500 text-white">
              {unreadNotificationsCount} Notifications
            </Badge>
          )}
          <span className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2',
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 && (
                  <Badge variant="destructive" className="bg-red-500 text-white text-xs px-2 py-1 min-w-5 h-5 flex items-center justify-center">
                    {tab.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Main Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Users"
                value={userStats.totalUsers}
                subtitle={`${userStats.activeUsers} active users`}
                icon={Users}
                color="blue"
                loading={usersLoading}
                onClick={() => router.push('/users')}
                trend={{
                  value: 12,
                  isPositive: true,
                  label: 'this month'
                }}
              />
              
              <MetricCard
                title="Active Projects"
                value={projectSummary.activeProjects}
                subtitle={`${projectSummary.totalProjects} total projects`}
                icon={FolderOpen}
                color="green"
                loading={projectsLoading}
                onClick={() => router.push('/projects')}
                trend={{
                  value: 8,
                  isPositive: true,
                  label: 'this month'
                }}
              />
              
              <MetricCard
                title="Total Revenue"
                value={formatCurrency(financeStats.totalRevenue)}
                subtitle={`${formatCurrency(financeStats.monthlyRevenue)} this month`}
                icon={DollarSign}
                color="orange"
                loading={financesLoading}
                onClick={() => router.push('/finances')}
                trend={{
                  value: 15,
                  isPositive: true,
                  label: 'this month'
                }}
              />
              
              <MetricCard
                title="Messages"
                value={messageStats.unreadMessages}
                subtitle={`${messageStats.totalConversations} conversations`}
                icon={MessageCircle}
                color="purple"
                loading={messagesLoading}
                onClick={() => router.push('/communications')}
              />
            </div>

            {/* System Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Requests"
                value={requestStats?.pending || 0}
                subtitle={`${requestStats?.total || 0} total requests`}
                icon={MessageSquare}
                color="orange"
                loading={requestsLoading}
                onClick={() => router.push('/requests')}
                badge={requestNotifications.filter(n => !n.is_read).length}
              />
              
              <MetricCard
                title="Contractors"
                value={contractorStats.activeContractors}
                subtitle={`${contractorStats.pendingApproval} pending approval`}
                icon={UserCheck}
                color="blue"
                loading={contractorsLoading}
                onClick={() => setActiveTab('contractors')}
                badge={contractorStats.unreadNotifications}
              />
              
              <MetricCard
                title="Schedule"
                value={scheduleStats.overdueTasks}
                subtitle={`${scheduleStats.upcomingDeadlines} upcoming deadlines`}
                icon={Calendar}
                color="purple"
                loading={scheduleLoading}
                onClick={() => setActiveTab('schedule')}
                badge={scheduleStats.unreadNotifications}
              />
              
              <MetricCard
                title="Documents"
                value={documentStats.pendingApproval}
                subtitle={`${documentStats.recentUploads} recent uploads`}
                icon={FileText}
                color="green"
                loading={documentsLoading}
                onClick={() => setActiveTab('documents')}
                badge={documentStats.unreadNotifications}
              />
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2 text-orange-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/users')}
                    className="flex items-center justify-start space-x-3 p-4 h-auto"
                  >
                    <UserPlus className="w-5 h-5 text-blue-600" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Add User</div>
                      <div className="text-xs text-gray-500">Add new client or contractor</div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/projects')}
                    className="flex items-center justify-start space-x-3 p-4 h-auto"
                  >
                    <Building2 className="w-5 h-5 text-green-600" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Create Project</div>
                      <div className="text-xs text-gray-500">Start new construction project</div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/communications')}
                    className="flex items-center justify-start space-x-3 p-4 h-auto"
                  >
                    <MessageCircle className="w-5 h-5 text-purple-600" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Send Announcement</div>
                      <div className="text-xs text-gray-500">Broadcast to all users</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'contractors' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Contractors Overview</h2>
              <Button onClick={() => router.push('/contractors')}>
                View All Contractors
              </Button>
            </div>

            {/* Contractor Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Contractors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{contractorStats.totalContractors}</div>
                  <p className="text-sm text-gray-600">{contractorStats.activeContractors} active</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Pending Approval</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{contractorStats.pendingApproval}</div>
                  <p className="text-sm text-gray-600">Requires review</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">New Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{contractorStats.newAssignments}</div>
                  <p className="text-sm text-gray-600">This week</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Documents Required</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{contractorStats.documentsRequired}</div>
                  <p className="text-sm text-gray-600">Missing documents</p>
                </CardContent>
              </Card>
            </div>

            {/* Contractor Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Contractor Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contractorNotifications.slice(0, 5).map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    return (
                      <div key={notification.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <Icon className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          <p className="text-sm text-gray-600">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notification.contractor_name} • {formatTimeAgo(notification.created_at)}
                          </p>
                        </div>
                        <Badge className={getPriorityColor(notification.priority)}>
                          {notification.priority}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Schedule Overview</h2>
              <Button onClick={() => router.push('/schedule')}>
                View Full Schedule
              </Button>
            </div>

            {/* Schedule Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{scheduleStats.totalTasks}</div>
                  <p className="text-sm text-gray-600">Across all projects</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Overdue Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{scheduleStats.overdueTasks}</div>
                  <p className="text-sm text-gray-600">Require attention</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Upcoming Deadlines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{scheduleStats.upcomingDeadlines}</div>
                  <p className="text-sm text-gray-600">Next 7 days</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Projects at Risk</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{scheduleStats.projectsAtRisk}</div>
                  <p className="text-sm text-gray-600">Behind schedule</p>
                </CardContent>
              </Card>
            </div>

            {/* Schedule Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Schedule Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scheduleNotifications.slice(0, 5).map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    return (
                      <div key={notification.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <Icon className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          <p className="text-sm text-gray-600">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notification.project_name} • {formatTimeAgo(notification.created_at)}
                          </p>
                        </div>
                        <Badge className={getPriorityColor(notification.priority)}>
                          {notification.priority}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Documents Overview</h2>
              <Button onClick={() => router.push('/documents')}>
                View All Documents
              </Button>
            </div>

            {/* Document Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{documentStats.totalDocuments}</div>
                  <p className="text-sm text-gray-600">In system</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Pending Approval</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{documentStats.pendingApproval}</div>
                  <p className="text-sm text-gray-600">Awaiting review</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Recent Uploads</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{documentStats.recentUploads}</div>
                  <p className="text-sm text-gray-600">Last 24 hours</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Expiring Soon</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{documentStats.expiringSoon}</div>
                  <p className="text-sm text-gray-600">Next 30 days</p>
                </CardContent>
              </Card>
            </div>

            {/* Document Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Document Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documentNotifications.slice(0, 5).map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    return (
                      <div key={notification.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <Icon className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          <p className="text-sm text-gray-600">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notification.project_name ? `${notification.project_name} • ` : ''}{formatTimeAgo(notification.created_at)}
                          </p>
                        </div>
                        <Badge className={getPriorityColor(notification.priority)}>
                          {notification.priority}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Requests Overview</h2>
              <Button onClick={() => router.push('/requests')}>
                View All Requests
              </Button>
            </div>

            {/* Request Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{requestStats?.total || 0}</div>
                  <p className="text-sm text-gray-600">In system</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Pending Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{requestStats?.pending || 0}</div>
                  <p className="text-sm text-gray-600">Awaiting review</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">In Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{requestStats?.inProgress || 0}</div>
                  <p className="text-sm text-gray-600">Being processed</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{requestStats?.completed || 0}</div>
                  <p className="text-sm text-gray-600">Successfully resolved</p>
                </CardContent>
              </Card>
            </div>

            {/* Request Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Request Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {requestNotifications.slice(0, 5).map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    return (
                      <div key={notification.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <Icon className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          <p className="text-sm text-gray-600">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notification.project_name ? `${notification.project_name} • ` : ''}{formatTimeAgo(notification.created_at)}
                          </p>
                        </div>
                        <Badge className={getPriorityColor(notification.priority)}>
                          {notification.priority}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Notification Center</h2>
              <div className="flex space-x-2">
                <Badge variant="secondary">
                  {allNotifications.length} Total
                </Badge>
                <Badge variant="destructive">
                  {unreadNotificationsCount} Unread
                </Badge>
              </div>
            </div>

            {/* Notification Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Contractors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-blue-600">{contractorNotifications.length}</div>
                  <p className="text-sm text-gray-600">{contractorStats.unreadNotifications} unread</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-orange-600">{scheduleNotifications.length}</div>
                  <p className="text-sm text-gray-600">{scheduleStats.unreadNotifications} unread</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-purple-600">{documentNotifications.length}</div>
                  <p className="text-sm text-gray-600">{documentStats.unreadNotifications} unread</p>
                </CardContent>
              </Card>
            </div>

            {/* All Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>All Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allNotifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    return (
                      <div 
                        key={notification.id} 
                        className={cn(
                          'flex items-center space-x-3 p-4 rounded-lg border',
                          notification.is_read ? 'bg-white border-gray-200' : 'bg-orange-50 border-orange-200'
                        )}
                      >
                        <div className="flex-shrink-0">
                          <Icon className={cn(
                            'h-5 w-5',
                            notification.is_read ? 'text-gray-500' : 'text-orange-600'
                          )} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className={cn(
                              'text-sm font-medium',
                              notification.is_read ? 'text-gray-900' : 'text-orange-900'
                            )}>
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{notification.message}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-xs text-gray-500">
                              {'contractor_name' in notification ? notification.contractor_name :
                               'project_name' in notification ? notification.project_name :
                               'document_name' in notification ? notification.document_name : ''}
                            </p>
                            <span className="text-xs text-gray-400">•</span>
                            <p className="text-xs text-gray-500">{formatTimeAgo(notification.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(notification.priority)}>
                            {notification.priority}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {allNotifications.length === 0 && (
                    <div className="text-center py-8">
                      <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No notifications at this time</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

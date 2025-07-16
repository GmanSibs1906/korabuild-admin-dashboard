'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useUsers } from '@/hooks/useUsers';
import { useProjects } from '@/hooks/useProjects';
import { useFinances } from '@/hooks/useFinances';
import { useMessages } from '@/hooks/useMessages';
import { useDocuments } from '@/hooks/useDocuments';
import { useDeliveries } from '@/hooks/useDeliveries';
import { useActivity, ActivityItem } from '@/hooks/useActivity';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

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
  Truck,
  Bell,
  Activity,
  UserPlus,
  Plus
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
}

function MetricCard({ title, value, subtitle, icon: Icon, trend, color = 'blue', loading, onClick }: MetricCardProps) {
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
  const { users, loading: usersLoading, error: usersError, stats: userStats } = useUsers();
  const { projects, loading: projectsLoading, error: projectsError, summary: projectSummary } = useProjects();
  const { financialData, isLoading: financesLoading, error: financesError } = useFinances();
  const { loading: messagesLoading, error: messagesError, stats: messageStats } = useMessages();
  const { documents, stats: documentStats, loading: documentsLoading } = useDocuments({
    autoRefetch: false, // Disable auto-refresh for dashboard overview
    limit: 5 // Only need 5 recent documents for dashboard
  });
  const { stats: deliveryStats, loading: deliveriesLoading } = useDeliveries();
  const { activities, loading: activityLoading } = useActivity();

  // Extract financial stats from financialData
  const financeStats = financialData?.overview ? {
    totalRevenue: financialData.overview.totalPayments || 0,
    monthlyRevenue: financialData.overview.totalPayments * 0.1 || 0,
    totalBudget: financialData.overview.totalBudget || 0,
    totalActual: financialData.overview.totalActual || 0,
    financialHealthScore: financialData.overview.financialHealthScore || 0,
    financialHealthStatus: financialData.overview.financialHealthStatus || 'unknown',
    pendingApprovals: financialData.overview.pendingApprovalsCount || 0,
    overduePayments: financialData.overview.overduePaymentsCount || 0
  } : {
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalBudget: 0,
    totalActual: 0,
    financialHealthScore: 0,
    financialHealthStatus: 'unknown',
    pendingApprovals: 0,
    overduePayments: 0
  };

  // Debug logging to help diagnose issues
  console.log('Dashboard Data Status:', {
    users: { count: users?.length, loading: usersLoading, error: usersError, stats: userStats },
    projects: { count: projects?.length, loading: projectsLoading, error: projectsError, summary: projectSummary },
    finances: { loading: financesLoading, error: financesError, stats: financeStats, rawData: financialData },
    messages: { loading: messagesLoading, error: messagesError, stats: messageStats },
    documents: { loading: documentsLoading, stats: documentStats },
    deliveries: { loading: deliveriesLoading, stats: deliveryStats }
  });

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome to the KoraBuild Admin Dashboard</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            System Online
          </Badge>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Activity className="h-3 w-3 mr-1" />
            Real-time Data
          </Badge>
          <span className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
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
          value={`R${financeStats.totalRevenue.toLocaleString()}`}
          subtitle={`R${financeStats.monthlyRevenue.toLocaleString()} this month`}
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

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="New Documents"
          value={documentStats.newDocuments}
          subtitle={`${documentStats.pendingApproval} pending approval`}
          icon={FileText}
          color="blue"
          loading={documentsLoading}
          onClick={() => router.push('/documents')}
        />
        
        <MetricCard
          title="Upcoming Deliveries"
          value={deliveryStats.upcomingDeliveries}
          subtitle={`${deliveryStats.urgentDeliveries} urgent orders`}
          icon={Truck}
          color="orange"
          loading={deliveriesLoading}
          onClick={() => router.push('/deliveries')}
        />
        
        <MetricCard
          title="Pending Approvals"
          value={financeStats.pendingApprovals}
          subtitle={`${financeStats.overduePayments} overdue payments`}
          icon={AlertCircle}
          color="red"
          loading={financesLoading}
          onClick={() => router.push('/finances')}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Plus className="h-5 w-5 mr-2 text-orange-600" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button 
            onClick={() => router.push('/users')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
            <UserPlus className="w-5 h-5 text-blue-600" />
            <div className="text-left">
              <div className="font-medium text-sm text-gray-900">Add User</div>
              <div className="text-xs text-gray-500">Add new client or contractor</div>
            </div>
          </button>
          
          <button 
            onClick={() => router.push('/users')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
            <Users className="w-5 h-5 text-green-600" />
            <div className="text-left">
              <div className="font-medium text-sm text-gray-900">Add Admin</div>
              <div className="text-xs text-gray-500">Create new admin account</div>
            </div>
          </button>
          
          <button 
            onClick={() => router.push('/projects')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
            <FolderOpen className="w-5 h-5 text-orange-600" />
            <div className="text-left">
              <div className="font-medium text-sm text-gray-900">Create Project</div>
              <div className="text-xs text-gray-500">Start new construction project</div>
            </div>
          </button>
          
          <button 
            onClick={() => router.push('/communications')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
            <Bell className="w-5 h-5 text-purple-600" />
            <div className="text-left">
              <div className="font-medium text-sm text-gray-900">Send Announcement</div>
              <div className="text-xs text-gray-500">Broadcast to all users</div>
            </div>
          </button>
          
          <button 
            onClick={() => router.push('/analytics')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <div className="text-left">
              <div className="font-medium text-sm text-gray-900">View Analytics</div>
              <div className="text-xs text-gray-500">System performance metrics</div>
            </div>
          </button>
          
          <button 
            onClick={() => router.push('/notifications')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
            <Bell className="w-5 h-5 text-red-600" />
            <div className="text-left">
              <div className="font-medium text-sm text-gray-900">Notifications</div>
              <div className="text-xs text-gray-500">Manage system alerts</div>
            </div>
          </button>
        </div>
      </div>

      {/* Additional Information Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Clients</span>
              <span className="text-sm font-medium text-gray-900">{userStats.clientUsers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Contractors</span>
              <span className="text-sm font-medium text-gray-900">{userStats.contractorUsers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Admins</span>
              <span className="text-sm font-medium text-gray-900">{userStats.adminUsers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">New This Month</span>
              <span className="text-sm font-medium text-gray-900">{userStats.newUsersThisMonth}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {activityLoading ? (
              <div className="flex items-center space-x-2">
                <LoadingSpinner />
                <span className="text-gray-400">Loading activity...</span>
              </div>
            ) : activities.length > 0 ? (
              activities.slice(0, 5).map((activity: ActivityItem, index: number) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Activity className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.timestamp}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No recent activity</p>
            )}
          </div>
        </div>

        {/* Recent Documents */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Documents</h3>
            <button
              onClick={() => router.push('/documents')}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="space-y-3">
            {documentsLoading ? (
              <div className="flex items-center space-x-2">
                <LoadingSpinner />
                <span className="text-gray-400">Loading documents...</span>
              </div>
            ) : documents && documents.length > 0 ? (
              documents
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5)
                .map((document) => (
                <div key={document.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <FileText className="w-4 h-4 text-orange-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate font-medium">
                      {document.document_name}
                    </p>
                    <div className="flex items-center space-x-2">
                      <p className="text-xs text-gray-500">
                        {document.category}
                      </p>
                      <span className="text-xs text-gray-400">•</span>
                      <p className="text-xs text-gray-500">
                        {new Date(document.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Badge 
                      className={cn(
                        'text-xs',
                        document.approval_status === 'approved' && 'bg-green-100 text-green-800',
                        document.approval_status === 'pending' && 'bg-yellow-100 text-yellow-800',
                        document.approval_status === 'rejected' && 'bg-red-100 text-red-800'
                      )}
                    >
                      {document.approval_status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No recent documents</p>
            )}
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">99.9%</div>
            <div className="text-sm text-gray-500">Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">245ms</div>
            <div className="text-sm text-gray-500">Response Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {financeStats.financialHealthScore}%
            </div>
            <div className="text-sm text-gray-500">Financial Health</div>
          </div>
        </div>
      </div>
    </div>
  );
}

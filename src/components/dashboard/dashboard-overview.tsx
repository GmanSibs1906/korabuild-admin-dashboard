'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUsers } from '@/hooks/useUsers';
import { useProjects } from '@/hooks/useProjects';
import { useFinances } from '@/hooks/useFinances';
import { useMessages } from '@/hooks/useMessages';
import { useContractors } from '@/hooks/useContractors';
import { useSchedule } from '@/hooks/useSchedule';
import { useDocumentsNotifications } from '@/hooks/useDocumentsNotifications';
import { useRequests } from '@/hooks/useRequests';
import { useRequestNotifications } from '@/hooks/useRequestNotifications';
import { RequestNotificationPanel } from '@/components/notifications/RequestNotificationPanel';
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
  MessageSquare,
  Shield,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import AdminControlCenter from '@/components/dashboard/AdminControlCenter';

interface CleanMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'slate';
  loading?: boolean;
  onClick?: () => void;
  badge?: number;
}

function CleanMetricCard({ title, value, subtitle, icon: Icon, trend, color = 'blue', loading, onClick, badge }: CleanMetricCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    orange: 'text-orange-600 bg-orange-50',
    purple: 'text-purple-600 bg-purple-50',
    red: 'text-red-600 bg-red-50',
    slate: 'text-slate-600 bg-slate-50',
  };

  const CardWrapper = onClick ? 'button' : 'div';

  return (
    <CardWrapper
      onClick={onClick}
      className={cn(
        "relative group bg-white rounded-xl border border-slate-200 p-6 transition-all duration-200",
        onClick && "hover:border-slate-300 hover:shadow-lg cursor-pointer"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-4">
            <div className={cn("p-2.5 rounded-lg", colorClasses[color])}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-600">{title}</h3>
              {badge !== undefined && badge > 0 && (
                <Badge variant="destructive" className="mt-1 h-5 text-xs">
                  {badge}
                </Badge>
              )}
            </div>
          </div>
          
          {loading ? (
            <div className="flex items-center space-x-2">
              <LoadingSpinner />
              <span className="text-slate-400 text-sm">Loading...</span>
            </div>
          ) : (
            <div>
              <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
              {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
            </div>
          )}
        </div>
        
        {trend && !loading && (
          <div className={cn(
            "flex items-center space-x-1 text-sm px-2 py-1 rounded-md",
            trend.isPositive ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"
          )}>
            <TrendingUp className={cn("w-3 h-3", trend.isPositive ? "" : "rotate-180")} />
            <span className="font-medium">{trend.value}%</span>
          </div>
        )}
      </div>
      
      {onClick && (
        <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity absolute top-6 right-6" />
      )}
    </CardWrapper>
  );
}

export default function DashboardOverview() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'control-center' | 'contractors' | 'schedule' | 'documents' | 'requests' | 'notifications'>('control-center'); // Changed default to control-center
  
  // Stabilize hook options to prevent infinite re-renders
  const requestsOptions = useMemo(() => ({ 
    includeStats: true, 
    limit: 10 
  }), []);
  
  const requestNotificationsOptions = useMemo(() => ({
    includeRead: false,
    limit: 20
  }), []);

  // Real-time admin notification system
  const { 
    stats: adminNotificationStats, 
    loading: adminNotificationsLoading 
  } = useAdminNotifications({ includeRead: false });

  // Data hooks
  const { users, loading: usersLoading, error: usersError, stats: userStats } = useUsers();
  const { projects, loading: projectsLoading, error: projectsError, summary: projectSummary } = useProjects();
  const { financialData, isLoading: financesLoading, error: financesError } = useFinances();
  const { loading: messagesLoading, error: messagesError, stats: messageStats } = useMessages();
  
  // New notification-enabled hooks
  const { stats: contractorStats, notifications: contractorNotifications, loading: contractorsLoading } = useContractors();
  const { stats: scheduleStats, notifications: scheduleNotifications, loading: scheduleLoading } = useSchedule();
  const { stats: documentStats, notifications: documentNotifications, loading: documentsLoading } = useDocumentsNotifications();
  
  // Enhanced request data and notifications with stabilized options
  const { stats: requestStats, loading: requestsLoading, error: requestsError } = useRequests(requestsOptions);
  
  const { 
    notifications: requestNotifications, 
    unreadCount: requestUnreadCount,
    loading: requestNotificationsLoading 
  } = useRequestNotifications(requestNotificationsOptions);

  // Extract financial stats from financialData - ALL DYNAMIC FROM DATABASE
  const financeStats = financialData?.overview ? {
    totalRevenue: financialData.overview.totalPayments || 0,
    monthlyRevenue: financialData.overview.monthlyPayments || 0,
    pendingApprovals: financialData.overview.pendingApprovalsCount || 0,
    overduePayments: financialData.overview.overduePaymentsCount || 0
  } : {
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingApprovals: 0,
    overduePayments: 0
  };

  const tabs = [
    { id: 'control-center', label: 'Control Center', icon: Shield, badge: adminNotificationStats.total_unread },
    { id: 'overview', label: 'Overview', icon: BarChart3 },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Clean Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-600 mt-1">Construction project management overview</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1.5" />
                System Online
              </Badge>
              {adminNotificationStats.total_unread > 0 && (
                <Badge variant="destructive" className="bg-red-500 text-white">
                  <Bell className="h-3 w-3 mr-1.5" />
                  {adminNotificationStats.total_unread} Alerts
                </Badge>
              )}
              <span className="text-sm text-slate-500">
                Updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Clean Tab Navigation */}
          <div className="mt-6">
            <nav className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      'flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                      activeTab === tab.id
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    {tab.badge && tab.badge > 0 && (
                      <Badge variant="destructive" className="bg-red-500 text-white text-xs h-5 min-w-5 flex items-center justify-center">
                        {tab.badge}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-8 py-8">
        {activeTab === 'control-center' && (
          <AdminControlCenter />
        )}

        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Key Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <CleanMetricCard
                  title="Total Users"
                  value={userStats.totalUsers}
                  subtitle={`${userStats.activeUsers} active`}
                  icon={Users}
                  color="blue"
                  loading={usersLoading}
                  onClick={() => router.push('/users')}
                />
                
                <CleanMetricCard
                  title="Active Projects"
                  value={projectSummary.activeProjects}
                  subtitle={`${projectSummary.totalProjects} total`}
                  icon={FolderOpen}
                  color="green"
                  loading={projectsLoading}
                  onClick={() => router.push('/projects')}
                />
                
                <CleanMetricCard
                  title="Total Revenue"
                  value={formatCurrency(financeStats.totalRevenue)}
                  subtitle={`${formatCurrency(financeStats.monthlyRevenue)} this month`}
                  icon={DollarSign}
                  color="orange"
                  loading={financesLoading}
                  onClick={() => router.push('/finances')}
                />
                
                <CleanMetricCard
                  title="Unread Messages"
                  value={messageStats.unreadMessages}
                  subtitle={`${messageStats.totalConversations} conversations`}
                  icon={MessageCircle}
                  color="purple"
                  loading={messagesLoading}
                  onClick={() => router.push('/communications')}
                />
              </div>
            </div>

            {/* Activity Overview */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Activity Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <CleanMetricCard
                  title="Pending Requests"
                  value={requestStats?.pending || 0}
                  subtitle={`${requestStats?.total || 0} total`}
                  icon={MessageSquare}
                  color="orange"
                  loading={requestsLoading}
                  onClick={() => router.push('/requests')}
                  badge={requestNotifications.filter(n => !n.is_read).length}
                />
                
                <CleanMetricCard
                  title="Contractors"
                  value={contractorStats.activeContractors}
                  subtitle={`${contractorStats.pendingApproval} pending approval`}
                  icon={UserCheck}
                  color="blue"
                  loading={contractorsLoading}
                  onClick={() => setActiveTab('contractors')}
                  badge={contractorStats.unreadNotifications}
                />
                
                <CleanMetricCard
                  title="Upcoming Deadlines"
                  value={scheduleStats.upcomingDeadlines || 0}
                  subtitle={`${scheduleStats.totalTasks || 0} total tasks`}
                  icon={Calendar}
                  color="purple"
                  loading={scheduleLoading}
                  onClick={() => setActiveTab('schedule')}
                  badge={scheduleStats.unreadNotifications}
                />
                
                <CleanMetricCard
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
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={() => router.push('/users')}
                  className="group bg-white rounded-xl border border-slate-200 p-6 text-left hover:border-slate-300 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                      <UserPlus className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">Add User</h3>
                      <p className="text-sm text-slate-600">Add new client or contractor</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  </div>
                </button>
                
                <button 
                  onClick={() => router.push('/projects')}
                  className="group bg-white rounded-xl border border-slate-200 p-6 text-left hover:border-slate-300 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">Create Project</h3>
                      <p className="text-sm text-slate-600">Start new construction project</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  </div>
                </button>
                
                <button 
                  onClick={() => router.push('/communications')}
                  className="group bg-white rounded-xl border border-slate-200 p-6 text-left hover:border-slate-300 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">Send Announcement</h3>
                      <p className="text-sm text-slate-600">Broadcast to all users</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

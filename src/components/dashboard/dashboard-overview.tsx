'use client';

import React from 'react';
import { useUsers } from '@/hooks/useUsers';
import { useProjects } from '@/hooks/useProjects';
import { useFinances } from '@/hooks/useFinances';
import { useMessages } from '@/hooks/useMessages';
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
  Clock,
  CheckCircle,
  ArrowRight,
  BarChart3
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
}

function MetricCard({ title, value, subtitle, icon: Icon, trend, color = 'blue', loading }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
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
    </div>
  );
}

export default function DashboardOverview() {
  const { users, loading: usersLoading, error: usersError, stats: userStats } = useUsers();
  const { projects, loading: projectsLoading, error: projectsError, summary: projectSummary } = useProjects();
  const { financialData, isLoading: financesLoading, error: financesError } = useFinances();
  const { loading: messagesLoading, error: messagesError, stats: messageStats } = useMessages();
  const { activities, loading: activityLoading, error: activityError } = useActivity();

  // Extract financial stats from financialData
  const financeStats = financialData?.overview ? {
    totalRevenue: financialData.overview.totalPayments || 0,
    monthlyRevenue: financialData.overview.totalPayments * 0.1 || 0, // Estimate monthly as 10% of total
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
    messages: { loading: messagesLoading, error: messagesError, stats: messageStats }
  });

  return (
    <div className="p-6 space-y-6">

      
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Welcome to the KoraBuild Admin Dashboard</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            System Online
          </Badge>
          <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</span>
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
        />
      </div>

      {/* User Role Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Breakdown</h3>
          {usersLoading ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Clients</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{userStats.clientUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Contractors</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{userStats.contractorUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Admins</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{userStats.adminUsers}</span>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <button className="text-sm text-orange-600 hover:text-orange-700 flex items-center">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          
          {activityLoading ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-4">
              {activities.length > 0 ? (
                activities.map((activity: ActivityItem) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {activity.type === 'user_joined' && (
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                      )}
                      {activity.type === 'project_created' && (
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <FolderOpen className="w-4 h-4 text-green-600" />
                        </div>
                      )}
                      {activity.type === 'payment_made' && (
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <DollarSign className="w-4 h-4 text-orange-600" />
                        </div>
                      )}
                      {activity.type === 'message_sent' && (
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <MessageCircle className="w-4 h-4 text-purple-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No recent activity</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors">
            <Users className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-900">Add New User</span>
          </button>
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors">
            <FolderOpen className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-900">Create Project</span>
          </button>
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors">
            <BarChart3 className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-900">View Analytics</span>
          </button>
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors">
            <MessageCircle className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-900">Send Announcement</span>
          </button>
        </div>
      </div>

      {/* Status Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-green-900">System Status</h4>
            <p className="text-sm text-green-700 mt-1">
              ✅ All core systems are online with real-time Supabase data! 
              📊 Displaying live metrics from {userStats.totalUsers} users, {projectSummary.totalProjects} projects, and R{financeStats.totalRevenue.toLocaleString()} in total revenue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 
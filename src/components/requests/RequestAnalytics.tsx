'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  MessageSquare,
  Users,
  Building2,
  Calendar,
  Target,
  Activity
} from 'lucide-react';
import { RequestStats } from '@/types/requests';
import { cn } from '@/lib/utils';

interface RequestAnalyticsProps {
  stats?: RequestStats | null;
  loading?: boolean;
}

interface MetricCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  trend?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  badge?: string;
}

function AnalyticsMetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = 'blue', 
  trend,
  badge 
}: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn("p-3 rounded-xl border", colorClasses[color])}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <div className="flex items-center space-x-2">
                <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
                {badge && (
                  <Badge variant="secondary" className="text-xs">
                    {badge}
                  </Badge>
                )}
              </div>
              {subtitle && (
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          
          {trend && (
            <div className={cn(
              "flex items-center space-x-1 text-sm font-medium",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}>
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{trend.value}%</span>
              <span className="text-gray-500 text-xs">{trend.period}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RequestDistributionChart({ stats }: { stats?: RequestStats }) {
  if (!stats) return null;

  const categories = [
    { name: 'Change Order', value: stats.byCategory.change_order, color: 'bg-blue-500' },
    { name: 'Inspection', value: stats.byCategory.inspection, color: 'bg-green-500' },
    { name: 'Consultation', value: stats.byCategory.consultation, color: 'bg-orange-500' },
    { name: 'Maintenance', value: stats.byCategory.maintenance, color: 'bg-purple-500' },
    { name: 'Other', value: stats.byCategory.other, color: 'bg-gray-500' },
  ];

  const maxValue = Math.max(...categories.map(c => c.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-orange-600" />
          Request Distribution by Category
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categories.map((category, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-24 text-sm font-medium text-gray-700">
                {category.name}
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
                <div
                  className={cn(category.color, "h-3 rounded-full transition-all duration-500")}
                  style={{
                    width: `${maxValue > 0 ? (category.value / maxValue) * 100 : 0}%`
                  }}
                />
              </div>
              <div className="w-12 text-sm font-semibold text-gray-900 text-right">
                {category.value}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PriorityDistributionChart({ stats }: { stats?: RequestStats }) {
  if (!stats) return null;

  const priorities = [
    { name: 'Urgent', value: stats.byPriority.urgent, color: 'bg-red-500', textColor: 'text-red-700' },
    { name: 'High', value: stats.byPriority.high, color: 'bg-orange-500', textColor: 'text-orange-700' },
    { name: 'Medium', value: stats.byPriority.medium, color: 'bg-yellow-500', textColor: 'text-yellow-700' },
    { name: 'Low', value: stats.byPriority.low, color: 'bg-green-500', textColor: 'text-green-700' },
  ];

  const total = priorities.reduce((sum, p) => sum + p.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Target className="h-5 w-5 mr-2 text-orange-600" />
          Priority Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {priorities.map((priority, index) => {
            const percentage = total > 0 ? Math.round((priority.value / total) * 100) : 0;
            return (
              <div key={index} className="text-center">
                <div className="relative">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gray-200 flex items-center justify-center">
                    <div 
                      className={cn(priority.color, "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold")}
                    >
                      {priority.value}
                    </div>
                  </div>
                  <div className="absolute -top-1 -right-1">
                    <Badge variant="secondary" className="text-xs">
                      {percentage}%
                    </Badge>
                  </div>
                </div>
                <p className={cn("text-sm font-medium mt-2", priority.textColor)}>
                  {priority.name}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function RequestAnalytics({ stats, loading }: RequestAnalyticsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
          <p className="text-gray-600">Request analytics will appear once data is available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsMetricCard
          title="Total Requests"
          value={stats.total}
          // subtitle="All time"
          icon={MessageSquare}
          color="blue"
          // trend={{ value: 12, isPositive: true, period: "this month" }}
        />
        
        <AnalyticsMetricCard
          title="Pending Review"
          value={stats.pending}
          // subtitle="Requires attention"
          icon={Clock}
          color="orange"
          // badge="Priority"
        />
        
        <AnalyticsMetricCard
          title="In Progress"
          value={stats.inProgress}
          // subtitle="Being processed"
          icon={Activity}
          color="purple"
          // trend={{ value: 8, isPositive: true, period: "this week" }}
        />
        
        <AnalyticsMetricCard
          title="Completed"
          value={stats.completed}
          // subtitle="Successfully resolved"
          icon={CheckCircle}
          color="green"
          // trend={{ value: 15, isPositive: true, period: "this month" }}
        />
      </div>

      {/* Performance Metrics */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsMetricCard
          title="Avg Response Time"
          value={4.2}
          subtitle="hours"
          icon={Clock}
          color="blue"
          trend={{ value: 10, isPositive: false, period: "vs last month" }}
        />
        
        <AnalyticsMetricCard
          title="Resolution Rate"
          value={92}
          subtitle="% completed"
          icon={Target}
          color="green"
          trend={{ value: 5, isPositive: true, period: "this month" }}
        />
        
        <AnalyticsMetricCard
          title="Client Satisfaction"
          value={4.8}
          subtitle="out of 5.0"
          icon={Users}
          color="orange"
          trend={{ value: 3, isPositive: true, period: "this quarter" }}
        />
        
        <AnalyticsMetricCard
          title="Projects with Requests"
          value={8}
          subtitle="active projects"
          icon={Building2}
          color="purple"
        />
      </div> */}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RequestDistributionChart stats={stats} />
        <PriorityDistributionChart stats={stats} />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-orange-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="flex items-center justify-start space-x-3 p-4 h-auto">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div className="text-left">
                <div className="font-medium text-sm">Bulk Update Status</div>
                <div className="text-xs text-gray-500">Update multiple requests</div>
              </div>
            </Button>
            
            <Button variant="outline" className="flex items-center justify-start space-x-3 p-4 h-auto">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <div className="text-left">
                <div className="font-medium text-sm">Generate Report</div>
                <div className="text-xs text-gray-500">Export analytics data</div>
              </div>
            </Button>
            
            <Button variant="outline" className="flex items-center justify-start space-x-3 p-4 h-auto">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <div className="text-left">
                <div className="font-medium text-sm">View Overdue</div>
                <div className="text-xs text-gray-500">Check pending requests</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
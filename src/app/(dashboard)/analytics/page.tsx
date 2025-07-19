'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar, 
  Target,
  Activity,
  PieChart,
  LineChart,
  MapPin
} from 'lucide-react';

export default function AnalyticsPage() {
  const kpis = [
    {
      title: 'Total Projects',
      value: '47',
      change: '+12%',
      trend: 'up',
      icon: Target,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      title: 'Active Users',
      value: '1,234',
      change: '+8%',
      trend: 'up',
      icon: Users,
      color: 'text-green-600 bg-green-50'
    },
    {
      title: 'Total Revenue',
      value: '$8.4M',
      change: '+15%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-orange-600 bg-orange-50'
    },
    {
      title: 'Project Completion Rate',
      value: '94%',
      change: '+3%',
      trend: 'up',
      icon: Activity,
      color: 'text-purple-600 bg-purple-50'
    }
  ];

  const chartSections = [
    {
      title: 'Project Performance',
      description: 'Track project progress and completion rates',
      icon: BarChart3,
      color: 'border-blue-200'
    },
    {
      title: 'Financial Analytics',
      description: 'Revenue trends and budget analysis',
      icon: LineChart,
      color: 'border-green-200'
    },
    {
      title: 'User Engagement',
      description: 'User activity and platform usage',
      icon: PieChart,
      color: 'border-orange-200'
    },
    {
      title: 'Geographic Distribution',
      description: 'Project locations and regional analysis',
      icon: MapPin,
      color: 'border-purple-200'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reporting</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive analytics and insights for construction project management
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="secondary" className="px-3 py-1">
            Real-time Data
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm font-medium text-green-600">{kpi.change}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${kpi.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {chartSections.map((section, index) => {
          const Icon = section.icon;
          return (
            <Card key={index} className={`border-2 ${section.color} hover:shadow-md transition-shadow`}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <Icon className="h-5 w-5 text-orange-500" />
                  <span>{section.title}</span>
                </CardTitle>
                <p className="text-sm text-gray-600">{section.description}</p>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Chart Implementation</p>
                    <p className="text-sm text-gray-400">Advanced analytics coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Reports Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            <span>Scheduled Reports</span>
          </CardTitle>
          <p className="text-sm text-gray-600">Automated reports and data exports</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'Weekly Project Status Report', schedule: 'Every Monday at 9:00 AM', status: 'Active' },
              { name: 'Monthly Financial Summary', schedule: 'First day of month', status: 'Active' },
              { name: 'Quarterly Performance Review', schedule: 'Every 3 months', status: 'Active' },
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{report.name}</h4>
                  <p className="text-sm text-gray-600">{report.schedule}</p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  {report.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
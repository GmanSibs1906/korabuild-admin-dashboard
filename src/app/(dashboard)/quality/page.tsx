'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Star,
  FileText,
  Camera,
  Calendar,
  User,
  MapPin,
  TrendingUp,
  Search,
  Filter,
  Plus
} from 'lucide-react';

export default function QualityPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'inspections' | 'reports' | 'standards'>('overview');

  const qualityMetrics = [
    {
      title: 'Quality Score',
      value: '94%',
      change: '+2%',
      trend: 'up',
      icon: Star,
      color: 'text-green-600 bg-green-50'
    },
    {
      title: 'Pending Inspections',
      value: '12',
      change: '-3',
      trend: 'down',
      icon: Clock,
      color: 'text-orange-600 bg-orange-50'
    },
    {
      title: 'Issues Found',
      value: '8',
      change: '+2',
      trend: 'up',
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-50'
    },
    {
      title: 'Completed Inspections',
      value: '156',
      change: '+12',
      trend: 'up',
      icon: CheckCircle,
      color: 'text-blue-600 bg-blue-50'
    }
  ];

  const recentInspections = [
    {
      id: 'QI-001',
      project: 'Sandton Office Complex',
      inspector: 'John Smith',
      type: 'Foundation',
      status: 'completed',
      score: 95,
      date: '2024-01-15',
      issues: 0
    },
    {
      id: 'QI-002',
      project: 'Rosebank Apartments',
      inspector: 'Sarah Johnson',
      type: 'Electrical',
      status: 'pending',
      score: null,
      date: '2024-01-16',
      issues: null
    },
    {
      id: 'QI-003',
      project: 'Cape Town Mall',
      inspector: 'Mike Wilson',
      type: 'Plumbing',
      status: 'in_progress',
      score: null,
      date: '2024-01-14',
      issues: 2
    }
  ];

  const qualityStandards = [
    {
      category: 'Structural',
      standards: ['Foundation Quality', 'Concrete Strength', 'Steel Framework'],
      compliance: 98
    },
    {
      category: 'Electrical',
      standards: ['Wiring Standards', 'Safety Compliance', 'Load Testing'],
      compliance: 94
    },
    {
      category: 'Plumbing',
      standards: ['Pipe Installation', 'Water Pressure', 'Leak Testing'],
      compliance: 96
    },
    {
      category: 'Finishing',
      standards: ['Paint Quality', 'Tile Work', 'Surface Finish'],
      compliance: 92
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Quality Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {qualityMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm font-medium text-green-600">{metric.change}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${metric.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Inspections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-orange-500" />
            <span>Recent Quality Inspections</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentInspections.map((inspection) => (
              <div key={inspection.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h4 className="font-medium text-gray-900">{inspection.id}</h4>
                      <p className="text-sm text-gray-600">{inspection.project}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{inspection.type} Inspection</p>
                      <p className="text-sm text-gray-600">by {inspection.inspector}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{inspection.date}</p>
                      {inspection.score && (
                        <p className="text-sm font-medium text-green-600">Score: {inspection.score}%</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusBadge(inspection.status)}
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderInspections = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Quality Inspections</h2>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            Schedule Inspection
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <ShieldCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Inspection Management</h3>
            <p className="text-gray-600 mb-4">Schedule, track, and manage quality inspections across all projects</p>
            <Button className="bg-orange-500 hover:bg-orange-600">
              Get Started
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStandards = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Quality Standards</h2>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Standard
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {qualityStandards.map((standard, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{standard.category}</span>
                <Badge className={`${standard.compliance >= 95 ? 'bg-green-100 text-green-800' : 
                  standard.compliance >= 90 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                  {standard.compliance}% Compliance
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {standard.standards.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'inspections', label: 'Inspections', icon: ShieldCheck },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'standards', label: 'Standards', icon: Star }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quality Assurance</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive quality management and inspection oversight for construction projects
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="secondary" className="px-3 py-1">
            Live Quality Data
          </Badge>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'inspections' && renderInspections()}
        {activeTab === 'standards' && renderStandards()}
        {activeTab === 'reports' && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Quality Reports</h3>
                <p className="text-gray-600 mb-4">Generate and manage quality assurance reports</p>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 
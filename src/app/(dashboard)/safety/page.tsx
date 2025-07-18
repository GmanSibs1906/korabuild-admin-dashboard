'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wrench, 
  AlertTriangle, 
  Shield, 
  Clock, 
  Users,
  FileText,
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
  Plus,
  Filter,
  Search
} from 'lucide-react';

export default function SafetyPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'incidents' | 'training' | 'compliance'>('overview');

  const safetyMetrics = [
    {
      title: 'Safety Score',
      value: '98%',
      change: '+1%',
      trend: 'up',
      icon: Shield,
      color: 'text-green-600 bg-green-50'
    },
    {
      title: 'Active Incidents',
      value: '2',
      change: '-1',
      trend: 'down',
      icon: AlertTriangle,
      color: 'text-orange-600 bg-orange-50'
    },
    {
      title: 'Days Without Incident',
      value: '45',
      change: '+45',
      trend: 'up',
      icon: Calendar,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      title: 'Trained Personnel',
      value: '234',
      change: '+12',
      trend: 'up',
      icon: Users,
      color: 'text-purple-600 bg-purple-50'
    }
  ];

  const recentIncidents = [
    {
      id: 'INC-001',
      project: 'Sandton Office Complex',
      type: 'Minor Injury',
      severity: 'low',
      status: 'resolved',
      date: '2024-01-10',
      reporter: 'John Smith'
    },
    {
      id: 'INC-002',
      project: 'Cape Town Mall',
      type: 'Equipment Damage',
      severity: 'medium',
      status: 'investigating',
      date: '2024-01-12',
      reporter: 'Sarah Wilson'
    },
    {
      id: 'INC-003',
      project: 'Rosebank Apartments',
      type: 'Near Miss',
      severity: 'low',
      status: 'closed',
      date: '2024-01-08',
      reporter: 'Mike Johnson'
    }
  ];

  const safetyTraining = [
    {
      course: 'Basic Safety Orientation',
      participants: 45,
      completion: 98,
      nextSession: '2024-01-20'
    },
    {
      course: 'Advanced Fall Protection',
      participants: 23,
      completion: 87,
      nextSession: '2024-01-25'
    },
    {
      course: 'Equipment Safety Training',
      participants: 34,
      completion: 94,
      nextSession: '2024-01-22'
    }
  ];

  const complianceChecks = [
    {
      category: 'Personal Protective Equipment',
      status: 'compliant',
      lastCheck: '2024-01-15',
      nextCheck: '2024-02-15'
    },
    {
      category: 'Equipment Inspections',
      status: 'pending',
      lastCheck: '2024-01-10',
      nextCheck: '2024-01-17'
    },
    {
      category: 'Safety Documentation',
      status: 'compliant',
      lastCheck: '2024-01-14',
      nextCheck: '2024-02-14'
    }
  ];

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'high':
        return <Badge className="bg-red-100 text-red-800">High</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'closed':
      case 'compliant':
        return <Badge className="bg-green-100 text-green-800">{status}</Badge>;
      case 'investigating':
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">{status}</Badge>;
      case 'open':
        return <Badge className="bg-red-100 text-red-800">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Safety Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {safetyMetrics.map((metric, index) => {
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

      {/* Recent Incidents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <span>Recent Safety Incidents</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentIncidents.map((incident) => (
              <div key={incident.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h4 className="font-medium text-gray-900">{incident.id}</h4>
                      <p className="text-sm text-gray-600">{incident.project}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{incident.type}</p>
                      <p className="text-sm text-gray-600">Reported by {incident.reporter}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{incident.date}</p>
                      {getSeverityBadge(incident.severity)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusBadge(incident.status)}
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-orange-500" />
            <span>Compliance Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {complianceChecks.map((check, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{check.category}</h4>
                  {getStatusBadge(check.status)}
                </div>
                <p className="text-sm text-gray-600">Last check: {check.lastCheck}</p>
                <p className="text-sm text-gray-600">Next check: {check.nextCheck}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderIncidents = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Safety Incidents</h2>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            Report Incident
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Incident Management</h3>
            <p className="text-gray-600 mb-4">Track, investigate, and resolve safety incidents across all projects</p>
            <Button className="bg-orange-500 hover:bg-orange-600">
              Get Started
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTraining = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Safety Training</h2>
        <Button className="bg-orange-500 hover:bg-orange-600">
          <Plus className="h-4 w-4 mr-2" />
          Schedule Training
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {safetyTraining.map((training, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>{training.course}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Participants:</span>
                  <span className="text-sm font-medium">{training.participants}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completion:</span>
                  <span className="text-sm font-medium">{training.completion}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Next Session:</span>
                  <span className="text-sm font-medium">{training.nextSession}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${training.completion}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
    { id: 'training', label: 'Training', icon: Users },
    { id: 'compliance', label: 'Compliance', icon: Shield }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Safety Management</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive safety oversight and incident management for construction sites
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="secondary" className="px-3 py-1">
            Live Safety Data
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
        {activeTab === 'incidents' && renderIncidents()}
        {activeTab === 'training' && renderTraining()}
        {activeTab === 'compliance' && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Safety Compliance</h3>
                <p className="text-gray-600 mb-4">Monitor and manage safety compliance across all projects</p>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  View Compliance Report
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 
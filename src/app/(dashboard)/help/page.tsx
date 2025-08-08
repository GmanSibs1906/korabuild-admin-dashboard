'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  HelpCircle,
  LayoutDashboard,
  Users,
  FolderOpen,
  DollarSign,
  MessageCircle,
  MessageSquare,
  UserCheck,
  FileText,
  Wrench,
  ShieldCheck,
  Calendar,
  BarChart3,
  Settings,
  ChevronRight,
  CheckCircle,
  Clock,
  Star,
  Info,
  ArrowRight,
  Lightbulb,
  Target,
  Zap
} from 'lucide-react';

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState<string>('overview');

  const sections = [
    { id: 'overview', title: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'navigation', title: 'Navigation Guide', icon: ChevronRight },
    { id: 'features', title: 'Feature Guide', icon: Star },
    { id: 'getting-started', title: 'Getting Started', icon: Target },
    { id: 'tips', title: 'Tips & Shortcuts', icon: Lightbulb },
  ];

  const functionalFeatures = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Real-time construction project overview with notifications',
      status: 'functional',
      features: ['Live notifications', 'Real-time messaging', 'User management alerts']
    },
    {
      name: 'Users',
      icon: Users,
      description: 'Complete user management system',
      status: 'functional',
      features: ['Create/edit users', 'Role management', 'User profiles', 'Activity tracking']
    },
    {
      name: 'Projects',
      icon: FolderOpen,
      description: 'Comprehensive project management and mobile control',
      status: 'functional',
      features: ['Project overview', 'Materials control', 'Progress tracking', 'Financial control', 'Communication hub']
    },
    {
      name: 'Finances',
      icon: DollarSign,
      description: 'Financial management and payment systems',
      status: 'functional',
      features: ['Payment approvals', 'Credit accounts', 'Financial reporting', 'Transaction history']
    },
    {
      name: 'Communications',
      icon: MessageCircle,
      description: 'Message management and client communication',
      status: 'functional',
      features: ['Message threads', 'Broadcast messaging', 'Real-time chat', 'Message history']
    },
    {
      name: 'Requests',
      icon: MessageSquare,
      description: 'Service and material request management',
      status: 'functional',
      features: ['Request tracking', 'Status management', 'Client requests', 'Analytics']
    },
    {
      name: 'Contractors',
      icon: UserCheck,
      description: 'Contractor management and assignments',
      status: 'functional',
      features: ['Contractor profiles', 'Performance tracking', 'Assignment management']
    },
    {
      name: 'Documents',
      icon: FileText,
      description: 'Document management and file organization',
      status: 'functional',
      features: ['File uploads', 'Document categorization', 'Access control']
    },
    {
      name: 'Orders',
      icon: Wrench,
      description: 'Material orders and supply chain management',
      status: 'functional',
      features: ['Order creation/editing', 'Supplier management', 'Delivery tracking', 'Inventory alerts']
    }
  ];

  const comingSoonFeatures = [
    {
      name: 'Quality',
      icon: ShieldCheck,
      description: 'Quality assurance and inspection management',
      status: 'coming-soon'
    },
    {
      name: 'Schedule',
      icon: Calendar,
      description: 'Project scheduling and timeline management',
      status: 'coming-soon'
    },
    {
      name: 'Analytics',
      icon: BarChart3,
      description: 'Business intelligence and reporting',
      status: 'coming-soon'
    },
    {
      name: 'Safety',
      icon: Wrench,
      description: 'Safety compliance and incident management',
      status: 'coming-soon'
    }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-blue-500" />
            <span>Welcome to KoraBuild Admin Dashboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            The KoraBuild Admin Dashboard is your comprehensive control center for managing construction projects, 
            overseeing client communications, and controlling all aspects of your construction business operations.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">What You Can Do</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Manage all projects and track progress</li>
                <li>• Control finances and approve payments</li>
                <li>• Communicate with clients in real-time</li>
                <li>• Manage orders and deliveries</li>
                <li>• Oversee contractors and assignments</li>
                <li>• Handle service requests</li>
              </ul>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Key Features</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Real-time notifications system</li>
                <li>• Mobile app integration</li>
                <li>• Dynamic data from database</li>
                <li>• Role-based access control</li>
                <li>• Comprehensive admin controls</li>
                <li>• Enterprise-grade security</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderNavigation = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Navigation Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              The dashboard is organized into main sections accessible from the left sidebar. 
              Each section contains multiple tabs and features for comprehensive management.
            </p>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Sidebar Navigation</h4>
              <div className="pl-4 space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <LayoutDashboard className="h-4 w-4 text-orange-500" />
                  <span><strong>Dashboard</strong> - Main overview and notifications</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Users className="h-4 w-4 text-orange-500" />
                  <span><strong>Users</strong> - Client and user management</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <FolderOpen className="h-4 w-4 text-orange-500" />
                  <span><strong>Projects</strong> - Project control center</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Wrench className="h-4 w-4 text-orange-500" />
                  <span><strong>Orders</strong> - Material orders and supply chain</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Header Controls</h4>
              <div className="pl-4 space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <span>🔔</span>
                  <span><strong>Notifications</strong> - Real-time alerts and messages</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <HelpCircle className="h-4 w-4 text-orange-500" />
                  <span><strong>Help</strong> - This help guide</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span>👤</span>
                  <span><strong>User Menu</strong> - Profile and logout options</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFeatures = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Functional Features</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {functionalFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.name} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <Icon className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900">{feature.name}</h4>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                      <ul className="text-xs text-gray-500 space-y-1">
                        {feature.features?.map((item, index) => (
                          <li key={index} className="flex items-center space-x-1">
                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-orange-500" />
            <span>Coming Soon Features</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {comingSoonFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.name} className="p-4 border rounded-lg bg-gray-50 opacity-75">
                  <div className="flex items-start space-x-3">
                    <Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-600">{feature.name}</h4>
                        <Badge variant="outline" className="text-orange-600 border-orange-600">Coming Soon</Badge>
                      </div>
                      <p className="text-sm text-gray-500">{feature.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderGettingStarted = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Getting Started Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Step 1: Dashboard Overview</h4>
              <p className="text-gray-600">
                Start by familiarizing yourself with the main dashboard. This is your command center where you'll see:
              </p>
              <ul className="text-sm text-gray-600 space-y-2 ml-4">
                <li>• Real-time notifications from the mobile app</li>
                <li>• New user registration alerts</li>
                <li>• Recent message activity</li>
                <li>• System status and updates</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Step 2: User Management</h4>
              <p className="text-gray-600">
                Navigate to the Users section to manage your clients and team members:
              </p>
              <ul className="text-sm text-gray-600 space-y-2 ml-4">
                <li>• View all registered users from the mobile app</li>
                <li>• Create new user accounts manually</li>
                <li>• Edit user profiles and update information</li>
                <li>• Track user activity and engagement</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Step 3: Project Control</h4>
              <p className="text-gray-600">
                Use the Projects section for comprehensive project management:
              </p>
              <ul className="text-sm text-gray-600 space-y-2 ml-4">
                <li>• Monitor all active construction projects</li>
                <li>• Control project progress and timelines</li>
                <li>• Manage financial aspects and payments</li>
                <li>• Handle materials and orders</li>
                <li>• Communicate with project stakeholders</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Step 4: Orders & Supply Chain</h4>
              <p className="text-gray-600">
                Manage your material orders and supply chain operations:
              </p>
              <ul className="text-sm text-gray-600 space-y-2 ml-4">
                <li>• Create and manage material orders</li>
                <li>• Track deliveries and inventory</li>
                <li>• Manage supplier relationships</li>
                <li>• Monitor order status and history</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTips = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span>Pro Tips & Shortcuts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Notification Management</h4>
              <ul className="text-sm text-gray-600 space-y-2 ml-4">
                <li>• Priority notifications (new users) play sounds and pulse orange</li>
                <li>• Click the notification bell to quickly navigate to the dashboard</li>
                <li>• New user notifications include direct actions (View Profile, Edit User)</li>
                <li>• Messages can be opened directly from notifications</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Communication Efficiency</h4>
              <ul className="text-sm text-gray-600 space-y-2 ml-4">
                <li>• Use broadcast messaging to communicate with all users or specific roles</li>
                <li>• Message threads are organized by sender for easy navigation</li>
                <li>• Real-time messaging syncs instantly with the mobile app</li>
                <li>• Mark conversations as read to keep your inbox organized</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Project Management</h4>
              <ul className="text-sm text-gray-600 space-y-2 ml-4">
                <li>• Use the Materials Control panel for comprehensive order management</li>
                <li>• Progress updates sync automatically with the mobile app</li>
                <li>• Financial controls allow real-time payment approvals</li>
                <li>• All changes reflect in the mobile app within 2 seconds</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Data Management</h4>
              <ul className="text-sm text-gray-600 space-y-2 ml-4">
                <li>• All data is dynamic and fetched from the live database</li>
                <li>• Use refresh buttons to get the latest data updates</li>
                <li>• Filters and search help you find specific information quickly</li>
                <li>• Export functionality available for most data tables</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Real-time Features</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Live notifications</li>
                  <li>• Instant messaging</li>
                  <li>• Real-time data sync</li>
                  <li>• Mobile app integration</li>
                </ul>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Security</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Role-based access control</li>
                  <li>• Secure authentication</li>
                  <li>• Admin-only dashboard</li>
                  <li>• Audit logging</li>
                </ul>
              </div>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-800 mb-2">Need Support?</h4>
              <p className="text-sm text-orange-700">
                For technical support or feature requests, contact SwiftNex Tech. 
                All admin functions are designed to be intuitive and self-explanatory.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverview();
      case 'navigation':
        return renderNavigation();
      case 'features':
        return renderFeatures();
      case 'getting-started':
        return renderGettingStarted();
      case 'tips':
        return renderTips();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <HelpCircle className="h-8 w-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard Help</h1>
          </div>
          <p className="text-gray-600">
            Complete guide to using the KoraBuild Admin Dashboard for construction project management
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Help Topics</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors ${
                          activeSection === section.id
                            ? 'bg-orange-50 text-orange-700 border-l-4 border-orange-500'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{section.title}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
} 
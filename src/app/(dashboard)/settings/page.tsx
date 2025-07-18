'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Settings, 
  User, 
  Shield, 
  Bell, 
  Database,
  Key,
  Globe,
  Palette,
  Save,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'system'>('general');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simulate save operation
    setTimeout(() => {
      setSaving(false);
    }, 1000);
  };

  const renderGeneral = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5 text-orange-500" />
            <span>Organization Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="org-name">Organization Name</Label>
              <Input id="org-name" defaultValue="KoraBuild Construction" />
            </div>
            <div>
              <Label htmlFor="org-email">Contact Email</Label>
              <Input id="org-email" type="email" defaultValue="admin@korabuild.com" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="org-phone">Phone Number</Label>
              <Input id="org-phone" defaultValue="+27 11 123 4567" />
            </div>
            <div>
              <Label htmlFor="org-timezone">Timezone</Label>
              <Input id="org-timezone" defaultValue="Africa/Johannesburg" />
            </div>
          </div>
          <div>
            <Label htmlFor="org-address">Business Address</Label>
            <Input id="org-address" defaultValue="123 Business Street, Sandton, Johannesburg" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5 text-orange-500" />
            <span>Appearance & Branding</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Theme</Label>
              <div className="flex space-x-2 mt-2">
                <Button variant="outline" size="sm">Light</Button>
                <Button variant="outline" size="sm" className="bg-orange-50 border-orange-200">
                  Orange (Current)
                </Button>
                <Button variant="outline" size="sm">Dark</Button>
              </div>
            </div>
            <div>
              <Label>Logo Upload</Label>
              <div className="mt-2">
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Logo
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-orange-500" />
            <span>Authentication & Access</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-medium text-green-900">Two-Factor Authentication</h4>
                <p className="text-sm text-green-700">Enhanced security for admin accounts</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800">Enabled</Badge>
          </div>

          <div className="space-y-3">
            <Label>Session Timeout</Label>
            <div className="flex items-center space-x-2">
              <Input className="w-20" defaultValue="30" />
              <span className="text-sm text-gray-600">minutes of inactivity</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Password Policy</Label>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Minimum 8 characters</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>At least one uppercase letter</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>At least one number</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5 text-orange-500" />
            <span>API Access</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <Label>API Key</Label>
            <div className="flex items-center space-x-2 mt-2">
              <Input readOnly value="kb_live_*********************xyz" className="font-mono text-sm" />
              <Button variant="outline" size="sm">
                Regenerate
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Last used: 2 hours ago</span>
            <span className="text-green-600">Status: Active</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-orange-500" />
            <span>Notification Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { title: 'Project Updates', description: 'New project milestones and progress updates', enabled: true },
            { title: 'Financial Alerts', description: 'Payment approvals and budget notifications', enabled: true },
            { title: 'Safety Incidents', description: 'Immediate safety incident reports', enabled: true },
            { title: 'User Activity', description: 'New user registrations and role changes', enabled: false },
            { title: 'System Maintenance', description: 'Scheduled maintenance and updates', enabled: true },
            { title: 'Quality Issues', description: 'Quality inspection failures and concerns', enabled: true }
          ].map((notification, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">{notification.title}</h4>
                <p className="text-sm text-gray-600">{notification.description}</p>
              </div>
              <Badge className={notification.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {notification.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Methods</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Email Notifications</h4>
                <p className="text-sm text-gray-600">admin@korabuild.com</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">SMS Alerts</h4>
                <p className="text-sm text-gray-600">+27 11 123 4567</p>
              </div>
              <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSystem = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-orange-500" />
            <span>System Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>System Version</Label>
              <p className="text-sm text-gray-900">KoraBuild Admin v2.1.3</p>
            </div>
            <div className="space-y-2">
              <Label>Last Update</Label>
              <p className="text-sm text-gray-900">January 15, 2024</p>
            </div>
            <div className="space-y-2">
              <Label>Database Status</Label>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">Connected</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Storage Used</Label>
              <p className="text-sm text-gray-900">47.2 GB / 100 GB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Database Backup</h4>
              <p className="text-sm text-gray-600">Last backup: Today at 3:00 AM</p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download Backup
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Data Export</h4>
              <p className="text-sm text-gray-600">Export all system data for compliance</p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <h4 className="font-medium text-yellow-900">System Maintenance</h4>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Scheduled maintenance window: Saturday, 2:00 AM - 4:00 AM SAST
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'system', label: 'System', icon: Database }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-1">
            Configure system preferences, security settings, and administrative options
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button 
            className="bg-orange-500 hover:bg-orange-600"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
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
        {activeTab === 'general' && renderGeneral()}
        {activeTab === 'security' && renderSecurity()}
        {activeTab === 'notifications' && renderNotifications()}
        {activeTab === 'system' && renderSystem()}
      </div>
    </div>
  );
} 
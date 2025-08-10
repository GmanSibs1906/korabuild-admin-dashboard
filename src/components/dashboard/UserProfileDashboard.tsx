'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/hooks/useUserProfile';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectCreateModal } from '@/components/modals/ProjectCreateModal';
import { ProjectEditModal } from '@/components/modals/ProjectEditModal';
import { 
  User, 
  Building2, 
  CreditCard, 
  FileText, 
  Activity, 
  Bell,
  ArrowLeft,
  Download,
  Settings,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  TrendingUp,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit,
  Plus,
  Eye,
  AlertTriangle,
  MessageCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserProfileDashboardProps {
  userId: string;
  onClose?: () => void;
}

export function UserProfileDashboard({ userId, onClose }: UserProfileDashboardProps) {
  console.log('🔍 UserProfileDashboard - Starting component render with userId:', userId);
  
  const router = useRouter();
  const {
    userProfile,
    userActivity,
    profileLoading,
    activityLoading,
    profileError,
    activityError,
    fetchUserProfile,
    fetchUserActivity
  } = useUserProfile();

  const [activeTab, setActiveTab] = useState<string>('projects');
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showProjectCreateModal, setShowProjectCreateModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showProjectEditModal, setShowProjectEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  console.log('🔍 UserProfileDashboard - Hook data:', {
    hasUserProfile: !!userProfile,
    hasUserActivity: !!userActivity,
    profileLoading,
    activityLoading,
    profileError,
    activityError
  });

  useEffect(() => {
    console.log('🔍 UserProfileDashboard - useEffect triggered with userId:', userId);
    if (userId) {
      console.log('🔍 UserProfileDashboard - Fetching profile and activity for userId:', userId);
      fetchUserProfile(userId);
      fetchUserActivity(userId);
    }
  }, [userId, fetchUserProfile, fetchUserActivity]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'on_hold':
      case 'revision_required':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActivityIcon = (icon: string) => {
    switch (icon) {
      case 'Building2': return <Building2 className="h-4 w-4" />;
      case 'CreditCard': return <CreditCard className="h-4 w-4" />;
      case 'FileText': return <FileText className="h-4 w-4" />;
      case 'CheckCircle': return <CheckCircle className="h-4 w-4" />;
      case 'Clock': return <Clock className="h-4 w-4" />;
      case 'MessageCircle': return <Activity className="h-4 w-4" />; // This icon is not in the new imports, keeping it as is
      case 'Bell': return <Bell className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (color: string) => {
    switch (color) {
      case 'orange': return 'text-orange-600 bg-orange-100';
      case 'green': return 'text-green-600 bg-green-100';
      case 'blue': return 'text-blue-600 bg-blue-100';
      case 'purple': return 'text-purple-600 bg-purple-100';
      case 'amber': return 'text-amber-600 bg-amber-100';
      case 'red': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleDeleteProject = async (projectId: string, retryCount = 0) => {
    setDeleteLoading(true);
    try {
      console.log('🗑️ Deleting project:', projectId, retryCount > 0 ? `(Attempt ${retryCount + 1})` : '');
      
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Project deletion failed:', errorData);
        
        // Provide more specific error messages to the user
        let userMessage = errorData.error || 'Failed to delete project';
        if (errorData.code === '23503') {
          userMessage = 'Cannot delete project: Some related data still exists. Please try again.';
        } else if (errorData.code === 'P0001') {
          userMessage = 'Cannot delete project: Database constraint violation. Please contact support.';
        }
        
        // Retry once for foreign key constraint issues
        if (errorData.code === '23503' && retryCount < 1) {
          console.log('🔄 Retrying project deletion after constraint error...');
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          return handleDeleteProject(projectId, retryCount + 1);
        }
        
        throw new Error(userMessage);
      }

      console.log('✅ Project deleted successfully');
      
      // Refresh the user profile to update the projects list
      if (userId) {
        fetchUserProfile(userId);
      }
      
      // Close the confirmation dialog
      setDeleteProjectId(null);
      
      // Show success message
      alert('Project deleted successfully!');
      
    } catch (error) {
      console.error('❌ Error deleting project:', error);
      alert(`Error deleting project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleProjectCreated = async (project: any) => {
    console.log('✅ Project created successfully:', project);
    
    // Refresh the user profile to show the new project
    setIsRefreshing(true);
    try {
      if (userId) {
        await fetchUserProfile(userId);
      }
    } catch (error) {
      console.error('❌ Error refreshing user profile:', error);
    } finally {
      setIsRefreshing(false);
    }
    
    // Close the modal
    setShowProjectCreateModal(false);
    
    // Show success message
    alert(`Project "${project.project_name}" created successfully!`);
  };

  const handleProjectUpdated = async (project: any) => {
    console.log('✅ Project updated successfully:', project);
    
    // Refresh the user profile to show the updated project
    setIsRefreshing(true);
    try {
      if (userId) {
        await fetchUserProfile(userId);
      }
    } catch (error) {
      console.error('❌ Error refreshing user profile:', error);
    } finally {
      setIsRefreshing(false);
    }
    
    // Close the modal
    setShowProjectEditModal(false);
    setSelectedProject(null);
    
    // Show success message
    alert(`Project "${project.project_name}" updated successfully!`);
  };

  const handleEditProject = (project: any) => {
    setSelectedProject(project);
    setShowProjectEditModal(true);
  };

  const handleAddProject = () => {
    setShowProjectCreateModal(true);
  };

  const tabs = [
    // { id: 'overview', label: 'Overview', icon: User },
    { id: 'projects', label: 'Projects', icon: Building2 },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading user profile...</span>
      </div>
    );
  }

  if (profileError || !userProfile) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading user profile</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{profileError || 'User profile not found'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { userInfo, quickStats } = userProfile;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/users')}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
              title="Back to Users"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
              <p className="text-sm text-gray-500">Comprehensive user overview and management</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
              onClick={handleAddProject}
              disabled={isRefreshing}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-orange-600 hover:bg-orange-700">
              <Settings className="h-4 w-4 mr-2" />
              Manage
            </button>
          </div>
        </div>
      </div>

      {/* User Info Card */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center">
                {userInfo.profilePhotoUrl ? (
                  <img
                    src={userInfo.profilePhotoUrl}
                    alt={userInfo.name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-orange-600" />
                )}
              </div>
            </div>
            <div className="ml-4 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{userInfo.name}</h2>
                  <div className="flex items-center mt-1 space-x-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Mail className="h-4 w-4 mr-1" />
                      {userInfo.email}
                    </div>
                    {userInfo.phone && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Phone className="h-4 w-4 mr-1" />
                        {userInfo.phone}
                      </div>
                    )}
                    {userInfo.address && (
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-1" />
                        {userInfo.address}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    'bg-green-100 text-green-800 border border-green-200'
                  )}>
                    {userInfo.role}
                  </Badge>
                  <div className="text-sm text-gray-500 mt-1">
                    Joined {formatDate(userInfo.joinDate)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mb-6">
        {/* Primary Stats - MATCHES FINANCIAL CONTROL DATA */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-3 mb-4">
          <div className="bg-white rounded-lg p-4 shadow border-l-4 border-orange-500">
            <div className="text-2xl font-bold text-orange-600">{quickStats.totalProjects}</div>
            <div className="text-sm text-gray-500">Total Projects</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow border-l-4 border-green-500">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(quickStats.totalCashReceived)}</div>
            <div className="text-sm text-gray-500">Cash Received</div>
            <div className="text-xs text-gray-400 mt-1">
              {quickStats.totalContractValue > 0 
                ? `${Math.round((quickStats.totalCashReceived / quickStats.totalContractValue) * 100)}% of contract`
                : 'No contract value'
              }
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow border-l-4 border-indigo-500">
            <div className="text-2xl font-bold text-indigo-600">{formatCurrency(quickStats.totalContractValue)}</div>
            <div className="text-sm text-gray-500">Contract Value</div>
          </div>
        </div>

        {/* Financial Breakdown - MATCHES FINANCIAL CONTROL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg p-4 shadow border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-bold text-red-600">{formatCurrency(quickStats.totalAmountUsed)}</div>
                <div className="text-sm text-gray-500">Amount Used</div>
              </div>
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <CreditCard className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <div className="mt-2">
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-red-500 rounded-full" 
                  style={{ 
                    width: quickStats.totalCashReceived > 0 
                      ? `${Math.min((quickStats.totalAmountUsed / quickStats.totalCashReceived) * 100, 100)}%`
                      : '0%'
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {quickStats.totalCashReceived > 0 
                  ? `${Math.round((quickStats.totalAmountUsed / quickStats.totalCashReceived) * 100)}% of cash received`
                  : 'No cash received'
                }
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-bold text-blue-600">{formatCurrency(quickStats.totalAmountRemaining)}</div>
                <div className="text-sm text-gray-500">Amount Remaining</div>
              </div>
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="mt-2">
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-blue-500 rounded-full" 
                  style={{ 
                    width: quickStats.totalCashReceived > 0 
                      ? `${Math.min((quickStats.totalAmountRemaining / quickStats.totalCashReceived) * 100, 100)}%`
                      : '0%'
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-400 mt-1">Available funds</div>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        {/* <div className="grid grid-cols-2 gap-4 sm:grid-cols-6 lg:grid-cols-6">
          <div className="bg-white rounded-lg p-3 shadow">
            <div className="text-lg font-semibold text-gray-700">{quickStats.completedProjects}</div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow">
            <div className="text-lg font-semibold text-yellow-600">{quickStats.planningProjects}</div>
            <div className="text-xs text-gray-500">Planning</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow">
            <div className="text-lg font-semibold text-amber-600">{quickStats.onHoldProjects}</div>
            <div className="text-xs text-gray-500">On Hold</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow">
            <div className="text-lg font-semibold text-purple-600">{quickStats.totalMessages}</div>
            <div className="text-xs text-gray-500">Messages</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow">
            <div className="text-lg font-semibold text-red-600">{quickStats.unreadNotifications}</div>
            <div className="text-xs text-gray-500">Unread</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow">
            <div className={cn(
              'text-lg font-semibold',
              quickStats.engagementScore >= 80 ? 'text-green-600' : 
              quickStats.engagementScore >= 60 ? 'text-orange-600' : 'text-red-600'
            )}>
              {quickStats.engagementScore}
            </div>
            <div className="text-xs text-gray-500">Engagement</div>
          </div>
        </div> */}
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center',
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Overview</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h4>
                  <div className="space-y-3">
                    {userActivity?.timeline.slice(0, 5).map((day) => 
                      day.activities.slice(0, 3).map((activity) => (
                        <div key={activity.id} className="flex items-start">
                          <div className={cn(
                            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                            getActivityColor(activity.color)
                          )}>
                            {getActivityIcon(activity.icon)}
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                            <p className="text-sm text-gray-500">{activity.description}</p>
                            <p className="text-xs text-gray-400">{formatDateTime(activity.timestamp)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
                  <div className="space-y-2">
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Send Message
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center">
                      <Edit className="h-4 w-4 mr-2" />
                      Update Profile
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center">
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Projects</h3>
              <div className="space-y-4">
                {userProfile.projects && userProfile.projects.length > 0 ? (
                  userProfile.projects.map((project) => (
                  <div key={project.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{project.project_name}</h4>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-1" />
                          {project.project_address}
                        </div>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <User className="h-4 w-4 mr-1" />
                          Owner: {project.client_name || 'N/A'}
                        </div>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-sm text-gray-900 font-medium">
                            {formatCurrency(project.contract_value)}
                          </span>
                          <Badge className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                            getStatusColor(project.status)
                          )}>
                            {project.status.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {project.progress_percentage}% Complete
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                          title="View Project Details"
                          onClick={() => router.push(`/projects?projectId=${project.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-2 text-orange-400 hover:text-orange-600 hover:bg-orange-50 rounded-md"
                          title="Edit Project"
                          onClick={() => handleEditProject(project)}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                          title="Delete Project"
                          onClick={() => setDeleteProjectId(project.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No projects found for this user</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment History</h3>
              <div className="space-y-4">
                {userProfile.payments.map((payment) => (
                  <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </div>
                        <div className="text-sm text-gray-500">{payment.description}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {formatDate(payment.payment_date)} • {payment.payment_method}
                        </div>
                      </div>
                      <Badge className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                        getStatusColor(payment.status)
                      )}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Documents</h3>
              <div className="space-y-4">
                {userProfile.documents.map((document) => (
                  <div key={document.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-8 w-8 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{document.document_name}</div>
                          <div className="text-sm text-gray-500">{document.document_type}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {formatDate(document.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                          getStatusColor(document.approval_status)
                        )}>
                          {document.approval_status.replace('_', ' ')}
                        </Badge>
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Timeline</h3>
              {activityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                <div className="space-y-6">
                  {userActivity?.timeline.map((day) => (
                    <div key={day.date}>
                      <div className="text-sm font-medium text-gray-900 mb-3">{day.date}</div>
                      <div className="space-y-3">
                        {day.activities.map((activity) => (
                          <div key={activity.id} className="flex items-start">
                            <div className={cn(
                              'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                              getActivityColor(activity.color)
                            )}>
                              {getActivityIcon(activity.icon)}
                            </div>
                            <div className="ml-3 flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                                <span className="text-xs text-gray-400">{activity.category}</span>
                              </div>
                              <p className="text-sm text-gray-500">{activity.description}</p>
                              {activity.projectName && (
                                <p className="text-xs text-gray-400">Project: {activity.projectName}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
              <div className="space-y-4">
                {userProfile.notifications.map((notification) => (
                  <div key={notification.id} className={cn(
                    'border rounded-lg p-4',
                    notification.is_read ? 'border-gray-200' : 'border-orange-200 bg-orange-50'
                  )}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <Bell className="h-4 w-4 text-gray-400 mr-2" />
                          <div className="text-sm font-medium text-gray-900">{notification.title}</div>
                          {!notification.is_read && (
                            <div className="ml-2 w-2 h-2 bg-orange-500 rounded-full"></div>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">{notification.message}</div>
                        <div className="text-xs text-gray-400 mt-2">
                          {formatDateTime(notification.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteProjectId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Delete Project</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this project? This action will permanently remove:
            </p>
            
            <ul className="text-sm text-gray-600 mb-6 space-y-1">
              <li>• The project and all its data</li>
              <li>• All project milestones and phases</li>
              <li>• All project photos and documents</li>
              <li>• All financial records and payments</li>
              <li>• All contractor assignments</li>
              <li>• All project communications</li>
              <li>• All quality reports and inspections</li>
            </ul>
            
            <p className="text-sm text-red-600 font-medium mb-6">
              This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                onClick={() => setDeleteProjectId(null)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                onClick={() => handleDeleteProject(deleteProjectId)}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Project
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Create Modal */}
      {showProjectCreateModal && userProfile && (
        <ProjectCreateModal
          isOpen={showProjectCreateModal}
          onClose={() => setShowProjectCreateModal(false)}
          clientId={userId}
          clientName={userProfile.userInfo.name}
          onProjectCreated={handleProjectCreated}
        />
      )}
      {/* Project Edit Modal */}
      {showProjectEditModal && selectedProject && (
        <ProjectEditModal
          isOpen={showProjectEditModal}
          onClose={() => {
            setShowProjectEditModal(false);
            setSelectedProject(null);
          }}
          project={selectedProject}
          onProjectUpdated={handleProjectUpdated}
        />
      )}
    </div>
  );
} 
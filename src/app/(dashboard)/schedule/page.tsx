'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  TrendingUp, 
  Clock, 
  Target, 
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Smartphone,
  Monitor,
  Camera,
  Users,
  ClipboardCheck,
  Shield,
  FileImage,
  MessageSquare,
  Activity,
  MapPin,
  Timer
} from 'lucide-react';

export default function SchedulePage() {
  const [overviewData, setOverviewData] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [mobileAppData, setMobileAppData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'project'>('overview');
  const [activeTab, setActiveTab] = useState<'timeline' | 'daily_updates' | 'photos' | 'activity'>('timeline');

  useEffect(() => {
    console.log('🚀 Schedule page mounted - Loading overview data');
    
    // Load overview data first
    fetch('/api/schedule')
      .then(res => res.json())
      .then(data => {
        console.log('✅ Overview API Response:', data);
        setOverviewData(data);
        
        // Auto-load first project's mobile app data
        if (data?.data?.schedules?.length > 0) {
          const firstProject = data.data.schedules[0];
          console.log('🎯 Auto-loading mobile app data for:', firstProject.project_id);
          loadMobileAppData(firstProject.project_id, firstProject);
        }
        
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ API Error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const loadMobileAppData = async (projectId: string, projectInfo: any) => {
    try {
      console.log('📱 Loading mobile app data for project:', projectId);
      const response = await fetch(`/api/schedule?projectId=${projectId}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Mobile app data loaded:', data);
        setMobileAppData(data);
        setSelectedProject(projectInfo);
        setViewMode('project');
      } else {
        throw new Error(data.error || 'Failed to load mobile app data');
      }
    } catch (error) {
      console.error('❌ Error loading mobile app data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load mobile app data');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project_update': return MessageSquare;
      case 'progress_photo': return Camera;
      case 'work_session': return Users;
      case 'quality_inspection': return ClipboardCheck;
      case 'safety_incident': return Shield;
      default: return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'project_update': return 'bg-blue-500';
      case 'progress_photo': return 'bg-green-500';
      case 'work_session': return 'bg-orange-500';
      case 'quality_inspection': return 'bg-purple-500';
      case 'safety_incident': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Schedule Management</h1>
        <div className="text-center py-12">
          <div className="text-gray-600">🔄 Loading schedule data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Schedule Management</h1>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="text-red-600">❌ Error: {error}</div>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Schedule Management</h1>
          <p className="text-gray-600">Manage project schedules and daily site updates</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge className="bg-orange-100 text-orange-800">
            Mobile App Sync
          </Badge>
          <Badge className="bg-blue-100 text-blue-800">
            Real-time Updates
          </Badge>
          {viewMode === 'project' && (
            <Button
              onClick={() => setViewMode('overview')}
              variant="outline"
              size="sm"
            >
              ← Back to Overview
            </Button>
          )}
        </div>
      </div>

      {/* Overview Mode */}
      {viewMode === 'overview' && overviewData?.data?.stats && (
        <>
          {/* Overview Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded bg-orange-500 flex items-center justify-center mr-3">
                    <span className="text-white text-sm font-bold">📊</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Projects</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {overviewData.data.stats.totalProjects}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded bg-green-500 flex items-center justify-center mr-3">
                    <span className="text-white text-sm font-bold">🏃</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Projects</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {overviewData.data.stats.activeProjects}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center mr-3">
                    <span className="text-white text-sm font-bold">✅</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {overviewData.data.stats.completedProjects}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded bg-red-500 flex items-center justify-center mr-3">
                    <span className="text-white text-sm font-bold">⚠️</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Delayed</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {overviewData.data.stats.delayedProjects}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Projects List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                📋 Project Schedules
                <Badge className="ml-2 bg-orange-500 text-white">
                  {overviewData.data.schedules.length} Active
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overviewData.data.schedules.map((schedule: any) => (
                  <div key={schedule.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {schedule.projects?.project_name || 'Unknown Project'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Client: {schedule.projects?.users?.full_name || 'Unknown Client'}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Badge className={`text-xs ${
                          schedule.projects?.status === 'completed' ? 'bg-green-100 text-green-800' :
                          schedule.projects?.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {schedule.projects?.status?.replace('_', ' ') || 'unknown'}
                        </Badge>
                        <Badge className={`text-xs ${
                          schedule.schedule_health === 'on_track' ? 'bg-green-100 text-green-800' :
                          schedule.schedule_health === 'at_risk' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {schedule.schedule_health?.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-500">Progress:</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${schedule.completion_percentage}%` }}
                            />
                          </div>
                          <span className="font-medium">{schedule.completion_percentage}%</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Current Phase:</span>
                        <div className="font-medium">{schedule.projects?.current_phase || 'Not set'}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Start Date:</span>
                        <div className="font-medium">
                          {formatDate(schedule.projects?.start_date)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Expected End:</span>
                        <div className="font-medium">
                          {formatDate(schedule.projects?.expected_completion)}
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <Button 
                        onClick={() => loadMobileAppData(schedule.project_id, schedule)}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        size="sm"
                      >
                        📱 View Daily Updates
                      </Button>
                      
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => loadMobileAppData(schedule.project_id, schedule)}
                      >
                        📊 View Timeline
                      </Button>
                      
                      <Button 
                        variant="outline"
                        size="sm"
                      >
                        ⚙️ Manage Schedule
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Project Mode - Mobile App Compatible Data with Daily Updates */}
      {viewMode === 'project' && mobileAppData && (
        <>
          {/* Project Header */}
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span>📱 {mobileAppData.data.schedule.projects.project_name}</span>
                </div>
                <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                  LIVE FROM DATABASE
                </Badge>
              </CardTitle>
              <p className="text-orange-100">Real-time project updates and daily site activity</p>
            </CardHeader>
          </Card>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'timeline', label: 'Timeline Overview', icon: Target },
                { id: 'daily_updates', label: 'Daily Updates', icon: Activity },
                { id: 'photos', label: 'Progress Photos', icon: Camera },
                { id: 'activity', label: 'Site Activity', icon: Users },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Timeline Overview Tab */}
          {activeTab === 'timeline' && (
            <>
              {/* Mobile App Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <Card>
                  <CardContent className="text-center p-4">
                    <div className="text-2xl font-bold text-gray-900">{mobileAppData.data.stats.totalItems}</div>
                    <div className="text-sm text-gray-600">Total Items</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="text-center p-4">
                    <div className="text-2xl font-bold text-green-600">{mobileAppData.data.stats.completedItems}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="text-center p-4">
                    <div className="text-2xl font-bold text-orange-600">{mobileAppData.data.stats.inProgressItems}</div>
                    <div className="text-sm text-gray-600">In Progress</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="text-center p-4">
                    <div className="text-2xl font-bold text-red-600">{mobileAppData.data.stats.overdueItems}</div>
                    <div className="text-sm text-gray-600">Overdue</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="text-center p-4">
                    <div className="text-2xl font-bold text-blue-600">{mobileAppData.data.stats.upcomingItems}</div>
                    <div className="text-sm text-gray-600">Upcoming</div>
                  </CardContent>
                </Card>
              </div>

              {/* Overall Progress */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-semibold text-gray-900">Overall Progress</span>
                    <span className="text-2xl font-bold text-orange-600">{mobileAppData.data.stats.overallProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-orange-500 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${mobileAppData.data.stats.overallProgress}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm text-gray-600">
                    <div>Schedule Health: <span className="font-medium text-gray-900">{mobileAppData.data.stats.scheduleHealth.replace('_', ' ')}</span></div>
                    <div>Current Phase: <span className="font-medium text-gray-900">{mobileAppData.data.schedule.projects.current_phase}</span></div>
                    <div>Status: <span className="font-medium text-gray-900">{mobileAppData.data.schedule.projects.status.replace('_', ' ')}</span></div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Daily Updates Tab - NEW FEATURE */}
          {activeTab === 'daily_updates' && (
            <div className="space-y-6">
              {/* Daily Updates Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Activity className="h-8 w-8 text-blue-500" />
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{mobileAppData.data.stats.totalDailyUpdates}</div>
                        <div className="text-sm text-gray-600">Total Updates</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Camera className="h-8 w-8 text-green-500" />
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{mobileAppData.data.stats.recentPhotos}</div>
                        <div className="text-sm text-gray-600">Photos This Week</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Users className="h-8 w-8 text-orange-500" />
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{mobileAppData.data.stats.recentWorkSessions}</div>
                        <div className="text-sm text-gray-600">Work Sessions</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <ClipboardCheck className="h-8 w-8 text-purple-500" />
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{mobileAppData.data.stats.pendingQualityInspections}</div>
                        <div className="text-sm text-gray-600">Pending Inspections</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Daily Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    📅 Daily Activity Timeline
                    <Badge className="ml-2 bg-orange-500 text-white">Last 30 Days</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {mobileAppData.data.dailyTimeline?.length > 0 ? (
                    <div className="space-y-6">
                      {mobileAppData.data.dailyTimeline.slice(0, 10).map((dayData: any) => (
                        <div key={dayData.date} className="border-l-4 border-orange-500 pl-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{dayData.dateFormatted}</h4>
                            <Badge variant="outline" className="text-xs text-orange-500 ">
                              {dayData.activitiesCount} activities
                            </Badge>
                          </div>
                          
                          <div className="space-y-3">
                            {dayData.activities.map((activity: any) => {
                              const IconComponent = getActivityIcon(activity.type);
                              return (
                                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                  <div className={`w-8 h-8 rounded-full ${getActivityColor(activity.type)} flex items-center justify-center`}>
                                    <IconComponent className="h-4 w-4 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <h5 className="font-medium text-gray-900">{activity.title}</h5>
                                      <span className="text-xs text-gray-500">{formatDateTime(activity.date)}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                      <span>By: {activity.author}</span>
                                      <Badge variant="outline" className="text-xs text-orange-500 ">
                                        {activity.type.replace('_', ' ')}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No daily updates yet</h3>
                      <p className="text-gray-600">Daily updates will appear here when uploaded from the mobile app.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Progress Photos Tab */}
          {activeTab === 'photos' && (
            <div className="space-y-6">
              {mobileAppData.data.progressPhotos?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mobileAppData.data.progressPhotos.slice(0, 12).map((photo: any) => (
                    <Card key={photo.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className="aspect-w-16 aspect-h-12 bg-gray-200">
                        <img
                          src={photo.photo_url}
                          alt={photo.photo_title || 'Progress photo'}
                          className="w-full h-48 object-cover"
                        />
                      </div>
                      <CardContent className="p-4">
                        <h4 className="font-medium text-gray-900 mb-2">
                          {photo.photo_title || 'Untitled Photo'}
                        </h4>
                        {photo.description && (
                          <p className="text-sm text-gray-600 mb-3">{photo.description}</p>
                        )}
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>Phase: {photo.phase_category.replace('_', ' ')}</div>
                          <div>Taken: {formatDate(photo.date_taken)}</div>
                          <div>By: {photo.uploaded_by_user?.full_name || 'Site Team'}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No progress photos yet</h3>
                    <p className="text-gray-600">Progress photos will appear here when uploaded from the mobile app.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Site Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              {/* Work Sessions */}
              {mobileAppData.data.workSessions?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2 text-orange-500" />
                      Recent Work Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mobileAppData.data.workSessions.slice(0, 5).map((session: any) => (
                        <div key={session.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">
                              {session.task?.task_name || 'General Work'}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {session.duration_hours}h
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {session.work_description || session.progress_made}
                          </p>
                          <div className="text-xs text-gray-500 grid grid-cols-2 gap-4">
                            <div>Date: {formatDate(session.session_date)}</div>
                            <div>Crew: {session.crew_member?.crew_name}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quality Inspections */}
              {mobileAppData.data.qualityInspections?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <ClipboardCheck className="h-5 w-5 mr-2 text-purple-500" />
                      Quality Inspections
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mobileAppData.data.qualityInspections.slice(0, 5).map((inspection: any) => (
                        <div key={inspection.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">
                              {inspection.inspection_type}
                            </h4>
                            <Badge className={`text-xs ${
                              inspection.inspection_status === 'passed' ? 'bg-green-100 text-green-800' :
                              inspection.inspection_status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {inspection.inspection_status}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500 grid grid-cols-2 gap-4">
                            <div>Date: {formatDate(inspection.inspection_date)}</div>
                            <div>Score: {inspection.overall_score || 'N/A'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}

      {/* Debug Info - Always show but collapsed */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>🔧 Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div><strong>View Mode:</strong> {viewMode}</div>
            <div><strong>Active Tab:</strong> {activeTab}</div>
            <div><strong>Overview Data:</strong> {overviewData ? '✅ Loaded' : '❌ Not loaded'}</div>
            <div><strong>Mobile App Data:</strong> {mobileAppData ? '✅ Loaded' : '❌ Not loaded'}</div>
            <div><strong>Selected Project:</strong> {selectedProject?.projects?.project_name || 'None'}</div>
          </div>
          
          {mobileAppData && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <div className="text-sm text-green-800">
                <strong>✅ Mobile App Data Successfully Loaded:</strong>
                <div>Total Items: {mobileAppData.data.stats.totalItems}</div>
                <div>Overall Progress: {mobileAppData.data.stats.overallProgress}%</div>
                <div>Daily Updates: {mobileAppData.data.stats.totalDailyUpdates}</div>
                <div>Recent Photos: {mobileAppData.data.stats.recentPhotos}</div>
                <div>Work Sessions: {mobileAppData.data.stats.recentWorkSessions}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
 'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { LoadingSpinner } from '../ui/loading-spinner';
import { Plus, Edit, Trash2, Calendar, Target, TrendingUp, Clock, Image, CheckCircle, XCircle, Eye, Upload, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PhotoUploadModal } from '../modals/PhotoUploadModal';

interface ProgressControlPanelProps {
  projectId: string;
  onDataSync: (data: any) => void;
  onClose: () => void;
}

interface Project {
  id: string;
  project_name: string;
  start_date: string;
  expected_completion: string;
  actual_completion: string | null;
  current_phase: string;
  progress_percentage: number;
  status: string;
  project_photo_urls: string[] | null;
  daysRemaining: number;
  updated_at: string;
}

interface Milestone {
  id: string;
  project_id: string;
  milestone_name: string;
  description: string;
  phase_category: string;
  planned_start: string;
  planned_end: string;
  actual_start?: string;
  actual_end?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed' | 'on_hold';
  progress_percentage: number;
  photos: string[];
  notes?: string;
  order_index: number;
  estimated_cost?: number;
  actual_cost?: number;
  responsible_contractor?: string;
  created_at: string;
  updated_at: string;
}

interface ProgressPhoto {
  id: string;
  project_id: string;
  milestone_id: string | null;
  photo_url: string;
  photo_title: string | null;
  description: string | null;
  phase_category: string;
  photo_type: string;
  date_taken: string;
  uploaded_by: string | null;
  processing_status: string;
  is_featured: boolean;
  likes_count: number;
  views_count: number;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

interface MilestoneStats {
  totalMilestones: number;
  completedMilestones: number;
  inProgressMilestones: number;
  notStartedMilestones: number;
  delayedMilestones: number;
  overallProgress: number;
  totalEstimatedCost: number;
  totalActualCost: number;
}

interface ProgressData {
  project: Project;
  milestones: Milestone[];
  progressPhotos: ProgressPhoto[];
  stats: MilestoneStats;
}

export function ProgressControlPanel({ projectId, onClose }: ProgressControlPanelProps) {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'milestones' | 'photos'>('overview');
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  
  // 🔧 NEW: Form state for timeline updates
  const [timelineForm, setTimelineForm] = useState({
    progress_percentage: 0,
    current_phase: '',
    start_date: '',
    expected_completion: '',
    actual_completion: '',
    hasChanges: false
  });
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch progress data
  const fetchProgressData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📊 Fetching progress data for project:', projectId);

      const response = await fetch(`/api/mobile-control/progress?projectId=${projectId}`);
      const result = await response.json();

      if (result.success) {
        console.log('✅ Progress data fetched:', result.data);
        setProgressData(result.data);
        
        // 🔧 NEW: Initialize form state with current data
        if (result.data.project) {
          setTimelineForm({
            progress_percentage: result.data.project.progress_percentage || 0,
            current_phase: result.data.project.current_phase || '',
            start_date: result.data.project.start_date || '',
            expected_completion: result.data.project.expected_completion || '',
            actual_completion: result.data.project.actual_completion || '',
            hasChanges: false
          });
        }
      } else {
        throw new Error(result.error || 'Failed to fetch progress data');
      }
    } catch (error) {
      console.error('❌ Error fetching progress data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch progress data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProgressData();
    }
  }, [projectId]);

  // 🔧 NEW: Handle form changes
  const handleTimelineFormChange = (field: string, value: any) => {
    setTimelineForm(prev => ({
      ...prev,
      [field]: value,
      hasChanges: true
    }));
  };

  // 🔧 NEW: Save timeline changes
  const handleSaveTimelineChanges = async () => {
    if (!timelineForm.hasChanges) return;

    try {
      setSaving(true);
      console.log('💾 Saving timeline changes:', timelineForm);

      // Prepare updates object
      const updates: any = {};

      // Only include changed fields
      if (progressData?.project) {
        if (timelineForm.progress_percentage !== progressData.project.progress_percentage) {
          updates.progress_percentage = timelineForm.progress_percentage;
        }
        if (timelineForm.current_phase !== progressData.project.current_phase) {
          updates.current_phase = timelineForm.current_phase;
        }
        if (timelineForm.start_date !== progressData.project.start_date) {
          updates.start_date = timelineForm.start_date;
        }
        if (timelineForm.expected_completion !== progressData.project.expected_completion) {
          updates.expected_completion = timelineForm.expected_completion;
        }
        if (timelineForm.actual_completion !== progressData.project.actual_completion) {
          updates.actual_completion = timelineForm.actual_completion;
        }
      }

      // 🔧 FIX: Send all updates together using timeline endpoint to avoid trigger issues
      if (Object.keys(updates).length > 0) {
        console.log('🔄 Sending combined timeline and progress updates:', updates);
        
        const response = await fetch('/api/mobile-control/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'updateProjectTimeline',
            projectId,
            updates,
          }),
        });

        const result = await response.json();
        
        if (!result.success) {
          // 🔧 FALLBACK: Try updating fields individually
          console.log('🔄 Primary update failed, trying timeline-only update...');
          
          // Remove progress_percentage and try timeline fields only
          const timelineOnlyUpdates = { ...updates };
          delete timelineOnlyUpdates.progress_percentage;
          
          if (Object.keys(timelineOnlyUpdates).length > 0) {
            try {
              const timelineResponse = await fetch('/api/mobile-control/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'updateProjectTimeline',
                  projectId,
                  updates: timelineOnlyUpdates,
                }),
              });

              const timelineResult = await timelineResponse.json();
              if (timelineResult.success) {
                console.log('✅ Timeline fields updated successfully');
                setSuccessMessage('Timeline dates updated successfully! Progress percentage cannot be saved due to database limitations.');
              } else {
                throw new Error(timelineResult.error || 'Failed to update timeline');
              }
            } catch (error) {
              throw new Error(`Timeline update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
          
          // Show message about progress percentage
          if (updates.progress_percentage !== undefined) {
            console.log('⚠️ Progress percentage could not be saved due to database constraints');
            if (Object.keys(timelineOnlyUpdates).length === 0) {
              throw new Error('Progress percentage cannot be saved due to database triggers. Please contact administrator.');
            }
          }
        } else {
          // 🔧 NEW: Handle successful responses with detailed feedback
          const updatedFields = Object.keys(updates);
          const hasProgressUpdate = updatedFields.includes('progress_percentage');
          const hasTimelineUpdates = updatedFields.some(field => ['start_date', 'expected_completion', 'actual_completion', 'current_phase'].includes(field));
          
          if (result.warning) {
            console.log('⚠️ API Warning:', result.warning);
            if (hasTimelineUpdates) {
              setSuccessMessage('Timeline dates updated successfully! Progress percentage was skipped due to database constraints.');
            } else {
              setError(result.warning);
            }
          } else {
            // All updates successful
            if (hasProgressUpdate && hasTimelineUpdates) {
              setSuccessMessage(`Timeline and progress updated successfully! Progress set to ${updates.progress_percentage}%`);
            } else if (hasProgressUpdate) {
              setSuccessMessage(`Progress updated successfully to ${updates.progress_percentage}%`);
            } else if (hasTimelineUpdates) {
              setSuccessMessage('Timeline updated successfully!');
            } else {
              setSuccessMessage('Project updated successfully!');
            }
          }
        }
      }

      // Reset form state
      setTimelineForm(prev => ({ ...prev, hasChanges: false }));
      
      // Refresh data
      await fetchProgressData();
      
      console.log('✅ Timeline changes saved successfully');
      
      // 🔧 NEW: Show success message
      setError(null); // Clear any previous errors
      setSuccessMessage('Timeline updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000); // Clear after 3 seconds
      
    } catch (error) {
      console.error('❌ Error saving timeline changes:', error);
      setError(error instanceof Error ? error.message : 'Failed to save timeline changes');
      setSuccessMessage(null); // Clear success message on error
    } finally {
      setSaving(false);
    }
  };

  // 🔧 NEW: Reset form changes
  const handleResetTimelineChanges = () => {
    if (progressData?.project) {
      setTimelineForm({
        progress_percentage: progressData.project.progress_percentage || 0,
        current_phase: progressData.project.current_phase || '',
        start_date: progressData.project.start_date || '',
        expected_completion: progressData.project.expected_completion || '',
        actual_completion: progressData.project.actual_completion || '',
        hasChanges: false
      });
    }
  };

  // 🔧 NEW: Recalculate progress based on milestones
  const handleRecalculateProgress = async () => {
    try {
      setSaving(true);
      setError(null);
      
      console.log('🔄 Calculating project progress from milestones...');
      
      // Calculate progress locally from current milestone data
      if (progressData?.milestones && progressData.milestones.length > 0) {
        const totalProgress = progressData.milestones.reduce((sum, milestone) => {
          return sum + (milestone.progress_percentage || 0);
        }, 0);
        
        const calculatedProgress = Math.round(totalProgress / progressData.milestones.length);
        
        console.log('📊 Local progress calculation:', {
          totalMilestones: progressData.milestones.length,
          milestoneBreakdown: progressData.milestones.map(m => ({
            name: m.milestone_name,
            status: m.status,
            progress: m.progress_percentage
          })),
          calculatedProgress
        });
        
        // Update form with calculated progress
        setTimelineForm(prev => ({
          ...prev,
          progress_percentage: calculatedProgress,
          hasChanges: true // Mark as changed so user can save
        }));
        
        // Show success message with breakdown
        setSuccessMessage(
          `Progress calculated: ${calculatedProgress}% (${progressData.milestones.filter(m => m.status === 'completed').length}/${progressData.milestones.length} milestones completed)`
        );
        setTimeout(() => setSuccessMessage(null), 7000);
        
      } else {
        // No milestones found
        setTimelineForm(prev => ({
          ...prev,
          progress_percentage: 0,
          hasChanges: true
        }));
        
        setSuccessMessage('No milestones found - progress set to 0%');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
      
    } catch (error) {
      console.error('❌ Error calculating progress:', error);
      setError(error instanceof Error ? error.message : 'Failed to calculate progress');
    } finally {
      setSaving(false);
    }
  };

  // Project timeline update handlers (keeping existing for backward compatibility)
  const handleUpdateProjectTimeline = async (updates: any) => {
    try {
      setUpdating(true);
      console.log('📊 Updating project timeline:', updates);

      const response = await fetch('/api/mobile-control/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateProjectTimeline',
          projectId,
          updates,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchProgressData(); // Refresh data
        console.log('✅ Project timeline updated successfully');
      } else {
        throw new Error(result.error || 'Failed to update project timeline');
      }
    } catch (error) {
      console.error('❌ Error updating project timeline:', error);
      setError(error instanceof Error ? error.message : 'Failed to update project timeline');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateProjectPhase = async (currentPhase: string) => {
    try {
      setUpdating(true);
      console.log('📊 Updating project phase:', currentPhase);

      const response = await fetch('/api/mobile-control/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateProjectPhase',
          projectId,
          updates: { current_phase: currentPhase },
        }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchProgressData(); // Refresh data
        console.log('✅ Project phase updated successfully');
      } else {
        throw new Error(result.error || 'Failed to update project phase');
      }
    } catch (error) {
      console.error('❌ Error updating project phase:', error);
      setError(error instanceof Error ? error.message : 'Failed to update project phase');
    } finally {
      setUpdating(false);
    }
  };

  // 🔧 REMOVED: handleUpdateProjectProgress (replaced with form-based approach)

  // Photo management handlers
  const handleApprovePhoto = async (photoId: string) => {
    try {
      setUpdating(true);
      console.log('📊 Approving photo:', photoId);

      const response = await fetch('/api/mobile-control/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approvePhoto',
          updates: { photoId },
        }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchProgressData(); // Refresh data
        console.log('✅ Photo approved successfully');
      } else {
        throw new Error(result.error || 'Failed to approve photo');
      }
    } catch (error) {
      console.error('❌ Error approving photo:', error);
      setError(error instanceof Error ? error.message : 'Failed to approve photo');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePhoto = async (photoId: string, reason: string = 'Admin decision') => {
    try {
      setUpdating(true);
      console.log('📊 Deleting photo:', photoId);

      const response = await fetch('/api/mobile-control/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deletePhoto',
          updates: { photoId, reason },
        }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchProgressData(); // Refresh data
        console.log('✅ Photo deleted successfully');
      } else {
        throw new Error(result.error || 'Failed to delete photo');
      }
    } catch (error) {
      console.error('❌ Error deleting photo:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete photo');
    } finally {
      setUpdating(false);
    }
  };

  // Existing milestone handlers
  const handleCreateMilestone = (newMilestone: Milestone) => {
    console.log('📊 New milestone created:', newMilestone);
    
    if (progressData) {
      setProgressData({
        ...progressData,
        milestones: [...progressData.milestones, newMilestone].sort((a, b) => a.order_index - b.order_index),
        stats: {
          ...progressData.stats,
          totalMilestones: progressData.stats.totalMilestones + 1,
        },
      });
    }
    
    setShowCreateModal(false);
  };

  const handleUpdateMilestone = (updatedMilestone: Milestone) => {
    console.log('📊 Milestone updated:', updatedMilestone);
    
    if (progressData) {
      setProgressData({
        ...progressData,
        milestones: progressData.milestones.map(m => 
          m.id === updatedMilestone.id ? updatedMilestone : m
        ),
      });
    }
    
    setShowEditModal(false);
    setSelectedMilestone(null);
  };

  const handleEditMilestone = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setShowEditModal(true);
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!confirm('Are you sure you want to delete this milestone? This action cannot be undone.')) {
      return;
    }

    try {
      setUpdating(true);
      console.log('📊 Deleting milestone:', milestoneId);

      const response = await fetch('/api/mobile-control/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          milestoneId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        if (progressData) {
          setProgressData({
            ...progressData,
            milestones: progressData.milestones.filter(m => m.id !== milestoneId),
            stats: {
              ...progressData.stats,
              totalMilestones: progressData.stats.totalMilestones - 1,
            },
          });
        }
        console.log('✅ Milestone deleted successfully');
      } else {
        throw new Error(result.error || 'Failed to delete milestone');
      }
    } catch (error) {
      console.error('❌ Error deleting milestone:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete milestone');
    } finally {
      setUpdating(false);
    }
  };

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'delayed': return 'bg-red-500';
      case 'on_hold': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not_started': return 'Not Started';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'delayed': return 'Delayed';
      case 'on_hold': return 'On Hold';
      default: return status;
    }
  };

  const getPhaseColor = (phase: string) => {
    const colors: { [key: string]: string } = {
      'site_preparation': 'bg-brown-500',
      'foundation': 'bg-gray-500',
      'structure': 'bg-blue-500',
      'roofing': 'bg-purple-500',
      'electrical': 'bg-yellow-500',
      'plumbing': 'bg-cyan-500',
      'interior': 'bg-pink-500',
      'finishing': 'bg-green-500',
      'landscaping': 'bg-emerald-500',
      'permits': 'bg-orange-500',
      'general': 'bg-gray-500',
    };
    return colors[phase] || 'bg-gray-500';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">Loading progress data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">❌ Error: {error}</div>
        <Button onClick={fetchProgressData} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 mb-4">No progress data available</div>
        <Button onClick={fetchProgressData} variant="outline">
          Refresh
        </Button>
      </div>
    );
  }

  const { project, milestones, progressPhotos, stats } = progressData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Progress Control</h2>
          <p className="text-gray-600">{project.project_name}</p>
        </div>
        <Button onClick={onClose} variant="outline">
          Close
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Target },
            { id: 'timeline', label: 'Timeline', icon: Calendar },
            { id: 'milestones', label: 'Milestones', icon: TrendingUp },
            { id: 'photos', label: 'Photos', icon: Image },
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

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-orange-500" />
                Project Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Current Phase</Label>
                <div className="mt-1">
                  <Badge className={`${getPhaseColor(project.current_phase)} text-orange-50`}>
                    {project.current_phase.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Overall Progress</Label>
                <div className="mt-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress_percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 mt-1">{project.progress_percentage}%</span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Days Remaining</Label>
                <div className="mt-1">
                  <span className={`text-lg font-semibold ${project.daysRemaining <= 7 ? 'text-red-600' : project.daysRemaining <= 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {project.daysRemaining} days
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Project Status</Label>
                <div className="mt-1">
                  <Badge className={`${getStatusColor(project.status)} text-orange-50`}>
                    {getStatusLabel(project.status)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Milestone Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-orange-500" />
                Milestone Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{stats.totalMilestones}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.completedMilestones}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.inProgressMilestones}</div>
                  <div className="text-sm text-gray-600">In Progress</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{stats.delayedMilestones}</div>
                  <div className="text-sm text-gray-600">Delayed</div>
                </div>
              </div>
              
              {stats.totalEstimatedCost > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Estimated Cost:</span>
                    <span className="font-medium">{formatCurrency(stats.totalEstimatedCost)}</span>
                  </div>
                  {stats.totalActualCost > 0 && (
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span className="text-gray-600">Actual Cost:</span>
                      <span className="font-medium">{formatCurrency(stats.totalActualCost)}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="space-y-6">
          {/* Project Timeline Controls */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-orange-500" />
                  Project Timeline Management
                </CardTitle>
                {timelineForm.hasChanges && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleResetTimelineChanges}
                      disabled={saving}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleSaveTimelineChanges}
                      disabled={saving}
                      className="px-4 py-1 text-sm bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 flex items-center space-x-2"
                    >
                      {saving && <Loader2 className="h-3 w-3 animate-spin" />}
                      <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                )}
                
                {/* 🔧 NEW: Success message display */}
                {successMessage && (
                  <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-1 rounded-md">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">{successMessage}</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Timeline Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="start_date" className="text-sm font-medium text-gray-700">
                    Project Start Date
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={timelineForm.start_date?.split('T')[0] || ''}
                    className="mt-1"
                    onChange={(e) => handleTimelineFormChange('start_date', e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="expected_completion" className="text-sm font-medium text-gray-700">
                    Expected Completion
                  </Label>
                  <Input
                    id="expected_completion"
                    type="date"
                    value={timelineForm.expected_completion?.split('T')[0] || ''}
                    className="mt-1"
                    onChange={(e) => handleTimelineFormChange('expected_completion', e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="actual_completion" className="text-sm font-medium text-gray-700">
                    Actual Completion
                  </Label>
                  <Input
                    id="actual_completion"
                    type="date"
                    value={timelineForm.actual_completion?.split('T')[0] || ''}
                    className="mt-1"
                    onChange={(e) => handleTimelineFormChange('actual_completion', e.target.value)}
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Current Phase Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Current Project Phase
                  </Label>
                  <Select 
                    value={timelineForm.current_phase} 
                    onValueChange={(value) => handleTimelineFormChange('current_phase', value)}
                    disabled={saving}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select current phase" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="site_preparation">Site Preparation</SelectItem>
                      <SelectItem value="foundation">Foundation</SelectItem>
                      <SelectItem value="structure">Structure</SelectItem>
                      <SelectItem value="roofing">Roofing</SelectItem>
                      <SelectItem value="electrical">Electrical</SelectItem>
                      <SelectItem value="plumbing">Plumbing</SelectItem>
                      <SelectItem value="interior">Interior</SelectItem>
                      <SelectItem value="finishing">Finishing</SelectItem>
                      <SelectItem value="landscaping">Landscaping</SelectItem>
                      <SelectItem value="permits">Permits</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Progress Percentage Control */}
                {/* <div>
                  <Label htmlFor="progress_percentage" className="text-sm font-medium text-gray-700">
                    Progress Percentage
                  </Label>
                  <div className="mt-1 flex items-center space-x-3">
                    <Input
                      id="progress_percentage"
                      type="number"
                      min="0"
                      max="100"
                      value={timelineForm.progress_percentage}
                      className="flex-1"
                      onChange={(e) => handleTimelineFormChange('progress_percentage', parseInt(e.target.value) || 0)}
                      disabled={saving}
                    />
                    <span className="text-sm text-gray-500">%</span>
                    
                    {/* 🔧 NEW: Auto-calculate progress button */}
                    {/*<button
                      type="button"
                      onClick={handleRecalculateProgress}
                      disabled={saving || !projectId}
                      className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50 flex items-center space-x-1"
                      title="Calculate progress based on milestone completion"
                    >
                      <TrendingUp className="h-3 w-3" />
                      <span>Auto-Calculate</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Manual override or use "Auto-Calculate" to compute from milestones
                  </p>
                </div> */}
              </div>

              {/* Timeline Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Timeline Summary</h4>
                  {project?.updated_at && (
                    <div className="text-xs text-gray-500">
                      Last updated: {new Date(project.updated_at).toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Started:</span>
                    <div className="font-medium">{formatDate(timelineForm.start_date || project.start_date)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Expected Completion:</span>
                    <div className="font-medium">{formatDate(timelineForm.expected_completion || project.expected_completion)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Days Remaining:</span>
                    <div className={`font-medium ${
                      project.daysRemaining <= 7 ? 'text-red-600' : 
                      project.daysRemaining <= 30 ? 'text-yellow-600' : 
                      'text-green-600'
                    }`}>
                      {project.daysRemaining} days
                    </div>
                  </div>
                </div>
                
                {timelineForm.hasChanges && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center text-blue-800">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">You have unsaved changes</span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Click "Save Changes" to apply your updates to the mobile app.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'milestones' && (
        <div className="space-y-6">
          {/* Milestones Header */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Project Milestones</h3>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-orange-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Milestone
            </Button>
          </div>

          {/* Milestones List */}
          <div className="space-y-4">
            {milestones.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No milestones yet</h3>
                  <p className="text-gray-600 mb-4">Start by creating your first project milestone.</p>
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-orange-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Milestone
                  </Button>
                </CardContent>
              </Card>
            ) : (
              milestones.map((milestone) => (
                <Card key={milestone.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">{milestone.milestone_name}</h4>
                          <Badge className={`${getStatusColor(milestone.status)} text-orange-50`}>
                            {getStatusLabel(milestone.status)}
                          </Badge>
                          <Badge className={`${getPhaseColor(milestone.phase_category)} text-orange-50`}>
                            {milestone.phase_category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        </div>
                        
                        {milestone.description && (
                          <p className="text-gray-600 mb-3">{milestone.description}</p>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Planned:</span>
                            <div>{formatDate(milestone.planned_start)} - {formatDate(milestone.planned_end)}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Progress:</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${milestone.progress_percentage}%` }}
                                />
                              </div>
                              <span className="font-medium">{milestone.progress_percentage}%</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Estimated Cost:</span>
                            <div className="font-medium">
                              {milestone.estimated_cost ? formatCurrency(milestone.estimated_cost) : 'Not set'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          onClick={() => handleEditMilestone(milestone)}
                          variant="outline"
                          size="sm"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteMilestone(milestone.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'photos' && (
        <div className="space-y-6">
          {/* Photos Header */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Progress Photos</h3>
              <p className="text-sm text-gray-600">
                {progressPhotos.length} photo{progressPhotos.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button
              onClick={() => setShowPhotoUploadModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-orange-50"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Photos
            </Button>
          </div>

          {/* Photos Grid */}
          {progressPhotos.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No progress photos yet</h3>
                <p className="text-gray-600">Progress photos will appear here when uploaded from the mobile app.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {progressPhotos.map((photo) => (
                <Card key={photo.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-w-16 aspect-h-12 bg-gray-200">
                    <img
                      src={photo.photo_url}
                      alt={photo.photo_title || 'Progress photo'}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">
                        {photo.photo_title || 'Untitled Photo'}
                      </h4>
                      <div className="flex items-center space-x-1">
                        <Badge 
                          className={`text-xs ${
                            photo.processing_status === 'approved' ? 'bg-green-100 text-green-800' :
                            photo.processing_status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {photo.processing_status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    
                    {photo.description && (
                      <p className="text-sm text-gray-600 mb-3">{photo.description}</p>
                    )}
                    
                    <div className="text-xs text-gray-500 space-y-1 mb-3">
                      <div>Phase: {photo.phase_category.replace('_', ' ')}</div>
                      <div>Taken: {formatDate(photo.date_taken)}</div>
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          {photo.views_count}
                        </span>
                        {photo.is_featured && (
                          <Badge className="bg-orange-100 text-orange-800 text-xs">Featured</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      {photo.processing_status === 'pending_approval' && (
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleApprovePhoto(photo.id)}
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-orange-50"
                            disabled={updating}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleDeletePhoto(photo.id, 'Rejected by admin')}
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            disabled={updating}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                      
                      {photo.processing_status === 'approved' && (
                        <Button
                          onClick={() => handleDeletePhoto(photo.id, 'Removed by admin')}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          disabled={updating}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Milestone Modal */}
      {showCreateModal && (
        <MilestoneCreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          projectId={projectId}
          onMilestoneCreated={handleCreateMilestone}
        />
      )}

      {/* Edit Milestone Modal */}
      {showEditModal && selectedMilestone && (
        <MilestoneEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedMilestone(null);
          }}
          milestone={selectedMilestone}
          onMilestoneUpdated={handleUpdateMilestone}
        />
      )}

      {/* Photo Upload Modal */}
      {showPhotoUploadModal && (
        <PhotoUploadModal
          isOpen={showPhotoUploadModal}
          onClose={() => setShowPhotoUploadModal(false)}
          projectId={projectId}
          onUploadSuccess={() => {
            setShowPhotoUploadModal(false);
            fetchProgressData();
          }}
        />
      )}
    </div>
  );
}

// Create Modal Component
interface MilestoneCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onMilestoneCreated: (milestone: Milestone) => void;
}

function MilestoneCreateModal({ isOpen, onClose, projectId, onMilestoneCreated }: MilestoneCreateModalProps) {
  const [formData, setFormData] = useState({
    milestone_name: '',
    description: '',
    phase_category: 'general',
    planned_start: '',
    planned_end: '',
    status: 'not_started' as const,
    progress_percentage: 0,
    estimated_cost: '',
    responsible_contractor: '',
    notes: '',
    order_index: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.milestone_name || !formData.planned_start || !formData.planned_end) {
      setErrors({
        milestone_name: !formData.milestone_name ? 'Milestone name is required' : '',
        planned_start: !formData.planned_start ? 'Start date is required' : '',
        planned_end: !formData.planned_end ? 'End date is required' : '',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const milestoneData = {
        ...formData,
        project_id: projectId,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
      };

      const response = await fetch('/api/mobile-control/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          projectId,
          milestoneData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onMilestoneCreated(result.data);
        onClose();
      } else {
        throw new Error(result.error || 'Failed to create milestone');
      }
    } catch (error) {
      console.error('❌ Error creating milestone:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to create milestone' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Create New Milestone</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label className="text-gray-900" htmlFor="milestone_name">Milestone Name *</Label>
              <Input
                value={formData.milestone_name}
                onChange={(e) => setFormData(prev => ({ ...prev, milestone_name: e.target.value }))}
                className={errors.milestone_name ? 'border-red-500' : ''}
              />
              {errors.milestone_name && (
                <p className="text-sm text-red-600 mt-1">{errors.milestone_name}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label className="text-gray-900" htmlFor="description">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className='bg-white text-gray-900'
              />
            </div>

            <div>
              <Label className="text-gray-900" htmlFor="phase_category">Phase Category</Label>
              <Select 
                value={formData.phase_category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, phase_category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="site_preparation">Site Preparation</SelectItem>
                  <SelectItem value="foundation">Foundation</SelectItem>
                  <SelectItem value="structure">Structure</SelectItem>
                  <SelectItem value="roofing">Roofing</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="interior">Interior</SelectItem>
                  <SelectItem value="finishing">Finishing</SelectItem>
                  <SelectItem value="landscaping">Landscaping</SelectItem>
                  <SelectItem value="permits">Permits</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-900" htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-900" htmlFor="planned_start">Start Date *</Label>
              <Input
                type="date"
                value={formData.planned_start}
                onChange={(e) => setFormData(prev => ({ ...prev, planned_start: e.target.value }))}
                className={errors.planned_start ? 'border-red-500' : ''}
              />
              {errors.planned_start && (
                <p className="text-sm text-red-600 mt-1">{errors.planned_start}</p>
              )}
            </div>

            <div>
              <Label className="text-gray-900" htmlFor="planned_end">End Date *</Label>
              <Input
                type="date"
                value={formData.planned_end}
                onChange={(e) => setFormData(prev => ({ ...prev, planned_end: e.target.value }))}
                className={errors.planned_end ? 'border-red-500' : ''}
              />
              {errors.planned_end && (
                <p className="text-sm text-red-600 mt-1">{errors.planned_end}</p>
              )}
            </div>

            <div>
              <Label className="text-gray-900" htmlFor="progress_percentage">Progress (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.progress_percentage}
                onChange={(e) => setFormData(prev => ({ ...prev, progress_percentage: Number(e.target.value) }))}
              />
            </div>

            <div>
              <Label className="text-gray-900" htmlFor="estimated_cost">Estimated Cost (USD)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.estimated_cost}
                onChange={(e) => setFormData(prev => ({ ...prev, estimated_cost: e.target.value }))}
              />
            </div>

            <div className="md:col-span-2">
              <Label className="text-gray-900" htmlFor="responsible_contractor">Responsible Contractor</Label>
              <Input
                value={formData.responsible_contractor}
                onChange={(e) => setFormData(prev => ({ ...prev, responsible_contractor: e.target.value }))}
              />
            </div>

            <div className="md:col-span-2">
              <Label className="text-gray-900" htmlFor="notes">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className='bg-white text-gray-900'
              />
            </div>
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-orange-500 hover:bg-orange-600 text-orange-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Milestone'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Modal Component
interface MilestoneEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: Milestone;
  onMilestoneUpdated: (milestone: Milestone) => void;
}

function MilestoneEditModal({ isOpen, onClose, milestone, onMilestoneUpdated }: MilestoneEditModalProps) {
  const [formData, setFormData] = useState({
    milestone_name: milestone.milestone_name,
    description: milestone.description || '',
    phase_category: milestone.phase_category,
    planned_start: milestone.planned_start,
    planned_end: milestone.planned_end,
    actual_start: milestone.actual_start || '',
    actual_end: milestone.actual_end || '',
    status: milestone.status,
    progress_percentage: milestone.progress_percentage,
    estimated_cost: milestone.estimated_cost?.toString() || '',
    actual_cost: milestone.actual_cost?.toString() || '',
    responsible_contractor: milestone.responsible_contractor || '',
    notes: milestone.notes || '',
    order_index: milestone.order_index,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.milestone_name || !formData.planned_start || !formData.planned_end) {
      setErrors({
        milestone_name: !formData.milestone_name ? 'Milestone name is required' : '',
        planned_start: !formData.planned_start ? 'Start date is required' : '',
        planned_end: !formData.planned_end ? 'End date is required' : '',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const milestoneData = {
        ...formData,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
        actual_cost: formData.actual_cost ? parseFloat(formData.actual_cost) : null,
        actual_start: formData.actual_start || null,
        actual_end: formData.actual_end || null,
      };

      const response = await fetch('/api/mobile-control/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          milestoneId: milestone.id,
          milestoneData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onMilestoneUpdated(result.data);
        onClose();
      } else {
        throw new Error(result.error || 'Failed to update milestone');
      }
    } catch (error) {
      console.error('❌ Error updating milestone:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to update milestone' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Edit Milestone</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="milestone_name" className='text-gray-900'>Milestone Name *</Label>
              <Input
                value={formData.milestone_name}
                onChange={(e) => setFormData(prev => ({ ...prev, milestone_name: e.target.value }))}
                className={errors.milestone_name ? 'border-red-500' : ''}
              />
              {errors.milestone_name && (
                <p className="text-sm text-red-600 mt-1">{errors.milestone_name}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description" className='text-gray-900'>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className='bg-white text-gray-900'
              />
            </div>

            <div>
              <Label htmlFor="phase_category" className='text-gray-900'>Phase Category</Label>
              <Select 
                value={formData.phase_category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, phase_category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="site_preparation">Site Preparation</SelectItem>
                  <SelectItem value="foundation">Foundation</SelectItem>
                  <SelectItem value="structure">Structure</SelectItem>
                  <SelectItem value="roofing">Roofing</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="interior">Interior</SelectItem>
                  <SelectItem value="finishing">Finishing</SelectItem>
                  <SelectItem value="landscaping">Landscaping</SelectItem>
                  <SelectItem value="permits">Permits</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status" className='text-gray-900'>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="planned_start" className='text-gray-900'>Planned Start *</Label>
              <Input
                type="date"
                value={formData.planned_start}
                onChange={(e) => setFormData(prev => ({ ...prev, planned_start: e.target.value }))}
                className={errors.planned_start ? 'border-red-500' : ''}
              />
              {errors.planned_start && (
                <p className="text-sm text-red-600 mt-1">{errors.planned_start}</p>
              )}
            </div>

            <div>
              <Label htmlFor="planned_end" className='text-gray-900'>Planned End *</Label>
              <Input
                type="date"
                value={formData.planned_end}
                onChange={(e) => setFormData(prev => ({ ...prev, planned_end: e.target.value }))}
                className={errors.planned_end ? 'border-red-500' : ''}
              />
              {errors.planned_end && (
                <p className="text-sm text-red-600 mt-1">{errors.planned_end}</p>
              )}
            </div>

            <div>
              <Label htmlFor="actual_start" className='text-gray-900'>Actual Start</Label>
              <Input
                type="date"
                value={formData.actual_start}
                onChange={(e) => setFormData(prev => ({ ...prev, actual_start: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="actual_end" className='text-gray-900'>Actual End</Label>
              <Input
                type="date"
                value={formData.actual_end}
                onChange={(e) => setFormData(prev => ({ ...prev, actual_end: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="progress_percentage" className='text-gray-900'>Progress (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.progress_percentage}
                onChange={(e) => setFormData(prev => ({ ...prev, progress_percentage: Number(e.target.value) }))}
              />
            </div>

            <div>
              <Label htmlFor="order_index" className='text-gray-900'>Order Index</Label>
              <Input
                type="number"
                min="0"
                value={formData.order_index}
                onChange={(e) => setFormData(prev => ({ ...prev, order_index: Number(e.target.value) }))}
              />
            </div>

            <div>
              <Label htmlFor="estimated_cost" className='text-gray-900'>Estimated Cost (USD)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.estimated_cost}
                onChange={(e) => setFormData(prev => ({ ...prev, estimated_cost: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="actual_cost" className='text-gray-900'>Actual Cost (USD)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.actual_cost}
                onChange={(e) => setFormData(prev => ({ ...prev, actual_cost: e.target.value }))}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="responsible_contractor" className='text-gray-900'>Responsible Contractor</Label>
              <Input
                value={formData.responsible_contractor}
                onChange={(e) => setFormData(prev => ({ ...prev, responsible_contractor: e.target.value }))}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="notes" className='text-gray-900'>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className='bg-white text-gray-900'
              />
            </div>
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-orange-500 hover:bg-orange-600 text-orange-50"
            >
              {isSubmitting ? 'Updating...' : 'Update Milestone'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 
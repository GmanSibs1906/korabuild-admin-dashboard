'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Types for mobile app progress data control
interface MobileProgressData {
  currentStage: string;
  completionPercentage: number;
  daysLeft: number;
  milestoneStatus: {
    completed: number;
    inProgress: number;
    notStarted: number;
  };
}

interface MobileTimelineData {
  startDate: string;
  endDate: string;
  currentPhase: string;
  phaseDuration: number;
}

interface MobileMilestoneData {
  id: string;
  name: string;
  status: 'completed' | 'in_progress' | 'not_started';
  progressPercentage: number;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
}

interface MobilePhotoData {
  id: string;
  url: string;
  title: string;
  description: string;
  phaseCategory: string;
  photoType: string;
  dateTaken: string;
  uploadedBy: string;
  gpsCoordinates?: string;
  tags: string[];
}

interface ProgressControlPanelProps {
  projectId: string;
  onDataSync?: (data: any) => void;
}

export function ProgressControlPanel({ projectId, onDataSync }: ProgressControlPanelProps) {
  const [loading, setLoading] = useState(false);
  const [progressData, setProgressData] = useState<MobileProgressData | null>(null);
  const [timelineData, setTimelineData] = useState<MobileTimelineData | null>(null);
  const [milestones, setMilestones] = useState<MobileMilestoneData[]>([]);
  const [photos, setPhotos] = useState<MobilePhotoData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Editable states
  const [editingProgress, setEditingProgress] = useState(false);
  const [editingTimeline, setEditingTimeline] = useState(false);
  const [tempProgressData, setTempProgressData] = useState<MobileProgressData | null>(null);
  const [tempTimelineData, setTempTimelineData] = useState<MobileTimelineData | null>(null);

  // Load mobile app progress data
  const loadProgressData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/mobile-control/progress?projectId=${projectId}`);
      const result = await response.json();
      
      if (result.success) {
        setProgressData(result.data.progress);
        setTimelineData(result.data.timeline);
        setMilestones(result.data.milestones);
        setPhotos(result.data.photos);
        setLastUpdated(result.data.lastUpdated);
        
        // Notify parent of data sync
        if (onDataSync) {
          onDataSync(result.data);
        }
      } else {
        setError(result.error || 'Failed to load progress data');
      }
    } catch (err) {
      setError('Network error loading progress data');
      console.error('Error loading progress data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update mobile app progress data
  const updateProgressData = async (updateType: string, data: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/mobile-control/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          updateType,
          data,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Reload data to reflect changes
        await loadProgressData();
        setError(null);
      } else {
        setError(result.error || 'Failed to update progress data');
      }
    } catch (err) {
      setError('Network error updating progress data');
      console.error('Error updating progress data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update milestone status
  const updateMilestoneStatus = async (milestoneId: string, status: 'completed' | 'in_progress' | 'not_started') => {
    await updateProgressData('milestone', {
      milestoneId,
      status,
      progressPercentage: status === 'completed' ? 100 : status === 'in_progress' ? 50 : 0,
    });
  };

  // Save progress changes
  const saveProgressChanges = async () => {
    if (tempProgressData) {
      await updateProgressData('progress', tempProgressData);
      setEditingProgress(false);
      setTempProgressData(null);
    }
  };

  // Save timeline changes
  const saveTimelineChanges = async () => {
    if (tempTimelineData) {
      await updateProgressData('timeline', tempTimelineData);
      setEditingTimeline(false);
      setTempTimelineData(null);
    }
  };

  // Cancel edits
  const cancelProgressEdit = () => {
    setEditingProgress(false);
    setTempProgressData(null);
  };

  const cancelTimelineEdit = () => {
    setEditingTimeline(false);
    setTempTimelineData(null);
  };

  // Initialize data on component mount
  useEffect(() => {
    loadProgressData();
  }, [projectId]);

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-orange-500';
      case 'not_started': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  if (loading && !progressData) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">Loading mobile app progress data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mobile App Progress Control</h2>
          <p className="text-sm text-gray-600">
            Control what users see in their mobile app regarding building progress and timeline
          </p>
        </div>
        <Button
          onClick={loadProgressData}
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          {loading ? <LoadingSpinner className="w-4 h-4" /> : null}
          Refresh Data
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Data Control */}
      {progressData && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Building Progress Control</h3>
            {!editingProgress ? (
              <Button
                onClick={() => {
                  setEditingProgress(true);
                  setTempProgressData({ ...progressData });
                }}
                size="sm"
                className="bg-orange-500 hover:bg-orange-600"
              >
                Edit Progress
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={saveProgressChanges}
                  size="sm"
                  className="bg-green-500 hover:bg-green-600"
                  disabled={loading}
                >
                  Save Changes
                </Button>
                <Button
                  onClick={cancelProgressEdit}
                  size="sm"
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Current Stage */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Stage</label>
              {editingProgress ? (
                <input
                  type="text"
                  value={tempProgressData?.currentStage || ''}
                  onChange={(e) => setTempProgressData(prev => prev ? { ...prev, currentStage: e.target.value } : null)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              ) : (
                <p className="text-lg font-semibold text-gray-900">{progressData.currentStage}</p>
              )}
            </div>

            {/* Completion Percentage */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Completion %</label>
              {editingProgress ? (
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={tempProgressData?.completionPercentage || 0}
                  onChange={(e) => setTempProgressData(prev => prev ? { ...prev, completionPercentage: parseInt(e.target.value) } : null)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              ) : (
                <p className="text-lg font-semibold text-gray-900">{progressData.completionPercentage}%</p>
              )}
            </div>

            {/* Days Left */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Days Left</label>
              <p className="text-lg font-semibold text-gray-900">{progressData.daysLeft}</p>
              <p className="text-xs text-gray-500">Auto-calculated from timeline</p>
            </div>

            {/* Milestone Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Milestone Status</label>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Completed:</span>
                  <Badge className="bg-green-500">{progressData.milestoneStatus.completed}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">In Progress:</span>
                  <Badge className="bg-orange-500">{progressData.milestoneStatus.inProgress}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Not Started:</span>
                  <Badge className="bg-gray-400">{progressData.milestoneStatus.notStarted}</Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Timeline Data Control */}
      {timelineData && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Timeline Control</h3>
            {!editingTimeline ? (
              <Button
                onClick={() => {
                  setEditingTimeline(true);
                  setTempTimelineData({ ...timelineData });
                }}
                size="sm"
                className="bg-orange-500 hover:bg-orange-600"
              >
                Edit Timeline
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={saveTimelineChanges}
                  size="sm"
                  className="bg-green-500 hover:bg-green-600"
                  disabled={loading}
                >
                  Save Changes
                </Button>
                <Button
                  onClick={cancelTimelineEdit}
                  size="sm"
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Start Date */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              {editingTimeline ? (
                <input
                  type="date"
                  value={tempTimelineData?.startDate || ''}
                  onChange={(e) => setTempTimelineData(prev => prev ? { ...prev, startDate: e.target.value } : null)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              ) : (
                <p className="text-lg font-semibold text-gray-900">{new Date(timelineData.startDate).toLocaleDateString()}</p>
              )}
            </div>

            {/* End Date */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              {editingTimeline ? (
                <input
                  type="date"
                  value={tempTimelineData?.endDate || ''}
                  onChange={(e) => setTempTimelineData(prev => prev ? { ...prev, endDate: e.target.value } : null)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              ) : (
                <p className="text-lg font-semibold text-gray-900">{new Date(timelineData.endDate).toLocaleDateString()}</p>
              )}
            </div>

            {/* Current Phase */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Phase</label>
              {editingTimeline ? (
                <input
                  type="text"
                  value={tempTimelineData?.currentPhase || ''}
                  onChange={(e) => setTempTimelineData(prev => prev ? { ...prev, currentPhase: e.target.value } : null)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              ) : (
                <p className="text-lg font-semibold text-gray-900">{timelineData.currentPhase}</p>
              )}
            </div>

            {/* Phase Duration */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Phase Duration</label>
              <p className="text-lg font-semibold text-gray-900">{timelineData.phaseDuration} days</p>
              <p className="text-xs text-gray-500">Auto-calculated</p>
            </div>
          </div>
        </Card>
      )}

      {/* Milestones Control */}
      {milestones.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Milestone Control</h3>
          <div className="space-y-4">
            {milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium text-gray-900">{milestone.name}</h4>
                    <Badge
                      className={`${getStatusColor(milestone.status)} text-white`}
                    >
                      {milestone.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <span>Progress: {milestone.progressPercentage}%</span>
                    <span className="mx-2">•</span>
                    <span>Planned: {new Date(milestone.plannedStart).toLocaleDateString()} - {new Date(milestone.plannedEnd).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => updateMilestoneStatus(milestone.id, 'not_started')}
                    size="sm"
                    variant="outline"
                    className="bg-gray-100 hover:bg-gray-200"
                    disabled={loading}
                  >
                    Not Started
                  </Button>
                  <Button
                    onClick={() => updateMilestoneStatus(milestone.id, 'in_progress')}
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600"
                    disabled={loading}
                  >
                    In Progress
                  </Button>
                  <Button
                    onClick={() => updateMilestoneStatus(milestone.id, 'completed')}
                    size="sm"
                    className="bg-green-500 hover:bg-green-600"
                    disabled={loading}
                  >
                    Completed
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Photos */}
      {photos.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Progress Photos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.slice(0, 6).map((photo) => (
              <div key={photo.id} className="bg-gray-50 rounded-lg p-4">
                <div className="aspect-video bg-gray-200 rounded-md mb-3 flex items-center justify-center">
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-full h-full object-cover rounded-md"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">{photo.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{photo.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{photo.phaseCategory}</span>
                  <span>{new Date(photo.dateTaken).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Sync Status */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-blue-900">Mobile App Sync Status</h4>
            <p className="text-sm text-blue-700">
              Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Never'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-blue-700">Synced</span>
          </div>
        </div>
      </Card>
    </div>
  );
} 
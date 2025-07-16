'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { LoadingSpinner } from '../ui/loading-spinner';
import { X, Upload, Plus, Calendar, Tag, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ManualUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onUpdateCreated: (update: ProjectUpdate) => void;
}

interface ProjectUpdate {
  id: string;
  project_id: string;
  milestone_id?: string;
  update_type: string;
  title: string;
  description: string;
  photo_urls: string[];
  update_priority: string;
  visibility: string;
  is_pinned: boolean;
  created_by: string;
  created_at: string;
  metadata: Record<string, unknown>;
}

interface Milestone {
  id: string;
  milestone_name: string;
  phase_category: string;
  status: string;
}

export function ManualUpdateModal({ isOpen, onClose, projectId, onUpdateCreated }: ManualUpdateModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    update_type: 'note',
    update_priority: 'normal',
    visibility: 'project',
    milestone_id: '',
    photo_urls: [] as string[],
    is_pinned: false,
    metadata: {}
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');

  // Load milestones when modal opens
  React.useEffect(() => {
    if (isOpen && projectId) {
      fetchMilestones();
    }
  }, [isOpen, projectId]);

  const fetchMilestones = async () => {
    try {
      setLoadingMilestones(true);
      const response = await fetch(`/api/projects/${projectId}/milestones`);
      const result = await response.json();
      
      if (result.success) {
        setMilestones(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
    } finally {
      setLoadingMilestones(false);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user) {
      setErrors({ submit: 'User not authenticated' });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('📝 Admin creating manual daily update:', formData);
      console.log('🎯 Using project ID:', projectId);

      const updateData = {
        project_id: projectId,
        milestone_id: formData.milestone_id || null,
        update_type: formData.update_type,
        title: formData.title.trim(),
        description: formData.description.trim(),
        photo_urls: formData.photo_urls,
        update_priority: formData.update_priority,
        visibility: formData.visibility,
        is_pinned: formData.is_pinned,
        created_by: user.id, // Pass the actual user ID
        metadata: {
          source: 'admin_manual',
          created_via: 'admin_dashboard',
          timestamp: new Date().toISOString(),
          admin_email: user.email,
          admin_name: user.full_name,
          ...formData.metadata
        }
      };

      const response = await fetch('/api/daily-updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user.email,
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          action: 'create',
          data: updateData
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Manual daily update created successfully:', result.data);
        onUpdateCreated(result.data);
        handleClose();
      } else {
        throw new Error(result.error || 'Failed to create update');
      }
    } catch (error) {
      console.error('❌ Error creating manual update:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to create update' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      update_type: 'note',
      update_priority: 'normal',
      visibility: 'project',
      milestone_id: '',
      photo_urls: [],
      is_pinned: false,
      metadata: {}
    });
    setErrors({});
    setPhotoUrl('');
    onClose();
  };

  const addPhotoUrl = () => {
    if (photoUrl.trim() && !formData.photo_urls.includes(photoUrl.trim())) {
      setFormData(prev => ({
        ...prev,
        photo_urls: [...prev.photo_urls, photoUrl.trim()]
      }));
      setPhotoUrl('');
    }
  };

  const removePhotoUrl = (urlToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      photo_urls: prev.photo_urls.filter(url => url !== urlToRemove)
    }));
  };

  const getUpdateTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      milestone: 'bg-blue-100 text-blue-800',
      payment: 'bg-green-100 text-green-800',
      delivery: 'bg-purple-100 text-purple-800',
      photo: 'bg-pink-100 text-pink-800',
      note: 'bg-gray-100 text-gray-800',
      approval: 'bg-yellow-100 text-yellow-800',
      weather: 'bg-cyan-100 text-cyan-800',
      delay: 'bg-red-100 text-red-800',
      completion: 'bg-emerald-100 text-emerald-800'
    };
    return colors[type] || colors.note;
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || colors.normal;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Create Manual Daily Update</h2>
            <p className="text-sm text-gray-600 mt-1">Add a daily update that will appear on the mobile app</p>
          </div>
          <Button
            onClick={handleClose}
            variant="outline"
            size="sm"
            className="p-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-gray-700">
              Update Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Foundation work completed on west wing"
              className={errors.title ? 'border-red-500' : ''}
              maxLength={100}
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.title}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">{formData.title.length}/100 characters</p>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Provide detailed information about today's progress, issues, or observations..."
              rows={4}
              className={errors.description ? 'border-red-500' : ''}
              maxLength={1000}
            />
            {errors.description && (
              <p className="text-sm text-red-600 mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.description}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">{formData.description.length}/1000 characters</p>
          </div>

          {/* Update Type and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Update Type</Label>
              <Select 
                value={formData.update_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, update_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">Progress Note</SelectItem>
                  <SelectItem value="milestone">Milestone Update</SelectItem>
                  <SelectItem value="completion">Work Completion</SelectItem>
                  <SelectItem value="delay">Delay Report</SelectItem>
                  <SelectItem value="weather">Weather Impact</SelectItem>
                  <SelectItem value="delivery">Material Delivery</SelectItem>
                  <SelectItem value="approval">Approval Status</SelectItem>
                  <SelectItem value="photo">Photo Documentation</SelectItem>
                </SelectContent>
              </Select>
              <Badge className={`mt-2 ${getUpdateTypeColor(formData.update_type)}`}>
                {formData.update_type.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Priority Level</Label>
              <Select 
                value={formData.update_priority} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, update_priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="normal">Normal Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Badge className={`mt-2 ${getPriorityColor(formData.update_priority)}`}>
                {formData.update_priority.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Milestone Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-700">Related Milestone (Optional)</Label>
            <Select 
              value={formData.milestone_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, milestone_id: value }))}
              disabled={loadingMilestones}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingMilestones ? "Loading milestones..." : "Select a milestone"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No milestone</SelectItem>
                {milestones.map((milestone) => (
                  <SelectItem key={milestone.id} value={milestone.id}>
                    <div className="flex items-center space-x-2">
                      <span>{milestone.milestone_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {milestone.phase_category}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Photo URLs */}
          <div>
            <Label className="text-sm font-medium text-gray-700">Photo URLs (Optional)</Label>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Input
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={addPhotoUrl}
                  variant="outline"
                  size="sm"
                  disabled={!photoUrl.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {formData.photo_urls.length > 0 && (
                <div className="space-y-2">
                  {formData.photo_urls.map((url, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                      <span className="flex-1 text-sm text-gray-700 truncate">{url}</span>
                      <Button
                        type="button"
                        onClick={() => removePhotoUrl(url)}
                        variant="outline"
                        size="sm"
                        className="p-1"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Visibility</Label>
              <Select 
                value={formData.visibility} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, visibility: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public (All Users)</SelectItem>
                  <SelectItem value="project">Project Team</SelectItem>
                  <SelectItem value="milestone">Milestone Specific</SelectItem>
                  <SelectItem value="private">Admin Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="is_pinned"
                checked={formData.is_pinned}
                onChange={(e) => setFormData(prev => ({ ...prev, is_pinned: e.target.checked }))}
                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <Label htmlFor="is_pinned" className="text-sm font-medium text-gray-700">
                Pin this update (appears at top)
              </Label>
            </div>
          </div>

          {/* Error Display */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {errors.submit}
              </p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-orange-500 hover:bg-orange-600 text-orange-50"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Creating Update...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Create Daily Update
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 
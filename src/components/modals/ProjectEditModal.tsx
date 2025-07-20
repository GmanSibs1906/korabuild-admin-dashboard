'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { X, Building2, MapPin, DollarSign, Calendar, User, FileText, Edit } from 'lucide-react';

interface ProjectEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  onProjectUpdated: (project: any) => void;
}

interface ProjectFormData {
  project_name: string;
  project_address: string;
  contract_value: string;
  start_date: string;
  expected_completion: string;
  actual_completion: string;
  description: string;
  current_phase: string;
  status: string;
  progress_percentage: string;
}

const PROJECT_PHASES = [
  'Planning',
  'Site Preparation',
  'Foundation',
  'Structure',
  'Roofing',
  'Electrical',
  'Plumbing',
  'Interior',
  'Finishing',
  'Landscaping',
  'Final Inspection'
];

const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

export function ProjectEditModal({
  isOpen,
  onClose,
  project,
  onProjectUpdated,
}: ProjectEditModalProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    project_name: '',
    project_address: '',
    contract_value: '',
    start_date: '',
    expected_completion: '',
    actual_completion: '',
    description: '',
    current_phase: 'Planning',
    status: 'planning',
    progress_percentage: '0',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Populate form when project or modal opens
  useEffect(() => {
    if (isOpen && project) {
      setFormData({
        project_name: project.project_name || '',
        project_address: project.project_address || '',
        contract_value: project.contract_value?.toString() || '',
        start_date: project.start_date || '',
        expected_completion: project.expected_completion || '',
        actual_completion: project.actual_completion || '',
        description: project.description || '',
        current_phase: project.current_phase || 'Planning',
        status: project.status || 'planning',
        progress_percentage: project.progress_percentage?.toString() || '0',
      });
      setErrors({});
    }
  }, [isOpen, project]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.project_name.trim()) {
      newErrors.project_name = 'Project name is required';
    }

    if (!formData.project_address.trim()) {
      newErrors.project_address = 'Project address is required';
    }

    if (!formData.contract_value || isNaN(parseFloat(formData.contract_value))) {
      newErrors.contract_value = 'Valid contract value is required';
    } else if (parseFloat(formData.contract_value) <= 0) {
      newErrors.contract_value = 'Contract value must be greater than 0';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.expected_completion) {
      newErrors.expected_completion = 'Expected completion date is required';
    }

    if (formData.start_date && formData.expected_completion) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.expected_completion);
      
      if (endDate <= startDate) {
        newErrors.expected_completion = 'Completion date must be after start date';
      }
    }

    if (formData.actual_completion && formData.start_date) {
      const startDate = new Date(formData.start_date);
      const actualEndDate = new Date(formData.actual_completion);
      
      if (actualEndDate < startDate) {
        newErrors.actual_completion = 'Actual completion date cannot be before start date';
      }
    }

    if (formData.progress_percentage) {
      const progress = parseInt(formData.progress_percentage);
      if (isNaN(progress) || progress < 0 || progress > 100) {
        newErrors.progress_percentage = 'Progress must be between 0 and 100';
      }
    }

    if (formData.project_name.length > 100) {
      newErrors.project_name = 'Project name must be less than 100 characters';
    }

    if (formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ProjectFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const projectData = {
        ...formData,
        contract_value: parseFloat(formData.contract_value),
        progress_percentage: parseInt(formData.progress_percentage),
        actual_completion: formData.actual_completion || null,
      };

      console.log('🏗️ Updating project:', project.id, projectData);

      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update project');
      }

      console.log('✅ Project updated successfully:', result.project);
      onProjectUpdated(result.project);
      onClose();
    } catch (error) {
      console.error('❌ Error updating project:', error);
      setErrors({ 
        submit: error instanceof Error ? error.message : 'Failed to update project'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Edit className="h-6 w-6 text-orange-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Project</h2>
              <p className="text-sm text-gray-500">
                Update project information and settings
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Project Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-orange-600" />
                <span>Project Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Project Name */}
                <div className="md:col-span-2">
                  <Label htmlFor="project_name">Project Name *</Label>
                  <Input
                    id="project_name"
                    value={formData.project_name}
                    onChange={(e) => handleInputChange('project_name', e.target.value)}
                    className={errors.project_name ? 'border-red-500' : ''}
                    placeholder="Enter project name"
                    disabled={isSubmitting}
                  />
                  {errors.project_name && (
                    <p className="text-sm text-red-600 mt-1">{errors.project_name}</p>
                  )}
                </div>

                {/* Project Address */}
                <div className="md:col-span-2">
                  <Label htmlFor="project_address">Project Address *</Label>
                  <Textarea
                    id="project_address"
                    value={formData.project_address}
                    onChange={(e) => handleInputChange('project_address', e.target.value)}
                    className={errors.project_address ? 'border-red-500' : ''}
                    placeholder="Enter complete project address"
                    rows={2}
                    disabled={isSubmitting}
                  />
                  {errors.project_address && (
                    <p className="text-sm text-red-600 mt-1">{errors.project_address}</p>
                  )}
                </div>

                {/* Contract Value */}
                <div>
                  <Label htmlFor="contract_value">Contract Value (USD) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="contract_value"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.contract_value}
                      onChange={(e) => handleInputChange('contract_value', e.target.value)}
                      className={`pl-10 ${errors.contract_value ? 'border-red-500' : ''}`}
                      placeholder="0.00"
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.contract_value && (
                    <p className="text-sm text-red-600 mt-1">{errors.contract_value}</p>
                  )}
                </div>

                {/* Progress Percentage */}
                <div>
                  <Label htmlFor="progress_percentage">Progress (%)</Label>
                  <Input
                    id="progress_percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress_percentage}
                    onChange={(e) => handleInputChange('progress_percentage', e.target.value)}
                    className={errors.progress_percentage ? 'border-red-500' : ''}
                    placeholder="0"
                    disabled={isSubmitting}
                  />
                  {errors.progress_percentage && (
                    <p className="text-sm text-red-600 mt-1">{errors.progress_percentage}</p>
                  )}
                </div>

                {/* Current Phase */}
                <div>
                  <Label htmlFor="current_phase">Current Phase</Label>
                  <Select
                    value={formData.current_phase}
                    onValueChange={(value) => handleInputChange('current_phase', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select phase" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_PHASES.map((phase) => (
                        <SelectItem key={phase} value={phase}>
                          {phase}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div>
                  <Label htmlFor="status">Project Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Start Date */}
                <div>
                  <Label htmlFor="start_date">Start Date *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => handleInputChange('start_date', e.target.value)}
                      className={`pl-10 ${errors.start_date ? 'border-red-500' : ''}`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.start_date && (
                    <p className="text-sm text-red-600 mt-1">{errors.start_date}</p>
                  )}
                </div>

                {/* Expected Completion */}
                <div>
                  <Label htmlFor="expected_completion">Expected Completion *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="expected_completion"
                      type="date"
                      value={formData.expected_completion}
                      onChange={(e) => handleInputChange('expected_completion', e.target.value)}
                      className={`pl-10 ${errors.expected_completion ? 'border-red-500' : ''}`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.expected_completion && (
                    <p className="text-sm text-red-600 mt-1">{errors.expected_completion}</p>
                  )}
                </div>

                {/* Actual Completion */}
                <div>
                  <Label htmlFor="actual_completion">Actual Completion</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="actual_completion"
                      type="date"
                      value={formData.actual_completion}
                      onChange={(e) => handleInputChange('actual_completion', e.target.value)}
                      className={`pl-10 ${errors.actual_completion ? 'border-red-500' : ''}`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.actual_completion && (
                    <p className="text-sm text-red-600 mt-1">{errors.actual_completion}</p>
                  )}
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className={errors.description ? 'border-red-500' : ''}
                    placeholder="Enter project description, requirements, and notes"
                    rows={4}
                    disabled={isSubmitting}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.description.length}/1000 characters
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center">
                <div className="text-red-500 mr-2">⚠️</div>
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Updating Project...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Update Project
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  TrendingUp, 
  Users, 
  MapPin,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { ProjectSchedule } from '@/types/schedule';
import { cn } from '@/lib/utils';

interface ProjectSelectorProps {
  schedules: ProjectSchedule[];
  onProjectSelect: (projectId: string) => void;
  selectedProjectId?: string;
}

export function ProjectSelector({ 
  schedules, 
  onProjectSelect, 
  selectedProjectId 
}: ProjectSelectorProps) {
  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white';
      case 'in_progress': return 'bg-orange-500 text-white';
      case 'on_hold': return 'bg-yellow-500 text-white';
      case 'cancelled': return 'bg-red-500 text-white';
      case 'planning': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getScheduleHealthColor = (health: string) => {
    switch (health) {
      case 'ahead': return 'text-green-600 bg-green-50 border-green-200';
      case 'on_track': return 'text-green-600 bg-green-50 border-green-200';
      case 'at_risk': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'delayed': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateDaysRemaining = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (schedules.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Schedules</h3>
        <p className="text-gray-600">No active project schedules found in the system.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Schedules</h2>
          <p className="text-gray-600">Select a project to view detailed schedule information</p>
        </div>
        <Badge className="bg-orange-100 text-orange-800">
          {schedules.length} Active Schedule{schedules.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schedules.map((schedule) => {
          const daysRemaining = calculateDaysRemaining(schedule.end_date);
          const project = schedule.projects;
          
          return (
            <Card 
              key={schedule.id}
              className={cn(
                "hover:shadow-lg transition-all duration-200 cursor-pointer border-2",
                selectedProjectId === schedule.project_id 
                  ? "border-orange-500 bg-orange-50" 
                  : "border-gray-200 hover:border-orange-300"
              )}
              onClick={() => onProjectSelect(schedule.project_id)}
            >
              <CardContent className="p-6">
                {/* Project Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {project?.project_name || 'Unknown Project'}
                    </h3>
                    <p className="text-sm text-gray-600">{schedule.schedule_name}</p>
                  </div>
                  <Badge className={getProjectStatusColor(project?.status || 'unknown')}>
                    {project?.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                  </Badge>
                </div>

                {/* Client Information */}
                {project?.users?.full_name && (
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <Users className="w-4 h-4 mr-2" />
                    {project.users.full_name}
                  </div>
                )}

                {/* Current Phase */}
                <div className="flex items-center text-sm text-gray-600 mb-4">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>Phase: </span>
                  <Badge className="ml-1 text-xs bg-gray-100 text-gray-800">
                    {project?.current_phase || 'Not Set'}
                  </Badge>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm text-gray-600">
                      {schedule.completion_percentage || project?.progress_percentage || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${schedule.completion_percentage || project?.progress_percentage || 0}%` 
                      }}
                    />
                  </div>
                </div>

                {/* Schedule Health */}
                <div className="mb-4">
                  <Badge 
                    className={cn(
                      "text-xs border",
                      getScheduleHealthColor(schedule.schedule_health)
                    )}
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {schedule.schedule_health.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>

                {/* Timeline Information */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Start:</span>
                    <span className="font-medium">{formatDate(schedule.start_date)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">End:</span>
                    <span className="font-medium">{formatDate(schedule.end_date)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Duration:</span>
                    <span className="font-medium">{schedule.baseline_duration} days</span>
                  </div>
                </div>

                {/* Days Remaining */}
                <div className={cn(
                  "mt-4 p-3 rounded-lg text-center",
                  daysRemaining < 0 ? 'bg-red-50 text-red-800' :
                  daysRemaining <= 7 ? 'bg-yellow-50 text-yellow-800' :
                  daysRemaining <= 30 ? 'bg-orange-50 text-orange-800' :
                  'bg-green-50 text-green-800'
                )}>
                  <div className="flex items-center justify-center">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="font-medium">
                      {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` :
                       daysRemaining === 0 ? 'Due today' :
                       `${daysRemaining} days remaining`}
                    </span>
                  </div>
                </div>

                {/* Delayed Warning */}
                {schedule.schedule_health === 'delayed' && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center text-red-800 text-sm">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      <span className="font-medium">Schedule requires attention</span>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <Button 
                  className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    onProjectSelect(schedule.project_id);
                  }}
                >
                  View Schedule Details
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 
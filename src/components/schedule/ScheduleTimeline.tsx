'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  Users,
  Target,
  TrendingUp,
  MapPin,
  Hammer,
  ClipboardCheck
} from 'lucide-react';
import { ProjectScheduleData, SchedulePhase, ProjectMilestone, ScheduleTask, CalendarEvent } from '@/types/schedule';
import { cn } from '@/lib/utils';

interface ScheduleTimelineProps {
  scheduleData: ProjectScheduleData;
  onPhaseUpdate?: (phaseId: string, updates: any) => void;
  onMilestoneUpdate?: (milestoneId: string, updates: any) => void;
}

export function ScheduleTimeline({ 
  scheduleData, 
  onPhaseUpdate, 
  onMilestoneUpdate 
}: ScheduleTimelineProps) {
  const { schedule, phases, tasks, milestones, calendarEvents, crewMembers, stats } = scheduleData;

  // **MOBILE APP TIMELINE STRUCTURE** - Combine all items like mobile app does
  const allTimelineItems = [
    ...(phases || []).map(item => ({ 
      ...item, 
      type: 'phase' as const, 
      date: item.planned_start_date,
      title: item.phase_name,
      description: `${item.phase_category.replace('_', ' ')} phase`,
      icon: 'phase',
      status: item.status
    })),
    ...(tasks || []).map(item => ({ 
      ...item, 
      type: 'task' as const, 
      date: item.planned_start_date,
      title: item.task_name,
      description: item.task_description || item.task_type,
      icon: 'task',
      status: item.status
    })),
    ...(milestones || []).map(item => ({ 
      ...item, 
      type: 'milestone' as const, 
      date: item.planned_start,
      title: item.milestone_name,
      description: item.description || item.phase_category,
      icon: 'milestone',
      status: item.status
    })),
    ...(calendarEvents || []).map(item => ({ 
      ...item, 
      type: 'event' as const, 
      date: item.start_datetime,
      title: item.event_title,
      description: item.event_description || item.event_type,
      icon: 'event',
      status: 'scheduled' as const // Calendar events are scheduled by default
    }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-orange-500';
      case 'delayed': return 'bg-red-500';
      case 'on_hold': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (type: string, status: string) => {
    if (status === 'completed') return <CheckCircle2 className="w-4 h-4 text-white" />;
    if (status === 'delayed' || status === 'on_hold') return <AlertCircle className="w-4 h-4 text-white" />;
    
    switch (type) {
      case 'phase': return <Hammer className="w-4 h-4 text-white" />;
      case 'task': return <ClipboardCheck className="w-4 h-4 text-white" />;
      case 'milestone': return <Target className="w-4 h-4 text-white" />;
      case 'event': return <Calendar className="w-4 h-4 text-white" />;
      default: return <Circle className="w-4 h-4 text-white" />;
    }
  };

  const getItemStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-green-500 text-green-600 bg-green-50';
      case 'in_progress': return 'border-orange-500 text-orange-600 bg-orange-50';
      case 'delayed': return 'border-red-500 text-red-600 bg-red-50';
      case 'on_hold': return 'border-yellow-500 text-yellow-600 bg-yellow-50';
      default: return 'border-gray-300 text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null;
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* **MOBILE APP HEADER** - Project and Timeline Summary */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-6 w-6" />
              <span>Main Construction Schedule</span>
            </div>
            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
              {stats.scheduleHealth.replace('_', ' ').toUpperCase()}
            </Badge>
          </CardTitle>
          <p className="text-orange-100">{schedule.projects?.project_name}</p>
        </CardHeader>
        <CardContent className="p-6">
          {/* **MOBILE APP STATISTICS** - Summary Cards showing what users see */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{stats.totalItems}</div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.completedItems}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.inProgressItems}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.overdueItems}</div>
              <div className="text-sm text-gray-600">Overdue</div>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm font-bold text-gray-900">{stats.overallProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-orange-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${stats.overallProgress}%` }}
              />
            </div>
          </div>

          {/* Timeline Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Start:</span>
              <span className="font-medium">{formatDate(schedule.start_date)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">End:</span>
              <span className="font-medium">{formatDate(schedule.end_date)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* **MOBILE APP TIMELINE** - Combined timeline showing all items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2 text-orange-500" />
            Project Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allTimelineItems.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Timeline Items</h3>
              <p className="text-gray-600">No schedule items found for this project.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

              <div className="space-y-8">
                {allTimelineItems.map((item, index) => {
                  const daysRemaining = calculateDaysRemaining(item.date);
                  const isOverdue = daysRemaining !== null && daysRemaining < 0 && item.status !== 'completed';

                  return (
                    <div key={`${item.type}-${item.id}`} className="relative">
                      {/* Timeline marker */}
                      <div className="flex items-start">
                        <div className={cn(
                          "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center z-10",
                          getStatusColor(item.status)
                        )}>
                          {getStatusIcon(item.type, item.status)}
                        </div>

                        {/* Item content */}
                        <div className="ml-6 flex-1">
                          <div className={cn(
                            "border rounded-lg p-4",
                            getItemStatusColor(item.status)
                          )}>
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-lg">{item.title}</h4>
                                <p className="text-sm text-gray-600 capitalize">
                                  {item.type} • {item.description}
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <Badge className={`text-xs ${getItemStatusColor(item.status)}`}>
                                  {item.status.replace('_', ' ')}
                                </Badge>
                                {isOverdue && (
                                  <Badge className="bg-red-100 text-red-800">
                                    {Math.abs(daysRemaining!)} days overdue
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Date:</span>
                                <div className="font-medium">{formatDate(item.date)}</div>
                              </div>
                              {(item as any).progress_percentage !== undefined && (
                                <div>
                                  <span className="text-gray-500">Progress:</span>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${(item as any).progress_percentage}%` }}
                                      />
                                    </div>
                                    <span className="font-medium">{(item as any).progress_percentage}%</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
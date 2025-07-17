'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ScheduleNotification {
  id: string;
  type: 'overdue_task' | 'upcoming_deadline' | 'milestone_delayed' | 'resource_conflict';
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  project_id: string;
  project_name: string;
  created_at: string;
  is_read: boolean;
  due_date?: string;
}

export interface ScheduleStats {
  totalTasks: number;
  overdueTasks: number;
  upcomingDeadlines: number;
  delayedMilestones: number;
  resourceConflicts: number;
  projectsAtRisk: number;
  unreadNotifications: number;
}

export interface UseScheduleResult {
  stats: ScheduleStats;
  notifications: ScheduleNotification[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export function useSchedule(): UseScheduleResult {
  const [stats, setStats] = useState<ScheduleStats>({
    totalTasks: 0,
    overdueTasks: 0,
    upcomingDeadlines: 0,
    delayedMilestones: 0,
    resourceConflicts: 0,
    projectsAtRisk: 0,
    unreadNotifications: 0,
  });
  
  const [notifications, setNotifications] = useState<ScheduleNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScheduleData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch schedule data
      const response = await fetch('/api/schedule');
      const result = await response.json();

      if (result.success) {
        const schedules = result.data.schedules || [];
        const scheduleStats = result.data.stats || {};
        
        // Generate notifications based on schedule data
        const scheduleNotifications: ScheduleNotification[] = [];
        
        // Check for overdue tasks
        const today = new Date();
        schedules.forEach((schedule: any) => {
          if (schedule.projects?.status === 'in_progress') {
            // Simulated overdue task detection
            const daysSinceStart = Math.floor((today.getTime() - new Date(schedule.start_date).getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysSinceStart > 30 && schedule.completion_percentage < 50) {
              scheduleNotifications.push({
                id: `overdue-${schedule.id}`,
                type: 'overdue_task',
                title: 'Project Behind Schedule',
                message: `${schedule.projects.project_name} is behind schedule`,
                priority: 'high',
                project_id: schedule.project_id,
                project_name: schedule.projects.project_name,
                created_at: new Date().toISOString(),
                is_read: false,
                due_date: schedule.end_date,
              });
            }

            // Check for upcoming deadlines (within 7 days)
            const endDate = new Date(schedule.end_date);
            const daysUntilDeadline = Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysUntilDeadline <= 7 && daysUntilDeadline > 0 && schedule.completion_percentage < 90) {
              scheduleNotifications.push({
                id: `deadline-${schedule.id}`,
                type: 'upcoming_deadline',
                title: 'Upcoming Deadline',
                message: `${schedule.projects.project_name} deadline in ${daysUntilDeadline} days`,
                priority: daysUntilDeadline <= 3 ? 'urgent' : 'high',
                project_id: schedule.project_id,
                project_name: schedule.projects.project_name,
                created_at: new Date().toISOString(),
                is_read: false,
                due_date: schedule.end_date,
              });
            }
          }
        });

        setStats({
          totalTasks: scheduleStats.totalTasks || 0,
          overdueTasks: scheduleNotifications.filter(n => n.type === 'overdue_task').length,
          upcomingDeadlines: scheduleNotifications.filter(n => n.type === 'upcoming_deadline').length,
          delayedMilestones: scheduleStats.delayedProjects || 0,
          resourceConflicts: 0, // Would be calculated from resource assignments
          projectsAtRisk: scheduleStats.delayedProjects || 0,
          unreadNotifications: scheduleNotifications.filter(n => !n.is_read).length,
        });

        setNotifications(scheduleNotifications);
      } else {
        setError(result.error || 'Failed to fetch schedule data');
      }
    } catch (err) {
      setError('Network error loading schedule data');
      console.error('Error fetching schedule data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);

  return {
    stats,
    notifications,
    loading,
    error,
    refreshData: fetchScheduleData,
  };
} 
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
  averageProgress: number;
  delayedTasks: number;
  totalTasks: number;
  unreadNotifications: number;
  overdueTasks: number; // Separate from delayedTasks
  upcomingDeadlines: number; // Tasks due in next 7 days
  projectsAtRisk: number; // Projects with overdue milestones
  completedTasks: number;
  inProgressTasks: number;
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
    averageProgress: 0,
    delayedTasks: 0,
    totalTasks: 0,
    unreadNotifications: 0,
    overdueTasks: 0,
    upcomingDeadlines: 0,
    projectsAtRisk: 0,
    completedTasks: 0,
    inProgressTasks: 0,
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
        
        // Check for overdue tasks from actual schedule data
        const today = new Date();
        schedules.forEach((schedule: any) => {
          if (schedule.planned_end && new Date(schedule.planned_end) < today && schedule.status !== 'completed') {
            scheduleNotifications.push({
              id: `overdue-${schedule.id}`,
              type: 'overdue_task',
              title: 'Task Overdue',
              message: `${schedule.milestone_name || 'Task'} is overdue`,
              priority: 'urgent',
              project_id: schedule.project_id,
              project_name: schedule.project?.project_name || 'Unknown Project',
              created_at: new Date().toISOString(),
              is_read: false,
            });
          }

          // Check for upcoming deadlines (within 7 days)
          if (schedule.planned_end) {
            const daysUntilEnd = Math.ceil((new Date(schedule.planned_end).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntilEnd > 0 && daysUntilEnd <= 7 && schedule.status !== 'completed') {
              scheduleNotifications.push({
                id: `upcoming-${schedule.id}`,
                type: 'upcoming_deadline',
                title: 'Upcoming Deadline',
                message: `${schedule.milestone_name || 'Task'} due in ${daysUntilEnd} days`,
                priority: daysUntilEnd <= 3 ? 'high' : 'normal',
                project_id: schedule.project_id,
                project_name: schedule.project?.project_name || 'Unknown Project',
                created_at: new Date().toISOString(),
                is_read: false,
              });
            }
          }
        });

        setStats({
          averageProgress: scheduleStats.averageProgress || 0,
          delayedTasks: scheduleNotifications.filter(n => n.type === 'overdue_task').length, // Dynamic count
          totalTasks: scheduleStats.totalTasks || schedules.length,
          unreadNotifications: scheduleNotifications.filter(n => !n.is_read).length, // Dynamic count
          overdueTasks: scheduleNotifications.filter(n => n.type === 'overdue_task').length,
          upcomingDeadlines: scheduleNotifications.filter(n => n.type === 'upcoming_deadline').length,
          projectsAtRisk: [...new Set(scheduleNotifications.filter(n => n.type === 'overdue_task').map(n => n.project_id))].length,
          completedTasks: schedules.filter((s: any) => s.status === 'completed').length,
          inProgressTasks: schedules.filter((s: any) => s.status === 'in_progress').length,
        });

        console.log('🔍 Schedule notifications generated:', {
          total: scheduleNotifications.length,
          unread: scheduleNotifications.filter(n => !n.is_read).length,
          notifications: scheduleNotifications
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
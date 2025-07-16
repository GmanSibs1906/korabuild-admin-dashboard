'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  ProjectScheduleData, 
  ScheduleOverviewData, 
  UpdateTaskData, 
  UpdatePhaseData, 
  UpdateScheduleData,
  UseScheduleOptions,
  UseScheduleReturn
} from '@/types/schedule';

export function useSchedule(options: UseScheduleOptions = {}): UseScheduleReturn {
  const { 
    projectId, 
    autoRefresh = false, 
    refetchInterval = 300000 // 5 minutes default
  } = options;

  const [scheduleData, setScheduleData] = useState<ProjectScheduleData | null>(null);
  const [overviewData, setOverviewData] = useState<ScheduleOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch schedule data
  const fetchScheduleData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const url = projectId 
        ? `/api/schedule?projectId=${projectId}`
        : '/api/schedule';

      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch schedule data');
      }

      if (result.success) {
        if (projectId) {
          setScheduleData(result.data);
          setOverviewData(null);
        } else {
          setOverviewData(result.data);
          setScheduleData(null);
        }
      } else {
        throw new Error(result.error || 'Failed to fetch schedule data');
      }
    } catch (error) {
      console.error('Error fetching schedule data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch schedule data');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Update task
  const updateTask = useCallback(async (taskId: string, data: UpdateTaskData) => {
    try {
      setError(null);

      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateTask',
          taskId,
          data
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update task');
      }

      if (result.success) {
        // Refresh data after successful update
        await fetchScheduleData();
      } else {
        throw new Error(result.error || 'Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      setError(error instanceof Error ? error.message : 'Failed to update task');
      throw error;
    }
  }, [fetchScheduleData]);

  // Update phase
  const updatePhase = useCallback(async (phaseId: string, data: UpdatePhaseData) => {
    try {
      setError(null);

      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updatePhase',
          phaseId,
          data
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update phase');
      }

      if (result.success) {
        // Refresh data after successful update
        await fetchScheduleData();
      } else {
        throw new Error(result.error || 'Failed to update phase');
      }
    } catch (error) {
      console.error('Error updating phase:', error);
      setError(error instanceof Error ? error.message : 'Failed to update phase');
      throw error;
    }
  }, [fetchScheduleData]);

  // Update schedule
  const updateSchedule = useCallback(async (scheduleId: string, data: UpdateScheduleData) => {
    try {
      setError(null);

      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateSchedule',
          scheduleId,
          data
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update schedule');
      }

      if (result.success) {
        // Refresh data after successful update
        await fetchScheduleData();
      } else {
        throw new Error(result.error || 'Failed to update schedule');
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      setError(error instanceof Error ? error.message : 'Failed to update schedule');
      throw error;
    }
  }, [fetchScheduleData]);

  // Refresh data manually
  const refreshData = useCallback(async () => {
    await fetchScheduleData();
  }, [fetchScheduleData]);

  // Initial data fetch
  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchScheduleData();
      }, refetchInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refetchInterval, fetchScheduleData]);

  return {
    scheduleData,
    overviewData,
    loading,
    error,
    updateTask,
    updatePhase,
    updateSchedule,
    refreshData
  };
} 
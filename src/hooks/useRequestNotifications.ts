'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface RequestNotification {
  id: string;
  type: 'new_request' | 'status_update' | 'urgent_request' | 'comment_added' | 'assignment_changed';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  is_read: boolean;
  request_id: string;
  client_name?: string;
  project_name?: string;
  metadata?: {
    old_status?: string;
    new_status?: string;
    assigned_to?: string;
    comment_id?: string;
    action_required?: boolean;
  };
}

export interface UseRequestNotificationsOptions {
  includeRead?: boolean;
  limit?: number;
  autoMarkAsRead?: boolean;
  filterByPriority?: string[];
}

export interface UseRequestNotificationsReturn {
  notifications: RequestNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  refetch: () => Promise<void>;
}

// Interface for Supabase real-time payload
interface RealtimePayload {
  new: any;
  old?: any;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}

export function useRequestNotifications(
  options: UseRequestNotificationsOptions = {}
): UseRequestNotificationsReturn {
  const {
    includeRead = false,
    limit = 50,
    autoMarkAsRead = false,
    filterByPriority = []
  } = options;

  const [notifications, setNotifications] = useState<RequestNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate notification from request data
  const generateRequestNotification = (
    request: any, 
    type: RequestNotification['type'],
    metadata?: RequestNotification['metadata']
  ): RequestNotification => {
    const baseNotification = {
      id: `${type}_${request.id}_${Date.now()}`,
      request_id: request.id,
      created_at: new Date().toISOString(),
      is_read: false,
      client_name: request.client?.full_name || 'Unknown Client',
      project_name: request.project?.project_name || 'No Project',
      metadata
    };

    switch (type) {
      case 'new_request':
        return {
          ...baseNotification,
          type: 'new_request',
          title: 'New Request Submitted',
          message: `${request.category === 'service' ? '🏗️' : '🧱'} ${request.title} - ${request.client?.full_name || 'Unknown Client'}`,
          priority: request.priority === 'urgent' ? 'urgent' : 'high'
        };

      case 'urgent_request':
        return {
          ...baseNotification,
          type: 'urgent_request',
          title: '🚨 Urgent Request',
          message: `URGENT: ${request.title} requires immediate attention`,
          priority: 'urgent'
        };

      case 'status_update':
        return {
          ...baseNotification,
          type: 'status_update',
          title: 'Request Status Updated',
          message: `${request.title} status changed from ${metadata?.old_status} to ${metadata?.new_status}`,
          priority: metadata?.new_status === 'completed' ? 'low' : 'medium'
        };

      case 'comment_added':
        return {
          ...baseNotification,
          type: 'comment_added',
          title: 'New Comment Added',
          message: `New comment on ${request.title}`,
          priority: 'medium'
        };

      case 'assignment_changed':
        return {
          ...baseNotification,
          type: 'assignment_changed',
          title: 'Request Assignment Changed',
          message: `${request.title} assigned to ${metadata?.assigned_to || 'unassigned'}`,
          priority: 'medium'
        };

      default:
        return {
          ...baseNotification,
          type: 'new_request',
          title: 'Request Update',
          message: `Update on ${request.title}`,
          priority: 'medium'
        };
    }
  };

  // Fetch existing notifications (simulated from recent requests)
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get recent requests for notifications
      const response = await fetch('/api/admin/requests?limit=20&include_stats=true');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch requests');
      }

      const requests = result.data.requests || [];
      const generatedNotifications: RequestNotification[] = [];

      // Generate notifications from recent requests
      requests.forEach((request: any) => {
        const createdAt = new Date(request.created_at);
        const daysSinceCreated = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

        // New request notifications (last 7 days)
        if (daysSinceCreated <= 7) {
          if (request.priority === 'urgent') {
            generatedNotifications.push(
              generateRequestNotification(request, 'urgent_request')
            );
          } else if (request.status === 'submitted') {
            generatedNotifications.push(
              generateRequestNotification(request, 'new_request')
            );
          }
        }

        // Status update notifications (last 3 days)
        if (daysSinceCreated <= 3 && request.status !== 'submitted') {
          generatedNotifications.push(
            generateRequestNotification(request, 'status_update', {
              old_status: 'submitted',
              new_status: request.status
            })
          );
        }
      });

      // Sort by priority and date
      const sortedNotifications = generatedNotifications
        .sort((a, b) => {
          // Sort by priority first
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;

          // Then by date
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        })
        .slice(0, limit);

      // Apply filters
      let filteredNotifications = sortedNotifications;
      
      if (!includeRead) {
        filteredNotifications = filteredNotifications.filter(n => !n.is_read);
      }

      if (filterByPriority.length > 0) {
        filteredNotifications = filteredNotifications.filter(n => 
          filterByPriority.includes(n.priority)
        );
      }

      setNotifications(filteredNotifications);

    } catch (err) {
      console.error('Failed to fetch request notifications:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [limit, includeRead, filterByPriority]); // Removed generateRequestNotification from dependencies

  // Set up real-time subscriptions
  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Set up real-time subscription with error handling
    let subscription: any = null;
    
    try {
      subscription = supabase
        .channel('request_notifications')
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'requests' 
          },
          (payload: RealtimePayload) => {
            try {
              console.log('🔔 New request notification:', payload);
              
              const newNotification = generateRequestNotification(
                payload.new,
                payload.new.priority === 'urgent' ? 'urgent_request' : 'new_request'
              );

              setNotifications(prev => [newNotification, ...prev.slice(0, limit - 1)]);
            } catch (error) {
              console.error('Error processing new request notification:', error);
            }
          }
        )
        .on(
          'postgres_changes',
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'requests' 
          },
          (payload: RealtimePayload) => {
            try {
              console.log('🔔 Request status update notification:', payload);
              
              // Check if status changed
              if (payload.old?.status !== payload.new.status) {
                const statusNotification = generateRequestNotification(
                  payload.new,
                  'status_update',
                  {
                    old_status: payload.old?.status,
                    new_status: payload.new.status
                  }
                );

                setNotifications(prev => [statusNotification, ...prev.slice(0, limit - 1)]);
              }

              // Check if assignment changed
              if (payload.old?.assigned_to_user_id !== payload.new.assigned_to_user_id) {
                const assignmentNotification = generateRequestNotification(
                  payload.new,
                  'assignment_changed',
                  {
                    assigned_to: payload.new.assigned_to_user_id || 'unassigned'
                  }
                );

                setNotifications(prev => [assignmentNotification, ...prev.slice(0, limit - 1)]);
              }
            } catch (error) {
              console.error('Error processing request update notification:', error);
            }
          }
        )
        .subscribe();
    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
    }

    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing from real-time channel:', error);
        }
      }
    };
  }, [fetchNotifications, limit]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, is_read: true }
          : notification
      )
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, is_read: true }))
    );
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    setNotifications([]);
  }, []);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    refetch: fetchNotifications
  };
} 
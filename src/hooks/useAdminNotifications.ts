'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { AdminNotification, NotificationStats, NotificationType, NotificationPriority } from '@/types/notifications';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface UseAdminNotificationsOptions {
  autoRefresh?: boolean;
  includeRead?: boolean;
  priority?: NotificationPriority[];
  category?: string[];
  limit?: number;
}

interface UseAdminNotificationsReturn {
  notifications: AdminNotification[];
  stats: NotificationStats;
  loading: boolean;
  error: string | null;
  
  // Actions
  markAsRead: (notificationId: string) => Promise<void>;
  markAsAcknowledged: (notificationId: string) => Promise<void>;
  dismissNotification: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  
  // Control center functions
  getActionableNotifications: () => AdminNotification[];
  getCriticalAlerts: () => AdminNotification[];
  getNotificationsByCategory: (category: string) => AdminNotification[];
  
  refetch: () => Promise<void>;
}

export function useAdminNotifications(
  options: UseAdminNotificationsOptions = {}
): UseAdminNotificationsReturn {
  const {
    autoRefresh = true,
    includeRead = false,
    priority = [],
    category = [],
    limit = 100
  } = options;

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total_unread: 0,
    critical_unread: 0,
    high_unread: 0,
    action_required_count: 0,
    overdue_actions: 0,
    financial_alerts: 0,
    operational_alerts: 0,
    compliance_alerts: 0,
    safety_alerts: 0,
    quality_alerts: 0,
    communication_alerts: 0,
    system_alerts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query
      let query = supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (!includeRead) {
        query = query.eq('is_read', false);
      }

      if (priority.length > 0) {
        query = query.in('priority', priority);
      }

      if (category.length > 0) {
        query = query.in('category', category);
      }

      // Apply limit
      query = query.limit(limit);

      const { data, error: fetchError } = await query;

      if (fetchError) {
        // Handle specific case where table doesn't exist yet
        if (fetchError.message?.includes('relation "admin_notifications" does not exist')) {
          console.log('⚠️ Admin notifications table not yet created. Using empty state.');
          
          // Provide empty but valid state
          setNotifications([]);
          setStats({
            total_unread: 0,
            critical_unread: 0,
            high_unread: 0,
            action_required_count: 0,
            overdue_actions: 0,
            financial_alerts: 0,
            operational_alerts: 0,
            compliance_alerts: 0,
            safety_alerts: 0,
            quality_alerts: 0,
            communication_alerts: 0,
            system_alerts: 0,
          });
          
          setError('Admin notifications table not yet created. Please run the SQL migration.');
          return; // Return early without throwing error
        }
        throw fetchError;
      }

      const notificationsList = data || [];
      setNotifications(notificationsList);

      // Calculate real-time stats
      const unreadNotifications = notificationsList.filter(n => !n.is_read);
      
      const calculatedStats: NotificationStats = {
        total_unread: unreadNotifications.length,
        critical_unread: unreadNotifications.filter(n => n.priority === 'critical').length,
        high_unread: unreadNotifications.filter(n => n.priority === 'high').length,
        action_required_count: unreadNotifications.filter(n => n.action_required).length,
        overdue_actions: unreadNotifications.filter(n => {
          if (!n.expires_at) return false;
          return new Date(n.expires_at) < new Date();
        }).length,
        
        // By category (only unread)
        financial_alerts: unreadNotifications.filter(n => n.category === 'financial').length,
        operational_alerts: unreadNotifications.filter(n => n.category === 'operational').length,
        compliance_alerts: unreadNotifications.filter(n => n.category === 'compliance').length,
        safety_alerts: unreadNotifications.filter(n => n.category === 'safety').length,
        quality_alerts: unreadNotifications.filter(n => n.category === 'quality').length,
        communication_alerts: unreadNotifications.filter(n => n.category === 'communication').length,
        system_alerts: unreadNotifications.filter(n => n.category === 'system').length,
      };

      setStats(calculatedStats);

      console.log('🎛️ Admin notifications loaded:', {
        total: notificationsList.length,
        unread: calculatedStats.total_unread,
        actionRequired: calculatedStats.action_required_count,
        critical: calculatedStats.critical_unread
      });

    } catch (err) {
      console.error('❌ Error fetching admin notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      
      // Set safe defaults on error to prevent crashes
      setNotifications([]);
      setStats({
        total_unread: 0,
        critical_unread: 0,
        high_unread: 0,
        action_required_count: 0,
        overdue_actions: 0,
        financial_alerts: 0,
        operational_alerts: 0,
        compliance_alerts: 0,
        safety_alerts: 0,
        quality_alerts: 0,
        communication_alerts: 0,
        system_alerts: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [includeRead, priority, category, limit]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      console.log('🔄 Marking notification as read:', notificationId);
      
      const response = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'mark_read' }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to mark notification as read');
      }

      console.log('✅ Successfully marked as read:', result.notification);

      // Update local state immediately
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );

      // Update stats
      setStats(prev => ({
        ...prev,
        total_unread: Math.max(0, prev.total_unread - 1)
      }));

      console.log('✅ Notification marked as read:', notificationId);

    } catch (err) {
      console.error('❌ Error marking notification as read:', {
        error: err,
        notificationId,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
        errorDetails: err
      });
      setError(err instanceof Error ? err.message : 'Failed to mark as read');
    }
  }, []);

  // Mark notification as acknowledged (for action-required items)
  const markAsAcknowledged = useCallback(async (notificationId: string) => {
    try {
      console.log('🔄 Acknowledging notification:', notificationId);
      
      const response = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'acknowledge' }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to acknowledge notification');
      }

      console.log('✅ Successfully acknowledged:', result.notification);

      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_acknowledged: true, acknowledged_at: new Date().toISOString() }
            : n
        )
      );

      console.log('✅ Notification acknowledged:', notificationId);

    } catch (err) {
      console.error('❌ Error acknowledging notification:', {
        error: err,
        notificationId,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
        errorDetails: err
      });
      setError(err instanceof Error ? err.message : 'Failed to acknowledge');
    }
  }, []);

  // Dismiss notification (remove from view)
  const dismissNotification = useCallback(async (notificationId: string) => {
    try {
      console.log('🔄 Dismissing notification:', notificationId);
      
      const response = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'dismiss' }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to dismiss notification');
      }

      console.log('✅ Successfully dismissed:', result.notification);

      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      // Update stats  
      setStats(prev => ({
        ...prev,
        total_unread: Math.max(0, prev.total_unread - 1)
      }));

      console.log('✅ Notification dismissed:', notificationId);

    } catch (err) {
      console.error('❌ Error dismissing notification:', {
        error: err,
        notificationId,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
        errorDetails: err
      });
      setError(err instanceof Error ? err.message : 'Failed to dismiss');
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      
      if (unreadIds.length === 0) return;

      console.log('🔄 Marking all notifications as read:', unreadIds.length);

      const response = await fetch('/api/admin/notifications/bulk', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'mark_all_read',
          ids: unreadIds 
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to mark all notifications as read');
      }

      console.log('✅ Successfully marked all as read:', result.updatedCount);

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );

      // Reset unread stats
      setStats(prev => ({
        ...prev,
        total_unread: 0,
        critical_unread: 0,
        high_unread: 0,
        action_required_count: 0,
        financial_alerts: 0,
        operational_alerts: 0,
        compliance_alerts: 0,
        safety_alerts: 0,
        quality_alerts: 0,
        communication_alerts: 0,
        system_alerts: 0,
      }));

      console.log('✅ All notifications marked as read');

    } catch (err) {
      console.error('❌ Error marking all as read:', {
        error: err,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
        errorDetails: err
      });
      setError(err instanceof Error ? err.message : 'Failed to mark all as read');
    }
  }, [notifications]);

  // Control center helper functions
  const getActionableNotifications = useCallback(() => {
    return notifications.filter(n => !n.is_read && n.action_required);
  }, [notifications]);

  const getCriticalAlerts = useCallback(() => {
    return notifications.filter(n => !n.is_read && n.priority === 'critical');
  }, [notifications]);

  const getNotificationsByCategory = useCallback((categoryFilter: string) => {
    return notifications.filter(n => !n.is_read && n.category === categoryFilter);
  }, [notifications]);

  // Set up real-time subscriptions
  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    if (!autoRefresh) return;

    // Real-time subscription for new notifications
    const subscription = supabase
      .channel('admin_notifications_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications'
        },
        (payload) => {
          console.log('🔔 New admin notification:', payload.new);
          setNotifications(prev => [payload.new as AdminNotification, ...prev]);
          
          // Update stats for new unread notification
          const newNotification = payload.new as AdminNotification;
          setStats(prev => ({
            ...prev,
            total_unread: prev.total_unread + 1,
            critical_unread: newNotification.priority === 'critical' ? prev.critical_unread + 1 : prev.critical_unread,
            high_unread: newNotification.priority === 'high' ? prev.high_unread + 1 : prev.high_unread,
            action_required_count: newNotification.action_required ? prev.action_required_count + 1 : prev.action_required_count,
            [`${newNotification.category}_alerts`]: (prev as any)[`${newNotification.category}_alerts`] + 1,
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'admin_notifications'
        },
        (payload) => {
          console.log('🔄 Admin notification updated:', payload.new);
          setNotifications(prev => 
            prev.map(n => n.id === payload.new.id ? payload.new as AdminNotification : n)
          );
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [autoRefresh]); // Remove fetchNotifications from dependencies

  return {
    notifications,
    stats,
    loading,
    error,
    markAsRead,
    markAsAcknowledged,
    dismissNotification,
    markAllAsRead,
    getActionableNotifications,
    getCriticalAlerts,
    getNotificationsByCategory,
    refetch: fetchNotifications,
  };
} 
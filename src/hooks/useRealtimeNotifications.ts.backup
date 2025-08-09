'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database';
import { toast } from 'sonner';
import { soundGenerator } from '@/lib/notifications/soundGenerator';

type NotificationType = Database['public']['Tables']['notifications']['Row'];

export interface RealtimeNotification extends NotificationType {
  isNew?: boolean;
}

export function useRealtimeNotifications() {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const channelRef = useRef<any>(null);
  const priorityAlertIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const notificationsRef = useRef<RealtimeNotification[]>([]);

  // Play notification sound based on type
  const playNotificationSound = useCallback(async (notificationType: string) => {
    if (!soundEnabled) return;

    try {
      let soundType: 'newUser' | 'projectUpdate' | 'payment' | 'general' | 'emergency' = 'general';
      
      // Map notification types to appropriate sounds
      switch (notificationType) {
        case 'system':
          soundType = 'newUser';
          break;
        case 'project_update':
        case 'milestone_complete':
          soundType = 'projectUpdate';
          break;
        case 'payment_due':
          soundType = 'payment';
          break;
        case 'emergency':
          soundType = 'emergency';
          break;
        default:
          soundType = 'general';
      }

      await soundGenerator.playNotificationSound(soundType);
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }, [soundEnabled]);

  // Show toast notification with appropriate styling
  const showToastNotification = useCallback((notification: RealtimeNotification) => {
    // Style toast based on priority and type
    const toastOptions = {
      duration: notification.priority_level === 'urgent' ? 10000 : 5000,
      description: notification.message,
      action: notification.created_at ? {
        label: new Date(notification.created_at).toLocaleTimeString(),
        onClick: () => {},
      } : undefined,
    };

    switch (notification.priority_level) {
      case 'urgent':
      case 'high':
        toast.error(notification.title, toastOptions);
        break;
      case 'normal':
        toast.success(notification.title, toastOptions);
        break;
      case 'low':
        toast.info(notification.title, toastOptions);
        break;
      default:
        toast(notification.title, toastOptions);
    }
  }, []);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      setNotifications(data || []);
      notificationsRef.current = data || []; // Update ref
      
      // Count unread notifications
      const unreadCount = data?.filter(n => !n.is_read).length || 0;
      setUnreadCount(unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      console.log('📖 [Notifications] Marking notification as read:', notificationId);
      
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId);

      if (error) {
        console.error('❌ [Notifications] Error marking notification as read:', error);
        return;
      }

      // Update local state
      setNotifications(prev => {
        const updated = prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        );
        notificationsRef.current = updated; // Update ref
        return updated;
      });

      setUnreadCount(prev => {
        const newCount = Math.max(0, prev - 1);
        console.log('📊 [Notifications] Updated unread count after mark as read:', { previous: prev, new: newCount });
        return newCount;
      });
      
      console.log('✅ [Notifications] Notification marked as read successfully');
    } catch (error) {
      console.error('❌ [Notifications] Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications
        .filter(n => !n.is_read)
        .map(n => n.id);

      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .in('id', unreadIds);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return;
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ 
          ...n, 
          is_read: true, 
          read_at: new Date().toISOString() 
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [notifications]);

  // Clear old notifications
  const clearNotifications = useCallback(async () => {
    try {
      setNotifications([]);
      setUnreadCount(0);
      
      // Optionally delete old notifications from database
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep last 30 days
      
      await supabase
        .from('notifications')
        .delete()
        .lt('created_at', cutoffDate.toISOString());
        
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }, []);

  // Delete a specific notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      console.log('🗑️ [Real-time] Deleting notification:', notificationId);
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('❌ [Real-time] Error deleting notification:', error);
        return { success: false, error: error.message };
      }

      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === notificationId);
        return notification && !notification.is_read ? prev - 1 : prev;
      });

      console.log('✅ [Real-time] Notification deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ [Real-time] Error deleting notification:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [notifications]);

  // Manage persistent priority alerts (30-second intervals)
  const managePriorityAlerts = useCallback(() => {
    const priorityNotifications = notifications.filter(n => 
      !n.is_read && 
      (n.notification_type === 'user_created' || 
       (n.notification_type === 'system' && n.metadata?.notification_subtype === 'user_created') ||
       n.priority_level === 'urgent') &&
      n.metadata?.priority_alert === true
    );

    // Clear existing interval
    if (priorityAlertIntervalRef.current) {
      clearInterval(priorityAlertIntervalRef.current);
      priorityAlertIntervalRef.current = null;
    }

    // Set up new interval if there are priority notifications
    if (priorityNotifications.length > 0 && soundEnabled) {
      console.log(`🔔 [Priority] Setting up 30-second alerts for ${priorityNotifications.length} priority notifications`);
      
      const interval = setInterval(async () => {
        // Use current notifications from ref to get the latest state
        const currentPriorityNotifications = notificationsRef.current.filter(n => 
          !n.is_read && 
          (n.notification_type === 'user_created' || 
           (n.notification_type === 'system' && n.metadata?.notification_subtype === 'user_created') ||
           n.priority_level === 'urgent') &&
          n.metadata?.priority_alert === true
        );

        if (currentPriorityNotifications.length > 0) {
          console.log(`🔊 [Priority] Playing persistent alert for ${currentPriorityNotifications.length} unread priority notifications`);
          await playNotificationSound('newUserPriority');
        } else {
          // No more priority notifications, clear interval
          console.log('✅ [Priority] All priority notifications read, stopping persistent alerts');
          clearInterval(interval);
          priorityAlertIntervalRef.current = null;
        }
      }, 30000); // 30 seconds

      priorityAlertIntervalRef.current = interval;
    }
  }, [notifications, soundEnabled, playNotificationSound]);

  // Effect to manage priority alerts when notifications change
  useEffect(() => {
    managePriorityAlerts();
    
    // Cleanup on unmount
    return () => {
      if (priorityAlertIntervalRef.current) {
        clearInterval(priorityAlertIntervalRef.current);
        priorityAlertIntervalRef.current = null;
      }
    };
  }, [managePriorityAlerts]);

  // Setup real-time subscription
  useEffect(() => {
    fetchNotifications();

    // Subscribe to real-time changes
    console.log('🔄 [Real-time Notifications] Setting up subscription...');
    
    // Test subscription connection first
    const testConnection = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('🔍 [Real-time Notifications] Current user:', user ? { id: user.id, email: user.email } : 'No user');
        
        // Test if we can read notifications
        const { data: testNotifications, error: testError } = await supabase
          .from('notifications')
          .select('id, title, created_at')
          .limit(1);
          
        console.log('🔍 [Real-time Notifications] Test read:', { 
          success: !testError, 
          error: testError, 
          count: testNotifications?.length || 0 
        });
      } catch (error) {
        console.error('❌ [Real-time Notifications] Connection test failed:', error);
      }
    };
    
    testConnection();
    
    // Use a simpler channel name and filter approach
    channelRef.current = supabase
      .channel('notifications_realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events
          schema: 'public',
          table: 'notifications',
        },
        async (payload) => {
          console.log('🔔 [Real-time] Notification event received:', {
            event: payload.eventType,
            table: payload.table,
            schema: payload.schema,
            timestamp: new Date().toISOString()
          });
          
          // Handle INSERT events (new notifications)
          if (payload.eventType === 'INSERT' && payload.new) {
            const newNotification = payload.new as RealtimeNotification;
            
            console.log('📨 [Real-time] Processing new notification:', {
              id: newNotification.id,
              user_id: newNotification.user_id,
              title: newNotification.title,
              type: newNotification.notification_type
            });
            
            // For now, add all notifications and let the component filter
            // This ensures we don't miss any due to RLS or authentication issues
            newNotification.isNew = true;
            
            setNotifications(prev => {
              const updated = [newNotification, ...prev.slice(0, 49)];
              notificationsRef.current = updated; // Update ref
              console.log('📝 [Real-time] Added notification to list:', { 
                previousCount: prev.length, 
                newCount: updated.length,
                notificationTitle: newNotification.title
              });
              return updated;
            });
            
            setUnreadCount(prev => {
              const newCount = prev + 1;
              console.log('📊 [Real-time] Updated unread count:', { previous: prev, new: newCount });
              return newCount;
            });

            // Show toast and play sound for all notifications for now
            console.log('🍞 [Real-time] Showing toast notification...');
            showToastNotification(newNotification);

            console.log('🔊 [Real-time] Playing notification sound...');
            try {
              await playNotificationSound(newNotification.notification_type);
              console.log('✅ [Real-time] Sound played successfully');
            } catch (soundError) {
              console.error('❌ [Real-time] Sound failed to play:', soundError);
              console.log('ℹ️ [Real-time] This is often due to browser autoplay policies - user interaction required');
            }
            
            console.log('🎉 [Real-time] New notification processed successfully');
          }
          
          // Handle UPDATE events (notification updates)
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedNotification = payload.new as RealtimeNotification;
            
            console.log('📝 [Real-time] Processing notification update:', {
              id: updatedNotification.id,
              is_read: updatedNotification.is_read
            });
            
            setNotifications(prev => {
              const updated = prev.map(n => 
                n.id === updatedNotification.id ? updatedNotification : n
              );
              notificationsRef.current = updated; // Update ref
              return updated;
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('🔄 [Real-time] Subscription status changed:', {
          status,
          timestamp: new Date().toISOString(),
          channel: 'notifications_realtime'
        });
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ [Real-time] Successfully subscribed to notifications');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [Real-time] Error subscribing to notifications channel');
        } else if (status === 'CLOSED') {
          console.log('🔒 [Real-time] Subscription closed');
        }
      });

    // Cleanup subscription on unmount
    return () => {
      if (channelRef.current) {
        console.log('🧹 [Real-time] Cleaning up notification subscription');
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [fetchNotifications, showToastNotification, playNotificationSound]);

  // Toggle sound on/off
  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  // Test sound function
  const testSound = useCallback(async () => {
    await soundGenerator.testAllSounds();
  }, []);

  // Test real-time functionality
  const testRealtime = useCallback(async () => {
    try {
      console.log('🧪 [Real-time] Testing real-time functionality...');
      
      // Test current user
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 [Real-time] Current user:', user ? { id: user.id, email: user.email } : 'No user');
      
      // Test database access
      const { data: testNotifications, error: testError } = await supabase
        .from('notifications')
        .select('id, title, user_id, created_at')
        .limit(3);
        
      console.log('📊 [Real-time] Database access test:', { 
        success: !testError, 
        error: testError?.message, 
        notifications: testNotifications?.length || 0 
      });
      
      // Test notification creation via API
      const response = await fetch('/api/debug/test-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      console.log('🔔 [Real-time] Test notification API result:', result);
      
      return result;
    } catch (error) {
      console.error('❌ [Real-time] Test failed:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    soundEnabled,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    deleteNotification,
    toggleSound,
    testSound,
    testRealtime, // New test function
    refetch: fetchNotifications,
  };
} 
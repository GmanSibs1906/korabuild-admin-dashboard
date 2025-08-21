'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface RealtimeNotification {
  id: string;
  user_id: string;
  project_id: string;
  title: string;
  message: string;
  type: string;
  notification_type: string;
  entity_type?: string;
  entity_id?: string;
  priority_level: string;
  priority?: string; // Add this field for compatibility
  action_url?: string;
  metadata?: any;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export function useNetlifyRealtime() {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);

  // Filter function
  const shouldIncludeNotification = useCallback((notification: RealtimeNotification) => {
    // Skip payment notifications
    if (notification.type === 'payment' || notification.notification_type === 'payment_due') {
      return false;
    }
    
    // Skip admin-initiated actions
    if (notification.metadata?.source === 'admin_dashboard' || 
        notification.metadata?.created_by === 'admin' ||
        notification.metadata?.admin_action === true) {
      return false;
    }
    
    return true;
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      console.log('🔍 Fetching notifications...');
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (fetchError) {
        console.error('❌ Error fetching notifications:', fetchError);
        setError(fetchError.message);
        return;
      }
      
      if (data) {
        const filteredNotifications = data.filter(shouldIncludeNotification);
        setNotifications(filteredNotifications);
        setUnreadCount(filteredNotifications.filter(n => !n.is_read).length);
        
        console.log(`✅ Loaded ${filteredNotifications.length} notifications (${data.length} total)`);
      }
      
    } catch (err) {
      console.error('❌ Error in fetchNotifications:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [shouldIncludeNotification]);

  // Setup subscription with retry logic
  const setupSubscription = useCallback(async () => {
    if (isSubscribedRef.current) {
      console.log('🔄 Already subscribed, skipping...');
      return;
    }

    try {
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.warn('⚠️ No authenticated user for realtime subscription');
        return;
      }
      
      console.log('🔗 Setting up realtime subscription...');
      
      // Create unique channel name
      const channelName = `notifications-${user.id}-${Math.random().toString(36).substr(2, 9)}`;
      
      const subscription = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications'
          },
          (payload) => {
            console.log('🔔 New notification received:', payload.new?.title);
            
            const newNotification = payload.new as RealtimeNotification;
            
            if (shouldIncludeNotification(newNotification)) {
              setNotifications(prev => {
                const exists = prev.some(n => n.id === newNotification.id);
                if (!exists) {
                  console.log('✅ Adding new notification');
                  const updated = [newNotification, ...prev];
                  setUnreadCount(updated.filter(n => !n.is_read).length);
                  return updated;
                }
                return prev;
              });
            } else {
              console.log('🚫 Filtered out notification');
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications'
          },
          (payload) => {
            console.log('🔄 Notification updated');
            
            const updatedNotification = payload.new as RealtimeNotification;
            
            setNotifications(prev => {
              const updated = prev.map(n => 
                n.id === updatedNotification.id ? updatedNotification : n
              );
              setUnreadCount(updated.filter(n => !n.is_read).length);
              return updated;
            });
          }
        )
        .subscribe((status) => {
          console.log('📡 Subscription status:', status);
          
          if (status === 'SUBSCRIBED') {
            console.log('✅ Successfully subscribed to realtime notifications');
            isSubscribedRef.current = true;
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('❌ Subscription failed:', status);
            isSubscribedRef.current = false;
            
            // Retry after 5 seconds
            setTimeout(() => {
              console.log('🔄 Retrying subscription...');
              setupSubscription();
            }, 5000);
          } else if (status === 'CLOSED') {
            isSubscribedRef.current = false;
          }
        });
      
      subscriptionRef.current = subscription;
      
    } catch (error) {
      console.error('❌ Error setting up subscription:', error);
      isSubscribedRef.current = false;
    }
  }, [shouldIncludeNotification]);

  // Mark as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId);
        
      if (error) {
        console.error('❌ Error marking as read:', error);
        return;
      }
      
      setNotifications(prev => {
        const updated = prev.map(n =>
          n.id === notificationId
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        );
        setUnreadCount(updated.filter(n => !n.is_read).length);
        return updated;
      });
      
    } catch (error) {
      console.error('❌ Error in markAsRead:', error);
    }
  }, []);

  // Additional functions for compatibility
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      if (unreadNotifications.length === 0) return;
      
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .in('id', unreadNotifications.map(n => n.id));
        
      if (error) {
        console.error('❌ Error marking all as read:', error);
        return;
      }
      
      setNotifications(prev =>
        prev.map(n => ({ 
          ...n, 
          is_read: true, 
          read_at: new Date().toISOString() 
        }))
      );
      setUnreadCount(0);
      
    } catch (error) {
      console.error('❌ Error in markAllAsRead:', error);
    }
  }, [notifications]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
        
      if (error) {
        console.error('❌ Error deleting notification:', error);
        return;
      }
      
      setNotifications(prev => {
        const updated = prev.filter(n => n.id !== notificationId);
        setUnreadCount(updated.filter(n => !n.is_read).length);
        return updated;
      });
      
    } catch (error) {
      console.error('❌ Error in deleteNotification:', error);
    }
  }, []);

  const clearNotifications = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        
      if (error) {
        console.error('❌ Error clearing notifications:', error);
        return;
      }
      
      setNotifications([]);
      setUnreadCount(0);
      
    } catch (error) {
      console.error('❌ Error in clearNotifications:', error);
    }
  }, []);

  // Sound and testing functions (simplified)
  const soundEnabled = true; // Simple default
  const toggleSound = useCallback(() => {
    console.log('🔊 Sound toggle (simplified version)');
  }, []);

  const testRealtime = useCallback(() => {
    console.log('🧪 Testing realtime connection...');
    fetchNotifications();
  }, [fetchNotifications]);

  const testSound = useCallback(() => {
    console.log('🔔 Testing notification sound...');
  }, []);

  // Main effect
  useEffect(() => {
    // Initial fetch
    fetchNotifications();
    
    // Setup subscription after a short delay to ensure auth is ready
    const timer = setTimeout(() => {
      setupSubscription();
    }, 1000);
    
    // Cleanup
    return () => {
      clearTimeout(timer);
      if (subscriptionRef.current) {
        console.log('🧹 Cleaning up subscription');
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [fetchNotifications, setupSubscription]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    soundEnabled,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    deleteNotification,
    toggleSound,
    testRealtime,
    testSound,
    refetch: fetchNotifications
  };
} 
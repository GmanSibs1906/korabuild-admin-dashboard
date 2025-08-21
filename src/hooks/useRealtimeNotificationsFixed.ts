'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  action_url?: string;
  metadata?: any;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export function useRealtimeNotificationsFixed() {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<any>(null);

  // Filter function to exclude admin-initiated notifications
  const shouldIncludeNotification = useCallback((notification: RealtimeNotification) => {
    // Skip payment notifications
    if (notification.type === 'payment' || notification.notification_type === 'payment') {
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

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
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
        console.log(`✅ Loaded ${filteredNotifications.length} notifications (${data.length} total, ${data.length - filteredNotifications.length} filtered)`);
      }
      
    } catch (err) {
      console.error('❌ Error in fetchNotifications:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [shouldIncludeNotification]);

  // Setup realtime subscription
  useEffect(() => {
    // Initial fetch
    fetchNotifications();
    
    const setupRealtimeSubscription = async () => {
      try {
        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.warn('⚠️ No authenticated user for realtime subscription');
          return;
        }
        
        console.log('🔗 Setting up realtime subscription for user:', user.id);
        
        // Create subscription with unique channel name
        const channelName = `notifications-realtime-${Date.now()}`;
        
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
              console.log('🔔 New notification received:', payload.new);
              
              const newNotification = payload.new as RealtimeNotification;
              
              // Apply filtering
              if (shouldIncludeNotification(newNotification)) {
                setNotifications(prev => {
                  // Check for duplicates
                  const exists = prev.some(n => n.id === newNotification.id);
                  if (!exists) {
                    console.log('✅ Adding new notification:', newNotification.title);
                    return [newNotification, ...prev];
                  }
                  return prev;
                });
              } else {
                console.log('🚫 Filtered out notification:', newNotification.title);
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
              console.log('🔄 Notification updated:', payload.new);
              
              const updatedNotification = payload.new as RealtimeNotification;
              
              setNotifications(prev => 
                prev.map(n => 
                  n.id === updatedNotification.id ? updatedNotification : n
                )
              );
            }
          )
          .subscribe((status) => {
            console.log('📡 Realtime subscription status:', status);
            
            if (status === 'SUBSCRIBED') {
              console.log('✅ Successfully subscribed to realtime notifications');
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.error('❌ Realtime subscription failed:', status);
              // Optionally implement retry logic here
            }
          });
        
        subscriptionRef.current = subscription;
        
      } catch (error) {
        console.error('❌ Error setting up realtime subscription:', error);
      }
    };
    
    setupRealtimeSubscription();
    
    // Cleanup
    return () => {
      if (subscriptionRef.current) {
        console.log('🧹 Cleaning up realtime subscription');
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [fetchNotifications, shouldIncludeNotification]);

  // Mark notification as read
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
        console.error('❌ Error marking notification as read:', error);
        return;
      }
      
      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      
      console.log('✅ Marked notification as read:', notificationId);
      
    } catch (error) {
      console.error('❌ Error in markAsRead:', error);
    }
  }, []);

  // Get unread count
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    refetch: fetchNotifications
  };
} 
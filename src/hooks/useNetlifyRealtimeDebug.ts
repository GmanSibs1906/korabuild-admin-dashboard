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
  priority?: string;
  action_url?: string;
  metadata?: any;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export function useNetlifyRealtimeDebug() {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any[]>([]);
  const subscriptionRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);

  // Add debug log function
  const addDebugLog = useCallback((message: string, data?: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      message,
      data,
      environment: typeof window !== 'undefined' ? 'client' : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    };
    
    console.log(`🔍 [Netlify Debug] ${message}`, data || '');
    
    setDebugInfo(prev => [logEntry, ...prev.slice(0, 49)]); // Keep last 50 logs
  }, []);

  // Filter function
  const shouldIncludeNotification = useCallback((notification: RealtimeNotification) => {
    // Skip payment notifications
    if (notification.type === 'payment' || notification.notification_type === 'payment_due') {
      addDebugLog('Filtering out payment notification', { id: notification.id, type: notification.type });
      return false;
    }
    
    // Skip admin-initiated actions
    if (notification.metadata?.source === 'admin_dashboard' || 
        notification.metadata?.created_by === 'admin' ||
        notification.metadata?.admin_action === true) {
      addDebugLog('Filtering out admin notification', { id: notification.id, source: notification.metadata?.source });
      return false;
    }
    
    addDebugLog('Including notification', { id: notification.id, type: notification.type });
    return true;
  }, [addDebugLog]);

  // Enhanced fetch notifications with debugging
  const fetchNotifications = useCallback(async () => {
    try {
      addDebugLog('Starting to fetch notifications...');
      setError(null);
      
      // Check environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      addDebugLog('Environment check', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        urlLength: supabaseUrl?.length,
        keyLength: supabaseKey?.length
      });
      
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (fetchError) {
        addDebugLog('Error fetching notifications', fetchError);
        setError(fetchError.message);
        return;
      }
      
      if (data) {
        const filteredNotifications = data.filter(shouldIncludeNotification);
        setNotifications(filteredNotifications);
        setUnreadCount(filteredNotifications.filter(n => !n.is_read).length);
        
        addDebugLog('Notifications fetched successfully', {
          total: data.length,
          filtered: filteredNotifications.length,
          unread: filteredNotifications.filter(n => !n.is_read).length
        });
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addDebugLog('Exception in fetchNotifications', { error: errorMessage });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [shouldIncludeNotification, addDebugLog]);

  // Enhanced subscription setup with extensive debugging
  const setupSubscription = useCallback(async () => {
    if (isSubscribedRef.current) {
      addDebugLog('Already subscribed, skipping setup');
      return;
    }

    try {
      addDebugLog('Starting subscription setup...');
      
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      addDebugLog('Authentication check', {
        hasUser: !!user,
        userId: user?.id,
        authError: authError?.message
      });
      
      if (authError || !user) {
        addDebugLog('No authenticated user, skipping subscription');
        return;
      }
      
      // Create unique channel name
      const channelName = `notifications-debug-${user.id}-${Math.random().toString(36).substr(2, 9)}`;
      addDebugLog('Creating channel', { channelName });
      
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
            addDebugLog('Realtime INSERT received', {
              id: payload.new?.id,
              title: payload.new?.title,
              type: payload.new?.type,
              notification_type: payload.new?.notification_type
            });
            
            const newNotification = payload.new as RealtimeNotification;
            
            if (shouldIncludeNotification(newNotification)) {
              setNotifications(prev => {
                const exists = prev.some(n => n.id === newNotification.id);
                if (!exists) {
                  addDebugLog('Adding new notification to state', { id: newNotification.id });
                  const updated = [newNotification, ...prev];
                  setUnreadCount(updated.filter(n => !n.is_read).length);
                  return updated;
                }
                addDebugLog('Notification already exists, skipping', { id: newNotification.id });
                return prev;
              });
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
            addDebugLog('Realtime UPDATE received', {
              id: payload.new?.id,
              is_read: payload.new?.is_read
            });
            
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
          addDebugLog('Subscription status changed', { 
            status,
            timestamp: new Date().toISOString()
          });
          
          if (status === 'SUBSCRIBED') {
            addDebugLog('Successfully subscribed to realtime notifications');
            isSubscribedRef.current = true;
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            addDebugLog('Subscription failed, will retry', { status });
            isSubscribedRef.current = false;
            
            // Retry after 5 seconds
            setTimeout(() => {
              addDebugLog('Retrying subscription setup...');
              setupSubscription();
            }, 5000);
          } else if (status === 'CLOSED') {
            addDebugLog('Subscription closed');
            isSubscribedRef.current = false;
          }
        });
      
      subscriptionRef.current = subscription;
      addDebugLog('Subscription setup completed');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addDebugLog('Error in subscription setup', { error: errorMessage });
      isSubscribedRef.current = false;
    }
  }, [shouldIncludeNotification, addDebugLog]);

  // Mark as read with debugging
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      addDebugLog('Marking notification as read', { notificationId });
      
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId);
        
      if (error) {
        addDebugLog('Error marking as read', { error: error.message });
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
      
      addDebugLog('Successfully marked as read', { notificationId });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addDebugLog('Exception in markAsRead', { error: errorMessage });
    }
  }, [addDebugLog]);

  // Additional compatibility functions
  const markAllAsRead = useCallback(async () => {
    addDebugLog('Marking all notifications as read');
    const unreadNotifications = notifications.filter(n => !n.is_read);
    
    for (const notification of unreadNotifications) {
      await markAsRead(notification.id);
    }
  }, [notifications, markAsRead, addDebugLog]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    addDebugLog('Deleting notification', { notificationId });
    // Implementation similar to markAsRead
  }, [addDebugLog]);

  const clearNotifications = useCallback(async () => {
    addDebugLog('Clearing all notifications');
    // Implementation for clearing all
  }, [addDebugLog]);

  // Simple compatibility functions
  const soundEnabled = true;
  const toggleSound = useCallback(() => addDebugLog('Sound toggle (debug mode)'), [addDebugLog]);
  const testRealtime = useCallback(() => {
    addDebugLog('Testing realtime connection...');
    fetchNotifications();
  }, [fetchNotifications, addDebugLog]);
  const testSound = useCallback(() => addDebugLog('Testing sound (debug mode)'), [addDebugLog]);

  // Main effect
  useEffect(() => {
    addDebugLog('Component mounted, starting initialization');
    
    // Initial fetch
    fetchNotifications();
    
    // Setup subscription after delay
    const timer = setTimeout(() => {
      addDebugLog('Setting up realtime subscription');
      setupSubscription();
    }, 2000); // Increased delay for Netlify
    
    return () => {
      addDebugLog('Component unmounting, cleaning up');
      clearTimeout(timer);
      if (subscriptionRef.current) {
        addDebugLog('Unsubscribing from realtime');
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [fetchNotifications, setupSubscription, addDebugLog]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    debugInfo, // Additional debug info for troubleshooting
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
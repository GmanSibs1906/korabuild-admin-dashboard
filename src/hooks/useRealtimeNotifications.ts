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
  const currentSubscription = useRef<any>(null);

  // Fetch admin user IDs for filtering
  const [adminUserIds, setAdminUserIds] = useState<string[]>([]);
  const [adminIdsLoaded, setAdminIdsLoaded] = useState(false);

  // Log when admin IDs loading state changes
  useEffect(() => {
    console.log('🔧 [Admin IDs] Loading state changed:', {
      timestamp: new Date().toISOString(),
      adminIdsLoaded,
      adminUserIds,
      adminCount: adminUserIds.length
    });
  }, [adminIdsLoaded, adminUserIds]);

  // Enhanced logging wrapper for setNotifications
  const setNotificationsWithLogging = useCallback((newNotifications: RealtimeNotification[] | ((prev: RealtimeNotification[]) => RealtimeNotification[])) => {
    setNotifications(prev => {
      const updated = typeof newNotifications === 'function' ? newNotifications(prev) : newNotifications;
      
      // Apply the same filtering logic as AdminControlCenter
      const filteredNotifications = updated.filter(notification => {
        // 🚫 FILTER 1: Remove payment notifications completely
        if (notification.entity_type === 'payment' ||
            notification.title?.toLowerCase().includes('payment recorded') ||
            notification.title?.toLowerCase().includes('new payment') ||
            notification.metadata?.notification_subtype === 'payment_recorded') {
          console.log('🚫 [useRealtimeNotifications] Filtered out payment notification:', {
            id: notification.id,
            title: notification.title,
            type: notification.notification_type,
            entity_type: notification.entity_type
          });
          return false;
        }

        // 🚫 FILTER 2: Remove admin-created notifications (already handled by existing logic)
        if (notification.metadata?.source === 'admin_creation' ||
            notification.metadata?.created_by === 'admin') {
          return false;
        }

        return true;
      });

      // 🔄 FILTER 3: Remove duplicate notifications
      const deduplicatedNotifications = filteredNotifications.filter((notification, index, array) => {
        const duplicateIndex = array.findIndex(other => {
          // For notifications with entity_id, compare entity_id and entity_type
          if (notification.entity_id && other.entity_id) {
            return notification.entity_id === other.entity_id && 
                   notification.entity_type === other.entity_type;
          }
          
          // For notifications without entity_id, compare title, message, and type
          return notification.title === other.title &&
                 notification.message === other.message &&
                 notification.notification_type === other.notification_type;
        });
        
        // Keep only the first occurrence
        const isDuplicate = duplicateIndex !== index;
        if (isDuplicate) {
          console.log('🚫 [useRealtimeNotifications] Filtered out duplicate notification:', {
            id: notification.id,
            title: notification.title,
            duplicateOf: array[duplicateIndex].id
          });
        }
        return !isDuplicate;
      });

      console.log('🔧 [useRealtimeNotifications] Applied filtering:', {
        timestamp: new Date().toISOString(),
        originalCount: updated.length,
        afterPaymentFilter: filteredNotifications.length,
        afterDeduplication: deduplicatedNotifications.length,
        removed: updated.length - deduplicatedNotifications.length
      });

      notificationsRef.current = deduplicatedNotifications;
      return deduplicatedNotifications;
    });
  }, []);

  // Enhanced logging wrapper for setUnreadCount
  const setUnreadCountWithLogging = useCallback((newCount: number) => {
    setUnreadCount(prev => {
      // Calculate the actual unread count from filtered notifications instead of using passed count
      const actualUnreadCount = notificationsRef.current.filter(n => !n.is_read).length;
      
      console.log('📊 [Unread Count] Count updated:', {
        timestamp: new Date().toISOString(),
        passedCount: newCount,
        actualFilteredCount: actualUnreadCount,
        totalFilteredNotifications: notificationsRef.current.length,
        using: actualUnreadCount
      });
      
      return actualUnreadCount;
    });
  }, []);

  // Fetch admin users on component mount
  useEffect(() => {
    const fetchAdminUsers = async () => {
      try {
        const { data: adminUsers, error } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'admin');

        if (!error && adminUsers) {
          const ids = adminUsers.map(user => user.id);
          setAdminUserIds(ids);
          setAdminIdsLoaded(true);
          console.log('🔧 [Admin Filter] Loaded admin user IDs:', ids);
        } else {
          // Even if there's an error, mark as loaded to prevent infinite waiting
          setAdminIdsLoaded(true);
          console.warn('⚠️ [Admin Filter] Failed to load admin IDs, proceeding without filtering');
        }
      } catch (error) {
        console.error('❌ [Admin Filter] Error fetching admin users:', error);
        setAdminIdsLoaded(true); // Mark as loaded even on error
      }
    };

    fetchAdminUsers();
  }, []);

  // Play notification sound based on type
  const playNotificationSound = useCallback(async (notificationType: string, notification?: RealtimeNotification) => {
    if (!soundEnabled) return;

    try {
      let soundType: 'newUser' | 'projectUpdate' | 'payment' | 'general' | 'emergency' | 'message' | 'newUserPriority' | 'orderApproved' | 'orderDelivered' | 'orderCancelled' = 'general';
      
      // Map notification types to appropriate sounds
      switch (notificationType) {
        case 'system':
          // Check for specific system notification subtypes
          if (notification?.metadata?.notification_subtype === 'user_created') {
            soundType = notification.metadata?.priority_alert ? 'newUserPriority' : 'newUser';
          } else if (notification?.metadata?.notification_subtype === 'order_approved') {
            soundType = 'orderApproved';
          } else if (notification?.metadata?.notification_subtype === 'order_delivered') {
            soundType = 'orderDelivered';
          } else if (notification?.metadata?.notification_subtype === 'order_cancelled') {
            soundType = 'orderCancelled';
          } else {
            soundType = 'newUser';
          }
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
        case 'message':
          soundType = 'message';
          break;
        case 'user_created':
          soundType = notification?.metadata?.priority_alert ? 'newUserPriority' : 'newUser';
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
      
      // Get current user to filter out admin-sent notifications
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      // Only apply admin filtering if admin user IDs are loaded
      // Otherwise, show all notifications to prevent flickering
      const filteredNotifications = (adminUserIds.length > 0 && user) ? data?.filter(notif => {
        // Filter out notifications created by the admin themselves
        const isAdminInitiated = notif.metadata?.created_by === 'admin' || 
                               notif.metadata?.sender_id === user.id ||
                               notif.metadata?.admin_action === true ||
                               notif.metadata?.initiated_by === user.id ||
                               notif.metadata?.source === 'admin_dashboard';
        
        // Enhanced: Filter out message notifications for messages sent by ANY admin user
        // Also filter messages with missing/none sender_id that could be admin-generated
        const isAdminSentMessage = notif.notification_type === 'message' && (
          notif.metadata?.sender_id === user.id || 
          notif.metadata?.from_admin === true ||
          notif.metadata?.source === 'admin_panel' ||
          notif.metadata?.source === 'admin_dashboard' ||
          // Check if sender is any admin user
          adminUserIds.includes(notif.metadata?.sender_id) ||
          // NEW: Filter messages with missing/none/empty sender_id that could be admin-generated
          (!notif.metadata?.sender_id || 
           notif.metadata?.sender_id === 'none' || 
           notif.metadata?.sender_id === '' ||
           notif.metadata?.sender_id === null)
        );
        
        // Check if this notification is about an action the current admin user performed
        const isCurrentUserAction = notif.entity_id && 
                                  (notif.metadata?.performed_by === user.id ||
                                   notif.metadata?.updated_by === user.id ||
                                   notif.metadata?.created_by_user_id === user.id);
        
        // Only include notifications that are NOT admin-initiated
        const shouldInclude = !isAdminInitiated && !isAdminSentMessage && !isCurrentUserAction;
        
        if (!shouldInclude) {
          console.log(`🚫 [Initial Fetch] Filtered out admin notification:`, {
            id: notif.id,
            title: notif.title,
            type: notif.notification_type,
            sender_id: notif.metadata?.sender_id,
            current_user_id: user.id,
            reason: isAdminInitiated ? 'admin_initiated' : 
                   isAdminSentMessage ? 'admin_sent_message' : 
                   'current_user_action',
            is_missing_sender: !notif.metadata?.sender_id || notif.metadata?.sender_id === 'none'
          });
        }
        
        return shouldInclude;
      }) || [] : data || [];

      console.log(`📊 [Initial Fetch] Loaded ${filteredNotifications.length} notifications (filtered from ${data?.length || 0} total, admin IDs loaded: ${adminUserIds.length > 0})`);

      setNotificationsWithLogging(filteredNotifications);
      notificationsRef.current = filteredNotifications; // Update ref
      
      // Count unread notifications
      const unreadCount = filteredNotifications.filter(n => !n.is_read).length;
      setUnreadCountWithLogging(unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [adminUserIds]);

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

      // Update local state immediately
      setNotificationsWithLogging(prev => {
        const updated = prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString(), isNew: false }
            : n
        );
        notificationsRef.current = updated; // Update ref
        console.log('📝 [Notifications] Local state updated - notification marked as read');
        return updated;
      });

      // Recalculate unread count from the updated filtered notifications 
      setUnreadCountWithLogging(0); // The function will calculate the actual count from notificationsRef.current
      
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
      setNotificationsWithLogging(prev => 
        prev.map(n => ({ 
          ...n, 
          is_read: true, 
          read_at: new Date().toISOString() 
        }))
      );

      setUnreadCountWithLogging(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [notifications]);

  // Clear old notifications
  const clearNotifications = useCallback(async () => {
    try {
      setNotificationsWithLogging([]);
      setUnreadCountWithLogging(0);
      
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
      setNotificationsWithLogging(prev => prev.filter(n => n.id !== notificationId));
      
      // Recalculate unread count from the updated filtered notifications
      setUnreadCountWithLogging(0); // The function will calculate the actual count from notificationsRef.current

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
    // Only proceed if admin IDs are loaded to prevent race conditions
    if (adminUserIds.length === 0) {
      console.log('⏳ [Real-time Notifications] Waiting for admin user IDs to load...');
      return;
    }

    
    const setupSubscription = async () => {
      try {
        // Ensure user is authenticated before subscribing
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.warn('⚠️ [Real-time Notifications] No authenticated user, skipping real-time subscription');
          return;
        }
        
        console.log('🔍 [Real-time Notifications] User authenticated:', { id: user.id, email: user.email });
        
        // Test database access before subscribing
        const { data: testNotifications, error: testError } = await supabase
          .from('notifications')
          .select('id, title, created_at')
          .limit(1);
          
        if (testError) {
          console.error('❌ [Real-time Notifications] Database access test failed:', testError);
          console.log('💡 [Real-time Notifications] This might be due to RLS policies. Check Supabase dashboard.');
          return;
        }
        
        console.log('✅ [Real-time Notifications] Database access test passed');
        
        // FIXED: Use proper real-time subscriptions instead of polling
        console.log('🔄 [Real-time Notifications] Setting up proper real-time subscription...');
        
        // Create a unique channel name to avoid conflicts
        const channelName = `notifications-${user.id}-${Date.now()}`;
        
        const subscription = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications'
            },
            async (payload) => {
              try {
                console.log('🔔 [Real-time] New notification received:', payload.new);
                
                const newNotification = payload.new as RealtimeNotification;
                
                // Apply the same filtering logic as before
                const isAdminInitiated = newNotification.metadata?.created_by === 'admin' || 
                                       newNotification.metadata?.sender_id === user.id ||
                                       newNotification.metadata?.admin_action === true ||
                                       newNotification.metadata?.initiated_by === user.id ||
                                       newNotification.metadata?.source === 'admin_dashboard';
                
                const isAdminSentMessage = newNotification.notification_type === 'message' && (
                  newNotification.metadata?.sender_id === user.id || 
                  newNotification.metadata?.from_admin === true ||
                  newNotification.metadata?.source === 'admin_panel' ||
                  newNotification.metadata?.source === 'admin_dashboard' ||
                  adminUserIds.includes(newNotification.metadata?.sender_id) ||
                  (!newNotification.metadata?.sender_id || 
                   newNotification.metadata?.sender_id === 'none' ||
                   newNotification.metadata?.sender_id === '')
                );
                
                // Skip if this is an admin-initiated action or admin-sent message
                if (isAdminInitiated || isAdminSentMessage) {
                  console.log('🚫 [Real-time] Filtering out admin-initiated notification:', {
                    id: newNotification.id,
                    type: newNotification.notification_type,
                    isAdminInitiated,
                    isAdminSentMessage
                  });
                  return;
                }
                
                // Skip payment notifications as requested
                if (newNotification.notification_type === 'payment_due') {
                  console.log('🚫 [Real-time] Filtering out payment notification:', newNotification.id);
                  return;
                }
                
                // Add the new notification to the state
                setNotifications(prev => {
                  // Check for duplicates
                  const exists = prev.some(n => n.id === newNotification.id);
                  if (exists) {
                    console.log('🔄 [Real-time] Notification already exists, skipping:', newNotification.id);
                    return prev;
                  }
                  
                  console.log('✅ [Real-time] Adding new notification:', {
                    id: newNotification.id,
                    title: newNotification.title,
                    type: newNotification.notification_type
                  });
                  
                  return [newNotification, ...prev];
                });
                
              } catch (error) {
                console.error('❌ [Real-time] Error processing notification:', error);
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
            async (payload) => {
              try {
                console.log('🔄 [Real-time] Notification updated:', payload.new);
                
                const updatedNotification = payload.new as RealtimeNotification;
                
                setNotifications(prev => 
                  prev.map(n => 
                    n.id === updatedNotification.id ? updatedNotification : n
                  )
                );
                
              } catch (error) {
                console.error('❌ [Real-time] Error processing notification update:', error);
              }
            }
          )
          .subscribe((status) => {
            console.log('🔗 [Real-time] Subscription status:', status);
            
            if (status === 'SUBSCRIBED') {
              console.log('✅ [Real-time] Successfully subscribed to notifications');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('❌ [Real-time] Channel error - will retry');
            } else if (status === 'TIMED_OUT') {
              console.error('⏰ [Real-time] Subscription timed out - will retry');
            } else if (status === 'CLOSED') {
              console.warn('🔒 [Real-time] Subscription closed');
            }
          });
        
        // Store subscription for cleanup
        currentSubscription.current = subscription;
        
        console.log('🎯 [Real-time] Real-time subscription setup complete');
        
      } catch (error) {
        console.error('❌ [Real-time Notifications] Setup error:', error);
        
        // Fallback: If real-time fails, use a minimal polling approach
        console.log('🔄 [Real-time] Real-time failed, using fallback polling...');
        
        const fallbackInterval = setInterval(async () => {
          try {
            const { data: latestNotifications, error: pollError } = await supabase
              .from('notifications')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(10)
              .gte('created_at', new Date(Date.now() - 60000).toISOString()); // Only last minute
              
            if (!pollError && latestNotifications && latestNotifications.length > 0) {
              console.log(`🔍 [Fallback] Found ${latestNotifications.length} recent notifications`);
              
              setNotifications(prev => {
                const newNotifications = latestNotifications.filter(notif => 
                  !prev.some(existing => existing.id === notif.id)
                );
                
                if (newNotifications.length > 0) {
                  console.log(`✅ [Fallback] Adding ${newNotifications.length} new notifications`);
                  return [...newNotifications, ...prev];
                }
                
                return prev;
              });
            }
          } catch (pollError) {
            console.error('❌ [Fallback] Polling error:', pollError);
          }
        }, 10000); // Poll every 10 seconds as fallback
        
        currentSubscription.current = { unsubscribe: () => clearInterval(fallbackInterval) };
      }
    };
    
    setupSubscription();
    
    // Cleanup function
    return () => {
      if (currentSubscription.current) {
        console.log('🧹 [Real-time Notifications] Cleaning up subscription...');
        currentSubscription.current.unsubscribe();
        currentSubscription.current = null;
      }
    };
  }, [adminUserIds]); // Re-run when admin IDs are loaded

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

  // Clean up admin-sent notifications from current state
  const cleanupAdminNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('🧹 [Cleanup] Removing admin-sent notifications from current state...');
      
      setNotificationsWithLogging(prev => {
        const filtered = prev.filter(notif => {
          // Filter out notifications created by the admin themselves
          const isAdminInitiated = notif.metadata?.created_by === 'admin' || 
                                 notif.metadata?.sender_id === user.id ||
                                 notif.metadata?.admin_action === true ||
                                 notif.metadata?.initiated_by === user.id ||
                                 notif.metadata?.source === 'admin_dashboard';
          
          // Enhanced: Filter out message notifications for messages sent by ANY admin user
          // Also filter messages with missing/none sender_id that could be admin-generated
          const isAdminSentMessage = notif.notification_type === 'message' && (
            notif.metadata?.sender_id === user.id || 
            notif.metadata?.from_admin === true ||
            notif.metadata?.source === 'admin_panel' ||
            notif.metadata?.source === 'admin_dashboard' ||
            // Check if sender is any admin user
            adminUserIds.includes(notif.metadata?.sender_id) ||
            // NEW: Filter messages with missing/none/empty sender_id that could be admin-generated
            (!notif.metadata?.sender_id || 
             notif.metadata?.sender_id === 'none' || 
             notif.metadata?.sender_id === '' ||
             notif.metadata?.sender_id === null)
          );
          
          // Check if this notification is about an action the current admin user performed
          const isCurrentUserAction = notif.entity_id && 
                                    (notif.metadata?.performed_by === user.id ||
                                     notif.metadata?.updated_by === user.id ||
                                     notif.metadata?.created_by_user_id === user.id);
          
          const shouldKeep = !isAdminInitiated && !isAdminSentMessage && !isCurrentUserAction;
          
          if (!shouldKeep) {
            console.log(`🗑️ [Cleanup] Removing admin notification:`, {
              id: notif.id,
              title: notif.title,
              sender_id: notif.metadata?.sender_id,
              is_missing_sender: !notif.metadata?.sender_id || notif.metadata?.sender_id === 'none'
            });
          }
          
          return shouldKeep;
        });
        
        notificationsRef.current = filtered;
        console.log(`✅ [Cleanup] Cleaned up notifications: ${filtered.length} remaining (removed ${prev.length - filtered.length})`);
        return filtered;
      });
      
      // Recalculate unread count
      const unreadCount = notificationsRef.current.filter(n => !n.is_read).length;
      setUnreadCountWithLogging(unreadCount);
      
    } catch (error) {
      console.error('❌ [Cleanup] Error cleaning up admin notifications:', error);
    }
  }, []);

  // Periodic state monitoring to catch micro-second changes (reduced frequency)
  useEffect(() => {
    const monitoringInterval = setInterval(() => {
      // Only log when there are significant changes, not every 2 seconds
      if (notifications.length > 0 || unreadCount > 0) {
        console.log('🔍 [State Monitor] State check:', {
          total: notifications.length,
          unread: unreadCount,
          timestamp: new Date().toISOString()
        });
      }
    }, 10000); // Reduced from 2 seconds to 10 seconds

    return () => clearInterval(monitoringInterval);
  }, [notifications, unreadCount, adminIdsLoaded, adminUserIds]);

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
    cleanupAdminNotifications, // New function
  };
} 
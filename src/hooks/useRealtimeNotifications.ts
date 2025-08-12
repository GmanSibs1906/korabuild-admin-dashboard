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
    if (!adminIdsLoaded) {
      console.log('⏳ [Real-time Notifications] Waiting for admin IDs to load...');
      return;
    }

    fetchNotifications();

    // Subscribe to real-time changes with better error handling
    console.log('🔄 [Real-time Notifications] Setting up subscription...');
    
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
        
        // TEMPORARY FIX: Use polling instead of real-time to avoid binding errors
        console.log('🔄 [Real-time Notifications] Using polling mode to avoid binding errors...');
        
        // Track processed notifications to prevent duplicates
        let processedNotificationIds = new Set<string>();
        let lastPollTime = new Date();
        
        // Initialize with current notifications to avoid re-processing them
        notifications.forEach(notification => {
          processedNotificationIds.add(notification.id);
        });
        
        const pollForUpdates = async () => {
          try {
            const { data: latestNotifications, error: pollError } = await supabase
              .from('notifications')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(50);
              
            if (!pollError && latestNotifications) {
              console.log(`🔍 [Polling] Checking ${latestNotifications.length} notifications for updates...`);
              
              // Only apply admin filtering if admin user IDs are loaded to prevent flickering
              const filteredAllNotifications = (adminUserIds.length > 0) ? latestNotifications.filter(notif => {
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
                
                // NEW: Filter out admin-created notifications (but keep mobile app approvals)
                const isAdminCreatedNotification = (
                  // Filter out "New Contractor Added" notifications from admin
                  (notif.title === '👷 New Contractor Added' && notif.metadata?.source !== 'mobile_app_approval') ||
                  (notif.title === 'New Contractor Added' && notif.metadata?.source !== 'mobile_app_approval') ||
                  
                  // Filter out "Delivery Scheduled" notifications from admin
                  (notif.title?.includes('Delivery Scheduled') && notif.metadata?.source !== 'mobile_app_approval') ||
                  (notif.title?.includes('📦 Delivery Scheduled') && notif.metadata?.source !== 'mobile_app_approval') ||
                  
                  // Filter out "New Order Added" notifications from admin
                  (notif.title === '📦 New Order Added' && notif.metadata?.source !== 'mobile_app_approval') ||
                  (notif.title === 'New Order Added' && notif.metadata?.source !== 'mobile_app_approval') ||
                  
                  // Filter out any notification with source indicating admin creation
                  notif.metadata?.source === 'admin_creation' ||
                  notif.metadata?.source === 'admin_dashboard_creation' ||
                  notif.metadata?.created_via === 'admin_dashboard'
                );
                
                // KEEP mobile app approvals and user actions
                const isMobileAppApproval = (
                  notif.metadata?.source === 'mobile_app_approval' ||
                  notif.metadata?.notification_subtype === 'contractor_approved' ||
                  notif.metadata?.notification_subtype === 'order_approved' ||
                  notif.metadata?.notification_subtype === 'user_action' ||
                  notif.title?.includes('accepted') ||
                  notif.title?.includes('approved')
                );
                
                // Check if this notification is about an action the current admin user performed
                const isCurrentUserAction = notif.entity_id && 
                                          (notif.metadata?.performed_by === user.id ||
                                           notif.metadata?.updated_by === user.id ||
                                           notif.metadata?.created_by_user_id === user.id);
                
                // Debug logging for admin filtering - enhanced to show filtering reasons
                if (isAdminCreatedNotification && !isMobileAppApproval) {
                  console.log(`🚫 [Polling] Filtering out admin-created notification:`, {
                    id: notif.id,
                    title: notif.title,
                    source: notif.metadata?.source,
                    notification_subtype: notif.metadata?.notification_subtype,
                    reason: 'Admin-created notification filtered out'
                  });
                }
                
                if (isMobileAppApproval) {
                  console.log(`✅ [Polling] Keeping mobile app approval:`, {
                    id: notif.id,
                    title: notif.title,
                    source: notif.metadata?.source,
                    notification_subtype: notif.metadata?.notification_subtype,
                    reason: 'Mobile app approval - keeping'
                  });
                }
                
                // Debug logging for admin message filtering
                if (notif.notification_type === 'message' && isAdminSentMessage) {
                  console.log(`🚫 [Polling] Filtering out admin message:`, {
                    id: notif.id,
                    title: notif.title,
                    sender_id: notif.metadata?.sender_id,
                    is_admin_sender: adminUserIds.includes(notif.metadata?.sender_id),
                    is_missing_sender: !notif.metadata?.sender_id || notif.metadata?.sender_id === 'none',
                    admin_user_ids: adminUserIds
                  });
                }
                
                // Only include notifications that are NOT admin-initiated, NOT admin-created, BUT ARE mobile app approvals
                return !isAdminInitiated && !isAdminSentMessage && !isCurrentUserAction && 
                       (!isAdminCreatedNotification || isMobileAppApproval);
              }) : latestNotifications;
              
              console.log(`📊 [Polling] Filtered notifications: ${filteredAllNotifications.length} (from ${latestNotifications.length} total, admin filtering: ${adminUserIds.length > 0})`);
              
              // Find truly new notifications from the filtered list
              const newNotifications = filteredAllNotifications.filter(notif => {
                const isNewNotification = !processedNotificationIds.has(notif.id);
                const isForCurrentUser = notif.user_id === user.id || !notif.user_id;
                const createdAfterLastPoll = new Date(notif.created_at) > lastPollTime;
                
                return isNewNotification && isForCurrentUser && createdAfterLastPoll;
              });
              
              console.log(`📊 [Polling] Found ${newNotifications.length} new legitimate notifications since last poll`);
              
              // Process new notifications for toast/sound
              for (const newNotification of newNotifications) {
                console.log('📨 [Polling] Processing new notification:', {
                  id: newNotification.id,
                  title: newNotification.title,
                  type: newNotification.notification_type,
                  created_at: newNotification.created_at,
                  is_read: newNotification.is_read
                });
                
                // Add to processed set immediately to prevent reprocessing
                processedNotificationIds.add(newNotification.id);
                
                // Only show toast and play sound for unread notifications
                if (!newNotification.is_read) {
                  const typedNotification: RealtimeNotification = {
                    ...newNotification,
                    isNew: true
                  };
                  
                  try {
                    console.log('🍞 [Polling] Showing toast for new unread notification');
                    showToastNotification(typedNotification);
                    
                    console.log('🔊 [Polling] Playing sound for new unread notification');
                    await playNotificationSound(typedNotification.notification_type, typedNotification);
                    
                    console.log('✅ [Polling] New notification processed successfully');
                  } catch (error) {
                    console.error('❌ [Polling] Error processing notification:', error);
                  }
                } else {
                  console.log('📖 [Polling] Notification already read, skipping toast/sound');
                }
              }
              
              // Update state with filtered notifications only
              setNotificationsWithLogging(filteredAllNotifications);
              notificationsRef.current = filteredAllNotifications;
              
              const unreadCount = filteredAllNotifications.filter(n => !n.is_read).length;
              setUnreadCountWithLogging(unreadCount);
              
              // Update last poll time
              lastPollTime = new Date();
              
              console.log(`📊 [Polling] State updated: ${filteredAllNotifications.length} total, ${unreadCount} unread (admin notifications excluded)`);
              
            } else if (pollError) {
              console.error('❌ [Real-time Notifications] Polling failed:', pollError);
            }
          } catch (pollError) {
            console.error('❌ [Real-time Notifications] Polling exception:', pollError);
          }
        };
        
        // Poll every 15 seconds for new notifications (reduced frequency for better performance)
        const pollInterval = setInterval(pollForUpdates, 15000);
        
        // Store the interval for cleanup
        channelRef.current = { 
          interval: pollInterval,
          // Store cleanup function to reset processed notifications
          cleanup: () => {
            processedNotificationIds.clear();
          }
        };
        
        console.log('✅ [Real-time Notifications] Polling mode active (5 second intervals)');
        
        /*
        // DISABLED: Real-time subscription causing binding errors
        // TODO: Re-enable once Supabase real-time binding issues are resolved
        
        const channel = supabase
          .channel(`notifications_realtime_${user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notifications'
            },
            async (payload) => {
              // Real-time callback code...
            }
          )
          .subscribe((status, error) => {
            // Subscription status handling...
          });

        channelRef.current = channel;
        */
        
      } catch (error) {
        console.error('❌ [Real-time Notifications] Setup failed:', error);
        console.log('💡 [Real-time Notifications] Falling back to basic polling...');
        
        // Basic fallback: Poll for notifications every 30 seconds
        const fallbackInterval = setInterval(async () => {
          try {
            const { data: latestNotifications, error: pollError } = await supabase
              .from('notifications')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(50);
              
            if (!pollError && latestNotifications) {
              setNotificationsWithLogging(latestNotifications);
              notificationsRef.current = latestNotifications;
              const unreadCount = latestNotifications.filter(n => !n.is_read).length;
              setUnreadCountWithLogging(unreadCount);
            }
          } catch (fallbackError) {
            console.error('❌ [Real-time Notifications] Fallback polling failed:', fallbackError);
          }
        }, 30000);
        
        channelRef.current = { interval: fallbackInterval };
      }
    };
    
    setupSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (channelRef.current) {
        console.log('🧹 [Real-time] Cleaning up notification subscription');
        
        if (channelRef.current.interval) {
          // Cleanup polling interval
          clearInterval(channelRef.current.interval);
          console.log('✅ [Real-time] Polling interval cleared');
        } else {
          // Cleanup Supabase channel (when real-time is re-enabled)
          supabase.removeChannel(channelRef.current);
          console.log('✅ [Real-time] Supabase channel removed');
        }
        
        channelRef.current = null;
      }
    };
  }, [fetchNotifications, showToastNotification, playNotificationSound, adminIdsLoaded]);

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
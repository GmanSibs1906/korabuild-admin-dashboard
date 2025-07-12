import { useState, useEffect, useCallback } from 'react';

interface CommunicationStats {
  totalConversations: number;
  totalMessages: number;
  unreadMessages: number;
  pendingApprovals: number;
  urgentRequests: number;
  averageResponseTime: number;
  responseRate: number;
  escalatedRequests: number;
}

interface ConversationWithDetails {
  id: string;
  project_id: string;
  conversation_name: string;
  conversation_type: string;
  description: string;
  is_private: boolean;
  participants: string[];
  last_message_at: string;
  message_count: number;
  priority_level: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  project?: {
    project_name: string;
    client_id: string;
    client_name?: string;
  };
  last_message?: {
    message_text: string;
    sender_id: string;
    created_at: string;
  };
  unread_count: number;
  days_since_last_message?: number;
}

interface ApprovalRequestWithDetails {
  id: string;
  project_id: string;
  request_type: string;
  title: string;
  description: string;
  requested_by: string;
  assigned_to: string;
  priority_level: string;
  status: string;
  due_date: string;
  estimated_cost_impact: number;
  estimated_time_impact: number;
  created_at: string;
  updated_at: string;
  project?: {
    project_name: string;
    client_name?: string;
  };
  requester?: {
    full_name: string;
    email: string;
  };
  assignee?: {
    full_name: string;
    email: string;
  };
  days_pending: number;
}

interface NotificationWithDetails {
  id: string;
  user_id: string;
  project_id: string;
  notification_type: string;
  title: string;
  message: string;
  priority_level: string;
  is_read: boolean;
  read_at: string;
  action_url: string;
  created_at: string;
  project?: {
    project_name: string;
  };
  user?: {
    full_name: string;
    email: string;
  };
}

interface CommunicationData {
  stats: CommunicationStats;
  conversations: ConversationWithDetails[];
  approvalRequests: ApprovalRequestWithDetails[];
  notifications: NotificationWithDetails[];
  recentCommunications: any[];
  messagesByType: { [key: string]: number };
  responseTimeByUser: { [key: string]: number };
}

interface UseCommunicationsOptions {
  limit?: number;
  offset?: number;
  type?: 'conversations' | 'approvals' | 'notifications' | 'all';
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseCommunicationsResult {
  data: CommunicationData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  sendMessage: (messageData: any) => Promise<void>;
  respondToApproval: (approvalData: any) => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  createBroadcast: (broadcastData: any) => Promise<void>;
}

export function useCommunications(options: UseCommunicationsOptions = {}): UseCommunicationsResult {
  const [data, setData] = useState<CommunicationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    limit = 50,
    offset = 0,
    type = 'all',
    autoRefresh = false,  // Default to false to prevent aggressive refreshing
    refreshInterval = 300000 // 5 minutes (300 seconds) - more reasonable default
  } = options;

  const fetchCommunicationData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 [useCommunications] Fetching communication data...');
      
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        type: type
      });

      const response = await fetch(`/api/communications?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const communicationData = await response.json();
      
      console.log('✅ [useCommunications] Communication data fetched successfully');
      console.log('📊 [useCommunications] Data summary:', {
        totalConversations: communicationData.stats.totalConversations,
        totalMessages: communicationData.stats.totalMessages,
        pendingApprovals: communicationData.stats.pendingApprovals,
        unreadMessages: communicationData.stats.unreadMessages
      });
      
      setData(communicationData);
    } catch (err) {
      console.error('❌ [useCommunications] Error fetching communication data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch communication data');
    } finally {
      setIsLoading(false);
    }
  }, [limit, offset, type]);

  const sendMessage = useCallback(async (messageData: any) => {
    try {
      console.log('📝 [useCommunications] Sending message...');
      
      const response = await fetch('/api/communications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send_message',
          data: messageData
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('✅ [useCommunications] Message sent successfully');
      
      // Refresh data after sending message
      await fetchCommunicationData();
      
      return result;
    } catch (err) {
      console.error('❌ [useCommunications] Error sending message:', err);
      throw err;
    }
  }, [fetchCommunicationData]);

  const respondToApproval = useCallback(async (approvalData: any) => {
    try {
      console.log('✅ [useCommunications] Responding to approval...');
      
      const response = await fetch('/api/communications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'respond_to_approval',
          data: approvalData
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('✅ [useCommunications] Approval response submitted successfully');
      
      // Refresh data after responding to approval
      await fetchCommunicationData();
      
      return result;
    } catch (err) {
      console.error('❌ [useCommunications] Error responding to approval:', err);
      throw err;
    }
  }, [fetchCommunicationData]);

  const markNotificationRead = useCallback(async (notificationId: string) => {
    try {
      console.log('👀 [useCommunications] Marking notification as read...');
      
      const response = await fetch('/api/communications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_notification_read',
          data: { notification_id: notificationId }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('✅ [useCommunications] Notification marked as read');
      
      // Refresh data after marking notification as read
      await fetchCommunicationData();
      
      return result;
    } catch (err) {
      console.error('❌ [useCommunications] Error marking notification as read:', err);
      throw err;
    }
  }, [fetchCommunicationData]);

  const createBroadcast = useCallback(async (broadcastData: any) => {
    try {
      console.log('📢 [useCommunications] Creating broadcast...');
      
      const response = await fetch('/api/communications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_broadcast',
          data: broadcastData
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('✅ [useCommunications] Broadcast created successfully');
      
      // Refresh data after creating broadcast
      await fetchCommunicationData();
      
      return result;
    } catch (err) {
      console.error('❌ [useCommunications] Error creating broadcast:', err);
      throw err;
    }
  }, [fetchCommunicationData]);

  // Initial fetch
  useEffect(() => {
    fetchCommunicationData();
  }, [fetchCommunicationData]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchCommunicationData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchCommunicationData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchCommunicationData,
    sendMessage,
    respondToApproval,
    markNotificationRead,
    createBroadcast
  };
}

export default useCommunications; 
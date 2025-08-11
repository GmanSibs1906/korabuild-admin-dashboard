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
    sender_name?: string;
    created_at: string;
  };
  sender_info?: {
    id: string;
    name: string;
    role: string;
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
  supporting_documents: string[];
  created_at: string;
  updated_at: string;
  project?: {
    project_name: string;
  };
  requester?: {
    full_name: string;
  };
  assignee?: {
    full_name: string;
  };
  days_pending?: number;
}

interface NotificationWithDetails {
  id: string;
  project_id: string;
  notification_type: string;
  title: string;
  message: string;
  priority_level: string;
  is_read: boolean;
  created_at: string;
  project?: {
    project_name: string;
  };
}

interface RecentCommunication {
  id: string;
  project_id: string;
  communication_type: string;
  subject: string;
  from_person: string;
  to_person: string;
  communication_date: string;
  priority: string;
  projects?: {
    project_name: string;
  };
}

interface CommunicationsData {
  stats: CommunicationStats;
  conversations: ConversationWithDetails[];
  approvalRequests: ApprovalRequestWithDetails[];
  notifications: NotificationWithDetails[];
  recentCommunications: RecentCommunication[];
}

interface UseCommunicationsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseCommunicationsResult {
  data: CommunicationsData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  markConversationRead: (conversationId: string) => Promise<void>;
}

const initialData: CommunicationsData = {
  stats: {
    totalConversations: 0,
    totalMessages: 0,
    unreadMessages: 0,
    pendingApprovals: 0,
    urgentRequests: 0,
    averageResponseTime: 0,
    responseRate: 0,
    escalatedRequests: 0,
  },
  conversations: [],
  approvalRequests: [],
  notifications: [],
  recentCommunications: [],
};

export function useCommunications(options: UseCommunicationsOptions = {}): UseCommunicationsResult {
  const { autoRefresh = false, refreshInterval = 300000 } = options;
  const [data, setData] = useState<CommunicationsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 [useCommunications] Fetching communications data...');
      
      const response = await fetch('/api/communications', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      console.log('✅ [useCommunications] Communications data fetched successfully');
      
      // The API already provides sender_info and proper last_message data
      // No need for additional API calls - this was causing slow loading!
      setData(result);
    } catch (err) {
      console.error('❌ [useCommunications] Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch communications data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markConversationRead = useCallback(async (conversationId: string) => {
    try {
      console.log('📖 [useCommunications] Marking conversation as read:', conversationId);
      
      const response = await fetch('/api/communications/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_conversation_read',
          conversationId: conversationId
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to mark conversation as read: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      console.log('✅ [useCommunications] Conversation marked as read successfully');
      
      // Optimistically update local state
      setData(prevData => {
        if (!prevData) return prevData;
        
        // Find the conversation to get its current unread_count
        const conversation = prevData.conversations.find(conv => conv.id === conversationId);
        const currentUnreadCount = conversation?.unread_count || 0;
        
        return {
          ...prevData,
          conversations: prevData.conversations.map(conv => 
            conv.id === conversationId 
              ? { ...conv, unread_count: 0 }
              : conv
          ),
          stats: {
            ...prevData.stats,
            unreadMessages: Math.max(0, prevData.stats.unreadMessages - currentUnreadCount)
          }
        };
      });
      
      // Optimistic update is sufficient - no need for additional refetch
      
    } catch (err) {
      console.error('❌ [useCommunications] Error marking conversation as read:', err);
      throw err;
    }
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      console.log('🔄 [useCommunications] Auto-refreshing data...');
      fetchData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    markConversationRead,
  };
} 
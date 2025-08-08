'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database';

// Define types locally since they may not be in the generated types yet
type Conversation = {
  id: string;
  project_id: string | null;
  conversation_name: string;
  conversation_type: string;
  description: string | null;
  is_private: boolean;
  participants: string[];
  created_by: string | null;
  last_message_at: string;
  message_count: number;
  is_archived: boolean;
  priority_level: string;
  metadata: any;
  created_at: string;
  updated_at: string;
};

type Message = {
  id: string;
  conversation_id: string | null;
  sender_id: string | null;
  message_text: string | null;
  message_type: string;
  attachment_urls: string[];
  reply_to_id: string | null;
  is_edited: boolean;
  edited_at: string | null;
  is_pinned: boolean;
  read_by: any;
  reactions: any;
  metadata: any;
  created_at: string;
  updated_at: string;
};

interface MessagesStats {
  totalConversations: number;
  totalMessages: number;
  unreadMessages: number;
  activeConversations: number;
}

export function useMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<MessagesStats>({
    totalConversations: 0,
    totalMessages: 0,
    unreadMessages: 0,
    activeConversations: 0
  });

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the communications API for accurate unread counts
      console.log('🔍 [useMessages] Fetching from communications API...');
      
      const response = await fetch('/api/communications?limit=1000');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const communicationData = await response.json();
      
      console.log('✅ [useMessages] Communications data received:', {
        conversations: communicationData.conversations?.length,
        totalMessages: communicationData.stats?.totalMessages,
        unreadMessages: communicationData.stats?.unreadMessages
      });

      // Extract conversations and calculate stats from communications API
      const conversationsArray = communicationData.conversations || [];
      
      // Also fetch raw messages for backward compatibility
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (messagesError) {
        console.warn('Warning fetching raw messages:', messagesError);
        // Don't fail completely, just use empty array
      }

      const messagesArray = messagesData || [];

      setConversations(conversationsArray);
      setMessages(messagesArray);

      // Use accurate stats from communications API
      const activeConversations = conversationsArray.filter((c: any) => !c.is_archived).length;

      setStats({
        totalConversations: communicationData.stats?.totalConversations || conversationsArray.length,
        totalMessages: communicationData.stats?.totalMessages || messagesArray.length,
        unreadMessages: communicationData.stats?.unreadMessages || 0, // Use accurate count from communications API
        activeConversations
      });

      console.log('📊 [useMessages] Stats updated:', {
        totalConversations: communicationData.stats?.totalConversations || conversationsArray.length,
        totalMessages: communicationData.stats?.totalMessages || messagesArray.length,
        unreadMessages: communicationData.stats?.unreadMessages || 0,
        activeConversations
      });

    } catch (err) {
      console.error('❌ [useMessages] Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Set up real-time subscriptions
    const conversationsSubscription = supabase
      .channel('conversations_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'conversations' },
        () => {
          console.log('🔄 [useMessages] Conversations changed, refetching...');
          fetchMessages();
        }
      )
      .subscribe();

    const messagesSubscription = supabase
      .channel('messages_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          console.log('🔄 [useMessages] Messages changed, refetching...');
          fetchMessages();
        }
      )
      .subscribe();

    // Also listen for communication_log changes for accurate unread counts
    const communicationLogSubscription = supabase
      .channel('communication_log_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'communication_log' },
        () => {
          console.log('🔄 [useMessages] Communication log changed, refetching...');
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      conversationsSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
      communicationLogSubscription.unsubscribe();
    };
  }, []); // Empty dependency array - only run on mount to prevent infinite loops

  return {
    conversations,
    messages,
    loading,
    error,
    stats,
    refetch: fetchMessages
  };
} 
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

      // Fetch conversations
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (conversationsError) {
        console.error('Error fetching conversations:', conversationsError);
        setError(conversationsError.message);
        return;
      }

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        setError(messagesError.message);
        return;
      }

      const conversationsArray = conversationsData || [];
      const messagesArray = messagesData || [];

      setConversations(conversationsArray);
      setMessages(messagesArray);

      // Calculate stats
      const activeConversations = conversationsArray.filter(c => !c.is_archived).length;
      
      // Count unread messages (messages without read_by data or empty read_by)
      const unreadMessages = messagesArray.filter(m => {
        const readBy = m.read_by as any;
        return !readBy || Object.keys(readBy).length === 0;
      }).length;

      setStats({
        totalConversations: conversationsArray.length,
        totalMessages: messagesArray.length,
        unreadMessages,
        activeConversations
      });

    } catch (err) {
      console.error('Unexpected error fetching messages:', err);
      setError('Failed to load messages');
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
          fetchMessages();
        }
      )
      .subscribe();

    const messagesSubscription = supabase
      .channel('messages_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      conversationsSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
    };
  }, []);

  return {
    conversations,
    messages,
    loading,
    error,
    stats,
    refetch: fetchMessages
  };
} 
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Clock, Users, Send, ArrowRight, Search, User, MapPin } from 'lucide-react';
import { useCommunications } from '@/hooks/useCommunications';
import { MessageDetailModal } from '@/components/communications/MessageDetailModal';
import { BroadcastModal } from '@/components/communications/BroadcastModal';
import { cn } from '@/lib/utils';

interface ConversationWithSender {
  id: string;
  conversation_name: string;
  sender_name: string;
  sender_id: string;
  project_name?: string;
  project_id?: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  message_count: number;
  conversation_type: string;
  priority_level: string;
}

export default function CommunicationsPage() {
  const searchParams = useSearchParams();
  const [selectedConversation, setSelectedConversation] = useState<{
    id: string;
    name: string;
    projectName?: string;
  } | null>(null);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [senderBasedConversations, setSenderBasedConversations] = useState<ConversationWithSender[]>([]);
  const [processedConversationId, setProcessedConversationId] = useState<string | null>(null);
  
  const { data, isLoading, error, refetch, markConversationRead } = useCommunications({
    autoRefresh: false,
    refreshInterval: 300000
  });

  // Handle URL parameters to open specific conversations
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    
    // Prevent processing the same conversation multiple times
    if (conversationId && conversationId !== processedConversationId && data?.conversations) {
      console.log('📨 [Communications] Processing URL conversation:', conversationId);
      const conversation = data.conversations.find(c => c.id === conversationId);
      if (conversation) {
        console.log('📨 [Communications] Found conversation, opening modal:', conversation.conversation_name);
        setProcessedConversationId(conversationId);
        handleOpenConversation(
          conversation.id,
          conversation.conversation_name,
          conversation.project?.project_name
        );
      }
    } else if (!conversationId && processedConversationId) {
      // Reset when conversation is cleared from URL
      console.log('📨 [Communications] Conversation cleared from URL, resetting');
      setProcessedConversationId(null);
    }
  }, [searchParams, data?.conversations, processedConversationId]);

  // Transform conversations to be sender-based
  useEffect(() => {
    if (data?.conversations) {
      const transformedConversations: ConversationWithSender[] = [];
      
      data.conversations.forEach(conversation => {
        // Use the enhanced sender information from the hook
        const senderName = conversation.sender_info?.name || 
          conversation.last_message?.sender_name ||
          (conversation.conversation_name.includes('with ') 
            ? conversation.conversation_name.split('with ')[1] 
            : conversation.conversation_name.includes(' - ')
            ? conversation.conversation_name.split(' - ')[0]
            : conversation.conversation_name);

        const senderId = conversation.sender_info?.id || 
          conversation.participants?.[0] || '';

        transformedConversations.push({
          id: conversation.id,
          conversation_name: conversation.conversation_name,
          sender_name: senderName,
          sender_id: senderId,
          project_name: conversation.project?.project_name,
          project_id: conversation.project_id,
          last_message: conversation.last_message?.message_text || '',
          last_message_at: conversation.last_message_at,
          unread_count: conversation.unread_count,
          message_count: conversation.message_count,
          conversation_type: conversation.conversation_type,
          priority_level: conversation.priority_level
        });
      });

      // Sort by last message time (most recent first)
      transformedConversations.sort((a, b) => 
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );

      setSenderBasedConversations(transformedConversations);
    }
  }, [data?.conversations]);

  // Filter conversations based on search
  const filteredConversations = senderBasedConversations.filter(conversation =>
    conversation.sender_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.last_message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenConversation = async (conversationId: string, conversationName: string, projectName?: string) => {
    setSelectedConversation({
      id: conversationId,
      name: conversationName,
      projectName
    });
    
    // Mark conversation as read when opened
    try {
      await markConversationRead(conversationId);
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
    }
  };

  const handleCloseConversation = () => {
    console.log('📨 [Communications] Closing conversation modal');
    setSelectedConversation(null);
    setProcessedConversationId(null); // Reset processed ID
    // Remove conversation parameter from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('conversation');
    window.history.replaceState({}, '', url.toString());
  };

  const handleMessageSent = () => {
    refetch();
  };

  const handleBroadcastSent = () => {
    console.log('✅ Broadcast sent successfully');
    refetch();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Communications</h1>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              Error loading communications: {error}
      </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600">
            Manage all project conversations and communications
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={refetch}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600"
            size="sm"
            onClick={() => setBroadcastModalOpen(true)}
          >
            <Send className="h-4 w-4" />
            Send Broadcast
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search messages by sender, project, or content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data?.stats.totalConversations || 0}</div>
            <p className="text-xs text-muted-foreground">Active discussions</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data?.stats.unreadMessages || 0}</div>
                  <p className="text-xs text-muted-foreground">Need attention</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
            <div className="text-2xl font-bold text-green-600">{data?.stats.responseRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Avg. response time: {data?.stats.averageResponseTime || 0}h</p>
                </CardContent>
              </Card>
            </div>

      {/* Messages List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
            Conversations by Sender
                </CardTitle>
                <CardDescription>
            Click on any conversation to view and reply to messages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? 'No conversations match your search.' : 'No conversations found.'}
                      </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div 
                  key={conversation.id} 
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => handleOpenConversation(
                    conversation.id,
                    conversation.conversation_name,
                    conversation.project_name
                  )}
                >
                      <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <h3 className="font-medium text-lg">{conversation.sender_name}</h3>
                      </div>
                      {conversation.project_name && (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                          {conversation.project_name}
                          </Badge>
                      )}
                          <Badge
                            variant="outline"
                            className={getPriorityColor(conversation.priority_level)}
                          >
                            {conversation.priority_level}
                          </Badge>
                        </div>
                    
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {conversation.last_message || 'No messages yet'}
                    </p>
                    
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {conversation.message_count} messages
                            {conversation.unread_count > 0 && (
                              <Badge variant="secondary" className="ml-1 bg-red-100 text-red-800 text-xs px-1.5 py-0.5">
                                {conversation.unread_count} new
                              </Badge>
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(conversation.last_message_at)}
                          </span>
                      {conversation.project_name && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                          {conversation.project_name}
                            </span>
                          )}
                        </div>
                      </div>
                  
                      <div className="flex items-center gap-2">
                        {conversation.unread_count > 0 && (
                          <div className="flex flex-col items-center">
                            <Badge variant="secondary" className="bg-orange-500 text-white font-semibold">
                              {conversation.unread_count}
                            </Badge>
                            <span className="text-xs text-gray-500 mt-1">unread</span>
                          </div>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenConversation(
                            conversation.id,
                            conversation.conversation_name,
                          conversation.project_name
                        );
                      }}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
              ))
            )}
                </div>
              </CardContent>
            </Card>

      {/* Message Detail Modal */}
      {selectedConversation && (
        <MessageDetailModal
          isOpen={!!selectedConversation}
          onClose={handleCloseConversation}
          conversationId={selectedConversation.id}
          conversationName={selectedConversation.name}
          projectName={selectedConversation.projectName}
          onMessageSent={handleMessageSent}
        />
      )}

      {/* Broadcast Modal */}
      <BroadcastModal
        isOpen={broadcastModalOpen}
        onClose={() => setBroadcastModalOpen(false)}
        onBroadcastSent={handleBroadcastSent}
        />
    </div>
  );
} 
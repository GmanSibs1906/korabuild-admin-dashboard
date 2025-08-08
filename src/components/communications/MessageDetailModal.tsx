'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { X, Send, User, Clock, CheckCircle, AlertCircle, FileText, MessageSquare, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  sent_at: string;
  is_read: boolean;
  message_type: 'text' | 'image' | 'document' | 'system';
  attachments?: Array<{
    id: string;
    filename: string;
    file_type: string;
    file_size: number;
    file_url: string;
  }>;
}

interface Conversation {
  id: string;
  name: string;
  project_name?: string;
  participants: Array<{
    id: string;
    name: string;
    role: string;
    avatar_url?: string;
  }>;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  status: 'active' | 'archived' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface MessageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  conversationName: string;
  projectName?: string;
  onMessageSent?: () => void;
}

export function MessageDetailModal({
  isOpen,
  onClose,
  conversationId,
  conversationName,
  projectName,
  onMessageSent
}: MessageDetailModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const searchParams = useSearchParams();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && conversationId) {
      fetchConversationMessages();
    }
  }, [isOpen, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-focus on reply input when modal opens with reply=true
  useEffect(() => {
    if (isOpen && searchParams.get('reply') === 'true') {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        messageInputRef.current?.focus();
        console.log('💬 [MessageModal] Auto-focused on reply input');
      }, 300);
    }
  }, [isOpen, searchParams]);

  const fetchConversationMessages = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/communications/messages?conversationId=${conversationId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      setMessages(data.messages || []);
      setConversation(data.conversation || null);
      
      // Mark conversation as read
      await fetch('/api/communications/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_conversation_read',
          conversationId: conversationId
        }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch('/api/communications/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send_message',
          conversationId: conversationId,
          content: newMessage.trim(),
          messageType: 'text'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Add the new message to the list
      setMessages(prev => [...prev, data.message]);
      setNewMessage('');
      
      // Notify parent component
      onMessageSent?.();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col bg-white">
        <DialogHeader className="flex-shrink-0 border-b border-gray-200 pb-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-600" />
                <DialogTitle className="text-lg font-semibold text-black">
                  {conversationName}
                </DialogTitle>
              </div>
              {projectName && (
                <Badge variant="outline" className="text-xs text-black">
                  {projectName}
                </Badge>
              )}
              {conversation?.priority && (
                <Badge className={cn("text-xs", getPriorityColor(conversation.priority))}>
                  {conversation.priority.toUpperCase()}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {conversation && (
            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{conversation.participants.length} participants</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>Last activity: {formatMessageTime(conversation.last_message_at)}</span>
              </div>
            </div>
          )}
        </DialogHeader>

        {/* Messages Area - WhatsApp Style */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50" style={{ 
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="chat-bg" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse"%3E%3Cg fill-opacity="0.03"%3E%3Cpath d="M20 20h60v60H20z" fill="%23000"/%3E%3C/g%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100" height="100" fill="url(%23chat-bg)"/%3E%3C/svg%3E")' 
        }}>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-32 text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-600">
              <MessageSquare className="h-5 w-5 mr-2" />
              No messages yet
            </div>
          ) : (
            messages.map((message) => {
              const isAdmin = message.sender_role === 'admin';
              
              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-end space-x-2 mb-4",
                    isAdmin ? "justify-end" : "justify-start"
                  )}
                >
                  {/* Avatar for mobile app messages (left side) */}
                  {!isAdmin && (
                    <div className="flex-shrink-0 mb-1">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                        {message.sender_name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  )}
                  
                  {/* Message bubble */}
                  <div className={cn(
                    "relative max-w-xs sm:max-w-md px-4 py-2 rounded-2xl shadow-sm",
                    isAdmin 
                      ? "bg-orange-500 text-white rounded-br-md" 
                      : "bg-white text-gray-900 rounded-bl-md border border-gray-200"
                  )}>
                    {/* Message header */}
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={cn(
                        "text-xs font-medium",
                        isAdmin ? "text-orange-100" : "text-gray-600"
                      )}>
                        {message.sender_name}
                      </span>
                      <span className={cn(
                        "text-xs",
                        isAdmin ? "text-orange-200" : "text-gray-500"
                      )}>
                        {formatMessageTime(message.sent_at)}
                      </span>
                    </div>
                    
                    {/* Message content */}
                    <div className={cn(
                      "text-sm whitespace-pre-wrap",
                      isAdmin ? "text-white" : "text-gray-900"
                    )}>
                      {message.content}
                    </div>
                    
                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments.map((attachment, index) => {
                          const isImage = attachment?.file_type?.startsWith('image/');
                          
                          if (isImage) {
                            return (
                              <div key={attachment?.id || `attachment_${message.id}_${index}`} className="mt-2">
                                <img
                                  src={attachment.file_url}
                                  alt={attachment.filename}
                                  className="max-w-full max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => {
                                    if (attachment.file_url) {
                                      window.open(attachment.file_url, '_blank');
                                    }
                                  }}
                                />
                                <div className={cn(
                                  "text-xs mt-1 text-center",
                                  isAdmin ? "text-orange-200" : "text-gray-500"
                                )}>
                                  {attachment.filename}
                                </div>
                              </div>
                            );
                          } else {
                            return (
                              <div
                                key={attachment?.id || `attachment_${message.id}_${index}`}
                                className={cn(
                                  "flex items-center space-x-2 text-xs p-2 rounded border cursor-pointer transition-colors",
                                  isAdmin 
                                    ? "text-orange-100 bg-orange-600 border-orange-400 hover:bg-orange-700" 
                                    : "text-gray-600 bg-gray-100 border-gray-300 hover:bg-gray-200"
                                )}
                                onClick={() => {
                                  if (attachment.file_url) {
                                    window.open(attachment.file_url, '_blank');
                                  }
                                }}
                              >
                                <FileText className="h-3 w-3" />
                                <span>{attachment.filename}</span>
                                <span>({(attachment.file_size / 1024).toFixed(1)} KB)</span>
                              </div>
                            );
                          }
                        })}
                      </div>
                    )}
                    
                    {/* Message status (for admin messages) */}
                    {isAdmin && (
                      <div className="flex items-center justify-end mt-1 space-x-1">
                        {message.is_read ? (
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="h-3 w-3 text-orange-200" />
                            <CheckCircle className="h-3 w-3 text-orange-200 -ml-1" />
                          </div>
                        ) : (
                          <CheckCircle className="h-3 w-3 text-orange-300" />
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Avatar for admin messages (right side) */}
                  {isAdmin && (
                    <div className="flex-shrink-0 mb-1">
                      <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-medium">
                        {message.sender_name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Area */}
        <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-white">
          <div className="flex space-x-3">
            <div className="flex-1">
              <Textarea
                ref={messageInputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your reply..."
                className="min-h-[60px] resize-none bg-white border-gray-300 text-black placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500"
                disabled={isSending}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6"
            >
              {isSending ? (
                <LoadingSpinner className="h-4 w-4" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
          {error && (
            <div className="mt-2 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {error}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

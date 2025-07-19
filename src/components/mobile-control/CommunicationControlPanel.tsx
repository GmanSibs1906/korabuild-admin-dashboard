'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface MobileCommunicationData {
  totalConversations: number;
  unreadMessages: number;
  recentMessages: MobileMessageData[];
  pendingApprovals: number;
  notificationSettings: MobileNotificationSettings;
}

interface MobileMessageData {
  id: string;
  conversationId: string;
  senderName: string;
  messageText: string;
  timestamp: string;
  isRead: boolean;
  messageType: string;
  attachments?: string[];
}

interface MobileNotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

interface CommunicationControlPanelProps {
  projectId: string;
  onDataSync: (data: any) => void;
}

export function CommunicationControlPanel({ projectId, onDataSync }: CommunicationControlPanelProps) {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'messages' | 'broadcast' | 'notifications'>('overview');
  
  const [communicationData, setCommunicationData] = useState<MobileCommunicationData | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<MobileMessageData[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    targetUsers: [] as string[]
  });

  const [messageForm, setMessageForm] = useState({
    message: '',
    type: 'text',
    attachments: [] as string[]
  });

  // Fetch communication data
  const fetchCommunicationData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/mobile-control/communication?projectId=${projectId}`);
      const result = await response.json();
      
      if (result.success) {
        setCommunicationData(result.data.communication);
        setConversations(result.data.conversations || []);
        setMessages(result.data.messages || []);
        setApprovals(result.data.approvals || []);
        
        // Sync data with parent component
        onDataSync({
          type: 'communication',
          data: result.data,
          timestamp: new Date().toISOString()
        });
      } else {
        setError(result.error || 'Failed to fetch communication data');
      }
    } catch (err) {
      setError('Network error loading communication data');
      console.error('Error fetching communication data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update communication data
  const updateCommunicationData = async (updateType: string, data: any) => {
    try {
      setUpdating(true);
      setError(null);
      
      const response = await fetch('/api/mobile-control/communication', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          updateType,
          data
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh data after update
        await fetchCommunicationData();
        
        // Reset forms
        setBroadcastForm({
          title: '',
          message: '',
          priority: 'normal',
          targetUsers: []
        });
        
        setMessageForm({
          message: '',
          type: 'text',
          attachments: []
        });
        
        // Show success message
        console.log('✅ Communication data updated successfully');
      } else {
        setError(result.error || 'Failed to update communication data');
      }
    } catch (err) {
      setError('Network error updating communication data');
      console.error('Error updating communication data:', err);
    } finally {
      setUpdating(false);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!messageForm.message.trim()) return;
    
    await updateCommunicationData('send_message', {
      message: messageForm.message,
      type: messageForm.type,
      attachments: messageForm.attachments
    });
  };

  // Send broadcast message
  const sendBroadcast = async () => {
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) return;
    
    await updateCommunicationData('broadcast_message', {
      title: broadcastForm.title,
      message: broadcastForm.message,
      priority: broadcastForm.priority,
      targetUsers: ['all'] // Send to all users in project
    });
  };

  // Update notification settings
  const updateNotificationSettings = async (settings: MobileNotificationSettings) => {
    await updateCommunicationData('update_notification_settings', settings);
  };

  // Mark messages as read
  const markMessagesRead = async (messageIds: string[]) => {
    await updateCommunicationData('mark_messages_read', { messageIds });
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get message type color
  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'text':
        return 'bg-blue-100 text-blue-800';
      case 'file':
        return 'bg-purple-100 text-purple-800';
      case 'image':
        return 'bg-green-100 text-green-800';
      case 'system':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Load data on component mount
  useEffect(() => {
    fetchCommunicationData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">Loading communication data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-red-800 font-medium">Error Loading Communication Data</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
          <Button
            onClick={fetchCommunicationData}
            variant="outline"
            size="sm"
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Communication Control</h2>
          <p className="text-gray-600">Control messages and notifications that users see in their mobile app</p>
        </div>
        <Button
          onClick={fetchCommunicationData}
          variant="outline"
          size="sm"
          disabled={updating}
          className="border-orange-300 text-orange-700 hover:bg-orange-50"
        >
          {updating ? <LoadingSpinner className="w-4 h-4 mr-2" /> : null}
          Refresh Data
        </Button>
      </div>

      {/* Critical Warning */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-orange-800">Communication Control</h3>
            <div className="mt-2 text-sm text-orange-700">
              <p>Messages and notifications sent from this panel will immediately appear in users' mobile apps. Use responsibly.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', description: 'Communication metrics and summary' },
            { id: 'messages', label: 'Messages', description: 'View and respond to messages' },
            { id: 'broadcast', label: 'Broadcast', description: 'Send announcements to users' },
            { id: 'notifications', label: 'Notifications', description: 'Manage notification settings' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && communicationData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.013 8.013 0 01-7-4L3 20l4-4c-1.18-1.346-2-3.094-2-5 0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Conversations</p>
                  <p className="text-2xl font-semibold text-gray-900">{communicationData.totalConversations}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Unread Messages</p>
                  <p className="text-2xl font-semibold text-gray-900">{communicationData.unreadMessages}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                  <p className="text-2xl font-semibold text-gray-900">{communicationData.pendingApprovals}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 17h5l-5 5v-5zM5 12l5-5h4l5 5v5H5v-5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Recent Messages</p>
                  <p className="text-2xl font-semibold text-gray-900">{communicationData.recentMessages.length}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="space-y-6">
            {/* Send Message Form */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Send Message to User</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={messageForm.message}
                    onChange={(e) => setMessageForm({...messageForm, message: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Type your message here..."
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message Type
                    </label>
                    <select
                      value={messageForm.type}
                      onChange={(e) => setMessageForm({...messageForm, type: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="text">Text</option>
                      <option value="system">System</option>
                      <option value="approval_request">Approval Request</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <Button
                      onClick={sendMessage}
                      disabled={!messageForm.message.trim() || updating}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      {updating ? <LoadingSpinner className="w-4 h-4 mr-2" /> : null}
                      Send Message
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Recent Messages */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Messages</h3>
              {messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.slice(0, 10).map((message) => (
                    <div key={message.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{message.senderName}</span>
                          <Badge className={getMessageTypeColor(message.messageType)}>
                            {message.messageType}
                          </Badge>
                          {!message.isRead && (
                            <Badge className="bg-red-100 text-red-800">
                              Unread
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">{formatTimestamp(message.timestamp)}</span>
                      </div>
                      <p className="text-gray-700 mb-2">{message.messageText}</p>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="text-sm text-gray-500">
                          📎 {message.attachments.length} attachment(s)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No messages found</p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Broadcast Tab */}
        {activeTab === 'broadcast' && (
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Broadcast Message</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({...broadcastForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Broadcast title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm({...broadcastForm, message: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Broadcast message content"
                />
              </div>
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={broadcastForm.priority}
                    onChange={(e) => setBroadcastForm({...broadcastForm, priority: e.target.value as any})}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="flex-1">
                  <Button
                    onClick={sendBroadcast}
                    disabled={!broadcastForm.title.trim() || !broadcastForm.message.trim() || updating}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {updating ? <LoadingSpinner className="w-4 h-4 mr-2" /> : null}
                    Send Broadcast
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && communicationData && (
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Push Notifications</p>
                  <p className="text-sm text-gray-500">Send push notifications to mobile devices</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateNotificationSettings({
                    ...communicationData.notificationSettings,
                    pushEnabled: !communicationData.notificationSettings.pushEnabled
                  })}
                >
                  {communicationData.notificationSettings.pushEnabled ? 'Disable' : 'Enable'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-500">Send notifications via email</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateNotificationSettings({
                    ...communicationData.notificationSettings,
                    emailEnabled: !communicationData.notificationSettings.emailEnabled
                  })}
                >
                  {communicationData.notificationSettings.emailEnabled ? 'Disable' : 'Enable'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">SMS Notifications</p>
                  <p className="text-sm text-gray-500">Send notifications via SMS</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateNotificationSettings({
                    ...communicationData.notificationSettings,
                    smsEnabled: !communicationData.notificationSettings.smsEnabled
                  })}
                >
                  {communicationData.notificationSettings.smsEnabled ? 'Disable' : 'Enable'}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quiet Hours Start
                  </label>
                  <input
                    type="time"
                    value={communicationData.notificationSettings.quietHoursStart}
                    onChange={(e) => updateNotificationSettings({
                      ...communicationData.notificationSettings,
                      quietHoursStart: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quiet Hours End
                  </label>
                  <input
                    type="time"
                    value={communicationData.notificationSettings.quietHoursEnd}
                    onChange={(e) => updateNotificationSettings({
                      ...communicationData.notificationSettings,
                      quietHoursEnd: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
} 
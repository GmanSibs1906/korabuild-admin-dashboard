'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { useRequestNotifications } from '@/hooks/useRequestNotifications';
import { useDocumentsNotifications } from '@/hooks/useDocumentsNotifications';
import { useMessages } from '@/hooks/useMessages';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import NotificationDetailModal from './NotificationDetailModal';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  DollarSign,
  FileText,
  Users,
  Settings,
  Database,
  ExternalLink,
  Zap,
  TrendingUp,
  MessageCircle,
  MessageSquare,
  Bell,
  UserCheck,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CleanStatsCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'slate';
  description: string;
}

function CleanStatsCard({ title, value, icon: Icon, color, description }: CleanStatsCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    orange: 'text-orange-600 bg-orange-50',
    purple: 'text-purple-600 bg-purple-50',
    red: 'text-red-600 bg-red-50',
    slate: 'text-slate-600 bg-slate-50',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center space-x-4">
        <div className={cn("p-3 rounded-lg", colorClasses[color])}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-slate-600">{title}</h3>
          <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}

interface UnifiedNotification {
  id: string;
  source: 'admin' | 'request' | 'document' | 'message';
  type: string;
  title: string;
  message: string;
  priority: 'critical' | 'high' | 'medium' | 'low' | 'urgent' | 'normal';
  category?: string;
  entity_type?: string;
  created_at: string;
  is_read: boolean;
  action_required?: boolean;
  project_name?: string;
  client_name?: string;
  document_name?: string;
  raw_data: any; // Store original notification for type-specific actions
}

export default function AdminControlCenter() {
  const router = useRouter();
  const [selectedNotification, setSelectedNotification] = useState<UnifiedNotification | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { 
    notifications: adminNotifications, 
    stats: adminStats, 
    loading: adminLoading, 
    error: adminError,
    markAsRead: markAdminAsRead,
    markAsAcknowledged: markAdminAsAcknowledged,
    dismissNotification: dismissAdminNotification,
    getCriticalAlerts,
    getActionableNotifications 
  } = useAdminNotifications({ includeRead: false });

  const {
    notifications: requestNotifications,
    unreadCount: requestUnreadCount,
    loading: requestLoading,
    markAsRead: markRequestAsRead
  } = useRequestNotifications({ includeRead: false, limit: 50 });

  const {
    notifications: documentNotifications,
    stats: documentStats,
    loading: documentLoading
  } = useDocumentsNotifications();

  const {
    stats: messageStats,
    loading: messageLoading
  } = useMessages();

  // Show setup instructions if admin table doesn't exist
  if (adminError?.includes('table not yet created')) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-orange-800">
              <Database className="h-6 w-6 mr-3" />
              Control Center Setup Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <p className="text-orange-700 text-lg">
                Initialize your mission-critical admin notification system.
              </p>
              
              <div className="bg-white rounded-lg p-6 border border-orange-200">
                <h4 className="font-semibold text-slate-900 mb-4 flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-orange-600" />
                  Quick Setup
                </h4>
                <ol className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold">1</span>
                    <span className="text-slate-700">Open your Supabase Dashboard</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold">2</span>
                    <span className="text-slate-700">Navigate to SQL Editor</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold">3</span>
                    <div>
                      <span className="text-slate-700">Run the migration script:</span>
                      <code className="block bg-slate-100 px-3 py-2 rounded text-sm mt-1 font-mono">
                        sql/create_admin_notifications_table.sql
                      </code>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold">4</span>
                    <span className="text-slate-700">Refresh this page</span>
                  </li>
                </ol>
              </div>

              <div className="flex space-x-3">
                <Button 
                  onClick={() => window.open('https://supabase.com/dashboard/project/zzycggpcojissnllcucs/sql', '_blank')}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Supabase Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="border-slate-300 hover:bg-slate-50"
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLoading = adminLoading || requestLoading || documentLoading || messageLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-slate-600 mt-4">Initializing Control Center...</p>
        </div>
      </div>
    );
  }

  // Unify all notifications into a single array
  const unifiedNotifications: UnifiedNotification[] = [
    // Admin notifications
    ...adminNotifications.filter(n => !n.is_read && !n.is_dismissed).map(n => ({
      id: `admin-${n.id}`,
      source: 'admin' as const,
      type: n.type,
      title: n.title,
      message: n.message,
      priority: n.priority,
      category: n.category,
      entity_type: n.entity_type,
      created_at: n.created_at,
      is_read: n.is_read,
      action_required: n.action_required,
      raw_data: n
    })),
    
    // Request notifications
    ...requestNotifications.filter(n => !n.is_read).map(n => ({
      id: `request-${n.id}`,
      source: 'request' as const,
      type: n.type,
      title: n.title,
      message: n.message,
      priority: n.priority,
      category: 'communication',
      entity_type: 'request',
      created_at: n.created_at,
      is_read: n.is_read,
      action_required: n.priority === 'urgent',
      project_name: n.project_name,
      client_name: n.client_name,
      raw_data: n
    })),
    
    // Document notifications
    ...documentNotifications.filter(n => !n.is_read).map(n => ({
      id: `document-${n.id}`,
      source: 'document' as const,
      type: n.type,
      title: n.title,
      message: n.message,
      priority: (n.priority === 'urgent' ? 'critical' : 
                n.priority === 'high' ? 'high' : 
                n.priority === 'normal' ? 'medium' : 'low') as 'critical' | 'high' | 'medium' | 'low',
      category: 'compliance',
      entity_type: 'document',
      created_at: n.created_at,
      is_read: n.is_read,
      action_required: n.type === 'pending_approval' || n.type === 'approval_overdue',
      project_name: n.project_name,
      document_name: n.document_name,
      raw_data: n
    }))
  ];

  // Sort by priority and date
  const sortedNotifications = unifiedNotifications.sort((a, b) => {
    const priorityOrder = { critical: 5, urgent: 4, high: 3, medium: 2, low: 1 };
    const priorityDiff = (priorityOrder[b.priority as keyof typeof priorityOrder] || 1) - 
                        (priorityOrder[a.priority as keyof typeof priorityOrder] || 1);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const criticalAlerts = sortedNotifications.filter(n => n.priority === 'critical' || n.priority === 'urgent');
  const actionableNotifications = sortedNotifications.filter(n => n.action_required);
  
  const totalUnread = sortedNotifications.length;
  const totalCritical = criticalAlerts.length;

  // Debug logging
  console.log('🎛️ Unified Control Center Debug:', {
    adminNotifications: adminNotifications.length,
    requestNotifications: requestNotifications.length,
    documentNotifications: documentNotifications.length,
    unifiedTotal: unifiedNotifications.length,
    criticalCount: criticalAlerts.length,
    actionableCount: actionableNotifications.length,
    messageUnread: messageStats.unreadMessages
  });

  // Handle notification actions based on source
  const handleMarkAsRead = async (notification: UnifiedNotification) => {
    try {
      switch (notification.source) {
        case 'admin':
          await markAdminAsRead(notification.raw_data.id);
          break;
        case 'request':
          await markRequestAsRead(notification.raw_data.id);
          break;
        case 'document':
          // Document notifications don't have a mark as read function yet
          console.log('Document notification marked as read:', notification.id);
          break;
        case 'message':
          // Message notifications would be handled differently
          console.log('Message notification marked as read:', notification.id);
          break;
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleAcknowledge = async (notification: UnifiedNotification) => {
    try {
      switch (notification.source) {
        case 'admin':
          await markAdminAsAcknowledged(notification.raw_data.id);
          break;
        case 'request':
          // Handle request acknowledgment
          await markRequestAsRead(notification.raw_data.id);
          break;
        case 'document':
          // Handle document acknowledgment
          console.log('Document notification acknowledged:', notification.id);
          break;
      }
    } catch (error) {
      console.error('Error acknowledging notification:', error);
    }
  };

  const handleDismiss = async (notification: UnifiedNotification) => {
    try {
      switch (notification.source) {
        case 'admin':
          await dismissAdminNotification(notification.raw_data.id);
          break;
        default:
          // For non-admin notifications, just mark as read
          await handleMarkAsRead(notification);
          break;
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  // Navigation functions
  const handleViewSource = (notification: UnifiedNotification) => {
    switch (notification.source) {
      case 'admin':
        // Stay on control center for admin notifications
        break;
      case 'request':
        router.push(`/requests?id=${notification.raw_data.request_id || notification.raw_data.id}`);
        break;
      case 'document':
        router.push(`/documents?id=${notification.raw_data.document_id || notification.raw_data.id}`);
        break;
      case 'message':
        router.push('/communications');
        break;
    }
  };

  const handleNotificationClick = (notification: UnifiedNotification) => {
    setSelectedNotification(notification);
    setIsModalOpen(true);
  };

  const getRedirectPath = (notification: UnifiedNotification) => {
    switch (notification.source) {
      case 'admin':
        return null; // No direct page for admin notifications
      case 'request':
        return '/requests';
      case 'document':
        return '/documents';
      case 'message':
        return '/communications';
      default:
        return null;
    }
  };

  // Get icon for notification source
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'admin': return Settings;
      case 'request': return MessageSquare;
      case 'document': return FileText;
      case 'message': return MessageCircle;
      default: return Bell;
    }
  };

  // Get color for notification priority
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
      case 'urgent':
        return 'border-red-300 text-red-700 bg-red-50';
      case 'high':
        return 'border-orange-300 text-orange-700 bg-orange-50';
      case 'medium':
        return 'border-blue-300 text-blue-700 bg-blue-50';
      case 'low':
        return 'border-slate-300 text-slate-700 bg-slate-50';
      default:
        return 'border-slate-300 text-slate-700 bg-slate-50';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Control Center Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-orange-100 rounded-full">
            <Shield className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Mission Control Center</h1>
        <p className="text-slate-600 mt-2 text-lg">Real-time oversight and critical alert management</p>
        
        <div className="flex items-center justify-center space-x-4 mt-6">
          {totalUnread === 0 ? (
            <Badge className="bg-green-100 text-green-800 border-green-200 px-4 py-2">
              <CheckCircle className="h-4 w-4 mr-2" />
              All Systems Operational
            </Badge>
          ) : (
            <>
              <Badge variant="destructive" className="bg-red-500 text-white px-4 py-2">
                {totalUnread} Active Alerts
              </Badge>
              {totalCritical > 0 && (
                <Badge variant="destructive" className="bg-red-600 text-white animate-pulse px-4 py-2">
                  {totalCritical} CRITICAL
                </Badge>
              )}
            </>
          )}
        </div>
      </div>

      {/* Critical Alerts Section */}
      {criticalAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-8 border border-red-200">
          <div className="flex items-center mb-6">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
            <h2 className="text-xl font-bold text-red-900">Critical Alerts</h2>
            <Badge variant="destructive" className="ml-3">
              Immediate Action Required
            </Badge>
          </div>
          
          <div className="space-y-4">
            {criticalAlerts.map((alert) => (
              <div 
                key={alert.id} 
                className="bg-white rounded-xl p-6 border border-red-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleNotificationClick(alert)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-red-900 text-lg">{alert.title}</h3>
                      <Badge variant="outline" className="text-xs border-red-200 text-red-700">
                        {alert.source}
                      </Badge>
                    </div>
                    <p className="text-red-700 mt-2">{alert.message}</p>
                    <div className="flex items-center space-x-4 mt-4 text-sm text-red-600">
                      <Badge variant="outline" className="border-red-200">
                        {alert.entity_type || alert.type}
                      </Badge>
                      {alert.project_name && (
                        <span>{alert.project_name}</span>
                      )}
                      {alert.client_name && (
                        <span>{alert.client_name}</span>
                      )}
                      <span>{new Date(alert.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex space-x-3 ml-6" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleNotificationClick(alert)}
                      className="flex items-center space-x-1 border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <Eye className="h-3 w-3" />
                      <span>View</span>
                    </Button>
                    
                    {getRedirectPath(alert) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewSource(alert)}
                        className="flex items-center space-x-1 border-red-300 text-red-700 hover:bg-red-50"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Go to</span>
                      </Button>
                    )}
                    
                    {alert.action_required && (
                      <Button 
                        onClick={() => handleAcknowledge(alert)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Take Action
                      </Button>
                    )}
                    <Button 
                      variant="outline"
                      onClick={() => handleMarkAsRead(alert)}
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      Mark Read
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Alert Categories Grid */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Alert Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CleanStatsCard
            title="Financial Alerts"
            value={adminStats.financial_alerts}
            icon={DollarSign}
            color="orange"
            description="Payment & budget issues"
          />
          
          <CleanStatsCard
            title="Document Alerts"
            value={documentNotifications.filter(n => !n.is_read).length}
            icon={FileText}
            color="purple"
            description="Approvals & compliance"
          />
          
          <CleanStatsCard
            title="Request Alerts"
            value={requestUnreadCount}
            icon={MessageSquare}
            color="blue"
            description="Client requests & support"
          />
          
          <CleanStatsCard
            title="Message Alerts"
            value={messageStats.unreadMessages}
            icon={MessageCircle}
            color="green"
            description="Unread conversations"
          />
        </div>
      </div>

      {/* All Active Notifications */}
      {sortedNotifications.length > 0 ? (
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-6">
            Active Notifications ({sortedNotifications.length})
          </h2>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {sortedNotifications.map((notification) => {
                const SourceIcon = getSourceIcon(notification.source);
                const redirectPath = getRedirectPath(notification);
                
                return (
                  <div 
                    key={notification.id} 
                    className="p-6 hover:bg-slate-50 transition-colors cursor-pointer border-l-4 border-transparent hover:border-orange-200"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <SourceIcon className="h-4 w-4 text-slate-500" />
                          <h3 className="font-semibold text-slate-900">{notification.title}</h3>
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", getPriorityColor(notification.priority))}
                          >
                            {notification.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-slate-300 text-slate-600">
                            {notification.source}
                          </Badge>
                          {notification.category && (
                            <Badge variant="outline" className="text-xs border-slate-300 text-slate-600">
                              {notification.category}
                            </Badge>
                          )}
                        </div>
                        <p className="text-slate-600 mb-3">{notification.message}</p>
                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                          <span>{notification.entity_type || notification.type}</span>
                          {notification.project_name && (
                            <>
                              <span>•</span>
                              <span>{notification.project_name}</span>
                            </>
                          )}
                          {notification.client_name && (
                            <>
                              <span>•</span>
                              <span>{notification.client_name}</span>
                            </>
                          )}
                          {notification.document_name && (
                            <>
                              <span>•</span>
                              <span>{notification.document_name}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{new Date(notification.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-6" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleNotificationClick(notification)}
                          className="flex items-center space-x-1"
                        >
                          <Eye className="h-3 w-3" />
                          <span>View</span>
                        </Button>
                        
                        {redirectPath && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewSource(notification)}
                            className="flex items-center space-x-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Go to</span>
                          </Button>
                        )}
                        
                        {notification.action_required && (
                          <Button 
                            size="sm"
                            onClick={() => handleAcknowledge(notification)}
                            className="bg-slate-900 hover:bg-slate-800 text-white"
                          >
                            Handle
                          </Button>
                        )}
                        
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsRead(notification)}
                          className="border-slate-300 hover:bg-slate-50"
                        >
                          Mark Read
                        </Button>
                        
                        {notification.source === 'admin' && (
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => handleDismiss(notification)}
                            className="border-slate-300 hover:bg-slate-50 text-slate-600"
                          >
                            Dismiss
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16">
          <div className="bg-green-100 rounded-full p-6 w-fit mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">All Clear!</h3>
          <p className="text-slate-600">No active notifications requiring your attention.</p>
        </div>
      )}

      {/* Notification Detail Modal */}
      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onMarkAsRead={handleMarkAsRead}
        onAcknowledge={handleAcknowledge}
        onDismiss={handleDismiss}
        onViewSource={handleViewSource}
      />
    </div>
  );
} 
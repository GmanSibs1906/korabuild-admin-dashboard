'use client';

import React, { useState, useEffect } from 'react';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

import { 
  Bell,
  Search,
  Filter,
  MoreHorizontal,
  CheckCheck,
  X,
  ThumbsUp,
  ThumbsDown,
  Reply,
  ExternalLink,
  Eye,
  Package,
  CreditCard,
  Users,
  AlertTriangle, 
  Info,
  MessageSquare,
  ShoppingCart,
  FileText,
  Clock,
  User,
  Settings,
  Volume2,
  VolumeX,
  Trash2,
  UserPlus,
  Edit,
  Shield,
  Truck,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { MessageDetailModal } from '@/components/communications/MessageDetailModal';

interface NotificationAction {
  id: string;
  label: string;
  variant: 'primary' | 'destructive' | 'outline' | 'secondary';
  icon?: React.ComponentType<{ className?: string }>;
  action: () => void;
}

export function AdminControlCenter() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const { 
    notifications,
    unreadCount,
    loading: notificationsLoading,
    soundEnabled,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    deleteNotification,
    toggleSound,
    testRealtime,
    testSound,
  } = useRealtimeNotifications();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<{
    id: string;
    name: string;
    projectName?: string;
  } | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);

  // Ensure client-side rendering for dynamic content
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle delete confirmation
  const handleDeleteClick = (notificationId: string) => {
    setNotificationToDelete(notificationId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (notificationToDelete) {
      await deleteNotification(notificationToDelete);
      setDeleteConfirmOpen(false);
      setNotificationToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setNotificationToDelete(null);
  };

  // Filter notifications based on active tab and search
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = searchQuery === '' || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());

    switch (activeTab) {
      case 'inbox':
        return !notification.is_read && matchesSearch;
      case 'orders':
        return notification.notification_type === 'payment_due' && matchesSearch;
      case 'archived':
        return notification.is_read && matchesSearch;
      default:
        return matchesSearch;
    }
  });

  // Get user initials for avatar fallback
  const getUserInitials = (title: string) => {
    const words = title.split(' ');
    return words.length > 1 ? 
      `${words[0][0]}${words[1][0]}`.toUpperCase() : 
      title.substring(0, 2).toUpperCase();
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string, notification?: any) => {
    switch (type) {
      case 'system':
        // Handle different system notification subtypes
        if (notification.metadata?.notification_subtype === 'user_created') {
          return <UserPlus className="w-4 h-4 text-emerald-500" />;
        } else if (notification.metadata?.notification_subtype === 'order_approved') {
          return <CheckCheck className="w-4 h-4 text-green-500" />;
        } else if (notification.metadata?.notification_subtype === 'order_delivered') {
          return <Truck className="w-4 h-4 text-blue-500" />;
        } else if (notification.metadata?.notification_subtype === 'order_cancelled') {
          return <XCircle className="w-4 h-4 text-red-500" />;
        }
        return <User className="w-4 h-4 text-blue-500" />;
      case 'project_update':
        return <FileText className="w-4 h-4 text-green-500" />;
      case 'payment_due':
        return <CreditCard className="w-4 h-4 text-orange-500" />;
      case 'milestone_complete':
        return <CheckCheck className="w-4 h-4 text-green-500" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case 'emergency':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'user_created':
        return <UserPlus className="w-4 h-4 text-emerald-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  // Get contextual actions based on notification type
  const getNotificationActions = (notification: any): NotificationAction[] => {
    const actions: NotificationAction[] = [];

    switch (notification.notification_type) {
      case 'message':
        // Message notifications should have view and reply actions
        actions.push(
          {
            id: 'view-message',
            label: 'View',
            variant: 'outline',
            icon: Eye,
                        action: async () => {
              console.log('🔍 [Control Center] Opening message conversation modal:', {
                notificationId: notification.id,
                conversationId: notification.conversation_id,
                metadata: notification.metadata
              });
              
              // Mark as read first
              await markAsRead(notification.id);
              
              // Extract conversation details from notification metadata
              const metadata = notification.metadata || {};
              const conversationName = metadata.conversation_name || 
                                     notification.title?.replace('New message in ', '')?.replace('New message from ', '') ||
                                     'Conversation';
              const projectName = metadata.project_name;
              
              // Open the modal directly with conversation details
              if (notification.conversation_id) {
                console.log('💬 [Control Center] Opening chat modal for conversation:', conversationName);
                setSelectedConversation({
                  id: notification.conversation_id,
                  name: conversationName,
                  projectName: projectName
                });
              } else {
                console.log('⚠️ [Control Center] No conversation_id found, falling back to communications page');
                window.location.href = '/communications';
              }
            }
          },
          {
            id: 'reply',
            label: 'Reply',
            variant: 'primary',
            icon: Reply,
                        action: async () => {
              console.log('💬 [Control Center] Opening reply modal:', {
                notificationId: notification.id,
                conversationId: notification.conversation_id,
                metadata: notification.metadata
              });
              
              // Mark as read first
              await markAsRead(notification.id);
              
              // Extract conversation details from notification metadata
              const metadata = notification.metadata || {};
              const conversationName = metadata.conversation_name || 
                                     notification.title?.replace('New message in ', '')?.replace('New message from ', '') ||
                                     'Conversation';
              const projectName = metadata.project_name;
              
              // Open the modal directly for reply
              if (notification.conversation_id) {
                console.log('💬 [Control Center] Opening reply modal for conversation:', conversationName);
                setSelectedConversation({
                  id: notification.conversation_id,
                  name: conversationName,
                  projectName: projectName
                });
                
                // Add reply flag to URL for auto-focus
                const url = new URL(window.location.href);
                url.searchParams.set('reply', 'true');
                window.history.replaceState({}, '', url.toString());
    } else {
                console.log('⚠️ [Control Center] No conversation_id found for reply, falling back to communications page');
                window.location.href = '/communications';
              }
            }
          }
        );
        break;

      case 'payment_due':
        actions.push(
          {
            id: 'approve',
            label: 'Approve',
            variant: 'primary',
            icon: ThumbsUp,
            action: () => handleApprove(notification)
          },
          {
            id: 'decline',
            label: 'Decline',
            variant: 'destructive',
            icon: ThumbsDown,
            action: () => handleDecline(notification)
          },
          {
            id: 'view-payment',
            label: 'View Order',
            variant: 'outline',
            icon: ExternalLink,
            action: () => {
              if (notification.entity_id) {
                router.push(`/finances?payment=${notification.entity_id}`);
              } else {
                router.push('/finances');
              }
              markAsRead(notification.id);
            }
          }
        );
        break;

      case 'project_update':
        actions.push(
          {
            id: 'view-project',
            label: 'View Project',
            variant: 'outline',
            icon: Eye,
            action: () => {
              if (notification.entity_id) {
                router.push(`/projects/${notification.entity_id}`);
              } else if (notification.project_id) {
                router.push(`/projects/${notification.project_id}`);
              } else {
                router.push('/projects');
              }
              markAsRead(notification.id);
            }
          }
        );
          break;

      case 'system':
        // Handle new user notifications specially
        if (notification.metadata?.notification_subtype === 'user_created' && notification.entity_id) {
          actions.push(
            {
              id: 'view-profile',
              label: 'View Profile',
              variant: 'outline',
              icon: User,
              action: async () => {
                console.log('👤 [Control Center] Opening user profile:', {
                  notificationId: notification.id,
                  userId: notification.entity_id,
                  metadata: notification.metadata
                });
                
                try {
                  console.log('📖 [Control Center] Marking notification as read:', notification.id);
                  await markAsRead(notification.id);
                  console.log('✅ [Control Center] Notification marked as read successfully');
                } catch (error) {
                  console.error('❌ [Control Center] Error marking notification as read:', error);
                }
                
                router.push(`/users/${notification.entity_id}`);
              }
            },
            {
              id: 'edit-user',
              label: 'Edit User',
              variant: 'primary',
              icon: Edit,
              action: async () => {
                console.log('✏️ [Control Center] Opening user edit:', {
                  notificationId: notification.id,
                  userId: notification.entity_id
                });
                
                try {
                  console.log('📖 [Control Center] Marking notification as read:', notification.id);
                  await markAsRead(notification.id);
                  console.log('✅ [Control Center] Notification marked as read successfully');
                } catch (error) {
                  console.error('❌ [Control Center] Error marking notification as read:', error);
                }
                
                router.push(`/users?edit=${notification.entity_id}`);
              }
            }
          );
        } else if (notification.metadata?.notification_subtype === 'order_approved' || 
                   notification.metadata?.notification_subtype === 'order_delivered' || 
                   notification.metadata?.notification_subtype === 'order_cancelled') {
          // Order status change notifications
          actions.push(
            {
              id: 'view-order',
              label: 'View Order',
              variant: 'outline',
              icon: Package,
              action: async () => {
                console.log('📦 [Control Center] Opening order view:', {
                  notificationId: notification.id,
                  orderId: notification.related_id,
                  metadata: notification.metadata
                });
                
                await markAsRead(notification.id);
                router.push(`/orders`);
              }
            }
          );
          
          // Add project view if we have project info
          if (notification.metadata?.project_id) {
            actions.push(
              {
                id: 'view-project',
                label: 'View Project',
                variant: 'secondary',
                icon: FileText,
                action: async () => {
                  await markAsRead(notification.id);
                  router.push(`/projects/${notification.metadata.project_id}`);
                }
              }
            );
          }
        } else if (notification.entity_type === 'user' && notification.entity_id) {
          actions.push(
            {
              id: 'view-user',
              label: 'View User',
              variant: 'outline',
              icon: User,
              action: () => {
                router.push(`/users/${notification.entity_id}`);
                markAsRead(notification.id);
              }
            }
          );
        } else if (notification.entity_type === 'return_request') {
          actions.push(
            {
              id: 'view-request',
              label: 'View Request',
              variant: 'outline',
              icon: Eye,
              action: () => {
                router.push('/orders');
                markAsRead(notification.id);
              }
            }
          );
          } else {
          actions.push(
            {
              id: 'view-users',
              label: 'View Users',
              variant: 'outline',
              icon: Users,
              action: () => {
                router.push('/users');
                markAsRead(notification.id);
              }
            }
          );
        }
        break;

      case 'emergency':
        actions.push(
          {
            id: 'view-safety',
            label: 'Safety Center',
            variant: 'destructive',
            icon: AlertTriangle,
            action: () => {
              router.push('/safety');
              markAsRead(notification.id);
            }
          }
        );
          break;

      case 'user_created':
        // Priority new user notifications with special actions
        actions.push(
          {
            id: 'view-profile',
            label: 'View Profile',
            variant: 'outline',
            icon: User,
            action: async () => {
              console.log('👤 [Control Center] Opening user profile:', {
                notificationId: notification.id,
                userId: notification.entity_id,
                metadata: notification.metadata
              });
              
              await markAsRead(notification.id);
              
              if (notification.entity_id) {
                router.push(`/users/${notification.entity_id}`);
              } else {
                router.push('/users');
              }
            }
          },
          {
            id: 'edit-user',
            label: 'Edit User',
            variant: 'primary',
            icon: Edit,
            action: async () => {
              console.log('✏️ [Control Center] Opening user edit:', {
                notificationId: notification.id,
                userId: notification.entity_id
              });
              
              await markAsRead(notification.id);
              
              // This will open the edit modal in the users page
              if (notification.entity_id) {
                router.push(`/users?edit=${notification.entity_id}`);
              } else {
                router.push('/users');
              }
            }
          }
        );
          break;

        default:
        actions.push(
          {
            id: 'view',
            label: 'View',
            variant: 'outline',
            icon: Eye,
            action: () => handleView(notification)
          }
        );
    }

    return actions;
  };

  // Action handlers
  const handleApprove = (notification: any) => {
    console.log('Approving:', notification);
    markAsRead(notification.id);
    // Add approval logic here
  };

  const handleDecline = (notification: any) => {
    console.log('Declining:', notification);
    markAsRead(notification.id);
    // Add decline logic here
  };

  const handleView = (notification: any) => {
    console.log('Viewing:', notification);
    markAsRead(notification.id);
    
    // Navigate based on notification type and available data
    if (notification.action_url) {
      router.push(notification.action_url);
    } else {
      // Fallback navigation based on type
      switch (notification.notification_type) {
        case 'payment_due':
          router.push('/finances');
        break;
        case 'project_update':
        case 'milestone_complete':
          router.push('/projects');
        break;
      case 'message':
          if (notification.conversation_id) {
            router.push(`/communications?conversation=${notification.conversation_id}`);
          } else {
        router.push('/communications');
          }
        break;
        case 'system':
          if (notification.entity_type === 'user') {
            router.push('/users');
          } else {
            router.push('/dashboard');
          }
          break;
        case 'emergency':
          router.push('/safety');
          break;
      default:
          router.push('/dashboard');
      }
    }
  };

  // Get tab counts
  const getTabCount = (tab: string) => {
    switch (tab) {
      case 'inbox':
        return notifications.filter(n => !n.is_read).length;
      case 'orders':
        return notifications.filter(n => n.notification_type === 'payment_due').length;
      case 'archived':
        return notifications.filter(n => n.is_read).length;
      default:
        return notifications.length;
    }
  };

  // Safe date formatting that works during SSR
  const formatNotificationTime = (dateString: string) => {
    if (!isClient) {
      return 'just now'; // Fallback for SSR
    }
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'just now';
    }
  };

  // Don't render time-sensitive content until client-side
  if (!isClient) {
  return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="w-6 h-6 text-gray-600" />
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Notifications
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Loading notification center...
                  </p>
          </div>
        </div>
        </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
          </CardContent>
        </Card>
            </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="shadow-lg">
        {/* Header */}
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center">
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Notifications
                </CardTitle>
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="ml-3 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Manage all system notifications and take quick actions
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
                    <Button
                variant="ghost"
                      size="sm"
                onClick={toggleSound}
                className="h-9 w-9 p-0"
                title={soundEnabled ? "Sound enabled" : "Sound disabled"}
              >
                {soundEnabled ? 
                  <Volume2 className="w-4 h-4 text-green-600" /> : 
                  <VolumeX className="w-4 h-4 text-gray-400" />
                }
                    </Button>
                      <Button
                variant="ghost"
                        size="sm"
                onClick={testRealtime}
                className="h-9 w-9 p-0"
                title="Test real-time notifications"
              >
                <Bell className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button 
                variant="ghost"
                size="sm"
                onClick={testSound}
                className="h-9 w-9 p-0"
                title="Test notification sounds"
              >
                <Volume2 className="w-4 h-4 text-purple-600" />
                      </Button>
            <Button
              variant="outline"
              size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              className="flex items-center space-x-2"
            >
                <CheckCheck className="w-4 h-4" />
                <span>Mark all as read</span>
            </Button>
        </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4"
          />
        </div>
        </CardHeader>

        {/* Tabs Navigation */}
        <div className="px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="all" className="relative">
                <span className="text-emerald-600 font-medium">View all</span>
                <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-700">
                  {getTabCount('all')}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="inbox">
                Inbox
                {getTabCount('inbox') > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {getTabCount('inbox')}
                      </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="orders">
                Orders
                {getTabCount('orders') > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {getTabCount('orders')}
                </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="archived">
                Archived
                {getTabCount('archived') > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {getTabCount('archived')}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Notifications Content */}
            <TabsContent value={activeTab} className="space-y-0">
              <ScrollArea className="h-[600px] pr-4">
                {notificationsLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Loading notifications...</p>
          </div>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchQuery ? 'No matching notifications' : 'No notifications yet'}
                    </h3>
                    <p className="text-gray-500">
                      {searchQuery ? 'Try adjusting your search terms' : 'New notifications will appear here when they arrive'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredNotifications.map((notification, index) => {
                      const actions = getNotificationActions(notification);
                
                return (
                  <div 
                    key={notification.id} 
                          className={cn(
                            "p-4 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer group",
                                                         // Priority new user styling
                             (notification.notification_type === 'user_created' || (notification.notification_type === 'system' && notification.metadata?.notification_subtype === 'user_created')) && !notification.is_read
                               ? "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300 hover:from-emerald-100 hover:to-green-100 shadow-lg shadow-emerald-100/50 ring-2 ring-emerald-200/50"
                               : !notification.is_read 
                               ? "bg-blue-50 border-blue-200 hover:bg-blue-100" 
                               : "bg-white border-gray-200 hover:bg-gray-50",
                             // Read priority notifications still get subtle styling
                             (notification.notification_type === 'user_created' || (notification.notification_type === 'system' && notification.metadata?.notification_subtype === 'user_created')) && notification.is_read
                               ? "bg-emerald-25 border-emerald-200/50"
                               : ""
                          )}
                          onClick={() => !notification.is_read && markAsRead(notification.id)}
                        >
                          <div className="flex items-start space-x-4">
                            {/* Avatar */}
                            <div className="relative">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={`/api/placeholder/40/40`} />
                                <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white text-sm font-medium">
                                  {getUserInitials(notification.title)}
                                </AvatarFallback>
                              </Avatar>
                              {!notification.is_read && (
                                <div className={cn(
                                  "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white",
                                  notification.notification_type === 'user_created' || notification.metadata?.priority_alert
                                    ? "bg-orange-500 animate-pulse shadow-lg shadow-orange-300/50"
                                    : "bg-green-500"
                                )}></div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    {getNotificationIcon(notification.notification_type, notification)}
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {notification.title}
                                                                             {(notification.notification_type === 'user_created' || (notification.notification_type === 'system' && notification.metadata?.notification_subtype === 'user_created')) && (
                                         <Shield className="inline w-4 h-4 ml-2 text-emerald-600" />
                                       )}
                                    </p>
                                                                         {((notification.notification_type === 'user_created' || (notification.notification_type === 'system' && notification.metadata?.notification_subtype === 'user_created')) || notification.metadata?.priority_alert) && !notification.is_read && (
                                      <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 animate-pulse border border-orange-300">
                                        PRIORITY
                          </Badge>
                                    )}
                                                                         {!notification.is_read && !(notification.notification_type === 'user_created' || (notification.notification_type === 'system' && notification.metadata?.notification_subtype === 'user_created')) && !notification.metadata?.priority_alert && (
                                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                        New
                            </Badge>
                          )}
                                    <Badge 
                          variant="outline"
                                      className={cn(
                                        "text-xs ml-auto",
                                        notification.priority_level === 'urgent' && "border-red-500 text-red-700",
                                        notification.priority_level === 'high' && "border-orange-500 text-orange-700",
                                        notification.priority_level === 'normal' && "border-blue-500 text-blue-700",
                                        notification.priority_level === 'low' && "border-gray-500 text-gray-700"
                                      )}
                                    >
                                      {notification.notification_type.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">
                                      {formatNotificationTime(notification.created_at)}
                                    </span>
                                    
                                    {/* Quick Actions */}
                                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {actions.length > 0 && actions.map((action) => {
                                        const IconComponent = action.icon || Eye;
                                        return (
                        <Button 
                                            key={action.id}
                                            variant={action.variant}
                          size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              action.action();
                                            }}
                                            className="h-7 px-3 text-xs"
                                          >
                                            <IconComponent className="w-3 h-3 mr-1" />
                                            {action.label}
                        </Button>
                                        );
                                      })}
                        
                                      {/* Delete Button */}
                          <Button 
                                        variant="ghost"
                            size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteClick(notification.id);
                                        }}
                                        className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                        title="Delete notification"
                                      >
                                        <Trash2 className="w-3 h-3" />
                          </Button>
                      </div>
                    </div>
                  </div>
            </div>
          </div>
        </div>
          </div>
                      );
                    })}
          </div>
                )}
                
                {/* View More */}
                {filteredNotifications.length > 0 && (
                  <div className="text-center py-6 border-t border-gray-100 mt-6">
                    <Button variant="ghost" className="text-gray-500 hover:text-gray-700">
                      <Clock className="w-4 h-4 mr-2" />
                      View more
          </Button>
        </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Message Detail Modal */}
      {selectedConversation && (
        <MessageDetailModal
          isOpen={!!selectedConversation}
          onClose={() => {
            setSelectedConversation(null);
            // Clear reply parameter from URL when closing
            const url = new URL(window.location.href);
            url.searchParams.delete('reply');
            window.history.replaceState({}, '', url.toString());
          }}
          conversationId={selectedConversation.id}
          conversationName={selectedConversation.name}
          projectName={selectedConversation.projectName}
          onMessageSent={() => {
            console.log('✅ [Control Center] Message sent from modal');
            // Optionally refresh notifications or update counts
          }}
        />
      )}
    </div>
  );
} 

export default AdminControlCenter; 
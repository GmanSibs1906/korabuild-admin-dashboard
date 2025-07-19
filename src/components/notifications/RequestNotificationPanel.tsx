'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  useRequestNotifications, 
  RequestNotification 
} from '@/hooks/useRequestNotifications';
import {
  Bell,
  BellOff,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Building,
  X,
  CheckCircle2,
  Trash2,
  Filter,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

interface RequestNotificationPanelProps {
  className?: string;
  maxHeight?: string;
  showHeader?: boolean;
  showFilters?: boolean;
  onNotificationClick?: (notification: RequestNotification) => void;
}

export function RequestNotificationPanel({
  className,
  maxHeight = '400px',
  showHeader = true,
  showFilters = true,
  onNotificationClick
}: RequestNotificationPanelProps) {
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [showRead, setShowRead] = useState(false);

  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
  } = useRequestNotifications({
    includeRead: showRead,
    limit: 50,
    filterByPriority: priorityFilter
  });

  // Filter notifications by type
  const filteredNotifications = notifications.filter(notification => {
    if (typeFilter.length > 0 && !typeFilter.includes(notification.type)) {
      return false;
    }
    return true;
  });

  // Get notification icon based on type
  const getNotificationIcon = (notification: RequestNotification) => {
    switch (notification.type) {
      case 'new_request':
        return <MessageSquare className="h-4 w-4" />;
      case 'urgent_request':
        return <AlertCircle className="h-4 w-4" />;
      case 'status_update':
        return <CheckCircle className="h-4 w-4" />;
      case 'comment_added':
        return <MessageSquare className="h-4 w-4" />;
      case 'assignment_changed':
        return <User className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  // Get notification color based on priority
  const getNotificationColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 border-red-200 text-red-800';
      case 'high':
        return 'bg-orange-100 border-orange-200 text-orange-800';
      case 'medium':
        return 'bg-blue-100 border-blue-200 text-blue-800';
      case 'low':
        return 'bg-green-100 border-green-200 text-green-800';
      default:
        return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: RequestNotification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <LoadingSpinner />
            <span className="ml-2 text-gray-600">Loading notifications...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Notifications</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
              <Bell className="h-5 w-5 mr-2 text-orange-600" />
              Request Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2 bg-orange-500">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllAsRead()}
                  className="text-orange-600 hover:text-orange-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Mark All Read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearAllNotifications()}
                className="text-gray-600 hover:text-gray-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 space-y-3">
              {/* Priority Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Priority:</span>
                <div className="flex space-x-1">
                  {['urgent', 'high', 'medium', 'low'].map((priority) => (
                    <Button
                      key={priority}
                      variant={priorityFilter.includes(priority) ? 'primary' : 'outline'}
                      size="sm"
                      className={cn(
                        'text-xs',
                        priorityFilter.includes(priority) && 'bg-orange-500 hover:bg-orange-600'
                      )}
                      onClick={() => {
                        setPriorityFilter(prev => 
                          prev.includes(priority)
                            ? prev.filter(p => p !== priority)
                            : [...prev, priority]
                        );
                      }}
                    >
                      {priority}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Type Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Type:</span>
                <div className="flex space-x-1">
                  {['new_request', 'urgent_request', 'status_update', 'comment_added'].map((type) => (
                    <Button
                      key={type}
                      variant={typeFilter.includes(type) ? 'primary' : 'outline'}
                      size="sm"
                      className={cn(
                        'text-xs',
                        typeFilter.includes(type) && 'bg-orange-500 hover:bg-orange-600'
                      )}
                      onClick={() => {
                        setTypeFilter(prev => 
                          prev.includes(type)
                            ? prev.filter(t => t !== type)
                            : [...prev, type]
                        );
                      }}
                    >
                      {type.replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Show Read Toggle */}
              <div className="flex items-center space-x-2">
                <Button
                  variant={showRead ? 'primary' : 'outline'}
                  size="sm"
                  className={cn(
                    'text-xs',
                    showRead && 'bg-orange-500 hover:bg-orange-600'
                  )}
                  onClick={() => setShowRead(!showRead)}
                >
                  {showRead ? <BellOff className="h-3 w-3 mr-1" /> : <Bell className="h-3 w-3 mr-1" />}
                  {showRead ? 'Hide Read' : 'Show Read'}
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
      )}

      <CardContent className="p-0">
        <ScrollArea style={{ maxHeight }}>
          <div className="p-4 space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Notifications</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {notifications.length === 0 
                    ? "You're all caught up! No new notifications."
                    : "No notifications match your current filters."
                  }
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={cn(
                      'relative p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md',
                      notification.is_read 
                        ? 'bg-gray-50 border-gray-200 opacity-75'
                        : getNotificationColor(notification.priority),
                      'group'
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Unread Indicator */}
                    {!notification.is_read && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full"></div>
                    )}

                    {/* Notification Content */}
                    <div className="flex items-start space-x-3">
                      <div className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-full',
                        notification.priority === 'urgent' ? 'bg-red-500 text-white' :
                        notification.priority === 'high' ? 'bg-orange-500 text-white' :
                        notification.priority === 'medium' ? 'bg-blue-500 text-white' :
                        'bg-green-500 text-white'
                      )}>
                        {getNotificationIcon(notification)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant="outline" 
                              className={cn(
                                'text-xs',
                                notification.priority === 'urgent' && 'border-red-500 text-red-700',
                                notification.priority === 'high' && 'border-orange-500 text-orange-700',
                                notification.priority === 'medium' && 'border-blue-500 text-blue-700',
                                notification.priority === 'low' && 'border-green-500 text-green-700'
                              )}
                            >
                              {notification.priority}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>

                        {/* Metadata */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            {notification.client_name && (
                              <div className="flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                {notification.client_name}
                              </div>
                            )}
                            {notification.project_name && notification.project_name !== 'No Project' && (
                              <div className="flex items-center">
                                <Building className="h-3 w-3 mr-1" />
                                {notification.project_name}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                            <ExternalLink className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {index < filteredNotifications.length - 1 && (
                    <Separator className="my-2" />
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 
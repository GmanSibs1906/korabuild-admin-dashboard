'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Settings,
  MessageSquare,
  FileText,
  MessageCircle,
  Bell,
  Clock,
  User,
  Building2,
  Calendar,
  Tag,
  ExternalLink,
  CheckCircle,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  raw_data: any;
}

interface NotificationDetailModalProps {
  notification: UnifiedNotification | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (notification: UnifiedNotification) => Promise<void>;
  onAcknowledge: (notification: UnifiedNotification) => Promise<void>;
  onDismiss: (notification: UnifiedNotification) => Promise<void>;
  onViewSource: (notification: UnifiedNotification) => void;
}

export default function NotificationDetailModal({
  notification,
  isOpen,
  onClose,
  onMarkAsRead,
  onAcknowledge,
  onDismiss,
  onViewSource
}: NotificationDetailModalProps) {
  if (!notification) return null;

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'admin': return Settings;
      case 'request': return MessageSquare;
      case 'document': return FileText;
      case 'message': return MessageCircle;
      default: return Bell;
    }
  };

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

  const getSourceDescription = (source: string) => {
    switch (source) {
      case 'admin': return 'System Administration';
      case 'request': return 'Client Request';
      case 'document': return 'Document Management';
      case 'message': return 'Communication';
      default: return 'Notification';
    }
  };

  const SourceIcon = getSourceIcon(notification.source);

  const handleMarkComplete = async () => {
    if (notification.action_required) {
      await onAcknowledge(notification);
    } else {
      await onMarkAsRead(notification);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <SourceIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-left">{notification.title}</DialogTitle>
              <DialogDescription className="text-left">
                {getSourceDescription(notification.source)}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Priority and Status Badges */}
          <div className="flex items-center space-x-2">
            <Badge 
              variant="outline" 
              className={cn("text-sm", getPriorityColor(notification.priority))}
            >
              {notification.priority} priority
            </Badge>
            <Badge variant="outline" className="text-sm border-slate-300 text-slate-600">
              {notification.source}
            </Badge>
            {notification.category && (
              <Badge variant="outline" className="text-sm border-slate-300 text-slate-600">
                {notification.category}
              </Badge>
            )}
            {notification.action_required && (
              <Badge variant="destructive" className="text-sm">
                Action Required
              </Badge>
            )}
          </div>

          {/* Message Content */}
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-slate-800 leading-relaxed">{notification.message}</p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-slate-500" />
                <span className="text-slate-600">Created:</span>
                <span className="font-medium">
                  {new Date(notification.created_at).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center space-x-2 text-sm">
                <Tag className="h-4 w-4 text-slate-500" />
                <span className="text-slate-600">Type:</span>
                <span className="font-medium">{notification.entity_type || notification.type}</span>
              </div>
            </div>

            <div className="space-y-3">
              {notification.project_name && (
                <div className="flex items-center space-x-2 text-sm">
                  <Building2 className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-600">Project:</span>
                  <span className="font-medium">{notification.project_name}</span>
                </div>
              )}

              {notification.client_name && (
                <div className="flex items-center space-x-2 text-sm">
                  <User className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-600">Client:</span>
                  <span className="font-medium">{notification.client_name}</span>
                </div>
              )}

              {notification.document_name && (
                <div className="flex items-center space-x-2 text-sm">
                  <FileText className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-600">Document:</span>
                  <span className="font-medium">{notification.document_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Additional Details based on source */}
          {notification.source === 'request' && notification.raw_data && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Request Details</h4>
              <div className="space-y-2 text-sm">
                {notification.raw_data.request_category && (
                  <div><span className="text-blue-700">Category:</span> {notification.raw_data.request_category}</div>
                )}
                {notification.raw_data.urgency_level && (
                  <div><span className="text-blue-700">Urgency:</span> {notification.raw_data.urgency_level}</div>
                )}
              </div>
            </div>
          )}

          {notification.source === 'document' && notification.raw_data && (
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-2">Document Details</h4>
              <div className="space-y-2 text-sm">
                {notification.raw_data.document_type && (
                  <div><span className="text-purple-700">Type:</span> {notification.raw_data.document_type}</div>
                )}
                {notification.raw_data.expires_at && (
                  <div><span className="text-purple-700">Expires:</span> {new Date(notification.raw_data.expires_at).toLocaleDateString()}</div>
                )}
              </div>
            </div>
          )}

          {notification.source === 'admin' && notification.raw_data && (
            <div className="bg-orange-50 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-2">System Details</h4>
              <div className="space-y-2 text-sm">
                {notification.raw_data.action_type && (
                  <div><span className="text-orange-700">Action Type:</span> {notification.raw_data.action_type}</div>
                )}
                {notification.raw_data.expires_at && (
                  <div><span className="text-orange-700">Expires:</span> {new Date(notification.raw_data.expires_at).toLocaleDateString()}</div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => onViewSource(notification)}
              className="flex items-center space-x-2"
            >
              <ExternalLink className="h-4 w-4" />
              <span>View Source</span>
            </Button>
          </div>
          
          <div className="flex space-x-2">
            {!notification.is_read && (
              <Button
                variant="outline"
                onClick={() => onMarkAsRead(notification).then(() => onClose())}
              >
                Mark Read
              </Button>
            )}
            
            {notification.action_required ? (
              <Button
                onClick={handleMarkComplete}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Mark Complete</span>
              </Button>
            ) : (
              <Button
                onClick={handleMarkComplete}
                className="bg-slate-900 hover:bg-slate-800 text-white"
              >
                Acknowledge
              </Button>
            )}
            
            {notification.source === 'admin' && (
              <Button
                variant="outline"
                onClick={() => onDismiss(notification).then(() => onClose())}
                className="text-slate-600"
              >
                Dismiss
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
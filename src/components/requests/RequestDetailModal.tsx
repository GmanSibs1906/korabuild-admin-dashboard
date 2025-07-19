'use client';

import React, { useState } from 'react';
import { AdminRequest, getStatusColor, getPriorityColor, formatTimeAgo } from '@/types/requests';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Building2,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  FileText,
  History,
  Send,
  Phone,
  Mail,
  MapPin,
  Tag,
  Flag,
  Wrench,
  Package,
  Eye,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RequestDetailModalProps {
  request: AdminRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (requestId: string, updates: Partial<AdminRequest>) => void;
}

interface Comment {
  id: string;
  content: string;
  author: string;
  created_at: string;
  is_admin: boolean;
}

interface HistoryEntry {
  id: string;
  action: string;
  description: string;
  user: string;
  created_at: string;
}

export function RequestDetailModal({ request, isOpen, onClose, onUpdate }: RequestDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'history'>('details');
  const [statusUpdate, setStatusUpdate] = useState<string>('');
  const [priorityUpdate, setPriorityUpdate] = useState<string>('');
  const [newComment, setNewComment] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration - in real implementation, fetch from API
  const comments: Comment[] = [
    {
      id: '1',
      content: 'This request has been received and is under review. We will respond within 24 hours.',
      author: 'Admin Team',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      is_admin: true
    },
    {
      id: '2',
      content: 'Thank you for the quick response. Looking forward to the inspection.',
      author: request?.client?.full_name || 'Client',
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      is_admin: false
    }
  ];

  const history: HistoryEntry[] = [
    {
      id: '1',
      action: 'created',
      description: 'Request submitted by client',
      user: request?.client?.full_name || 'Client',
      created_at: request?.created_at || new Date().toISOString()
    },
    {
      id: '2',
      action: 'status_updated',
      description: 'Status changed from submitted to in_progress',
      user: 'Admin Team',
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    }
  ];

  if (!request) return null;

  const handleStatusUpdate = async () => {
    if (!statusUpdate) return;
    
    setLoading(true);
    try {
      // API call to update status
      const response = await fetch(`/api/admin/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusUpdate })
      });
      
      if (response.ok) {
        onUpdate?.(request.id, { status: statusUpdate as any });
        setStatusUpdate('');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePriorityUpdate = async () => {
    if (!priorityUpdate) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: priorityUpdate })
      });
      
      if (response.ok) {
        onUpdate?.(request.id, { priority: priorityUpdate as any });
        setPriorityUpdate('');
      }
    } catch (error) {
      console.error('Error updating priority:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setLoading(true);
    try {
      // API call to add comment
      const response = await fetch(`/api/admin/requests/${request.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      });
      
      if (response.ok) {
        setNewComment('');
        // Refresh comments
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRequestTypeIcon = (request_type: string) => {
    if (request_type?.includes('service')) return Wrench;
    if (request_type?.includes('material')) return Package;
    return MessageSquare;
  };

  const RequestIcon = getRequestTypeIcon(request.request_type || '');

  const tabs = [
    { id: 'details', label: 'Details', icon: FileText },
    { id: 'comments', label: 'Comments', icon: MessageSquare },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-white flex flex-col">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-orange-50">
                <RequestIcon className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-orange-600">
                  {request.title}
                </DialogTitle>
                <p className="text-gray-600 text-sm">
                  Request #{request.id.slice(-8)} • {formatTimeAgo(request.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={cn('text-white', getStatusColor(request.status))}>
                {request.status.replace('_', ' ')}
              </Badge>
              <Badge className={cn('text-white', getPriorityColor(request.priority))}>
                {request.priority}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="px-6 border-b flex-shrink-0">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2',
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Scrollable Tab Content */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Client & Project Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Client Information */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Client Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {request.client?.full_name || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">Client Name</p>
                      </div>
                      {request.client?.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <p className="text-sm text-gray-600">{request.client.email}</p>
                        </div>
                      )}
                      {request.client?.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <p className="text-sm text-gray-600">{request.client.phone}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Project Information */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center">
                        <Building2 className="h-4 w-4 mr-2" />
                        Project Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {request.project?.project_name || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">Project Name</p>
                      </div>
                      {request.address && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <p className="text-sm text-gray-600">{request.address}</p>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                        <Button variant="ghost" className="p-0 h-auto text-sm">
                          View Project Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Request Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Request Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Type</p>
                        <div className="flex items-center space-x-2">
                          <Tag className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{request.request_type}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Priority</p>
                        <div className="flex items-center space-x-2">
                          <Flag className="h-3 w-3 text-gray-400" />
                          <span className="text-sm capitalize">{request.priority}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Status</p>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{request.status.replace('_', ' ')}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Created</p>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{formatTimeAgo(request.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <p className="text-xs text-gray-500 mb-2">Description</p>
                      <p className="text-sm text-gray-900 leading-relaxed">
                        {request.description || 'No description provided.'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-gray-500">Update Status</label>
                        <div className="flex space-x-2">
                          <Select value={statusUpdate} onValueChange={setStatusUpdate}>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="submitted">Submitted</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            onClick={handleStatusUpdate} 
                            disabled={!statusUpdate || loading}
                            size="sm"
                          >
                            Update
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs text-gray-500">Update Priority</label>
                        <div className="flex space-x-2">
                          <Select value={priorityUpdate} onValueChange={setPriorityUpdate}>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            onClick={handlePriorityUpdate} 
                            disabled={!priorityUpdate || loading}
                            size="sm"
                          >
                            Update
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="space-y-4">
                {/* Add Comment */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Add a comment for the client..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={3}
                        className='bg-white text-black'
                      />
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500">
                          Your comment will be visible to the client
                        </p>
                        <Button 
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || loading}
                          size="sm"
                        >
                          <Send className="h-3 w-3 mr-2" />
                          Send Comment
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Comments List */}
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <Card key={comment.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start space-x-3">
                          <div className={cn(
                            "p-2 rounded-full",
                            comment.is_admin ? "bg-orange-100" : "bg-blue-100"
                          )}>
                            <User className={cn(
                              "h-3 w-3",
                              comment.is_admin ? "text-orange-600" : "text-blue-600"
                            )} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="text-sm font-medium">{comment.author}</p>
                              <Badge variant={comment.is_admin ? "default" : "secondary"} className="text-xs">
                                {comment.is_admin ? "Admin" : "Client"}
                              </Badge>
                              <p className="text-xs text-gray-500">
                                {formatTimeAgo(comment.created_at)}
                              </p>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-3">
                {history.map((entry, index) => (
                  <div key={entry.id} className="flex items-start space-x-3">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "p-2 rounded-full",
                        entry.action === 'created' ? "bg-green-100" :
                        entry.action === 'status_updated' ? "bg-blue-100" : "bg-gray-100"
                      )}>
                        {entry.action === 'created' && <CheckCircle className="h-3 w-3 text-green-600" />}
                        {entry.action === 'status_updated' && <AlertCircle className="h-3 w-3 text-blue-600" />}
                        {entry.action === 'comment_added' && <MessageSquare className="h-3 w-3 text-gray-600" />}
                      </div>
                      {index < history.length - 1 && (
                        <div className="w-px h-8 bg-gray-200 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium text-gray-900">{entry.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-gray-500">by {entry.user}</p>
                        <span className="text-xs text-gray-300">•</span>
                        <p className="text-xs text-gray-500">{formatTimeAgo(entry.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Eye className="h-4 w-4" />
            <span>Last viewed: {formatTimeAgo(new Date().toISOString())}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button>
              Mark as Resolved
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
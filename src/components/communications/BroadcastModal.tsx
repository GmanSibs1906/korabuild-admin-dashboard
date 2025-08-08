'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertCircle, Send, Users, Clock, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBroadcastSent?: () => void;
}

export function BroadcastModal({ isOpen, onClose, onBroadcastSent }: BroadcastModalProps) {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    targetAudience: 'all',
    priority: 'normal',
    scheduleDate: '',
    includeEmail: true,
    includePush: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.message.trim()) {
      setError('Subject and message are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/communications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_broadcast',
          data: formData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send broadcast');
      }

      setSuccess(true);
      setTimeout(() => {
        onBroadcastSent?.();
        handleClose();
      }, 2000);

    } catch (error) {
      console.error('Error sending broadcast:', error);
      setError(error instanceof Error ? error.message : 'Failed to send broadcast');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      subject: '',
      message: '',
      targetAudience: 'all',
      priority: 'normal',
      scheduleDate: '',
      includeEmail: true,
      includePush: true
    });
    setError(null);
    setSuccess(false);
    onClose();
  };

  const getAudienceCount = (audience: string) => {
    switch (audience) {
      case 'all':
        return 'All Users';
      case 'clients':
        return 'Clients Only';
      case 'contractors':
        return 'Contractors Only';
      case 'project_managers':
        return 'Project Managers';
      default:
        return 'All Users';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white text-black">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <Send className="h-5 w-5 text-orange-500" />
            Send Broadcast Message
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Send an announcement or important message to users across the KoraBuild platform
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900">Broadcast Sent Successfully!</h3>
            <p className="text-gray-600 text-center">
              Your message has been sent to {getAudienceCount(formData.targetAudience).toLowerCase()}
            </p>
          </div>
        ) : (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Message Content */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="subject" className="text-gray-700 font-medium">Subject *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Enter broadcast subject..."
                    disabled={isSubmitting}
                    required
                    className="mt-1 bg-white text-black border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <Label htmlFor="message" className="text-gray-700 font-medium">Message *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Type your broadcast message here..."
                    rows={4}
                    disabled={isSubmitting}
                    required
                    className="mt-1 bg-white text-black border-gray-300 focus:border-orange-500 focus:ring-orange-500 placeholder:text-gray-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.message.length}/1000 characters
                  </p>
                </div>
              </div>

              {/* Targeting Options */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="targetAudience" className="text-gray-700 font-medium">Target Audience</Label>
                    <Select 
                      value={formData.targetAudience} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, targetAudience: value }))}
                    >
                      <SelectTrigger className="mt-1 bg-white text-black border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                        <SelectValue placeholder="Select audience" />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-black border-gray-300">
                        <SelectItem value="all" className="hover:bg-gray-100">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            All Users
                          </div>
                        </SelectItem>
                        <SelectItem value="clients" className="hover:bg-gray-100">Clients Only</SelectItem>
                        <SelectItem value="contractors" className="hover:bg-gray-100">Contractors Only</SelectItem>
                        <SelectItem value="project_managers" className="hover:bg-gray-100">Project Managers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority" className="text-gray-700 font-medium">Priority Level</Label>
                    <Select 
                      value={formData.priority} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger className="mt-1 bg-white text-black border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-black border-gray-300">
                        <SelectItem value="low" className="hover:bg-gray-100">
                          <Badge variant="outline" className="text-gray-600 bg-white">Low</Badge>
                        </SelectItem>
                        <SelectItem value="normal" className="hover:bg-gray-100">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">Normal</Badge>
                        </SelectItem>
                        <SelectItem value="high" className="hover:bg-gray-100">
                          <Badge variant="destructive" className="bg-orange-100 text-orange-800">High</Badge>
                        </SelectItem>
                        <SelectItem value="urgent" className="hover:bg-gray-100">
                          <Badge className="bg-red-600 text-white">Urgent</Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="scheduleDate" className="text-gray-700 font-medium">Schedule Date (Optional)</Label>
                  <Input
                    id="scheduleDate"
                    type="datetime-local"
                    value={formData.scheduleDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduleDate: e.target.value }))}
                    disabled={isSubmitting}
                    className="mt-1 bg-white text-black border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Leave empty to send immediately
                  </p>
                </div>
              </div>

              {/* Delivery Options */}
              <div className="space-y-4">
                <Label className="text-gray-700 font-medium">Delivery Methods</Label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.includePush}
                      onChange={(e) => setFormData(prev => ({ ...prev, includePush: e.target.checked }))}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">Send push notification to mobile app</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.includeEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, includeEmail: e.target.checked }))}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">Send email notification</span>
                  </label>
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="font-medium text-orange-900 mb-2">Broadcast Summary</h4>
                <div className="space-y-1 text-sm text-orange-800">
                  <p><strong>Recipients:</strong> {getAudienceCount(formData.targetAudience)}</p>
                  <p><strong>Priority:</strong> {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}</p>
                  <p><strong>Delivery:</strong> {formData.scheduleDate ? `Scheduled for ${new Date(formData.scheduleDate).toLocaleString()}` : 'Send immediately'}</p>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.subject.trim() || !formData.message.trim()}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : formData.scheduleDate ? (
                    <>
                      <Clock className="h-4 w-4 mr-2" />
                      Schedule Broadcast
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Broadcast
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 
'use client';

import React from 'react';
import { 
  PaymentCreateData,
  PaymentUpdateData,
  PaymentCreateModalProps,
  PaymentEditModalProps,
  PaymentDeleteModalProps,
  PaymentViewModalProps,
  PAYMENT_STATUSES,
  PAYMENT_CATEGORIES
} from '@/types/payments';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentForm } from '@/components/forms/PaymentForm';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  DollarSign, 
  Calendar, 
  FileText, 
  Building,
  Target,
  User,
  AlertTriangle,
  Eye,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Create Payment Modal
export function PaymentCreateModal({
  isOpen,
  onClose,
  onSuccess,
  defaultProjectId,
  defaultMilestoneId
}: PaymentCreateModalProps) {
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (data: PaymentCreateData | PaymentUpdateData) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/finances/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create payment');
      }

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        throw new Error(result.error || 'Failed to create payment');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      // You might want to show a toast notification here
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-orange-500" />
            <span>Create New Payment</span>
          </DialogTitle>
          <DialogDescription>
            Add a new payment record to the system. All required fields must be completed.
          </DialogDescription>
        </DialogHeader>

        <PaymentForm
          mode="create"
          defaultProjectId={defaultProjectId}
          defaultMilestoneId={defaultMilestoneId}
          onSubmit={handleSubmit}
          onCancel={onClose}
          loading={loading}
        />
      </DialogContent>
    </Dialog>
  );
}

// Edit Payment Modal
export function PaymentEditModal({
  isOpen,
  onClose,
  onSuccess,
  payment
}: PaymentEditModalProps) {
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (data: PaymentCreateData | PaymentUpdateData) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/finances/payments?id=${payment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update payment');
      }

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        throw new Error(result.error || 'Failed to update payment');
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      // You might want to show a toast notification here
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-orange-500" />
            <span>Edit Payment</span>
          </DialogTitle>
          <DialogDescription>
            Update the payment information. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>

        <PaymentForm
          mode="edit"
          payment={payment}
          onSubmit={handleSubmit}
          onCancel={onClose}
          loading={loading}
        />
      </DialogContent>
    </Dialog>
  );
}

// Delete Payment Modal
export function PaymentDeleteModal({
  isOpen,
  onClose,
  onSuccess,
  payment
}: PaymentDeleteModalProps) {
  const [loading, setLoading] = React.useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/finances/payments?id=${payment.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete payment');
      }

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        throw new Error(result.error || 'Failed to delete payment');
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      // You might want to show a toast notification here
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span>Delete Payment</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>Are you sure you want to delete this payment? This action cannot be undone.</p>
            
            <Card className="p-4 bg-red-50 border-red-200">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Amount:</span>
                  <span className="text-sm font-bold text-red-600">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Reference:</span>
                  <span className="text-sm font-mono">{payment.reference}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Date:</span>
                  <span className="text-sm">{formatDate(payment.payment_date)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Project:</span>
                  <span className="text-sm">{payment.projects?.project_name}</span>
                </div>
              </div>
            </Card>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <LoadingSpinner size="sm" />
                <span>Deleting...</span>
              </div>
            ) : (
              'Delete Payment'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// View Payment Modal
export function PaymentViewModal({
  isOpen,
  onClose,
  payment
}: PaymentViewModalProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const statusConfig = PAYMENT_STATUSES.find(s => s.value === status);
    return statusConfig?.color || 'bg-gray-100 text-gray-800';
  };

  const getCategoryLabel = (category: string) => {
    const categoryConfig = PAYMENT_CATEGORIES.find(c => c.value === category);
    return categoryConfig?.label || category;
  };

  const getStatusLabel = (status: string) => {
    const statusConfig = PAYMENT_STATUSES.find(s => s.value === status);
    return statusConfig?.label || status;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-orange-500" />
            <span>Payment Details</span>
          </DialogTitle>
          <DialogDescription>
            View complete payment information and related details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Main Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-orange-500" />
                  <span>Payment Information</span>
                </div>
                <Badge className={cn("text-xs", getStatusColor(payment.status))}>
                  {getStatusLabel(payment.status)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Amount</label>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(payment.amount)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Date</label>
                  <p className="text-lg font-medium">
                    {formatDate(payment.payment_date)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Method</label>
                  <p className="text-lg">{payment.payment_method}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="text-lg">{getCategoryLabel(payment.payment_category)}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500">Reference Number</label>
                  <p className="text-lg font-mono bg-gray-100 p-2 rounded">
                    {payment.reference}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {payment.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Information */}
          {payment.projects && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-orange-500" />
                  <span>Project Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Project Name</label>
                  <p className="text-lg font-medium">{payment.projects.project_name}</p>
                </div>
                {payment.projects.users && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Client</label>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-lg">{payment.projects.users.full_name}</span>
                      <span className="text-sm text-gray-500">({payment.projects.users.email})</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Milestone Information */}
          {payment.project_milestones && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-orange-500" />
                  <span>Associated Milestone</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Milestone Name</label>
                  <p className="text-lg font-medium">{payment.project_milestones.milestone_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phase Category</label>
                  <p className="text-lg capitalize">
                    {payment.project_milestones.phase_category.replace('_', ' ')}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Receipt */}
          {payment.receipt_url && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-orange-500" />
                  <span>Receipt</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Receipt attached</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(payment.receipt_url!, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = payment.receipt_url!;
                        link.download = `receipt-${payment.reference}`;
                        link.click();
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                <span>Record Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-sm">{formatDateTime(payment.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="text-sm">{formatDateTime(payment.updated_at)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
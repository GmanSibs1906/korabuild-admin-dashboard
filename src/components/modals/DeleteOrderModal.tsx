'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, DollarSign, Calendar, User } from 'lucide-react';

interface DeleteOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  order: {
    id: string;
    order_number: string;
    total_amount: number;
    status: string;
    project?: {
      project_name: string;
    };
    supplier?: {
      supplier_name: string;
    };
    expected_delivery_date?: string;
    order_items?: Array<{
      item_description: string;
      quantity_ordered: number;
    }>;
  } | null;
  isDeleting?: boolean;
}

export function DeleteOrderModal({
  isOpen,
  onClose,
  onConfirm,
  order,
  isDeleting = false
}: DeleteOrderModalProps) {
  if (!order) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'pending_approval': return 'text-amber-600 bg-amber-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'confirmed': return 'text-blue-600 bg-blue-100';
      case 'delivered': return 'text-green-700 bg-green-200';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const isDeletable = ['draft', 'pending_approval'].includes(order.status?.toLowerCase());

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Delete Order</span>
          </DialogTitle>
          <DialogDescription>
            {isDeletable 
              ? "Are you sure you want to delete this order? This will also remove all related deliveries, delivery items, and order history. This action cannot be undone."
              : "This order cannot be deleted because it has been processed beyond the draft stage."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
            {/* Order Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-900">{order.order_number}</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                {order.status?.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            {/* Order Details */}
            <div className="space-y-2 text-sm">
              {order.project?.project_name && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0 mt-1"></div>
                  <span className="text-gray-700">
                    <span className="font-medium">Project:</span> {order.project.project_name}
                  </span>
                </div>
              )}

              {order.supplier?.supplier_name && (
                <div className="flex items-center space-x-2">
                  <User className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <span className="font-medium">Supplier:</span> {order.supplier.supplier_name}
                  </span>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <DollarSign className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">
                  <span className="font-medium">Total Value:</span> {formatCurrency(order.total_amount)}
                </span>
              </div>

              {order.expected_delivery_date && (
                <div className="flex items-center space-x-2">
                  <Calendar className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    <span className="font-medium">Expected Delivery:</span> {formatDate(order.expected_delivery_date)}
                  </span>
                </div>
              )}

              {order.order_items && order.order_items.length > 0 && (
                <div className="mt-3">
                  <span className="font-medium text-gray-700">Items ({order.order_items.length}):</span>
                  <ul className="mt-1 space-y-1">
                    {order.order_items.slice(0, 3).map((item, index) => (
                      <li key={index} className="text-gray-600 text-xs pl-4">
                        • {item.quantity_ordered}x {item.item_description}
                      </li>
                    ))}
                    {order.order_items.length > 3 && (
                      <li className="text-gray-500 text-xs pl-4 italic">
                        ... and {order.order_items.length - 3} more items
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {!isDeletable && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Orders with status '{order.status?.replace('_', ' ')}' cannot be deleted. 
                Only draft and pending approval orders can be deleted to maintain data integrity.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          {isDeletable && (
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Delete Order
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
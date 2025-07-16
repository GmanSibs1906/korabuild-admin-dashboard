'use client';

import React, { useState } from 'react';
import { Payment } from '@/types/payments';
import { usePaymentCRUD } from '@/hooks/usePaymentCRUD';
import { PaymentDataTable } from '@/components/tables/PaymentDataTable';
import { 
  PaymentCreateModal, 
  PaymentEditModal, 
  PaymentDeleteModal, 
  PaymentViewModal 
} from '@/components/modals/PaymentModals';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Plus, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentHistoryManagerProps {
  projectId?: string;
  milestoneId?: string;
  showSummary?: boolean;
  showActions?: boolean;
  className?: string;
}

export function PaymentHistoryManager({
  projectId,
  milestoneId,
  showSummary = true,
  showActions = true,
  className
}: PaymentHistoryManagerProps) {
  // Payment CRUD hook
  const {
    payments,
    pagination,
    summary,
    filters,
    loading,
    creating,
    updating,
    deleting,
    error,
    fetchPayments,
    createPayment,
    updatePayment,
    deletePayment,
    setFilters,
    resetFilters,
    refreshPayments
  } = usePaymentCRUD({
    autoRefresh: true,
    refetchInterval: 60000, // 1 minute
    onSuccess: (message) => {
      console.log('✅ Payment operation successful:', message);
      // You can add toast notifications here
    },
    onError: (error) => {
      console.error('❌ Payment operation failed:', error);
      // You can add toast notifications here
    }
  });

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  // Get percentage change (mock data for demo)
  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Handle modal actions
  const handleCreatePayment = () => {
    setCreateModalOpen(true);
  };

  const handleEditPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setEditModalOpen(true);
  };

  const handleDeletePayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setDeleteModalOpen(true);
  };

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setViewModalOpen(true);
  };

  // Handle modal success (refresh data)
  const handleModalSuccess = () => {
    refreshPayments();
  };

  // Handle export
  const handleExportPayments = async () => {
    try {
      // You can implement CSV/Excel export here
      const queryParams = new URLSearchParams({
        ...Object.fromEntries(
          Object.entries(filters).map(([key, value]) => [key, String(value)])
        ),
        export: 'true'
      });

      const response = await fetch(`/api/finances/payments/export?${queryParams}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `payments-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting payments:', error);
    }
  };

  // Initial filters setup
  React.useEffect(() => {
    if (projectId || milestoneId) {
      setFilters({
        project_id: projectId,
        milestone_id: milestoneId,
        page: 1
      });
    }
  }, [projectId, milestoneId, setFilters]);

  if (error) {
    return (
      <Card className={cn("border-red-200 bg-red-50", className)}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <h3 className="font-medium">Error Loading Payments</h3>
          </div>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <Button
            onClick={refreshPayments}
            variant="outline"
            size="sm"
            className="mt-3"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary Cards */}
      {showSummary && summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Amount */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Payments</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(summary.total_amount)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">+12.3%</span>
                <span className="text-gray-500 ml-1">vs last month</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Count */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Count</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {summary.payment_count}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-gray-500">Payments processed</span>
              </div>
            </CardContent>
          </Card>

          {/* Completed Payments */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {summary.status_counts.completed || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-2">
                <Badge className="bg-green-100 text-green-800 text-xs">
                  {((summary.status_counts.completed || 0) / summary.payment_count * 100).toFixed(1)}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Pending Payments */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {summary.status_counts.pending || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-2">
                <Badge className="bg-orange-100 text-orange-800 text-xs">
                  Requires attention
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header with Actions */}
      {showActions && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Payment History</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Manage and track all payment transactions
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshPayments}
                  disabled={loading}
                >
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPayments}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button
                  onClick={handleCreatePayment}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={creating}
                >
                  {creating ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Add Payment
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Data Table */}
      <PaymentDataTable
        payments={payments}
        loading={loading}
        pagination={pagination}
        filters={filters}
        onFiltersChange={setFilters}
        onPaymentEdit={handleEditPayment}
        onPaymentDelete={handleDeletePayment}
        onPaymentView={handleViewPayment}
        onRefresh={refreshPayments}
        onExport={handleExportPayments}
      />

      {/* Modals */}
      <PaymentCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleModalSuccess}
        defaultProjectId={projectId}
        defaultMilestoneId={milestoneId}
      />

      {selectedPayment && (
        <>
          <PaymentEditModal
            isOpen={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedPayment(null);
            }}
            onSuccess={handleModalSuccess}
            payment={selectedPayment}
          />

          <PaymentDeleteModal
            isOpen={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setSelectedPayment(null);
            }}
            onSuccess={handleModalSuccess}
            payment={selectedPayment}
          />

          <PaymentViewModal
            isOpen={viewModalOpen}
            onClose={() => {
              setViewModalOpen(false);
              setSelectedPayment(null);
            }}
            payment={selectedPayment}
          />
        </>
      )}
    </div>
  );
} 
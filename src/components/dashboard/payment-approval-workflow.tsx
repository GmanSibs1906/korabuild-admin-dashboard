'use client';

import React, { useState } from 'react';
import { useFinances } from '@/hooks/useFinances';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  User,
  FileText,
  Calendar,
  DollarSign,
  Eye,
  MessageSquare,
  Plus,
  Filter,
  Search
} from 'lucide-react';

interface PaymentApprovalWorkflowProps {
  onApprovalComplete?: (paymentId: string, approved: boolean) => void;
  className?: string;
}

export function PaymentApprovalWorkflow({ 
  onApprovalComplete, 
  className = '' 
}: PaymentApprovalWorkflowProps) {
  const { financialData, isLoading, error, approvePayment } = useFinances({ 
    type: 'payments',
    autoRefetch: true 
  });
  
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingApproval, setProcessingApproval] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <h3 className="text-sm font-medium text-red-800">Error loading payment data</h3>
        </div>
        <p className="mt-2 text-sm text-red-700">{error.error}</p>
      </div>
    );
  }

  if (!financialData?.payments) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No payment data available</p>
      </div>
    );
  }

  const payments = financialData.payments;
  const pendingApprovals = payments.filter(p => p.status === 'pending');
  const approvedPayments = payments.filter(p => p.status === 'completed');
  const rejectedPayments = payments.filter(p => p.status === 'failed');

  // Filter payments based on status and search
  const filteredPayments = payments.filter(payment => {
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'pending' && payment.status === 'pending') ||
      (filterStatus === 'approved' && payment.status === 'completed') ||
      (filterStatus === 'rejected' && payment.status === 'failed');
    
    const matchesSearch = !searchTerm || 
      payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.project?.project_name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Handle payment approval
  const handleApproval = async (paymentId: string, approved: boolean) => {
    setProcessingApproval(paymentId);
    
    try {
      if (approved) {
        await approvePayment(paymentId);
      } else {
        // For rejection, you might want to add a reject payment function
        console.log('Payment rejected:', paymentId, 'Comment:', approvalComment);
      }
      
      setSelectedPayment(null);
      setApprovalComment('');
      onApprovalComplete?.(paymentId, approved);
    } catch (error) {
      console.error('Failed to process approval:', error);
    } finally {
      setProcessingApproval(null);
    }
  };

  // Get priority level based on amount
  const getPriorityLevel = (amount: number) => {
    if (amount >= 100000) return { label: 'High', color: 'bg-red-100 text-red-800' };
    if (amount >= 50000) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Low', color: 'bg-green-100 text-green-800' };
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingApprovals.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(pendingApprovals.reduce((sum, p) => sum + p.amount, 0))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedPayments.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(approvedPayments.reduce((sum, p) => sum + p.amount, 0))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedPayments.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(rejectedPayments.reduce((sum, p) => sum + p.amount, 0))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{payments.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <button className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
          <Plus className="h-4 w-4" />
          <span>New Payment</span>
        </button>
      </div>

      {/* Payment List */}
      <div className="space-y-4">
        {filteredPayments.map((payment) => {
          const priority = getPriorityLevel(payment.amount);
          const isSelected = selectedPayment === payment.id;
          
          return (
            <Card 
              key={payment.id} 
              className={`transition-all ${isSelected ? 'ring-2 ring-orange-500' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(payment.status)}
                      <Badge className={getStatusBadgeColor(payment.status)}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </Badge>
                    </div>
                    <Badge className={priority.color}>
                      {priority.label} Priority
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => setSelectedPayment(isSelected ? null : payment.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Amount</p>
                    <p className="text-xl font-bold text-orange-600">{formatCurrency(payment.amount)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-900">Project</p>
                    <p className="text-sm text-gray-600">{payment.project?.project_name || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-900">Reference</p>
                    <p className="text-sm text-gray-600">{payment.reference}</p>
                  </div>
                </div>
                
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-900">Description</p>
                  <p className="text-sm text-gray-600">{payment.description}</p>
                </div>

                {/* Approval Actions for Pending Payments */}
                {payment.status === 'pending' && (
                  <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-yellow-800">Approval Required</h4>
                      <span className="text-xs text-yellow-600">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {isSelected && (
                      <div className="space-y-3">
                        <textarea
                          value={approvalComment}
                          onChange={(e) => setApprovalComment(e.target.value)}
                          placeholder="Add approval comment..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          rows={3}
                        />
                        
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleApproval(payment.id, true)}
                            disabled={processingApproval === payment.id}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                          >
                            {processingApproval === payment.id ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                            <span>Approve</span>
                          </button>
                          
                          <button
                            onClick={() => handleApproval(payment.id, false)}
                            disabled={processingApproval === payment.id}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="h-4 w-4" />
                            <span>Reject</span>
                          </button>
                          
                          <button
                            onClick={() => setSelectedPayment(null)}
                            className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                          >
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {!isSelected && (
                      <button
                        onClick={() => setSelectedPayment(payment.id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>Review & Approve</span>
                      </button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredPayments.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No payments found matching your criteria</p>
        </div>
      )}
    </div>
  );
} 
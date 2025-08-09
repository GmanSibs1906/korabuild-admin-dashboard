'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { NextPaymentModal } from '@/components/modals/NextPaymentModal';
import { NextPaymentData } from '@/types/next-payment';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Calendar,
  CreditCard,
  Wallet,
  Calculator,
  Bell,
  Plus,
  Edit,
  Lock
} from 'lucide-react';

interface MobileFinancialData {
  contractValue: number;
  cashReceived: number;
  amountUsed: number;
  amountRemaining: number;
  financialHealth: 'Healthy' | 'Caution' | 'Critical';
  creditAvailable: number;
  creditUsed: number;
  creditLimit: number;
}

interface MobilePaymentData {
  id: string;
  amount: number;
  date: string;
  description: string;
  category: string;
  status: string;
  reference: string;
}

interface MobileCreditData {
  creditLimit: number;
  creditUsed: number;
  creditAvailable: number;
  monthlyPayment: number;
  nextPaymentDate: string;
  interestRate: number;
}

interface MobileNextPaymentData {
  amount: number;
  description: string;
  dueDate: string;
  category: string;
  priority: 'normal' | 'high' | 'urgent';
}

interface FinancialControlPanelProps {
  projectId: string;
  onDataSync: (data: any) => void;
}

export function FinancialControlPanel({ projectId, onDataSync }: FinancialControlPanelProps) {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'credit' | 'budget'>('overview');
  
  const [financialData, setFinancialData] = useState<MobileFinancialData | null>(null);
  const [payments, setPayments] = useState<MobilePaymentData[]>([]);
  const [creditData, setCreditData] = useState<MobileCreditData | null>(null);
  const [nextPayment, setNextPayment] = useState<MobileNextPaymentData | null>(null);
  
  // Next Payment Due State
  const [nextPaymentModal, setNextPaymentModal] = useState(false);
  const [nextPaymentData, setNextPaymentData] = useState<NextPaymentData | null>(null);
  const [loadingNextPayment, setLoadingNextPayment] = useState(false);
  
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});

  // Fetch financial data
  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/mobile-control/financial?projectId=${projectId}`);
      const result = await response.json();
      
      console.log('💰 [FinancialControlPanel] API Response:', result);
      console.log('💰 [FinancialControlPanel] Financial Data:', result.data?.financial);
      console.log('💰 [FinancialControlPanel] Amount Used:', result.data?.financial?.amountUsed);
      
      if (result.success) {
        setFinancialData(result.data.financial);
        setPayments(result.data.payments || []);
        setCreditData(result.data.credit);
        setNextPayment(result.data.nextPayment);
        
        console.log('💰 [FinancialControlPanel] State updated with Amount Used:', result.data.financial.amountUsed);
        
        // Sync data with parent component
        onDataSync({
          type: 'financial',
          data: result.data,
          timestamp: new Date().toISOString()
        });
      } else {
        setError(result.error || 'Failed to fetch financial data');
      }
    } catch (err) {
      setError('Network error loading financial data');
      console.error('Error fetching financial data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update financial data
  const updateFinancialData = async (updateType: string, data: any) => {
    try {
      setUpdating(true);
      setError(null);
      
      const response = await fetch('/api/mobile-control/financial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          updateType,
          data
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh data after update
        await fetchFinancialData();
        setEditMode(null);
        setEditValues({});
        
        // Show success message
        console.log('✅ Financial data updated successfully');
      } else {
        setError(result.error || 'Failed to update financial data');
      }
    } catch (err) {
      setError('Network error updating financial data');
      console.error('Error updating financial data:', err);
    } finally {
      setUpdating(false);
    }
  };

  // Start editing a field
  const startEdit = (field: string, currentValue: any) => {
    setEditMode(field);
    setEditValues({ [field]: currentValue });
  };

  // Save edited value
  const saveEdit = async (field: string) => {
    if (editValues[field] !== undefined) {
      switch (field) {
        case 'contractValue':
          // Contract value is stored in the projects table, not project_financials
          await updateFinancialData('contractValue', {
            contractValue: parseFloat(editValues[field]) || 0
          });
          break;
        case 'cashReceived':
          await updateFinancialData('financial', {
            ...financialData,
            [field]: parseFloat(editValues[field]) || 0
          });
          break;
        case 'creditLimit':
        case 'creditUsed':
        case 'monthlyPayment':
          await updateFinancialData('credit', {
            ...creditData,
            [field]: parseFloat(editValues[field]) || 0
          });
          break;
      }
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditMode(null);
    setEditValues({});
  };

  // Fetch next payment data for the current project
  const fetchNextPaymentData = async () => {
    if (!projectId) return;
    
    setLoadingNextPayment(true);
    try {
      console.log('💰 Fetching next payment data for project:', projectId);
      
      const response = await fetch(`/api/finances/next-payment?projectId=${projectId}`);
      const result = await response.json();
      
      if (result.success) {
        setNextPaymentData(result.data);
      } else {
        console.error('❌ Error fetching next payment data:', result.error);
        setNextPaymentData(null);
      }
    } catch (error) {
      console.error('❌ Error fetching next payment data:', error);
      setNextPaymentData(null);
    } finally {
      setLoadingNextPayment(false);
    }
  };

  // Handle next payment updated
  const handleNextPaymentUpdated = () => {
    fetchNextPaymentData();
    fetchFinancialData(); // Refresh financial data
  };

  // Calculate days until next payment
  const getDaysUntilPayment = (dateString: string) => {
    if (!dateString) return null;
    const today = new Date();
    const paymentDate = new Date(dateString);
    const diffTime = paymentDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get payment urgency color
  const getPaymentUrgencyColor = (daysUntil: number | null) => {
    if (daysUntil === null) return 'bg-gray-100 text-gray-800';
    if (daysUntil < 0) return 'bg-red-100 text-red-800'; // Overdue
    if (daysUntil <= 3) return 'bg-orange-100 text-orange-800'; // Due soon
    if (daysUntil <= 7) return 'bg-yellow-100 text-yellow-800'; // Due this week
    return 'bg-green-100 text-green-800'; // Future
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get health color based on financial health status
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'Healthy':
        return 'bg-green-100 text-green-800';
      case 'Caution':
        return 'bg-yellow-100 text-yellow-800';
      case 'Critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status color based on payment status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Add payment handler
  const addPayment = () => {
    // TODO: Implement add payment functionality
    console.log('Add payment functionality coming soon...');
    // For now, we'll just log this - in a real implementation, this would open a modal
    // or redirect to a payment creation form
  };

  // Load data on component mount
  useEffect(() => {
    fetchFinancialData();
    fetchNextPaymentData(); // Fetch next payment data on mount
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">Loading financial data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-red-800 font-medium">Error Loading Financial Data</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
          <Button
            onClick={fetchFinancialData}
            variant="outline"
            size="sm"
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Financial Data Control</h2>
          <p className="text-gray-600">Control financial data that users see in their mobile app</p>
        </div>
        <Button
          onClick={fetchFinancialData}
          variant="outline"
          size="sm"
          disabled={updating}
          className="border-orange-300 text-orange-700 hover:bg-orange-50"
        >
          {updating ? <LoadingSpinner className="w-4 h-4 mr-2" /> : null}
          Refresh Data
        </Button>
      </div>

      {/* Critical Warning */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-orange-800">Financial Data Control</h3>
            <div className="mt-2 text-sm text-orange-700">
              <p>Changes to financial data will immediately reflect in the mobile app. Users will see updated contract values, payment history, and credit information.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Financial Overview', description: 'Contract and payment summary' },
            { id: 'payments', label: 'Payment History', description: 'View and manage payments' },
            { id: 'credit', label: 'Credit Management', description: 'Credit facility and limits' },
            { id: 'budget', label: 'Budget Control', description: 'Budget allocation and tracking' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && financialData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contract Overview */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contract Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Contract Value</span>
                  <div className="flex items-center space-x-2">
                    {editMode === 'contractValue' ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={editValues.contractValue}
                          onChange={(e) => setEditValues({...editValues, contractValue: e.target.value})}
                          className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <Button size="sm" onClick={() => saveEdit('contractValue')}>Save</Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                      </div>
                    ) : (
                      <>
                        <span className="text-xl font-semibold text-gray-900">
                          {formatCurrency(financialData.contractValue)}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit('contractValue', financialData.contractValue)}
                        >
                          Edit
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Cash Received</span>
                  <div className="flex items-center space-x-2">
                    {editMode === 'cashReceived' ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={editValues.cashReceived}
                          onChange={(e) => setEditValues({...editValues, cashReceived: e.target.value})}
                          className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <Button size="sm" onClick={() => saveEdit('cashReceived')}>Save</Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                      </div>
                    ) : (
                      <>
                        <span className="font-medium text-green-600">
                          {formatCurrency(financialData.cashReceived)}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit('cashReceived', financialData.cashReceived)}
                        >
                          Edit
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Amount Used</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-orange-600">
                      {(() => {
                        console.log('💰 [Render] Amount Used value:', financialData.amountUsed);
                        console.log('💰 [Render] Financial Data object:', financialData);
                        return formatCurrency(financialData.amountUsed);
                      })()}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      Auto-calculated from payments
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Amount Remaining</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-blue-600">
                      {formatCurrency(financialData.cashReceived - financialData.amountUsed)}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      Cash Received - Amount Used
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-gray-600">Financial Health</span>
                  <Badge className={getHealthColor(financialData.financialHealth)}>
                    {financialData.financialHealth}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Credit Overview */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Credit Facility</h3>
              {creditData ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Credit Limit</span>
                    <div className="flex items-center space-x-2">
                      {editMode === 'creditLimit' ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={editValues.creditLimit}
                            onChange={(e) => setEditValues({...editValues, creditLimit: e.target.value})}
                            className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <Button size="sm" onClick={() => saveEdit('creditLimit')}>Save</Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                        </div>
                      ) : (
                        <>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(creditData.creditLimit)}
                          </span>
                          {/* <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit('creditLimit', creditData.creditLimit)}
                          >
                            Edit
                          </Button> */}
                          <Button
                            size="sm"
                            variant="outline"
                            className=' text-gray-400'
                            // onClick={() => startEdit('creditLimit', creditData.creditLimit)}
                          >
                            Edit Disabled
                            <Lock className="h-4 w-4 ml-1" />
                            
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Credit Used</span>
                    <span className="font-medium text-orange-600">
                      {formatCurrency(creditData.creditUsed)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Credit Available</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(creditData.creditAvailable)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Monthly Payment</span>
                    <span className="font-medium text-blue-600">
                      {formatCurrency(creditData.monthlyPayment)}
                    </span>
                  </div>
                  
                  {creditData.nextPaymentDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Next Payment Date</span>
                      <span className="font-medium text-gray-900">
                        {new Date(creditData.nextPaymentDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No credit facility configured</p>
                  <Button
                    onClick={() => updateFinancialData('credit', {
                      creditLimit: 500000,
                      creditUsed: 0,
                      creditAvailable: 500000,
                      monthlyPayment: 0,
                      nextPaymentDate: '',
                      interestRate: 0
                    })}
                    className="mt-4"
                    variant="outline"
                  >
                    Set Up Credit Facility
                  </Button>
                </div>
              )}
            </Card>

            {/* Next Payment */}
            {/* {nextPayment && (
              <Card className="p-6 md:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Next Payment Due</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Amount</span>
                    <p className="text-xl font-semibold text-orange-600">
                      {formatCurrency(nextPayment.amount)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Description</span>
                    <p className="font-medium text-gray-900">{nextPayment.description}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Due Date</span>
                    <p className="font-medium text-gray-900">
                      {new Date(nextPayment.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Priority</span>
                    <Badge className={
                      nextPayment.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      nextPayment.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {nextPayment.priority}
                    </Badge>
                  </div>
                </div>
              </Card>
            )} */}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
              {/* <Button
                onClick={addPayment}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Add Payment
              </Button> */}
            </div>
            
            {payments.length > 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <li key={payment.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(payment.amount)}
                            </p>
                            <Badge className={getStatusColor(payment.status)}>
                              {payment.status}
                            </Badge>
                          </div>
                          <div className="mt-1 flex items-center space-x-2 text-sm text-gray-500">
                            <span>{payment.description}</span>
                            <span>•</span>
                            <span>{new Date(payment.date).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="capitalize">{payment.category}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">{payment.reference}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No payments recorded</p>
                {/* <Button
                  onClick={addPayment}
                  className="mt-4 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Add First Payment
                </Button> */}
              </div>
            )}
          </div>
        )}

        {/* Credit Tab */}
        {activeTab === 'credit' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Credit Management</h3>
            {creditData ? (
              <Card className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Credit Limits</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Total Limit</span>
                        <span className="font-medium">{formatCurrency(creditData.creditLimit)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Used</span>
                        <span className="font-medium">{formatCurrency(creditData.creditUsed)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Available</span>
                        <span className="font-medium">{formatCurrency(creditData.creditAvailable)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full" 
                          style={{ width: `${(creditData.creditUsed / creditData.creditLimit) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Payment Schedule</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Monthly Payment</span>
                        <span className="font-medium">{formatCurrency(creditData.monthlyPayment)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Interest Rate</span>
                        <span className="font-medium">{creditData.interestRate}%</span>
                      </div>
                      {creditData.nextPaymentDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Next Payment</span>
                          <span className="font-medium">
                            {new Date(creditData.nextPaymentDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No credit facility configured</p>
              </div>
            )}

            {/* Next Payment Due Section */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-xl font-bold text-gray-900">Next Payment Due</h4>
                </div>
                <div className="flex items-center space-x-2">
                  {nextPaymentData && (
                    <Button
                      onClick={() => setNextPaymentModal(true)}
                      variant="outline"
                      size="sm"
                      className="text-orange-600 border-orange-200 hover:bg-orange-50"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                  <Button
                    onClick={() => setNextPaymentModal(true)}
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {nextPaymentData ? 'Update' : 'Add Payment'}
                  </Button>
                </div>
              </div>

              {loadingNextPayment ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                  <span className="ml-2 text-sm text-gray-600">Loading payment data...</span>
                </div>
              ) : nextPaymentData ? (
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
                  {/* Payment Amount and Overdue Status */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl font-bold text-gray-900">
                      {formatCurrency(nextPaymentData.payment_amount || nextPaymentData.monthly_payment || 0)}
                    </div>
                    {(() => {
                      const daysUntil = getDaysUntilPayment(nextPaymentData.next_payment_date);
                      if (daysUntil !== null && daysUntil < 0) {
                        return (
                          <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                            {Math.abs(daysUntil)}d overdue
                          </div>
                        );
                      } else if (daysUntil !== null && daysUntil <= 7) {
                        return (
                          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                            Due in {daysUntil} days
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Milestone Information */}
                  {nextPaymentData.milestone_name && (
                    <div className="flex items-start space-x-3 mb-4">
                      <div className="bg-red-100 rounded-full p-2 flex-shrink-0">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Milestone payment:</p>
                        <p className="text-base font-medium text-gray-900">
                          {nextPaymentData.milestone_name}
                        </p>
                        {nextPaymentData.milestone_description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {nextPaymentData.milestone_description}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Due Date */}
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-600">Due Date: </span>
                    <span className="text-base font-semibold text-gray-900">
                      {new Date(nextPaymentData.next_payment_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Payment Sequence and Total */}
                  {(nextPaymentData.total_payments && nextPaymentData.total_payments > 1) || nextPaymentData.total_amount ? (
                    <div className="text-sm text-gray-600">
                      {nextPaymentData.total_payments && nextPaymentData.total_payments > 1 && (
                        <span>
                          +{nextPaymentData.total_payments - (nextPaymentData.payment_sequence || 1)} more payment
                          {nextPaymentData.total_payments - (nextPaymentData.payment_sequence || 1) !== 1 ? 's' : ''}
                        </span>
                      )}
                      {nextPaymentData.total_amount && (
                        <span>
                          {nextPaymentData.total_payments && nextPaymentData.total_payments > 1 ? ' • ' : ''}
                          Milestone total cost: {formatCurrency(nextPaymentData.total_amount)}
                        </span>
                      )}
                    </div>
                  ) : null}

                  {/* Additional Details (collapsed by default) */}
                  {(nextPaymentData.credit_terms !== '30 days net' || nextPaymentData.notes || nextPaymentData.last_payment_date) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {nextPaymentData.credit_terms !== '30 days net' && (
                          <div>
                            <span className="text-gray-600">Terms: </span>
                            <span className="font-medium text-gray-900">{nextPaymentData.credit_terms}</span>
                          </div>
                        )}
                        
                        {nextPaymentData.last_payment_date && (
                          <div>
                            <span className="text-gray-600">Last Payment: </span>
                            <span className="font-medium text-gray-900">
                              {formatDate(nextPaymentData.last_payment_date)}
                            </span>
                          </div>
                        )}

                        <div>
                          <span className="text-gray-600">Status: </span>
                          <Badge className={getStatusColor(nextPaymentData.credit_status)}>
                            {nextPaymentData.credit_status}
                          </Badge>
                        </div>

                        {nextPaymentData.payment_sequence && nextPaymentData.total_payments && (
                          <div>
                            <span className="text-gray-600">Payment: </span>
                            <span className="font-medium text-gray-900">
                              {nextPaymentData.payment_sequence} of {nextPaymentData.total_payments}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {nextPaymentData.notes && (
                        <div className="mt-3">
                          <p className="text-gray-600 text-sm">
                            <span className="font-medium">Notes: </span>
                            {nextPaymentData.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Scheduled</h3>
                  <p className="text-gray-600 mb-4">Set up your next payment schedule</p>
                  <Button
                    onClick={() => setNextPaymentModal(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Next Payment
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Budget Tab */}
        {activeTab === 'budget' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Budget Control</h3>
            <Card className="p-6">
              <div className="text-center py-8">
                <p className="text-gray-500">Budget control features coming soon...</p>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Next Payment Modal */}
      <NextPaymentModal
        isOpen={nextPaymentModal}
        onClose={() => setNextPaymentModal(false)}
        projectId={projectId}
        existingPayment={nextPaymentData}
        onPaymentUpdated={handleNextPaymentUpdated}
      />
    </div>
  );
} 
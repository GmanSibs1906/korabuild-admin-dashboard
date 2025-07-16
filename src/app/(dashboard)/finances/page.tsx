'use client';

import { useState } from 'react';
import { useFinances } from '@/hooks/useFinances';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentApprovalWorkflow } from '@/components/dashboard/payment-approval-workflow';
import { PaymentHistoryManager } from '@/components/dashboard/PaymentHistoryManager';
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Calculator,
  Settings,
  Download,
  Calendar,
  History
} from 'lucide-react';

const FinancesPage = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'payment-history' | 'budgets' | 'credit' | 'due-next'>('overview');
  const { financialData, isLoading, error, refetch } = useFinances({
    type: 'overview',
    autoRefetch: false,
    refetchInterval: 300000
  });

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
          <h3 className="text-sm font-medium text-red-800">Error loading financial data</h3>
        </div>
        <p className="mt-2 text-sm text-red-700">{error.error}</p>
        <button
          onClick={refetch}
          className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!financialData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No financial data available</p>
      </div>
    );
  }

  const { overview, payments, budgets, creditAccounts } = financialData;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate days until payment
  const getDaysUntilPayment = (dateString: string) => {
    const paymentDate = new Date(dateString);
    const today = new Date();
    const diffTime = paymentDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get payment urgency color
  const getPaymentUrgencyColor = (days: number) => {
    if (days < 0) return 'text-red-600 bg-red-50 border-red-200';
    if (days <= 7) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (days <= 30) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const tabs = [
    { id: 'overview', label: 'Financial Overview', icon: DollarSign },
    { id: 'payment-history', label: 'Payment History', icon: History },
    { id: 'due-next', label: 'Due Next Payments', icon: Clock },
    // { id: 'payments', label: 'Payment Management', icon: CreditCard },
    // { id: 'budgets', label: 'Budget Control', icon: Calculator },
    // { id: 'credit', label: 'Credit Accounts', icon: Wallet }
  ];

  const renderEnhancedOverview = () => (
    <div className="space-y-8">
      {/* Simplified Financial Overview - Only Total Revenue */}
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(overview.totalPayments)}</div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last month
            </p>
            <div className="mt-2 flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>Trending up</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expected Next Payments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Expected Next Payments</CardTitle>
          <p className="text-sm text-gray-600">Upcoming payments from credit accounts that have not been paid</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {creditAccounts
              .filter(account => account.next_payment_date && new Date(account.next_payment_date) >= new Date())
              .sort((a, b) => new Date(a.next_payment_date!).getTime() - new Date(b.next_payment_date!).getTime())
              .map((account) => {
                const daysUntil = getDaysUntilPayment(account.next_payment_date!);
                return (
                  <div key={account.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">{account.project?.project_name || 'Unknown Project'}</p>
                        <p className="text-sm text-gray-500">Client Payment Due</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-orange-600">{formatCurrency(account.monthly_payment)}</p>
                      <p className={`text-sm px-2 py-1 rounded-full border ${getPaymentUrgencyColor(daysUntil)}`}>
                        {daysUntil === 0 ? 'Due Today' : 
                         daysUntil === 1 ? 'Due Tomorrow' : 
                         daysUntil > 0 ? `Due in ${daysUntil} days` : 
                         `Overdue by ${Math.abs(daysUntil)} days`}
                      </p>
                    </div>
                  </div>
                );
              })}
            
            {creditAccounts.filter(account => account.next_payment_date && new Date(account.next_payment_date) >= new Date()).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p className="text-lg font-medium">All payments are up to date!</p>
                <p className="text-sm">No upcoming payments scheduled.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => setActiveTab('payment-history')}
              className="p-4 text-left bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <History className="h-6 w-6 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-900">Manage Payment History</p>
                  <p className="text-sm text-orange-700">View, create, edit, and delete payments</p>
                </div>
              </div>
            </button>
            
            <button className="p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors">
              <div className="flex items-center space-x-3">
                <Download className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Export Financial Report</p>
                  <p className="text-sm text-blue-700">Download comprehensive financial data</p>
                </div>
              </div>
            </button>
            
            <button className="p-4 text-left bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors">
              <div className="flex items-center space-x-3">
                <Calculator className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Budget Analysis</p>
                  <p className="text-sm text-green-700">Review budget performance</p>
                </div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDueNextPayments = () => {
    // Calculate total due amounts from enhanced_credit_accounts
    const totalDueAmount = creditAccounts
      .filter(account => account.next_payment_date && new Date(account.next_payment_date) >= new Date())
      .reduce((sum, account) => sum + account.monthly_payment, 0);

    const overduePayments = creditAccounts
      .filter(account => account.next_payment_date && new Date(account.next_payment_date) < new Date());

    const upcomingPayments = creditAccounts
      .filter(account => account.next_payment_date && new Date(account.next_payment_date) >= new Date())
      .sort((a, b) => new Date(a.next_payment_date!).getTime() - new Date(b.next_payment_date!).getTime());

    return (
      <div className="space-y-6">
        {/* Header with total due amounts */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Due Next Payments</h2>
            <p className="text-sm text-gray-600">Manage upcoming credit account payments</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalDueAmount)}</p>
              <p className="text-sm text-gray-500">Total Due Amount</p>
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Due</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalDueAmount)}</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Upcoming Payments</p>
                  <p className="text-2xl font-bold text-blue-600">{upcomingPayments.length}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{overduePayments.length}</p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overdue Payments */}
        {overduePayments.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <span>Overdue Payments</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overduePayments.map((account) => {
                  const daysOverdue = Math.abs(getDaysUntilPayment(account.next_payment_date!));
                  return (
                    <div key={account.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200">
                      <div className="flex items-center space-x-4">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-red-900">{account.project?.project_name || 'Unknown Project'}</p>
                          <p className="text-sm text-red-700">Overdue by {daysOverdue} days</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">{formatCurrency(account.monthly_payment)}</p>
                        <p className="text-sm text-red-500">Requires immediate attention</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <span>Upcoming Payments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingPayments.length > 0 ? (
                upcomingPayments.map((account) => {
                  const daysUntil = getDaysUntilPayment(account.next_payment_date!);
                  return (
                    <div key={account.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                          daysUntil <= 7 ? 'bg-orange-500' : 'bg-green-500'
                        }`}></div>
                        <div>
                          <p className="font-medium">{account.project?.project_name || 'Unknown Project'}</p>
                          <p className="text-sm text-gray-500">
                            Due {formatDate(account.next_payment_date!)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(account.monthly_payment)}</p>
                        <p className={`text-sm px-2 py-1 rounded-full ${getPaymentUrgencyColor(daysUntil)}`}>
                          {daysUntil === 0 ? 'Due Today' : 
                           daysUntil === 1 ? 'Due Tomorrow' : 
                           `Due in ${daysUntil} days`}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="text-lg font-medium">No upcoming payments</p>
                  <p className="text-sm">All payments are current</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderEnhancedPayments = () => (
    <div className="space-y-6">
      {/* Enhanced Payment Management with Approval Workflow */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Payment Management</h2>
          <p className="text-sm text-gray-600">Manage and approve payments with advanced workflow controls</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Payment Approval Workflow Component */}
      <PaymentApprovalWorkflow 
        onApprovalComplete={(paymentId, approved) => {
          console.log(`Payment ${paymentId} ${approved ? 'approved' : 'rejected'}`);
          // Refresh data after approval
          refetch();
        }}
      />
    </div>
  );

  // Render Payment History tab
  const renderPaymentHistory = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Payment History Management</h2>
          <p className="text-sm text-gray-600">Complete CRUD operations for all payment records</p>
        </div>
      </div>

      <PaymentHistoryManager 
        showSummary={true}
        showActions={true}
        className="w-full"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Management & Control</h1>
          <p className="text-sm text-gray-600">
            Comprehensive financial oversight and control for construction projects
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && renderEnhancedOverview()}
          {activeTab === 'payment-history' && renderPaymentHistory()}
          {activeTab === 'due-next' && renderDueNextPayments()}
          {/* {activeTab === 'payments' && renderEnhancedPayments()} */}
          {/* {activeTab === 'budgets' && renderBudgets()} */}
          {/* {activeTab === 'credit' && renderCredit()} */}
        </div>
      </div>
    </div>
  );
};

export default FinancesPage;

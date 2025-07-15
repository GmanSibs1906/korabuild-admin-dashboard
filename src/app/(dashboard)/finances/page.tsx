'use client';

import { useState } from 'react';
import { useFinances } from '@/hooks/useFinances';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentApprovalWorkflow } from '@/components/dashboard/payment-approval-workflow';
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  CreditCard, 
  Calculator,
  Wallet,
  Settings,
  Download,
  Calendar,
  FileText
} from 'lucide-react';

const FinancesPage = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'budgets' | 'credit' | 'due-next'>('overview');
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
                        <p className="text-sm text-gray-500">Credit Account Payment</p>
                        <p className="text-xs text-gray-400">Due: {formatDate(account.next_payment_date!)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-orange-600">{formatCurrency(account.monthly_payment)}</p>
                      <Badge className={`text-xs ${getPaymentUrgencyColor(daysUntil)}`}>
                        {daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` : 
                         daysUntil === 0 ? 'Due today' : 
                         `${daysUntil} days left`}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            {creditAccounts.filter(account => account.next_payment_date && new Date(account.next_payment_date) >= new Date()).length === 0 && (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Payments</h3>
                <p className="text-gray-600">All credit account payments are up to date.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Financial Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Financial Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.slice(0, 5).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">{payment.description}</p>
                    <p className="text-sm text-gray-500">{payment.project?.project_name || 'No project'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">{formatCurrency(payment.amount)}</p>
                  <p className="text-sm text-gray-500">{new Date(payment.payment_date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
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
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-800">Total Due</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalDueAmount)}</div>
              <p className="text-xs text-orange-700">{upcomingPayments.length} upcoming payments</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-800">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(overduePayments.reduce((sum, account) => sum + account.monthly_payment, 0))}
              </div>
              <p className="text-xs text-red-700">{overduePayments.length} overdue payments</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-800">Next 30 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(upcomingPayments
                  .filter(account => getDaysUntilPayment(account.next_payment_date!) <= 30)
                  .reduce((sum, account) => sum + account.monthly_payment, 0))}
              </div>
              <p className="text-xs text-green-700">
                {upcomingPayments.filter(account => getDaysUntilPayment(account.next_payment_date!) <= 30).length} payments due
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Overdue Payments */}
        {overduePayments.length > 0 && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-red-800 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Overdue Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overduePayments.map((account) => {
                  const daysOverdue = Math.abs(getDaysUntilPayment(account.next_payment_date!));
                  return (
                    <div key={account.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center space-x-4">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="font-medium text-red-900">{account.project?.project_name || 'Unknown Project'}</p>
                          <p className="text-sm text-red-700">Credit Account Payment</p>
                          <p className="text-xs text-red-600">Due: {formatDate(account.next_payment_date!)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-red-600">{formatCurrency(account.monthly_payment)}</p>
                        <Badge className="bg-red-100 text-red-800 border-red-200">
                          {daysOverdue} days overdue
                        </Badge>
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
            <CardTitle className="text-lg font-semibold">Upcoming Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingPayments.map((account) => {
                const daysUntil = getDaysUntilPayment(account.next_payment_date!);
                return (
                  <div key={account.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Clock className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium">{account.project?.project_name || 'Unknown Project'}</p>
                        <p className="text-sm text-gray-500">Credit Account Payment</p>
                        <p className="text-xs text-gray-400">Due: {formatDate(account.next_payment_date!)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-orange-600">{formatCurrency(account.monthly_payment)}</p>
                      <Badge className={`text-xs ${getPaymentUrgencyColor(daysUntil)}`}>
                        {daysUntil === 0 ? 'Due today' : `${daysUntil} days left`}
                      </Badge>
                    </div>
                  </div>
                );
              })}
              {upcomingPayments.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Payments</h3>
                  <p className="text-gray-600">All credit account payments are up to date.</p>
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

  const renderBudgets = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Budget Control</h2>
          <p className="text-sm text-gray-600">Monitor and control project budgets with variance analysis</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
            <FileText className="h-4 w-4" />
            <span>New Budget</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(budgets.reduce((sum, b) => sum + b.budgeted_amount, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {budgets.length} active budgets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Actual Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(budgets.reduce((sum, b) => sum + b.actual_amount, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Current spending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Variance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overview.budgetVariance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {overview.budgetVariance >= 0 ? '+' : ''}{overview.budgetVariance.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Budget performance
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budgets.map((budget) => (
              <div key={budget.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-medium">{budget.budget_name}</h3>
                    <Badge className={budget.variance_percentage >= 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                      {budget.variance_percentage >= 0 ? '+' : ''}{budget.variance_percentage.toFixed(1)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{budget.project?.project_name || 'No project'}</p>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    <span>Budgeted: {formatCurrency(budget.budgeted_amount)}</span>
                    <span>Actual: {formatCurrency(budget.actual_amount)}</span>
                    <span>Variance: {formatCurrency(budget.variance_amount)}</span>
                  </div>
                </div>
                <div className="w-32">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        budget.variance_percentage >= 0 ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(Math.abs(budget.variance_percentage), 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCredit = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Credit Account Management</h2>
          <p className="text-sm text-gray-600">Monitor credit accounts and utilization</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Credit Limit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(overview.totalCreditLimit)}
            </div>
            <p className="text-xs text-muted-foreground">
              {creditAccounts.length} active accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Used Credit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(overview.totalCreditUsed)}
            </div>
            <p className="text-xs text-muted-foreground">
              Current utilization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Available Credit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(overview.totalCreditLimit - overview.totalCreditUsed)}
            </div>
            <p className="text-xs text-muted-foreground">
              Remaining capacity
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Credit Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {creditAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-medium">{account.project?.project_name || 'Unknown Project'}</h3>
                    <Badge className={account.credit_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {account.credit_status}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    <span>Limit: {formatCurrency(account.credit_limit)}</span>
                    <span>Used: {formatCurrency(account.used_credit)}</span>
                    <span>Available: {formatCurrency(account.available_credit)}</span>
                  </div>
                  {account.next_payment_date && (
                    <p className="text-xs text-gray-400 mt-1">
                      Next payment: {formatDate(account.next_payment_date)} - {formatCurrency(account.monthly_payment)}
                    </p>
                  )}
                </div>
                <div className="w-32">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-orange-500"
                      style={{ width: `${Math.min((account.used_credit / account.credit_limit) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    {((account.used_credit / account.credit_limit) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Management & Control</h1>
            <p className="mt-2 text-lg text-gray-600">
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

        {/* Navigation Tabs */}
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

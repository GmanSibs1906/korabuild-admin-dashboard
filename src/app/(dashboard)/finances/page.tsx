'use client';

import { useState } from 'react';
import { useFinances } from '@/hooks/useFinances';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  CreditCard, 
  PieChart,
  FileText,
  Calculator,
  Target,
  Wallet
} from 'lucide-react';

const FinancesPage = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'budgets' | 'credit'>('overview');
  const { financialData, isLoading, error, refetch, approvePayment } = useFinances({
    type: 'overview',
    autoRefetch: true,
    refetchInterval: 30000 // 30 seconds
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

  const { overview, payments, budgets, creditAccounts, counts } = financialData;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  // Get financial health color
  const getHealthColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'fair': return 'text-yellow-600 bg-yellow-50';
      case 'poor': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Financial Overview', icon: DollarSign },
    { id: 'payments', label: 'Payment Management', icon: CreditCard },
    { id: 'budgets', label: 'Budget Control', icon: Calculator },
    { id: 'credit', label: 'Credit Accounts', icon: Wallet }
  ];

  const handleApprovePayment = async (paymentId: string) => {
    try {
      await approvePayment(paymentId);
      // Success feedback would be handled by the hook
    } catch (error) {
      console.error('Failed to approve payment:', error);
      // Error feedback would be handled by the hook
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Financial Health Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Financial Health</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.financialHealthScore}</div>
            <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${getHealthColor(overview.financialHealthStatus)}`}>
              {overview.financialHealthStatus.toUpperCase()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overview.totalPayments)}</div>
            <p className="text-xs text-muted-foreground">
              {counts.totalPayments} total transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Variance</CardTitle>
            {overview.budgetVariance >= 0 ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overview.budgetVariance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {overview.budgetVariance >= 0 ? '+' : ''}{overview.budgetVariance.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {overview.budgetVariance >= 0 ? 'Over budget' : 'Under budget'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Utilization</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.creditUtilization.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(overview.totalCreditUsed)} of {formatCurrency(overview.totalCreditLimit)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Notifications */}
      {(overview.pendingApprovalsCount > 0 || overview.overduePaymentsCount > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overview.pendingApprovalsCount > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-yellow-800 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Pending Approvals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-900">{overview.pendingApprovalsCount}</div>
                <p className="text-xs text-yellow-700">Payments awaiting approval</p>
              </CardContent>
            </Card>
          )}

          {overview.overduePaymentsCount > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-800 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Overdue Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900">{overview.overduePaymentsCount}</div>
                <p className="text-xs text-red-700">Payments past due date</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Financial Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {financialData.recentPayments.slice(0, 5).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <DollarSign className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{payment.description}</p>
                      <p className="text-xs text-gray-500">
                        {payment.project?.project_name} • {payment.payment_date}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(payment.amount)}
                  </div>
                  <Badge className={getStatusBadgeColor(payment.status)}>
                    {payment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPayments = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Payment Management</h2>
          <p className="text-sm text-gray-500">Manage and approve payments across all projects</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {counts.totalPayments} Total Payments
          </Badge>
          <Badge variant="outline" className="text-xs">
            {overview.pendingApprovalsCount} Pending
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {financialData.pendingApprovals.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <FileText className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{payment.description}</p>
                      <p className="text-xs text-gray-500">
                        {payment.project?.project_name} • {payment.payment_method} • {payment.payment_date}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(payment.amount)}
                    </div>
                    <Badge className={getStatusBadgeColor(payment.status)}>
                      {payment.status}
                    </Badge>
                  </div>
                  <button
                    onClick={() => handleApprovePayment(payment.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Approve
                  </button>
                </div>
              </div>
            ))}
            {financialData.pendingApprovals.length === 0 && (
              <p className="text-center text-gray-500 py-8">No pending payment approvals</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderBudgets = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Budget Management</h2>
          <p className="text-sm text-gray-500">Monitor and control project budgets</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {counts.totalBudgets} Active Budgets
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overview.totalBudget)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overview.totalActual)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Variance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overview.budgetVariance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(overview.totalActual - overview.totalBudget)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budgets.slice(0, 10).map((budget) => (
              <div key={budget.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: budget.category?.color_hex || '#fe6700' }}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{budget.budget_name}</p>
                      <p className="text-xs text-gray-500">
                        {budget.project?.project_name} • {budget.budget_period}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(budget.actual_amount)} / {formatCurrency(budget.budgeted_amount)}
                  </div>
                  <div className={`text-xs ${budget.variance_percentage >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {budget.variance_percentage >= 0 ? '+' : ''}{budget.variance_percentage.toFixed(1)}%
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
          <h2 className="text-lg font-semibold">Credit Account Management</h2>
          <p className="text-sm text-gray-500">Monitor and manage credit facilities</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {counts.totalCreditAccounts} Active Accounts
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Credit Limit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overview.totalCreditLimit)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Credit Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overview.totalCreditUsed)}</div>
            <p className="text-xs text-gray-500">
              {overview.creditUtilization.toFixed(1)}% utilization
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
              <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <CreditCard className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{account.client?.full_name}</p>
                      <p className="text-xs text-gray-500">
                        {account.project?.project_name} • {account.credit_terms}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(account.used_credit)} / {formatCurrency(account.credit_limit)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Available: {formatCurrency(account.available_credit)}
                  </div>
                  <Badge className={account.credit_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {account.credit_status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'payments':
        return renderPayments();
      case 'budgets':
        return renderBudgets();
      case 'credit':
        return renderCredit();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Financial Management & Control</h1>
        <p className="text-sm text-gray-500 mt-1">
          Comprehensive financial oversight and control across all construction projects
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
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
      {renderTabContent()}
    </div>
  );
};

export default FinancesPage; 
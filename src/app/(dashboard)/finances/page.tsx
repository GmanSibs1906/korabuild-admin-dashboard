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
  TrendingDown, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  CreditCard, 
  PieChart,
  Calculator,
  Wallet,
  Settings,
  Plus,
  Download,
  Bell,
  Shield
} from 'lucide-react';

const FinancesPage = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'budgets' | 'credit'>('overview');
  const { financialData, isLoading, error, refetch } = useFinances({
    type: 'overview',
    autoRefetch: false,  // Disable auto-refresh to prevent constant reloading
    refetchInterval: 300000  // 5 minutes if manually enabled
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

  const tabs = [
    { id: 'overview', label: 'Financial Overview', icon: DollarSign },
    { id: 'payments', label: 'Payment Management', icon: CreditCard },
    { id: 'budgets', label: 'Budget Control', icon: Calculator },
    { id: 'credit', label: 'Credit Accounts', icon: Wallet }
  ];

  const renderEnhancedOverview = () => (
    <div className="space-y-8">
      {/* Enhanced Financial Health Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Financial Health</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.financialHealthScore}</div>
            <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${getHealthColor(overview.financialHealthStatus)}`}>
              {overview.financialHealthStatus.toUpperCase()}
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  overview.financialHealthScore >= 80 ? 'bg-green-500' :
                  overview.financialHealthScore >= 60 ? 'bg-blue-500' :
                  overview.financialHealthScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${overview.financialHealthScore}%` }}
              />
            </div>
          </CardContent>
        </Card>

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

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Performance</CardTitle>
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
              vs budgeted amount
            </p>
            <div className="mt-2">
              <Badge className={overview.budgetVariance >= 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                {overview.budgetVariance >= 0 ? 'Over Budget' : 'Under Budget'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Utilization</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.creditUtilization.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(overview.totalCreditUsed)} of {formatCurrency(overview.totalCreditLimit)}
            </p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  overview.creditUtilization >= 80 ? 'bg-red-500' :
                  overview.creditUtilization >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(overview.creditUtilization, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Payment Due Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg font-semibold">Next Payment Due</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Upcoming payment schedule and management</p>
            </div>
            <div className="flex items-center space-x-2">
              {/* Removed edit button */}
              {/* Removed add payment button */}
            </div>
          </CardHeader>
          <CardContent>
            {/* Removed loadingNextPayment state and logic */}
            {/* Removed nextPaymentData state and logic */}
            {/* Removed fetchNextPaymentData function */}
            {/* Removed handleOpenNextPaymentModal function */}
            {/* Removed handleNextPaymentUpdated function */}
            {/* Removed useEffect for fetching next payment data */}
            <div className="text-center py-8">
              {/* Removed Calendar import */}
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Schedule Set</h3>
              <p className="text-gray-600 mb-4">Add a payment schedule to track upcoming payments and deadlines.</p>
              {/* Removed Add Payment Schedule button */}
            </div>
          </CardContent>
        </Card>

        {/* Payment Alerts & Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <Bell className="h-5 w-5 mr-2 text-orange-600" />
              Payment Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Removed nextPaymentData and getDaysUntilPayment logic */}
            <div className="text-center py-4">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No payment alerts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-800 flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 bg-white rounded-lg border border-orange-200 hover:bg-orange-50 transition-colors">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Process Payment</span>
                </div>
              </button>
              <button className="w-full text-left px-3 py-2 bg-white rounded-lg border border-orange-200 hover:bg-orange-50 transition-colors">
                <div className="flex items-center space-x-2">
                  <Calculator className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Create Budget</span>
                </div>
              </button>
              <button className="w-full text-left px-3 py-2 bg-white rounded-lg border border-orange-200 hover:bg-orange-50 transition-colors">
                <div className="flex items-center space-x-2">
                  <Download className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Export Report</span>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center">
              <Bell className="h-4 w-4 mr-2" />
              Alerts & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overview.pendingApprovalsCount > 0 && (
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      {overview.pendingApprovalsCount} pending approvals
                    </span>
                  </div>
                </div>
              )}
              {overview.overduePaymentsCount > 0 && (
                <div className="p-2 bg-red-100 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">
                      {overview.overduePaymentsCount} overdue payments
                    </span>
                  </div>
                </div>
              )}
              {overview.pendingApprovalsCount === 0 && overview.overduePaymentsCount === 0 && (
                <div className="p-2 bg-green-100 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      All payments up to date
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-800 flex items-center">
              <PieChart className="h-4 w-4 mr-2" />
              Financial Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-700">Cash Flow</span>
                <span className="text-sm font-medium text-purple-800">Positive</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-700">ROI</span>
                <span className="text-sm font-medium text-purple-800">+15.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-700">Efficiency</span>
                <span className="text-sm font-medium text-purple-800">Excellent</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
            <Plus className="h-4 w-4" />
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
            <Plus className="h-4 w-4" />
            <span>New Account</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              {overview.creditUtilization.toFixed(1)}% utilization
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
              Remaining balance
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
                    <h3 className="font-medium">{account.client?.full_name || 'Unknown Client'}</h3>
                    <Badge className={account.credit_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {account.credit_status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{account.project?.project_name || 'No project'}</p>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    <span>Limit: {formatCurrency(account.credit_limit)}</span>
                    <span>Used: {formatCurrency(account.used_credit)}</span>
                    <span>Available: {formatCurrency(account.available_credit)}</span>
                  </div>
                </div>
                <div className="w-32">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        (account.used_credit / account.credit_limit) * 100 >= 80 ? 'bg-red-500' :
                        (account.used_credit / account.credit_limit) * 100 >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((account.used_credit / account.credit_limit) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-center mt-1">
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderEnhancedOverview();
      case 'payments':
        return renderEnhancedPayments();
      case 'budgets':
        return renderBudgets();
      case 'credit':
        return renderCredit();
      default:
        return renderEnhancedOverview();
    }
  };

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

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
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
      <div className="mt-6">
        {renderTabContent()}
      </div>

      {/* Next Payment Modal */}
      {/* Removed NextPaymentModal component */}
    </div>
  );
};

export default FinancesPage; 
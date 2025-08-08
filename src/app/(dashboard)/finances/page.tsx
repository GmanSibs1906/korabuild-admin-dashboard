'use client';

import { useState } from 'react';
import { useFinances } from '@/hooks/useFinances';
import { useProjects } from '@/hooks/useProjects';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  History,
  PiggyBank,
  CreditCard,
  Wallet,
  Building,
  ArrowUpRight,
  ArrowDownRight,
  Eye
} from 'lucide-react';

const FinancesPage = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'payment-history' | 'due-next'>('payment-history');
  const { financialData, isLoading: financialLoading, error: financialError, refetch } = useFinances({
    type: 'overview',
    autoRefetch: false,
    refetchInterval: 300000
  });
  const { projects, loading: projectsLoading, error: projectsError } = useProjects();

  const isLoading = financialLoading || projectsLoading;
  const error = financialError || (projectsError ? { error: projectsError } : null);

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

  if (!financialData || !projects) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No financial data available</p>
      </div>
    );
  }

  const { overview, payments, creditAccounts } = financialData || {};

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

  // Calculate comprehensive financial overview
  const calculateFinancialOverview = () => {
    // Use the enhanced financial data from the API
    if (financialData?.overview) {
      return {
        totalExpected: financialData.overview.totalExpected || 0,
        totalReceived: financialData.overview.totalReceived || 0,
        totalOutstanding: financialData.overview.totalOutstanding || 0,
        totalExpenditure: financialData.overview.totalExpenditure || 0,
        totalAvailable: financialData.overview.totalAvailable || 0
      };
    }

    // Fallback calculation if enhanced data is not available
    const totalExpected = projects.reduce((sum, project) => sum + (project.contract_value || 0), 0);
    
    // Get project financials from the API response
    const projectFinancials = financialData?.projectFinancials || [];
    const financialsMap = new Map();
    projectFinancials.forEach((pf: any) => {
      const existing = financialsMap.get(pf.project_id);
      if (!existing || new Date(pf.updated_at) > new Date(existing.updated_at)) {
        financialsMap.set(pf.project_id, pf);
      }
    });
    
    const totalReceived = Array.from(financialsMap.values())
      .reduce((sum: number, pf: any) => sum + (pf.cash_received || 0), 0);
    
    const totalOutstanding = totalExpected - totalReceived;
    
    const totalExpenditure = payments?.reduce((sum, payment) => {
      return payment.status === 'completed' ? sum + (payment.amount || 0) : sum;
    }, 0) || 0;
    
    const totalAvailable = totalReceived - totalExpenditure;

    return {
      totalExpected,
      totalReceived,
      totalOutstanding,
      totalExpenditure,
      totalAvailable
    };
  };

  const financialOverview = calculateFinancialOverview();

  const tabs = [
    // { id: 'overview', label: 'Financial Overview', icon: DollarSign },
    { id: 'payment-history', label: 'Payment History', icon: History },
    { id: 'due-next', label: 'Due Next Payments', icon: Clock },
  ];

  // const renderFinancialOverview = () => (
  //   <div className="space-y-8">
  //     {/* Primary Financial Metrics */}
  //     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
  //       {/* Total Expenditure - Primary Metric */}
  //       <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
  //         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
  //           <CardTitle className="text-sm font-medium text-red-800">Total Expenditure</CardTitle>
  //           <ArrowUpRight className="h-4 w-4 text-red-600" />
  //         </CardHeader>
  //         <CardContent>
  //           <div className="text-3xl font-bold text-red-700">
  //             {formatCurrency(financialOverview.totalExpenditure)}
  //           </div>
  //           <p className="text-xs text-red-600 mt-1">
  //             From {payments?.filter(p => p.status === 'completed').length || 0} completed payments
  //           </p>
  //         </CardContent>
  //       </Card>

  //       {/* Total Expected */}
  //       <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
  //         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
  //           <CardTitle className="text-sm font-medium text-blue-800">Total Expected</CardTitle>
  //           <Building className="h-4 w-4 text-blue-600" />
  //         </CardHeader>
  //         <CardContent>
  //           <div className="text-3xl font-bold text-blue-700">
  //             {formatCurrency(financialOverview.totalExpected)}
  //           </div>
  //           <p className="text-xs text-blue-600 mt-1">
  //             Total contract value across {projects.length} projects
  //           </p>
  //         </CardContent>
  //       </Card>

  //       {/* Total Received */}
  //       <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
  //         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
  //           <CardTitle className="text-sm font-medium text-green-800">Total Received</CardTitle>
  //           <ArrowDownRight className="h-4 w-4 text-green-600" />
  //         </CardHeader>
  //         <CardContent>
  //           <div className="text-3xl font-bold text-green-700">
  //             {formatCurrency(financialOverview.totalReceived)}
  //           </div>
  //           <p className="text-xs text-green-600 mt-1">
  //             Cash received from clients
  //           </p>
  //         </CardContent>
  //       </Card>

  //       {/* Total Outstanding */}
  //       <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
  //         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
  //           <CardTitle className="text-sm font-medium text-orange-800">Total Outstanding</CardTitle>
  //           <Clock className="h-4 w-4 text-orange-600" />
  //         </CardHeader>
  //         <CardContent>
  //           <div className="text-3xl font-bold text-orange-700">
  //             {formatCurrency(financialOverview.totalOutstanding)}
  //           </div>
  //           <p className="text-xs text-orange-600 mt-1">
  //             Expected minus received
  //           </p>
  //         </CardContent>
  //       </Card>

  //       {/* Total Available */}
  //       <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
  //         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
  //           <CardTitle className="text-sm font-medium text-purple-800">Total Available</CardTitle>
  //           <Wallet className="h-4 w-4 text-purple-600" />
  //         </CardHeader>
  //         <CardContent>
  //           <div className="text-3xl font-bold text-purple-700">
  //             {formatCurrency(financialOverview.totalAvailable)}
  //           </div>
  //           <p className="text-xs text-purple-600 mt-1">
  //             Received minus expenditure
  //           </p>
  //         </CardContent>
  //       </Card>

  //       {/* Cash Flow Health Indicator */}
  //       <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
  //         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
  //           <CardTitle className="text-sm font-medium text-gray-800">Cash Flow Health</CardTitle>
  //           <PiggyBank className="h-4 w-4 text-gray-600" />
  //         </CardHeader>
  //         <CardContent>
  //           <div className={`text-2xl font-bold ${
  //             financialOverview.totalAvailable > 0 ? 'text-green-600' : 'text-red-600'
  //           }`}>
  //             {financialOverview.totalAvailable > 0 ? 'Positive' : 'Negative'}
  //           </div>
  //           <p className="text-xs text-gray-600 mt-1">
  //             {((financialOverview.totalReceived / financialOverview.totalExpenditure) * 100).toFixed(1)}% efficiency ratio
  //           </p>
  //         </CardContent>
  //       </Card>
  //     </div>

  //     {/* Financial Breakdown Chart */}
  //     <Card>
  //       <CardHeader>
  //         <CardTitle className="text-lg font-semibold">Financial Breakdown</CardTitle>
  //         <p className="text-sm text-gray-600">Comprehensive view of financial position</p>
  //       </CardHeader>
  //       <CardContent>
  //         <div className="space-y-4">
  //           {/* Visual Progress Bars */}
  //           <div className="space-y-3">
  //             {/* Expected vs Received */}
  //             <div>
  //               <div className="flex justify-between text-sm font-medium mb-1">
  //                 <span>Payment Collection Progress</span>
  //                 <span>{((financialOverview.totalReceived / financialOverview.totalExpected) * 100).toFixed(1)}%</span>
  //               </div>
  //               <div className="w-full bg-gray-200 rounded-full h-3">
  //                 <div 
  //                   className="bg-green-500 h-3 rounded-full transition-all duration-300"
  //                   style={{ width: `${Math.min((financialOverview.totalReceived / financialOverview.totalExpected) * 100, 100)}%` }}
  //                 />
  //               </div>
  //               <div className="flex justify-between text-xs text-gray-500 mt-1">
  //                 <span>Received: {formatCurrency(financialOverview.totalReceived)}</span>
  //                 <span>Expected: {formatCurrency(financialOverview.totalExpected)}</span>
  //               </div>
  //             </div>

  //             {/* Expenditure vs Received */}
  //             <div>
  //               <div className="flex justify-between text-sm font-medium mb-1">
  //                 <span>Expenditure Rate</span>
  //                 <span>{financialOverview.totalReceived > 0 ? ((financialOverview.totalExpenditure / financialOverview.totalReceived) * 100).toFixed(1) : '0'}%</span>
  //               </div>
  //               <div className="w-full bg-gray-200 rounded-full h-3">
  //                 <div 
  //                   className={`h-3 rounded-full transition-all duration-300 ${
  //                     (financialOverview.totalExpenditure / financialOverview.totalReceived) > 0.8 ? 'bg-red-500' : 
  //                     (financialOverview.totalExpenditure / financialOverview.totalReceived) > 0.6 ? 'bg-orange-500' : 'bg-blue-500'
  //                   }`}
  //                   style={{ width: `${Math.min((financialOverview.totalExpenditure / financialOverview.totalReceived) * 100, 100)}%` }}
  //                 />
  //               </div>
  //               <div className="flex justify-between text-xs text-gray-500 mt-1">
  //                 <span>Spent: {formatCurrency(financialOverview.totalExpenditure)}</span>
  //                 <span>Available: {formatCurrency(financialOverview.totalAvailable)}</span>
  //               </div>
  //             </div>
  //           </div>
  //         </div>
  //       </CardContent>
  //     </Card>

  //     {/* Project Financial Summary */}
  //     <Card>
  //       <CardHeader>
  //         <CardTitle className="text-lg font-semibold">Project Financial Summary</CardTitle>
  //         <p className="text-sm text-gray-600">Financial overview by project</p>
  //       </CardHeader>
  //       <CardContent>
  //         <div className="space-y-3">
  //           {projects.slice(0, 5).map((project) => {
  //             const projectPayments = payments?.filter(p => p.project_id === project.id) || [];
  //             const projectExpenditure = projectPayments
  //               .filter(p => p.status === 'completed')
  //               .reduce((sum, p) => sum + (p.amount || 0), 0);
  //             const estimatedReceived = (project.contract_value || 0) * 0.6; // Placeholder

  //             return (
  //               <div key={project.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
  //                 <div className="flex-1">
  //                   <h3 className="font-medium text-gray-900">{project.project_name}</h3>
  //                   <p className="text-sm text-gray-500">
  //                     Contract: {formatCurrency(project.contract_value || 0)} | 
  //                     Expenditure: {formatCurrency(projectExpenditure)}
  //                   </p>
  //                 </div>
  //                 <div className="text-right">
  //                   <p className="font-medium text-gray-900">
  //                     {formatCurrency(estimatedReceived - projectExpenditure)}
  //                   </p>
  //                   <p className="text-sm text-gray-500">Available</p>
  //                 </div>
  //               </div>
  //             );
  //           })}
            
  //           {projects.length > 5 && (
  //             <div className="text-center pt-4">
  //               <button className="flex items-center space-x-2 mx-auto px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
  //                 <Eye className="h-4 w-4" />
  //                 <span>View all {projects.length} projects</span>
  //               </button>
  //             </div>
  //           )}
  //         </div>
  //       </CardContent>
  //     </Card>

  //     {/* Quick Actions */}
  //     <Card>
  //       <CardHeader>
  //         <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
  //         <p className="text-sm text-gray-600">Common financial tasks and shortcuts</p>
  //       </CardHeader>
  //       <CardContent>
  //         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  //           <button 
  //             onClick={() => setActiveTab('payment-history')}
  //             className="p-4 text-left bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
  //           >
  //             <div className="flex items-center space-x-3">
  //               <History className="h-6 w-6 text-orange-600" />
  //               <div>
  //                 <p className="font-medium text-orange-900">Payment History</p>
  //                 <p className="text-sm text-orange-700">View all payment records</p>
  //               </div>
  //             </div>
  //           </button>
            
  //           <button 
  //             onClick={() => setActiveTab('due-next')}
  //             className="p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
  //           >
  //             <div className="flex items-center space-x-3">
  //               <Clock className="h-6 w-6 text-blue-600" />
  //               <div>
  //                 <p className="font-medium text-blue-900">Due Next Payments</p>
  //                 <p className="text-sm text-blue-700">Manage upcoming payments</p>
  //               </div>
  //             </div>
  //           </button>
            
  //           <button className="p-4 text-left bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors">
  //             <div className="flex items-center space-x-3">
  //               <Calculator className="h-6 w-6 text-green-600" />
  //               <div>
  //                 <p className="font-medium text-green-900">Financial Analysis</p>
  //                 <p className="text-sm text-green-700">Detailed financial reports</p>
  //               </div>
  //             </div>
  //           </button>
  //         </div>
  //       </CardContent>
  //     </Card>
  //   </div>
  // );

  const renderDueNextPayments = () => {
    const totalDueAmount = creditAccounts
      ?.filter(account => account.next_payment_date && new Date(account.next_payment_date) >= new Date())
      .reduce((sum, account) => sum + account.monthly_payment, 0) || 0;

    const overduePayments = creditAccounts
      ?.filter(account => account.next_payment_date && new Date(account.next_payment_date) < new Date()) || [];

    const upcomingPayments = creditAccounts
      ?.filter(account => account.next_payment_date && new Date(account.next_payment_date) >= new Date())
      .sort((a, b) => new Date(a.next_payment_date!).getTime() - new Date(b.next_payment_date!).getTime()) || [];

    return (
      <div className="space-y-6">
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

  const renderPaymentHistory = () => (
    <div className="space-y-6">
      <PaymentHistoryManager />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Management</h1>
          <p className="text-sm text-gray-600">Comprehensive expenditure overview and financial control</p>
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

        <div className="space-y-6">
          {/* {activeTab === 'overview' && renderFinancialOverview()} */}
          {activeTab === 'payment-history' && renderPaymentHistory()}
          {activeTab === 'due-next' && renderDueNextPayments()}
        </div>
      </div>
    </div>
  );
};

export default FinancesPage;

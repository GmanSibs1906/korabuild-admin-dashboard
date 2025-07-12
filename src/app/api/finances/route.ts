import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const userId = searchParams.get('userId');
  const type = searchParams.get('type'); // 'overview', 'payments', 'budgets', 'credit'

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get comprehensive financial data
    const financialData: any = {
      timestamp: new Date().toISOString(),
      type: type || 'overview'
    };

    // Get all payments with project and user info
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select(`
        *,
        project:projects(
          id,
          project_name,
          client_id,
          contract_value,
          status
        ),
        milestone:project_milestones(
          id,
          milestone_name,
          phase_category
        )
      `)
      .order('payment_date', { ascending: false });

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
      throw paymentsError;
    }

    // Get financial budgets with variance analysis
    const { data: budgets, error: budgetsError } = await supabase
      .from('financial_budgets')
      .select(`
        *,
        project:projects(
          id,
          project_name,
          client_id,
          contract_value
        ),
        milestone:project_milestones(
          id,
          milestone_name,
          phase_category
        ),
        category:payment_categories(
          id,
          category_name,
          category_code,
          color_hex,
          icon_name
        )
      `)
      .order('created_at', { ascending: false });

    if (budgetsError) {
      console.error('Error fetching budgets:', budgetsError);
      throw budgetsError;
    }

    // Get enhanced credit accounts
    const { data: creditAccounts, error: creditError } = await supabase
      .from('enhanced_credit_accounts')
      .select(`
        *,
        project:projects(
          id,
          project_name,
          client_id,
          contract_value
        ),
        client:users!client_id(
          id,
          full_name,
          email,
          phone
        )
      `)
      .order('created_at', { ascending: false });

    if (creditError) {
      console.error('Error fetching credit accounts:', creditError);
      throw creditError;
    }

    // Get payment categories
    const { data: paymentCategories, error: categoriesError } = await supabase
      .from('payment_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (categoriesError) {
      console.error('Error fetching payment categories:', categoriesError);
      throw categoriesError;
    }

    // Get receipt metadata
    const { data: receipts, error: receiptsError } = await supabase
      .from('receipt_metadata')
      .select(`
        *,
        payment:payments(
          id,
          amount,
          payment_date,
          description,
          project:projects(
            id,
            project_name
          )
        )
      `)
      .order('upload_date', { ascending: false });

    if (receiptsError) {
      console.error('Error fetching receipts:', receiptsError);
      throw receiptsError;
    }

    // Calculate financial analytics
    const totalPayments = payments?.reduce((sum: number, payment: any) => sum + Number(payment.amount), 0) || 0;
    const totalBudget = budgets?.reduce((sum: number, budget: any) => sum + Number(budget.budgeted_amount), 0) || 0;
    const totalActual = budgets?.reduce((sum: number, budget: any) => sum + Number(budget.actual_amount), 0) || 0;
    const totalCreditLimit = creditAccounts?.reduce((sum: number, account: any) => sum + Number(account.credit_limit), 0) || 0;
    const totalCreditUsed = creditAccounts?.reduce((sum: number, account: any) => sum + Number(account.used_credit), 0) || 0;

    // Calculate payment status distribution
    const paymentStatusCounts = payments?.reduce((acc, payment) => {
      acc[payment.status] = (acc[payment.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Calculate budget variance
    const budgetVariance = totalBudget > 0 ? ((totalActual - totalBudget) / totalBudget) * 100 : 0;

    // Calculate credit utilization
    const creditUtilization = totalCreditLimit > 0 ? (totalCreditUsed / totalCreditLimit) * 100 : 0;

    // Get recent payment activities
    const recentPayments = payments?.slice(0, 10) || [];

    // Get pending approvals (payments with pending status)
    const pendingApprovals = payments?.filter(payment => payment.status === 'pending') || [];

    // Get overdue payments (this would require due date logic)
    const currentDate = new Date();
    const overduePayments = payments?.filter(payment => {
      // Add your overdue logic here based on due dates
      return payment.status === 'pending' && payment.payment_date < currentDate.toISOString().split('T')[0];
    }) || [];

    // Financial health scoring
    const getFinancialHealthScore = () => {
      let score = 70; // Base score
      
      // Budget variance impact
      if (budgetVariance < -10) score += 10; // Under budget
      else if (budgetVariance > 10) score -= 15; // Over budget
      
      // Credit utilization impact
      if (creditUtilization < 30) score += 10; // Low utilization
      else if (creditUtilization > 80) score -= 20; // High utilization
      
      // Payment status impact
      const pendingRatio = pendingApprovals.length / (payments?.length || 1);
      if (pendingRatio > 0.3) score -= 15; // Too many pending
      
      return Math.max(0, Math.min(100, score));
    };

    const financialHealthScore = getFinancialHealthScore();

    // Determine financial health status
    const getFinancialHealthStatus = (score: number) => {
      if (score >= 80) return 'excellent';
      if (score >= 60) return 'good';
      if (score >= 40) return 'fair';
      return 'poor';
    };

    // Build response based on type
    financialData.overview = {
      totalPayments,
      totalBudget,
      totalActual,
      totalCreditLimit,
      totalCreditUsed,
      budgetVariance,
      creditUtilization,
      financialHealthScore,
      financialHealthStatus: getFinancialHealthStatus(financialHealthScore),
      paymentStatusCounts,
      pendingApprovalsCount: pendingApprovals.length,
      overduePaymentsCount: overduePayments.length,
      recentPaymentsCount: recentPayments.length
    };

    financialData.payments = payments || [];
    financialData.budgets = budgets || [];
    financialData.creditAccounts = creditAccounts || [];
    financialData.paymentCategories = paymentCategories || [];
    financialData.receipts = receipts || [];
    financialData.recentPayments = recentPayments;
    financialData.pendingApprovals = pendingApprovals;
    financialData.overduePayments = overduePayments;

    // Add counts for summary
    financialData.counts = {
      totalPayments: payments?.length || 0,
      totalBudgets: budgets?.length || 0,
      totalCreditAccounts: creditAccounts?.length || 0,
      totalCategories: paymentCategories?.length || 0,
      totalReceipts: receipts?.length || 0
    };

    console.log('✅ Financial data fetched successfully:', {
      paymentsCount: financialData.counts.totalPayments,
      budgetsCount: financialData.counts.totalBudgets,
      creditAccountsCount: financialData.counts.totalCreditAccounts,
      financialHealth: financialData.overview.financialHealthStatus,
      totalValue: financialData.overview.totalPayments
    });

    return NextResponse.json(financialData);

  } catch (error) {
    console.error('❌ Error in financial API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial data', details: error },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, data } = body;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    switch (action) {
      case 'create_payment':
        const { data: newPayment, error: paymentError } = await supabase
          .from('payments')
          .insert([data])
          .select()
          .single();

        if (paymentError) throw paymentError;
        return NextResponse.json({ success: true, payment: newPayment });

      case 'create_budget':
        const { data: newBudget, error: budgetError } = await supabase
          .from('financial_budgets')
          .insert([data])
          .select()
          .single();

        if (budgetError) throw budgetError;
        return NextResponse.json({ success: true, budget: newBudget });

      case 'update_credit_account':
        const { data: updatedAccount, error: accountError } = await supabase
          .from('enhanced_credit_accounts')
          .update(data)
          .eq('id', data.id)
          .select()
          .single();

        if (accountError) throw accountError;
        return NextResponse.json({ success: true, account: updatedAccount });

      case 'approve_payment':
        const { data: approvedPayment, error: approvalError } = await supabase
          .from('payments')
          .update({ status: 'completed' })
          .eq('id', data.paymentId)
          .select()
          .single();

        if (approvalError) throw approvalError;
        return NextResponse.json({ success: true, payment: approvedPayment });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Error in financial POST:', error);
    return NextResponse.json(
      { error: 'Failed to process financial operation', details: error },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper function to update ONLY the calculated payments total (not cash_received)
const updatePaymentsTotal = async (projectId: string) => {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  try {
    console.log('🔧 Updating payments total for project:', projectId);
    
    // Calculate total completed payments
    const { data: allPayments } = await supabaseAdmin
      .from('payments')
      .select('amount')
      .eq('project_id', projectId)
      .eq('status', 'completed');

    const totalPayments = allPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    
    console.log('💰 Calculated total payments:', totalPayments);

    // Update ONLY the calculated field, leave cash_received untouched
    const { error: updateError } = await supabaseAdmin
      .from('project_financials')
      .update({
        total_payments_calculated: totalPayments,
        updated_at: new Date().toISOString()
      })
      .eq('project_id', projectId);

    if (updateError) {
      console.error('❌ Error updating payments total:', updateError);
    } else {
      console.log('✅ Payments total updated successfully');
    }
  } catch (error) {
    console.error('⚠️ Error updating payments total:', error);
    // Don't throw - payment operations should still succeed
  }
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    console.log('💰 Financial API - GET request type:', type);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const response = {
      success: true,
      type: type || 'overview'
    };

    // Get all projects with their contract values and financial data
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        id,
        project_name,
        client_id,
        contract_value,
        status
      `)
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      throw projectsError;
    }

    // Get project financials data
    const { data: projectFinancials, error: financialsError } = await supabase
      .from('project_financials')
      .select(`
        project_id,
        cash_received,
        amount_used,
        amount_remaining,
        total_payments_calculated,
        snapshot_date,
        updated_at
      `)
      .order('updated_at', { ascending: false });

    if (financialsError) {
      console.error('Error fetching project financials:', financialsError);
      // Don't throw - continue without financials data
      console.warn('⚠️ Continuing without project financials data');
    }

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

    // Get receipt metadata (handle broken foreign key gracefully)
    let receipts = [];
    const { data: receiptsData, error: receiptsError } = await supabase
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
      // Don't throw error - just continue without receipts data
      console.warn('⚠️ Continuing without receipt metadata due to relationship error');
    } else {
      receipts = receiptsData || [];
    }

    // Calculate comprehensive financial metrics
    const totalExpected = projects?.reduce((sum, project) => sum + (project.contract_value || 0), 0) || 0;
    
    // Calculate total received from project_financials.cash_received
    const financialsMap = new Map();
    projectFinancials?.forEach(pf => {
      const existing = financialsMap.get(pf.project_id);
      if (!existing || new Date(pf.updated_at) > new Date(existing.updated_at)) {
        financialsMap.set(pf.project_id, pf);
      }
    });
    
    const totalReceived = Array.from(financialsMap.values())
      .reduce((sum, pf) => sum + (pf.cash_received || 0), 0);
    
    // Calculate total outstanding
    const totalOutstanding = totalExpected - totalReceived;
    
    // Calculate total expenditure from completed payments
    const totalExpenditure = payments?.reduce((sum, payment) => {
      return payment.status === 'completed' ? sum + (payment.amount || 0) : sum;
    }, 0) || 0;
    
    // Calculate total available
    const totalAvailable = totalReceived - totalExpenditure;

    // Legacy calculations for backward compatibility
    const totalPayments = payments?.reduce((sum: number, payment: any) => sum + Number(payment.amount), 0) || 0;
    const totalBudget = budgets?.reduce((sum: number, budget: any) => sum + Number(budget.budgeted_amount), 0) || 0;
    const totalActual = budgets?.reduce((sum: number, budget: any) => sum + Number(budget.actual_amount), 0) || 0;
    const totalVariance = totalActual - totalBudget;

    // Payment status breakdown
    const paymentStats = payments?.reduce((acc: any, payment: any) => {
      acc.total += Number(payment.amount);
      acc.count += 1;
      acc.statusBreakdown[payment.status] = (acc.statusBreakdown[payment.status] || 0) + 1;
      acc.categoryBreakdown[payment.payment_category] = (acc.categoryBreakdown[payment.payment_category] || 0) + Number(payment.amount);
      return acc;
    }, {
      total: 0,
      count: 0,
      statusBreakdown: {},
      categoryBreakdown: {}
    }) || { total: 0, count: 0, statusBreakdown: {}, categoryBreakdown: {} };

    // Monthly trends
    const monthlyData = payments?.reduce((acc: any, payment: any) => {
      const month = new Date(payment.payment_date).toISOString().substring(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { amount: 0, count: 0 };
      }
      acc[month].amount += Number(payment.amount);
      acc[month].count += 1;
      return acc;
    }, {}) || {};

    // Calculate current month payments dynamically
    const currentMonth = new Date().toISOString().substring(0, 7);
    const monthlyPayments = monthlyData[currentMonth]?.amount || 0;

    // Build comprehensive response
    const responseData = {
      overview: {
        // New comprehensive financial metrics
        totalExpected,
        totalReceived,
        totalOutstanding,
        totalExpenditure,
        totalAvailable,
        monthlyPayments, // Dynamic current month payments
        cashFlowHealth: totalAvailable > 0 ? 'positive' : 'negative',
        collectionProgress: totalExpected > 0 ? ((totalReceived / totalExpected) * 100).toFixed(1) : '0',
        expenditureRate: totalReceived > 0 ? ((totalExpenditure / totalReceived) * 100).toFixed(1) : '0',
        
        // Legacy metrics for backward compatibility
        totalPayments,
        totalBudget,
        totalActual,
        totalVariance,
        variancePercentage: totalBudget > 0 ? ((totalVariance / totalBudget) * 100).toFixed(1) : '0',
        paymentStats,
        monthlyTrends: Object.entries(monthlyData).map(([month, data]: [string, any]) => ({
          month,
          amount: data.amount,
          count: data.count
        })).sort((a, b) => a.month.localeCompare(b.month))
      },
      projects: projects || [],
      projectFinancials: projectFinancials || [],
      payments: payments || [],
      budgets: budgets || [],
      creditAccounts: creditAccounts || [],
      paymentCategories: paymentCategories || [],
      receipts: receipts || [],
      analytics: {
        totalProjects: projects?.length || 0,
        projectsWithFinancials: financialsMap.size,
        averagePaymentAmount: paymentStats.count > 0 ? (paymentStats.total / paymentStats.count).toFixed(2) : '0',
        largestPayment: payments?.length > 0 ? Math.max(...payments.map((p: any) => Number(p.amount))) : 0,
        recentPayments: payments?.slice(0, 5) || []
      }
    };

    console.log('✅ Financial data fetched successfully with comprehensive metrics');

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('❌ Error in financial API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch financial data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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

        // 🔧 UPDATE PAYMENTS TOTAL: Only update calculated field, leave cash_received alone
        await updatePaymentsTotal(data.project_id);

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
        // Get payment details first to get project_id
        const { data: paymentDetails, error: fetchError } = await supabase
          .from('payments')
          .select('project_id')
          .eq('id', data.paymentId)
          .single();

        if (fetchError) throw fetchError;

        const { data: approvedPayment, error: approvalError } = await supabase
          .from('payments')
          .update({ status: 'completed' })
          .eq('id', data.paymentId)
          .select()
          .single();

        if (approvalError) throw approvalError;

        // 🔧 UPDATE PAYMENTS TOTAL: Only update calculated field, leave cash_received alone
        await updatePaymentsTotal(paymentDetails.project_id);

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
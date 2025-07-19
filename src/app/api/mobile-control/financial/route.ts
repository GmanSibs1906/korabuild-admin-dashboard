import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// Types for mobile app financial data control
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get project basic info
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get project financials - Get the LATEST record using multiple criteria
    const { data: financials, error: financialsError } = await supabaseAdmin
      .from('project_financials')
      .select('*')
      .eq('project_id', projectId)
      .order('snapshot_date', { ascending: false })
      .order('updated_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1);

    if (financialsError) {
      throw financialsError;
    }

    // Get payments
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('project_id', projectId)
      .order('payment_date', { ascending: false });

    if (paymentsError) {
      throw paymentsError;
    }

    // Get credit account
    const { data: creditAccount, error: creditError } = await supabaseAdmin
      .from('enhanced_credit_accounts')
      .select('*')
      .eq('project_id', projectId)
      .single();

    // Get enhanced credit account if exists
    let creditData: MobileCreditData = {
      creditLimit: 0,
      creditUsed: 0,
      creditAvailable: 0,
      monthlyPayment: 0,
      nextPaymentDate: '',
      interestRate: 0
    };

    if (creditAccount) {
      creditData = {
        creditLimit: creditAccount.credit_limit || 0,
        creditUsed: creditAccount.used_credit || 0,
        creditAvailable: creditAccount.available_credit || 0,
        monthlyPayment: creditAccount.monthly_payment || 0,
        nextPaymentDate: creditAccount.next_payment_date || '',
        interestRate: creditAccount.interest_rate || 0
      };
    }

    // Calculate financial data
    const contractValue = project.contract_value || 0;
    const totalPayments = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
    
    // Use project financials if available, otherwise calculate from payments
    let cashReceived = totalPayments;
    let amountUsed = 0;
    let amountRemaining = contractValue - totalPayments;

    if (financials && financials.length > 0) {
      const latestFinancial = financials[0];
      cashReceived = latestFinancial.cash_received || totalPayments;
      amountUsed = latestFinancial.amount_used || 0;
      amountRemaining = latestFinancial.amount_remaining || (contractValue - cashReceived);
    } else {
      // Calculate estimates based on project progress
      const progressPercentage = project.progress_percentage || 0;
      amountUsed = Math.round((contractValue * progressPercentage) / 100);
      amountRemaining = contractValue - amountUsed;
    }

    // Calculate financial health
    const utilizationRate = contractValue > 0 ? (amountUsed / contractValue) * 100 : 0;
    const remainingRate = contractValue > 0 ? (amountRemaining / contractValue) * 100 : 100;
    
    let financialHealth: 'Healthy' | 'Caution' | 'Critical' = 'Healthy';
    if (remainingRate < 10) {
      financialHealth = 'Critical';
    } else if (remainingRate < 25) {
      financialHealth = 'Caution';
    }

    // Prepare mobile financial data
    const mobileFinancialData: MobileFinancialData = {
      contractValue,
      cashReceived,
      amountUsed,
      amountRemaining,
      financialHealth,
      creditAvailable: creditData.creditAvailable,
      creditUsed: creditData.creditUsed,
      creditLimit: creditData.creditLimit
    };

    // Prepare mobile payment data
    const mobilePaymentData: MobilePaymentData[] = payments?.map(payment => ({
      id: payment.id,
      amount: payment.amount || 0,
      date: payment.payment_date,
      description: payment.description || '',
      category: payment.payment_category || 'other',
      status: payment.status || 'pending',
      reference: payment.reference || ''
    })) || [];

    // Calculate next payment
    const nextPaymentAmount = Math.round(contractValue * 0.15); // 15% of contract value
    const nextPaymentDate = new Date();
    nextPaymentDate.setDate(nextPaymentDate.getDate() + 30); // 30 days from now

    const mobileNextPaymentData: MobileNextPaymentData = {
      amount: nextPaymentAmount,
      description: `Next milestone payment (${project.current_phase || 'Current Phase'})`,
      dueDate: nextPaymentDate.toISOString().split('T')[0],
      category: 'milestone',
      priority: 'normal'
    };

    // Log the mobile financial data control action
    console.log('📱 Mobile Financial Data Control - GET:', {
      projectId,
      contractValue,
      cashReceived,
      amountUsed,
      amountRemaining,
      financialHealth,
      paymentsCount: mobilePaymentData.length,
      creditInfo: creditData,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data: {
        financial: mobileFinancialData,
        payments: mobilePaymentData,
        credit: creditData,
        nextPayment: mobileNextPaymentData,
        lastUpdated: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('❌ Error fetching mobile financial data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mobile financial data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, updateType, data } = body;

    if (!projectId || !updateType || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let result;

    switch (updateType) {
      case 'contractValue':
        // Update contract value in projects table
        console.log('💰 Processing contract value update for project:', projectId);
        console.log('💰 New contract value:', data.contractValue);
        
        const { data: projectUpdate, error: projectError } = await supabaseAdmin
          .from('projects')
          .update({
            contract_value: data.contractValue,
            updated_at: new Date().toISOString()
          })
          .eq('id', projectId)
          .select();

        if (projectError) {
          console.error('❌ Error updating project contract value:', projectError);
          throw projectError;
        }

        console.log('✅ Contract value update successful:', projectUpdate);
        result = projectUpdate;
        break;

      case 'financial':
        // Update project financials - Get the LATEST record and update it
        let financialUpdate;
        let financialError;
        
        console.log('💰 Processing financial update for project:', projectId);
        console.log('💰 Financial data:', data);
        
        // Get the LATEST financial record (same logic as GET request)
        const { data: existingFinancials, error: financialSelectError } = await supabaseAdmin
          .from('project_financials')
          .select('*')
          .eq('project_id', projectId)
          .order('snapshot_date', { ascending: false })
          .order('updated_at', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1);

        if (financialSelectError) {
          console.error('❌ Error selecting existing financial record:', financialSelectError);
          throw financialSelectError;
        }

        const latestFinancial = existingFinancials?.[0];
        console.log('💰 Latest financial record found:', latestFinancial);

        if (latestFinancial) {
          // Update the LATEST existing record
          console.log('💰 Updating latest financial record with ID:', latestFinancial.id);
          const { data: updateData, error: updateError } = await supabaseAdmin
            .from('project_financials')
            .update({
              cash_received: data.cashReceived,
              amount_used: data.amountUsed,
              amount_remaining: data.amountRemaining,
              snapshot_date: new Date().toISOString().split('T')[0],
              updated_at: new Date().toISOString()
            })
            .eq('id', latestFinancial.id) // Update by ID, not project_id
            .select();

          financialUpdate = updateData;
          financialError = updateError;
        } else {
          // Create new record only if none exists
          console.log('💰 Creating new financial record');
          const { data: insertData, error: insertError } = await supabaseAdmin
            .from('project_financials')
            .insert({
              project_id: projectId,
              cash_received: data.cashReceived,
              amount_used: data.amountUsed,
              amount_remaining: data.amountRemaining,
              snapshot_date: new Date().toISOString().split('T')[0],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select();

          financialUpdate = insertData;
          financialError = insertError;
        }

        if (financialError) {
          console.error('❌ Error in financial update:', financialError);
          throw financialError;
        }

        console.log('✅ Financial update successful:', financialUpdate);
        result = financialUpdate;
        break;

      case 'payment':
        // Add new payment record
        const { data: paymentUpdate, error: paymentError } = await supabaseAdmin
          .from('payments')
          .insert({
            project_id: projectId,
            amount: data.amount,
            payment_date: data.date,
            description: data.description,
            payment_category: data.category,
            status: data.status || 'completed',
            reference: data.reference || `PAY-${Date.now()}`,
            payment_method: data.method || 'bank_transfer',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (paymentError) {
          throw paymentError;
        }

        result = paymentUpdate;
        break;

      case 'credit':
        // Update credit account - first try to update existing record
        let creditUpdate;
        let creditError;
        
        console.log('💳 Processing credit update for project:', projectId);
        console.log('💳 Credit data:', data);
        
        // Try to update existing record first
        const { data: existingCredit, error: creditSelectError } = await supabaseAdmin
          .from('enhanced_credit_accounts')
          .select('*')
          .eq('project_id', projectId)
          .single();

        if (creditSelectError && creditSelectError.code !== 'PGRST116') {
          console.error('❌ Error selecting existing credit record:', creditSelectError);
          throw creditSelectError;
        }

        console.log('💳 Existing credit record:', existingCredit);

        if (existingCredit) {
          // Update existing record
          console.log('💳 Updating existing credit record');
          const { data: updateData, error: updateError } = await supabaseAdmin
            .from('enhanced_credit_accounts')
            .update({
              credit_limit: data.creditLimit,
              used_credit: data.creditUsed,
              monthly_payment: data.monthlyPayment,
              next_payment_date: data.nextPaymentDate,
              interest_rate: data.interestRate,
              updated_at: new Date().toISOString()
            })
            .eq('project_id', projectId)
            .select();

          creditUpdate = updateData;
          creditError = updateError;
        } else {
          // Insert new record - need to get client_id from project
          console.log('💳 Creating new credit record');
          
          // Get project to find client_id
          const { data: projectData, error: projectError } = await supabaseAdmin
            .from('projects')
            .select('client_id')
            .eq('id', projectId)
            .single();

          if (projectError) {
            console.error('❌ Error getting project client_id:', projectError);
            throw projectError;
          }

          const { data: insertData, error: insertError } = await supabaseAdmin
            .from('enhanced_credit_accounts')
            .insert({
              project_id: projectId,
              client_id: projectData.client_id,
              credit_limit: data.creditLimit,
              used_credit: data.creditUsed,
              monthly_payment: data.monthlyPayment,
              next_payment_date: data.nextPaymentDate,
              interest_rate: data.interestRate,
              credit_status: 'active',
              credit_terms: '30 days net',
              approval_date: new Date().toISOString().split('T')[0],
              expiry_date: new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select();

          creditUpdate = insertData;
          creditError = insertError;
        }

        if (creditError) {
          console.error('❌ Error in credit update:', creditError);
          throw creditError;
        }

        console.log('✅ Credit update successful:', creditUpdate);
        result = creditUpdate;
        break;

      default:
        return NextResponse.json({ error: 'Invalid update type' }, { status: 400 });
    }

    // Log the mobile financial data control action
    console.log('📱 Mobile Financial Data Control - POST:', {
      projectId,
      updateType,
      data,
      result,
      timestamp: new Date().toISOString()
    });

    // 🧹 CLEANUP: Remove duplicate financial records if we just updated financial data
    if (updateType === 'financial') {
      try {
        // Get all financial records for this project
        const { data: allFinancials } = await supabaseAdmin
          .from('project_financials')
          .select('id, created_at, updated_at, snapshot_date')
          .eq('project_id', projectId)
          .order('snapshot_date', { ascending: false })
          .order('updated_at', { ascending: false })
          .order('created_at', { ascending: false });

        if (allFinancials && allFinancials.length > 1) {
          // Keep the latest record (first in sorted order) and delete the rest
          const latestRecordId = allFinancials[0].id;
          const duplicateRecordIds = allFinancials.slice(1).map(record => record.id);
          
          if (duplicateRecordIds.length > 0) {
            console.log('🧹 Cleaning up duplicate financial records:', {
              projectId,
              totalRecords: allFinancials.length,
              keepingRecord: latestRecordId,
              deletingRecords: duplicateRecordIds
            });

            const { error: deleteError } = await supabaseAdmin
              .from('project_financials')
              .delete()
              .in('id', duplicateRecordIds);

            if (deleteError) {
              console.error('⚠️ Warning: Could not clean up duplicate records:', deleteError);
            } else {
              console.log('✅ Successfully cleaned up duplicate financial records');
            }
          }
        }
      } catch (cleanupError) {
        console.error('⚠️ Warning: Cleanup failed, but main operation succeeded:', cleanupError);
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `Mobile financial data updated successfully`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error updating mobile financial data:', error);
    return NextResponse.json(
      { error: 'Failed to update mobile financial data' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

interface NextPaymentRequestData {
  milestone_id?: string;
  payment_amount?: number;
  payment_sequence?: number;
  total_payments?: number;
  total_amount?: number;
  next_payment_date?: string;
  last_payment_date?: string | null;
  credit_terms?: string;
  credit_status?: string;
  notes?: string | null;
  id?: string;
}

interface NextPaymentPostBody {
  action: 'create' | 'update' | 'delete';
  projectId?: string;
  paymentData: NextPaymentRequestData;
}

// 🔧 GET - Fetch next payment data for a project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    console.log('💰 Next Payment API - GET:', { projectId });

    // Try to get enhanced credit account with new schema first
    const { data: creditAccount, error } = await supabaseAdmin
      .from('enhanced_credit_accounts')
      .select(`
        id,
        project_id,
        milestone_id,
        payment_amount,
        payment_sequence,
        total_payments,
        total_amount,
        next_payment_date,
        last_payment_date,
        credit_terms,
        credit_status,
        notes,
        created_at,
        updated_at
      `)
      .eq('project_id', projectId)
      .maybeSingle();

    let finalCreditAccount = creditAccount;

    // If milestone_id column doesn't exist, fall back to old schema
    if (error && error.code === '42703') {
      console.log('🔄 New columns not found, using legacy schema...');
      
      const { data: legacyAccount, error: legacyError } = await supabaseAdmin
        .from('enhanced_credit_accounts')
        .select(`
          id,
          project_id,
          monthly_payment,
          next_payment_date,
          last_payment_date,
          credit_terms,
          credit_status,
          notes,
          created_at,
          updated_at
        `)
        .eq('project_id', projectId)
        .maybeSingle();

      if (legacyError) {
        console.error('❌ Error fetching legacy payment data:', legacyError);
        return NextResponse.json({ error: 'Failed to fetch payment data' }, { status: 500 });
      }

      // Convert legacy data to new format
      if (legacyAccount) {
        finalCreditAccount = {
          ...legacyAccount,
          milestone_id: null,
          payment_amount: legacyAccount.monthly_payment || 0,
          payment_sequence: 1,
          total_payments: 1,
          total_amount: legacyAccount.monthly_payment || 0,
        };
      }
    } else if (error) {
      console.error('❌ Error fetching next payment data:', error);
      return NextResponse.json({ error: 'Failed to fetch next payment data' }, { status: 500 });
    }

    // If we have payment data, also fetch milestone information
    let paymentWithMilestone: Record<string, any> = finalCreditAccount;
    if (finalCreditAccount?.milestone_id) {
      const { data: milestone, error: milestoneError } = await supabaseAdmin
        .from('project_milestones')
        .select('milestone_name, description, phase_category, status, progress_percentage')
        .eq('id', finalCreditAccount.milestone_id)
        .maybeSingle();

      if (!milestoneError && milestone) {
        paymentWithMilestone = {
          ...finalCreditAccount,
          milestone_name: milestone.milestone_name,
          milestone_description: milestone.description,
          milestone_phase_category: milestone.phase_category,
          milestone_status: milestone.status,
          milestone_progress: milestone.progress_percentage,
        };
      }
    }

    // Calculate overdue status
    if (paymentWithMilestone?.next_payment_date) {
      const nextPaymentDate = new Date(paymentWithMilestone.next_payment_date);
      const today = new Date();
      const timeDiff = today.getTime() - nextPaymentDate.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (daysDiff > 0) {
        paymentWithMilestone = {
          ...paymentWithMilestone,
          is_overdue: true,
          days_overdue: daysDiff,
        };
      } else {
        paymentWithMilestone = {
          ...paymentWithMilestone,
          is_overdue: false,
          days_overdue: 0,
        };
      }
    }

    console.log('✅ Next Payment fetched successfully:', paymentWithMilestone);
    return NextResponse.json({
      success: true,
      data: paymentWithMilestone,
    });

  } catch (error) {
    console.error('❌ Error in next payment GET API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// 🔧 POST - Create/Update next payment data
export async function POST(request: NextRequest) {
  try {
    const body: NextPaymentPostBody = await request.json();
    const { action, projectId, paymentData } = body;

    console.log('💰 Next Payment API - POST:', { action, projectId });

    switch (action) {
      case 'create':
        return await createNextPayment(projectId || '', paymentData);
      case 'update':
        return await updateNextPayment(paymentData.id || '', paymentData);
      case 'delete':
        return await deleteNextPayment(paymentData.id || '');
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Error in next payment POST API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Create new next payment entry
async function createNextPayment(projectId: string, paymentData: NextPaymentRequestData) {
  console.log('💰 Creating next payment:', { projectId, paymentData });

  try {
    // Check if credit account already exists for this project
    const { data: existingAccount, error: checkError } = await supabaseAdmin
      .from('enhanced_credit_accounts')
      .select('id')
      .eq('project_id', projectId)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking existing account:', checkError);
      return NextResponse.json({ error: 'Failed to check existing account' }, { status: 500 });
    }

    if (existingAccount) {
      return NextResponse.json({ 
        error: 'Credit account already exists for this project. Use update instead.' 
      }, { status: 400 });
    }

    // Create new enhanced credit account with next payment info
    const { data: creditAccount, error } = await supabaseAdmin
      .from('enhanced_credit_accounts')
      .insert({
        project_id: projectId,
        milestone_id: paymentData.milestone_id || null,
        payment_amount: paymentData.payment_amount || 0,
        payment_sequence: paymentData.payment_sequence || 1,
        total_payments: paymentData.total_payments || 1,
        total_amount: paymentData.total_amount || 0,
        next_payment_date: paymentData.next_payment_date,
        last_payment_date: paymentData.last_payment_date || null,
        credit_terms: paymentData.credit_terms || '30 days net',
        credit_status: paymentData.credit_status || 'active',
        notes: paymentData.notes || null,
        credit_limit: 0,
        used_credit: 0,
        interest_rate: 0,
        monthly_payment: paymentData.payment_amount || 0, // For backward compatibility
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating next payment:', error);
      return NextResponse.json({ error: 'Failed to create next payment' }, { status: 500 });
    }

    console.log('✅ Next payment created:', creditAccount);
    return NextResponse.json({
      success: true,
      data: creditAccount,
      message: 'Next payment created successfully',
    });

  } catch (error) {
    console.error('❌ Error in createNextPayment:', error);
    return NextResponse.json({ 
      error: 'Failed to create next payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Update existing next payment
async function updateNextPayment(accountId: string, paymentData: NextPaymentRequestData) {
  console.log('💰 Updating next payment:', { accountId, paymentData });

  try {
    const { data: creditAccount, error } = await supabaseAdmin
      .from('enhanced_credit_accounts')
      .update({
        milestone_id: paymentData.milestone_id,
        payment_amount: paymentData.payment_amount,
        payment_sequence: paymentData.payment_sequence,
        total_payments: paymentData.total_payments,
        total_amount: paymentData.total_amount,
        next_payment_date: paymentData.next_payment_date,
        last_payment_date: paymentData.last_payment_date,
        credit_terms: paymentData.credit_terms,
        credit_status: paymentData.credit_status,
        notes: paymentData.notes,
        monthly_payment: paymentData.payment_amount, // For backward compatibility
        updated_at: new Date().toISOString(),
      })
      .eq('id', accountId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating next payment:', error);
      return NextResponse.json({ error: 'Failed to update next payment' }, { status: 500 });
    }

    console.log('✅ Next payment updated:', creditAccount);
    return NextResponse.json({
      success: true,
      data: creditAccount,
      message: 'Next payment updated successfully',
    });

  } catch (error) {
    console.error('❌ Error in updateNextPayment:', error);
    return NextResponse.json({ 
      error: 'Failed to update next payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Delete next payment
async function deleteNextPayment(accountId: string) {
  console.log('💰 Deleting next payment:', { accountId });

  try {
    const { error } = await supabaseAdmin
      .from('enhanced_credit_accounts')
      .delete()
      .eq('id', accountId);

    if (error) {
      console.error('❌ Error deleting next payment:', error);
      return NextResponse.json({ error: 'Failed to delete next payment' }, { status: 500 });
    }

    console.log('✅ Next payment deleted successfully');
    return NextResponse.json({
      success: true,
      message: 'Next payment deleted successfully',
    });

  } catch (error) {
    console.error('❌ Error in deleteNextPayment:', error);
    return NextResponse.json({ 
      error: 'Failed to delete next payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
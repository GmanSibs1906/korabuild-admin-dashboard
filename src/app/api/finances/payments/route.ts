import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Types
interface PaymentCreateData {
  project_id: string;
  milestone_id?: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference: string;
  description: string;
  receipt_url?: string;
  payment_category?: string;
  status?: string;
}

interface PaymentUpdateData {
  milestone_id?: string;
  amount?: number;
  payment_date?: string;
  payment_method?: string;
  reference?: string;
  description?: string;
  receipt_url?: string;
  payment_category?: string;
  status?: string;
}

interface PaymentCRUDResponse {
  success: boolean;
  data?: any;
  error?: string;
  details?: string;
}

// Helper function to update ONLY the calculated payments total (not cash_received)
const updatePaymentsTotal = async (projectId: string) => {
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

// GET - Fetch payments with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const milestoneId = searchParams.get('milestone_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = searchParams.get('sort_by') || 'payment_date';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    console.log('💰 Payments API - GET with filters:', {
      projectId, status, category, milestoneId, startDate, endDate, page, limit, sortBy, sortOrder
    });

    // Build query
    let query = supabaseAdmin
      .from('payments')
      .select(`
        id,
        project_id,
        milestone_id,
        amount,
        payment_date,
        payment_method,
        reference,
        description,
        receipt_url,
        status,
        payment_category,
        created_at,
        updated_at,
        projects:project_id (
          id,
          project_name,
          client_id,
          users:client_id (
            id,
            full_name,
            email
          )
        ),
        project_milestones:milestone_id (
          id,
          milestone_name,
          phase_category
        )
      `, { count: 'exact' });

    // Apply filters
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (category) {
      query = query.eq('payment_category', category);
    }
    if (milestoneId) {
      query = query.eq('milestone_id', milestoneId);
    }
    if (startDate) {
      query = query.gte('payment_date', startDate);
    }
    if (endDate) {
      query = query.lte('payment_date', endDate);
    }

    // Apply sorting
    const sortDirection = sortOrder === 'desc' ? false : true;
    query = query.order(sortBy, { ascending: sortDirection });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: payments, error, count } = await query;

    if (error) {
      console.error('❌ Error fetching payments:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch payments',
        details: error.message 
      }, { status: 500 });
    }

    // Calculate summary statistics
    let summary = null;
    if (projectId) {
      const { data: allPayments, error: summaryError } = await supabaseAdmin
        .from('payments')
        .select('amount, status, payment_category')
        .eq('project_id', projectId);

      if (!summaryError && allPayments) {
        const totalAmount = allPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        const completedAmount = allPayments
          .filter(p => p.status === 'completed')
          .reduce((sum, payment) => sum + (payment.amount || 0), 0);
        
        const statusCounts = allPayments.reduce((acc, payment) => {
          acc[payment.status] = (acc[payment.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const categoryCounts = allPayments.reduce((acc, payment) => {
          acc[payment.payment_category] = (acc[payment.payment_category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        summary = {
          total_amount: totalAmount,
          completed_amount: completedAmount,
          payment_count: allPayments.length,
          status_counts: statusCounts,
          category_counts: categoryCounts
        };
      }
    }

    console.log('✅ Payments fetched successfully:', payments?.length || 0);

    return NextResponse.json({
      success: true,
      data: {
        payments: payments || [],
        summary,
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Payments API - GET error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Create new payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const paymentData: PaymentCreateData = body;

    console.log('💰 Payments API - POST create payment:', paymentData);

    // Validate required fields
    if (!paymentData.project_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'project_id is required' 
      }, { status: 400 });
    }

    if (!paymentData.amount || paymentData.amount <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Valid amount is required' 
      }, { status: 400 });
    }

    if (!paymentData.payment_method) {
      return NextResponse.json({ 
        success: false, 
        error: 'payment_method is required' 
      }, { status: 400 });
    }

    if (!paymentData.reference) {
      return NextResponse.json({ 
        success: false, 
        error: 'reference is required' 
      }, { status: 400 });
    }

    if (!paymentData.description) {
      return NextResponse.json({ 
        success: false, 
        error: 'description is required' 
      }, { status: 400 });
    }

    // Verify project exists
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, project_name')
      .eq('id', paymentData.project_id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ 
        success: false, 
        error: 'Project not found' 
      }, { status: 404 });
    }

    // Create payment
    const { data: newPayment, error: createError } = await supabaseAdmin
      .from('payments')
      .insert({
        project_id: paymentData.project_id,
        milestone_id: paymentData.milestone_id || null,
        amount: paymentData.amount,
        payment_date: paymentData.payment_date,
        payment_method: paymentData.payment_method,
        reference: paymentData.reference,
        description: paymentData.description,
        receipt_url: paymentData.receipt_url || null,
        payment_category: paymentData.payment_category || 'other',
        status: paymentData.status || 'pending'
      })
      .select(`
        id,
        project_id,
        milestone_id,
        amount,
        payment_date,
        payment_method,
        reference,
        description,
        receipt_url,
        status,
        payment_category,
        created_at,
        updated_at,
        projects:project_id (
          id,
          project_name,
          client_id,
          users:client_id (
            id,
            full_name,
            email
          )
        ),
        project_milestones:milestone_id (
          id,
          milestone_name,
          phase_category
        )
      `)
      .single();

    if (createError) {
      console.error('❌ Error creating payment:', createError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create payment',
        details: createError.message 
      }, { status: 500 });
    }

    console.log('✅ Payment created successfully:', newPayment.id);

    // 🔧 UPDATE PAYMENTS TOTAL: Only update calculated field, leave cash_received alone
    await updatePaymentsTotal(paymentData.project_id);

    return NextResponse.json({
      success: true,
      data: {
        payment: newPayment,
        message: 'Payment created successfully'
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Payments API - POST error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update payment
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('id');
    const body = await request.json();
    const updateData: PaymentUpdateData = body;

    console.log('💰 Payments API - PUT update payment:', paymentId, updateData);

    if (!paymentId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Payment ID is required' 
      }, { status: 400 });
    }

    // Verify payment exists and get project_id
    const { data: existingPayment, error: fetchError } = await supabaseAdmin
      .from('payments')
      .select('id, project_id')
      .eq('id', paymentId)
      .single();

    if (fetchError || !existingPayment) {
      return NextResponse.json({ 
        success: false, 
        error: 'Payment not found' 
      }, { status: 404 });
    }

    // Update payment
    const { data: updatedPayment, error: updateError } = await supabaseAdmin
      .from('payments')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)
      .select(`
        id,
        project_id,
        milestone_id,
        amount,
        payment_date,
        payment_method,
        reference,
        description,
        receipt_url,
        status,
        payment_category,
        created_at,
        updated_at,
        projects:project_id (
          id,
          project_name,
          client_id,
          users:client_id (
            id,
            full_name,
            email
          )
        ),
        project_milestones:milestone_id (
          id,
          milestone_name,
          phase_category
        )
      `)
      .single();

    if (updateError) {
      console.error('❌ Error updating payment:', updateError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update payment',
        details: updateError.message 
      }, { status: 500 });
    }

    console.log('✅ Payment updated successfully:', updatedPayment.id);

    // 🔧 UPDATE PAYMENTS TOTAL: Only update calculated field, leave cash_received alone
    await updatePaymentsTotal(existingPayment.project_id);

    return NextResponse.json({
      success: true,
      data: {
        payment: updatedPayment,
        message: 'Payment updated successfully'
      }
    });

  } catch (error) {
    console.error('❌ Payments API - PUT error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Delete payment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('id');

    console.log('💰 Payments API - DELETE payment:', paymentId);

    if (!paymentId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Payment ID is required' 
      }, { status: 400 });
    }

    // Verify payment exists and get its data
    const { data: existingPayment, error: fetchError } = await supabaseAdmin
      .from('payments')
      .select(`
        id,
        project_id,
        amount,
        reference,
        description,
        projects:project_id (
          project_name
        )
      `)
      .eq('id', paymentId)
      .single();

    if (fetchError || !existingPayment) {
      return NextResponse.json({ 
        success: false, 
        error: 'Payment not found' 
      }, { status: 404 });
    }

    // Delete payment
    const { error: deleteError } = await supabaseAdmin
      .from('payments')
      .delete()
      .eq('id', paymentId);

    if (deleteError) {
      console.error('❌ Error deleting payment:', deleteError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to delete payment',
        details: deleteError.message 
      }, { status: 500 });
    }

    console.log('✅ Payment deleted successfully:', paymentId);

    // 🔧 UPDATE PAYMENTS TOTAL: Only update calculated field, leave cash_received alone
    await updatePaymentsTotal(existingPayment.project_id);

    return NextResponse.json({
      success: true,
      data: {
        payment_id: paymentId,
        deleted_payment: existingPayment,
        message: 'Payment deleted successfully'
      }
    });

  } catch (error) {
    console.error('❌ Payments API - DELETE error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
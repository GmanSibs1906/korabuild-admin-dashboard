import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// TypeScript interfaces for payment operations
interface PaymentCreateData {
  project_id: string;
  milestone_id?: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference: string;
  description: string;
  receipt_url?: string;
  payment_category?: 'milestone' | 'materials' | 'labor' | 'permits' | 'other';
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
}

interface PaymentUpdateData {
  amount?: number;
  payment_date?: string;
  payment_method?: string;
  reference?: string;
  description?: string;
  receipt_url?: string;
  payment_category?: 'milestone' | 'materials' | 'labor' | 'permits' | 'other';
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
}

interface PaymentFilters {
  project_id?: string;
  milestone_id?: string;
  status?: string;
  payment_category?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// GET - Fetch payments with advanced filtering, search, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters: PaymentFilters = {
      project_id: searchParams.get('project_id') || undefined,
      milestone_id: searchParams.get('milestone_id') || undefined,
      status: searchParams.get('status') || undefined,
      payment_category: searchParams.get('payment_category') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      min_amount: searchParams.get('min_amount') ? parseFloat(searchParams.get('min_amount')!) : undefined,
      max_amount: searchParams.get('max_amount') ? parseFloat(searchParams.get('max_amount')!) : undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
      sort_by: searchParams.get('sort_by') || 'payment_date',
      sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc'
    };

    console.log('💰 Payments API - GET with filters:', filters);

    // Build query with joins for related data
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
      `);

    // Apply filters
    if (filters.project_id) {
      query = query.eq('project_id', filters.project_id);
    }

    if (filters.milestone_id) {
      query = query.eq('milestone_id', filters.milestone_id);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.payment_category) {
      query = query.eq('payment_category', filters.payment_category);
    }

    if (filters.start_date) {
      query = query.gte('payment_date', filters.start_date);
    }

    if (filters.end_date) {
      query = query.lte('payment_date', filters.end_date);
    }

    if (filters.min_amount) {
      query = query.gte('amount', filters.min_amount);
    }

    if (filters.max_amount) {
      query = query.lte('amount', filters.max_amount);
    }

    // Text search across description and reference
    if (filters.search) {
      query = query.or(`description.ilike.%${filters.search}%,reference.ilike.%${filters.search}%`);
    }

    // Apply sorting
    const ascending = filters.sort_order === 'asc';
    query = query.order(filters.sort_by!, { ascending });

    // Get total count for pagination
    const { count: totalCount } = await supabaseAdmin
      .from('payments')
      .select('*', { count: 'exact', head: true });

    // Apply pagination
    const offset = ((filters.page || 1) - 1) * (filters.limit || 50);
    query = query.range(offset, offset + (filters.limit || 50) - 1);

    const { data: payments, error } = await query;

    if (error) {
      console.error('❌ Error fetching payments:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch payments',
        details: error.message 
      }, { status: 500 });
    }

    // Calculate summary statistics
    const totalAmount = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    const statusCounts = payments?.reduce((counts, payment) => {
      counts[payment.status] = (counts[payment.status] || 0) + 1;
      return counts;
    }, {} as Record<string, number>) || {};

    const categoryCounts = payments?.reduce((counts, payment) => {
      const category = payment.payment_category || 'other';
      counts[category] = (counts[category] || 0) + 1;
      return counts;
    }, {} as Record<string, number>) || {};

    console.log(`✅ Payments API - Found ${payments?.length || 0} payments`);

    return NextResponse.json({
      success: true,
      data: {
        payments: payments || [],
        pagination: {
          current_page: filters.page || 1,
          per_page: filters.limit || 50,
          total_count: totalCount || 0,
          total_pages: Math.ceil((totalCount || 0) / (filters.limit || 50))
        },
        summary: {
          total_amount: totalAmount,
          payment_count: payments?.length || 0,
          status_counts: statusCounts,
          category_counts: categoryCounts
        },
        filters: filters
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

    // Verify milestone exists if provided
    if (paymentData.milestone_id) {
      const { data: milestone, error: milestoneError } = await supabaseAdmin
        .from('project_milestones')
        .select('id, milestone_name')
        .eq('id', paymentData.milestone_id)
        .eq('project_id', paymentData.project_id)
        .single();

      if (milestoneError || !milestone) {
        return NextResponse.json({ 
          success: false, 
          error: 'Milestone not found or does not belong to this project' 
        }, { status: 404 });
      }
    }

    // Check for duplicate reference
    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('reference', paymentData.reference)
      .single();

    if (existingPayment) {
      return NextResponse.json({ 
        success: false, 
        error: 'Payment reference already exists' 
      }, { status: 409 });
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

    console.log('💰 Payments API - PUT update payment:', { paymentId, updateData });

    if (!paymentId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Payment ID is required' 
      }, { status: 400 });
    }

    // Verify payment exists
    const { data: existingPayment, error: fetchError } = await supabaseAdmin
      .from('payments')
      .select('id, project_id, reference')
      .eq('id', paymentId)
      .single();

    if (fetchError || !existingPayment) {
      return NextResponse.json({ 
        success: false, 
        error: 'Payment not found' 
      }, { status: 404 });
    }

    // Check for duplicate reference if being updated
    if (updateData.reference && updateData.reference !== existingPayment.reference) {
      const { data: duplicatePayment } = await supabaseAdmin
        .from('payments')
        .select('id')
        .eq('reference', updateData.reference)
        .neq('id', paymentId)
        .single();

      if (duplicatePayment) {
        return NextResponse.json({ 
          success: false, 
          error: 'Payment reference already exists' 
        }, { status: 409 });
      }
    }

    // Validate amount if being updated
    if (updateData.amount !== undefined && updateData.amount <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Amount must be greater than 0' 
      }, { status: 400 });
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
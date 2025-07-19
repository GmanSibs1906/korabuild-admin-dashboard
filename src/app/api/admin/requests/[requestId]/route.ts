import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// GET - Get detailed request information
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    
    console.log('🔍 Admin Request Detail API - GET:', { requestId });

    const supabase = supabaseAdmin;

    // Get request first without joins since foreign keys don't exist
    const { data: requestDetail, error: requestError } = await supabase
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !requestDetail) {
      console.error('❌ Request not found:', requestError?.message);
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Manually fetch related data
    let client = null;
    let project = null;

    // Fetch client data if client_id exists
    if (requestDetail.client_id) {
      const { data: clientData } = await supabase
        .from('users')
        .select('id, full_name, email, phone, profile_photo_url')
        .eq('id', requestDetail.client_id)
        .single();
      client = clientData;
    }

    // Fetch project data if project_id exists
    if (requestDetail.project_id) {
      const { data: projectData } = await supabase
        .from('projects')
        .select(`
          id,
          project_name,
          project_address,
          status,
          current_phase,
          progress_percentage,
          start_date,
          expected_completion,
          contract_value
        `)
        .eq('id', requestDetail.project_id)
        .single();
      project = projectData;
    }

    // TODO: Get request comments (if table exists)
    // TODO: Get request status history (if table exists)
    // For now, we'll return the basic request data

    console.log('✅ Request detail fetched:', { requestId, title: requestDetail.title });

    return NextResponse.json({
      success: true,
      data: {
        request: {
          ...requestDetail,
          client,
          project
        },
        comments: [], // TODO: Implement comments
        statusHistory: [] // TODO: Implement status history
      }
    });

  } catch (error) {
    console.error('❌ Admin Request Detail API - GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch request details' },
      { status: 500 }
    );
  }
}

// PATCH - Update specific request fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    const body = await request.json();
    
    console.log('🔄 Admin Request Detail API - PATCH:', { requestId, updates: Object.keys(body) });

    const supabase = supabaseAdmin;

    // Validate allowed fields
    const allowedFields = [
      'status',
      'priority',
      'admin_response',
      'estimated_cost',
      'response_date'
    ];

    const updates: Record<string, any> = {};
    Object.keys(body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = body[key];
      }
    });

    // Always update the updated_at timestamp
    updates.updated_at = new Date().toISOString();

    // If status is being updated, set response_date
    if (updates.status && !updates.response_date) {
      updates.response_date = new Date().toISOString();
    }

    // Update the request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('requests')
      .update(updates)
      .eq('id', requestId)
      .select('*')
      .single();

    if (updateError) {
      console.error('❌ Failed to update request:', updateError);
      return NextResponse.json(
        { error: 'Failed to update request' },
        { status: 500 }
      );
    }

    // Manually fetch related data
    let client = null;
    let project = null;

    if (updatedRequest.client_id) {
      const { data: clientData } = await supabase
        .from('users')
        .select('id, full_name, email, phone')
        .eq('id', updatedRequest.client_id)
        .single();
      client = clientData;
    }

    if (updatedRequest.project_id) {
      const { data: projectData } = await supabase
        .from('projects')
        .select('id, project_name, project_address, status')
        .eq('id', updatedRequest.project_id)
        .single();
      project = projectData;
    }

    // TODO: Create status history record if status changed
    // TODO: Send notification to client if needed

    console.log('✅ Request updated successfully:', { requestId, updatedFields: Object.keys(updates) });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedRequest,
        client,
        project
      }
    });

  } catch (error) {
    console.error('❌ Admin Request Detail API - PATCH Error:', error);
    return NextResponse.json(
      { error: 'Failed to update request' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { AdminRequest, RequestFilters, RequestStats } from '@/types/requests';

// GET - List requests with filtering, pagination, and analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const projectId = searchParams.get('project_id');
    const clientId = searchParams.get('client_id');
    const assignedTo = searchParams.get('assigned_to');
    const search = searchParams.get('search');
    const includeStats = searchParams.get('include_stats') === 'true';
    
    console.log('🔍 Admin Requests API - GET:', {
      page, limit, status, category, priority, projectId, clientId, search
    });

    const supabase = supabaseAdmin;
    
    // Test basic connectivity first
    try {
      console.log('🔍 Testing database connectivity...');
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (testError) {
        console.error('❌ Database connectivity test failed:', testError);
        return NextResponse.json(
          { error: 'Database connectivity issue', details: testError.message },
          { status: 500 }
        );
      }
      
      console.log('✅ Database connectivity test passed');
    } catch (error) {
      console.error('❌ Database connectivity error:', error);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
    
    const offset = (page - 1) * limit;

    // First, let's check if the requests table exists and has data
    console.log('🔍 Checking requests table...');
    
    // Build base query - get requests first without joins since foreign keys don't exist
    let query = supabase
      .from('requests')
      .select('*', { count: 'exact' });

    // Apply filters only if they exist
    if (status) {
      query = query.eq('status', status);
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (priority) {
      query = query.eq('priority', priority);
    }
    
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    
    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    console.log('🔍 Executing query...');
    const { data: requests, error: requestsError, count } = await query;

    if (requestsError) {
      console.error('❌ Error fetching requests:', requestsError);
      return NextResponse.json(
        { error: 'Failed to fetch requests', details: requestsError.message },
        { status: 500 }
      );
    }

    console.log('✅ Raw requests data:', { 
      count, 
      requestsLength: requests?.length || 0,
      firstRequest: requests?.[0] || 'No requests found'
    });

    // If no requests, return empty data but successful response
    if (!requests || requests.length === 0) {
      console.log('ℹ️ No requests found in database');
      return NextResponse.json({
        success: true,
        data: {
          requests: [],
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          },
          stats: includeStats ? {
            total: 0,
            pending: 0,
            inProgress: 0,
            completed: 0,
            byCategory: {
              change_order: 0,
              inspection: 0,
              consultation: 0,
              maintenance: 0,
              other: 0,
            },
            byPriority: {
              low: 0,
              medium: 0,
              high: 0,
              urgent: 0,
            }
          } : null
        }
      });
    }

    // Manually fetch related data since foreign keys don't exist in schema
    console.log('🔍 Fetching related data...');
    const enhancedRequests = await Promise.all(
      requests.map(async (request) => {
        let client = null;
        let project = null;

        try {
          // Fetch client data if client_id exists
          if (request.client_id) {
            const { data: clientData, error: clientError } = await supabase
              .from('users')
              .select('id, full_name, email, phone')
              .eq('id', request.client_id)
              .single();
            
            if (clientError) {
              console.warn('⚠️ Client not found for request:', request.id, clientError.message);
            } else {
              client = clientData;
            }
          }

          // Fetch project data if project_id exists
          if (request.project_id) {
            const { data: projectData, error: projectError } = await supabase
              .from('projects')
              .select('id, project_name, project_address, status, current_phase, progress_percentage')
              .eq('id', request.project_id)
              .single();
            
            if (projectError) {
              console.warn('⚠️ Project not found for request:', request.id, projectError.message);
            } else {
              project = projectData;
            }
          }
        } catch (error) {
          console.warn('⚠️ Error fetching related data for request:', request.id, error);
        }

        return {
          ...request,
          client,
          project
        };
      })
    );

    // Calculate statistics if requested
    let stats = null;
    if (includeStats) {
      try {
        console.log('📊 Calculating statistics...');
        const { data: allRequests, error: statsError } = await supabase
          .from('requests')
          .select('status, priority, request_type, created_at');

        if (statsError) {
          console.warn('⚠️ Error fetching stats:', statsError.message);
        } else if (allRequests) {
          stats = {
            total: allRequests.length,
            pending: allRequests.filter(r => r.status === 'submitted').length,
            inProgress: allRequests.filter(r => r.status === 'reviewing' || r.status === 'in_progress').length,
            completed: allRequests.filter(r => r.status === 'completed' || r.status === 'approved').length,
            byCategory: {
              change_order: allRequests.filter(r => r.request_type === 'change_order').length,
              inspection: allRequests.filter(r => r.request_type === 'inspection').length,
              consultation: allRequests.filter(r => r.request_type === 'consultation').length,
              maintenance: allRequests.filter(r => r.request_type === 'maintenance').length,
              other: allRequests.filter(r => r.request_type === 'other').length,
            },
            byPriority: {
              low: allRequests.filter(r => r.priority === 'low').length,
              medium: allRequests.filter(r => r.priority === 'medium').length,
              high: allRequests.filter(r => r.priority === 'high').length,
              urgent: allRequests.filter(r => r.priority === 'urgent').length,
            }
          };
        }
      } catch (error) {
        console.warn('⚠️ Error calculating statistics:', error);
      }
    }

    const totalPages = Math.ceil((count || 0) / limit);

    console.log('✅ Requests fetched successfully:', {
      total: count,
      returned: enhancedRequests.length,
      page,
      totalPages
    });

    return NextResponse.json({
      success: true,
      data: {
        requests: enhancedRequests,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        stats
      }
    });

  } catch (error) {
    console.error('❌ Admin Requests API - GET Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch requests',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      },
      { status: 500 }
    );
  }
}

// POST - Update request status, assign admin, add comments
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, requestId, data } = body;

    if (!action || !requestId) {
      return NextResponse.json(
        { error: 'Action and requestId are required' },
        { status: 400 }
      );
    }

    console.log('🔄 Admin Requests API - POST:', { action, requestId, data });

    const supabase = supabaseAdmin;

    switch (action) {
      case 'update_status': {
        const { status, admin_response, change_reason } = data;
        
        if (!status) {
          return NextResponse.json({ error: 'Status is required' }, { status: 400 });
        }

        // Update request status
        const { data: updatedRequest, error: updateError } = await supabase
          .from('requests')
          .update({
            status,
            admin_response,
            response_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', requestId)
          .select('*')
          .single();

        if (updateError) {
          throw updateError;
        }

        // Manually fetch related data
        let client = null;
        let project = null;

        if (updatedRequest.client_id) {
          const { data: clientData } = await supabase
            .from('users')
            .select('id, full_name, email')
            .eq('id', updatedRequest.client_id)
            .single();
          client = clientData;
        }

        if (updatedRequest.project_id) {
          const { data: projectData } = await supabase
            .from('projects')
            .select('id, project_name')
            .eq('id', updatedRequest.project_id)
            .single();
          project = projectData;
        }

        // TODO: Create status history record
        // TODO: Send notification to client

        console.log('✅ Request status updated:', { requestId, status });
        return NextResponse.json({ 
          success: true, 
          data: {
            ...updatedRequest,
            client,
            project
          }
        });
      }

      case 'assign_admin': {
        const { admin_id, notes } = data;
        
        if (!admin_id) {
          return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 });
        }

        const { data: updatedRequest, error: updateError } = await supabase
          .from('requests')
          .update({
            assigned_to: admin_id,
            admin_response: notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', requestId)
          .select('*')
          .single();

        if (updateError) {
          throw updateError;
        }

        console.log('✅ Request assigned to admin:', { requestId, admin_id });
        return NextResponse.json({ success: true, data: updatedRequest });
      }

      case 'add_comment': {
        // TODO: Implement comments system when table exists
        return NextResponse.json({ error: 'Comments system not yet implemented' }, { status: 501 });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ Admin Requests API - POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 
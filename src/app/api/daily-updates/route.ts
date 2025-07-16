import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// GET handler for fetching daily updates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;

    // Fetch daily updates from project_updates table
    const { data: updates, error: updatesError } = await supabase
      .from('project_updates')
      .select(`
        *,
        created_by_user:created_by (
          id,
          full_name,
          email,
          role,
          profile_photo_url
        ),
        milestone:milestone_id (
          id,
          milestone_name,
          phase_category,
          status,
          progress_percentage
        ),
        project:project_id (
          id,
          project_name,
          client_id
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (updatesError) {
      console.error('Error fetching daily updates:', updatesError);
      return NextResponse.json(
        { error: 'Failed to fetch daily updates' },
        { status: 500 }
      );
    }

    // Format updates for response
    const formattedUpdates = (updates || []).map((update: any) => ({
      id: update.id,
      project_id: update.project_id,
      milestone_id: update.milestone_id,
      update_type: update.update_type,
      title: update.title,
      description: update.description,
      photo_urls: update.photo_urls || [],
      photo_ids: update.photo_ids || [],
      update_priority: update.update_priority || 'normal',
      visibility: update.visibility || 'project',
      is_pinned: update.is_pinned || false,
      location: update.location,
      metadata: update.metadata || {},
      created_by: update.created_by,
      created_at: update.created_at,
      
      // Expanded relations
      author: {
        id: update.created_by_user?.id,
        full_name: update.created_by_user?.full_name || 'System User',
        email: update.created_by_user?.email,
        role: update.created_by_user?.role || 'admin',
        profile_photo_url: update.created_by_user?.profile_photo_url
      },
      milestone: update.milestone ? {
        id: update.milestone.id,
        milestone_name: update.milestone.milestone_name,
        phase_category: update.milestone.phase_category,
        status: update.milestone.status,
        progress_percentage: update.milestone.progress_percentage
      } : null,
      project: {
        id: update.project?.id,
        project_name: update.project?.project_name,
        client_id: update.project?.client_id
      }
    }));

    console.log(`✅ Fetched ${formattedUpdates.length} daily updates for project ${projectId}`);

    return NextResponse.json({
      success: true,
      data: formattedUpdates,
      pagination: {
        limit,
        offset,
        total: formattedUpdates.length,
        hasMore: formattedUpdates.length === limit
      }
    });

  } catch (error) {
    console.error('Error in GET /api/daily-updates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST handler for creating manual daily updates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;

    switch (action) {
      case 'create': {
        if (!data) {
          return NextResponse.json(
            { error: 'Data is required for create action' },
            { status: 400 }
          );
        }

        // Validate required fields
        if (!data.project_id || !data.title || !data.description || !data.update_type) {
          return NextResponse.json(
            { error: 'Missing required fields: project_id, title, description, update_type' },
            { status: 400 }
          );
        }

        // Get current user from request headers or request data
        let adminUserId;
        
        // First check if created_by is provided in the request data
        if (data.created_by) {
          adminUserId = data.created_by;
          console.log('✅ Using provided created_by user ID:', adminUserId);
        } else {
          // Try to get admin user email from request headers
          const userEmail = request.headers.get('x-user-email');
          const userId = request.headers.get('x-user-id');
          
          if (userId) {
            // Verify the user exists and is admin
            const { data: currentUser } = await supabase
              .from('users')
              .select('id, role')
              .eq('id', userId)
              .single();
              
            if (currentUser && currentUser.role === 'admin') {
              adminUserId = currentUser.id;
              console.log('✅ Using authenticated admin user:', userId);
            }
          } else if (userEmail) {
            // Get user by email from headers
            const { data: currentUser } = await supabase
              .from('users')
              .select('id, role')
              .eq('email', userEmail)
              .single();
              
            if (currentUser && currentUser.role === 'admin') {
              adminUserId = currentUser.id;
              console.log('✅ Found admin user by email:', userEmail);
            }
          }
          
          // Fallback: get any existing admin user
          if (!adminUserId) {
            const { data: existingAdmins } = await supabase
              .from('users')
              .select('id, email, full_name')
              .eq('role', 'admin')
              .limit(1);

            if (existingAdmins && existingAdmins.length > 0) {
              adminUserId = existingAdmins[0].id;
              console.log('✅ Using fallback admin user:', existingAdmins[0].email, 'ID:', adminUserId);
            } else {
              return NextResponse.json(
                { error: 'No admin user found. Please ensure an admin user exists in the system.' },
                { status: 400 }
              );
            }
          }
        }

        // Validate update_type
        const validUpdateTypes = [
          'milestone', 'payment', 'delivery', 'photo', 'note', 
          'approval', 'weather', 'delay', 'completion'
        ];
        if (!validUpdateTypes.includes(data.update_type)) {
          return NextResponse.json(
            { error: `Invalid update_type. Must be one of: ${validUpdateTypes.join(', ')}` },
            { status: 400 }
          );
        }

        // Validate update_priority
        const validPriorities = ['low', 'normal', 'high', 'urgent'];
        if (data.update_priority && !validPriorities.includes(data.update_priority)) {
          return NextResponse.json(
            { error: `Invalid update_priority. Must be one of: ${validPriorities.join(', ')}` },
            { status: 400 }
          );
        }

        // Validate visibility
        const validVisibilities = ['public', 'project', 'milestone', 'private'];
        if (data.visibility && !validVisibilities.includes(data.visibility)) {
          return NextResponse.json(
            { error: `Invalid visibility. Must be one of: ${validVisibilities.join(', ')}` },
            { status: 400 }
          );
        }

        // Prepare update data
        const updateData = {
          project_id: data.project_id,
          milestone_id: data.milestone_id || null,
          update_type: data.update_type,
          title: data.title.trim(),
          description: data.description.trim(),
          photo_urls: data.photo_urls || [],
          photo_ids: data.photo_ids || [],
          update_priority: data.update_priority || 'normal',
          visibility: data.visibility || 'project',
          is_pinned: data.is_pinned || false,
          location: data.location || null,
          metadata: {
            source: 'admin_manual',
            created_via: 'admin_dashboard',
            timestamp: new Date().toISOString(),
            ...data.metadata
          },
          created_by: adminUserId
        };

        // Get project info to show user relationship
        const { data: projectInfo } = await supabase
          .from('projects')
          .select(`
            id,
            project_name,
            client_id,
            client:users!projects_client_id_fkey(
              id,
              email,
              full_name,
              role
            )
          `)
          .eq('id', data.project_id)
          .single();

        console.log('📝 Creating manual daily update with user context:', {
          projectId: data.project_id,
          projectName: projectInfo?.project_name,
          projectOwner: (projectInfo?.client as any)?.full_name,
          projectOwnerEmail: (projectInfo?.client as any)?.email,
          updateTitle: data.title,
          createdByAdmin: adminUserId
        });

        console.log('📝 Creating manual daily update with data:', {
          ...updateData,
          created_by: `${adminUserId} (${typeof adminUserId})`
        });

        // Insert the update
        const { data: newUpdate, error: insertError } = await supabase
          .from('project_updates')
          .insert(updateData)
          .select(`
            *,
            created_by_user:created_by (
              id,
              full_name,
              email,
              role,
              profile_photo_url
            ),
            milestone:milestone_id (
              id,
              milestone_name,
              phase_category,
              status,
              progress_percentage
            ),
            project:project_id (
              id,
              project_name,
              client_id
            )
          `)
          .single();

        if (insertError) {
          console.error('Error creating daily update:', insertError);
          console.error('Error details:', {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint
          });
          return NextResponse.json(
            { 
              error: 'Failed to create daily update',
              details: insertError.message,
              code: insertError.code
            },
            { status: 500 }
          );
        }

        // Format response
        const formattedUpdate = {
          id: newUpdate.id,
          project_id: newUpdate.project_id,
          milestone_id: newUpdate.milestone_id,
          update_type: newUpdate.update_type,
          title: newUpdate.title,
          description: newUpdate.description,
          photo_urls: newUpdate.photo_urls || [],
          photo_ids: newUpdate.photo_ids || [],
          update_priority: newUpdate.update_priority,
          visibility: newUpdate.visibility,
          is_pinned: newUpdate.is_pinned,
          location: newUpdate.location,
          metadata: newUpdate.metadata,
          created_by: newUpdate.created_by,
          created_at: newUpdate.created_at,
          
          author: {
            id: newUpdate.created_by_user?.id,
            full_name: newUpdate.created_by_user?.full_name || 'KoraBuild Admin',
            email: newUpdate.created_by_user?.email,
            role: newUpdate.created_by_user?.role || 'admin',
            profile_photo_url: newUpdate.created_by_user?.profile_photo_url
          },
          milestone: newUpdate.milestone ? {
            id: newUpdate.milestone.id,
            milestone_name: newUpdate.milestone.milestone_name,
            phase_category: newUpdate.milestone.phase_category,
            status: newUpdate.milestone.status,
            progress_percentage: newUpdate.milestone.progress_percentage
          } : null,
          project: {
            id: newUpdate.project?.id,
            project_name: newUpdate.project?.project_name,
            client_id: newUpdate.project?.client_id
          }
        };

        console.log('✅ Manual daily update created successfully:', formattedUpdate.id);

        return NextResponse.json({
          success: true,
          data: formattedUpdate,
          message: 'Daily update created successfully'
        });
      }

      case 'update': {
        const { updateId, ...updateData } = data;

        if (!updateId) {
          return NextResponse.json(
            { error: 'updateId is required for update action' },
            { status: 400 }
          );
        }

        const { data: updatedUpdate, error: updateError } = await supabase
          .from('project_updates')
          .update({
            ...updateData,
            updated_at: new Date().toISOString()
          })
          .eq('id', updateId)
          .select(`
            *,
            created_by_user:created_by (
              id,
              full_name,
              email,
              role,
              profile_photo_url
            ),
            milestone:milestone_id (
              id,
              milestone_name,
              phase_category,
              status
            )
          `)
          .single();

        if (updateError) {
          console.error('Error updating daily update:', updateError);
          return NextResponse.json(
            { error: 'Failed to update daily update' },
            { status: 500 }
          );
        }

        console.log('✅ Daily update updated successfully:', updateId);

        return NextResponse.json({
          success: true,
          data: updatedUpdate,
          message: 'Daily update updated successfully'
        });
      }

      case 'delete': {
        const { updateId } = data;

        if (!updateId) {
          return NextResponse.json(
            { error: 'updateId is required for delete action' },
            { status: 400 }
          );
        }

        const { error: deleteError } = await supabase
          .from('project_updates')
          .delete()
          .eq('id', updateId);

        if (deleteError) {
          console.error('Error deleting daily update:', deleteError);
          return NextResponse.json(
            { error: 'Failed to delete daily update' },
            { status: 500 }
          );
        }

        console.log('✅ Daily update deleted successfully:', updateId);

        return NextResponse.json({
          success: true,
          message: 'Daily update deleted successfully'
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in POST /api/daily-updates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
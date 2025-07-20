import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const { confirmationText } = body;
    
    console.log(`🗑️ Admin API: Starting deletion of user ${userId} and all related data...`);
    
    // Require admin to type "DELETE" for confirmation
    if (confirmationText !== 'DELETE') {
      return NextResponse.json(
        { error: 'Confirmation text must be "DELETE" to proceed with user deletion' },
        { status: 400 }
      );
    }
    
    // Get user info for logging
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('full_name, email, role')
      .eq('id', userId)
      .single();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log(`🗑️ Deleting user: ${user.full_name} (${user.email})`);
    
    // STEP 1: Delete all user projects and their data
    const { data: userProjects } = await supabaseAdmin
      .from('projects')
      .select('id, project_name')
      .eq('client_id', userId);
    
    if (userProjects && userProjects.length > 0) {
      console.log(`🏗️ Found ${userProjects.length} projects to delete for user`);
      
      for (const project of userProjects) {
        try {
          // Use the existing project deletion endpoint logic
          console.log(`🗑️ Deleting project: ${project.project_name} (${project.id})`);
          
          // Delete using internal API call
          const projectDeleteResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/projects/${project.id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (!projectDeleteResponse.ok) {
            console.error(`❌ Failed to delete project ${project.project_name}`);
          } else {
            console.log(`✅ Successfully deleted project: ${project.project_name}`);
          }
        } catch (error) {
          console.error(`❌ Error deleting project ${project.project_name}:`, error);
        }
      }
    }
    
    // STEP 2: Delete user from tables that might still reference them
    const tablesToClean = [
      // Core tables with direct user references
      'contractors', // added_by_user_id constraint
      'training_certifications', // user_id
      'user_push_tokens', // user_id
      
      // Communication and requests
      'conversations', // created_by
      'messages', // sender_id
      'communication_log', 
      'requests', // client_id, assigned_to_user_id
      'request_comments', // user_id
      'request_status_history', // changed_by
      
      // Financial records
      'payments',
      'credit_accounts',
      'enhanced_credit_accounts', // client_id, created_by
      'financial_budgets', // created_by
      
      // Quality and safety
      'quality_inspections', // inspector_id
      'quality_reports', // generated_by
      'safety_incidents', // reported_by_user_id, investigator_user_id
      'safety_inspections', // inspector_user_id, corrective_actions_assigned_to
      'safety_training_records', // trainee_user_id, trainer_user_id
      
      // Documents and uploads
      'documents', // uploaded_by, approved_by
      'project_photos',
      'photo_comments', // user_id
      'photo_albums', // created_by
      
      // Orders and deliveries  
      'project_orders', // ordered_by, approved_by
      'deliveries',
      'inventory_transactions', // performed_by
      
      // Work and schedules
      'work_sessions', // created_by, verified_by
      'daily_updates',
      'project_updates',
      
      // Admin and approvals
      'approval_requests', // requested_by, assigned_to
      'approval_responses', // responder_id
      'meeting_records', // meeting_organizer
      'compliance_documents'
    ];
    
    for (const table of tablesToClean) {
      try {
        // Try different column names that might reference the user
        const possibleColumns = [
          'user_id', 
          'client_id', 
          'created_by', 
          'uploaded_by', 
          'approved_by',
          'reported_by_user_id',
          'inspector_id',
          'investigator_user_id',
          'assigned_to_user_id',
          'generated_by',
          'ordered_by',
          'added_by_user_id', // contractors table
          'sender_id', // messages table
          'requested_by', // approval_requests
          'assigned_to', // approval_requests
          'responder_id', // approval_responses
          'meeting_organizer', // meeting_records
          'changed_by', // request_status_history
          'inspector_user_id', // safety_inspections
          'corrective_actions_assigned_to', // safety_inspections
          'trainee_user_id', // safety_training_records
          'trainer_user_id', // safety_training_records
          'performed_by', // inventory_transactions
          'verified_by' // work_sessions
        ];
        
        for (const column of possibleColumns) {
          const { error } = await supabaseAdmin
            .from(table)
            .delete()
            .eq(column, userId);
          
          // Ignore errors for columns that don't exist
          if (!error || !error.message.includes('column')) {
            console.log(`✅ Cleaned ${table}.${column} for user ${userId}`);
          }
        }
      } catch (error) {
        console.log(`⚠️ Could not clean table ${table}:`, error);
        // Continue with other tables
      }
    }
    
    // STEP 3: Delete user from auth.users (Supabase Auth)
    try {
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (authDeleteError) {
        console.error('❌ Error deleting user from auth:', authDeleteError);
        // Continue anyway as user might not exist in auth
      } else {
        console.log('✅ Successfully deleted user from Supabase Auth');
      }
    } catch (error) {
      console.error('❌ Error deleting user from auth:', error);
      // Continue with public.users deletion
    }
    
    // STEP 4: Delete user from public.users table
    const { error: publicUserError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (publicUserError) {
      console.error('❌ Error deleting user from public.users:', publicUserError);
      return NextResponse.json(
        { 
          error: 'Failed to delete user from database', 
          details: publicUserError.message 
        },
        { status: 500 }
      );
    }
    
    console.log(`✅ Successfully deleted user ${user.full_name} (${user.email}) and all related data`);
    
    return NextResponse.json({ 
      success: true, 
      message: `User ${user.full_name} and all related data deleted successfully`,
      deletedUser: {
        id: userId,
        name: user.full_name,
        email: user.email,
        role: user.role
      },
      deletedProjects: userProjects?.length || 0
    });
    
  } catch (error) {
    console.error('❌ Admin API: Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    console.log(`🔍 Admin API: Fetching user ${userId} details...`);
    
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('❌ Admin API: Error fetching user:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user', details: error.message },
        { status: 500 }
      );
    }
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log(`✅ Admin API: Successfully fetched user ${userId}`);
    
    return NextResponse.json({ user });
    
  } catch (error) {
    console.error('❌ Admin API: Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
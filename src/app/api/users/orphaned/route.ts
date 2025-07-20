import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('🔍 Admin API: Identifying orphaned user data...');
    
    // Step 1: Get all authenticated user IDs
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Orphaned API: Error fetching auth users:', authError);
      return NextResponse.json(
        { error: 'Failed to fetch authenticated users', details: authError.message },
        { status: 500 }
      );
    }

    const authenticatedUserIds = authUsers.users.map(user => user.id);
    console.log(`📧 Found ${authenticatedUserIds.length} authenticated users`);

    // Step 2: Get all users from public.users table
    const { data: allUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role, created_at');

    if (usersError) {
      console.error('❌ Orphaned API: Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users', details: usersError.message },
        { status: 500 }
      );
    }

    console.log(`👤 Found ${allUsers?.length || 0} users in public.users table`);

    // Step 3: Find users who don't have auth entries (orphaned data)
    const orphanedUsers = allUsers?.filter(user => !authenticatedUserIds.includes(user.id)) || [];
    
    // Step 4: Get detailed information about each orphaned user
    const orphanedDetails = await Promise.all(
      orphanedUsers.map(async (user) => {
        // Check for related data
        const [projects, payments, documents, messages] = await Promise.all([
          supabaseAdmin.from('projects').select('id, project_name').eq('client_id', user.id),
          supabaseAdmin.from('payments').select('id, amount').in('project_id', []),
          supabaseAdmin.from('documents').select('id, document_name').in('project_id', []),
          supabaseAdmin.from('messages').select('id').eq('sender_id', user.id)
        ]);

        return {
          user: user,
          relatedData: {
            projects: projects.data?.length || 0,
            payments: payments.data?.length || 0,
            documents: documents.data?.length || 0,
            messages: messages.data?.length || 0
          }
        };
      })
    );

    if (orphanedUsers.length === 0) {
      console.log('✅ Orphaned API: No orphaned users found');
      return NextResponse.json({
        message: 'No orphaned users found',
        orphanedUsers: [],
        count: 0,
        status: 'clean'
      });
    }

    console.log(`🗑️ Found ${orphanedUsers.length} orphaned users:`, orphanedUsers.map(u => u.email));
    
    return NextResponse.json({
      message: `Found ${orphanedUsers.length} orphaned users that exist in public.users but not in auth.users`,
      orphanedUsers: orphanedDetails,
      count: orphanedUsers.length,
      status: 'needs_cleanup',
      cleanupAvailable: true,
      cleanupEndpoint: '/api/users/cleanup'
    });
    
  } catch (error: any) {
    console.error('❌ Orphaned API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 
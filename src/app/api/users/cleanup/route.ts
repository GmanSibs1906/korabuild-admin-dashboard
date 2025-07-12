import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST() {
  try {
    console.log('🧹 Admin API: Starting cleanup of sample users...');
    
    // Step 1: Get all authenticated user IDs
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Cleanup API: Error fetching auth users:', authError);
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
      .select('id, email, full_name');

    if (usersError) {
      console.error('❌ Cleanup API: Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users', details: usersError.message },
        { status: 500 }
      );
    }

    console.log(`👤 Found ${allUsers?.length || 0} users in public.users table`);

    // Step 3: Find users who don't have auth entries (sample data)
    const sampleUsers = allUsers?.filter(user => !authenticatedUserIds.includes(user.id)) || [];
    
    if (sampleUsers.length === 0) {
      console.log('✅ Cleanup API: No sample users to remove');
      return NextResponse.json({
        message: 'No sample users found to clean up',
        removedUsers: [],
        count: 0
      });
    }

    console.log(`🗑️ Found ${sampleUsers.length} sample users to remove:`, sampleUsers.map(u => u.email));

    // Step 4: Remove sample users
    const sampleUserIds = sampleUsers.map(user => user.id);
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .in('id', sampleUserIds);

    if (deleteError) {
      console.error('❌ Cleanup API: Error deleting sample users:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete sample users', details: deleteError.message },
        { status: 500 }
      );
    }

    console.log('✅ Cleanup API: Successfully removed sample users');
    
    return NextResponse.json({
      message: `Successfully removed ${sampleUsers.length} sample users`,
      removedUsers: sampleUsers.map(u => ({ id: u.id, email: u.email, name: u.full_name })),
      count: sampleUsers.length
    });
  } catch (error: any) {
    console.error('❌ Cleanup API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 
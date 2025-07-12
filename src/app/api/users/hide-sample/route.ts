import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST() {
  try {
    console.log('👻 Admin API: Hiding sample users...');
    
    // Get authenticated user IDs
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    const authenticatedUserIds = authUsers.users.map(user => user.id);
    
    // Find sample users (those without auth entries)
    const { data: allUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name')
      .not('id', 'in', `(${authenticatedUserIds.map(id => `'${id}'`).join(',')})`);

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    if (!allUsers || allUsers.length === 0) {
      return NextResponse.json({
        message: 'No sample users found to hide',
        hiddenUsers: [],
        count: 0
      });
    }

    // Add a status column to track hidden users (you can run this SQL manually if needed)
    // ALTER TABLE users ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
    
    // Hide sample users by updating their status or a flag
    const sampleUserIds = allUsers.map(user => user.id);
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ role: 'inactive_sample' }) // Mark as sample data
      .in('id', sampleUserIds);

    if (updateError) {
      console.log('Note: Could not mark sample users as inactive. This is expected if using read-only view.');
      return NextResponse.json({
        message: 'Sample users identified but not modified (read-only mode)',
        sampleUsers: allUsers.map(u => ({ id: u.id, email: u.email, name: u.full_name })),
        count: allUsers.length,
        note: 'Users API already filters to authenticated users only'
      });
    }

    console.log('✅ Hidden sample users successfully');
    
    return NextResponse.json({
      message: `Successfully hid ${allUsers.length} sample users`,
      hiddenUsers: allUsers.map(u => ({ id: u.id, email: u.email, name: u.full_name })),
      count: allUsers.length
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 
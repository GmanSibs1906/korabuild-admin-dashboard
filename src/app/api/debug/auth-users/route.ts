import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('🔍 Debug API: Fetching all Supabase Auth users...');
    
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Debug API: Error fetching auth users:', authError);
      return NextResponse.json(
        { error: 'Failed to fetch auth users', details: authError.message },
        { status: 500 }
      );
    }

    console.log(`📧 Found ${authUsers.users.length} auth users`);
    
    // Get public.users data for comparison
    const { data: publicUsers, error: publicError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role');

    const publicUserEmails = publicUsers?.map(u => u.email.toLowerCase()) || [];
    
    const authUserDetails = authUsers.users.map(user => ({
      id: user.id,
      email: user.email,
      email_confirmed_at: user.email_confirmed_at,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      has_public_profile: publicUserEmails.includes(user.email?.toLowerCase() || ''),
      user_metadata: user.user_metadata,
      app_metadata: user.app_metadata
    }));

    return NextResponse.json({
      message: `Found ${authUsers.users.length} users in Supabase Auth`,
      authUsers: authUserDetails,
      publicUsers: publicUsers || [],
      comparison: {
        authCount: authUsers.users.length,
        publicCount: publicUsers?.length || 0,
        orphanedInAuth: authUserDetails.filter(u => !u.has_public_profile).length,
        orphanedInPublic: publicUsers?.filter(p => !authUsers.users.some(a => a.email?.toLowerCase() === p.email.toLowerCase())).length || 0
      }
    });
    
  } catch (error: any) {
    console.error('❌ Debug API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;

    // First, try to get an admin user (prioritize oldest/real users over test users)
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('id, email, full_name, role, profile_photo_url')
      .eq('role', 'admin')
      .order('created_at', { ascending: true }) // Get oldest admin user first (real user)
      .limit(1);

    if (adminUsers && adminUsers.length > 0) {
      const adminUser = adminUsers[0];
      console.log('✅ Admin user found:', adminUser.email, 'ID:', adminUser.id);
      return NextResponse.json({
        success: true,
        user: adminUser
      });
    }

    // If no admin users, check for any user that could act as admin
    // (In development, we might want to promote existing users)
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name, role, profile_photo_url')
      .order('created_at', { ascending: true })
      .limit(1);

    if (allUsers && allUsers.length > 0) {
      const user = allUsers[0];
      console.log('✅ Using first available user as admin:', user.email, 'ID:', user.id);
      
      // Temporarily promote this user to admin for development
      const { data: promotedUser, error: promoteError } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', user.id)
        .select('id, email, full_name, role, profile_photo_url')
        .single();

      if (promotedUser) {
        console.log('✅ User promoted to admin:', promotedUser.email);
        return NextResponse.json({
          success: true,
          user: promotedUser
        });
      }
    }

    // No users found at all
    console.error('❌ No users found in database');
    return NextResponse.json({
      success: false,
      user: null,
      message: 'No users found in database'
    });

  } catch (error) {
    console.error('Error in GET /api/auth/current-user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
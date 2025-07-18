import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('🔍 Admin API: Fetching all authenticated users...');
    
    // Step 1: Get all authenticated users from auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Admin API: Error fetching auth users:', authError);
      return NextResponse.json(
        { error: 'Failed to fetch authenticated users', details: authError.message },
        { status: 500 }
      );
    }

    if (authUsers.users.length === 0) {
      console.log('✅ Admin API: No authenticated users found');
      return NextResponse.json({
        users: [],
        count: 0
      });
    }

    console.log(`📧 Found ${authUsers.users.length} authenticated users`);

    // Step 2: Get existing profiles from public.users
    const authUserIds = authUsers.users.map(user => user.id);
    const { data: existingProfiles, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .in('id', authUserIds);

    if (profileError) {
      console.error('❌ Admin API: Error fetching user profiles:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user profiles', details: profileError.message },
        { status: 500 }
      );
    }

    // Step 3: Create profiles for auth users who don't have them
    const existingProfileIds = new Set(existingProfiles?.map(p => p.id) || []);
    const usersNeedingProfiles = authUsers.users.filter(user => !existingProfileIds.has(user.id));

    if (usersNeedingProfiles.length > 0) {
      console.log(`👤 Creating profiles for ${usersNeedingProfiles.length} users...`);
      
      const newProfiles = usersNeedingProfiles.map(user => ({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        phone: user.user_metadata?.phone || user.phone || null,
        role: 'client', // Default role
        profile_photo_url: user.user_metadata?.profile_photo_url || null,
        created_at: user.created_at,
        updated_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert(newProfiles);

      if (insertError) {
        console.error('❌ Admin API: Error creating profiles:', insertError);
        // Continue anyway - show existing profiles
      } else {
        console.log('✅ Admin API: Created profiles for new users');
      }
    }

    // Step 4: Fetch all profiles again (including newly created ones)
    const { data: allUsers, error: finalError } = await supabaseAdmin
      .from('users')
      .select('*')
      .in('id', authUserIds)
      .order('created_at', { ascending: false });

    if (finalError) {
      console.error('❌ Admin API: Error fetching final user list:', finalError);
      return NextResponse.json(
        { error: 'Failed to fetch users', details: finalError.message },
        { status: 500 }
      );
    }

    console.log('✅ Admin API: Successfully fetched all authenticated users:', allUsers?.length || 0);
    
    return NextResponse.json({
      users: allUsers || [],
      count: allUsers?.length || 0
    });
  } catch (error: any) {
    console.error('❌ Admin API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...updateData } = body;

    console.log('👤 Admin API: Updating user:', userId, 'with data:', updateData);

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!updateData.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if email is already taken by another user
    if (updateData.email) {
      const { data: existingUser, error: emailError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', updateData.email)
        .neq('id', userId)
        .single();

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email is already taken by another user' },
          { status: 409 }
        );
      }
    }

    // Update user in database
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        full_name: updateData.full_name,
        email: updateData.email,
        phone: updateData.phone,
        role: updateData.role,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('*')
      .single();

    if (updateError) {
      console.error('❌ Admin API: Error updating user:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('✅ Admin API: User updated successfully:', updatedUser.id);

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('❌ Admin API: Error in PUT /api/users:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
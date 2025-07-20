import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, email, phone, role, temporary_password } = body;
    
    console.log('👤 Admin API: Creating new user without OTP:', { email, full_name, role });
    
    // Validate required fields
    if (!email || !full_name) {
      return NextResponse.json(
        { error: 'Email and full name are required' },
        { status: 400 }
      );
    }
    
    // Check if email is already taken
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single();
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email is already taken by another user' },
        { status: 409 }
      );
    }
    
    // Check if email exists in auth.users
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = authUsers.users.some(user => user.email?.toLowerCase() === email.toLowerCase());
    
    if (emailExists) {
      return NextResponse.json(
        { error: 'Email is already registered in the authentication system' },
        { status: 409 }
      );
    }
    
    // Create user in Supabase Auth with admin privileges
    // Using auto-confirm to bypass email verification for admin-created users
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: temporary_password || generateTemporaryPassword(),
      email_confirm: false, // User will need to verify email later
      user_metadata: {
        full_name: full_name,
        phone: phone || null,
        created_by_admin: true,
        requires_password_reset: true
      }
    });
    
    if (authError) {
      console.error('❌ Admin API: Error creating auth user:', authError);
      return NextResponse.json(
        { error: 'Failed to create user account', details: authError.message },
        { status: 500 }
      );
    }
    
    if (!authUser.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }
    
    // Create user profile in public.users table
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        email: email.toLowerCase(),
        full_name: full_name,
        phone: phone || null,
        role: role || 'client',
        profile_photo_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single();
    
    if (profileError) {
      console.error('❌ Admin API: Error creating user profile:', profileError);
      
      // Clean up auth user if profile creation failed
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        console.log('🧹 Cleaned up auth user after profile creation failure');
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup auth user:', cleanupError);
      }
      
      return NextResponse.json(
        { error: 'Failed to create user profile', details: profileError.message },
        { status: 500 }
      );
    }
    
    // Send email verification link (optional, user can do this later)
    try {
      await supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email: email.toLowerCase(),
        password: temporary_password || generateTemporaryPassword(),
      });
      console.log('📧 Email verification link generated for user');
    } catch (emailError) {
      console.log('⚠️ Could not send verification email, user can verify later');
    }
    
    console.log('✅ Admin API: User created successfully:', userProfile.id);
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully. User will need to verify email and set password.',
      user: userProfile,
      instructions: {
        next_steps: [
          'User will receive an email verification link',
          'User needs to verify their email address',
          'User will be prompted to set a new password',
          'User can then access their account normally'
        ],
        admin_note: 'The user account is created but requires email verification to be fully activated.'
      }
    });
    
  } catch (error) {
    console.error('❌ Admin API: Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Generate a temporary password for the user
function generateTemporaryPassword(): string {
  // Generate a random 12-character password
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
} 
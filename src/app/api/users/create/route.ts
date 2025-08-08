import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, email, phone, role, temporary_password } = body;
    
    console.log('👤 Admin API: Creating new user without OTP:', { email, full_name, role });
    
    // Validate required fields
    if (!full_name || !email || !role) {
      return NextResponse.json(
        { error: 'Full name, email, and role are required' },
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
    
    // Create user account in Supabase Auth  
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: temporary_password || generateTemporaryPassword(),
      user_metadata: {
        full_name: full_name,
        phone: phone || null,
        created_by_admin: true,
        requires_password_reset: true
      },
      email_confirm: false  // Auto-confirm email for admin-created users
    });
    
    if (authError) {
      console.error('❌ Admin API: Error creating auth user:', authError);
      throw authError;
    }

    console.log('✅ Admin API: Auth user created successfully:', authUser.user?.id);

    // Insert user into public.users table
    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user!.id,
        email: email,
        full_name: full_name,
        phone: phone || null,
        role: role || 'client',
        profile_photo_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single();
    
    if (userError) {
      console.error('❌ Admin API: Error creating user profile:', userError);
      
      // Clean up auth user if profile creation failed
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        console.log('🧹 Cleaned up auth user after profile creation failure');
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup auth user:', cleanupError);
      }
      
      return NextResponse.json(
        { error: 'Failed to create user profile', details: userError.message },
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
    
    console.log('✅ Admin API: User created successfully:', userRecord.id);
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully. User will need to verify email and set password.',
      user: userRecord,
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
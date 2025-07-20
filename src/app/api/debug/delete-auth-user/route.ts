import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, confirm } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    if (confirm !== 'DELETE_AUTH_USER') {
      return NextResponse.json(
        { error: 'Confirmation required. Send {"email": "user@email.com", "confirm": "DELETE_AUTH_USER"} to proceed.' },
        { status: 400 }
      );
    }
    
    console.log('🗑️ Debug API: Deleting auth user with email:', email);
    
    // Find the user by email
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      return NextResponse.json(
        { error: 'Failed to fetch auth users', details: listError.message },
        { status: 500 }
      );
    }

    const userToDelete = authUsers.users.find(user => user.email?.toLowerCase() === email.toLowerCase());

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'User not found in Supabase Auth' },
        { status: 404 }
      );
    }

    console.log('🔍 Found user to delete:', userToDelete.id, userToDelete.email);

    // Delete from Supabase Auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userToDelete.id);

    if (deleteError) {
      console.error('❌ Error deleting auth user:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete user from auth', details: deleteError.message },
        { status: 500 }
      );
    }

    // Also try to delete from public.users if exists
    try {
      await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userToDelete.id);
      console.log('🧹 Also cleaned up public.users entry if it existed');
    } catch (error) {
      console.log('ℹ️ No public.users entry to clean up');
    }

    console.log('✅ Successfully deleted auth user');
    
    return NextResponse.json({
      message: `Successfully deleted user ${email} from Supabase Auth`,
      deletedUser: {
        id: userToDelete.id,
        email: userToDelete.email,
        created_at: userToDelete.created_at
      }
    });
    
  } catch (error: any) {
    console.error('❌ Debug API: Error deleting auth user:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [Debug] Checking notifications and user status...');

    // Get all notifications (recent ones)
    const { data: allNotifications, error: notificationsError } = await supabaseAdmin
      .from('notifications')
      .select(`
        id,
        user_id,
        notification_type,
        title,
        message,
        is_read,
        created_at,
        users!notifications_user_id_fkey(
          id,
          email,
          full_name,
          role
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get all admin users
    const { data: adminUsers, error: adminError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role')
      .eq('role', 'admin');

    // Get recent messages to check notification creation
    const { data: recentMessages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select(`
        id,
        message_text,
        sender_id,
        conversation_id,
        created_at,
        users!messages_sender_id_fkey(
          id,
          full_name,
          role
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        notifications: {
          count: allNotifications?.length || 0,
          recent: allNotifications || [],
          error: notificationsError
        },
        adminUsers: {
          count: adminUsers?.length || 0,
          users: adminUsers || [],
          error: adminError
        },
        recentMessages: {
          count: recentMessages?.length || 0,
          messages: recentMessages || [],
          error: messagesError
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ [Debug] Error:', error);
    return NextResponse.json(
      { error: 'Failed to debug notifications', details: error },
      { status: 500 }
    );
  }
} 
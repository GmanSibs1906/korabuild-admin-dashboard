import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get a sample message notification
    const { data: notifications, error: notificationError } = await supabase
      .from('notifications')
      .select('*')
      .eq('notification_type', 'message')
      .limit(1);

    if (notificationError) {
      return NextResponse.json({
        success: false,
        error: notificationError.message
      });
    }

    if (!notifications || notifications.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No message notifications found'
      });
    }

    const notification = notifications[0];
    const conversationId = notification.conversation_id;

    if (!conversationId) {
      return NextResponse.json({
        success: false,
        error: 'Notification has no conversation_id'
      });
    }

    // Get conversation details
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (conversationError) {
      return NextResponse.json({
        success: false,
        error: conversationError.message
      });
    }

    // Get messages in this conversation to check read status
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, read_by, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (messagesError) {
      return NextResponse.json({
        success: false,
        error: messagesError.message
      });
    }

    return NextResponse.json({
      success: true,
      testData: {
        notification: {
          id: notification.id,
          title: notification.title,
          is_read: notification.is_read,
          conversation_id: conversationId
        },
        conversation: {
          id: conversation.id,
          conversation_name: conversation.conversation_name
        },
        messages: messages?.map(msg => ({
          id: msg.id,
          read_by: msg.read_by,
          created_at: msg.created_at
        })) || [],
        testUrl: `/communications?conversation=${conversationId}`,
        instructions: [
          '1. Click "View Message" on a notification',
          '2. Check that the conversation opens in communications',
          '3. Verify that unread count resets for that conversation',
          '4. Check that notification is marked as read'
        ]
      }
    });

  } catch (error) {
    console.error('Test sync error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
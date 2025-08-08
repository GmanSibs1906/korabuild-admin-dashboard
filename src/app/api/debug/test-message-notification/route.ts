import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [Test Message] Creating direct test notification...');

    // Use a known conversation ID from your system
    const testConversationId = 'b98aa067-e406-4030-83e6-00c773dd7115';
    const testProjectId = null; // Set to null to avoid foreign key issues

    // Get all admin users
    const { data: adminUsers, error: adminError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, role')
      .eq('role', 'admin');

    if (adminError) {
      console.error('❌ Error fetching admin users:', adminError);
      return NextResponse.json({ error: 'Failed to fetch admin users', details: adminError }, { status: 500 });
    }

    if (!adminUsers || adminUsers.length === 0) {
      return NextResponse.json({ error: 'No admin users found' }, { status: 404 });
    }

    console.log(`👥 Found ${adminUsers.length} admin users:`, adminUsers.map(u => ({ id: u.id, name: u.full_name, email: u.email })));

    // Create a simple test message first
    const testMessage = {
      conversation_id: testConversationId,
      sender_id: '35e45d18-1745-4ab0-a4c2-f85f970f6af8', // Known user ID
      message_text: `🧪 REAL-TIME TEST: This is a test message to verify notifications work. Sent at ${new Date().toLocaleString()}`,
      message_type: 'text',
      created_at: new Date().toISOString()
    };

    console.log('📝 Creating test message...');
    const { data: messageResult, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert(testMessage)
      .select()
      .single();

    if (messageError) {
      console.error('❌ Error creating test message:', messageError);
      return NextResponse.json({ error: 'Failed to create test message', details: messageError }, { status: 500 });
    }

    console.log('✅ Test message created with ID:', messageResult.id);

    // Create notifications for each admin user
    const notifications = adminUsers.map(admin => ({
      user_id: admin.id,
      project_id: testProjectId,
      notification_type: 'message',
      title: `🧪 TEST: New message from Eric Tom`,
      message: testMessage.message_text.length > 100 
        ? testMessage.message_text.substring(0, 100) + '...' 
        : testMessage.message_text,
      entity_id: messageResult.id,
      entity_type: 'message',
      priority_level: 'normal',
      is_read: false,
      action_url: `/communications?conversation=${testConversationId}`,
      conversation_id: testConversationId,
      metadata: {
        message_id: messageResult.id,
        sender_id: '35e45d18-1745-4ab0-a4c2-f85f970f6af8',
        sender_name: 'Eric Tom',
        conversation_id: testConversationId,
        conversation_name: 'Mobile Test Conversation',
                 project_id: testProjectId,
         project_name: null,
        message_type: 'text',
        source: 'realtime_test',
        test: true
      },
      priority: 'normal',
      is_pushed: false,
      is_sent: false,
      created_at: new Date().toISOString()
    }));

    console.log(`📝 Creating ${notifications.length} notifications for admins...`);

    const { data: notificationResult, error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert(notifications)
      .select();

    if (notificationError) {
      console.error('❌ Error creating notifications:', notificationError);
      return NextResponse.json({ 
        error: 'Failed to create notifications', 
        details: notificationError 
      }, { status: 500 });
    }

    console.log('✅ Notifications created successfully:', notificationResult?.length);

    // Also update the conversation's last message
    const { error: convUpdateError } = await supabaseAdmin
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message: testMessage.message_text
      })
      .eq('id', testConversationId);

    if (convUpdateError) {
      console.error('⚠️ Error updating conversation:', convUpdateError);
    } else {
      console.log('✅ Conversation updated with new last message');
    }

    return NextResponse.json({
      success: true,
      message: 'Test message and notifications created successfully - check control center!',
      data: {
        message: {
          id: messageResult.id,
          text: testMessage.message_text,
          sender: 'Eric Tom',
          conversation_id: testConversationId
        },
        notifications: {
          created: notificationResult?.length || 0,
          admin_users: adminUsers.length,
          details: notificationResult?.map(n => ({ id: n.id, user_id: n.user_id, title: n.title }))
        },
        instructions: 'Check the browser console and control center for real-time notifications!'
      }
    });

  } catch (error) {
    console.error('❌ [Test Message] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create test message and notification', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
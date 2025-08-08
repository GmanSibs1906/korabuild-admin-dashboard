import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [Mobile Message Test] Testing different mobile message scenarios...');

    const testConversationId = 'b98aa067-e406-4030-83e6-00c773dd7115';
    const testUserId = '35e45d18-1745-4ab0-a4c2-f85f970f6af8'; // Eric Tom
    const testProjectId = null; // Will determine from conversation

    // Test 1: Try the mobile-control/communication endpoint (like your mobile app)
    console.log('🧪 Test 1: Testing mobile-control/communication endpoint...');
    
    try {
      const mobileResponse = await fetch('http://localhost:3000/api/mobile-control/communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'test-project', // Will be used to find/create conversation
          updateType: 'send_message',
          data: {
            conversationId: testConversationId,
            message: `🧪 MOBILE TEST 1: Via mobile-control endpoint at ${new Date().toLocaleString()}`,
            type: 'text',
            userId: testUserId
          }
        })
      });
      
      const mobileResult = await mobileResponse.json();
      console.log('📱 Mobile-control endpoint result:', mobileResult);
    } catch (error) {
      console.error('❌ Mobile-control endpoint error:', error);
    }

    // Test 2: Try the communications/messages endpoint
    console.log('🧪 Test 2: Testing communications/messages endpoint...');
    
    try {
      const messagesResponse = await fetch('http://localhost:3000/api/communications/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          conversationId: testConversationId,
          content: `🧪 MOBILE TEST 2: Via messages endpoint at ${new Date().toLocaleString()}`,
          messageType: 'text'
        })
      });
      
      const messagesResult = await messagesResponse.json();
      console.log('💬 Messages endpoint result:', messagesResult);
    } catch (error) {
      console.error('❌ Messages endpoint error:', error);
    }

    // Test 3: Try the communications endpoint
    console.log('🧪 Test 3: Testing communications endpoint...');
    
    try {
      const commResponse = await fetch('http://localhost:3000/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          data: {
            conversation_id: testConversationId,
            sender_id: testUserId,
            message_text: `🧪 MOBILE TEST 3: Via communications endpoint at ${new Date().toLocaleString()}`,
            message_type: 'text'
          }
        })
      });
      
      const commResult = await commResponse.json();
      console.log('💭 Communications endpoint result:', commResult);
    } catch (error) {
      console.error('❌ Communications endpoint error:', error);
    }

    // Test 4: Direct database insertion with notification (like our working test)
    console.log('🧪 Test 4: Direct database insertion with notifications...');
    
    // Insert message directly
    const testMessage = {
      conversation_id: testConversationId,
      sender_id: testUserId,
      message_text: `🧪 MOBILE TEST 4: Direct insertion with notifications at ${new Date().toLocaleString()}`,
      message_type: 'text',
      created_at: new Date().toISOString()
    };

    const { data: messageResult, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert(testMessage)
      .select()
      .single();

    if (messageError) {
      console.error('❌ Error creating direct message:', messageError);
    } else {
      console.log('✅ Direct message created:', messageResult.id);

      // Create notifications
      const { data: adminUsers, error: adminError } = await supabaseAdmin
        .from('users')
        .select('id, full_name')
        .eq('role', 'admin');

      if (!adminError && adminUsers && adminUsers.length > 0) {
        const notifications = adminUsers.map(admin => ({
          user_id: admin.id,
          project_id: null,
          notification_type: 'message',
          title: `🧪 MOBILE TEST 4: Direct insertion from Eric Tom`,
          message: testMessage.message_text,
          entity_id: messageResult.id,
          entity_type: 'message',
          priority_level: 'normal',
          is_read: false,
          action_url: `/communications?conversation=${testConversationId}`,
          conversation_id: testConversationId,
          metadata: {
            message_id: messageResult.id,
            sender_id: testUserId,
            sender_name: 'Eric Tom',
            conversation_id: testConversationId,
            source: 'direct_test_with_notifications',
            test: true
          },
          priority: 'normal',
          is_pushed: false,
          is_sent: false
        }));

        const { data: notificationResult, error: notificationError } = await supabaseAdmin
          .from('notifications')
          .insert(notifications);

                if (notificationError) {
          console.error('❌ Error creating notifications:', notificationError);
        } else {
          console.log('✅ Created notifications successfully');
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Mobile message tests completed - check browser console and control center!',
      data: {
        instructions: [
          '1. Check browser console for real-time notification logs',
          '2. Check control center for new notifications',
          '3. Check communications tab for new messages',
          '4. Test 4 (direct insertion) should definitely trigger notifications'
        ],
        test_conversation_id: testConversationId,
        test_user_id: testUserId
      }
    });

  } catch (error) {
    console.error('❌ [Mobile Message Test] Error:', error);
    return NextResponse.json(
      { error: 'Failed to run mobile message tests', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// Helper function to create notifications for admin users
async function createNotificationsForMessage({
  messageId,
  conversationId,
  senderId,
  messageText,
  messageType
}: {
  messageId: string;
  conversationId: string;
  senderId: string;
  messageText: string;
  messageType: string;
}) {
  try {
    console.log('🔔 [Direct Insert] Creating notifications for admin users...');
    
    const supabase = supabaseAdmin;
    
    // Get sender information
    const { data: senderInfo, error: senderError } = await supabase
      .from('users')
      .select('id, full_name, role')
      .eq('id', senderId)
      .single();

    if (senderError) {
      console.error('❌ [Direct Insert] Error fetching sender info:', senderError);
      return;
    }

    // Only create notifications if sender is not an admin
    if (senderInfo && senderInfo.role !== 'admin') {
      // Get conversation information
      const { data: conversationInfo, error: conversationInfoError } = await supabase
        .from('conversations')
        .select('conversation_name, project_id, project:projects(project_name)')
        .eq('id', conversationId)
        .single();

      if (conversationInfoError) {
        console.error('❌ [Direct Insert] Error fetching conversation info:', conversationInfoError);
      }

      // Get all admin users
      const { data: adminUsers, error: adminError } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('role', 'admin');

      if (adminError) {
        console.error('❌ [Direct Insert] Error fetching admin users:', adminError);
      } else if (adminUsers && adminUsers.length > 0) {
        // Create notifications for each admin user
        const notifications = adminUsers.map(admin => ({
          user_id: admin.id,
          project_id: conversationInfo?.project_id || null,
          notification_type: 'message' as const,
          title: (conversationInfo?.project as any)?.project_name 
            ? `New message in ${(conversationInfo?.project as any).project_name} - ${conversationInfo?.conversation_name || 'General'}`
            : `New message from ${senderInfo.full_name || 'Mobile User'}`,
          message: messageText.length > 100 
            ? messageText.substring(0, 100) + '...' 
            : messageText,
          entity_id: messageId,
          entity_type: 'message',
          priority_level: 'normal' as const,
          is_read: false,
          action_url: `/communications?conversation=${conversationId}`,
          conversation_id: conversationId,
          metadata: {
            message_id: messageId,
            sender_id: senderId,
            sender_name: senderInfo.full_name || 'Mobile User',
            conversation_id: conversationId,
            conversation_name: conversationInfo?.conversation_name || 'General',
            project_id: conversationInfo?.project_id,
            project_name: (conversationInfo?.project as any)?.project_name,
            message_type: messageType,
            source: 'mobile_app_via_direct_insert'
          },
          priority: 'normal' as const,
          is_pushed: false,
          is_sent: false
        }));

        console.log(`📝 [Direct Insert] Creating ${notifications.length} notifications for admin users...`);

        const { data: notificationResult, error: notificationError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notificationError) {
          console.error('❌ [Direct Insert] Error creating notifications:', notificationError);
        } else {
          console.log(`✅ [Direct Insert] Created notifications for ${adminUsers.length} admin users`);
        }
      }
    }
  } catch (error) {
    console.error('❌ [Direct Insert] Error in notification creation:', error);
  }
}

/**
 * Direct message insert API - bypasses all triggers and constraints
 * This is a workaround for the conversation_name ambiguity trigger issue
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, senderId, content, messageType = 'text' } = body;

    if (!conversationId || !senderId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: conversationId, senderId, content' },
        { status: 400 }
      );
    }

    console.log('🔧 [Direct Insert] Starting direct message insert bypass...');
    console.log('📱 [Direct Insert] *** MOBILE APP MIGHT BE USING THIS ENDPOINT ***');
    
    const supabase = supabaseAdmin;
    
    // Method 1: Use raw SQL with explicit parameter binding
    console.log('💾 [Direct Insert] Attempting raw SQL insert...');
    
    const messageId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    // Use direct SQL query to bypass all triggers
    const { data: result, error: sqlError } = await supabase
      .rpc('exec_raw_sql', {
        query: `
          INSERT INTO public.messages (
            id, 
            conversation_id, 
            sender_id, 
            message_text, 
            message_type,
            attachment_urls,
            reply_to_id,
            is_edited,
            is_pinned,
            read_by,
            reactions,
            metadata,
            created_at,
            updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
          ) RETURNING *;
        `,
        parameters: [
          messageId,
          conversationId,
          senderId,
          content,
          messageType,
          '[]',  // attachment_urls
          null,  // reply_to_id
          false, // is_edited
          false, // is_pinned
          '{}',  // read_by
          '{}',  // reactions
          JSON.stringify({
            source: 'direct_insert_api',
            timestamp: now,
            bypass_trigger: true
          }),
          now,   // created_at
          now    // updated_at
        ]
      });

    if (sqlError) {
      console.error('❌ [Direct Insert] Raw SQL failed:', sqlError);
      
      // Fallback: Try using pg_temp schema to avoid triggers
      const { data: tempResult, error: tempError } = await supabase
        .rpc('create_temp_message', {
          p_id: messageId,
          p_conversation_id: conversationId,
          p_sender_id: senderId,
          p_message_text: content,
          p_message_type: messageType
        });

      if (tempError) {
        console.error('❌ [Direct Insert] Temp table approach failed:', tempError);
        
        // Last resort: Insert into communication_log and create message record manually
        const { data: logResult, error: logError } = await supabase
          .from('communication_log')
          .insert({
            project_id: null, // We'll update this later
            communication_type: 'message',
            subject: 'Direct Admin Message',
            content: content,
            from_person: 'Admin',
            to_person: 'Conversation Participants',
            communication_date: now,
            priority: 'medium',
            status: 'sent',
            created_by: senderId,
            metadata: {
              conversation_id: conversationId,
              message_type: messageType,
              bypass_method: 'communication_log'
            }
          })
          .select()
          .single();

        if (logError) {
          console.error('❌ [Direct Insert] Communication log insert failed:', logError);
          return NextResponse.json(
            { error: 'All insert methods failed', details: logError.message },
            { status: 500 }
          );
        }

        // Create a message-like response from the log entry
        const messageFromLog = {
          id: logResult.id,
          conversation_id: conversationId,
          sender_id: senderId,
          message_text: content,
          message_type: messageType,
          attachment_urls: [],
          reply_to_id: null,
          is_edited: false,
          is_pinned: false,
          read_by: {},
          reactions: {},
          metadata: {
            source: 'communication_log',
            original_log_id: logResult.id,
            bypass_trigger: true
          },
          created_at: logResult.created_at,
          updated_at: logResult.created_at
        };

        console.log('✅ [Direct Insert] Message saved via communication_log:', messageFromLog.id);
        
        // Create notifications for this message too
        await createNotificationsForMessage({
          messageId: messageFromLog.id,
          conversationId: conversationId,
          senderId: senderId,
          messageText: content,
          messageType: messageType
        });
        
        return NextResponse.json({
          success: true,
          message: messageFromLog,
          method: 'communication_log',
          note: 'Message saved to communication_log due to trigger restrictions'
        });
      }

      console.log('✅ [Direct Insert] Temp table insert successful');
      
      // Create notifications for this message too
      await createNotificationsForMessage({
        messageId: tempResult.id,
        conversationId: conversationId,
        senderId: senderId,
        messageText: content,
        messageType: messageType
      });
      
      return NextResponse.json({
        success: true,
        message: tempResult,
        method: 'temp_table'
      });
    }

    console.log('✅ [Direct Insert] Raw SQL insert successful');
    
    // 🚨 FIX: Create notifications for admin users when message is sent from mobile app
    await createNotificationsForMessage({
      messageId: messageId,
      conversationId: conversationId,
      senderId: senderId,
      messageText: content,
      messageType: messageType
    });
    
    return NextResponse.json({
      success: true,
      message: result[0],
      method: 'raw_sql'
    });

  } catch (error) {
    console.error('💥 [Direct Insert] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET method to test if the endpoint is working
export async function GET() {
  return NextResponse.json({
    status: 'Direct message insert API is running',
    purpose: 'Bypasses database triggers for message insertion',
    usage: 'POST with conversationId, senderId, content, messageType'
  });
} 
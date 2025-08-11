import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  console.log('🔍 [Messages API] GET request started');
  
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    
    console.log('📋 [Messages API] GET params:', { conversationId });

    if (!conversationId) {
      console.log('❌ [Messages API] Missing conversationId');
      return NextResponse.json({
        success: false,
        error: 'Conversation ID is required'
      });
    }

    console.log('🔍 [Messages API] Fetching messages with explicit column selection...');
    
    // Fetch from messages table (original messages)
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        message_text,
        message_type,
        attachment_urls,
        reply_to_id,
        is_edited,
        edited_at,
        is_pinned,
        read_by,
        reactions,
        metadata,
        created_at,
        updated_at,
        sender:sender_id (
          id,
          full_name,
          role,
          profile_photo_url
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('❌ [Messages API] Messages query error:', messagesError);
      return NextResponse.json({
        success: false,
        error: messagesError.message
      });
    }

    console.log('✅ [Messages API] Successfully fetched messages:', messages?.length || 0);

    console.log('🔍 [Messages API] Fetching communication log messages...');

    // Fetch from communication_log table (new admin messages)
    const { data: logMessages, error: logError } = await supabaseAdmin
      .from('communication_log')
      .select(`
        id,
        project_id,
        communication_type,
        subject,
        content,
        from_person,
        to_person,
        cc_persons,
        communication_date,
        priority,
        response_required,
        response_due_date,
        response_received,
        response_date,
        related_contract_id,
        related_assignment_id,
        attachments,
        follow_up_required,
        follow_up_date,
        status,
        created_by,
        created_at,
        updated_at,
        sender:created_by (
          id,
          full_name,
          role,
          profile_photo_url
        )
      `)
      .eq('project_id', conversationId)
      .order('communication_date', { ascending: true });

    if (logError) {
      console.error('❌ [Messages API] Communication log query error:', logError);
      return NextResponse.json({
        success: false,
        error: logError.message
      });
    }

    console.log('✅ [Messages API] Successfully fetched log messages:', logMessages?.length || 0);

    // Transform communication_log entries to match message format
    const transformedLogMessages = (logMessages || []).map(log => ({
      id: log.id,
      conversation_id: conversationId,
      sender_id: log.created_by,
      message_text: log.content || '',
        message_type: 'text',
      attachment_urls: log.attachments || [],
      reply_to_id: null,
        is_edited: false,
        edited_at: null,
      is_pinned: false,
      read_by: {},
        reactions: {},
        metadata: {
        source: 'communication_log',
        subject: log.subject,
        priority: log.priority,
        communication_type: log.communication_type
      },
      created_at: log.communication_date,
      updated_at: log.updated_at,
      sender: (log as any).sender
    }));

    // Combine and sort all messages
    const allMessages = [...(messages || []), ...transformedLogMessages]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    console.log('✅ [Messages API] Combined messages total:', allMessages.length);

    return NextResponse.json({
      success: true,
      data: allMessages
    });

  } catch (error) {
    console.error('❌ [Messages API] GET error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function POST(request: NextRequest) {
  console.log('🔍 [Messages API] POST request started');
  console.log('📱 [Messages API] *** MOBILE APP MIGHT BE USING THIS ENDPOINT ***');
  
  try {
    const body = await request.json();
    console.log('📋 [Messages API] Request body:', body);

    const { 
      action,
      conversationId,
      content, 
      messageType = 'text',
      senderId,
      recipientId,
      sendToUser
    } = body;

    console.log('📤 [Messages API] Processing action:', action);

    if (action === 'send_direct_message') {
      console.log('💬 [Messages API] Processing direct message...');
      
      // Get current admin user
      console.log('🔍 [Messages API] Fetching admin user...');
      const { data: adminUsers, error: adminError } = await supabaseAdmin
          .from('users')
        .select('id, full_name, email, role')
          .eq('role', 'admin')
        .limit(1);

      if (adminError || !adminUsers || adminUsers.length === 0) {
        console.error('❌ [Messages API] Admin user error:', adminError);
        return NextResponse.json({
          success: false,
          error: 'Admin user not found'
        });
      }

      const adminUser = adminUsers[0];
      console.log('✅ [Messages API] Admin user found:', adminUser.full_name);

      // Determine recipient ID
      let targetRecipientId = recipientId || sendToUser;
      if (!targetRecipientId) {
        console.error('❌ [Messages API] No recipient specified');
        return NextResponse.json({
          success: false,
          error: 'Recipient ID is required'
        });
      }

      console.log('👤 [Messages API] Target recipient:', targetRecipientId);

      let conversationIdToUse = conversationId;
      
      if (!conversationIdToUse) {
        console.log('🔍 [Messages API] Checking for existing conversation...');
        
        // Check if conversation already exists between admin and recipient
        console.log('🔍 [Messages API] Executing conversation lookup query...');
        const { data: existingConversation, error: conversationError } = await supabaseAdmin
          .from('conversations')
          .select(`
            id,
            project_id,
            conversation_name,
            conversation_type,
            description,
            is_private,
            participants,
            created_by,
            last_message_at,
            message_count,
            is_archived,
            priority_level,
            metadata,
            created_at,
            updated_at
          `)
          .contains('participants', [adminUser.id])
          .contains('participants', [targetRecipientId])
          .eq('conversation_type', 'client_contractor')
          .limit(1);

        if (conversationError) {
          console.error('❌ [Messages API] Conversation lookup error:', conversationError);
          return NextResponse.json({
            success: false,
            error: `Conversation lookup failed: ${conversationError.message}`
          });
        }

        if (existingConversation && existingConversation.length > 0) {
          conversationIdToUse = existingConversation[0].id;
          console.log('✅ [Messages API] Using existing conversation:', conversationIdToUse);
        } else {
          console.log('🆕 [Messages API] Creating new conversation...');
          
          // Get recipient details for conversation name
          console.log('🔍 [Messages API] Fetching recipient details...');
          const { data: recipientUser, error: recipientError } = await supabaseAdmin
              .from('users')
            .select('full_name, email')
            .eq('id', targetRecipientId)
              .single();

          if (recipientError) {
            console.error('❌ [Messages API] Recipient lookup error:', recipientError);
            return NextResponse.json({
              success: false,
              error: 'Recipient not found'
            });
          }

          console.log('✅ [Messages API] Recipient found:', recipientUser.full_name);

          // Create new conversation
          console.log('🔍 [Messages API] Creating conversation with explicit fields...');
          const { data: newConversation, error: createError } = await supabaseAdmin
            .from('conversations')
            .insert({
              conversation_name: `Direct message with ${recipientUser.full_name}`,
              conversation_type: 'client_contractor',
              description: 'Direct message conversation',
              is_private: false,
              participants: [adminUser.id, targetRecipientId],
              created_by: adminUser.id,
              last_message_at: new Date().toISOString(),
              message_count: 0,
              is_archived: false,
              priority_level: 'normal',
              metadata: {
                type: 'direct_message',
                created_by_admin: true
              }
            })
            .select('id')
            .single();

          if (createError) {
            console.error('❌ [Messages API] Conversation creation error:', createError);
            return NextResponse.json({
              success: false,
              error: `Failed to create conversation: ${createError.message}`
            });
          }

          conversationIdToUse = newConversation.id;
          console.log('✅ [Messages API] New conversation created:', conversationIdToUse);
        }
      }

      console.log('💾 [Messages API] Inserting message...');
      
      // Send the message
      console.log('🔍 [Messages API] Executing message insert query...');
      const { data: message, error: messageError } = await supabaseAdmin
            .from('messages')
        .insert({
          conversation_id: conversationIdToUse,
          sender_id: adminUser.id,
          message_text: content,
          message_type: messageType || 'text',
          created_at: new Date().toISOString()
        })
        .select(`
          id,
          conversation_id,
          sender_id,
          message_text,
          message_type,
          attachment_urls,
          reply_to_id,
          is_edited,
          edited_at,
          is_pinned,
          read_by,
          reactions,
          metadata,
          created_at,
          updated_at,
          sender:sender_id (
            id,
            full_name,
            email,
            role
          )
        `)
        .single();

      if (messageError) {
        console.error('❌ [Messages API] Message insert error:', {
          code: messageError.code,
          message: messageError.message,
          details: messageError.details,
          hint: messageError.hint
        });
        return NextResponse.json({
          success: false,
          error: `Failed to send message: ${messageError.message}`,
          details: messageError
        });
      }

      console.log('✅ [Messages API] Message sent successfully:', message.id);

      // Update conversation last_message_at
      console.log('🔄 [Messages API] Updating conversation timestamp...');
      const { error: updateError } = await supabaseAdmin
        .from('conversations')
            .update({
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversationIdToUse);

      if (updateError) {
        console.warn('⚠️ [Messages API] Conversation update warning:', updateError);
        // Don't fail the request for this
      }

      console.log('✅ [Messages API] Direct message process completed successfully');

      return NextResponse.json({
        success: true,
        data: {
          message,
          conversationId: conversationIdToUse
        }
      });
    }

    // Handle other message actions...
    console.log('❌ [Messages API] Unknown action:', action);
    return NextResponse.json({
      success: false,
      error: `Unknown action: ${action}`
    });

  } catch (error) {
    console.error('❌ [Messages API] POST error:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

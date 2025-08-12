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

    // Transform messages to match frontend interface expectations
    const transformedMessages = allMessages.map(msg => ({
      id: msg.id,
      content: msg.message_text || (msg as any).content || '',
      sender_id: msg.sender_id,
      sender_name: msg.sender?.full_name || 'Unknown User',
      sender_role: msg.sender?.role || 'user',
      sent_at: msg.created_at,
      is_read: Array.isArray(msg.read_by) ? msg.read_by.length > 0 : false,
      message_type: msg.message_type || 'text',
      attachments: msg.attachment_urls && msg.attachment_urls.length > 0 
        ? msg.attachment_urls.map((url: string, index: number) => ({
            id: `${msg.id}-attachment-${index}`,
            filename: url.split('/').pop() || 'attachment',
            file_type: 'unknown',
            file_size: 0,
            file_url: url
          }))
        : []
    }));

    return NextResponse.json({
      success: true,
      messages: transformedMessages,
      conversation: null // Add this for compatibility
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

    if (action === 'mark_conversation_read') {
      console.log('📖 [Messages API] Processing mark conversation as read...');
      
      if (!conversationId) {
        console.error('❌ [Messages API] Missing conversationId for mark_conversation_read');
        return NextResponse.json({
          success: false,
          error: 'Conversation ID is required for marking as read'
        });
      }

      console.log('🔍 [Messages API] Marking conversation as read:', conversationId);

      try {
        // Get all admin user IDs to mark messages as read for all admins
        const { data: adminUsers, error: adminError } = await supabaseAdmin
              .from('users')
          .select('id')
          .eq('role', 'admin');

            if (adminError) {
          console.error('❌ [Messages API] Error fetching admin users:', adminError);
          return NextResponse.json({
            success: false,
            error: `Failed to fetch admin users: ${adminError.message}`
          });
        }

        const adminIds = adminUsers?.map(admin => admin.id) || [];
        console.log('👥 [Messages API] Found admin users:', adminIds.length);

        // Mark all messages in the conversation as read by ALL admin users
        const { data: updatedMessages, error: markReadError } = await supabaseAdmin
          .from('messages')
          .update({
            read_by: adminIds.reduce((acc, adminId) => ({ ...acc, [adminId]: true }), {}),
            updated_at: new Date().toISOString()
          })
          .eq('conversation_id', conversationId)
          .select('id, conversation_id, read_by');

        if (markReadError) {
          console.error('❌ [Messages API] Error marking messages as read:', markReadError);
          return NextResponse.json({
            success: false,
            error: `Failed to mark messages as read: ${markReadError.message}`
          });
        }

        console.log('✅ [Messages API] Successfully marked messages as read for all admins:', updatedMessages?.length || 0);

        // Also mark all notifications related to this conversation as read for all admins
        console.log('📢 [Messages API] Marking related notifications as read for conversation:', conversationId);
        
        const { data: updatedNotifications, error: notificationError } = await supabaseAdmin
          .from('notifications')
          .update({
            is_read: true,
            read_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('conversation_id', conversationId)
          .in('user_id', adminIds)
          .select('id, conversation_id, is_read');

        if (notificationError) {
          console.warn('⚠️ [Messages API] Warning marking notifications as read:', notificationError);
          // Don't fail the request for this, it's not critical
        } else {
          console.log('✅ [Messages API] Successfully marked notifications as read:', updatedNotifications?.length || 0);
        }

        // Also update the conversation's metadata to track read status
        const { error: conversationUpdateError } = await supabaseAdmin
          .from('conversations')
          .update({
            metadata: {
              last_read_at: new Date().toISOString(),
              last_read_by: senderId || 'admin'
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', conversationId);

        if (conversationUpdateError) {
          console.warn('⚠️ [Messages API] Warning updating conversation read status:', conversationUpdateError);
          // Don't fail the request for this
        }

        console.log('✅ [Messages API] Conversation marked as read successfully');

        return NextResponse.json({
          success: true,
          data: {
            conversationId,
            markedAsRead: true,
            messagesUpdated: updatedMessages?.length || 0,
            notificationsUpdated: updatedNotifications?.length || 0
          }
        });

      } catch (error) {
        console.error('❌ [Messages API] Error in mark_conversation_read:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to mark conversation as read'
        });
      }
    }

    if (action === 'send_message') {
      console.log('💬 [Messages API] Processing send message...');
      
      if (!conversationId || !content) {
        console.error('❌ [Messages API] Missing required fields for send_message');
        return NextResponse.json({
          success: false,
          error: 'Conversation ID and content are required'
        });
      }

      console.log('📝 [Messages API] Sending message to conversation:', conversationId);

      try {
        // Get current admin user for the sender
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

        // Insert the message
        const { data: message, error: messageError } = await supabaseAdmin
              .from('messages')
              .insert({
                conversation_id: conversationId,
                sender_id: adminUser.id,
                message_text: content,
                message_type: messageType || 'text',
                attachment_urls: [],
                reply_to_id: null,
                is_edited: false,
            edited_at: null,
                is_pinned: false,
            read_by: [adminUser.id],
                reactions: {},
                metadata: {
                  source: 'admin_dashboard',
              sent_via: 'admin_chat_interface'
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
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
            updated_at
          `)
              .single();

            if (messageError) {
          console.error('❌ [Messages API] Message insert error:', messageError);
          return NextResponse.json({
            success: false,
            error: `Failed to send message: ${messageError.message}`
          });
        }

        console.log('✅ [Messages API] Message sent successfully:', message.id);

        // Update conversation last_message_at
        const { error: updateError } = await supabaseAdmin
          .from('conversations')
            .update({
            last_message_at: new Date().toISOString()
          })
          .eq('id', conversationId);

        if (updateError) {
          console.warn('⚠️ [Messages API] Conversation update warning:', updateError);
          // Don't fail the request for this
        }

        // Transform message to frontend format
        const transformedMessage = {
          id: message.id,
          content: message.message_text,
          sender_id: message.sender_id,
          sender_name: adminUser.full_name,
          sender_role: adminUser.role,
          sent_at: message.created_at,
          is_read: true,
          message_type: message.message_type,
          attachments: []
        };

        console.log('✅ [Messages API] Send message process completed successfully');

        return NextResponse.json({
          success: true,
          message: transformedMessage
        });

      } catch (error) {
        console.error('❌ [Messages API] Error in send_message:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to send message'
        });
      }
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

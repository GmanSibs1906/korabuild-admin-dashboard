import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// GET handler for fetching conversation messages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;

    // Get conversation details
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select(`
        id,
        project_id,
        conversation_name,
        conversation_type,
        description,
        is_private,
        participants,
        last_message_at,
        message_count,
        priority_level,
        is_archived,
        created_at,
        updated_at,
        projects:project_id (
          project_name,
          client_id,
          users:client_id (
            full_name
          )
        )
      `)
      .eq('id', conversationId)
      .single();

    if (conversationError) {
      console.error('Error fetching conversation:', conversationError);
      return NextResponse.json(
        { error: 'Failed to fetch conversation' },
        { status: 500 }
      );
    }

    // Fetch real messages from both tables (messages + communication_log)
    console.log('📨 [Messages API] Fetching messages from both tables...');
    
    // Fetch from messages table (original messages)
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        *,
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
      console.error('Error fetching messages from messages table:', messagesError);
    }

    // Fetch from communication_log table (new admin messages)
    const { data: logMessages, error: logError } = await supabase
      .from('communication_log')
      .select(`
        *,
        sender:created_by (
          id,
          full_name,
          role,
          profile_photo_url
        )
      `)
      .eq('communication_type', 'instruction')
      .eq('subject', 'Admin Message')
      .order('created_at', { ascending: true });

    if (logError) {
      console.error('Error fetching messages from communication_log:', logError);
    }

    // Filter log messages by conversation (stored in metadata or by project)
    const conversationLogMessages = (logMessages || []).filter(logMsg => {
      // Check if this log message belongs to our conversation
      // We can match by project_id since we store that
      return logMsg.project_id === conversation.project_id;
    });

    console.log('📊 [Messages API] Message counts:', {
      messagesTable: messages?.length || 0,
      communicationLog: conversationLogMessages.length,
      total: (messages?.length || 0) + conversationLogMessages.length,
      conversationHasProject: conversation.project_id !== null
    });

    // Format messages from messages table
    const formattedMessages = (messages || []).map((message: any) => {
      // Process attachment URLs into proper attachment objects
      const attachments = (message.attachment_urls || []).map((url: string, index: number) => {
        const filename = url.split('/').pop() || `attachment_${index + 1}`;
        const fileExtension = filename.split('.').pop()?.toLowerCase() || '';
        
        // Determine file type based on extension
        let file_type = 'application/octet-stream';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension)) {
          file_type = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
        } else if (['pdf'].includes(fileExtension)) {
          file_type = 'application/pdf';
        } else if (['doc', 'docx'].includes(fileExtension)) {
          file_type = 'application/msword';
        } else if (['txt'].includes(fileExtension)) {
          file_type = 'text/plain';
        }

        return {
          id: `${message.id}_attachment_${index}`,
          filename: filename,
          file_type: file_type,
          file_size: 0, // We don't have size info from the URL
          file_url: url
        };
      });

      return {
        id: message.id,
        content: message.message_text,
        sender_id: message.sender_id,
        sender_name: message.sender?.full_name || 'Unknown User',
        sender_role: message.sender?.role || 'user',
        sender_avatar: message.sender?.profile_photo_url || null,
        sent_at: message.created_at,
        is_read: message.read_by ? Object.keys(message.read_by).length > 0 : false,
        message_type: message.message_type || 'text',
        attachments: attachments,
        reply_to: message.reply_to_id,
        is_edited: message.is_edited || false,
        edited_at: message.edited_at,
        reactions: message.reactions || {},
        metadata: message.metadata || {},
        source: 'messages_table'
      };
    });

    // Format messages from communication_log table
    const formattedLogMessages = conversationLogMessages.map((logMessage: any) => {
      return {
        id: logMessage.id,
        content: logMessage.content,
        sender_id: logMessage.created_by,
        sender_name: logMessage.from_person || logMessage.sender?.full_name || 'Admin',
        sender_role: logMessage.sender?.role || 'admin',
        sender_avatar: logMessage.sender?.profile_photo_url || null,
        sent_at: logMessage.created_at,
        is_read: false, // New messages are unread
        message_type: 'text',
        attachments: [],
        reply_to: null,
        is_edited: false,
        edited_at: null,
        reactions: {},
        metadata: {
          stored_in: 'communication_log',
          source: 'admin_dashboard',
          communication_type: logMessage.communication_type
        },
        source: 'communication_log'
      };
    });

    // Merge and sort all messages by creation time
    const allMessages = [...formattedMessages, ...formattedLogMessages]
      .sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());

    console.log('✅ [Messages API] Messages formatted and merged:', {
      totalMessages: allMessages.length,
      fromMessagesTable: formattedMessages.length,
      fromCommunicationLog: formattedLogMessages.length
    });

    // Parse participants from the participants array
    const participantsList = conversation.participants || [];
    
    const formattedConversation = {
      id: conversation.id,
      name: conversation.conversation_name,
      project_name: conversation.projects ? (Array.isArray(conversation.projects) ? conversation.projects[0]?.project_name : (conversation.projects as any)?.project_name) : null,
      participants: participantsList.map((participantId: string) => ({
        id: participantId,
        name: 'User',
        role: 'user',
        avatar_url: null
      })),
      last_message: allMessages.length > 0 ? allMessages[allMessages.length - 1].content : '',
      last_message_at: conversation.last_message_at,
      unread_count: 0,
      status: conversation.is_archived ? 'archived' : 'active',
      priority: conversation.priority_level || 'medium'
    };

    console.log(`✅ Admin Dashboard: Fetched ${allMessages.length} messages for conversation ${conversationId} (${formattedMessages.length} from messages table, ${formattedLogMessages.length} from communication_log)`);

    return NextResponse.json({
      conversation: formattedConversation,
      messages: allMessages
    });

  } catch (error) {
    console.error('Error in GET /api/communications/messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST handler for sending messages and other actions
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [Messages API] POST request started');
    
    const body = await request.json();
    const { action, conversationId, content, messageType } = body;

    console.log('📋 [Messages API] Request body:', {
      action,
      conversationId,
      content: content ? `${content.substring(0, 50)}...` : null,
      messageType
    });

    if (!action || !conversationId) {
      console.error('❌ [Messages API] Missing required fields:', { action, conversationId });
      return NextResponse.json(
        { error: 'action and conversationId are required' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;

    switch (action) {
      case 'send_message': {
        console.log('📤 [Messages API] Processing send_message action');
        
        if (!content) {
          console.error('❌ [Messages API] Missing content for send_message');
          return NextResponse.json(
            { error: 'content is required for send_message' },
            { status: 400 }
          );
        }

        // Get admin user - use existing user from mobile app or create admin
        let adminUser;
        
        console.log('👤 [Messages API] Looking for existing admin user...');
        
        // First try to get existing admin user
        const { data: existingAdmin, error: adminQueryError } = await supabase
          .from('users')
          .select('id, full_name, role, email')
          .eq('role', 'admin')
          .limit(1)
          .single();

        if (adminQueryError && adminQueryError.code !== 'PGRST116') {
          console.error('❌ [Messages API] Error querying for admin user:', adminQueryError);
        }

        if (existingAdmin) {
          console.log('✅ [Messages API] Found existing admin user:', {
            id: existingAdmin.id,
            name: existingAdmin.full_name,
            email: existingAdmin.email
          });
          adminUser = existingAdmin;
        } else {
          console.log('🔍 [Messages API] No admin found, checking for specific user to promote...');
          
          // Use the existing user from mobile app logs as admin for this conversation
          const { data: existingUser, error: userQueryError } = await supabase
            .from('users')
            .select('id, full_name, role, email')
            .eq('id', 'abefe861-97da-4556-8b39-18c5ddbce22c')
            .single();

          if (userQueryError) {
            console.error('❌ [Messages API] Error finding specific user:', userQueryError);
          }

          if (existingUser) {
            console.log('✅ [Messages API] Found user to promote to admin:', {
              id: existingUser.id,
              name: existingUser.full_name,
              currentRole: existingUser.role
            });
            
            // Update user to admin role
            const { data: updatedUser, error: updateError } = await supabase
              .from('users')
              .update({ role: 'admin' })
              .eq('id', 'abefe861-97da-4556-8b39-18c5ddbce22c')
              .select('id, full_name, role, email')
              .single();

            if (updateError) {
              console.error('❌ [Messages API] Error updating user to admin:', updateError);
              // Use existing user as-is
              adminUser = existingUser;
            } else {
              console.log('✅ [Messages API] Successfully promoted user to admin');
              adminUser = updatedUser;
            }
          } else {
            console.log('🆕 [Messages API] Creating new admin user...');
            
            // Create new admin user
            const { data: newAdmin, error: adminError } = await supabase
              .from('users')
              .insert({
                email: 'admin@korabuild.com',
                full_name: 'KoraBuild Admin',
                role: 'admin'
              })
              .select('id, full_name, role, email')
              .single();

            if (adminError) {
              console.error('❌ [Messages API] Error creating admin user:', {
                error: adminError,
                code: adminError.code,
                message: adminError.message,
                details: adminError.details
              });
              return NextResponse.json(
                { error: 'Failed to create admin user' },
                { status: 500 }
              );
            }

            console.log('✅ [Messages API] Created new admin user:', {
              id: newAdmin.id,
              name: newAdmin.full_name
            });
            adminUser = newAdmin;
          }
        }

        // Verify conversation exists before inserting message
        console.log('🔍 [Messages API] Verifying conversation exists...');
        const { data: conversationExists, error: convCheckError } = await supabase
          .from('conversations')
          .select('id, conversation_name, project_id')
          .eq('id', conversationId)
          .single();

        if (convCheckError) {
          console.error('❌ [Messages API] Error checking conversation:', {
            error: convCheckError,
            conversationId
          });
          return NextResponse.json(
            { error: 'Conversation not found' },
            { status: 404 }
          );
        }

        console.log('✅ [Messages API] Conversation verified:', {
          id: conversationExists.id,
          name: conversationExists.conversation_name,
          projectId: conversationExists.project_id
        });

        // Insert the message using communication_log table (bypass trigger issues)
        console.log('💾 [Messages API] Storing message in communication_log table...');

        try {
          // Handle case where conversation has no project (project_id is null)
          // We need to either use the messages table directly or create a dummy project
          
          if (conversationExists.project_id === null) {
            console.log('🔄 [Messages API] Conversation has no project - using messages table instead');
            
            // For conversations without projects, store in messages table
            const { data: messageEntry, error: messageError } = await supabase
              .from('messages')
              .insert({
                conversation_id: conversationId,
                sender_id: adminUser.id,
                message_text: content,
                message_type: messageType || 'text',
                attachment_urls: [],
                reply_to_id: null,
                is_edited: false,
                is_pinned: false,
                read_by: {},
                reactions: {},
                metadata: {
                  source: 'admin_dashboard',
                  no_project: true,
                  sent_via: 'messages_table'
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select('*')
              .single();

            if (messageError) {
              console.error('❌ [Messages API] Failed to store message in messages table:', messageError);
              return NextResponse.json(
                { error: 'Failed to store message in messages table', details: messageError.message },
                { status: 500 }
              );
            }

            console.log('✅ [Messages API] Message stored in messages table:', messageEntry.id);

            // Get sender details for response
            const { data: senderDetails } = await supabase
              .from('users')
              .select('id, full_name, role, profile_photo_url')
              .eq('id', adminUser.id)
              .single();

            // Create message response that matches frontend expectations
            const messageResponse = {
              id: messageEntry.id,
              content: content,
              sender_id: adminUser.id,
              sender_name: senderDetails?.full_name || adminUser.full_name || 'KoraBuild Admin',
              sender_role: senderDetails?.role || adminUser.role || 'admin',
              sender_avatar: senderDetails?.profile_photo_url || null,
              sent_at: messageEntry.created_at,
              is_read: false,
              message_type: messageType || 'text',
              attachments: [],
              reply_to: null,
              is_edited: false,
              edited_at: null,
              reactions: {},
              metadata: {
                stored_in: 'messages_table',
                source: 'admin_dashboard',
                no_project: true
              }
            };

            console.log(`🎉 [Messages API] Message response created for no-project conversation ${conversationId}`);

            return NextResponse.json({
              message: messageResponse,
              success: true,
              note: 'Message stored in messages table (no project associated)'
            });
          }

          // For conversations with projects, use communication_log table
          const { data: logEntry, error: logError } = await supabase
            .from('communication_log')
            .insert({
              project_id: conversationExists.project_id,
              communication_type: 'instruction', // Use valid enum value instead of 'message'
              subject: 'Admin Message',
              content: content,
              from_person: adminUser.full_name || 'KoraBuild Admin',
              to_person: 'Conversation Participants',
              communication_date: new Date().toISOString(),
              priority: 'medium',
              status: 'sent',
              created_by: adminUser.id,
              attachments: [], // Store conversation info in attachments array as workaround
              related_contract_id: null,
              related_assignment_id: null,
              response_required: false,
              follow_up_required: false
            })
            .select('*')
            .single();

          if (logError) {
            console.error('❌ [Messages API] Failed to store message:', logError);
            return NextResponse.json(
              { error: 'Failed to store message', details: logError.message },
              { status: 500 }
            );
          }

          console.log('✅ [Messages API] Message stored successfully:', logEntry.id);

          // Get sender details for response
          const { data: senderDetails } = await supabase
            .from('users')
            .select('id, full_name, role, profile_photo_url')
            .eq('id', adminUser.id)
            .single();

          // Create message response that matches frontend expectations
          const messageResponse = {
            id: logEntry.id,
            content: content,
            sender_id: adminUser.id,
            sender_name: senderDetails?.full_name || adminUser.full_name || 'KoraBuild Admin',
            sender_role: senderDetails?.role || adminUser.role || 'admin',
            sender_avatar: senderDetails?.profile_photo_url || null,
            sent_at: logEntry.created_at,
            is_read: false,
            message_type: messageType || 'text',
            attachments: [],
            reply_to: null,
            is_edited: false,
            edited_at: null,
            reactions: {},
            metadata: {
              stored_in: 'communication_log',
              source: 'admin_dashboard',
              real_message: true
            }
          };

          console.log(`🎉 [Messages API] Message response created for conversation ${conversationId}`, {
            messageId: messageResponse.id,
            senderName: messageResponse.sender_name,
            contentLength: messageResponse.content.length
          });

          return NextResponse.json({
            message: messageResponse,
            success: true,
            note: 'Message stored in communication_log due to database trigger restrictions'
          });

        } catch (error) {
          console.error('💥 [Messages API] Unexpected error:', error);
          return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
          );
        }
      }

      case 'mark_conversation_read': {
        // Update all messages in the conversation as read by admin
        const { data: adminUser } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'admin')
          .single();

        if (adminUser) {
          const { error } = await supabase
            .from('messages')
            .update({
              read_by: `{"${adminUser.id}": "${new Date().toISOString()}"}`
            })
            .eq('conversation_id', conversationId);

          if (error) {
            console.error('Error marking conversation as read:', error);
            return NextResponse.json(
              { error: 'Failed to mark conversation as read' },
              { status: 500 }
            );
          }
        }

        return NextResponse.json({ success: true });
      }

      case 'mark_read': {
        const { messageId } = body;
        
        if (!messageId) {
          return NextResponse.json(
            { error: 'messageId is required for mark_read' },
            { status: 400 }
          );
        }

        // Get admin user
        const { data: adminUser } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'admin')
          .single();

        if (adminUser) {
          const { error } = await supabase
            .from('messages')
            .update({
              read_by: `{"${adminUser.id}": "${new Date().toISOString()}"}`
            })
            .eq('id', messageId);

          if (error) {
            console.error('Error marking message as read:', error);
            return NextResponse.json(
              { error: 'Failed to mark message as read' },
              { status: 500 }
            );
          }
        }

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in POST /api/communications/messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

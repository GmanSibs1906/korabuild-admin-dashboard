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
        *,
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

    // Fetch real messages from the database
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
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Format messages for the admin dashboard
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
        metadata: message.metadata || {}
      };
    });

    // Parse participants from the participants array
    const participantsList = conversation.participants || [];
    
    const formattedConversation = {
      id: conversation.id,
      name: conversation.conversation_name,
      project_name: conversation.projects?.project_name,
      participants: participantsList.map((participantId: string) => ({
        id: participantId,
        name: 'User',
        role: 'user',
        avatar_url: null
      })),
      last_message: formattedMessages.length > 0 ? formattedMessages[formattedMessages.length - 1].content : '',
      last_message_at: conversation.last_message_at,
      unread_count: 0,
      status: conversation.is_archived ? 'archived' : 'active',
      priority: conversation.priority_level || 'medium'
    };

    console.log(`✅ Admin Dashboard: Fetched ${formattedMessages.length} messages for conversation ${conversationId}`);

    return NextResponse.json({
      conversation: formattedConversation,
      messages: formattedMessages
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
    const body = await request.json();
    const { action, conversationId, content, messageType } = body;

    if (!action || !conversationId) {
      return NextResponse.json(
        { error: 'action and conversationId are required' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;

    switch (action) {
      case 'send_message': {
        if (!content) {
          return NextResponse.json(
            { error: 'content is required for send_message' },
            { status: 400 }
          );
        }

        // Get admin user - use existing user from mobile app or create admin
        let adminUser;
        
        // First try to get existing admin user
        const { data: existingAdmin } = await supabase
          .from('users')
          .select('id, full_name, role')
          .eq('role', 'admin')
          .single();

        if (existingAdmin) {
          adminUser = existingAdmin;
        } else {
          // Use the existing user from mobile app logs as admin for this conversation
          const { data: existingUser } = await supabase
            .from('users')
            .select('id, full_name, role')
            .eq('id', 'abefe861-97da-4556-8b39-18c5ddbce22c')
            .single();

          if (existingUser) {
            // Update user to admin role
            const { data: updatedUser, error: updateError } = await supabase
              .from('users')
              .update({ role: 'admin' })
              .eq('id', 'abefe861-97da-4556-8b39-18c5ddbce22c')
              .select('id, full_name, role')
              .single();

            if (updateError) {
              console.error('Error updating user to admin:', updateError);
              // Use existing user as-is
              adminUser = existingUser;
            } else {
              adminUser = updatedUser;
            }
          } else {
            // Create new admin user
            const { data: newAdmin, error: adminError } = await supabase
              .from('users')
              .insert({
                email: 'admin@korabuild.com',
                full_name: 'KoraBuild Admin',
                role: 'admin'
              })
              .select('id, full_name, role')
              .single();

            if (adminError) {
              console.error('Error creating admin user:', adminError);
              return NextResponse.json(
                { error: 'Failed to create admin user' },
                { status: 500 }
              );
            }

            adminUser = newAdmin;
          }
        }

        // Insert the message into the database
        const { data: newMessage, error: messageError } = await supabase
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
              timestamp: new Date().toISOString()
            }
          })
          .select(`
            *,
            sender:sender_id (
              id,
              full_name,
              role,
              profile_photo_url
            )
          `)
          .single();

        if (messageError) {
          console.error('Error creating message:', messageError);
          return NextResponse.json(
            { error: 'Failed to create message' },
            { status: 500 }
          );
        }

        // Update conversation last_message_at and message_count
        await supabase
          .from('conversations')
          .update({
            last_message_at: new Date().toISOString()
          })
          .eq('id', conversationId);

        // Format the message for response
        const formattedMessage = {
          id: newMessage.id,
          content: newMessage.message_text,
          sender_id: newMessage.sender_id,
          sender_name: newMessage.sender?.full_name || 'KoraBuild Admin',
          sender_role: newMessage.sender?.role || 'admin',
          sender_avatar: newMessage.sender?.profile_photo_url || null,
          sent_at: newMessage.created_at,
          is_read: false,
          message_type: newMessage.message_type || 'text',
          attachments: newMessage.attachment_urls || [],
          reply_to: newMessage.reply_to_id,
          is_edited: false,
          edited_at: null,
          reactions: {},
          metadata: newMessage.metadata || {}
        };

        console.log(`✅ Admin Dashboard: Message sent to conversation ${conversationId}`);

        return NextResponse.json({
          message: formattedMessage,
          success: true
        });
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

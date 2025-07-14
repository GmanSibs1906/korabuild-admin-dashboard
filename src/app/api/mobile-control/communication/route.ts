import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// Types for mobile app communication data control
interface MobileCommunicationData {
  totalConversations: number;
  unreadMessages: number;
  recentMessages: MobileMessageData[];
  pendingApprovals: number;
  notificationSettings: MobileNotificationSettings;
}

interface MobileMessageData {
  id: string;
  conversationId: string;
  senderName: string;
  messageText: string;
  timestamp: string;
  isRead: boolean;
  messageType: string;
  attachments?: string[];
}

interface MobileNotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

interface MobileBroadcastData {
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  targetUsers: string[];
  scheduledTime?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get project conversations
    const { data: conversations, error: conversationsError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('project_id', projectId)
      .order('last_message_at', { ascending: false });

    if (conversationsError) {
      throw conversationsError;
    }

    // Get messages from conversations
    const conversationIds = conversations?.map(c => c.id) || [];
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, full_name, email),
        conversation:conversations!messages_conversation_id_fkey(id, conversation_name)
      `)
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false })
      .limit(50);

    if (messagesError) {
      throw messagesError;
    }

    // Get approval requests
    const { data: approvals, error: approvalsError } = await supabaseAdmin
      .from('approval_requests')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'pending');

    if (approvalsError) {
      throw approvalsError;
    }

    // Get notification preferences if userId provided
    let notificationSettings: MobileNotificationSettings = {
      pushEnabled: true,
      emailEnabled: true,
      smsEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00'
    };

    if (userId) {
      const { data: preferences, error: preferencesError } = await supabaseAdmin
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (preferences && !preferencesError) {
        notificationSettings = {
          pushEnabled: preferences.push_enabled || true,
          emailEnabled: preferences.email_enabled || true,
          smsEnabled: preferences.sms_enabled || false,
          quietHoursStart: preferences.quiet_hours_start || '22:00',
          quietHoursEnd: preferences.quiet_hours_end || '07:00'
        };
      }
    }

    // Calculate communication metrics
    const totalConversations = conversations?.length || 0;
    const unreadMessages = messages?.filter(m => !m.is_read).length || 0;
    const pendingApprovals = approvals?.length || 0;

    // Prepare mobile message data
    const mobileMessages: MobileMessageData[] = messages?.map(message => ({
      id: message.id,
      conversationId: message.conversation_id,
      senderName: message.sender?.full_name || 'Unknown Sender',
      messageText: message.message_text || '',
      timestamp: message.created_at,
      isRead: message.read_by ? Object.keys(message.read_by).length > 0 : false,
      messageType: message.message_type || 'text',
      attachments: message.attachment_urls || []
    })) || [];

    // Prepare mobile communication data
    const mobileCommunicationData: MobileCommunicationData = {
      totalConversations,
      unreadMessages,
      recentMessages: mobileMessages.slice(0, 10),
      pendingApprovals,
      notificationSettings
    };

    // Log the mobile communication data control action
    console.log('📱 Mobile Communication Data Control - GET:', {
      projectId,
      userId,
      totalConversations,
      unreadMessages,
      pendingApprovals,
      messagesCount: mobileMessages.length,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data: {
        communication: mobileCommunicationData,
        conversations: conversations || [],
        messages: mobileMessages,
        approvals: approvals || [],
        lastUpdated: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('❌ Error fetching mobile communication data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mobile communication data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, userId, updateType, data } = body;

    if (!projectId || !updateType || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let result;

    switch (updateType) {
      case 'send_message':
        // Send message to user
        const { data: conversation, error: conversationError } = await supabaseAdmin
          .from('conversations')
          .select('*')
          .eq('project_id', projectId)
          .eq('conversation_type', 'client_contractor')
          .single();

        if (conversationError && conversationError.code !== 'PGRST116') {
          throw conversationError;
        }

        let conversationId = conversation?.id;

        // Create conversation if it doesn't exist
        if (!conversationId) {
          const { data: newConversation, error: newConversationError } = await supabaseAdmin
            .from('conversations')
            .insert({
              project_id: projectId,
              conversation_name: 'Admin Communication',
              conversation_type: 'client_contractor',
              participants: userId ? [userId] : [],
              created_by: userId,
              created_at: new Date().toISOString()
            })
            .select('id')
            .single();

          if (newConversationError) {
            throw newConversationError;
          }

          conversationId = newConversation.id;
        }

        // Send message
        const { data: messageResult, error: messageError } = await supabaseAdmin
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: userId,
            message_text: data.message,
            message_type: data.type || 'text',
            attachment_urls: data.attachments || [],
            created_at: new Date().toISOString()
          });

        if (messageError) {
          throw messageError;
        }

        result = messageResult;
        break;

      case 'broadcast_message':
        // Send broadcast message to multiple users
        const broadcastData: MobileBroadcastData = data;
        
        // Create notifications for each target user
        const notifications = broadcastData.targetUsers.map(targetUserId => ({
          user_id: targetUserId,
          project_id: projectId,
          notification_type: 'message',
          title: broadcastData.title,
          message: broadcastData.message,
          priority_level: broadcastData.priority,
          created_at: new Date().toISOString()
        }));

        const { data: broadcastResult, error: broadcastError } = await supabaseAdmin
          .from('notifications')
          .insert(notifications);

        if (broadcastError) {
          throw broadcastError;
        }

        result = broadcastResult;
        break;

      case 'update_notification_settings':
        // Update notification preferences
        const { data: settingsResult, error: settingsError } = await supabaseAdmin
          .from('notification_preferences')
          .upsert({
            user_id: userId,
            notification_type: 'all',
            push_enabled: data.pushEnabled,
            email_enabled: data.emailEnabled,
            sms_enabled: data.smsEnabled,
            quiet_hours_start: data.quietHoursStart,
            quiet_hours_end: data.quietHoursEnd,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,notification_type',
            ignoreDuplicates: false
          });

        if (settingsError) {
          throw settingsError;
        }

        result = settingsResult;
        break;

      case 'mark_messages_read':
        // Mark messages as read
        const messageIds = data.messageIds || [];
        const readTimestamp = new Date().toISOString();
        
        const { data: readResult, error: readError } = await supabaseAdmin
          .from('messages')
          .update({
            read_by: { [userId]: readTimestamp },
            updated_at: readTimestamp
          })
          .in('id', messageIds);

        if (readError) {
          throw readError;
        }

        result = readResult;
        break;

      case 'respond_to_approval':
        // Respond to approval request
        const { data: approvalResult, error: approvalError } = await supabaseAdmin
          .from('approval_responses')
          .insert({
            approval_request_id: data.approvalId,
            responder_id: userId,
            decision: data.decision,
            comments: data.comments,
            response_date: new Date().toISOString(),
            created_at: new Date().toISOString()
          });

        if (approvalError) {
          throw approvalError;
        }

        // Update approval request status
        const { data: updateResult, error: updateError } = await supabaseAdmin
          .from('approval_requests')
          .update({
            status: data.decision === 'approved' ? 'approved' : 'rejected',
            updated_at: new Date().toISOString()
          })
          .eq('id', data.approvalId);

        if (updateError) {
          throw updateError;
        }

        result = { approval: approvalResult, update: updateResult };
        break;

      default:
        return NextResponse.json({ error: 'Invalid update type' }, { status: 400 });
    }

    // Log the mobile communication data control action
    console.log('📱 Mobile Communication Data Control - POST:', {
      projectId,
      userId,
      updateType,
      data,
      result,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Mobile communication data updated successfully`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error updating mobile communication data:', error);
    return NextResponse.json(
      { error: 'Failed to update mobile communication data' },
      { status: 500 }
    );
  }
} 
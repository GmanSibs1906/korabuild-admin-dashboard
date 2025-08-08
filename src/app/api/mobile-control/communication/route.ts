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

    // Calculate communication metrics with accurate unread count
    const totalConversations = conversations?.length || 0;
    
    // Get admin user ID for checking read status (used for both unread count and individual message status)
    let adminUser: any = null;
    try {
      const { data: admin } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .single();
      adminUser = admin;
    } catch (error) {
      console.warn('Could not fetch admin user for read status calculation:', error);
    }
    
    // Calculate accurate unread messages count using same logic as communications API
    let unreadMessages = 0;
    
    try {
      if (adminUser && messages) {
        // Count unread messages - messages are unread if admin ID is not in read_by JSON field
        unreadMessages = messages.filter(message => {
          const readBy = message.read_by || {};
          return !readBy[adminUser.id]; // Message is unread if admin ID is not in read_by
        }).length;
        
        // Also count unread messages from communication_log for this project
        const { data: logMessages } = await supabaseAdmin
          .from('communication_log')
          .select('id, created_by')
          .eq('project_id', projectId)
          .eq('communication_type', 'instruction')
          .eq('subject', 'Admin Message')
          .neq('created_by', adminUser.id); // Don't count admin's own messages as unread
        
        if (logMessages) {
          unreadMessages += logMessages.length;
        }
      } else {
        // Fallback to simple calculation if no admin user found
        unreadMessages = messages?.filter(m => {
          const readBy = m.read_by || {};
          return Object.keys(readBy).length === 0;
        }).length || 0;
      }
    } catch (error) {
      console.error(`Error calculating accurate unread count for project ${projectId}:`, error);
      // Fallback to simple calculation
      unreadMessages = messages?.filter(m => {
        const readBy = m.read_by || {};
        return Object.keys(readBy).length === 0;
      }).length || 0;
    }
    
    const pendingApprovals = approvals?.length || 0;

    console.log('📱 [Mobile Control] Accurate unread count calculated:', {
      projectId,
      unreadMessages,
      methodUsed: 'admin_specific_read_tracking'
    });

    // Prepare mobile message data with accurate read status
    const mobileMessages: MobileMessageData[] = messages?.map(message => {
      let isRead = false;
      
      try {
        // Use same admin-specific read logic for individual messages
        const readBy = message.read_by || {};
        if (adminUser) {
          isRead = !!readBy[adminUser.id]; // Message is read if admin ID is in read_by
        } else {
          isRead = Object.keys(readBy).length > 0; // Fallback to any read status
        }
      } catch (error) {
        console.error(`Error determining read status for message ${message.id}:`, error);
        isRead = false; // Default to unread on error
      }
      
      return {
      id: message.id,
      conversationId: message.conversation_id,
      senderName: message.sender?.full_name || 'Unknown Sender',
      messageText: message.message_text || '',
      timestamp: message.created_at,
        isRead,
      messageType: message.message_type || 'text',
      attachments: message.attachment_urls || []
      };
    }) || [];

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
    const { projectId, updateType, data } = body;

    if (!projectId || !updateType || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get or create admin user (like the working communications API)
    let adminUser;
    
    // First try to get existing admin user
    const { data: existingAdmin } = await supabaseAdmin
      .from('users')
      .select('id, full_name, role')
      .eq('role', 'admin')
      .single();

    if (existingAdmin) {
      adminUser = existingAdmin;
    } else {
      // Use the existing user from mobile app logs as admin for this conversation
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id, full_name, role')
        .eq('id', 'abefe861-97da-4556-8b39-18c5ddbce22c')
        .single();

      if (existingUser) {
        // Update user to admin role
        const { data: updatedUser, error: updateError } = await supabaseAdmin
          .from('users')
          .update({ role: 'admin' })
          .eq('id', 'abefe861-97da-4556-8b39-18c5ddbce22c')
          .select('id, full_name, role')
          .single();

        if (updateError) {
          console.error('Error updating user to admin:', updateError);
          adminUser = existingUser;
        } else {
          adminUser = updatedUser;
        }
      } else {
        // Create new admin user
        const { data: newAdmin, error: adminError } = await supabaseAdmin
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
          throw adminError;
        }

        adminUser = newAdmin;
      }
    }

    const userId = adminUser.id;

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
          })
          .select()
          .single();

        if (messageError) {
          throw messageError;
        }

        // Create notifications for admin users when message is sent from mobile app
        console.log('🔔 [Mobile Communication] Creating notifications for admin users...');
        
        // Get sender information
        const { data: senderInfo, error: senderError } = await supabaseAdmin
          .from('users')
          .select('id, full_name, role')
          .eq('id', userId)
          .single();

        if (senderError) {
          console.error('❌ [Mobile Communication] Error fetching sender info:', senderError);
        }

        // Get conversation information for notification context
        const { data: conversationInfo, error: conversationInfoError } = await supabaseAdmin
          .from('conversations')
          .select('conversation_name, project_id')
          .eq('id', conversationId)
          .single();

        if (conversationInfoError) {
          console.error('❌ [Mobile Communication] Error fetching conversation info:', conversationInfoError);
        }

        // Get project name if available
        let projectName = null;
        if (conversationInfo?.project_id) {
          const { data: projectInfo, error: projectError } = await supabaseAdmin
            .from('projects')
            .select('project_name')
            .eq('id', conversationInfo.project_id)
            .single();

          if (!projectError && projectInfo) {
            projectName = projectInfo.project_name;
          }
        }

        // Only create notifications if sender is not an admin
        if (senderInfo && senderInfo.role !== 'admin') {
          // Get all admin users
          const { data: adminUsers, error: adminError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('role', 'admin');

          if (adminError) {
            console.error('❌ [Mobile Communication] Error fetching admin users:', adminError);
          } else if (adminUsers && adminUsers.length > 0) {
            // Create notifications for each admin user
            const notifications = adminUsers.map(admin => ({
              user_id: admin.id,
              project_id: conversationInfo?.project_id || null,
              notification_type: 'message',
              title: projectName 
                ? `New message in ${projectName} - ${conversationInfo?.conversation_name || 'General'}`
                : `New message from ${senderInfo.full_name || 'Unknown User'}`,
              message: data.message.length > 100 ? data.message.substring(0, 100) + '...' : data.message,
              entity_id: messageResult.id,
              entity_type: 'message',
              priority_level: 'normal',
              is_read: false,
              action_url: `/communications?conversation=${conversationId}`,
              conversation_id: conversationId,
              metadata: {
                message_id: messageResult.id,
                sender_id: userId,
                sender_name: senderInfo.full_name || 'Unknown User',
                conversation_id: conversationId,
                conversation_name: conversationInfo?.conversation_name || 'General',
                project_id: conversationInfo?.project_id,
                project_name: projectName,
                message_type: data.type || 'text',
                source: 'mobile_app_message'
              },
              priority: 'normal',
              is_pushed: false,
              is_sent: false
            }));

            const { data: notificationResult, error: notificationError } = await supabaseAdmin
              .from('notifications')
              .insert(notifications);

            if (notificationError) {
              console.error('❌ [Mobile Communication] Error creating notifications:', notificationError);
            } else {
              console.log(`✅ [Mobile Communication] Created ${notifications.length} notifications for admin users`);
            }
          }
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
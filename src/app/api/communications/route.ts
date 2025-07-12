import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

interface CommunicationStats {
  totalConversations: number;
  totalMessages: number;
  unreadMessages: number;
  pendingApprovals: number;
  urgentRequests: number;
  averageResponseTime: number;
  responseRate: number;
  escalatedRequests: number;
}

interface ConversationWithDetails {
  id: string;
  project_id: string;
  conversation_name: string;
  conversation_type: string;
  description: string;
  is_private: boolean;
  participants: string[];
  last_message_at: string;
  message_count: number;
  priority_level: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  project?: {
    project_name: string;
    client_id: string;
    client_name?: string;
  };
  last_message?: {
    message_text: string;
    sender_id: string;
    created_at: string;
  };
  unread_count: number;
}

interface ApprovalRequestWithDetails {
  id: string;
  project_id: string;
  request_type: string;
  title: string;
  description: string;
  requested_by: string;
  assigned_to: string;
  priority_level: string;
  status: string;
  due_date: string;
  estimated_cost_impact: number;
  estimated_time_impact: number;
  created_at: string;
  updated_at: string;
  project?: {
    project_name: string;
    client_name?: string;
  };
  requester?: {
    full_name: string;
    email: string;
  };
  assignee?: {
    full_name: string;
    email: string;
  };
  days_pending: number;
}

interface NotificationWithDetails {
  id: string;
  user_id: string;
  project_id: string;
  notification_type: string;
  title: string;
  message: string;
  priority_level: string;
  is_read: boolean;
  read_at: string;
  action_url: string;
  created_at: string;
  project?: {
    project_name: string;
  };
  user?: {
    full_name: string;
    email: string;
  };
}

interface CommunicationLogData {
  id: string;
  project_id: string;
  communication_type: string;
  communication_date: string;
  participants: string[];
  summary: string;
  action_taken: string;
  priority_level: string;
  follow_up_required: boolean;
  follow_up_date: string;
  created_at: string;
  updated_at: string;
  projects?: {
    project_name: string;
  };
}

interface CommunicationData {
  stats: CommunicationStats;
  conversations: ConversationWithDetails[];
  approvalRequests: ApprovalRequestWithDetails[];
  notifications: NotificationWithDetails[];
  recentCommunications: CommunicationLogData[];
  messagesByType: { [key: string]: number };
  responseTimeByUser: { [key: string]: number };
}

interface ApprovalResponse {
  response_date: string;
  approval_request_id: string;
}

interface ConversationData {
  id: string;
  project_id: string;
  conversation_name: string;
  conversation_type: string;
  description: string;
  is_private: boolean;
  participants: string[];
  last_message_at: string;
  message_count: number;
  priority_level: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  projects?: {
    project_name: string;
    client_id: string;
    users?: {
      full_name: string;
    };
  };
}

interface ApprovalRequestData {
  id: string;
  project_id: string;
  request_type: string;
  title: string;
  description: string;
  requested_by: string;
  assigned_to: string;
  priority_level: string;
  status: string;
  due_date: string;
  estimated_cost_impact: number;
  estimated_time_impact: number;
  created_at: string;
  updated_at: string;
  projects?: {
    project_name: string;
    users?: {
      full_name: string;
    };
  };
  requester?: {
    full_name: string;
    email: string;
  };
  assignee?: {
    full_name: string;
    email: string;
  };
}

interface NotificationData {
  id: string;
  user_id: string;
  project_id: string;
  notification_type: string;
  title: string;
  message: string;
  priority_level: string;
  is_read: boolean;
  read_at: string;
  action_url: string;
  created_at: string;
  projects?: {
    project_name: string;
  };
  users?: {
    full_name: string;
    email: string;
  };
}

export async function GET(request: Request) {
  try {
    console.log('🔍 [Communications API] Starting communication data fetch...');
    
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type'); // 'conversations', 'approvals', 'notifications', 'all'
    
    console.log('📊 [Communications API] Query parameters:', { limit, offset, type });

    // Fetch communication statistics
    const [
      conversationsCount,
      messagesCount,
      unreadMessagesCount,
      pendingApprovalsCount,
      urgentRequestsCount,
      averageResponseTime,
      escalatedRequestsCount
    ] = await Promise.all([
      // Total conversations
      supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true }),
      
      // Total messages
      supabase
        .from('messages')
        .select('id', { count: 'exact', head: true }),
      
      // Unread messages (simplified - would need proper read tracking)
      supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false),
      
      // Pending approvals
      supabase
        .from('approval_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      
      // Urgent requests
      supabase
        .from('approval_requests')
        .select('id', { count: 'exact', head: true })
        .eq('priority_level', 'urgent'),
      
      // Average response time (simplified calculation)
      supabase
        .from('approval_responses')
        .select('response_date, approval_request_id')
        .not('response_date', 'is', null)
        .limit(100),
      
      // Escalated requests
      supabase
        .from('approval_requests')
        .select('id', { count: 'exact', head: true })
        .eq('priority_level', 'high')
    ]);

    // Calculate average response time
    let avgResponseTime = 0;
    if (averageResponseTime.data && averageResponseTime.data.length > 0) {
      const responseTimes = averageResponseTime.data.map((response: ApprovalResponse) => {
        const responseDate = new Date(response.response_date);
        const requestDate = new Date(); // Would need to join with approval_requests
        return Math.abs(responseDate.getTime() - requestDate.getTime()) / (1000 * 60 * 60); // hours
      });
      avgResponseTime = responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length;
    }

    const stats: CommunicationStats = {
      totalConversations: conversationsCount.count || 0,
      totalMessages: messagesCount.count || 0,
      unreadMessages: unreadMessagesCount.count || 0,
      pendingApprovals: pendingApprovalsCount.count || 0,
      urgentRequests: urgentRequestsCount.count || 0,
      averageResponseTime: Math.round(avgResponseTime),
      responseRate: pendingApprovalsCount.count ? 
        Math.round(((averageResponseTime.data?.length || 0) / pendingApprovalsCount.count) * 100) : 100,
      escalatedRequests: escalatedRequestsCount.count || 0
    };

    console.log('📈 [Communications API] Communication statistics:', stats);

    // Fetch conversations with details
    const { data: conversationsData, error: conversationsError } = await supabase
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
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (conversationsError) {
      console.error('❌ [Communications API] Error fetching conversations:', conversationsError);
      throw conversationsError;
    }

    // Fetch approval requests with details
    const { data: approvalRequestsData, error: approvalRequestsError } = await supabase
      .from('approval_requests')
      .select(`
        *,
        projects:project_id (
          project_name,
          users:client_id (
            full_name
          )
        ),
        requester:requested_by (
          full_name,
          email
        ),
        assignee:assigned_to (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (approvalRequestsError) {
      console.error('❌ [Communications API] Error fetching approval requests:', approvalRequestsError);
      throw approvalRequestsError;
    }

    // Fetch notifications with details
    const { data: notificationsData, error: notificationsError } = await supabase
      .from('notifications')
      .select(`
        *,
        projects:project_id (
          project_name
        ),
        users:user_id (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (notificationsError) {
      console.error('❌ [Communications API] Error fetching notifications:', notificationsError);
      throw notificationsError;
    }

    // Process conversations with additional data
    const conversations: ConversationWithDetails[] = (conversationsData || []).map((conv: ConversationData) => {
      const daysSinceLastMessage = Math.floor(
        (new Date().getTime() - new Date(conv.last_message_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      return {
        ...conv,
        project: conv.projects ? {
          project_name: conv.projects.project_name,
          client_id: conv.projects.client_id,
          client_name: conv.projects.users?.full_name || 'Unknown Client'
        } : undefined,
        unread_count: Math.floor(Math.random() * 5), // Simplified - would need proper read tracking
        days_since_last_message: daysSinceLastMessage
      };
    });

    // Process approval requests with additional data
    const approvalRequests: ApprovalRequestWithDetails[] = (approvalRequestsData || []).map((req: ApprovalRequestData) => {
      const daysPending = Math.floor(
        (new Date().getTime() - new Date(req.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      return {
        ...req,
        project: req.projects ? {
          project_name: req.projects.project_name,
          client_name: req.projects.users?.full_name || 'Unknown Client'
        } : undefined,
        requester: req.requester || { full_name: 'Unknown User', email: '' },
        assignee: req.assignee || { full_name: 'Unassigned', email: '' },
        days_pending: daysPending
      };
    });

    // Process notifications
    const notifications: NotificationWithDetails[] = (notificationsData || []).map((notif: NotificationData) => ({
      ...notif,
      project: notif.projects ? {
        project_name: notif.projects.project_name
      } : undefined,
      user: notif.users ? {
        full_name: notif.users.full_name,
        email: notif.users.email
      } : undefined
    }));

    // Calculate message distribution by type
    const messagesByType = conversations.reduce((acc: { [key: string]: number }, conv: ConversationWithDetails) => {
      acc[conv.conversation_type] = (acc[conv.conversation_type] || 0) + conv.message_count;
      return acc;
    }, {} as { [key: string]: number });

    // Fetch recent communication log
    const { data: recentCommunications, error: recentError } = await supabase
      .from('communication_log')
      .select(`
        *,
        projects:project_id (
          project_name
        )
      `)
      .order('communication_date', { ascending: false })
      .limit(20);

    if (recentError) {
      console.error('❌ [Communications API] Error fetching recent communications:', recentError);
    }

    const communicationData: CommunicationData = {
      stats,
      conversations,
      approvalRequests,
      notifications,
      recentCommunications: recentCommunications || [],
      messagesByType,
      responseTimeByUser: {} // Would need more complex calculation
    };

    console.log('✅ [Communications API] Communication data compiled successfully');
    console.log('📊 [Communications API] Data summary:', {
      conversationsCount: conversations.length,
      approvalRequestsCount: approvalRequests.length,
      notificationsCount: notifications.length,
      recentCommunicationsCount: recentCommunications?.length || 0
    });

    return NextResponse.json(communicationData);
    
  } catch (error) {
    console.error('❌ [Communications API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch communication data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('📝 [Communications API] POST request received');
    
    const supabase = supabaseAdmin;
    const body = await request.json();
    const { action, data } = body;

    console.log('🔧 [Communications API] Action:', action);

    switch (action) {
      case 'send_message':
        // Send a new message
        const { data: messageData, error: messageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: data.conversation_id,
            sender_id: data.sender_id,
            message_text: data.message_text,
            message_type: data.message_type || 'text',
            attachment_urls: data.attachment_urls || []
          })
          .select()
          .single();

        if (messageError) throw messageError;

        // Update conversation last message timestamp
        await supabase
          .from('conversations')
          .update({ 
            last_message_at: new Date().toISOString(),
            message_count: supabase.rpc('increment_message_count', { conversation_id: data.conversation_id })
          })
          .eq('id', data.conversation_id);

        console.log('✅ [Communications API] Message sent successfully');
        return NextResponse.json({ success: true, message: messageData });

      case 'respond_to_approval':
        // Respond to an approval request
        const { data: responseData, error: responseError } = await supabase
          .from('approval_responses')
          .insert({
            approval_request_id: data.approval_request_id,
            responder_id: data.responder_id,
            decision: data.decision,
            comments: data.comments,
            conditions: data.conditions
          })
          .select()
          .single();

        if (responseError) throw responseError;

        // Update approval request status
        await supabase
          .from('approval_requests')
          .update({ 
            status: data.decision === 'approved' ? 'approved' : 
                   data.decision === 'rejected' ? 'rejected' : 'revision_required',
            updated_at: new Date().toISOString()
          })
          .eq('id', data.approval_request_id);

        console.log('✅ [Communications API] Approval response submitted successfully');
        return NextResponse.json({ success: true, response: responseData });

      case 'mark_notification_read':
        // Mark notification as read
        const { error: notificationError } = await supabase
          .from('notifications')
          .update({ 
            is_read: true,
            read_at: new Date().toISOString()
          })
          .eq('id', data.notification_id);

        if (notificationError) throw notificationError;

        console.log('✅ [Communications API] Notification marked as read');
        return NextResponse.json({ success: true });

      case 'create_broadcast':
        // Create a broadcast message/notification
        const { data: broadcastData, error: broadcastError } = await supabase
          .from('notifications')
          .insert(
            data.recipients.map((recipient: string) => ({
              user_id: recipient,
              project_id: data.project_id,
              notification_type: 'system',
              title: data.title,
              message: data.message,
              priority_level: data.priority_level || 'normal'
            }))
          )
          .select();

        if (broadcastError) throw broadcastError;

        console.log('✅ [Communications API] Broadcast sent successfully');
        return NextResponse.json({ success: true, notifications: broadcastData });

      default:
        console.log('❌ [Communications API] Unknown action:', action);
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('❌ [Communications API] POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to process communication request' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    console.log('🔍 Fetching user activity for:', userId);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get user's projects for filtering
    const { data: userProjects } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('client_id', userId);

    const projectIds = userProjects?.map(p => p.id) || [];

    // Collect activities from multiple tables
    const activities: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      projectName?: string;
      timestamp: string;
      category: string;
      icon: string;
      color: string;
      metadata?: any;
    }> = [];

    // Project activities
    if (projectIds.length > 0) {
      const { data: projectUpdates } = await supabaseAdmin
        .from('project_updates')
        .select(`
          id, title, description, created_at, update_type,
          projects(project_name)
        `)
        .in('project_id', projectIds)
        .order('created_at', { ascending: false })
        .limit(20);

      projectUpdates?.forEach(update => {
        activities.push({
          id: update.id,
          type: 'project_update',
          title: update.title,
          description: update.description,
          projectName: (update.projects as any)?.project_name,
          timestamp: update.created_at,
          category: 'Project',
          icon: 'Building2',
          color: 'orange'
        });
      });

      // Payment activities
      const { data: payments } = await supabaseAdmin
        .from('payments')
        .select(`
          id, amount, description, payment_date, payment_method, status,
          projects(project_name)
        `)
        .in('project_id', projectIds)
        .order('payment_date', { ascending: false })
        .limit(20);

      payments?.forEach(payment => {
        activities.push({
          id: payment.id,
          type: 'payment',
          title: `Payment of $${payment.amount?.toLocaleString()}`,
          description: payment.description,
          projectName: (payment.projects as any)?.project_name,
          timestamp: payment.payment_date,
          category: 'Finance',
          icon: 'CreditCard',
          color: 'green',
          metadata: {
            amount: payment.amount,
            method: payment.payment_method,
            status: payment.status
          }
        });
      });

      // Document activities
      const { data: documents } = await supabaseAdmin
        .from('documents')
        .select(`
          id, document_name, document_type, approval_status, created_at,
          projects(project_name)
        `)
        .in('project_id', projectIds)
        .order('created_at', { ascending: false })
        .limit(20);

      documents?.forEach(doc => {
        activities.push({
          id: doc.id,
          type: 'document',
          title: `Document: ${doc.document_name}`,
          description: `${doc.document_type} - ${doc.approval_status}`,
          projectName: (doc.projects as any)?.project_name,
          timestamp: doc.created_at,
          category: 'Documents',
          icon: 'FileText',
          color: 'blue'
        });
      });

      // Quality inspection activities
      const { data: inspections } = await supabaseAdmin
        .from('quality_inspections')
        .select(`
          id, inspection_type, inspection_status, overall_score, inspection_date,
          projects(project_name)
        `)
        .in('project_id', projectIds)
        .order('inspection_date', { ascending: false })
        .limit(15);

      inspections?.forEach(inspection => {
        activities.push({
          id: inspection.id,
          type: 'quality_inspection',
          title: `${inspection.inspection_type} Inspection`,
          description: `Status: ${inspection.inspection_status} • Score: ${inspection.overall_score || 'N/A'}`,
          projectName: (inspection.projects as any)?.project_name,
          timestamp: inspection.inspection_date,
          category: 'Quality',
          icon: 'CheckCircle',
          color: 'purple'
        });
      });

      // Approval requests
      const { data: approvals } = await supabaseAdmin
        .from('approval_requests')
        .select(`
          id, title, request_type, status, created_at,
          projects(project_name)
        `)
        .eq('requested_by', userId)
        .order('created_at', { ascending: false })
        .limit(15);

      approvals?.forEach(approval => {
        activities.push({
          id: approval.id,
          type: 'approval_request',
          title: approval.title,
          description: `${approval.request_type} - ${approval.status}`,
          projectName: (approval.projects as any)?.project_name,
          timestamp: approval.created_at,
          category: 'Approvals',
          icon: 'Clock',
          color: 'amber'
        });
      });
    }

    // Message activities
    const { data: messages } = await supabaseAdmin
      .from('messages')
      .select(`
        id, message_text, message_type, created_at,
        conversations(conversation_name, project_id),
        projects(project_name)
      `)
      .eq('sender_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    messages?.forEach(message => {
      activities.push({
        id: message.id,
        type: 'message',
        title: `Message: ${(message.conversations as any)?.conversation_name || 'Direct Message'}`,
        description: message.message_text?.substring(0, 100) + (message.message_text?.length > 100 ? '...' : ''),
        projectName: (message.projects as any)?.project_name,
        timestamp: message.created_at,
        category: 'Communication',
        icon: 'MessageCircle',
        color: 'blue'
      });
    });

    // Notification activities
    const { data: notifications } = await supabaseAdmin
      .from('notifications')
      .select(`
        id, title, message, notification_type, created_at, is_read,
        projects(project_name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(25);

    notifications?.forEach(notification => {
      activities.push({
        id: notification.id,
        type: 'notification',
        title: notification.title,
        description: notification.message,
        projectName: (notification.projects as any)?.project_name,
        timestamp: notification.created_at,
        category: 'Notifications',
        icon: 'Bell',
        color: notification.is_read ? 'gray' : 'red'
      });
    });

    // Sort all activities by timestamp (most recent first)
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(offset, offset + limit);

    // Group activities by date for timeline display
    const groupedActivities = sortedActivities.reduce((groups, activity) => {
      const date = new Date(activity.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
      return groups;
    }, {} as Record<string, typeof activities>);

    const timeline = Object.entries(groupedActivities).map(([date, dayActivities]) => ({
      date,
      activities: dayActivities
    }));

    console.log('✅ User activity timeline compiled successfully');
    return NextResponse.json({
      timeline,
      totalActivities: activities.length,
      hasMore: activities.length > offset + limit
    });

  } catch (error) {
    console.error('❌ Error fetching user activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user activity' },
      { status: 500 }
    );
  }
} 
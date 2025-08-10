import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the admin user ID
    const adminUserId = '9021dca2-2960-4bb5-b79a-dc3bb50247f4';
    
    // Fetch recent message notifications to analyze their metadata
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('notification_type', 'message')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      });
    }

    // Analyze each notification
    const analysis = notifications?.map(notif => {
      const metadata = notif.metadata || {};
      const isAdminSender = metadata.sender_id === adminUserId;
      
      return {
        id: notif.id,
        title: notif.title,
        created_at: notif.created_at,
        user_id: notif.user_id,
        metadata: {
          sender_id: metadata.sender_id,
          sender_name: metadata.sender_name,
          source: metadata.source,
          created_by: metadata.created_by,
          admin_action: metadata.admin_action,
          from_admin: metadata.from_admin
        },
        analysis: {
          isAdminSender,
          shouldBeFiltered: isAdminSender,
          currentFilterChecks: {
            'metadata.sender_id === adminUserId': metadata.sender_id === adminUserId,
            'metadata.created_by === "admin"': metadata.created_by === 'admin',
            'metadata.admin_action === true': metadata.admin_action === true,
            'metadata.from_admin === true': metadata.from_admin === true,
            'metadata.source === "admin_dashboard"': metadata.source === 'admin_dashboard',
            'metadata.source === "admin_panel"': metadata.source === 'admin_panel'
          }
        }
      };
    }) || [];

    return NextResponse.json({
      success: true,
      adminUserId,
      totalNotifications: notifications?.length || 0,
      notifications: analysis,
      summary: {
        adminSentMessages: analysis.filter(n => n.analysis.isAdminSender).length,
        shouldBeFilteredCount: analysis.filter(n => n.analysis.shouldBeFiltered).length,
        filteringIssues: analysis.filter(n => n.analysis.isAdminSender && !Object.values(n.analysis.currentFilterChecks).some(check => check))
      }
    });

  } catch (error) {
    console.error('Notification metadata check error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
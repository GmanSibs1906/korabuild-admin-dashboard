import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [Test Notification] Creating test notification...');

    // Get all admin users
    const { data: adminUsers, error: adminError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role')
      .eq('role', 'admin');

    if (adminError) {
      console.error('❌ Error fetching admin users:', adminError);
      return NextResponse.json({ error: 'Failed to fetch admin users' }, { status: 500 });
    }

    if (!adminUsers || adminUsers.length === 0) {
      return NextResponse.json({ error: 'No admin users found' }, { status: 404 });
    }

    // Create a test notification for each admin user
    const testNotifications = adminUsers.map(admin => ({
      user_id: admin.id,
      project_id: null,
      notification_type: 'message',
      title: `🧪 Test Notification - ${new Date().toLocaleTimeString()}`,
      message: `This is a test notification to check real-time functionality. Created at ${new Date().toLocaleString()}`,
      entity_id: null,
      entity_type: 'test',
      priority_level: 'normal',
      is_read: false,
      action_url: '/communications',
      conversation_id: null,
      metadata: {
        test: true,
        created_by: 'debug_api',
        timestamp: new Date().toISOString()
      },
      priority: 'normal',
      is_pushed: false,
      is_sent: false
    }));

    console.log(`🧪 Creating ${testNotifications.length} test notifications for admin users:`, 
      adminUsers.map(u => ({ id: u.id, email: u.email, name: u.full_name }))
    );

    const { data: notificationResult, error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert(testNotifications)
      .select();

    if (notificationError) {
      console.error('❌ [Test Notification] Error creating notifications:', notificationError);
      return NextResponse.json({ 
        error: 'Failed to create test notifications', 
        details: notificationError 
      }, { status: 500 });
    }

    console.log('✅ [Test Notification] Successfully created test notifications:', notificationResult);

    return NextResponse.json({
      success: true,
      message: 'Test notifications created successfully',
      data: {
        notificationsCreated: notificationResult?.length || 0,
        adminUsers: adminUsers.length,
        notifications: notificationResult
      }
    });

  } catch (error) {
    console.error('❌ [Test Notification] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create test notification', details: error },
      { status: 500 }
    );
  }
} 
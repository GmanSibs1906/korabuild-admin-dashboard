import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [Test] Creating test new user notification...');

    // Get all admin users first
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('role', 'admin');

    if (adminError) {
      throw new Error(`Failed to fetch admin users: ${adminError.message}`);
    }

    if (!adminUsers || adminUsers.length === 0) {
      throw new Error('No admin users found');
    }

    const testUserName = `Test User ${new Date().toLocaleTimeString()}`;
    const testUserEmail = `test.${Date.now()}@example.com`;
    const testUserId = crypto.randomUUID();

    // Create priority notifications for all admin users
    const notifications = adminUsers.map(admin => ({
      user_id: admin.id,
      notification_type: 'system' as const,
      title: `🎉 New User Registered: ${testUserName}`,
      message: `A new client has joined the platform. Review their profile to ensure they have a project setup.`,
      entity_id: testUserId,
      entity_type: 'user',
      priority_level: 'urgent' as const,
      is_read: false,
      metadata: {
        user_id: testUserId,
        user_name: testUserName,
        user_email: testUserEmail,
        user_role: 'client',
        registration_time: new Date().toISOString(),
        source: 'test_api',
        priority_alert: true,
        notification_subtype: 'user_created'
      },
      priority: 'urgent',
      is_pushed: false,
      is_sent: false
    }));

    const { data: notificationResult, error: notificationError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notificationError) {
      throw new Error(`Failed to create notifications: ${notificationError.message}`);
    }

    console.log(`✅ [Test] Created priority notifications for ${adminUsers.length} admin users`);

    return NextResponse.json({
      success: true,
      message: 'Test new user priority notification created successfully!',
      data: {
        test_user: {
          name: testUserName,
          email: testUserEmail,
          role: 'client'
        },
        notifications: {
          created: adminUsers.length,
          admin_users: adminUsers.length,
          type: 'user_created',
          priority: 'urgent',
          persistent_alerts: true
        }
      },
      instructions: 'Check the control center for the priority notification with persistent 30-second sound alerts!'
    });

  } catch (error) {
    console.error('❌ [Test] Error creating new user notification:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to create test new user notification'
      },
      { status: 500 }
    );
  }
} 
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST() {
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
    
    const adminUserId = '9021dca2-2960-4bb5-b79a-dc3bb50247f4'; // Your admin user ID
    
    // Test 1: Create a notification that looks like an admin-sent message
    const adminMessageNotification = {
      user_id: adminUserId,
      title: 'Admin Message Test',
      message: 'This notification should be filtered out',
      notification_type: 'message' as const,
      priority_level: 'normal' as const,
      is_read: false,
      metadata: {
        test: true,
        sender_id: adminUserId, // Admin sent this message
        sender_name: 'Admin User',
        source: 'admin_dashboard',
        message_type: 'text'
      }
    };

    // Test 2: Create a notification from a mobile user (should NOT be filtered)
    const mobileUserNotification = {
      user_id: adminUserId,
      title: 'Mobile User Message',
      message: 'This notification should NOT be filtered',
      notification_type: 'message' as const,
      priority_level: 'normal' as const,
      is_read: false,
      metadata: {
        test: true,
        sender_id: '8907e679-d31e-4418-a369-68205ab0e34f', // Different user (mobile)
        sender_name: 'Mobile User',
        source: 'mobile_app',
        message_type: 'text'
      }
    };

    // Insert both notifications
    const { data: insertedNotifications, error: insertError } = await supabase
      .from('notifications')
      .insert([adminMessageNotification, mobileUserNotification])
      .select();

    if (insertError) {
      return NextResponse.json({
        success: false,
        error: insertError.message,
        details: insertError
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Admin message filter test notifications created',
      notifications: insertedNotifications?.map(n => ({
        id: n.id,
        title: n.title,
        sender_id: n.metadata?.sender_id,
        source: n.metadata?.source
      })),
      expected_behavior: [
        '1. "Admin Message Test" - Should be FILTERED OUT (no toast/sound)',
        '2. "Mobile User Message" - Should show toast/sound (legitimate message)',
        'Check browser console for filtering logs'
      ]
    });

  } catch (error) {
    console.error('Admin message filter test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
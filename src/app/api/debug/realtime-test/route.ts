import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Use service role key for admin access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Test basic database access
    const { data: notifications, error: dbError } = await supabase
      .from('notifications')
      .select('id, title, created_at, user_id')
      .limit(5);

    // Test if we can insert (for real-time testing)
    const testNotification = {
      user_id: '550e8400-e29b-41d4-a716-446655440000', // dummy user ID for test
      title: 'Real-time Test Notification',
      message: 'This is a test notification to check real-time functionality',
      notification_type: 'system' as const,
      priority_level: 'low' as const,
      is_read: false,
      metadata: {
        test: true,
        created_by: 'api_test'
      }
    };

    const { data: insertedNotification, error: insertError } = await supabase
      .from('notifications')
      .insert(testNotification)
      .select()
      .single();

    // Clean up test notification
    if (insertedNotification) {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', insertedNotification.id);
    }

    return NextResponse.json({
      success: true,
      databaseAccess: {
        canRead: !dbError,
        canInsert: !insertError,
        notificationCount: notifications?.length || 0,
        readError: dbError?.message,
        insertError: insertError?.message
      },
      testResults: {
        databaseConnectionWorking: !dbError,
        insertPermissionsWorking: !insertError,
        realTimeSetupReady: !dbError && !insertError
      },
      troubleshooting: {
        message: "If real-time still doesn't work, check:",
        steps: [
          "1. Supabase project settings → API → Real-time enabled",
          "2. Row Level Security policies allow SELECT on notifications table",
          "3. Browser console for WebSocket connection errors",
          "4. Network tab for failed WebSocket handshake",
          "5. Check if real-time subscriptions are enabled for your plan"
        ]
      }
    });

  } catch (error) {
    console.error('Real-time test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
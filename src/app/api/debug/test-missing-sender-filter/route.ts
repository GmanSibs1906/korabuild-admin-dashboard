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
    
    // Known admin user ID
    const adminUser1 = '9021dca2-2960-4bb5-b79a-dc3bb50247f4'; // Kora Team (you)
    
    // Create test notifications with missing/none sender IDs (like "Kora Team" messages)
    const testNotifications = [
      {
        user_id: adminUser1, // Notification FOR admin1
        title: 'Kora Team', // Simulating the actual problematic message
        message: 'This message has sender_id: none and should be FILTERED',
        notification_type: 'message' as const,
        priority_level: 'normal' as const,
        is_read: false,
        metadata: {
          test: true,
          sender_id: 'none', // This is the problematic case
          sender_name: 'Kora Team',
          source: 'database_trigger'
        }
      },
      {
        user_id: adminUser1, // Notification FOR admin1  
        title: 'System Message',
        message: 'This message has missing sender_id and should be FILTERED',
        notification_type: 'message' as const,
        priority_level: 'normal' as const,
        is_read: false,
        metadata: {
          test: true,
          // sender_id is completely missing
          sender_name: 'System',
          source: 'automated_process'
        }
      },
      {
        user_id: adminUser1, // Notification FOR admin1  
        title: 'Empty Sender Message',
        message: 'This message has empty sender_id and should be FILTERED',
        notification_type: 'message' as const,
        priority_level: 'normal' as const,
        is_read: false,
        metadata: {
          test: true,
          sender_id: '', // Empty string
          sender_name: 'Empty Sender',
          source: 'database_trigger'
        }
      }
    ];
    
    const { data: notificationResult, error: notificationError } = await supabase
      .from('notifications')
      .insert(testNotifications)
      .select();
      
    if (notificationError) {
      console.error('❌ Error creating test notifications:', notificationError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create test notifications',
        details: notificationError
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Missing sender ID filter test notifications created',
      notifications: notificationResult?.map(n => ({
        id: n.id,
        title: n.title,
        sender_id: n.metadata?.sender_id || 'missing',
        source: n.metadata?.source
      })),
      expected_behavior: [
        '1. "Kora Team" - Should be FILTERED OUT (sender_id: "none")',
        '2. "System Message" - Should be FILTERED OUT (missing sender_id)',
        '3. "Empty Sender Message" - Should be FILTERED OUT (sender_id: "")',
        'All three should be filtered and NOT appear in the notifications list',
        'Check browser console for filtering logs with 🚨 [Missing Sender] warnings'
      ]
    });
    
  } catch (error) {
    console.error('❌ Error in missing sender filter test:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
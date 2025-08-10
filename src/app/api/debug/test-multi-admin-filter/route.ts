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
    
    // Known admin user IDs
    const adminUser1 = '9021dca2-2960-4bb5-b79a-dc3bb50247f4'; // Kora Team (you)
    const adminUser2 = '6849994a-db1c-40e0-bdc0-8b2780ce2e8d'; // KoraBuild Admin
    const clientUser = '8907e679-d31e-4418-a369-68205ab0e34f'; // Mr Gladman (client)
    
    // Create test notifications from different users
    const testNotifications = [
      {
        user_id: adminUser1, // Notification FOR admin1
        title: 'Message from Admin2 to Admin1',
        message: 'This should be FILTERED (admin to admin)',
        notification_type: 'message' as const,
        priority_level: 'normal' as const,
        is_read: false,
        metadata: {
          test: true,
          sender_id: adminUser2, // FROM admin2
          sender_name: 'KoraBuild Admin',
          source: 'database_trigger'
        }
      },
      {
        user_id: adminUser1, // Notification FOR admin1  
        title: 'Message from Client to Admin1',
        message: 'This should NOT be filtered (client to admin)',
        notification_type: 'message' as const,
        priority_level: 'normal' as const,
        is_read: false,
        metadata: {
          test: true,
          sender_id: clientUser, // FROM client
          sender_name: 'Mr Gladman',
          source: 'database_trigger'
        }
      },
      {
        user_id: adminUser2, // Notification FOR admin2
        title: 'Message from Admin1 to Admin2', 
        message: 'This should be FILTERED (admin to admin)',
        notification_type: 'message' as const,
        priority_level: 'normal' as const,
        is_read: false,
        metadata: {
          test: true,
          sender_id: adminUser1, // FROM admin1
          sender_name: 'Kora Team',
          source: 'database_trigger'
        }
      }
    ];

    // Insert test notifications
    const { data: insertedNotifications, error: insertError } = await supabase
      .from('notifications')
      .insert(testNotifications)
      .select();

    if (insertError) {
      return NextResponse.json({
        success: false,
        error: insertError.message
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Multi-admin filtering test notifications created',
      notifications: insertedNotifications?.map(n => ({
        id: n.id,
        title: n.title,
        for_user: n.user_id,
        from_user: n.metadata?.sender_id,
        expected_filtering: n.metadata?.sender_id === adminUser1 || n.metadata?.sender_id === adminUser2
          ? 'SHOULD BE FILTERED (admin sender)'
          : 'SHOULD NOT be filtered (client sender)'
      })),
      test_cases: [
        {
          case: 'Admin2 → Admin1',
          expected: 'FILTERED OUT (no notification for admin1)',
          reason: 'Messages between admins should be filtered'
        },
        {
          case: 'Client → Admin1', 
          expected: 'SHOW NOTIFICATION (admin1 gets notified)',
          reason: 'Client messages to admin should be shown'
        },
        {
          case: 'Admin1 → Admin2',
          expected: 'FILTERED OUT (no notification for admin2)', 
          reason: 'Messages between admins should be filtered'
        }
      ],
      instructions: [
        'Check browser console for admin filtering logs',
        'Admin-to-admin messages should be filtered out',
        'Client-to-admin messages should show normally'
      ]
    });

  } catch (error) {
    console.error('Multi-admin filter test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
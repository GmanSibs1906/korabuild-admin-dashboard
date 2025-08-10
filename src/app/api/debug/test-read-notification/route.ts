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
    
    // First, create an unread notification
    const testNotification = {
      user_id: '9021dca2-2960-4bb5-b79a-dc3bb50247f4',
      title: 'Read State Test Notification',
      message: 'This tests the read state tracking',
      notification_type: 'system' as const,
      priority_level: 'normal' as const,
      is_read: false,
      metadata: {
        test: true,
        read_state_test: true,
        created_by: 'read_state_test_api'
      }
    };

    const { data: insertedNotification, error: insertError } = await supabase
      .from('notifications')
      .insert(testNotification)
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({
        success: false,
        error: insertError.message,
        details: insertError
      });
    }

    // Wait 2 seconds then mark it as read
    setTimeout(async () => {
      console.log('Marking test notification as read after 2 seconds...');
      await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', insertedNotification.id);
      
      console.log('Test notification marked as read');
    }, 2000);

    return NextResponse.json({
      success: true,
      message: 'Read state test notification created',
      notification: {
        id: insertedNotification.id,
        title: insertedNotification.title,
        created_at: insertedNotification.created_at
      },
      test_steps: [
        '1. Notification created as UNREAD - should show toast/sound',
        '2. After 2 seconds, notification marked as READ automatically',  
        '3. Future polling should NOT show toast/sound for this notification',
        '4. Check console logs to verify behavior'
      ]
    });

  } catch (error) {
    console.error('Read state test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
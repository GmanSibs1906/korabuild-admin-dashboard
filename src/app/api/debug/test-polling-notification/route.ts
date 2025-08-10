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
    
    // Create a test notification
    const testNotification = {
      user_id: '9021dca2-2960-4bb5-b79a-dc3bb50247f4', // Your user ID from logs
      title: 'Polling Test Notification',
      message: 'This notification tests the polling system',
      notification_type: 'system' as const,
      priority_level: 'normal' as const,
      is_read: false,
      metadata: {
        test: true,
        polling_test: true,
        created_by: 'polling_test_api'
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

    return NextResponse.json({
      success: true,
      message: 'Test notification created successfully',
      notification: {
        id: insertedNotification.id,
        title: insertedNotification.title,
        created_at: insertedNotification.created_at
      },
      instructions: [
        'Check your browser console for polling logs',
        'The notification should appear within 5 seconds',
        'You should see toast notification and hear sound',
        'No real-time binding errors should occur'
      ]
    });

  } catch (error) {
    console.error('Test notification error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
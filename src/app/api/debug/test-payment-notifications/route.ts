import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [NOTIFICATION TEST] Testing payment notification triggers...');

    const { projectId } = await request.json();
    
    // Step 1: Check if notifications table exists and what structure it has
    const { data: notificationsCheck, error: notifError } = await supabaseAdmin
      .from('notifications')
      .select('count')
      .limit(1);

    if (notifError) {
      return NextResponse.json({
        success: false,
        step: 'notifications_table_check',
        error: notifError,
        message: 'notifications table might not exist or be accessible'
      });
    }

    // Step 2: Get project owner for the test
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, project_name, client_id, users:client_id(id, full_name, email)')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({
        success: false,
        step: 'project_lookup',
        error: projectError,
        message: 'Could not find project or project owner'
      });
    }

    console.log('🔍 [NOTIFICATION TEST] Project owner:', project.users);

    // Step 3: Count current notifications for this user
    const { data: currentNotifications, error: countError } = await supabaseAdmin
      .from('notifications')
      .select('id, title, message, created_at')
      .eq('user_id', project.client_id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (countError) {
      return NextResponse.json({
        success: false,
        step: 'notifications_count',
        error: countError
      });
    }

    const beforeCount = currentNotifications?.length || 0;
    console.log('🔍 [NOTIFICATION TEST] Current notifications count:', beforeCount);

    // Step 4: Create a test payment to trigger the notification
    const { data: testPayment, error: paymentError } = await supabaseAdmin
      .from('enhanced_credit_accounts')
      .insert({
        project_id: projectId,
        payment_amount: 1000,
        payment_sequence: 1,
        total_payments: 1,
        total_amount: 1000,
        next_payment_date: '2025-09-01',
        credit_terms: 'TEST NOTIFICATION',
        credit_status: 'active',
        notes: 'Test payment for notification debugging',
        credit_limit: 0,
        used_credit: 0,
        interest_rate: 0,
        monthly_payment: 1000,
      })
      .select('id')
      .single();

    if (paymentError) {
      return NextResponse.json({
        success: false,
        step: 'test_payment_creation',
        error: paymentError,
        message: 'Failed to create test payment - trigger might not fire'
      });
    }

    console.log('✅ [NOTIFICATION TEST] Test payment created:', testPayment.id);

    // Step 5: Wait a moment for trigger to fire, then check notifications again
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { data: newNotifications, error: newCountError } = await supabaseAdmin
      .from('notifications')
      .select('id, title, message, created_at, metadata')
      .eq('user_id', project.client_id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (newCountError) {
      return NextResponse.json({
        success: false,
        step: 'new_notifications_count',
        error: newCountError
      });
    }

    const afterCount = newNotifications?.length || 0;
    const notificationCreated = afterCount > beforeCount;
    
    console.log('🔍 [NOTIFICATION TEST] After payment creation - notifications count:', afterCount);
    console.log('🔍 [NOTIFICATION TEST] Notification created:', notificationCreated);

    // Step 6: Clean up test payment
    await supabaseAdmin
      .from('enhanced_credit_accounts')
      .delete()
      .eq('id', testPayment.id);

    // Step 7: If notification was created, clean it up too
    if (notificationCreated && newNotifications && newNotifications.length > 0) {
      const latestNotification = newNotifications[0];
      if (latestNotification.title?.includes('Payment Scheduled')) {
        await supabaseAdmin
          .from('notifications')
          .delete()
          .eq('id', latestNotification.id);
        console.log('🧹 [NOTIFICATION TEST] Cleaned up test notification');
      }
    }

    return NextResponse.json({
      success: true,
      results: {
        project_owner: project.users,
        notifications_before: beforeCount,
        notifications_after: afterCount,
        notification_created: notificationCreated,
        trigger_working: notificationCreated,
        latest_notifications: newNotifications?.slice(0, 3) || [],
        test_payment_id: testPayment.id
      },
      analysis: {
        trigger_status: notificationCreated ? 'WORKING' : 'NOT FIRING',
        next_steps: notificationCreated 
          ? 'Trigger works - check mobile app Realtime subscription'
          : 'Trigger not working - check trigger functions and permissions'
      }
    });

  } catch (error) {
    console.error('❌ [NOTIFICATION TEST] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
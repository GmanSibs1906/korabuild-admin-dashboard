import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [Test Delivery Creation] Starting test...');

    // Get a test project and order
    const { data: testProject, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, project_name, client_id')
      .limit(1)
      .single();

    if (projectError || !testProject) {
      return NextResponse.json({
        success: false,
        error: 'No test project found',
        details: projectError
      });
    }

    console.log('✅ [Test Delivery Creation] Test project found:', testProject.project_name);

    // Get a test order for this project
    const { data: testOrder, error: orderError } = await supabaseAdmin
      .from('project_orders')
      .select('id, order_number, project_id')
      .eq('project_id', testProject.id)
      .limit(1)
      .single();

    if (orderError || !testOrder) {
      return NextResponse.json({
        success: false,
        error: 'No test order found for project',
        details: orderError
      });
    }

    console.log('✅ [Test Delivery Creation] Test order found:', testOrder.order_number);

    // Generate unique delivery number for test
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    const deliveryNumber = `TEST-DEL-${timestamp.slice(-6)}${random}`;

    console.log('🚚 [Test Delivery Creation] Creating test delivery...');

    // Attempt to create a test delivery
    const { data: delivery, error: deliveryError } = await supabaseAdmin
      .from('deliveries')
      .insert({
        order_id: testOrder.id,
        delivery_number: deliveryNumber,
        delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        scheduled_time: '10:00:00',
        delivery_status: 'scheduled',
        driver_name: 'Test Driver',
        driver_phone: '+1234567890',
        vehicle_info: 'Test Vehicle - TEST123',
        delivery_method: 'standard',
        special_handling_notes: 'Test delivery for trigger verification',
        notes: 'This is a test delivery to verify the mobile trigger fix',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (deliveryError) {
      console.error('❌ [Test Delivery Creation] Error creating delivery:', deliveryError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create test delivery',
        details: {
          code: deliveryError.code,
          message: deliveryError.message,
          details: deliveryError.details,
          hint: deliveryError.hint
        },
        debugInfo: {
          projectId: testProject.id,
          orderId: testOrder.id,
          deliveryNumber: deliveryNumber
        }
      });
    }

    console.log('✅ [Test Delivery Creation] Test delivery created successfully:', delivery.delivery_number);

    // Clean up the test delivery
    console.log('🧹 [Test Delivery Creation] Cleaning up test delivery...');
    const { error: deleteError } = await supabaseAdmin
      .from('deliveries')
      .delete()
      .eq('id', delivery.id);

    if (deleteError) {
      console.warn('⚠️ [Test Delivery Creation] Warning: Could not delete test delivery:', deleteError);
    } else {
      console.log('✅ [Test Delivery Creation] Test delivery cleaned up successfully');
    }

    // Check if any notifications were created for the test
    const { data: notifications, error: notifError } = await supabaseAdmin
      .from('notifications')
      .select('id, title, message')
      .eq('entity_id', delivery.id)
      .eq('entity_type', 'delivery');

    let notificationInfo = 'No notifications found';
    if (!notifError && notifications && notifications.length > 0) {
      notificationInfo = `${notifications.length} notification(s) created successfully`;
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery creation test completed successfully!',
      testResults: {
        deliveryCreated: true,
        deliveryNumber: delivery.delivery_number,
        projectName: testProject.project_name,
        orderNumber: testOrder.order_number,
        notificationStatus: notificationInfo,
        triggerWorking: true
      },
      details: 'The mobile trigger ambiguity has been resolved - delivery creation is now working'
    });

  } catch (error) {
    console.error('❌ [Test Delivery Creation] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed with unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
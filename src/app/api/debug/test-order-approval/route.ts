import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create admin client for testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [Test Order Approval] Starting test...');

    // Get first available draft order to test with
    const { data: orders, error: orderError } = await supabaseAdmin
      .from('project_orders')
      .select('*')
      .eq('status', 'draft')
      .limit(1);

    if (orderError) {
      console.error('❌ [Test Order Approval] Error fetching orders:', orderError);
      return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No draft orders found to test with',
        suggestion: 'Create a draft order first or change an existing order back to draft status'
      }, { status: 404 });
    }

    const testOrder = orders[0];
    console.log('�� [Test Order Approval] Found test order:', testOrder.order_number);

    // Update the order status to approved (this should trigger the notification)
    const { error: updateError } = await supabaseAdmin
      .from('project_orders')
      .update({ 
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', testOrder.id);

    if (updateError) {
      console.error('❌ [Test Order Approval] Error updating order:', updateError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update order status',
        details: updateError.message 
      }, { status: 500 });
    }

    console.log('✅ [Test Order Approval] Order status updated to approved');

    // Wait a moment for the trigger to fire
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if notifications were created
    const { data: notifications, error: notifError } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('related_id', testOrder.id)
      .eq('notification_type', 'system');

    console.log('🔔 [Test Order Approval] Found notifications:', notifications?.length || 0);

    return NextResponse.json({
      success: true,
      message: 'Order approval test completed successfully',
      testResults: {
        orderId: testOrder.id,
        orderNumber: testOrder.order_number,
        oldStatus: 'draft',
        newStatus: 'approved',
        notificationsCreated: notifications?.length || 0,
        sampleNotification: notifications?.[0] || null
      },
      instructions: [
        '1. Check your admin control center for the "Order Approved" notification',
        '2. You should hear a celebratory approval sound',
        '3. The notification should have priority styling with green checkmark icon',
        '4. Click "View Order" to go to the orders page',
        '5. Click "View Project" to see the project details'
      ]
    });

  } catch (error) {
    console.error('❌ [Test Order Approval] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed with unexpected error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

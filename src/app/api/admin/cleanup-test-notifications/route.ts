import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
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

    console.log('🧹 Starting cleanup of test notification data...');

    // Clean up test documents
    const { data: testDocuments, error: docError } = await supabase
      .from('documents')
      .delete()
      .or('document_name.ilike.%Admin Notification Test%,metadata->test.eq.true')
      .select();

    if (docError) {
      console.error('❌ Error cleaning up test documents:', docError);
    } else {
      console.log(`✅ Cleaned up ${testDocuments?.length || 0} test documents`);
    }

    // Clean up test requests
    const { data: testRequests, error: reqError } = await supabase
      .from('requests')
      .delete()
      .or('title.ilike.%Admin Notification Test%,request_data->test.eq.true')
      .select();

    if (reqError) {
      console.error('❌ Error cleaning up test requests:', reqError);
    } else {
      console.log(`✅ Cleaned up ${testRequests?.length || 0} test requests`);
    }

    // Clean up test orders
    const { data: testOrders, error: orderError } = await supabase
      .from('project_orders')
      .delete()
      .or('order_number.ilike.TEST-ORDER-%,notes.ilike.%notification testing%')
      .select();

    if (orderError) {
      console.error('❌ Error cleaning up test orders:', orderError);
    } else {
      console.log(`✅ Cleaned up ${testOrders?.length || 0} test orders`);
    }

    // Clean up test contractor assignments
    const { data: testAssignments, error: assignmentError } = await supabase
      .from('project_contractors')
      .delete()
      .ilike('scope_of_work', '%notification testing%')
      .select();

    if (assignmentError) {
      console.error('❌ Error cleaning up test contractor assignments:', assignmentError);
    } else {
      console.log(`✅ Cleaned up ${testAssignments?.length || 0} test contractor assignments`);
    }

    // Clean up test notifications
    const { data: testNotifications, error: notifError } = await supabase
      .from('notifications')
      .delete()
      .or('title.ilike.%Test%,message.ilike.%test%,metadata->test.eq.true,metadata->notification_test.neq.null')
      .select();

    if (notifError) {
      console.error('❌ Error cleaning up test notifications:', notifError);
    } else {
      console.log(`✅ Cleaned up ${testNotifications?.length || 0} test notifications`);
    }

    const summary = {
      documents_cleaned: testDocuments?.length || 0,
      requests_cleaned: testRequests?.length || 0,
      orders_cleaned: testOrders?.length || 0,
      assignments_cleaned: testAssignments?.length || 0,
      notifications_cleaned: testNotifications?.length || 0
    };

    return NextResponse.json({
      success: true,
      message: 'Test notification data cleanup completed',
      summary,
      total_items_cleaned: Object.values(summary).reduce((a, b) => a + b, 0)
    });

  } catch (error) {
    console.error('❌ Error in cleanup:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
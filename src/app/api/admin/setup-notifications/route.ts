import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Setting up admin notifications table...');

    // Try to insert a test notification to see if table exists
    const { error: testError } = await supabase
      .from('admin_notifications')
      .select('id')
      .limit(1);

    if (testError && testError.message.includes('relation "admin_notifications" does not exist')) {
      console.log('Table does not exist, but we cannot create it via client. Please run the SQL manually.');
      
      return NextResponse.json({
        success: false,
        error: 'Table does not exist and cannot be created via API',
        message: 'Please run the SQL migration manually in Supabase dashboard',
        sql_file: 'sql/create_admin_notifications_table.sql'
      }, { status: 400 });
    }

    // If we reach here, table exists, let's just insert a test notification
    const { error: seedError } = await supabase
      .from('admin_notifications')
      .upsert({
        id: '00000000-0000-0000-0000-000000000001',
        type: 'system_critical',
        category: 'system',
        priority: 'medium',
        title: 'Admin Notification System Test',
        message: 'Testing admin notification system functionality.',
        action_required: false,
        entity_type: 'system',
        is_read: false
      });

    if (seedError) {
      throw seedError;
    }

    console.log('✅ Admin notifications table is ready!');

    return NextResponse.json({
      success: true,
      message: 'Admin notifications table is working correctly',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error with admin notifications:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
} 
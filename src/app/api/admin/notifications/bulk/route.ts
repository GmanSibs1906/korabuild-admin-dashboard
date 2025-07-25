import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(request: NextRequest) {
  try {
    const { action, ids } = await request.json();
    
    console.log(`🔄 Bulk ${action} notifications:`, ids?.length || 'all');

    let updateData: any = {
      updated_at: new Date().toISOString(),
    };

    switch (action) {
      case 'mark_all_read':
        updateData.is_read = true;
        updateData.read_at = new Date().toISOString();
        break;
      
      case 'dismiss_all':
        updateData.is_dismissed = true;
        updateData.dismissed_at = new Date().toISOString();
        break;
      
      default:
        throw new Error(`Invalid bulk action: ${action}`);
    }

    let query = supabase
      .from('admin_notifications')
      .update(updateData);

    if (ids && ids.length > 0) {
      // Update specific notifications
      query = query.in('id', ids);
    } else {
      // Update all unread notifications
      query = query.eq('is_read', false).eq('is_dismissed', false);
    }

    const { data, error } = await query.select();

    if (error) {
      throw error;
    }

    console.log(`✅ Successfully bulk ${action}:`, data?.length || 0, 'notifications');

    return NextResponse.json({
      success: true,
      updatedCount: data?.length || 0,
      action,
      notifications: data || []
    });

  } catch (error) {
    console.error(`❌ Error in bulk notification update:`, error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
} 
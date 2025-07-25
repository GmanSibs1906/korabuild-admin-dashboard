import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notificationId = params.id;
    const { action } = await request.json();
    
    console.log(`🔄 ${action} notification:`, notificationId);

    let updateData: any = {
      updated_at: new Date().toISOString(),
    };

    switch (action) {
      case 'mark_read':
        updateData.is_read = true;
        updateData.read_at = new Date().toISOString();
        break;
      
      case 'acknowledge':
        updateData.is_acknowledged = true;
        updateData.acknowledged_at = new Date().toISOString();
        break;
      
      case 'dismiss':
        updateData.is_dismissed = true;
        updateData.dismissed_at = new Date().toISOString();
        break;
      
      default:
        throw new Error(`Invalid action: ${action}`);
    }

    const { data, error } = await supabase
      .from('admin_notifications')
      .update(updateData)
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log(`✅ Successfully ${action} notification:`, data);

    return NextResponse.json({
      success: true,
      notification: data,
      action
    });

  } catch (error) {
    console.error(`❌ Error updating notification:`, error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notificationId = params.id;
    
    console.log('🗑️ Deleting notification:', notificationId);

    const { error } = await supabase
      .from('admin_notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      throw error;
    }

    console.log('✅ Successfully deleted notification:', notificationId);

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
} 
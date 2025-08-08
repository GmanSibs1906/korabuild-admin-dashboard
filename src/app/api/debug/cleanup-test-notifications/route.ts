import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function DELETE(request: NextRequest) {
  try {
    console.log('🧹 [Cleanup] Removing test notifications...');

    // Delete test notifications
    const { data: deletedNotifications, error: deleteError } = await supabaseAdmin
      .from('notifications')
      .delete()
      .or('title.ilike.%Test Notification%,entity_type.eq.test')
      .select();

    if (deleteError) {
      console.error('❌ Error deleting test notifications:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete test notifications', 
        details: deleteError 
      }, { status: 500 });
    }

    console.log('✅ [Cleanup] Successfully deleted test notifications:', deletedNotifications?.length || 0);

    return NextResponse.json({
      success: true,
      message: 'Test notifications cleaned up successfully',
      data: {
        deletedCount: deletedNotifications?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ [Cleanup] Error:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup test notifications', details: error },
      { status: 500 }
    );
  }
} 
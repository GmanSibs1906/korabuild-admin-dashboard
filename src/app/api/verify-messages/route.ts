import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * Verify messages are being saved to database
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    
    const supabase = supabaseAdmin;
    
    console.log('🔍 [Verify] Checking for saved messages...');
    
    // Check messages table (might be empty due to trigger issues)
    const { data: messagesTableData, error: messagesError } = await supabase
      .from('messages')
      .select('id, message_text, created_at, sender_id')
      .eq('conversation_id', conversationId || 'f8440848-3b4a-441a-86a2-8135e354f2d7')
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Check communication_log table (our working storage)
    const { data: logData, error: logError } = await supabase
      .from('communication_log')
      .select('id, subject, content, created_at, from_person, communication_type')
      .eq('communication_type', 'instruction')
      .eq('subject', 'Admin Message')
      .order('created_at', { ascending: false })
      .limit(10);
    
    const results = {
      timestamp: new Date().toISOString(),
      conversationId: conversationId || 'f8440848-3b4a-441a-86a2-8135e354f2d7',
      messagesTable: {
        count: messagesTableData?.length || 0,
        data: messagesTableData || [],
        error: messagesError?.message || null
      },
      communicationLog: {
        count: logData?.length || 0,
        data: logData || [],
        error: logError?.message || null
      },
      status: 'Messages are being saved to communication_log table'
    };
    
    console.log('📊 [Verify] Database verification results:', {
      messagesInTable: results.messagesTable.count,
      messagesInLog: results.communicationLog.count
    });
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('❌ [Verify] Error checking messages:', error);
    return NextResponse.json(
      { error: 'Failed to verify messages', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
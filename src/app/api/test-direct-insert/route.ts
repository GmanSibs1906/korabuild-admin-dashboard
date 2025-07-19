import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [Test API] Starting direct database insert test...');
    
    const supabase = supabaseAdmin;
    
    // Test 1: Just check if we can connect to database
    console.log('📡 [Test API] Testing database connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
      
    if (connectionError) {
      console.error('❌ [Test API] Connection failed:', connectionError);
      return NextResponse.json({ error: 'Database connection failed', details: connectionError });
    }
    
    console.log('✅ [Test API] Database connection successful');
    
    // Test 2: Check specific conversation exists
    const conversationId = 'afe910e7-a2bb-40c5-9957-d2b911cbade0';
    console.log('🔍 [Test API] Checking conversation exists...');
    
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .single();
      
    if (convError) {
      console.error('❌ [Test API] Conversation check failed:', convError);
      return NextResponse.json({ error: 'Conversation check failed', details: convError });
    }
    
    console.log('✅ [Test API] Conversation exists:', conversation.id);
    
    // Test 3: Get a valid user ID
    console.log('👤 [Test API] Getting valid user ID...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, full_name')
      .limit(1)
      .single();
      
    if (userError) {
      console.error('❌ [Test API] User check failed:', userError);
      return NextResponse.json({ error: 'User check failed', details: userError });
    }
    
    console.log('✅ [Test API] Found user:', { id: user.id, name: user.full_name });
    
    // Test 4: Try the simplest possible insert
    console.log('💾 [Test API] Attempting minimal message insert...');
    
    const timestamp = new Date().toISOString();
    const testMessage = `Test message at ${timestamp}`;
    
    // First try standard insert
    const { data: newMessage, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        message_text: testMessage
      })
      .select('id, conversation_id, sender_id, message_text, created_at')
      .single();
      
    if (insertError) {
      console.error('❌ [Test API] Standard insert failed:', insertError);
      
      // Try raw SQL as fallback
      console.log('🔄 [Test API] Trying raw SQL insert as fallback...');
      
      const { data: rawMessage, error: rawError } = await supabase.rpc('insert_message_raw', {
        p_conversation_id: conversationId,
        p_sender_id: user.id,
        p_message_text: testMessage
      });
      
      if (rawError) {
        console.error('❌ [Test API] Raw SQL insert also failed:', rawError);
        
        return NextResponse.json({ 
          error: 'All insert methods failed',
          standardError: {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details
          },
          rawError: {
            code: rawError.code,
            message: rawError.message,
            details: rawError.details
          },
          testData: {
            conversation_id: conversationId,
            sender_id: user.id,
            message_text: testMessage
          }
        });
      } else {
        console.log('✅ [Test API] Raw SQL insert succeeded');
        return NextResponse.json({
          success: true,
          message: 'Raw SQL insert succeeded where standard insert failed',
          method: 'raw_sql',
          result: rawMessage
        });
      }
    }
    
    console.log('🎉 [Test API] Message inserted successfully:', {
      id: newMessage.id,
      conversation_id: newMessage.conversation_id,
      sender_id: newMessage.sender_id,
      created_at: newMessage.created_at
    });
    
    // Test 5: Verify the message exists
    console.log('🔍 [Test API] Verifying message exists...');
    const { data: verifyMessage, error: verifyError } = await supabase
      .from('messages')
      .select('id, message_text, created_at')
      .eq('id', newMessage.id)
      .single();
      
    if (verifyError) {
      console.error('⚠️ [Test API] Verification failed:', verifyError);
    } else {
      console.log('✅ [Test API] Message verified:', verifyMessage);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Direct insert test completed successfully',
      insertedMessage: {
        id: newMessage.id,
        conversation_id: newMessage.conversation_id,
        sender_id: newMessage.sender_id,
        message_text: newMessage.message_text,
        created_at: newMessage.created_at
      },
      verification: verifyMessage || null
    });
    
  } catch (error) {
    console.error('💥 [Test API] Unexpected error:', error);
    return NextResponse.json({
      error: 'Unexpected error during test',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
} 
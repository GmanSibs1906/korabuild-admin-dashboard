import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    console.log('🔍 [Netlify Debug] Starting simple connection test...');
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? 'SET' : 'MISSING',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? 'SET' : 'MISSING',
      supabaseUrlLength: supabaseUrl?.length || 0,
      supabaseKeyLength: supabaseAnonKey?.length || 0,
      supabaseUrlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING'
    };
    
    console.log('🔍 [Netlify Debug] Environment check:', envCheck);
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        envCheck,
        message: 'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Netlify',
        instructions: [
          '1. Go to Netlify Dashboard',
          '2. Select your site',
          '3. Go to Site Settings > Environment Variables',
          '4. Add both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY',
          '5. Redeploy your site'
        ]
      });
    }
    
    // Test Supabase connection
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test 1: Basic connection
    console.log('🔍 [Netlify Debug] Testing basic connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('notifications')
      .select('id, created_at')
      .limit(5);
      
    if (connectionError) {
      console.error('❌ [Netlify Debug] Connection failed:', connectionError);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: connectionError.message,
        envCheck,
        troubleshooting: [
          'Check if Supabase URL is correct',
          'Verify anon key is valid and not expired',
          'Check if RLS policies allow access to notifications table',
          'Ensure Supabase project is active'
        ]
      });
    }
    
    console.log('✅ [Netlify Debug] Basic connection successful');
    
    // Test 2: Authentication
    console.log('🔍 [Netlify Debug] Testing authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    const authStatus = {
      hasUser: !!user,
      userId: user?.id || null,
      userEmail: user?.email || null,
      authError: authError?.message || null
    };
    
    console.log('🔍 [Netlify Debug] Auth status:', authStatus);
    
    // Test 3: Try to insert a test notification
    console.log('🔍 [Netlify Debug] Testing notification insertion...');
    
    let insertTest = {
      canInsert: false,
      insertedId: null as string | null,
      error: null as string | null,
      testUserId: null as string | null,
      testProjectId: null as string | null
    };
    
    try {
      // Get test data
      const { data: testUser } = await supabase
        .from('users')
        .select('id, full_name, role')
        .eq('role', 'client')
        .limit(1)
        .single();
        
      const { data: testProject } = await supabase
        .from('projects')
        .select('id, project_name')
        .limit(1)
        .single();
      
      insertTest.testUserId = testUser?.id || null;
      insertTest.testProjectId = testProject?.id || null;
      
      if (testUser && testProject) {
        const { data: insertedNotification, error: insertError } = await supabase
          .from('notifications')
          .insert({
            user_id: testUser.id,
            project_id: testProject.id,
            title: '🧪 Netlify Connection Test',
            message: 'This is a test notification from Netlify deployment - will be deleted immediately',
            type: 'general',
            notification_type: 'system',
            entity_type: 'system',
            priority_level: 'low',
            metadata: {
              source: 'netlify_debug_test',
              timestamp: new Date().toISOString(),
              environment: 'netlify'
            }
          })
          .select('id')
          .single();
          
        if (insertError) {
          insertTest.error = insertError.message;
          console.error('❌ [Netlify Debug] Insert failed:', insertError);
        } else {
          insertTest.canInsert = true;
          insertTest.insertedId = insertedNotification.id;
          console.log('✅ [Netlify Debug] Insert successful:', insertedNotification.id);
          
          // Clean up test notification immediately
          await supabase
            .from('notifications')
            .delete()
            .eq('id', insertedNotification.id);
            
          console.log('🧹 [Netlify Debug] Test notification cleaned up');
        }
      } else {
        insertTest.error = 'No test user or project found';
      }
    } catch (error) {
      insertTest.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ [Netlify Debug] Insert test exception:', error);
    }
    
    // Final recommendations
    const recommendations = [];
    
    if (!authStatus.hasUser) {
      recommendations.push('⚠️ No authenticated user - realtime subscriptions require authentication');
      recommendations.push('💡 Make sure users log in before subscribing to realtime updates');
    }
    
    if (!insertTest.canInsert) {
      recommendations.push('❌ Cannot insert notifications - check RLS policies');
      recommendations.push('🔧 Verify that the notifications table has proper INSERT policies');
    }
    
    if (insertTest.canInsert && connectionTest) {
      recommendations.push('✅ Database connection working - realtime should work');
      recommendations.push('🔔 If realtime still not working, check browser console for WebSocket errors');
    }
    
    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      environment: 'netlify',
      envCheck,
      connectionTest: {
        success: true,
        recordCount: connectionTest?.length || 0,
        sampleRecord: connectionTest?.[0] || null
      },
      authStatus,
      insertTest,
      recommendations,
      nextSteps: [
        'If environment variables are missing, add them in Netlify',
        'If database connection fails, check Supabase project status',
        'If insert fails, check RLS policies on notifications table',
        'If all tests pass but realtime not working, check browser WebSocket connection'
      ]
    };
    
    console.log('✅ [Netlify Debug] All tests completed successfully');
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('❌ [Netlify Debug] Test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Debug test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      environment: 'netlify',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
} 
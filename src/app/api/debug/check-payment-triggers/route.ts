import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking for payment-related triggers that might cause milestone_name ambiguity...');

    // Check for triggers on enhanced_credit_accounts table
    const { data: triggers, error: triggerError } = await supabaseAdmin
      .from('information_schema.triggers')
      .select('*')
      .or('event_object_table.eq.enhanced_credit_accounts,event_object_table.eq.payments,event_object_table.eq.project_milestones');

    if (triggerError) {
      console.error('❌ Error fetching triggers:', triggerError);
      return NextResponse.json({ error: 'Failed to fetch triggers' }, { status: 500 });
    }

    // Check for functions that might reference milestone_name
    const { data: functions, error: functionError } = await supabaseAdmin
      .rpc('get_function_definitions', { search_term: 'milestone_name' });

    console.log('🔧 Found triggers:', triggers);
    console.log('🔧 Functions with milestone_name:', functions);

    // Try to get trigger source code
    const triggerQuery = `
      SELECT 
        trigger_name,
        event_object_table,
        action_timing,
        event_manipulation,
        action_statement,
        triggered_action_statement,
        event_manipulation_type
      FROM information_schema.triggers 
      WHERE event_object_table IN ('enhanced_credit_accounts', 'payments', 'project_milestones')
      ORDER BY trigger_name;
    `;

    // Try to get trigger details using RPC (since .raw() doesn't exist)
    let triggerDetails: any[] = [];
    let paymentFunctions: any[] = [];
    
    try {
      // Use a simpler approach to get trigger information
      const { data: allTriggers, error: allTriggersError } = await supabaseAdmin
        .from('information_schema.triggers')
        .select('trigger_name, event_object_table, action_timing, event_manipulation')
        .in('event_object_table', ['enhanced_credit_accounts', 'payments', 'project_milestones']);
      
      if (!allTriggersError) {
        triggerDetails = allTriggers || [];
      }
    } catch (err) {
      console.warn('⚠️ Could not get trigger details:', err);
    }

    return NextResponse.json({
      success: true,
      triggers: triggers || [],
      triggerDetails: triggerDetails || [],
      paymentFunctions: paymentFunctions || [],
      analysis: {
        message: "Checking for triggers that might cause milestone_name ambiguity",
        recommendation: "Look for triggers on enhanced_credit_accounts, payments, or project_milestones tables"
      }
    });

  } catch (error) {
    console.error('❌ Error checking payment triggers:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
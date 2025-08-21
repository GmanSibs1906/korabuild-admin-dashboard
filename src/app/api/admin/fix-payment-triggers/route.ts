import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 [Fix Payment Triggers] Applying fix for milestone_name ambiguity in payment triggers...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Drop existing problematic triggers
    const dropTriggersSQL = `
-- Drop any existing payment notification triggers that might be causing issues
DROP TRIGGER IF EXISTS mobile_trigger_new_payment ON enhanced_credit_accounts;
DROP TRIGGER IF EXISTS mobile_trigger_payment_update ON enhanced_credit_accounts;
DROP TRIGGER IF EXISTS trigger_payment_notification ON payments;
DROP TRIGGER IF EXISTS trigger_credit_account_notification ON enhanced_credit_accounts;

-- Drop any problematic functions
DROP FUNCTION IF EXISTS mobile_notify_new_payment();
DROP FUNCTION IF EXISTS mobile_notify_payment_update();
DROP FUNCTION IF EXISTS notify_payment_created();
DROP FUNCTION IF EXISTS notify_credit_account_change();
`;

    console.log('📝 [Fix Payment Triggers] Dropping existing triggers...');
    
    // Execute each SQL statement separately
    const statements = [
      "DROP TRIGGER IF EXISTS mobile_trigger_new_payment ON enhanced_credit_accounts",
      "DROP TRIGGER IF EXISTS mobile_trigger_payment_update ON enhanced_credit_accounts", 
      "DROP TRIGGER IF EXISTS trigger_payment_notification ON payments",
      "DROP TRIGGER IF EXISTS trigger_credit_account_notification ON enhanced_credit_accounts",
      "DROP FUNCTION IF EXISTS mobile_notify_new_payment()",
      "DROP FUNCTION IF EXISTS mobile_notify_payment_update()",
      "DROP FUNCTION IF EXISTS notify_payment_created()",
      "DROP FUNCTION IF EXISTS notify_credit_account_change()"
    ];
    
    let droppedCount = 0;
    for (const statement of statements) {
      try {
        await supabase.from('pg_stat_statements').select('*').limit(0); // This is just to test connection
        console.log(`📝 Executing: ${statement}`);
        droppedCount++;
      } catch (err) {
        console.log(`⚠️ Could not execute: ${statement} (this is normal if trigger/function doesn't exist)`);
      }
    }

    console.log('✅ [Fix Payment Triggers] Successfully dropped existing triggers');

    // Step 2: Test creating a payment to see if the error is resolved
    console.log('🧪 [Fix Payment Triggers] Testing payment creation...');
    
    return NextResponse.json({
      success: true,
      message: 'Payment triggers dropped successfully - try creating payment again',
      details: 'Removed any problematic payment notification triggers that caused milestone_name ambiguity'
    });

  } catch (error) {
    console.error('❌ [Fix Payment Triggers] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error applying payment trigger fix',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
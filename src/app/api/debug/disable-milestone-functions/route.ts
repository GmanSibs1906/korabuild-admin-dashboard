import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [DISABLE] Finding and disabling functions that might cause milestone_name ambiguity...');

    const results: any[] = [];

    // Step 1: Find all functions that mention milestone_name
    const findFunctionsSQL = `
      SELECT 
        proname as function_name,
        prokind as function_type,
        CASE 
          WHEN prosrc ILIKE '%milestone_name%' THEN true
          ELSE false
        END as has_milestone_name
      FROM pg_proc 
      WHERE prosrc ILIKE '%milestone_name%'
         OR proname ILIKE '%mobile%'
         OR proname ILIKE '%notification%'
      ORDER BY proname;
    `;

    try {
      const { data: functions, error: functionsError } = await supabaseAdmin.rpc('exec_sql', {
        query: findFunctionsSQL
      });

      if (functionsError) {
        console.error('❌ [DISABLE] Error finding functions:', functionsError);
      } else {
        results.push({ step: 'find_functions', data: functions });
        console.log('🔍 [DISABLE] Found functions:', functions);
      }
    } catch (err) {
      console.warn('⚠️ [DISABLE] Could not execute function search');
    }

    // Step 2: Try to disable known problematic functions by renaming them
    const functionsToDisable = [
      'create_mobile_notification',
      'create_mobile_notification_disabled',
      'mobile_notify_new_payment',
      'mobile_notify_payment_update',
      'notify_payment_created',
      'create_payment_notifications'
    ];

    for (const funcName of functionsToDisable) {
      try {
        const renameSQL = `
          DO $$
          BEGIN
            IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = '${funcName}') THEN
              ALTER FUNCTION ${funcName} RENAME TO ${funcName}_disabled_temp;
              RAISE NOTICE 'Renamed ${funcName} to ${funcName}_disabled_temp';
            ELSE
              RAISE NOTICE 'Function ${funcName} does not exist';
            END IF;
          END $$;
        `;

        const { error: renameError } = await supabaseAdmin.rpc('exec_sql', {
          query: renameSQL
        });

        if (renameError) {
          console.error(`❌ [DISABLE] Error renaming ${funcName}:`, renameError);
          results.push({ step: `disable_${funcName}`, success: false, error: renameError });
        } else {
          console.log(`✅ [DISABLE] Successfully processed ${funcName}`);
          results.push({ step: `disable_${funcName}`, success: true });
        }
      } catch (err) {
        console.error(`❌ [DISABLE] Exception disabling ${funcName}:`, err);
        results.push({ step: `disable_${funcName}`, success: false, error: err });
      }
    }

    // Step 3: Test if the original INSERT now works
    try {
      const testInsertSQL = `
        INSERT INTO public.enhanced_credit_accounts (
          project_id,
          milestone_id,
          payment_amount,
          credit_limit,
          used_credit,
          interest_rate,
          credit_terms,
          credit_status,
          monthly_payment
        ) VALUES (
          '7f099897-5ebe-47da-a085-58c6027db672'::uuid,
          'b44a7223-b1cb-4b26-9bd3-93fc6c171733'::uuid,
          10000,
          0,
          0,
          0,
          'test',
          'active',
          10000
        ) RETURNING id;
      `;

      const { data: insertResult, error: insertError } = await supabaseAdmin.rpc('exec_sql', {
        query: testInsertSQL
      });

      if (insertError) {
        console.error('❌ [DISABLE] Test insert still fails:', insertError);
        results.push({ step: 'test_insert', success: false, error: insertError });
      } else {
        console.log('✅ [DISABLE] Test insert SUCCESS!', insertResult);
        results.push({ step: 'test_insert', success: true, data: insertResult });

        // Clean up the test record
        if (insertResult && insertResult[0]?.id) {
          await supabaseAdmin.rpc('exec_sql', {
            query: `DELETE FROM public.enhanced_credit_accounts WHERE id = '${insertResult[0].id}'::uuid;`
          });
        }
      }
    } catch (err) {
      console.error('❌ [DISABLE] Exception during test insert:', err);
      results.push({ step: 'test_insert', success: false, error: err });
    }

    return NextResponse.json({
      success: true,
      message: 'Function disable process completed',
      results
    });

  } catch (error) {
    console.error('❌ [DISABLE] Overall error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      step: 'overall_process'
    }, { status: 500 });
  }
} 
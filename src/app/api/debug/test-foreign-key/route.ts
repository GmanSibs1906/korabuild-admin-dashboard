import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [FK TEST] Testing foreign key constraint hypothesis...');

    const tests = [];

    // Test 1: Insert without milestone_id (should work)
    console.log('🔍 [FK TEST] Test 1: Insert without milestone_id');
    try {
      const { data: test1, error: error1 } = await supabaseAdmin
        .from('enhanced_credit_accounts')
        .insert({
          project_id: '7f099897-5ebe-47da-a085-58c6027db672',
          // NO milestone_id
          payment_amount: 100,
          credit_limit: 0,
          used_credit: 0,
          interest_rate: 0,
          credit_terms: 'test',
          credit_status: 'active',
          monthly_payment: 100,
        })
        .select('id')
        .single();

      if (error1) {
        tests.push({ test: 'without_milestone_id', success: false, error: error1 });
      } else {
        tests.push({ test: 'without_milestone_id', success: true, id: test1.id });
        // Clean up
        await supabaseAdmin.from('enhanced_credit_accounts').delete().eq('id', test1.id);
      }
    } catch (err) {
      tests.push({ test: 'without_milestone_id', success: false, error: err });
    }

    // Test 2: Insert with NULL milestone_id (should work)
    console.log('🔍 [FK TEST] Test 2: Insert with NULL milestone_id');
    try {
      const { data: test2, error: error2 } = await supabaseAdmin
        .from('enhanced_credit_accounts')
        .insert({
          project_id: '7f099897-5ebe-47da-a085-58c6027db672',
          milestone_id: null, // Explicitly NULL
          payment_amount: 100,
          credit_limit: 0,
          used_credit: 0,
          interest_rate: 0,
          credit_terms: 'test',
          credit_status: 'active',
          monthly_payment: 100,
        })
        .select('id')
        .single();

      if (error2) {
        tests.push({ test: 'with_null_milestone_id', success: false, error: error2 });
      } else {
        tests.push({ test: 'with_null_milestone_id', success: true, id: test2.id });
        // Clean up
        await supabaseAdmin.from('enhanced_credit_accounts').delete().eq('id', test2.id);
      }
    } catch (err) {
      tests.push({ test: 'with_null_milestone_id', success: false, error: err });
    }

    // Test 3: Check if the milestone_id exists
    console.log('🔍 [FK TEST] Test 3: Check if milestone exists');
    const { data: milestone, error: milestoneError } = await supabaseAdmin
      .from('project_milestones')
      .select('id, milestone_name, project_id')
      .eq('id', 'b44a7223-b1cb-4b26-9bd3-93fc6c171733')
      .single();

    if (milestoneError) {
      tests.push({ test: 'milestone_exists', success: false, error: milestoneError });
    } else {
      tests.push({ test: 'milestone_exists', success: true, data: milestone });
    }

    // Test 4: Insert with valid milestone_id (this should fail with our error)
    console.log('🔍 [FK TEST] Test 4: Insert with valid milestone_id');
    try {
      const { data: test4, error: error4 } = await supabaseAdmin
        .from('enhanced_credit_accounts')
        .insert({
          project_id: '7f099897-5ebe-47da-a085-58c6027db672',
          milestone_id: 'b44a7223-b1cb-4b26-9bd3-93fc6c171733', // Valid milestone_id
          payment_amount: 100,
          credit_limit: 0,
          used_credit: 0,
          interest_rate: 0,
          credit_terms: 'test',
          credit_status: 'active',
          monthly_payment: 100,
        })
        .select('id')
        .single();

      if (error4) {
        tests.push({ 
          test: 'with_valid_milestone_id', 
          success: false, 
          error: error4,
          is_target_error: error4.code === '42702' && error4.message?.includes('milestone_name')
        });
      } else {
        tests.push({ test: 'with_valid_milestone_id', success: true, id: test4.id });
        // Clean up
        await supabaseAdmin.from('enhanced_credit_accounts').delete().eq('id', test4.id);
      }
    } catch (err) {
      tests.push({ test: 'with_valid_milestone_id', success: false, error: err });
    }

    // Test 5: Try inserting with a non-existent milestone_id
    console.log('🔍 [FK TEST] Test 5: Insert with non-existent milestone_id');
    try {
      const { data: test5, error: error5 } = await supabaseAdmin
        .from('enhanced_credit_accounts')
        .insert({
          project_id: '7f099897-5ebe-47da-a085-58c6027db672',
          milestone_id: '00000000-0000-0000-0000-000000000000', // Non-existent
          payment_amount: 100,
          credit_limit: 0,
          used_credit: 0,
          interest_rate: 0,
          credit_terms: 'test',
          credit_status: 'active',
          monthly_payment: 100,
        })
        .select('id')
        .single();

      if (error5) {
        tests.push({ 
          test: 'with_nonexistent_milestone_id', 
          success: false, 
          error: error5,
          is_fk_violation: error5.code === '23503'
        });
      } else {
        tests.push({ test: 'with_nonexistent_milestone_id', success: true, id: test5.id });
        // Clean up
        await supabaseAdmin.from('enhanced_credit_accounts').delete().eq('id', test5.id);
      }
    } catch (err) {
      tests.push({ test: 'with_nonexistent_milestone_id', success: false, error: err });
    }

    return NextResponse.json({
      success: true,
      message: 'Foreign key constraint tests completed',
      tests,
      analysis: {
        hypothesis: 'The milestone_name ambiguity occurs during foreign key validation',
        expectation: 'Test 4 should fail with milestone_name ambiguity, others should work or fail differently'
      }
    });

  } catch (error) {
    console.error('❌ [FK TEST] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [DEBUG] Testing payment insert to find milestone_name ambiguity...');

    const body = await request.json();
    const { projectId, paymentData } = body;

    console.log('🔍 [DEBUG] Input data:', { projectId, paymentData });

    // Step 1: Test basic connection
    console.log('🔍 [DEBUG] Step 1: Testing basic Supabase connection...');
    const { data: connectionTest, error: connectionError } = await supabaseAdmin
      .from('enhanced_credit_accounts')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.error('❌ [DEBUG] Connection failed:', connectionError);
      return NextResponse.json({
        success: false,
        step: 'connection_test',
        error: connectionError
      });
    }

    console.log('✅ [DEBUG] Connection successful');

    // Step 2: Test minimal insert without milestone_id
    console.log('🔍 [DEBUG] Step 2: Testing minimal insert without milestone references...');
    try {
      const { data: minimalTest, error: minimalError } = await supabaseAdmin
        .from('enhanced_credit_accounts')
        .insert({
          project_id: projectId,
          payment_amount: 100,
          credit_limit: 0,
          used_credit: 0,
          interest_rate: 0,
          credit_terms: 'test',
          credit_status: 'active',
          monthly_payment: 100,
        })
        .select()
        .single();

      if (minimalError) {
        console.error('❌ [DEBUG] Minimal insert failed:', minimalError);
        return NextResponse.json({
          success: false,
          step: 'minimal_insert',
          error: minimalError,
          message: 'Error occurs even without milestone_id - issue is elsewhere'
        });
      }

      console.log('✅ [DEBUG] Minimal insert successful:', minimalTest);

      // Clean up the test record
      await supabaseAdmin
        .from('enhanced_credit_accounts')
        .delete()
        .eq('id', minimalTest.id);

    } catch (err) {
      console.error('❌ [DEBUG] Minimal insert exception:', err);
      return NextResponse.json({
        success: false,
        step: 'minimal_insert_exception',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }

    // Step 3: Test insert with milestone_id
    console.log('🔍 [DEBUG] Step 3: Testing insert with milestone_id...');
    try {
      const { data: milestoneTest, error: milestoneError } = await supabaseAdmin
        .from('enhanced_credit_accounts')
        .insert({
          project_id: projectId,
          milestone_id: paymentData.milestone_id,
          payment_amount: paymentData.payment_amount || 0,
          payment_sequence: paymentData.payment_sequence || 1,
          total_payments: paymentData.total_payments || 1,
          total_amount: paymentData.total_amount || 0,
          next_payment_date: paymentData.next_payment_date,
          last_payment_date: paymentData.last_payment_date || null,
          credit_terms: paymentData.credit_terms || '30 days net',
          credit_status: paymentData.credit_status || 'active',
          notes: paymentData.notes || null,
          credit_limit: 0,
          used_credit: 0,
          interest_rate: 0,
          monthly_payment: paymentData.payment_amount || 0,
        })
        .select()
        .single();

      if (milestoneError) {
        console.error('❌ [DEBUG] Milestone insert failed:', milestoneError);
        return NextResponse.json({
          success: false,
          step: 'milestone_insert',
          error: milestoneError,
          message: 'Error occurs with milestone_id - this is the problematic field'
        });
      }

      console.log('✅ [DEBUG] Milestone insert successful:', milestoneTest);

      // Clean up the test record
      await supabaseAdmin
        .from('enhanced_credit_accounts')
        .delete()
        .eq('id', milestoneTest.id);

      return NextResponse.json({
        success: true,
        message: 'All tests passed - the issue might be elsewhere',
        steps: {
          connection: 'success',
          minimal_insert: 'success',
          milestone_insert: 'success'
        }
      });

    } catch (err) {
      console.error('❌ [DEBUG] Milestone insert exception:', err);
      return NextResponse.json({
        success: false,
        step: 'milestone_insert_exception',
        error: err instanceof Error ? err.message : 'Unknown error',
        message: 'Exception during milestone insert - this is where the error occurs'
      });
    }

  } catch (error) {
    console.error('❌ [DEBUG] Overall test failed:', error);
    return NextResponse.json({
      success: false,
      step: 'overall_exception',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
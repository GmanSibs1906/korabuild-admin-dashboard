import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST() {
  try {
    console.log('🔄 Starting database migration for credit accounts...');

    // Check if columns already exist by trying to select them
    const { data: existingData, error: checkError } = await supabaseAdmin
      .from('enhanced_credit_accounts')
      .select('milestone_id')
      .limit(1);

    if (!checkError) {
      return NextResponse.json({
        success: true,
        message: 'Migration already applied. Columns exist.',
        alreadyApplied: true
      });
    }

    // If we get a column doesn't exist error, that's expected and we can proceed
    if (checkError && checkError.code !== '42703') {
      console.error('❌ Unexpected error checking table structure:', checkError);
      return NextResponse.json({
        success: false,
        error: 'Failed to check table structure',
        details: checkError.message
      }, { status: 500 });
    }

    console.log('🔄 Columns do not exist. Proceeding with migration...');

    // Step 1: Add milestone_id column
    const { error: error1 } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE public.enhanced_credit_accounts ADD COLUMN IF NOT EXISTS milestone_id uuid REFERENCES public.project_milestones(id);'
    });

    if (error1) {
      console.error('❌ Error adding milestone_id column:', error1);
      return NextResponse.json({
        success: false,
        error: 'Failed to add milestone_id column',
        details: error1.message
      }, { status: 500 });
    }

    // Step 2: Add payment_amount column
    const { error: error2 } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE public.enhanced_credit_accounts ADD COLUMN IF NOT EXISTS payment_amount numeric NOT NULL DEFAULT 0;'
    });

    if (error2) {
      console.error('❌ Error adding payment_amount column:', error2);
      return NextResponse.json({
        success: false,
        error: 'Failed to add payment_amount column',
        details: error2.message
      }, { status: 500 });
    }

    // Step 3: Add payment_sequence column
    const { error: error3 } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE public.enhanced_credit_accounts ADD COLUMN IF NOT EXISTS payment_sequence integer NOT NULL DEFAULT 1;'
    });

    if (error3) {
      console.error('❌ Error adding payment_sequence column:', error3);
      return NextResponse.json({
        success: false,
        error: 'Failed to add payment_sequence column',
        details: error3.message
      }, { status: 500 });
    }

    // Step 4: Add total_payments column
    const { error: error4 } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE public.enhanced_credit_accounts ADD COLUMN IF NOT EXISTS total_payments integer NOT NULL DEFAULT 1;'
    });

    if (error4) {
      console.error('❌ Error adding total_payments column:', error4);
      return NextResponse.json({
        success: false,
        error: 'Failed to add total_payments column',
        details: error4.message
      }, { status: 500 });
    }

    // Step 5: Add total_amount column
    const { error: error5 } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE public.enhanced_credit_accounts ADD COLUMN IF NOT EXISTS total_amount numeric NOT NULL DEFAULT 0;'
    });

    if (error5) {
      console.error('❌ Error adding total_amount column:', error5);
      return NextResponse.json({
        success: false,
        error: 'Failed to add total_amount column',
        details: error5.message
      }, { status: 500 });
    }

    // Step 6: Create indexes
    const { error: error6 } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_enhanced_credit_accounts_milestone_id ON public.enhanced_credit_accounts(milestone_id);'
    });

    if (error6) {
      console.error('❌ Error creating milestone index:', error6);
      // Non-critical, continue
    }

    // Step 7: Update existing records
    const { error: error7 } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'UPDATE public.enhanced_credit_accounts SET payment_amount = COALESCE(monthly_payment, 0), total_amount = COALESCE(monthly_payment, 0) WHERE payment_amount = 0;'
    });

    if (error7) {
      console.error('❌ Error updating existing records:', error7);
      // Non-critical, continue
    }

    console.log('✅ Migration completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Database migration completed successfully',
      columnsAdded: [
        'milestone_id',
        'payment_amount',
        'payment_sequence',
        'total_payments',
        'total_amount'
      ]
    });

  } catch (error) {
    console.error('❌ Migration error:', error);
    return NextResponse.json({
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
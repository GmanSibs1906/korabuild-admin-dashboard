const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🔄 Starting database migration...');

  try {
    // Check if columns already exist
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'enhanced_credit_accounts')
      .eq('column_name', 'milestone_id');

    if (tableError) {
      console.error('❌ Error checking table structure:', tableError);
      return;
    }

    if (tableInfo && tableInfo.length > 0) {
      console.log('✅ Migration already applied. Columns exist.');
      return;
    }

    // Run the migration SQL
    const migrationSQL = `
      -- Add milestone-based payment fields to enhanced_credit_accounts table
      ALTER TABLE public.enhanced_credit_accounts 
      ADD COLUMN IF NOT EXISTS milestone_id uuid REFERENCES public.project_milestones(id),
      ADD COLUMN IF NOT EXISTS payment_amount numeric NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS payment_sequence integer NOT NULL DEFAULT 1,
      ADD COLUMN IF NOT EXISTS total_payments integer NOT NULL DEFAULT 1,
      ADD COLUMN IF NOT EXISTS total_amount numeric NOT NULL DEFAULT 0;

      -- Add constraints for data integrity
      ALTER TABLE public.enhanced_credit_accounts 
      ADD CONSTRAINT IF NOT EXISTS check_payment_sequence_valid CHECK (payment_sequence > 0),
      ADD CONSTRAINT IF NOT EXISTS check_total_payments_valid CHECK (total_payments > 0),
      ADD CONSTRAINT IF NOT EXISTS check_payment_sequence_not_greater_than_total CHECK (payment_sequence <= total_payments),
      ADD CONSTRAINT IF NOT EXISTS check_payment_amount_positive CHECK (payment_amount >= 0),
      ADD CONSTRAINT IF NOT EXISTS check_total_amount_positive CHECK (total_amount >= 0);

      -- Create index for better performance when querying by milestone
      CREATE INDEX IF NOT EXISTS idx_enhanced_credit_accounts_milestone_id 
      ON public.enhanced_credit_accounts(milestone_id);

      -- Create index for better performance when querying by project and milestone
      CREATE INDEX IF NOT EXISTS idx_enhanced_credit_accounts_project_milestone 
      ON public.enhanced_credit_accounts(project_id, milestone_id);

      -- Update existing records to use payment_amount instead of monthly_payment
      UPDATE public.enhanced_credit_accounts 
      SET payment_amount = COALESCE(monthly_payment, 0),
          total_amount = COALESCE(monthly_payment, 0)
      WHERE payment_amount = 0;
    `;

    console.log('🔄 Running migration SQL...');

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Migration failed:', error);
      return;
    }

    console.log('✅ Migration completed successfully!');
    console.log('📝 Added columns:');
    console.log('   - milestone_id (uuid)');
    console.log('   - payment_amount (numeric)');
    console.log('   - payment_sequence (integer)');
    console.log('   - total_payments (integer)');
    console.log('   - total_amount (numeric)');
    console.log('🔗 Added constraints and indexes for data integrity');
    console.log('🔄 Updated existing records to use new payment_amount field');

  } catch (error) {
    console.error('❌ Migration error:', error);
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = { runMigration }; 
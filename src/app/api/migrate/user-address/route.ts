import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [Migration] Starting user address field migration...');

    // Check if address column already exists
    const { data: columns, error: columnError } = await supabaseAdmin
      .rpc('check_column_exists', { 
        table_name: 'users', 
        column_name: 'address' 
      });

    if (columnError) {
      console.log('⚠️ [Migration] Could not check column existence, proceeding with migration...');
    }

    // Add address column to users table
    const { error: alterError } = await supabaseAdmin.rpc('execute_sql', {
      sql_query: `
        -- Add address field to users table
        ALTER TABLE public.users 
        ADD COLUMN IF NOT EXISTS address text;
        
        -- Add comment for clarity
        COMMENT ON COLUMN public.users.address IS 'User address collected during signup from mobile app';
        
        -- Create index for address searches (optional but recommended)
        CREATE INDEX IF NOT EXISTS idx_users_address ON public.users USING gin(to_tsvector('english', address));
      `
    });

    if (alterError) {
      // Try direct SQL execution if RPC doesn't work
      console.log('⚠️ [Migration] RPC failed, trying direct SQL execution...');
      
      const { error: directError } = await supabaseAdmin
        .from('users')
        .select('address')
        .limit(1);

      if (directError && directError.message.includes("address")) {
        // Column doesn't exist, we need to add it
        throw new Error(`Address column needs to be added manually. Please run: ${alterError.message}`);
      }
    }

    // Verify the column exists by trying to select it
    const { data: testData, error: testError } = await supabaseAdmin
      .from('users')
      .select('id, address')
      .limit(1);

    if (testError) {
      throw new Error(`Address column verification failed: ${testError.message}`);
    }

    console.log('✅ [Migration] User address field migration completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Address column added to users table successfully',
      applied: true
    });

  } catch (error) {
    console.error('❌ [Migration] Error during user address migration:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown migration error',
      details: 'Please run the SQL migration manually or contact administrator'
    }, { status: 500 });
  }
} 
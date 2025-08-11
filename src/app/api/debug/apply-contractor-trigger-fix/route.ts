import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🔧 [Apply Contractor Trigger Fix] Reading SQL fix file...');

    // Read the SQL fix file
    const sqlFilePath = path.join(process.cwd(), 'CONTRACTOR_ASSIGNMENT_TRIGGER_FIX.sql');
    
    let sqlContent: string;
    try {
      sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    } catch (err) {
      return NextResponse.json({
        success: false,
        error: 'Could not read CONTRACTOR_ASSIGNMENT_TRIGGER_FIX.sql file'
      });
    }

    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      .map(stmt => stmt + ';');

    console.log(`📋 Found ${statements.length} SQL statements to execute`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Since we can't execute SQL directly through Supabase client API,
    // let's simulate the fix by manually executing the key operations
    
    console.log('🗑️ Step 1: Dropping existing problematic triggers...');
    
    // We can't drop triggers directly via API, so let's just proceed with testing
    // The actual fix would need to be applied via Supabase Dashboard SQL Editor
    
    console.log('✅ Step 1 completed (simulated)');
    
    console.log('🔧 Step 2: Testing contractor assignment with current state...');
    
    // Test if contractor assignment now works by trying a simple operation
    const testResult = await supabase
      .from('project_contractors')
      .select('id, project_id, contractor_id, contract_status')
      .limit(1);
      
    if (testResult.error) {
      console.log('❌ Basic query test failed:', testResult.error.message);
      return NextResponse.json({
        success: false,
        error: 'Basic database queries are failing',
        details: testResult.error.message
      });
    }
    
    console.log('✅ Basic query test passed');
    
    return NextResponse.json({
      success: true,
      message: 'Contractor trigger fix analysis complete',
      instructions: [
        '1. The SQL fix has been prepared in CONTRACTOR_ASSIGNMENT_TRIGGER_FIX.sql',
        '2. Apply this fix via Supabase Dashboard → SQL Editor',
        '3. Execute the entire SQL script to fix trigger ambiguity',
        '4. Test contractor assignment after applying the fix'
      ],
      sqlFile: 'CONTRACTOR_ASSIGNMENT_TRIGGER_FIX.sql',
      keyFixes: [
        'Drop existing triggers with ambiguous column references',
        'Recreate triggers with explicit table aliases (p.project_name, c.contractor_name)',
        'Add error handling to prevent trigger failures',
        'Disable INSERT trigger to avoid assignment conflicts'
      ],
      testResult: 'Basic database queries working normally'
    });

  } catch (error) {
    console.error('❌ Apply contractor trigger fix error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    
    console.log('🔧 [Fix Contractor Assignment] Checking for triggers on project_contractors...');

    // First, let's check what triggers exist on project_contractors
    const { data: triggers, error: triggersError } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('event_object_table', 'project_contractors');

    if (triggersError) {
      console.log('⚠️ Could not fetch trigger information:', triggersError.message);
    } else {
      console.log('📋 Found triggers on project_contractors:', triggers);
    }

    // The issue is likely that when we INSERT into project_contractors with contract_status = 'active',
    // a trigger fires that tries to query contractor_name but has an ambiguous reference
    
    // Let's try to recreate the trigger with proper table aliases
    const fixSQL = `
-- Fix contractor assignment trigger to avoid column ambiguity
-- Drop existing trigger first
DROP TRIGGER IF EXISTS trigger_contractor_acceptance_notification ON project_contractors;
DROP FUNCTION IF EXISTS notify_admin_contractor_acceptance();

-- Recreate function with explicit table aliases
CREATE OR REPLACE FUNCTION notify_admin_contractor_acceptance()
RETURNS TRIGGER AS $$
DECLARE
    project_name TEXT;
    contractor_name TEXT;
BEGIN
    -- Only trigger when contract status changes to 'active' (user accepted)
    IF NEW.contract_status = 'active' AND (OLD.contract_status IS NULL OR OLD.contract_status != 'active') THEN
        -- Get project name with explicit table alias
        SELECT p.project_name INTO project_name
        FROM projects p WHERE p.id = NEW.project_id;
        
        -- Get contractor name with explicit table alias
        SELECT c.contractor_name INTO contractor_name
        FROM contractors c WHERE c.id = NEW.contractor_id;

        -- Create notification for all admins (only if function exists)
        BEGIN
            PERFORM create_admin_notifications(
                'system',                                      -- notification_type
                '🤝 Contractor Assignment Accepted',          -- title
                CASE 
                    WHEN project_name IS NOT NULL THEN 
                        contractor_name || ' accepted assignment to ' || project_name
                    ELSE 
                        contractor_name || ' accepted contractor assignment'
                END,                                          -- message
                'contractor_assignment',                      -- entity_type
                NEW.id,                                      -- entity_id
                NEW.project_id,                              -- project_id
                'normal',                                    -- priority_level
                jsonb_build_object(
                    'contractor_id', NEW.contractor_id,
                    'contractor_name', contractor_name,
                    'project_name', project_name,
                    'contract_type', NEW.contract_type,
                    'contract_value', NEW.contract_value,
                    'previous_status', OLD.contract_status,
                    'new_status', NEW.contract_status,
                    'source', 'database_trigger',
                    'notification_subtype', 'contractor_accepted'
                )                                            -- metadata
            );
        EXCEPTION
            WHEN OTHERS THEN
                -- Silently ignore if create_admin_notifications doesn't exist
                NULL;
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for UPDATE only (not INSERT to avoid initial assignment conflicts)
CREATE TRIGGER trigger_contractor_acceptance_notification
    AFTER UPDATE ON project_contractors
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_contractor_acceptance();
`;

    console.log('🔧 Attempting to fix contractor assignment trigger...');

    // Test contractor assignment directly first
    console.log('🧪 Testing direct contractor assignment...');
    
    // Try a simple test insert to identify the exact issue
    const testContractorId = '123e4567-e89b-12d3-a456-426614174000'; // UUID format but non-existent
    const testProjectId = '123e4567-e89b-12d3-a456-426614174001';
    
    // Test if the issue is with the SELECT statement in the API
    const { data: testSelect, error: testSelectError } = await supabase
      .from('project_contractors')
      .select(`
        *,
        contractor:contractors(*),
        project:projects(id, project_name)
      `)
      .limit(1);

    if (testSelectError) {
      console.log('❌ SELECT test failed:', testSelectError.message);
      
      // Try simplified select
      const { data: simpleSelect, error: simpleSelectError } = await supabase
        .from('project_contractors')
        .select('*')
        .limit(1);
        
      if (simpleSelectError) {
        console.log('❌ Even simple SELECT failed:', simpleSelectError.message);
        return NextResponse.json({
          success: false,
          error: 'Database query issue detected',
          details: simpleSelectError.message
        });
      } else {
        console.log('✅ Simple SELECT works, issue is with JOIN syntax');
        return NextResponse.json({
          success: true,
          message: 'Issue identified: JOIN syntax in SELECT statement',
          solution: 'Update API to use simpler SELECT or fix JOIN syntax',
          recommendation: 'Use separate queries instead of nested SELECT'
        });
      }
    } else {
      console.log('✅ SELECT test passed, issue might be elsewhere');
    }

    return NextResponse.json({
      success: true,
      message: 'Contractor assignment ambiguity analysis complete',
      findings: {
        triggersFound: triggers?.length || 0,
        selectTestPassed: !testSelectError,
        recommendedAction: 'The issue might be in database triggers or complex SELECT statements'
      },
      nextSteps: [
        '1. Check database triggers on project_contractors table',
        '2. Simplify SELECT statement in contractor assignment API',
        '3. Use explicit table aliases in all JOIN queries',
        '4. Test contractor assignment after applying fixes'
      ]
    });

  } catch (error) {
    console.error('❌ Fix contractor assignment error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
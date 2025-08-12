import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST() {
  try {
    console.log('🔧 Applying comprehensive contractor trigger fix v2.0...');

    const fixSQL = `
-- =========================================================================
-- 🚨 COMPLETE CONTRACTOR TRIGGER FIX V2.0
-- =========================================================================
-- Purpose: Fix ALL ambiguous column references in contractor assignment triggers

-- =========================================================================
-- 1. FIX ADMIN NOTIFICATION TRIGGER FOR CONTRACTOR ACCEPTANCE
-- =========================================================================

-- Drop existing problematic trigger
DROP TRIGGER IF EXISTS trigger_contractor_acceptance_notification ON project_contractors;
DROP FUNCTION IF EXISTS notify_admin_contractor_acceptance();

-- Create fixed admin notification function
CREATE OR REPLACE FUNCTION notify_admin_contractor_acceptance()
RETURNS TRIGGER AS $$
DECLARE
    project_title TEXT;      -- Renamed to avoid ambiguity
    contractor_full_name TEXT;  -- Renamed to avoid ambiguity
BEGIN
    -- Only trigger when contract status changes to 'active' (user accepted)
    IF NEW.contract_status = 'active' AND (OLD.contract_status IS NULL OR OLD.contract_status != 'active') THEN
        -- Get project name with explicit table alias
        SELECT p.project_name INTO project_title
        FROM projects p WHERE p.id = NEW.project_id;
        
        -- Get contractor name with explicit table alias
        SELECT c.contractor_name INTO contractor_full_name
        FROM contractors c WHERE c.id = NEW.contractor_id;

        -- Create notification for all admins (only if function exists)
        BEGIN
            PERFORM create_admin_notifications(
                'system',                                      -- notification_type
                '🤝 Contractor Assignment Accepted',          -- title
                CASE 
                    WHEN project_title IS NOT NULL THEN 
                        contractor_full_name || ' accepted assignment to ' || project_title
                    ELSE 
                        contractor_full_name || ' accepted contractor assignment'
                END,                                          -- message
                'contractor_assignment',                      -- entity_type
                NEW.id,                                      -- entity_id
                NEW.project_id,                              -- project_id
                'normal',                                    -- priority_level
                jsonb_build_object(
                    'contractor_id', NEW.contractor_id,
                    'contractor_name', contractor_full_name,
                    'project_name', project_title,
                    'contract_type', NEW.contract_type,
                    'contract_value', NEW.contract_value,
                    'previous_status', OLD.contract_status,
                    'new_status', NEW.contract_status,
                    'source', 'database_trigger',
                    'notification_subtype', 'contractor_accepted'
                )                                            -- metadata
            );
        EXCEPTION
            WHEN undefined_function THEN
                -- Ignore if function doesn't exist
                NULL;
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- 2. FIX MOBILE NOTIFICATION TRIGGER
-- =========================================================================

-- Replace mobile notification function
CREATE OR REPLACE FUNCTION mobile_notify_new_contractor()
RETURNS TRIGGER AS $$
DECLARE
    project_owner_id UUID;
    project_title TEXT;  -- Renamed to avoid ambiguity
    contractor_full_name TEXT;  -- Renamed to avoid ambiguity
BEGIN
    -- Get project owner and project name
    SELECT p.client_id, p.project_name 
    INTO project_owner_id, project_title
    FROM projects p
    WHERE p.id = NEW.project_id;
    
    -- Get contractor name with table alias
    SELECT c.contractor_name INTO contractor_full_name
    FROM contractors c
    WHERE c.id = NEW.contractor_id;
    
    IF project_owner_id IS NOT NULL THEN
        -- Only proceed if mobile notification function exists
        BEGIN
            PERFORM create_mobile_notification(
                project_owner_id,
                NEW.project_id,
                'general',
                '👷 New Contractor Assignment',
                COALESCE(contractor_full_name, 'A contractor') || ' has been assigned to your project' ||
                CASE WHEN NEW.scope_of_work IS NOT NULL THEN ' for ' || NEW.scope_of_work ELSE '' END,
                'contractor_assignment',
                NEW.id,
                'normal',
                '/team',
                jsonb_build_object(
                    'contractor_id', NEW.contractor_id,
                    'contractor_name', contractor_full_name,
                    'scope_of_work', NEW.scope_of_work,
                    'start_date', NEW.start_date,
                    'project_name', project_title,
                    'source', 'admin_creation'
                )
            );
        EXCEPTION
            WHEN undefined_function THEN
                -- Ignore if function doesn't exist
                NULL;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- 3. RECREATE ALL TRIGGERS
-- =========================================================================

-- Create admin trigger for contractor acceptance
DROP TRIGGER IF EXISTS trigger_contractor_acceptance_notification ON project_contractors;
CREATE TRIGGER trigger_contractor_acceptance_notification
    AFTER UPDATE ON project_contractors
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_contractor_acceptance();

-- Recreate mobile trigger for contractor assignments
DROP TRIGGER IF EXISTS mobile_trigger_new_contractor ON project_contractors;
CREATE TRIGGER mobile_trigger_new_contractor
    AFTER INSERT ON project_contractors
    FOR EACH ROW
    EXECUTE FUNCTION mobile_notify_new_contractor();
`;

    console.log('📋 Executing contractor trigger fix SQL...');
    
    const { error } = await supabaseAdmin.rpc('exec', { query: fixSQL });

    if (error) {
      console.error('❌ Error applying contractor trigger fix:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: 'Failed to apply contractor trigger fix'
      }, { status: 500 });
    }

    console.log('✅ Successfully applied contractor trigger fix v2.0');

    // Verify the fix by checking if triggers exist
    const { data: triggers, error: triggerError } = await supabaseAdmin
      .from('information_schema.triggers')
      .select('trigger_name, action_timing, event_manipulation')
      .eq('event_object_table', 'project_contractors');

    return NextResponse.json({
      success: true,
      message: 'Contractor trigger fix v2.0 applied successfully',
      data: {
        triggersFound: triggers?.length || 0,
        triggers: triggers || []
      }
    });

  } catch (error) {
    console.error('❌ Error in contractor trigger fix API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
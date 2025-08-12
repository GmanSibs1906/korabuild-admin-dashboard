-- =========================================================================
-- 🚨 FINAL CONTRACTOR TRIGGER FIX - RUN THIS IN SUPABASE DASHBOARD
-- =========================================================================
-- Version: FINAL
-- Date: January 4, 2025
-- Purpose: Fix ALL ambiguous column references in contractor assignment triggers
--
-- INSTRUCTIONS:
-- 1. Copy this entire SQL script
-- 2. Go to Supabase Dashboard → SQL Editor
-- 3. Paste and run this script
-- 4. Try assigning a contractor again
-- =========================================================================

-- =========================================================================
-- 1. DROP ALL PROBLEMATIC TRIGGERS FIRST
-- =========================================================================

-- Drop all existing contractor-related triggers that might cause conflicts
DROP TRIGGER IF EXISTS trigger_contractor_acceptance_notification ON project_contractors;
DROP TRIGGER IF EXISTS trigger_new_contractor_assignment ON project_contractors;
DROP TRIGGER IF EXISTS notify_admin_contractor_approval ON project_contractors;
DROP TRIGGER IF EXISTS admin_notify_contractor_assignment ON project_contractors;

-- Drop all problematic functions
DROP FUNCTION IF EXISTS notify_admin_contractor_acceptance();
DROP FUNCTION IF EXISTS notify_admin_new_contractor_assignment();
DROP FUNCTION IF EXISTS notify_admin_contractor_approval();

-- =========================================================================
-- 2. CREATE FIXED ADMIN NOTIFICATION FUNCTION FOR CONTRACTOR ACCEPTANCE
-- =========================================================================

CREATE OR REPLACE FUNCTION notify_admin_contractor_acceptance()
RETURNS TRIGGER AS $$
DECLARE
    project_title TEXT;           -- Renamed to avoid ambiguity
    contractor_full_name TEXT;    -- Renamed to avoid ambiguity
    project_owner_name TEXT;      -- Added for better messages
BEGIN
    -- Only trigger when contract status changes to 'active' (user accepted)
    IF NEW.contract_status = 'active' AND (OLD.contract_status IS NULL OR OLD.contract_status != 'active') THEN
        
        -- Get project details with explicit table aliases
        SELECT p.project_name INTO project_title
        FROM projects p WHERE p.id = NEW.project_id;
        
        -- Get contractor name with explicit table alias
        SELECT c.contractor_name INTO contractor_full_name
        FROM contractors c WHERE c.id = NEW.contractor_id;
        
        -- Get project owner name
        SELECT u.full_name INTO project_owner_name
        FROM projects p
        JOIN users u ON u.id = p.client_id
        WHERE p.id = NEW.project_id;

        -- Create notification for all admins (only if function exists)
        BEGIN
            PERFORM create_admin_notifications(
                'system',                                      -- notification_type
                '🤝 Contractor Assignment Accepted',          -- title
                CASE 
                    WHEN project_title IS NOT NULL AND contractor_full_name IS NOT NULL THEN 
                        COALESCE(project_owner_name, 'Client') || ' accepted ' || contractor_full_name || ' for ' || project_title
                    WHEN contractor_full_name IS NOT NULL THEN 
                        COALESCE(project_owner_name, 'Client') || ' accepted contractor ' || contractor_full_name
                    ELSE 
                        COALESCE(project_owner_name, 'Client') || ' accepted a contractor assignment'
                END,                                          -- message
                'contractor_assignment',                      -- entity_type
                NEW.id,                                      -- entity_id
                NEW.project_id,                              -- project_id
                'normal',                                    -- priority_level
                jsonb_build_object(
                    'source', 'mobile_app_approval',
                    'contractor_id', NEW.contractor_id,
                    'contractor_name', contractor_full_name,
                    'project_name', project_title,
                    'project_owner_name', project_owner_name,
                    'contract_type', NEW.contract_type,
                    'contract_value', NEW.contract_value,
                    'previous_status', OLD.contract_status,
                    'new_status', NEW.contract_status,
                    'approval_date', NOW(),
                    'start_date', NEW.start_date,
                    'notification_subtype', 'contractor_approved'
                )                                            -- metadata
            );
        EXCEPTION
            WHEN undefined_function THEN
                -- Ignore if function doesn't exist
                RAISE NOTICE 'create_admin_notifications function not found, skipping admin notification';
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- 3. UPDATE MOBILE NOTIFICATION FUNCTION (ALREADY FIXED BUT ENSURE CONSISTENCY)
-- =========================================================================

CREATE OR REPLACE FUNCTION mobile_notify_new_contractor()
RETURNS TRIGGER AS $$
DECLARE
    project_owner_id UUID;
    project_title TEXT;          -- Renamed to avoid ambiguity
    contractor_full_name TEXT;   -- Renamed to avoid ambiguity
BEGIN
    -- Get project owner and project details with explicit table aliases
    SELECT p.client_id, p.project_name 
    INTO project_owner_id, project_title
    FROM projects p
    WHERE p.id = NEW.project_id;
    
    -- Get contractor name with explicit table alias
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
                '👷 New Contractor Added',
                COALESCE(contractor_full_name, 'A contractor') || ' has been assigned to your project',
                'contractor',
                NEW.contractor_id,
                'normal',
                '/team',
                jsonb_build_object(
                    'contractor_id', NEW.contractor_id,
                    'contractor_name', contractor_full_name,
                    'contract_type', NEW.contract_type,
                    'start_date', NEW.start_date
                )
            );
        EXCEPTION
            WHEN undefined_function THEN
                -- Ignore if function doesn't exist
                RAISE NOTICE 'create_mobile_notification function not found, skipping mobile notification';
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- 4. RECREATE TRIGGERS WITH FIXED FUNCTIONS
-- =========================================================================

-- Create admin trigger for contractor acceptance (fires on UPDATE to 'active')
CREATE TRIGGER trigger_contractor_acceptance_notification
    AFTER UPDATE ON project_contractors
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_contractor_acceptance();

-- Recreate mobile trigger for new contractor assignments (fires on INSERT)
DROP TRIGGER IF EXISTS mobile_trigger_new_contractor ON project_contractors;
CREATE TRIGGER mobile_trigger_new_contractor
    AFTER INSERT ON project_contractors
    FOR EACH ROW
    EXECUTE FUNCTION mobile_notify_new_contractor();

-- =========================================================================
-- 5. VERIFICATION QUERIES
-- =========================================================================

-- Check that functions were created successfully
SELECT 
    proname as function_name,
    prokind as function_type
FROM pg_proc 
WHERE proname IN (
    'notify_admin_contractor_acceptance',
    'mobile_notify_new_contractor'
)
ORDER BY proname;

-- Check that triggers were created successfully
SELECT 
    trigger_name,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'project_contractors'
  AND trigger_schema = 'public'
ORDER BY trigger_name;

-- =========================================================================
-- SUCCESS MESSAGE
-- =========================================================================

SELECT 'Contractor trigger fix completed successfully! You should now be able to assign contractors without ambiguous column errors.' as status; 
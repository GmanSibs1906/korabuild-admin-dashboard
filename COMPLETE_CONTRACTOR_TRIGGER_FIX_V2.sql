-- =========================================================================
-- 🚨 COMPLETE CONTRACTOR TRIGGER FIX V2.0
-- =========================================================================
-- Version: 2.0
-- Date: January 4, 2025
-- Purpose: Fix ALL ambiguous column references in contractor assignment triggers
-- 
-- ISSUES FIXED:
-- 1. Admin notification triggers: project_name ambiguity
-- 2. Admin notification triggers: contractor_name ambiguity
-- 3. Mobile notification triggers: already fixed but included for completeness
-- =========================================================================

-- =========================================================================
-- 1. FIX ADMIN NOTIFICATION TRIGGER FOR CONTRACTOR ASSIGNMENTS
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

        -- Create notification for all admins
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
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- 2. FIX ADMIN NOTIFICATION TRIGGER FOR NEW CONTRACTOR ASSIGNMENTS
-- =========================================================================

-- Drop existing problematic trigger
DROP TRIGGER IF EXISTS trigger_new_contractor_assignment ON project_contractors;
DROP FUNCTION IF EXISTS notify_admin_new_contractor_assignment();

-- Create fixed admin notification function for new assignments
CREATE OR REPLACE FUNCTION notify_admin_new_contractor_assignment()
RETURNS TRIGGER AS $$
DECLARE
    project_title TEXT;      -- Renamed to avoid ambiguity
    contractor_full_name TEXT;  -- Renamed to avoid ambiguity
BEGIN
    -- Only trigger on INSERT (new assignments)
    -- Get project name with explicit table alias
    SELECT p.project_name INTO project_title
    FROM projects p WHERE p.id = NEW.project_id;
    
    -- Get contractor name with explicit table alias
    SELECT c.contractor_name INTO contractor_full_name
    FROM contractors c WHERE c.id = NEW.contractor_id;

    -- Create notification for all admins
    PERFORM create_admin_notifications(
        'system',                                      -- notification_type
        '👷 New Contractor Assignment',               -- title
        contractor_full_name || ' has been assigned to ' || project_title,  -- message
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
            'scope_of_work', NEW.scope_of_work,
            'start_date', NEW.start_date,
            'source', 'admin_creation',
            'notification_subtype', 'contractor_assigned'
        )                                            -- metadata
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- 3. FIX MOBILE NOTIFICATION TRIGGER (ALREADY FIXED BUT INCLUDED)
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
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- 4. RECREATE ALL TRIGGERS
-- =========================================================================

-- Create admin trigger for contractor acceptance
CREATE TRIGGER trigger_contractor_acceptance_notification
    AFTER UPDATE ON project_contractors
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_contractor_acceptance();

-- Create admin trigger for new contractor assignments (disabled for now)
-- CREATE TRIGGER trigger_new_contractor_assignment
--     AFTER INSERT ON project_contractors
--     FOR EACH ROW
--     EXECUTE FUNCTION notify_admin_new_contractor_assignment();

-- Recreate mobile trigger for contractor assignments
DROP TRIGGER IF EXISTS mobile_trigger_new_contractor ON project_contractors;
CREATE TRIGGER mobile_trigger_new_contractor
    AFTER INSERT ON project_contractors
    FOR EACH ROW
    EXECUTE FUNCTION mobile_notify_new_contractor();

-- =========================================================================
-- 5. CHECK AND FIX ANY OTHER PROBLEMATIC TRIGGERS
-- =========================================================================

-- Check for any other triggers that might have ambiguous references
-- You can run this query to see all triggers on project_contractors:
-- SELECT trigger_name, action_timing, event_manipulation 
-- FROM information_schema.triggers 
-- WHERE event_object_table = 'project_contractors';

-- =========================================================================
-- VERIFICATION
-- =========================================================================
-- Run this to verify all functions were created:
SELECT proname, proargtypes 
FROM pg_proc 
WHERE proname IN (
    'notify_admin_contractor_acceptance',
    'notify_admin_new_contractor_assignment', 
    'mobile_notify_new_contractor'
);

-- Run this to verify triggers were created:
SELECT trigger_name, action_timing, event_manipulation 
FROM information_schema.triggers 
WHERE event_object_table = 'project_contractors'
ORDER BY trigger_name;

-- =========================================================================
-- SUCCESS MESSAGE
-- =========================================================================
-- If you see the functions and triggers listed above, the fix is complete!
-- You should now be able to assign contractors without ambiguous column errors. 
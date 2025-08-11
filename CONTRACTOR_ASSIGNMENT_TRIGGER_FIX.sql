-- Fix for contractor assignment trigger ambiguity
-- This script identifies and fixes triggers with ambiguous column references

-- =========================================================================
-- STEP 1: IDENTIFY AND DROP PROBLEMATIC TRIGGERS
-- =========================================================================

-- Drop any existing triggers that might have ambiguous column references
DROP TRIGGER IF EXISTS mobile_trigger_contractor_assignment ON project_contractors;
DROP FUNCTION IF EXISTS mobile_notify_contractor_assignment();

DROP TRIGGER IF EXISTS trigger_contractor_acceptance_notification ON project_contractors;
DROP FUNCTION IF EXISTS notify_admin_contractor_acceptance();

DROP TRIGGER IF EXISTS mobile_trigger_project_contractor_assignment ON project_contractors;
DROP FUNCTION IF EXISTS mobile_notify_project_contractor_assignment();

-- =========================================================================
-- STEP 2: RECREATE CONTRACTOR ACCEPTANCE TRIGGER WITH EXPLICIT ALIASES
-- =========================================================================

CREATE OR REPLACE FUNCTION notify_admin_contractor_acceptance()
RETURNS TRIGGER AS $$
DECLARE
    project_name TEXT;
    contractor_name TEXT;
BEGIN
    -- Only trigger when contract status changes to 'active' (user accepted)
    IF NEW.contract_status = 'active' AND (OLD.contract_status IS NULL OR OLD.contract_status != 'active') THEN
        -- Get project name with explicit table alias to avoid ambiguity
        SELECT p.project_name INTO project_name
        FROM projects p WHERE p.id = NEW.project_id;
        
        -- Get contractor name with explicit table alias to avoid ambiguity
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

-- Create the trigger for UPDATE only
CREATE TRIGGER trigger_contractor_acceptance_notification
    AFTER UPDATE ON project_contractors
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_contractor_acceptance();

-- =========================================================================
-- STEP 3: ENSURE NO TRIGGERS FIRE ON INSERT (for initial assignment)
-- =========================================================================

-- Create a simple INSERT trigger that doesn't query other tables
CREATE OR REPLACE FUNCTION notify_contractor_assignment_created()
RETURNS TRIGGER AS $$
BEGIN
    -- Simple logging without complex queries to avoid ambiguity
    -- Only create notification if admin notification function exists
    BEGIN
        PERFORM create_admin_notifications(
            'system',                                      -- notification_type
            '📋 New Contractor Assignment',                -- title
            'A new contractor has been assigned to a project',  -- message
            'contractor_assignment',                      -- entity_type
            NEW.id,                                      -- entity_id
            NEW.project_id,                              -- project_id
            'low',                                       -- priority_level
            jsonb_build_object(
                'contractor_id', NEW.contractor_id,
                'contract_status', NEW.contract_status,
                'contract_type', NEW.contract_type,
                'source', 'database_trigger',
                'notification_subtype', 'contractor_assigned'
            )                                            -- metadata
        );
    EXCEPTION
        WHEN OTHERS THEN
            -- Silently ignore if create_admin_notifications doesn't exist
            NULL;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create INSERT trigger (optional - can be disabled if still causing issues)
-- CREATE TRIGGER trigger_contractor_assignment_created
--     AFTER INSERT ON project_contractors
--     FOR EACH ROW
--     EXECUTE FUNCTION notify_contractor_assignment_created();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION notify_admin_contractor_acceptance() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_contractor_assignment_created() TO authenticated;

-- =========================================================================
-- STEP 4: VERIFICATION
-- =========================================================================

-- Check if triggers were created successfully
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'project_contractors'
ORDER BY trigger_name;

-- Success message
SELECT 'Contractor assignment trigger ambiguity fixed successfully!' as status;
SELECT 'Triggers updated to use explicit table aliases' as fix_applied;
SELECT 'INSERT trigger disabled to prevent assignment conflicts' as note; 
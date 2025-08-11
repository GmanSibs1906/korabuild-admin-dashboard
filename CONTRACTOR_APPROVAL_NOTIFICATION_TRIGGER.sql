-- =========================================================================
-- 🎯 CONTRACTOR APPROVAL NOTIFICATION TRIGGER (UPDATED)
-- =========================================================================
-- Version: 1.1.0
-- Date: January 20, 2025
-- Purpose: Send admin notifications when user approves contractor assignment
-- 
-- TRIGGER EVENT: When contract_status changes to 'active' (user approved)
-- NOTIFICATION TARGET: Admin dashboard
-- FILTER COMPATIBLE: Marked as mobile_app_approval to pass admin filters
-- =========================================================================

-- Create function to notify admins when contractor is approved
CREATE OR REPLACE FUNCTION notify_admin_contractor_approved()
RETURNS TRIGGER AS $$
DECLARE
    project_name TEXT;
    contractor_full_name TEXT;
    project_owner_name TEXT;
BEGIN
    -- Only trigger when contract status changes to 'active' (user approved)
    IF NEW.contract_status = 'active' AND (OLD.contract_status IS NULL OR OLD.contract_status != 'active') THEN
        
        -- Get project details with table alias to avoid ambiguity
        SELECT p.project_name INTO project_name
        FROM projects p
        WHERE p.id = NEW.project_id;
        
        -- Get contractor name with table alias to avoid ambiguity
        SELECT c.contractor_name INTO contractor_full_name
        FROM contractors c
        WHERE c.id = NEW.contractor_id;
        
        -- Get project owner name for better notification message
        SELECT u.full_name INTO project_owner_name
        FROM projects p
        JOIN users u ON u.id = p.client_id
        WHERE p.id = NEW.project_id;
        
        -- Create notification for all admins
        BEGIN
            PERFORM create_admin_notifications(
                'system',                                      -- notification_type
                '🤝 Contractor Assignment Accepted',          -- title
                CASE 
                    WHEN project_name IS NOT NULL AND contractor_full_name IS NOT NULL THEN 
                        COALESCE(project_owner_name, 'Client') || ' accepted ' || contractor_full_name || ' for ' || project_name
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
                    'contractor_id', NEW.contractor_id,
                    'contractor_name', contractor_full_name,
                    'project_name', project_name,
                    'project_owner_name', project_owner_name,
                    'contract_type', NEW.contract_type,
                    'contract_value', NEW.contract_value,
                    'start_date', NEW.start_date,
                    'previous_status', OLD.contract_status,
                    'new_status', NEW.contract_status,
                    'approval_date', NOW(),
                    'source', 'mobile_app_approval',           -- IMPORTANT: Mark as mobile app approval
                    'notification_subtype', 'contractor_approved',
                    'user_action', true,                       -- Mark as user action
                    'created_via', 'mobile_app'                -- Indicate origin
                )                                            -- metadata
            );
        EXCEPTION
            WHEN OTHERS THEN
                -- Log error but don't fail the main operation
                RAISE WARNING 'Failed to create admin notification for contractor approval: %', SQLERRM;
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger for contractor approval
DROP TRIGGER IF EXISTS trigger_contractor_approval_notification ON project_contractors;
CREATE TRIGGER trigger_contractor_approval_notification
    AFTER UPDATE ON project_contractors
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_contractor_approved();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION notify_admin_contractor_approved() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_admin_contractor_approved() TO anon;

-- =========================================================================
-- UPDATE EXISTING CONTRACTOR ASSIGNMENT TRIGGER TO MARK AS ADMIN-CREATED
-- =========================================================================
-- Update the existing contractor assignment trigger to mark it as admin-created
-- so it gets filtered out

CREATE OR REPLACE FUNCTION mobile_notify_new_contractor()
RETURNS TRIGGER AS $$
DECLARE
    project_owner_id UUID;
    project_name TEXT;
    contractor_full_name TEXT;  -- Changed variable name to avoid ambiguity
BEGIN
    -- Get project owner and details
    SELECT p.client_id, p.project_name
    INTO project_owner_id, project_name
    FROM projects p
    WHERE p.id = NEW.project_id;
    
    -- Get contractor name with table alias to avoid ambiguity
    SELECT c.contractor_name INTO contractor_full_name
    FROM contractors c
    WHERE c.id = NEW.contractor_id;
    
    IF project_owner_id IS NOT NULL THEN
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
                'start_date', NEW.start_date,
                'source', 'admin_creation',              -- Mark as admin-created
                'created_via', 'admin_dashboard'         -- Indicate admin origin
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- VERIFICATION QUERIES
-- =========================================================================
-- Verify the triggers were created:
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'project_contractors'
  AND trigger_name IN ('trigger_contractor_approval_notification', 'mobile_trigger_new_contractor');

-- Success message
SELECT 'Contractor notification filtering updated successfully!' as status;
SELECT 'Admin-created notifications will be filtered out' as admin_notifications;
SELECT 'Mobile app approvals will be shown' as mobile_approvals; 
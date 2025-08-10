-- =========================================================================
-- KORABUILD ADMIN DASHBOARD - NOTIFICATION TRIGGERS
-- =========================================================================
-- Version: 1.0.0
-- Date: December 15, 2024
-- Purpose: Create notification triggers for admin dashboard
-- 
-- ⚠️  MOBILE APP COMPATIBILITY WARNING:
-- These triggers are specifically designed for the admin dashboard.
-- Mobile app developers should read NOTIFICATION_TRIGGERS_SCHEMA.md
-- before creating any additional triggers to avoid conflicts.
-- =========================================================================

-- =========================================================================
-- CENTRAL ADMIN NOTIFICATION FUNCTION
-- =========================================================================
-- This function creates notifications for ALL admin users
-- DO NOT MODIFY without coordinating with mobile app team

CREATE OR REPLACE FUNCTION create_admin_notifications(
    p_notification_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_project_id UUID DEFAULT NULL,
    p_priority_level TEXT DEFAULT 'normal',
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
DECLARE
    admin_user RECORD;
BEGIN
    -- Get all admin users and create notifications for each
    FOR admin_user IN 
        SELECT id FROM users WHERE role = 'admin'
    LOOP
        INSERT INTO notifications (
            user_id,
            project_id,
            notification_type,
            title,
            message,
            entity_id,
            entity_type,
            priority_level,
            is_read,
            action_url,
            metadata,
            priority,           -- Legacy field for compatibility
            is_pushed,
            is_sent,
            created_at
        ) VALUES (
            admin_user.id,
            p_project_id,
            p_notification_type,
            p_title,
            p_message,
            p_entity_id,
            p_entity_type,
            p_priority_level,
            false,
            CASE 
                WHEN p_entity_type = 'document' THEN '/documents'
                WHEN p_entity_type = 'request' THEN '/requests'
                WHEN p_entity_type = 'order' THEN '/orders'
                WHEN p_entity_type = 'contractor_assignment' THEN '/contractors'
                ELSE '/dashboard'
            END,
            p_metadata,
            p_priority_level,   -- Legacy field for compatibility
            false,
            false,
            now()
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- 1. DOCUMENT UPLOAD NOTIFICATIONS
-- =========================================================================
-- Triggers when users upload new documents to notify admins
-- Table: documents
-- Event: AFTER INSERT

CREATE OR REPLACE FUNCTION notify_admin_document_upload()
RETURNS TRIGGER AS $$
DECLARE
    project_name TEXT;
    uploader_name TEXT;
BEGIN
    -- Get project name
    SELECT projects.project_name INTO project_name
    FROM projects WHERE projects.id = NEW.project_id;
    
    -- Get uploader name
    SELECT users.full_name INTO uploader_name
    FROM users WHERE users.id = NEW.uploaded_by;

    -- Create notification for all admins
    PERFORM create_admin_notifications(
        'document_upload',                                    -- notification_type
        '📄 New Document Uploaded',                          -- title
        CASE 
            WHEN project_name IS NOT NULL THEN 
                uploader_name || ' uploaded "' || NEW.document_name || '" to ' || project_name
            ELSE 
                uploader_name || ' uploaded "' || NEW.document_name || '"'
        END,                                                 -- message
        'document',                                          -- entity_type
        NEW.id,                                             -- entity_id
        NEW.project_id,                                     -- project_id
        'normal',                                           -- priority_level
        jsonb_build_object(
            'document_name', NEW.document_name,
            'document_type', NEW.document_type,
            'uploader_id', NEW.uploaded_by,
            'uploader_name', uploader_name,
            'project_name', project_name,
            'source', 'database_trigger',
            'notification_subtype', 'document_uploaded'
        )                                                   -- metadata
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_document_upload_notification ON documents;
CREATE TRIGGER trigger_document_upload_notification
    AFTER INSERT ON documents
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_document_upload();

-- =========================================================================
-- 2. NEW REQUEST NOTIFICATIONS
-- =========================================================================
-- Triggers when users submit new requests to notify admins
-- Table: requests
-- Event: AFTER INSERT

CREATE OR REPLACE FUNCTION notify_admin_new_request()
RETURNS TRIGGER AS $$
DECLARE
    project_name TEXT;
    client_name TEXT;
BEGIN
    -- Get project name
    SELECT projects.project_name INTO project_name
    FROM projects WHERE projects.id = NEW.project_id;
    
    -- Get client name
    SELECT users.full_name INTO client_name
    FROM users WHERE users.id = NEW.client_id;

    -- Create notification for all admins
    PERFORM create_admin_notifications(
        'system',                                           -- notification_type
        '🔔 New Request Submitted',                         -- title
        CASE 
            WHEN project_name IS NOT NULL THEN 
                client_name || ' submitted a ' || NEW.request_type || ' request for ' || project_name
            ELSE 
                client_name || ' submitted a ' || NEW.request_type || ' request: ' || NEW.title
        END,                                               -- message
        'request',                                         -- entity_type
        NEW.id,                                           -- entity_id
        NEW.project_id,                                   -- project_id
        CASE 
            WHEN NEW.priority = 'urgent' THEN 'urgent'
            WHEN NEW.priority = 'high' THEN 'high'
            ELSE 'normal'
        END,                                              -- priority_level
        jsonb_build_object(
            'request_type', NEW.request_type,
            'request_title', NEW.title,
            'client_id', NEW.client_id,
            'client_name', client_name,
            'project_name', project_name,
            'priority', NEW.priority,
            'source', 'database_trigger',
            'notification_subtype', 'new_request'
        )                                                 -- metadata
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_new_request_notification ON requests;
CREATE TRIGGER trigger_new_request_notification
    AFTER INSERT ON requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_new_request();

-- =========================================================================
-- 3. ORDER APPROVAL NOTIFICATIONS
-- =========================================================================
-- Triggers when order status changes to 'approved' to notify admins
-- Table: project_orders
-- Event: AFTER UPDATE (when status changes to 'approved')

CREATE OR REPLACE FUNCTION notify_admin_order_approval()
RETURNS TRIGGER AS $$
DECLARE
    project_name TEXT;
    approver_name TEXT;
BEGIN
    -- Only trigger on status change to 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        -- Get project name
        SELECT projects.project_name INTO project_name
        FROM projects WHERE projects.id = NEW.project_id;
        
        -- Get approver name
        SELECT users.full_name INTO approver_name
        FROM users WHERE users.id = NEW.approved_by;

        -- Create notification for all admins
        PERFORM create_admin_notifications(
            'system',                                      -- notification_type
            '✅ Order Approved',                          -- title
            CASE 
                WHEN project_name IS NOT NULL THEN 
                    'Order #' || NEW.order_number || ' was approved for ' || project_name || ' ($' || NEW.total_amount || ')'
                ELSE 
                    'Order #' || NEW.order_number || ' was approved ($' || NEW.total_amount || ')'
            END,                                          -- message
            'order',                                      -- entity_type
            NEW.id,                                      -- entity_id
            NEW.project_id,                              -- project_id
            'normal',                                    -- priority_level
            jsonb_build_object(
                'order_number', NEW.order_number,
                'total_amount', NEW.total_amount,
                'approved_by', NEW.approved_by,
                'approver_name', approver_name,
                'project_name', project_name,
                'previous_status', OLD.status,
                'new_status', NEW.status,
                'source', 'database_trigger',
                'notification_subtype', 'order_approved'
            )                                            -- metadata
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_order_approval_notification ON project_orders;
CREATE TRIGGER trigger_order_approval_notification
    AFTER UPDATE ON project_orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_order_approval();

-- =========================================================================
-- 4. CONTRACTOR ASSIGNMENT ACCEPTANCE NOTIFICATIONS
-- =========================================================================
-- Triggers when contractor assignment status changes to 'active' (user accepted)
-- Table: project_contractors
-- Event: AFTER UPDATE (when contract_status changes to 'active')

CREATE OR REPLACE FUNCTION notify_admin_contractor_acceptance()
RETURNS TRIGGER AS $$
DECLARE
    project_name TEXT;
    contractor_name TEXT;
BEGIN
    -- Only trigger when contract status changes to 'active' (user accepted)
    IF NEW.contract_status = 'active' AND (OLD.contract_status IS NULL OR OLD.contract_status != 'active') THEN
        -- Get project name
        SELECT projects.project_name INTO project_name
        FROM projects WHERE projects.id = NEW.project_id;
        
        -- Get contractor name
        SELECT contractors.contractor_name INTO contractor_name
        FROM contractors WHERE contractors.id = NEW.contractor_id;

        -- Create notification for all admins
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
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_contractor_acceptance_notification ON project_contractors;
CREATE TRIGGER trigger_contractor_acceptance_notification
    AFTER UPDATE ON project_contractors
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_contractor_acceptance();

-- =========================================================================
-- 5. DOCUMENT APPROVAL STATUS CHANGE NOTIFICATIONS
-- =========================================================================
-- Triggers when document approval status changes to notify admins
-- Table: documents
-- Event: AFTER UPDATE (when approval_status changes)

CREATE OR REPLACE FUNCTION notify_admin_document_approval()
RETURNS TRIGGER AS $$
DECLARE
    project_name TEXT;
    approver_name TEXT;
BEGIN
    -- Only trigger on approval status changes (not initial creation)
    IF NEW.approval_status != OLD.approval_status AND OLD.approval_status IS NOT NULL THEN
        -- Get project name
        SELECT projects.project_name INTO project_name
        FROM projects WHERE projects.id = NEW.project_id;
        
        -- Get approver name
        SELECT users.full_name INTO approver_name
        FROM users WHERE users.id = NEW.approved_by;

        -- Create notification for all admins based on status
        PERFORM create_admin_notifications(
            'document_update',                            -- notification_type
            CASE 
                WHEN NEW.approval_status = 'approved' THEN '✅ Document Approved'
                WHEN NEW.approval_status = 'rejected' THEN '❌ Document Rejected'
                WHEN NEW.approval_status = 'revision_required' THEN '📝 Document Needs Revision'
                ELSE '📄 Document Status Updated'
            END,                                         -- title
            CASE 
                WHEN project_name IS NOT NULL THEN 
                    '"' || NEW.document_name || '" in ' || project_name || ' is now ' || NEW.approval_status
                ELSE 
                    '"' || NEW.document_name || '" is now ' || NEW.approval_status
            END,                                         -- message
            'document',                                  -- entity_type
            NEW.id,                                     -- entity_id
            NEW.project_id,                             -- project_id
            CASE 
                WHEN NEW.approval_status = 'rejected' THEN 'high'
                WHEN NEW.approval_status = 'revision_required' THEN 'high'
                ELSE 'normal'
            END,                                        -- priority_level
            jsonb_build_object(
                'document_name', NEW.document_name,
                'document_type', NEW.document_type,
                'approved_by', NEW.approved_by,
                'approver_name', approver_name,
                'project_name', project_name,
                'previous_status', OLD.approval_status,
                'new_status', NEW.approval_status,
                'source', 'database_trigger',
                'notification_subtype', 'document_status_changed'
            )                                           -- metadata
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_document_approval_notification ON documents;
CREATE TRIGGER trigger_document_approval_notification
    AFTER UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_document_approval();

-- =========================================================================
-- VERIFICATION AND TESTING
-- =========================================================================

-- Verify all triggers are created successfully
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name IN (
    'trigger_document_upload_notification',
    'trigger_new_request_notification', 
    'trigger_order_approval_notification',
    'trigger_contractor_acceptance_notification',
    'trigger_document_approval_notification'
)
ORDER BY event_object_table, trigger_name;

-- Check that the central function exists
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'create_admin_notifications';

-- =========================================================================
-- INSTALLATION COMPLETE
-- =========================================================================
-- If you see 5 triggers and 1 function in the verification queries above,
-- the installation was successful.
--
-- Next Steps:
-- 1. Test each trigger by creating/updating records
-- 2. Monitor the notifications table for new entries
-- 3. Check the admin dashboard for real-time notifications
--
-- For mobile app integration, see: NOTIFICATION_TRIGGERS_SCHEMA.md
-- ========================================================================= 
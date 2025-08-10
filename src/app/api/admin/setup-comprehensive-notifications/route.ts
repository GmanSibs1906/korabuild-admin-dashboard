import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === 'setup_all_triggers') {
      const comprehensiveTriggerSQL = `
-- =================================================================
-- COMPREHENSIVE NOTIFICATION TRIGGERS FOR KORABUILD ADMIN
-- =================================================================
-- This script sets up notifications for:
-- 1. Document uploads
-- 2. New requests 
-- 3. Order approvals
-- 4. Contractor assignments accepted by users
-- =================================================================

-- Function to create notifications for admins
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
    -- Get all admin users
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
            priority,
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
            p_priority_level,
            false,
            false,
            now()
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- 1. DOCUMENT UPLOAD NOTIFICATIONS
-- =================================================================

-- Trigger function for document uploads
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
        'document_upload',
        '📄 New Document Uploaded',
        CASE 
            WHEN project_name IS NOT NULL THEN 
                uploader_name || ' uploaded "' || NEW.document_name || '" to ' || project_name
            ELSE 
                uploader_name || ' uploaded "' || NEW.document_name || '"'
        END,
        'document',
        NEW.id,
        NEW.project_id,
        'normal',
        jsonb_build_object(
            'document_name', NEW.document_name,
            'document_type', NEW.document_type,
            'uploader_id', NEW.uploaded_by,
            'uploader_name', uploader_name,
            'project_name', project_name,
            'source', 'database_trigger',
            'notification_subtype', 'document_uploaded'
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for document uploads
DROP TRIGGER IF EXISTS trigger_document_upload_notification ON documents;
CREATE TRIGGER trigger_document_upload_notification
    AFTER INSERT ON documents
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_document_upload();

-- =================================================================
-- 2. NEW REQUEST NOTIFICATIONS
-- =================================================================

-- Trigger function for new requests
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
        'system',
        '🔔 New Request Submitted',
        CASE 
            WHEN project_name IS NOT NULL THEN 
                client_name || ' submitted a ' || NEW.request_type || ' request for ' || project_name
            ELSE 
                client_name || ' submitted a ' || NEW.request_type || ' request: ' || NEW.title
        END,
        'request',
        NEW.id,
        NEW.project_id,
        CASE 
            WHEN NEW.priority = 'urgent' THEN 'urgent'
            WHEN NEW.priority = 'high' THEN 'high'
            ELSE 'normal'
        END,
        jsonb_build_object(
            'request_type', NEW.request_type,
            'request_title', NEW.title,
            'client_id', NEW.client_id,
            'client_name', client_name,
            'project_name', project_name,
            'priority', NEW.priority,
            'source', 'database_trigger',
            'notification_subtype', 'new_request'
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new requests
DROP TRIGGER IF EXISTS trigger_new_request_notification ON requests;
CREATE TRIGGER trigger_new_request_notification
    AFTER INSERT ON requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_new_request();

-- =================================================================
-- 3. ORDER APPROVAL NOTIFICATIONS
-- =================================================================

-- Trigger function for order status changes (approvals)
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
            'system',
            '✅ Order Approved',
            CASE 
                WHEN project_name IS NOT NULL THEN 
                    'Order #' || NEW.order_number || ' was approved for ' || project_name || ' ($' || NEW.total_amount || ')'
                ELSE 
                    'Order #' || NEW.order_number || ' was approved ($' || NEW.total_amount || ')'
            END,
            'order',
            NEW.id,
            NEW.project_id,
            'normal',
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
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order approvals
DROP TRIGGER IF EXISTS trigger_order_approval_notification ON project_orders;
CREATE TRIGGER trigger_order_approval_notification
    AFTER UPDATE ON project_orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_order_approval();

-- =================================================================
-- 4. CONTRACTOR ASSIGNMENT ACCEPTANCE NOTIFICATIONS
-- =================================================================

-- Trigger function for contractor assignment status changes
CREATE OR REPLACE FUNCTION notify_admin_contractor_acceptance()
RETURNS TRIGGER AS $$
DECLARE
    project_name TEXT;
    contractor_name TEXT;
    user_name TEXT;
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
            'system',
            '🤝 Contractor Assignment Accepted',
            CASE 
                WHEN project_name IS NOT NULL THEN 
                    contractor_name || ' accepted assignment to ' || project_name
                ELSE 
                    contractor_name || ' accepted contractor assignment'
            END,
            'contractor_assignment',
            NEW.id,
            NEW.project_id,
            'normal',
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
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for contractor assignment acceptance
DROP TRIGGER IF EXISTS trigger_contractor_acceptance_notification ON project_contractors;
CREATE TRIGGER trigger_contractor_acceptance_notification
    AFTER UPDATE ON project_contractors
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_contractor_acceptance();

-- =================================================================
-- 5. ADDITIONAL: DOCUMENT APPROVAL STATUS CHANGES
-- =================================================================

-- Trigger function for document approval status changes
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
            'document_update',
            CASE 
                WHEN NEW.approval_status = 'approved' THEN '✅ Document Approved'
                WHEN NEW.approval_status = 'rejected' THEN '❌ Document Rejected'
                WHEN NEW.approval_status = 'revision_required' THEN '📝 Document Needs Revision'
                ELSE '📄 Document Status Updated'
            END,
            CASE 
                WHEN project_name IS NOT NULL THEN 
                    '"' || NEW.document_name || '" in ' || project_name || ' is now ' || NEW.approval_status
                ELSE 
                    '"' || NEW.document_name || '" is now ' || NEW.approval_status
            END,
            'document',
            NEW.id,
            NEW.project_id,
            CASE 
                WHEN NEW.approval_status = 'rejected' THEN 'high'
                WHEN NEW.approval_status = 'revision_required' THEN 'high'
                ELSE 'normal'
            END,
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
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for document approval status changes
DROP TRIGGER IF EXISTS trigger_document_approval_notification ON documents;
CREATE TRIGGER trigger_document_approval_notification
    AFTER UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_document_approval();

-- =================================================================
-- VERIFICATION AND TESTING
-- =================================================================

-- Verify all triggers are created
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_name IN (
    'trigger_document_upload_notification',
    'trigger_new_request_notification', 
    'trigger_order_approval_notification',
    'trigger_contractor_acceptance_notification',
    'trigger_document_approval_notification'
)
ORDER BY event_object_table, trigger_name;
`;

      return NextResponse.json({
        success: true,
        message: 'Comprehensive notification triggers SQL generated',
        sql: comprehensiveTriggerSQL,
        triggers_created: [
          'Document upload notifications',
          'New request notifications', 
          'Order approval notifications',
          'Contractor assignment acceptance notifications',
          'Document approval status change notifications'
        ],
        instructions: [
          '1. Copy the SQL and run it in your Supabase SQL editor',
          '2. This will create triggers that notify admins for all requested events',
          '3. All triggers use the existing notifications table structure',
          '4. No mobile app functionality will be affected',
          '5. Test each trigger using the provided test APIs'
        ]
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use action: "setup_all_triggers"'
    });

  } catch (error) {
    console.error('❌ Error generating comprehensive triggers:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
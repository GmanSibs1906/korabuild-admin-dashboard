-- PAYMENT MILESTONE TRIGGER FIX
-- This script fixes ambiguous column reference "milestone_name" in payment-related triggers
-- The error occurs when creating next payments in enhanced_credit_accounts table

-- =========================================================================
-- FIX 1: DROP ANY EXISTING PROBLEMATIC PAYMENT TRIGGERS
-- =========================================================================

-- Check for and drop any existing payment notification triggers that might be causing issues
DROP TRIGGER IF EXISTS mobile_trigger_new_payment ON enhanced_credit_accounts;
DROP TRIGGER IF EXISTS mobile_trigger_payment_update ON enhanced_credit_accounts;
DROP TRIGGER IF EXISTS trigger_payment_notification ON payments;
DROP TRIGGER IF EXISTS trigger_credit_account_notification ON enhanced_credit_accounts;

-- Drop any problematic functions
DROP FUNCTION IF EXISTS mobile_notify_new_payment();
DROP FUNCTION IF EXISTS mobile_notify_payment_update();
DROP FUNCTION IF EXISTS notify_payment_created();
DROP FUNCTION IF EXISTS notify_credit_account_change();

-- =========================================================================
-- FIX 2: CREATE CORRECTED PAYMENT NOTIFICATION FUNCTION
-- =========================================================================

-- Create a new payment notification function with proper table aliases
CREATE OR REPLACE FUNCTION mobile_notify_payment_created()
RETURNS TRIGGER AS $$
DECLARE
    project_owner_id UUID;
    project_name TEXT;
    milestone_name TEXT;
    payment_description TEXT;
BEGIN
    -- Only notify for new credit accounts/payments
    IF TG_OP = 'INSERT' THEN
        -- Get project owner and name with explicit table alias
        SELECT p.client_id, p.project_name
        INTO project_owner_id, project_name
        FROM projects p
        WHERE p.id = NEW.project_id;
        
        -- Get milestone name if milestone_id exists (with explicit table alias)
        IF NEW.milestone_id IS NOT NULL THEN
            SELECT pm.milestone_name
            INTO milestone_name
            FROM project_milestones pm
            WHERE pm.id = NEW.milestone_id;
            
            payment_description := 'Payment for milestone: ' || COALESCE(milestone_name, 'Unknown Milestone');
        ELSE
            payment_description := 'Payment scheduled for your project';
        END IF;
        
        -- Only create notification if we have a valid project owner
        IF project_owner_id IS NOT NULL THEN
            -- Create mobile notification using the helper function
            PERFORM create_mobile_notification(
                project_owner_id,                                      -- user_id
                NEW.project_id,                                        -- project_id
                'general',                                             -- notification_type (using valid type)
                '💰 Payment Scheduled',                               -- title
                payment_description || ' - Amount: $' || COALESCE(NEW.payment_amount::text, NEW.monthly_payment::text, '0'), -- message
                'payment',                                             -- entity_type
                NEW.id,                                               -- entity_id
                'normal',                                             -- priority_level
                '/finances',                                          -- action_url
                jsonb_build_object(
                    'payment_amount', COALESCE(NEW.payment_amount, NEW.monthly_payment, 0),
                    'next_payment_date', NEW.next_payment_date,
                    'milestone_id', NEW.milestone_id,
                    'milestone_name', milestone_name,
                    'project_name', project_name,
                    'credit_status', NEW.credit_status,
                    'payment_sequence', COALESCE(NEW.payment_sequence, 1),
                    'total_payments', COALESCE(NEW.total_payments, 1),
                    'source', 'admin_dashboard_payment_creation'
                )                                                     -- metadata
            );
            
            RAISE LOG 'Created payment notification for user: % (payment: %)', project_owner_id, NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- FIX 3: CREATE CORRECTED PAYMENT UPDATE FUNCTION
-- =========================================================================

-- Create a function for payment updates with proper table aliases
CREATE OR REPLACE FUNCTION mobile_notify_payment_updated()
RETURNS TRIGGER AS $$
DECLARE
    project_owner_id UUID;
    project_name TEXT;
    milestone_name TEXT;
    status_message TEXT;
    title_text TEXT;
BEGIN
    -- Only notify on meaningful changes (not every update)
    IF TG_OP = 'UPDATE' AND (
        OLD.credit_status != NEW.credit_status OR
        OLD.next_payment_date != NEW.next_payment_date OR
        OLD.payment_amount != NEW.payment_amount OR
        OLD.monthly_payment != NEW.monthly_payment
    ) THEN
        -- Get project owner and name with explicit table alias
        SELECT p.client_id, p.project_name
        INTO project_owner_id, project_name
        FROM projects p
        WHERE p.id = NEW.project_id;
        
        -- Get milestone name if milestone_id exists (with explicit table alias)
        IF NEW.milestone_id IS NOT NULL THEN
            SELECT pm.milestone_name
            INTO milestone_name
            FROM project_milestones pm
            WHERE pm.id = NEW.milestone_id;
        END IF;
        
        -- Create status-specific message
        IF OLD.credit_status != NEW.credit_status THEN
            title_text := '💳 Payment Status Updated';
            status_message := 'Payment status changed from ' || OLD.credit_status || ' to ' || NEW.credit_status;
        ELSIF OLD.next_payment_date != NEW.next_payment_date THEN
            title_text := '📅 Payment Date Updated';
            status_message := 'Next payment date updated to ' || TO_CHAR(NEW.next_payment_date::date, 'FMMonth DD, YYYY');
        ELSIF OLD.payment_amount != NEW.payment_amount OR OLD.monthly_payment != NEW.monthly_payment THEN
            title_text := '💰 Payment Amount Updated';
            status_message := 'Payment amount updated to $' || COALESCE(NEW.payment_amount::text, NEW.monthly_payment::text, '0');
        ELSE
            RETURN NEW; -- No meaningful change
        END IF;
        
        -- Only create notification if we have a valid project owner
        IF project_owner_id IS NOT NULL THEN
            -- Create mobile notification using the helper function
            PERFORM create_mobile_notification(
                project_owner_id,                                      -- user_id
                NEW.project_id,                                        -- project_id
                'general',                                             -- notification_type (using valid type)
                title_text,                                           -- title
                status_message,                                       -- message
                'payment',                                             -- entity_type
                NEW.id,                                               -- entity_id
                'normal',                                             -- priority_level
                '/finances',                                          -- action_url
                jsonb_build_object(
                    'payment_amount', COALESCE(NEW.payment_amount, NEW.monthly_payment, 0),
                    'next_payment_date', NEW.next_payment_date,
                    'milestone_id', NEW.milestone_id,
                    'milestone_name', milestone_name,
                    'project_name', project_name,
                    'old_status', OLD.credit_status,
                    'new_status', NEW.credit_status,
                    'source', 'admin_dashboard_payment_update'
                )                                                     -- metadata
            );
            
            RAISE LOG 'Created payment update notification for user: % (payment: %)', project_owner_id, NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- FIX 4: CREATE TRIGGERS WITH PROPER TIMING
-- =========================================================================

-- Create trigger for new payment notifications
CREATE TRIGGER mobile_trigger_payment_created
    AFTER INSERT ON enhanced_credit_accounts
    FOR EACH ROW
    EXECUTE FUNCTION mobile_notify_payment_created();

-- Create trigger for payment update notifications
CREATE TRIGGER mobile_trigger_payment_updated
    AFTER UPDATE ON enhanced_credit_accounts
    FOR EACH ROW
    EXECUTE FUNCTION mobile_notify_payment_updated();

-- =========================================================================
-- FIX 5: GRANT NECESSARY PERMISSIONS
-- =========================================================================

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION mobile_notify_payment_created() TO authenticated;
GRANT EXECUTE ON FUNCTION mobile_notify_payment_created() TO anon;
GRANT EXECUTE ON FUNCTION mobile_notify_payment_updated() TO authenticated;
GRANT EXECUTE ON FUNCTION mobile_notify_payment_updated() TO anon;

-- =========================================================================
-- FIX 6: VERIFICATION
-- =========================================================================

-- Log successful creation
SELECT 'Payment milestone triggers fixed successfully - ambiguous milestone_name references resolved' as status; 
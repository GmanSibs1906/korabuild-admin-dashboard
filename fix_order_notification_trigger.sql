-- FIXED: Create function to notify when order status changes
-- This version matches the actual notifications table schema
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
    admin_user RECORD;
    order_info RECORD;
    project_info RECORD;
    supplier_info RECORD;
BEGIN
    -- Only create notifications for specific status changes that are important
    IF NEW.status IN ('approved', 'delivered', 'cancelled') AND 
       (OLD.status IS NULL OR OLD.status != NEW.status) THEN
        
        -- Get order details with project and supplier info
        SELECT 
            po.*,
            p.project_name,
            p.client_id,
            s.supplier_name
        INTO order_info
        FROM project_orders po
        LEFT JOIN projects p ON po.project_id = p.id
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        WHERE po.id = NEW.id;
        
        -- Create notifications for all admin users
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
                metadata,
                created_at,
                updated_at
            ) VALUES (
                admin_user.id,
                order_info.project_id,
                'system',
                CASE 
                    WHEN NEW.status = 'approved' THEN 'Order Approved'
                    WHEN NEW.status = 'delivered' THEN 'Order Delivered'
                    WHEN NEW.status = 'cancelled' THEN 'Order Cancelled'
                    ELSE 'Order Status Updated'
                END,
                CASE 
                    WHEN NEW.status = 'approved' THEN 
                        'Order #' || order_info.order_number || ' for ' || COALESCE(order_info.project_name, 'Unknown Project') || ' has been approved by the client.'
                    WHEN NEW.status = 'delivered' THEN 
                        'Order #' || order_info.order_number || ' for ' || COALESCE(order_info.project_name, 'Unknown Project') || ' has been delivered successfully.'
                    WHEN NEW.status = 'cancelled' THEN 
                        'Order #' || order_info.order_number || ' for ' || COALESCE(order_info.project_name, 'Unknown Project') || ' has been cancelled.'
                    ELSE 
                        'Order #' || order_info.order_number || ' status changed to ' || NEW.status
                END,
                NEW.id,
                'order',
                CASE 
                    WHEN NEW.status = 'approved' THEN 'high'
                    WHEN NEW.status = 'delivered' THEN 'normal'
                    WHEN NEW.status = 'cancelled' THEN 'normal'
                    ELSE 'normal'
                END,
                jsonb_build_object(
                    'notification_subtype', CASE 
                        WHEN NEW.status = 'approved' THEN 'order_approved'
                        WHEN NEW.status = 'delivered' THEN 'order_delivered'
                        WHEN NEW.status = 'cancelled' THEN 'order_cancelled'
                        ELSE 'order_status_change'
                    END,
                    'order_number', order_info.order_number,
                    'project_id', order_info.project_id,
                    'project_name', COALESCE(order_info.project_name, 'Unknown Project'),
                    'supplier_name', COALESCE(order_info.supplier_name, 'Unknown Supplier'),
                    'total_amount', order_info.total_amount,
                    'currency', order_info.currency,
                    'old_status', OLD.status,
                    'new_status', NEW.status,
                    'order_date', order_info.order_date,
                    'priority_alert', CASE 
                        WHEN NEW.status = 'approved' THEN true
                        ELSE false
                    END
                ),
                now(),
                now()
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS trigger_notify_order_status_change ON project_orders;
CREATE TRIGGER trigger_notify_order_status_change
    AFTER UPDATE OF status ON project_orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_order_status_change(); 
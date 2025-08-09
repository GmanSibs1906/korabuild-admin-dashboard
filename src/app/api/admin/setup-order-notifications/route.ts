import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const sqlScript = `
-- Create function to notify when order status changes
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
                notification_type,
                notification_subtype,
                title,
                content,
                related_id,
                metadata,
                priority_alert,
                created_at
            ) VALUES (
                admin_user.id,
                'system',
                CASE 
                    WHEN NEW.status = 'approved' THEN 'order_approved'
                    WHEN NEW.status = 'delivered' THEN 'order_delivered'
                    WHEN NEW.status = 'cancelled' THEN 'order_cancelled'
                    ELSE 'order_status_change'
                END,
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
                jsonb_build_object(
                    'order_number', order_info.order_number,
                    'project_id', order_info.project_id,
                    'project_name', COALESCE(order_info.project_name, 'Unknown Project'),
                    'supplier_name', COALESCE(order_info.supplier_name, 'Unknown Supplier'),
                    'total_amount', order_info.total_amount,
                    'currency', order_info.currency,
                    'old_status', OLD.status,
                    'new_status', NEW.status,
                    'order_date', order_info.order_date
                ),
                CASE 
                    WHEN NEW.status = 'approved' THEN true
                    ELSE false
                END,
                now()
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on project_orders table
DROP TRIGGER IF EXISTS trigger_notify_order_status_change ON project_orders;
CREATE TRIGGER trigger_notify_order_status_change
    AFTER UPDATE OF status ON project_orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_order_status_change();
    `;

    return NextResponse.json({
      success: true,
      sqlScript,
      message: "Order notification setup SQL script generated successfully",
      instructions: [
        "1. Copy the SQL script below",
        "2. Go to your Supabase Dashboard → SQL Editor",
        "3. Paste the script and run it",
        "4. This will create a trigger that automatically generates notifications when order status changes",
        "5. The trigger monitors changes to 'approved', 'delivered', and 'cancelled' statuses",
        "6. Order approved notifications will have priority_alert = true and play a special sound"
      ]
    });

  } catch (error) {
    console.error('❌ [Setup Order Notifications] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate setup script',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 
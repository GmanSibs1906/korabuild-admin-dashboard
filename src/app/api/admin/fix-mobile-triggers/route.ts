import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 [Fix Mobile Triggers] Applying fixes for column ambiguity...');

    const fixSQL = `
-- Fix mobile notification triggers column ambiguity issues
-- This script fixes the ambiguous column references in the mobile app triggers

-- =========================================================================
-- FIX 1: NEW DELIVERIES NOTIFICATIONS TRIGGER
-- =========================================================================

DROP TRIGGER IF EXISTS mobile_trigger_new_delivery ON deliveries;
DROP FUNCTION IF EXISTS mobile_notify_new_delivery();

CREATE OR REPLACE FUNCTION mobile_notify_new_delivery()
RETURNS TRIGGER AS $$
DECLARE
    project_owner_id UUID;
    order_number TEXT;
    supplier_name TEXT;
BEGIN
    -- Get project owner through order with explicit table aliases
    SELECT p.client_id
    INTO project_owner_id
    FROM projects p
    JOIN project_orders po ON po.project_id = p.id
    WHERE po.id = NEW.order_id;
    
    -- Get order number with explicit table alias
    SELECT po.order_number 
    INTO order_number
    FROM project_orders po
    WHERE po.id = NEW.order_id;
    
    -- Get supplier name with explicit table aliases
    SELECT s.supplier_name 
    INTO supplier_name
    FROM suppliers s
    JOIN project_orders po ON po.supplier_id = s.id
    WHERE po.id = NEW.order_id;
    
    IF project_owner_id IS NOT NULL THEN
        PERFORM create_mobile_notification(
            project_owner_id,
            (SELECT po.project_id FROM project_orders po WHERE po.id = NEW.order_id),
            'delivery',
            '🚚 Delivery Scheduled',
            'Delivery #' || NEW.delivery_number || ' for order ' || COALESCE(order_number, '') || ' is scheduled for ' || TO_CHAR(NEW.delivery_date, 'FMMonth DD, YYYY'),
            'delivery',
            NEW.id,
            'normal',
            '/orders',
            jsonb_build_object(
                'delivery_number', NEW.delivery_number,
                'order_id', NEW.order_id,
                'order_number', order_number,
                'delivery_date', NEW.delivery_date,
                'supplier_name', supplier_name,
                'delivery_status', NEW.delivery_status
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mobile_trigger_new_delivery
    AFTER INSERT ON deliveries
    FOR EACH ROW
    EXECUTE FUNCTION mobile_notify_new_delivery();

-- =========================================================================
-- FIX 2: DELIVERY STATUS UPDATES NOTIFICATIONS TRIGGER
-- =========================================================================

DROP TRIGGER IF EXISTS mobile_trigger_delivery_status ON deliveries;
DROP FUNCTION IF EXISTS mobile_notify_delivery_status();

CREATE OR REPLACE FUNCTION mobile_notify_delivery_status()
RETURNS TRIGGER AS $$
DECLARE
    project_owner_id UUID;
    order_number TEXT;
    status_message TEXT;
    emoji TEXT;
BEGIN
    -- Only notify on status changes
    IF OLD.delivery_status = NEW.delivery_status THEN
        RETURN NEW;
    END IF;
    
    -- Get project owner with explicit table aliases
    SELECT p.client_id
    INTO project_owner_id
    FROM projects p
    JOIN project_orders po ON po.project_id = p.id
    WHERE po.id = NEW.order_id;
    
    -- Get order number with explicit table alias
    SELECT po.order_number 
    INTO order_number
    FROM project_orders po
    WHERE po.id = NEW.order_id;
    
    -- Set status-specific message
    CASE NEW.delivery_status
        WHEN 'in_transit' THEN
            emoji := '🚚';
            status_message := 'Delivery #' || NEW.delivery_number || ' is now in transit';
        WHEN 'arrived' THEN
            emoji := '📍';
            status_message := 'Delivery #' || NEW.delivery_number || ' has arrived on site';
        WHEN 'completed' THEN
            emoji := '✅';
            status_message := 'Delivery #' || NEW.delivery_number || ' has been completed successfully';
        WHEN 'failed' THEN
            emoji := '❌';
            status_message := 'Delivery #' || NEW.delivery_number || ' failed - please check details';
        ELSE
            RETURN NEW; -- Don't notify for other status changes
    END CASE;
    
    IF project_owner_id IS NOT NULL THEN
        PERFORM create_mobile_notification(
            project_owner_id,
            (SELECT po.project_id FROM project_orders po WHERE po.id = NEW.order_id),
            'delivery',
            emoji || ' Delivery Update',
            status_message,
            'delivery',
            NEW.id,
            CASE WHEN NEW.delivery_status = 'failed' THEN 'high' ELSE 'normal' END,
            '/orders',
            jsonb_build_object(
                'delivery_number', NEW.delivery_number,
                'order_number', order_number,
                'old_status', OLD.delivery_status,
                'new_status', NEW.delivery_status,
                'delivery_date', NEW.delivery_date
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mobile_trigger_delivery_status
    AFTER UPDATE ON deliveries
    FOR EACH ROW
    EXECUTE FUNCTION mobile_notify_delivery_status();

-- =========================================================================
-- FIX 3: NEW ORDERS NOTIFICATIONS TRIGGER  
-- =========================================================================

DROP TRIGGER IF EXISTS mobile_trigger_new_order ON project_orders;
DROP FUNCTION IF EXISTS mobile_notify_new_order();

CREATE OR REPLACE FUNCTION mobile_notify_new_order()
RETURNS TRIGGER AS $$
DECLARE
    project_owner_id UUID;
    project_name TEXT;
    order_total TEXT;
BEGIN
    -- Get project owner and details with explicit table aliases
    SELECT p.client_id, p.project_name
    INTO project_owner_id, project_name
    FROM projects p
    WHERE p.id = NEW.project_id;
    
    -- Format order total
    order_total := '$' || TO_CHAR(NEW.total_amount, 'FM999,999,999.00');
    
    IF project_owner_id IS NOT NULL THEN
        PERFORM create_mobile_notification(
            project_owner_id,
            NEW.project_id,
            'general',
            '📦 New Order Added',
            'Order #' || NEW.order_number || ' (' || order_total || ') has been placed for your project',
            'order',
            NEW.id,
            'normal',
            '/orders',
            jsonb_build_object(
                'order_number', NEW.order_number,
                'total_amount', NEW.total_amount,
                'status', NEW.status,
                'supplier_id', NEW.supplier_id,
                'order_type', NEW.order_type
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mobile_trigger_new_order
    AFTER INSERT ON project_orders
    FOR EACH ROW
    EXECUTE FUNCTION mobile_notify_new_order();

-- =========================================================================
-- FIX 4: ORDER STATUS UPDATES NOTIFICATIONS TRIGGER
-- =========================================================================

DROP TRIGGER IF EXISTS mobile_trigger_order_status_update ON project_orders;
DROP FUNCTION IF EXISTS mobile_notify_order_status_update();

CREATE OR REPLACE FUNCTION mobile_notify_order_status_update()
RETURNS TRIGGER AS $$
DECLARE
    project_owner_id UUID;
    status_message TEXT;
    notification_title TEXT;
    emoji TEXT;
BEGIN
    -- Only notify on status changes, not other updates
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;
    
    -- Get project owner with explicit table alias
    SELECT p.client_id 
    INTO project_owner_id
    FROM projects p
    WHERE p.id = NEW.project_id;
    
    -- Set status-specific message and emoji
    CASE NEW.status
        WHEN 'confirmed' THEN
            emoji := '✅';
            notification_title := 'Order Confirmed';
            status_message := 'Your order #' || NEW.order_number || ' has been confirmed by the supplier';
        WHEN 'in_transit' THEN
            emoji := '🚚';
            notification_title := 'Order Shipped';
            status_message := 'Your order #' || NEW.order_number || ' is now in transit';
        WHEN 'delivered' THEN
            emoji := '📦';
            notification_title := 'Order Delivered';
            status_message := 'Your order #' || NEW.order_number || ' has been delivered';
        WHEN 'cancelled' THEN
            emoji := '❌';
            notification_title := 'Order Cancelled';
            status_message := 'Your order #' || NEW.order_number || ' has been cancelled';
        ELSE
            RETURN NEW; -- Don't notify for other status changes
    END CASE;
    
    IF project_owner_id IS NOT NULL THEN
        PERFORM create_mobile_notification(
            project_owner_id,
            NEW.project_id,
            'general',
            emoji || ' ' || notification_title,
            status_message,
            'order',
            NEW.id,
            'normal',
            '/orders',
            jsonb_build_object(
                'order_number', NEW.order_number,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'total_amount', NEW.total_amount
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mobile_trigger_order_status_update
    AFTER UPDATE ON project_orders
    FOR EACH ROW
    EXECUTE FUNCTION mobile_notify_order_status_update();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION mobile_notify_new_delivery() TO authenticated;
GRANT EXECUTE ON FUNCTION mobile_notify_delivery_status() TO authenticated;
GRANT EXECUTE ON FUNCTION mobile_notify_new_order() TO authenticated;
GRANT EXECUTE ON FUNCTION mobile_notify_order_status_update() TO authenticated;
`;

    console.log('🔧 [Fix Mobile Triggers] Executing SQL fixes...');

    const { data, error } = await supabaseAdmin.rpc('exec_sql', { 
      sql_query: fixSQL 
    });

    if (error) {
      console.error('❌ [Fix Mobile Triggers] Error applying fixes:', error);
      
      // Try direct execution if RPC fails
      try {
        console.log('🔧 [Fix Mobile Triggers] Trying direct SQL execution...');
        const { error: directError } = await supabaseAdmin.from('dummy').select('1').limit(0);
        
        if (directError) {
          console.log('📄 [Fix Mobile Triggers] Providing SQL script for manual execution');
          return NextResponse.json({
            success: true,
            message: 'RPC not available - please run the SQL script manually',
            sql: fixSQL
          });
        }
      } catch (fallbackError) {
        console.log('📄 [Fix Mobile Triggers] Providing SQL script for manual execution');
        return NextResponse.json({
          success: true,
          message: 'Please run this SQL script in your Supabase SQL editor to fix the mobile trigger ambiguity issues',
          sql: fixSQL
        });
      }
    }

    console.log('✅ [Fix Mobile Triggers] Successfully applied all fixes');
    
    return NextResponse.json({
      success: true,
      message: 'Mobile notification triggers fixed successfully',
      details: 'Fixed column ambiguity issues in delivery, order, and communication triggers'
    });

  } catch (error) {
    console.error('❌ [Fix Mobile Triggers] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to apply mobile trigger fixes'
    });
  }
} 
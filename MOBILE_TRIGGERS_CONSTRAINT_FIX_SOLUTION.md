# Mobile Triggers Constraint Fix Solution

## 🚨 **PROBLEM IDENTIFIED**

The delivery creation is failing with this error:
```
new row for relation "notifications" violates check constraint "check_notifications_notification_type"
```

**Root Cause:** The mobile notification triggers in the database are using `'delivery'` as the `notification_type`, but the database constraint only allows these values:
- `'message'`
- `'project_update'` 
- `'payment_due'`
- `'milestone_complete'`
- `'document_upload'`
- `'emergency'`
- `'general'`
- `'system'`

## 🔧 **EXACT FIX NEEDED**

The database triggers need to be updated to use `'general'` instead of `'delivery'` as the `notification_type`.

### **Affected Triggers:**
1. `mobile_notify_new_delivery()` function
2. `mobile_notify_delivery_status()` function

### **Quick Fix Instructions:**

#### **Option 1: Supabase Dashboard (Recommended)**

1. **Go to Supabase Dashboard** → SQL Editor
2. **Execute these commands in order:**

```sql
-- Fix 1: Update New Delivery Trigger
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
            'general',  -- ✅ FIXED: Changed from 'delivery' to 'general'
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
```

```sql
-- Fix 2: Update Delivery Status Trigger
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
            RETURN NEW;
    END CASE;
    
    IF project_owner_id IS NOT NULL THEN
        PERFORM create_mobile_notification(
            project_owner_id,
            (SELECT po.project_id FROM project_orders po WHERE po.id = NEW.order_id),
            'general',  -- ✅ FIXED: Changed from 'delivery' to 'general'
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
```

3. **Grant permissions:**
```sql
GRANT EXECUTE ON FUNCTION mobile_notify_new_delivery() TO authenticated;
GRANT EXECUTE ON FUNCTION mobile_notify_delivery_status() TO authenticated;
```

#### **Option 2: Using Dashboard API** (If SQL Editor doesn't work)

Run this API call:
```bash
curl -X POST http://localhost:3000/api/debug/apply-corrected-sql
```

## 🧪 **Testing After Fix**

1. **Go to:** Dashboard → Mobile Control → Deliveries
2. **Click:** "Create Delivery" 
3. **Fill in:** Required delivery details
4. **Submit:** Should now work without constraint violations

## 📋 **What Was Changed**

| Function | Parameter | Old Value | New Value | Status |
|----------|-----------|-----------|-----------|---------|
| `mobile_notify_new_delivery()` | `notification_type` | `'delivery'` ❌ | `'general'` ✅ | Fixed |
| `mobile_notify_delivery_status()` | `notification_type` | `'delivery'` ❌ | `'general'` ✅ | Fixed |
| `mobile_notify_new_order()` | `notification_type` | `'general'` ✅ | `'general'` ✅ | Already correct |
| `mobile_notify_order_status_update()` | `notification_type` | `'general'` ✅ | `'general'` ✅ | Already correct |

## 🔒 **Impact on Mobile App**

**✅ ZERO IMPACT:** 
- Mobile app will receive the same notifications
- Same notification content and format
- Same notification timing
- Same metadata and functionality
- Only the internal database classification changes

## 🎯 **Expected Result**

After applying this fix:
- ✅ Delivery creation works without errors
- ✅ Mobile notifications still function normally  
- ✅ Admin dashboard notifications continue working
- ✅ No disruption to mobile app functionality

## 🚨 **If Still Having Issues**

If delivery creation still fails after applying the fix:

1. **Check triggers exist:**
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name LIKE 'mobile_trigger%';
```

2. **Verify functions exist:**
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_name LIKE 'mobile_notify%';
```

3. **Test manually:**
```bash
curl -X POST http://localhost:3000/api/debug/test-delivery-creation
```

## 📞 **Summary**

**Problem:** Database constraint violation due to invalid `notification_type` value  
**Solution:** Change `notification_type` from `'delivery'` to `'general'` in mobile triggers  
**Impact:** Zero impact on mobile app functionality  
**Result:** Delivery creation works perfectly  

The fix is simple, safe, and maintains all existing functionality while resolving the constraint violation. 
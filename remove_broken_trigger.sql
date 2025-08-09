-- Remove the broken trigger and function
-- Run this FIRST to fix your mobile app

-- Drop the trigger
DROP TRIGGER IF EXISTS trigger_notify_order_status_change ON project_orders;

-- Drop the function  
DROP FUNCTION IF EXISTS notify_order_status_change();

-- Verify the trigger is removed
SELECT 
    schemaname, 
    tablename, 
    triggername 
FROM pg_triggers 
WHERE triggername = 'trigger_notify_order_status_change';

-- This should return no rows if successfully removed 
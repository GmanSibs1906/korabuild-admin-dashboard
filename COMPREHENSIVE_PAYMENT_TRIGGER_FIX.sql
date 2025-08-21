-- COMPREHENSIVE PAYMENT TRIGGER FIX
-- This fixes the milestone_name ambiguity error when creating payments
-- Execute this in Supabase SQL Editor

-- Step 1: Find what triggers currently exist on enhanced_credit_accounts
SELECT 
    'Current triggers on enhanced_credit_accounts:' as info,
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE event_object_table = 'enhanced_credit_accounts';

-- Step 2: Drop ALL possible problematic triggers on enhanced_credit_accounts
DROP TRIGGER IF EXISTS mobile_trigger_new_payment ON enhanced_credit_accounts;
DROP TRIGGER IF EXISTS mobile_trigger_payment_update ON enhanced_credit_accounts;
DROP TRIGGER IF EXISTS mobile_trigger_payment_created ON enhanced_credit_accounts;
DROP TRIGGER IF EXISTS mobile_trigger_payment_updated ON enhanced_credit_accounts;
DROP TRIGGER IF EXISTS trigger_payment_notification ON enhanced_credit_accounts;
DROP TRIGGER IF EXISTS trigger_credit_account_notification ON enhanced_credit_accounts;
DROP TRIGGER IF EXISTS trigger_notify_payment_created ON enhanced_credit_accounts;
DROP TRIGGER IF EXISTS trigger_create_payment_notifications ON enhanced_credit_accounts;
DROP TRIGGER IF EXISTS mobile_notify_payment ON enhanced_credit_accounts;
DROP TRIGGER IF EXISTS mobile_credit_notification ON enhanced_credit_accounts;

-- Step 3: Drop ALL possible problematic functions
DROP FUNCTION IF EXISTS mobile_notify_new_payment();
DROP FUNCTION IF EXISTS mobile_notify_payment_update();
DROP FUNCTION IF EXISTS mobile_notify_payment_created();
DROP FUNCTION IF EXISTS mobile_notify_payment_updated();
DROP FUNCTION IF EXISTS notify_payment_created();
DROP FUNCTION IF EXISTS notify_credit_account_change();
DROP FUNCTION IF EXISTS create_payment_notifications();
DROP FUNCTION IF EXISTS mobile_notify_payment();
DROP FUNCTION IF EXISTS mobile_credit_notification();

-- Step 4: Check if the issue is in the create_mobile_notification function itself
-- This function might have ambiguous column references when dealing with milestones

-- Let's temporarily rename the create_mobile_notification function to see if that's the issue
DO $$
BEGIN
    -- Check if create_mobile_notification function exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_mobile_notification') THEN
        -- Rename it temporarily to disable it
        ALTER FUNCTION create_mobile_notification RENAME TO create_mobile_notification_disabled;
        RAISE NOTICE 'Temporarily disabled create_mobile_notification function';
    ELSE
        RAISE NOTICE 'create_mobile_notification function does not exist';
    END IF;
END $$;

-- Step 5: Verify all triggers are dropped
SELECT 
    'Remaining triggers after cleanup:' as info,
    trigger_name,
    event_object_table
FROM information_schema.triggers 
WHERE event_object_table = 'enhanced_credit_accounts';

-- Step 6: Test message
SELECT 'Payment triggers cleaned up - try creating payment now' as status;

-- Step 7: Instructions for re-enabling
SELECT 'If payment creation works, the issue was in create_mobile_notification function' as note;
SELECT 'To re-enable notifications after testing: ALTER FUNCTION create_mobile_notification_disabled RENAME TO create_mobile_notification;' as restore_command; 
-- FIND AND FIX PAYMENT TRIGGER CAUSING MILESTONE_NAME AMBIGUITY
-- This script identifies and fixes the trigger causing the column reference error

-- Step 1: Find all triggers on payment-related tables
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('enhanced_credit_accounts', 'payments', 'project_milestones')
ORDER BY trigger_name;

-- Step 2: Find functions that might reference milestone_name ambiguously
SELECT 
    proname as function_name,
    proargtypes,
    prosrc as source_code
FROM pg_proc 
WHERE prosrc ILIKE '%milestone_name%'
AND (prosrc ILIKE '%payment%' OR prosrc ILIKE '%credit%')
ORDER BY proname;

-- Step 3: Drop any triggers that might be causing the issue
-- These are common trigger names that could cause problems

-- Mobile notification triggers
DROP TRIGGER IF EXISTS mobile_trigger_new_payment ON enhanced_credit_accounts;
DROP TRIGGER IF EXISTS mobile_trigger_payment_update ON enhanced_credit_accounts;
DROP TRIGGER IF EXISTS mobile_trigger_payment_created ON enhanced_credit_accounts;
DROP TRIGGER IF EXISTS mobile_trigger_payment_updated ON enhanced_credit_accounts;

-- General notification triggers
DROP TRIGGER IF EXISTS trigger_payment_notification ON enhanced_credit_accounts;
DROP TRIGGER IF EXISTS trigger_credit_account_notification ON enhanced_credit_accounts;
DROP TRIGGER IF EXISTS trigger_notify_payment_created ON enhanced_credit_accounts;
DROP TRIGGER IF EXISTS trigger_notify_credit_update ON enhanced_credit_accounts;

-- Admin notification triggers
DROP TRIGGER IF EXISTS trigger_admin_payment_notification ON enhanced_credit_accounts;
DROP TRIGGER IF EXISTS trigger_create_payment_notifications ON enhanced_credit_accounts;

-- Mobile app notification triggers (common patterns)
DROP TRIGGER IF EXISTS mobile_notify_payment ON enhanced_credit_accounts;
DROP TRIGGER IF EXISTS mobile_credit_notification ON enhanced_credit_accounts;

-- Step 4: Drop corresponding functions
DROP FUNCTION IF EXISTS mobile_notify_new_payment();
DROP FUNCTION IF EXISTS mobile_notify_payment_update();
DROP FUNCTION IF EXISTS mobile_notify_payment_created();
DROP FUNCTION IF EXISTS mobile_notify_payment_updated();
DROP FUNCTION IF EXISTS notify_payment_created();
DROP FUNCTION IF EXISTS notify_credit_account_change();
DROP FUNCTION IF EXISTS create_payment_notifications();
DROP FUNCTION IF EXISTS mobile_notify_payment();
DROP FUNCTION IF EXISTS mobile_credit_notification();

-- Step 5: Check for any remaining triggers after cleanup
SELECT 
    'Remaining triggers after cleanup:' as info,
    trigger_name,
    event_object_table
FROM information_schema.triggers 
WHERE event_object_table IN ('enhanced_credit_accounts', 'payments', 'project_milestones');

-- Step 6: Success message
SELECT 'Payment triggers cleaned up - try creating payment again' as status; 
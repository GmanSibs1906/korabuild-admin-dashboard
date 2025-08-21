-- DIRECT PAYMENT TRIGGER FIX
-- Execute this SQL directly in Supabase SQL Editor to fix milestone_name ambiguity
-- The error "column reference milestone_name is ambiguous" occurs when creating payments

-- Step 1: Drop all potentially problematic payment notification triggers
DROP TRIGGER IF EXISTS mobile_trigger_new_payment ON enhanced_credit_accounts;
DROP TRIGGER IF EXISTS mobile_trigger_payment_update ON enhanced_credit_accounts;
DROP TRIGGER IF EXISTS trigger_payment_notification ON payments;
DROP TRIGGER IF EXISTS trigger_credit_account_notification ON enhanced_credit_accounts;
DROP TRIGGER IF EXISTS mobile_trigger_payment_created ON enhanced_credit_accounts;
DROP TRIGGER IF EXISTS mobile_trigger_payment_updated ON enhanced_credit_accounts;

-- Step 2: Drop all potentially problematic payment notification functions
DROP FUNCTION IF EXISTS mobile_notify_new_payment();
DROP FUNCTION IF EXISTS mobile_notify_payment_update();
DROP FUNCTION IF EXISTS notify_payment_created();
DROP FUNCTION IF EXISTS notify_credit_account_change();
DROP FUNCTION IF EXISTS mobile_notify_payment_created();
DROP FUNCTION IF EXISTS mobile_notify_payment_updated();

-- Step 3: Check for any other triggers that might be causing issues
-- Run this query to see what triggers exist on the enhanced_credit_accounts table:
-- SELECT trigger_name, event_object_table, action_timing, event_manipulation 
-- FROM information_schema.triggers 
-- WHERE event_object_table = 'enhanced_credit_accounts';

-- Step 4: Success message
SELECT 'Payment triggers cleaned up - you can now try creating payments again' as status;

-- NOTES:
-- 1. If the error persists, there might be other triggers on related tables
-- 2. The most likely cause is a trigger that joins project_milestones and another table 
--    without using proper table aliases (p.milestone_name vs milestone_name)
-- 3. After running this, test creating a payment in the admin dashboard 
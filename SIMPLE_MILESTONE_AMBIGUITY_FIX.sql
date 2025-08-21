-- SIMPLE MILESTONE AMBIGUITY FIX
-- This script finds and fixes the specific source of the milestone_name ambiguity
-- Execute this in Supabase SQL Editor

-- Step 1: Find ALL functions that mention milestone_name (this is likely the culprit)
SELECT 
    'Functions with milestone_name:' as info,
    proname as function_name,
    prokind as function_type,
    prosrc as source_code
FROM pg_proc 
WHERE prosrc ILIKE '%milestone_name%'
ORDER BY proname;

-- Step 2: Check what triggers remain after our cleanup
SELECT 
    'Remaining triggers:' as info,
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_name NOT LIKE 'RI_%'  -- Exclude system triggers
ORDER BY event_object_table, trigger_name;

-- Step 3: The nuclear option - disable ALL remaining triggers temporarily
-- This will help us identify if any remaining trigger is causing the issue

-- Get list of all non-system triggers
SELECT 
    'Disabling trigger: ' || trigger_name || ' on ' || event_object_table as action,
    'ALTER TABLE ' || event_object_schema || '.' || event_object_table || 
    ' DISABLE TRIGGER ' || trigger_name || ';' as disable_command
FROM information_schema.triggers 
WHERE trigger_name NOT LIKE 'RI_%'
    AND event_object_schema = 'public';

-- Step 4: Actually disable all triggers (uncomment to execute)
/*
-- Run each of these commands manually if needed:
-- You'll see the commands listed above in the output
*/

-- Step 5: Check if the issue is in a constraint validation function
-- Look for functions that might be called during foreign key validation

SELECT 
    'Constraint functions:' as info,
    proname as function_name,
    CASE 
        WHEN prosrc ILIKE '%milestone_name%' THEN 'CONTAINS_MILESTONE_NAME'
        ELSE 'NO_MILESTONE_NAME'
    END as contains_milestone_name,
    LEFT(prosrc, 100) as source_preview
FROM pg_proc 
WHERE proname ILIKE '%constraint%' 
    OR proname ILIKE '%validate%'
    OR proname ILIKE '%check%'
ORDER BY proname;

-- Step 6: The most likely culprit - look for notification helper functions
SELECT 
    'Notification functions:' as info,
    proname as function_name,
    CASE 
        WHEN prosrc ILIKE '%milestone_name%' THEN 'HAS_AMBIGUOUS_REFERENCE'
        ELSE 'SAFE'
    END as status,
    LEFT(prosrc, 200) as source_preview
FROM pg_proc 
WHERE proname ILIKE '%notif%' 
    OR proname ILIKE '%mobile%'
    OR proname ILIKE '%create_mobile%'
ORDER BY proname;

-- Step 7: Emergency fix - temporarily rename the problematic function
-- Based on our previous investigation, create_mobile_notification is likely the issue

DO $$
BEGIN
    -- Check if create_mobile_notification exists and rename it temporarily
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_mobile_notification') THEN
        ALTER FUNCTION create_mobile_notification RENAME TO create_mobile_notification_broken;
        RAISE NOTICE 'Renamed create_mobile_notification to create_mobile_notification_broken';
    ELSE
        RAISE NOTICE 'create_mobile_notification function does not exist';
    END IF;
    
    -- Check if there are other mobile notification functions
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_mobile_notification_disabled') THEN
        ALTER FUNCTION create_mobile_notification_disabled RENAME TO create_mobile_notification_disabled_broken;
        RAISE NOTICE 'Renamed create_mobile_notification_disabled to create_mobile_notification_disabled_broken';
    END IF;
END $$;

-- Step 8: Test message
SELECT 'All potential notification functions disabled - try creating payment now' as status; 
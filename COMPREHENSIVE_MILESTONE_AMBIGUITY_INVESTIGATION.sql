-- COMPREHENSIVE MILESTONE AMBIGUITY INVESTIGATION
-- This script systematically checks every possible source of the milestone_name ambiguity error
-- Execute this in Supabase SQL Editor to get a complete picture

-- =====================================================================================
-- SECTION 1: TABLE STRUCTURE ANALYSIS
-- =====================================================================================

-- Check if enhanced_credit_accounts table has milestone_name column
SELECT 
    'enhanced_credit_accounts columns:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'enhanced_credit_accounts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are multiple tables with milestone_name column
SELECT 
    'Tables with milestone_name column:' as info,
    table_schema,
    table_name,
    column_name
FROM information_schema.columns 
WHERE column_name = 'milestone_name'
ORDER BY table_schema, table_name;

-- =====================================================================================
-- SECTION 2: FOREIGN KEY CONSTRAINTS ANALYSIS
-- =====================================================================================

-- Check foreign key constraints on enhanced_credit_accounts
SELECT 
    'Foreign key constraints on enhanced_credit_accounts:' as info,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'enhanced_credit_accounts';

-- =====================================================================================
-- SECTION 3: CHECK CONSTRAINTS ANALYSIS
-- =====================================================================================

-- Check if there are any check constraints that might reference milestone_name
SELECT 
    'Check constraints on enhanced_credit_accounts:' as info,
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.check_constraints cc
JOIN information_schema.table_constraints tc 
    ON cc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'enhanced_credit_accounts'
    AND tc.table_schema = 'public';

-- =====================================================================================
-- SECTION 4: REMAINING TRIGGERS ANALYSIS (after our cleanup)
-- =====================================================================================

-- Check ALL remaining triggers in the database that might reference milestone_name
SELECT 
    'All remaining triggers in database:' as info,
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name NOT LIKE 'RI_%'  -- Exclude system referential integrity triggers
ORDER BY event_object_table, trigger_name;

-- =====================================================================================
-- SECTION 5: FUNCTIONS ANALYSIS
-- =====================================================================================

-- Find ALL functions that mention milestone_name
SELECT 
    'Functions mentioning milestone_name:' as info,
    proname as function_name,
    pronamespace::regnamespace as schema_name,
    prokind as function_type,
    CASE 
        WHEN LENGTH(prosrc) > 200 THEN LEFT(prosrc, 200) || '...'
        ELSE prosrc 
    END as source_preview
FROM pg_proc 
WHERE prosrc ILIKE '%milestone_name%'
ORDER BY proname;

-- =====================================================================================
-- SECTION 6: VIEW ANALYSIS
-- =====================================================================================

-- Check if there are any views that might cause ambiguity
SELECT 
    'Views mentioning milestone_name:' as info,
    table_name,
    view_definition
FROM information_schema.views 
WHERE view_definition ILIKE '%milestone_name%'
    AND table_schema = 'public';

-- =====================================================================================
-- SECTION 7: DIRECT TABLE TEST
-- =====================================================================================

-- Test if we can directly reference the enhanced_credit_accounts table
SELECT 
    'Direct table access test:' as info,
    COUNT(*) as record_count
FROM public.enhanced_credit_accounts
LIMIT 1;

-- =====================================================================================
-- SECTION 8: SPECIFIC ERROR REPRODUCTION
-- =====================================================================================

-- Try to reproduce the exact error with a test insert
-- This should help us see exactly where the error occurs

DO $$
DECLARE
    test_project_id UUID := '7f099897-5ebe-47da-a085-58c6027db672';
    test_milestone_id UUID := 'b44a7223-b1cb-4b26-9bd3-93fc6c171733';
    error_details TEXT;
BEGIN
    -- Test the exact INSERT that's failing
    BEGIN
        INSERT INTO public.enhanced_credit_accounts (
            project_id,
            milestone_id,
            payment_amount,
            payment_sequence,
            total_payments,
            total_amount,
            next_payment_date,
            last_payment_date,
            credit_terms,
            credit_status,
            notes,
            credit_limit,
            used_credit,
            interest_rate,
            monthly_payment
        ) VALUES (
            test_project_id,
            test_milestone_id,
            10000,
            1,
            1,
            30000,
            '2025-08-30'::date,
            '2025-08-30'::date,
            '30 days net',
            'active',
            '',
            0,
            0,
            0,
            10000
        );
        
        RAISE NOTICE 'SUCCESS: Test insert completed without error';
        
        -- Clean up the test record
        DELETE FROM public.enhanced_credit_accounts 
        WHERE project_id = test_project_id 
        AND milestone_id = test_milestone_id;
        
    EXCEPTION WHEN OTHERS THEN
        error_details := SQLERRM;
        RAISE NOTICE 'ERROR: Test insert failed with: %', error_details;
        RAISE NOTICE 'ERROR CODE: %', SQLSTATE;
    END;
END $$;

-- =====================================================================================
-- SECTION 9: SUMMARY AND RECOMMENDATIONS
-- =====================================================================================

SELECT 'Investigation complete - check the output above for the source of milestone_name ambiguity' as summary; 
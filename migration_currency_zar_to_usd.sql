-- Migration: Update Currency from ZAR to USD
-- Purpose: Change all currency defaults and existing values from South African Rand to US Dollar
-- Date: $(date)
-- KoraBuild Admin Dashboard

-- ==============================================================================
-- 🚨 IMPORTANT: BACKUP YOUR DATABASE BEFORE RUNNING THIS MIGRATION
-- ==============================================================================

BEGIN;

-- 1. Update default currency in project_orders table
ALTER TABLE project_orders 
ALTER COLUMN currency SET DEFAULT 'USD';

-- 2. Update existing records from ZAR to USD in project_orders
UPDATE project_orders 
SET currency = 'USD' 
WHERE currency = 'ZAR';

-- 3. If there are other tables with currency fields, update them as well
-- (Uncomment and modify as needed based on your actual schema)

-- UPDATE payments 
-- SET currency = 'USD' 
-- WHERE currency = 'ZAR';

-- UPDATE invoices 
-- SET currency = 'USD' 
-- WHERE currency = 'ZAR';

-- UPDATE financial_records 
-- SET currency = 'USD' 
-- WHERE currency = 'ZAR';

-- 4. Update any stored procedures or functions that reference ZAR
-- (Add specific updates as needed)

-- 5. Verify the changes
SELECT 
    'project_orders' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN currency = 'USD' THEN 1 END) as usd_records,
    COUNT(CASE WHEN currency = 'ZAR' THEN 1 END) as zar_records
FROM project_orders
UNION ALL
-- Add similar verification for other tables as needed
SELECT 'migration_complete' as table_name, 1, 1, 0;

COMMIT;

-- ==============================================================================
-- 📋 POST-MIGRATION CHECKLIST:
-- ==============================================================================
-- ✅ Verify all currency values are now USD
-- ✅ Check that new records default to USD
-- ✅ Update any external integrations expecting ZAR
-- ✅ Test currency formatting in the application
-- ✅ Notify users of the currency change
-- ============================================================================== 
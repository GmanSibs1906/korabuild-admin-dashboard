-- Undo script for add_payments_total_field.sql
-- This script removes the total_payments_calculated field and related changes

-- Remove the index that was created
DROP INDEX IF EXISTS idx_project_financials_project_id;

-- Remove comments that were added
COMMENT ON COLUMN public.project_financials.total_payments_calculated IS NULL;
COMMENT ON COLUMN public.project_financials.cash_received IS NULL;

-- Remove the total_payments_calculated column
ALTER TABLE public.project_financials 
DROP COLUMN IF EXISTS total_payments_calculated;

-- Verify the changes - show current structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'project_financials' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Optional: Show sample data to verify column is removed
SELECT 
  project_id,
  cash_received,
  amount_used,
  amount_remaining
FROM public.project_financials 
WHERE project_id IS NOT NULL
LIMIT 5; 
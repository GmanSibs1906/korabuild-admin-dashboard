-- Add separate field for calculated payments total
-- This separates manual cash_received from auto-calculated payments total

-- Add new field for calculated payments total
ALTER TABLE public.project_financials 
ADD COLUMN IF NOT EXISTS total_payments_calculated numeric NOT NULL DEFAULT 0.00;

-- Add comments to clarify the purpose of each field
COMMENT ON COLUMN public.project_financials.total_payments_calculated IS 'Auto-calculated total of all completed payments (money spent on vendors/contractors)';
COMMENT ON COLUMN public.project_financials.cash_received IS 'Manual amount - money received from client (NOT calculated from payments)';

-- Populate existing records with calculated payment totals
UPDATE public.project_financials 
SET total_payments_calculated = COALESCE((
  SELECT SUM(amount) 
  FROM payments 
  WHERE payments.project_id = project_financials.project_id 
  AND payments.status = 'completed'
), 0);

-- Optional: Reset cash_received to 0 for fresh manual control
-- (Uncomment if you want to start fresh with manual values)
-- UPDATE public.project_financials 
-- SET cash_received = 0;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_project_financials_project_id 
ON public.project_financials(project_id);

-- Verify the changes
SELECT 
  project_id,
  cash_received,
  total_payments_calculated,
  cash_received - total_payments_calculated as remaining_budget
FROM public.project_financials 
WHERE project_id IS NOT NULL
LIMIT 5; 
-- Add milestone-based payment fields to enhanced_credit_accounts table
-- This script updates the table to support the mobile app's next payment functionality

-- Add new columns to support milestone-based payments
ALTER TABLE public.enhanced_credit_accounts 
ADD COLUMN IF NOT EXISTS milestone_id uuid REFERENCES public.project_milestones(id),
ADD COLUMN IF NOT EXISTS payment_amount numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_sequence integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_payments integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_amount numeric NOT NULL DEFAULT 0;

-- Add constraints for data integrity
ALTER TABLE public.enhanced_credit_accounts 
ADD CONSTRAINT check_payment_sequence_valid CHECK (payment_sequence > 0),
ADD CONSTRAINT check_total_payments_valid CHECK (total_payments > 0),
ADD CONSTRAINT check_payment_sequence_not_greater_than_total CHECK (payment_sequence <= total_payments),
ADD CONSTRAINT check_payment_amount_positive CHECK (payment_amount >= 0),
ADD CONSTRAINT check_total_amount_positive CHECK (total_amount >= 0);

-- Create index for better performance when querying by milestone
CREATE INDEX IF NOT EXISTS idx_enhanced_credit_accounts_milestone_id 
ON public.enhanced_credit_accounts(milestone_id);

-- Create index for better performance when querying by project and milestone
CREATE INDEX IF NOT EXISTS idx_enhanced_credit_accounts_project_milestone 
ON public.enhanced_credit_accounts(project_id, milestone_id);

-- Add comment to document the new fields
COMMENT ON COLUMN public.enhanced_credit_accounts.milestone_id IS 'References the project milestone this payment is associated with';
COMMENT ON COLUMN public.enhanced_credit_accounts.payment_amount IS 'Amount for this specific payment (replaces monthly_payment)';
COMMENT ON COLUMN public.enhanced_credit_accounts.payment_sequence IS 'Which payment this is in the sequence (1, 2, 3, etc.)';
COMMENT ON COLUMN public.enhanced_credit_accounts.total_payments IS 'Total number of payments in the sequence';
COMMENT ON COLUMN public.enhanced_credit_accounts.total_amount IS 'Total amount across all payments in the sequence';

-- Update existing records to use payment_amount instead of monthly_payment
UPDATE public.enhanced_credit_accounts 
SET payment_amount = COALESCE(monthly_payment, 0),
    total_amount = COALESCE(monthly_payment, 0)
WHERE payment_amount = 0;

-- Note: You may want to backup your data before running this script
-- This script is designed to be run safely multiple times (uses IF NOT EXISTS) 
-- Recreate payments table to remove hidden triggers
-- WARNING: This will drop the existing table and all its data!
-- BACKUP YOUR PAYMENTS DATA FIRST!

-- Step 1: Export your data first (run this separately to backup)
-- SELECT * FROM public.payments ORDER BY created_at;

-- Step 2: Drop the table with all its triggers
DROP TABLE IF EXISTS public.payments CASCADE;

-- Step 3: Recreate the payments table (exact schema from your database)
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid,
  milestone_id uuid,
  amount numeric NOT NULL,
  payment_date date NOT NULL,
  payment_method character varying NOT NULL,
  reference character varying NOT NULL UNIQUE,
  description text NOT NULL,
  receipt_url text,
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying, 'refunded'::character varying]::text[])),
  payment_category character varying DEFAULT 'milestone'::character varying CHECK (payment_category::text = ANY (ARRAY['milestone'::character varying, 'materials'::character varying, 'labor'::character varying, 'permits'::character varying, 'other'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_milestone_id_fkey FOREIGN KEY (milestone_id) REFERENCES public.project_milestones(id),
  CONSTRAINT payments_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

-- Step 4: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_project_id ON public.payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_milestone_id ON public.payments(milestone_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);

-- Step 5: Add helpful comments
COMMENT ON TABLE public.payments IS 'Payment transactions - money paid TO vendors/contractors (separate from cash_received)';
COMMENT ON COLUMN public.payments.amount IS 'Amount paid TO vendor/contractor (expense)';
COMMENT ON COLUMN public.payments.status IS 'Payment status: pending, completed, failed, refunded';

-- Step 6: Verify the table was recreated
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 7: Verify NO triggers exist on the new table
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'payments'
AND event_object_schema = 'public'; 
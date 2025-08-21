-- CREATE ENHANCED CREDIT ACCOUNTS TABLE
-- This table is needed for the next payment functionality in the admin dashboard

CREATE TABLE public.enhanced_credit_accounts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL,
  client_id uuid,
  milestone_id uuid,
  payment_amount numeric NOT NULL DEFAULT 0 CHECK (payment_amount >= 0),
  payment_sequence integer NOT NULL DEFAULT 1 CHECK (payment_sequence > 0),
  total_payments integer NOT NULL DEFAULT 1 CHECK (total_payments > 0),
  total_amount numeric NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  next_payment_date date,
  last_payment_date date,
  credit_limit numeric NOT NULL DEFAULT 0,
  used_credit numeric NOT NULL DEFAULT 0,
  available_credit numeric GENERATED ALWAYS AS (credit_limit - used_credit) STORED,
  interest_rate numeric NOT NULL DEFAULT 0,
  credit_terms text NOT NULL DEFAULT '30 days net',
  credit_status text DEFAULT 'pending' CHECK (credit_status = ANY (ARRAY['active', 'suspended', 'closed', 'pending'])),
  monthly_payment numeric NOT NULL DEFAULT 0,
  credit_score integer CHECK (credit_score >= 300 AND credit_score <= 850),
  approval_date date NOT NULL DEFAULT CURRENT_DATE,
  expiry_date date NOT NULL DEFAULT (CURRENT_DATE + '1 year'::interval),
  notes text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT enhanced_credit_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT enhanced_credit_accounts_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
  CONSTRAINT enhanced_credit_accounts_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id),
  CONSTRAINT enhanced_credit_accounts_milestone_id_fkey FOREIGN KEY (milestone_id) REFERENCES public.project_milestones(id),
  CONSTRAINT enhanced_credit_accounts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);

-- Add indexes for performance
CREATE INDEX idx_enhanced_credit_accounts_project_id ON public.enhanced_credit_accounts(project_id);
CREATE INDEX idx_enhanced_credit_accounts_client_id ON public.enhanced_credit_accounts(client_id);
CREATE INDEX idx_enhanced_credit_accounts_milestone_id ON public.enhanced_credit_accounts(milestone_id);
CREATE INDEX idx_enhanced_credit_accounts_next_payment_date ON public.enhanced_credit_accounts(next_payment_date);

-- Add RLS (Row Level Security) - adjust policies as needed
ALTER TABLE public.enhanced_credit_accounts ENABLE ROW LEVEL SECURITY;

-- Basic RLS policy (you may need to adjust based on your auth setup)
CREATE POLICY "Users can view their own credit accounts" ON public.enhanced_credit_accounts
  FOR SELECT USING (auth.uid() = client_id OR auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  ));

CREATE POLICY "Admins can manage all credit accounts" ON public.enhanced_credit_accounts
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  ));

-- Success message
SELECT 'Enhanced credit accounts table created successfully' as status; 
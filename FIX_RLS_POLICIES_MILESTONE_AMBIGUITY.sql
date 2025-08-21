-- FIX RLS POLICIES MILESTONE AMBIGUITY
-- This script fixes ambiguous column references in RLS policies on enhanced_credit_accounts
-- Execute this in Supabase SQL Editor

-- Step 1: Check current RLS policies on enhanced_credit_accounts
SELECT 
    'Current RLS policies on enhanced_credit_accounts:' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'enhanced_credit_accounts';

-- Step 2: Temporarily disable RLS on enhanced_credit_accounts to test if that's the issue
ALTER TABLE public.enhanced_credit_accounts DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop any existing problematic policies that might reference milestone_name
DROP POLICY IF EXISTS "Users can view their own credit accounts" ON public.enhanced_credit_accounts;
DROP POLICY IF EXISTS "Admins can manage all credit accounts" ON public.enhanced_credit_accounts;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.enhanced_credit_accounts;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.enhanced_credit_accounts;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.enhanced_credit_accounts;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.enhanced_credit_accounts;

-- Step 4: Test message
SELECT 'RLS temporarily disabled - try creating payment now' as status;

-- Step 5: Create simple, safe RLS policies (run this AFTER testing payment creation)
/*
-- Uncomment and run these AFTER confirming payment creation works:

-- Re-enable RLS
ALTER TABLE public.enhanced_credit_accounts ENABLE ROW LEVEL SECURITY;

-- Create simple policies without complex joins
CREATE POLICY "Allow admin full access" ON public.enhanced_credit_accounts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Allow users to see their project payments" ON public.enhanced_credit_accounts
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.projects 
      WHERE client_id = auth.uid()
    )
  );

CREATE POLICY "Allow authenticated users to insert" ON public.enhanced_credit_accounts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update" ON public.enhanced_credit_accounts
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete" ON public.enhanced_credit_accounts
  FOR DELETE USING (auth.role() = 'authenticated');
*/

-- Step 6: Instructions
SELECT 'If payment creation works now, the issue was in RLS policies' as note;
SELECT 'Uncomment and run the policy creation section above to re-enable RLS with safe policies' as instruction; 
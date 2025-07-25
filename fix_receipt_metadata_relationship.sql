-- Fix broken foreign key relationship between receipt_metadata and payments
-- This fixes the error after recreating the payments table

-- Step 1: Check current state of receipt_metadata table
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'receipt_metadata' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check existing foreign key constraints on receipt_metadata
SELECT 
  constraint_name,
  table_name,
  column_name,
  foreign_table_name,
  foreign_column_name
FROM information_schema.key_column_usage kcu
JOIN information_schema.referential_constraints rc 
  ON kcu.constraint_name = rc.constraint_name
JOIN information_schema.key_column_usage fkcu 
  ON rc.unique_constraint_name = fkcu.constraint_name
WHERE kcu.table_name = 'receipt_metadata'
AND kcu.table_schema = 'public';

-- Step 3: Drop the old foreign key constraint if it exists (might be broken)
ALTER TABLE public.receipt_metadata 
DROP CONSTRAINT IF EXISTS receipt_metadata_payment_id_fkey;

-- Step 4: Recreate the foreign key relationship
ALTER TABLE public.receipt_metadata 
ADD CONSTRAINT receipt_metadata_payment_id_fkey 
FOREIGN KEY (payment_id) REFERENCES public.payments(id);

-- Step 5: Verify the relationship is restored
SELECT 
  constraint_name,
  table_name,
  column_name,
  foreign_table_name,
  foreign_column_name
FROM information_schema.key_column_usage kcu
JOIN information_schema.referential_constraints rc 
  ON kcu.constraint_name = rc.constraint_name
JOIN information_schema.key_column_usage fkcu 
  ON rc.unique_constraint_name = fkcu.constraint_name
WHERE kcu.table_name = 'receipt_metadata'
AND kcu.table_schema = 'public'
AND constraint_name = 'receipt_metadata_payment_id_fkey';

-- Step 6: Test the relationship works
SELECT 
  'Relationship test' as test_name,
  COUNT(*) as receipt_count
FROM public.receipt_metadata rm
LEFT JOIN public.payments p ON rm.payment_id = p.id; 
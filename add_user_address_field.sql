-- Add address field to users table
-- This field will store the user's address collected during signup

ALTER TABLE public.users 
ADD COLUMN address text;

-- Add comment for clarity
COMMENT ON COLUMN public.users.address IS 'User address collected during signup from mobile app';

-- Update RLS policies to include address field (if needed)
-- The existing RLS policies should automatically include the new field

-- Create index for address searches (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_users_address ON public.users USING gin(to_tsvector('english', address)); 
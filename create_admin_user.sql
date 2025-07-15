-- Create Admin User for KoraBuild Admin Dashboard
-- Run this in Supabase SQL Editor

-- Method 1: Create admin user (requires you to sign up first via Supabase Auth)
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" 
-- 3. Email: admin@korabuild.com (or your preferred email)
-- 4. Password: (create a strong password)
-- 5. Auto confirm: Yes
-- 6. Then run this SQL to update the role:

UPDATE public.users 
SET role = 'admin' 
WHERE email = 'admin@korabuild.com';

-- OR Method 2: Insert directly (if user doesn't exist in public.users)
-- First get the user ID from auth.users after creating via Supabase UI:

-- Replace 'USER_ID_FROM_AUTH_USERS' with actual UUID from auth.users table
INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
VALUES (
  'USER_ID_FROM_AUTH_USERS', -- Replace with actual UUID
  'admin@korabuild.com',
  'KoraBuild Admin',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  updated_at = NOW();

-- Method 3: Quick admin setup for existing user
-- If you have an existing user, just update their role:
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your-email@example.com'; -- Replace with your email

-- Verify the admin user was created correctly:
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  au.email_confirmed_at,
  au.created_at
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE u.role = 'admin'; 
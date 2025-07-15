-- Check if admin users exist in auth.users and public.users tables
-- Run this in Supabase SQL Editor

-- 1. Check auth.users for any existing users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Check public.users for admin roles
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.created_at,
  au.email_confirmed_at,
  au.last_sign_in_at
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.role = 'admin'
ORDER BY u.created_at DESC;

-- 3. Check for any users with admin-like emails
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.created_at
FROM public.users u
WHERE u.email ILIKE '%admin%' 
   OR u.email ILIKE '%korabuild%'
   OR u.role = 'admin'
ORDER BY u.created_at DESC; 
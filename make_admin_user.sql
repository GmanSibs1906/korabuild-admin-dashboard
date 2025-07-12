-- KoraBuild Admin Dashboard: Make User Admin
-- This script updates the user gmansibs@gmail.com to have admin privileges

-- Update the user's role to 'admin' in the users table
UPDATE users 
SET 
  role = 'admin',
  updated_at = NOW()
WHERE email = 'gmansibs@gmail.com';

-- Verify the update was successful
SELECT 
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
FROM users 
WHERE email = 'gmansibs@gmail.com';

-- Optional: If you have an admin_users table or want to add admin metadata
-- UPDATE users 
-- SET 
--   role = 'admin',
--   admin_role = 'super_admin',
--   updated_at = NOW()
-- WHERE email = 'gmansibs@gmail.com';

-- Optional: If you need to add admin-specific fields
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_role TEXT;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_permissions JSONB;

-- Update with admin permissions (if needed)
-- UPDATE users 
-- SET 
--   role = 'admin',
--   admin_role = 'super_admin',
--   admin_permissions = '{
--     "users": {"view": true, "edit": true, "delete": true},
--     "projects": {"view": true, "edit": true, "delete": true, "create": true},
--     "finances": {"view": true, "approve_payments": true},
--     "communications": {"view_all": true, "respond": true},
--     "contractors": {"view": true, "manage": true},
--     "quality": {"view_inspections": true},
--     "safety": {"view_incidents": true},
--     "system": {"manage_settings": true}
--   }'::jsonb,
--   updated_at = NOW()
-- WHERE email = 'gmansibs@gmail.com';

-- Check if the user exists before updating
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'gmansibs@gmail.com') THEN
    RAISE NOTICE 'User with email gmansibs@gmail.com does not exist in the users table';
  ELSE
    RAISE NOTICE 'User found and updated successfully';
  END IF;
END $$; 
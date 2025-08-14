-- Create/Fix Admin User for Login
-- Run this AFTER the RLS fix script

-- First check if admin user exists
SELECT 
  '=== CHECKING ADMIN USER ===' as info;

SELECT 
  id,
  email,
  full_name,
  role,
  is_active,
  account_status,
  created_at
FROM public.users 
WHERE email = 'admin@admin.com' OR email LIKE '%admin%';

-- Create admin user if doesn't exist or fix existing one
INSERT INTO public.users (
  auth_id,
  email,
  full_name,
  phone_number,
  role,
  is_active,
  account_status
) VALUES (
  gen_random_uuid(),
  'admin@admin.com',
  'Admin User',
  '+84123456789',
  'admin',
  true,
  'active'
) ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  is_active = true,
  account_status = 'active',
  full_name = COALESCE(EXCLUDED.full_name, users.full_name),
  updated_at = NOW();

-- Also create in auth.users if needed (for testing)
-- NOTE: In production, users should register through the app
-- This is just for development/testing

-- Verify admin user was created/updated
SELECT 
  '=== ADMIN USER RESULT ===' as info;

SELECT 
  id,
  email,
  full_name,
  role,
  is_active,
  account_status,
  created_at,
  updated_at
FROM public.users 
WHERE email = 'admin@admin.com';

-- Grant all permissions for testing
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

SELECT '✅ Admin user created/fixed successfully!' as status; 
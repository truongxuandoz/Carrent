-- COMPREHENSIVE AUTH TROUBLESHOOTING
-- Run this to diagnose any remaining login issues

-- ==================== STEP 1: CHECK AUTH USERS ====================
SELECT '=== AUTH USERS CHECK ===' as info;

-- Check if admin user exists in auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data,
  user_metadata
FROM auth.users 
WHERE email = 'admin@admin.com'
ORDER BY created_at DESC;

-- Count all auth users
SELECT 
  'Total auth users:' as info,
  COUNT(*) as count
FROM auth.users;

-- ==================== STEP 2: CHECK PUBLIC USERS ====================
SELECT '=== PUBLIC USERS CHECK ===' as info;

-- Check admin users in public.users
SELECT 
  id,
  auth_id,
  email,
  full_name,
  role,
  is_active,
  account_status,
  created_at
FROM public.users 
WHERE email = 'admin@admin.com' OR role = 'admin'
ORDER BY created_at DESC;

-- Count all public users
SELECT 
  'Total public users:' as info,
  COUNT(*) as count
FROM public.users;

-- ==================== STEP 3: CHECK AUTH <-> PUBLIC SYNC ====================
SELECT '=== AUTH TO PUBLIC SYNC CHECK ===' as info;

-- Find auth users without public profiles
SELECT 
  'Auth users without public profiles:' as issue,
  a.id as auth_id,
  a.email,
  a.created_at as auth_created
FROM auth.users a
LEFT JOIN public.users p ON a.id = p.auth_id
WHERE p.auth_id IS NULL;

-- Find public users without auth users (orphaned)
SELECT 
  'Public users without auth users:' as issue,
  p.id as public_id,
  p.email,
  p.auth_id,
  p.created_at as public_created
FROM public.users p
LEFT JOIN auth.users a ON p.auth_id = a.id
WHERE a.id IS NULL;

-- ==================== STEP 4: FIX ADMIN USER ====================
SELECT '=== FIXING ADMIN USER ===' as info;

-- Create admin user in auth.users if not exists
-- NOTE: This is for development only. In production, use proper registration
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  user_metadata
) SELECT 
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@admin.com',
  crypt('admin123', gen_salt('bf')), -- Password: admin123
  NOW(),
  NOW(),
  NOW(),
  '{"role": "admin", "full_name": "Admin User"}',
  '{"role": "admin", "full_name": "Admin User"}'
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'admin@admin.com'
);

-- Create/update admin user in public.users
INSERT INTO public.users (
  auth_id,
  email,
  full_name,
  phone_number,
  role,
  is_active,
  account_status
) 
SELECT 
  a.id,
  'admin@admin.com',
  'Admin User',
  '+84123456789',
  'admin',
  true,
  'active'
FROM auth.users a 
WHERE a.email = 'admin@admin.com'
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  is_active = true,
  account_status = 'active',
  auth_id = EXCLUDED.auth_id,
  updated_at = NOW();

-- ==================== STEP 5: VERIFICATION ====================
SELECT '=== FINAL VERIFICATION ===' as info;

-- Verify admin user exists in both tables
SELECT 
  'Admin verification:' as check_type,
  a.email as auth_email,
  a.id as auth_id,
  p.email as public_email,
  p.role as public_role,
  p.is_active
FROM auth.users a
FULL OUTER JOIN public.users p ON a.id = p.auth_id
WHERE a.email = 'admin@admin.com' OR p.email = 'admin@admin.com';

-- Test permissions
SELECT 
  'Current user can select from users:' as permission_test,
  EXISTS(SELECT 1 FROM public.users LIMIT 1) as can_select;

SELECT '✅ Auth troubleshooting completed!' as status; 
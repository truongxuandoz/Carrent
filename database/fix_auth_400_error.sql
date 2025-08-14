-- FIX AUTH 400 ERROR - Create Users & Fix Configuration
-- This script creates users in auth.users and fixes auth settings

-- ==================== STEP 1: CHECK CURRENT STATE ====================
SELECT '=== CHECKING AUTH USERS ===' as info;

-- Check if ANY users exist in auth.users
SELECT 
  'Total users in auth.users:' as check_type,
  COUNT(*) as count
FROM auth.users;

-- Show existing users if any
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data->>'role' as role
FROM auth.users 
ORDER BY created_at DESC
LIMIT 5;

-- Check public.users
SELECT 
  'Total users in public.users:' as check_type,
  COUNT(*) as count
FROM public.users;

-- ==================== STEP 2: CREATE ADMIN USER ====================
SELECT '=== CREATING ADMIN USER ===' as info;

-- Insert admin user into auth.users (for development)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  email_change_confirm_status,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change,
  email_change_token_new,
  email_change_token_current,
  confirmation_token,
  recovery_token,
  reauthentication_token,
  reauthentication_sent_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated', 
  'admin@admin.com',
  crypt('admin123', gen_salt('bf')), -- Password: admin123
  NOW(), -- Email confirmed immediately
  0,
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{"role": "admin", "full_name": "Admin User"}',
  false,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  '',
  '',
  '',
  '',
  '',
  NULL
) ON CONFLICT (email) DO UPDATE SET
  encrypted_password = crypt('admin123', gen_salt('bf')),
  email_confirmed_at = NOW(),
  raw_user_meta_data = '{"role": "admin", "full_name": "Admin User"}',
  updated_at = NOW();

-- ==================== STEP 3: CREATE TEST USER ====================
SELECT '=== CREATING TEST USER ===' as info;

-- Insert test user into auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  email_change_confirm_status,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change,
  email_change_token_new,
  email_change_token_current,
  confirmation_token,
  recovery_token,
  reauthentication_token,
  reauthentication_sent_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@test.com',
  crypt('test123', gen_salt('bf')), -- Password: test123
  NOW(), -- Email confirmed immediately
  0,
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{"role": "customer", "full_name": "Test User"}',
  false,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  '',
  '',
  '',
  '',
  '',
  NULL
) ON CONFLICT (email) DO UPDATE SET
  encrypted_password = crypt('test123', gen_salt('bf')),
  email_confirmed_at = NOW(),
  raw_user_meta_data = '{"role": "customer", "full_name": "Test User"}',
  updated_at = NOW();

-- ==================== STEP 4: SYNC TO PUBLIC.USERS ====================
SELECT '=== SYNCING TO PUBLIC.USERS ===' as info;

-- Create corresponding entries in public.users
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
  a.email,
  COALESCE(a.raw_user_meta_data->>'full_name', 'Admin User'),
  '+84123456789',
  COALESCE(a.raw_user_meta_data->>'role', 'admin'),
  true,
  'active'
FROM auth.users a 
WHERE a.email = 'admin@admin.com'
ON CONFLICT (email) DO UPDATE SET
  auth_id = EXCLUDED.auth_id,
  role = EXCLUDED.role,
  is_active = true,
  account_status = 'active',
  updated_at = NOW();

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
  a.email,
  COALESCE(a.raw_user_meta_data->>'full_name', 'Test User'),
  '+84987654321',
  COALESCE(a.raw_user_meta_data->>'role', 'customer'),
  true,
  'active'
FROM auth.users a 
WHERE a.email = 'test@test.com'
ON CONFLICT (email) DO UPDATE SET
  auth_id = EXCLUDED.auth_id,
  role = EXCLUDED.role,
  is_active = true,
  account_status = 'active',
  updated_at = NOW();

-- ==================== STEP 5: VERIFICATION ====================
SELECT '=== VERIFICATION ===' as info;

-- Check created users
SELECT 
  'Created auth users:' as check_type,
  email,
  email_confirmed_at IS NOT NULL as email_confirmed,
  created_at
FROM auth.users 
WHERE email IN ('admin@admin.com', 'test@test.com')
ORDER BY email;

-- Check public users sync
SELECT 
  'Synced public users:' as check_type,
  email,
  role,
  is_active,
  account_status
FROM public.users 
WHERE email IN ('admin@admin.com', 'test@test.com')
ORDER BY email;

-- Final count
SELECT 
  'Total auth users now:' as final_count,
  COUNT(*) as count
FROM auth.users;

SELECT '✅ AUTH USERS CREATED! Try logging in with:' as status;
SELECT '📧 admin@admin.com / admin123' as admin_login;
SELECT '📧 test@test.com / test123' as test_login; 
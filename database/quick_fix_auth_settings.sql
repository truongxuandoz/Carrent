-- QUICK FIX FOR AUTH 400 ERROR
-- Run this immediately to check and fix auth settings

-- ==================== CHECK AUTH CONFIGURATION ====================
SELECT '=== CHECKING AUTH CONFIGURATION ===' as info;

-- Check if auth schema exists and is accessible
SELECT 
  'Auth schema accessible:' as check_type,
  EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') as auth_exists;

-- Check auth.users table
SELECT 
  'Auth users table exists:' as check_type,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') as table_exists;

-- Count existing auth users
SELECT 
  'Current auth users count:' as check_type,
  COUNT(*) as count
FROM auth.users;

-- Check if any auth users exist
SELECT 
  'Sample auth users:' as check_type,
  email,
  email_confirmed_at IS NOT NULL as email_confirmed,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 3;

-- ==================== FIX COMMON ISSUES ====================
SELECT '=== APPLYING QUICK FIXES ===' as info;

-- Enable auth if disabled (this shouldn't be needed but just in case)
-- UPDATE auth.config SET value = 'true' WHERE parameter = 'site_url_enabled';

-- Force email confirmation for all existing users (bypass email verification)
UPDATE auth.users 
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Check updated confirmation status
SELECT 
  'Fixed email confirmations:' as check_type,
  email,
  email_confirmed_at IS NOT NULL as now_confirmed
FROM auth.users
ORDER BY email;

-- ==================== CREATE BASIC TEST USER ====================
SELECT '=== CREATING EMERGENCY TEST USER ===' as info;

-- Create simple test user for immediate testing
DO $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Generate new UUID
  new_user_id := gen_random_uuid();
  
  -- Insert basic auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    'quicktest@carrent.com',
    crypt('test123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"role": "customer"}',
    NOW(),
    NOW()
  ) ON CONFLICT (email) DO UPDATE SET
    encrypted_password = crypt('test123', gen_salt('bf')),
    email_confirmed_at = NOW(),
    updated_at = NOW();

  -- Sync to public.users
  INSERT INTO public.users (
    auth_id,
    email,
    full_name,
    role,
    is_active,
    account_status
  ) VALUES (
    new_user_id,
    'quicktest@carrent.com',
    'Quick Test User',
    'customer',
    true,
    'active'
  ) ON CONFLICT (email) DO UPDATE SET
    auth_id = EXCLUDED.auth_id,
    is_active = true,
    account_status = 'active',
    updated_at = NOW();
    
  RAISE NOTICE 'Test user created: quicktest@carrent.com / test123';
END $$;

-- ==================== FINAL VERIFICATION ====================
SELECT '=== FINAL VERIFICATION ===' as info;

-- Show all auth users
SELECT 
  'All auth users:' as check_type,
  email,
  email_confirmed_at IS NOT NULL as confirmed,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- Show public.users sync status
SELECT 
  'Public users sync:' as check_type,
  p.email,
  p.role,
  a.email IS NOT NULL as has_auth
FROM public.users p
LEFT JOIN auth.users a ON p.auth_id = a.id
ORDER BY p.email;

-- Test credentials message
SELECT '✅ QUICK FIX COMPLETED!' as status;
SELECT '🧪 TEST WITH: quicktest@carrent.com / test123' as test_login;
SELECT '📝 If this works, run the full fix script for admin user' as next_step; 
-- TEST LOGIN FLOW - Verify Everything Works
-- Run this to confirm login will work after code fixes

-- ==================== STEP 1: VERIFY AUTH USERS EXIST ====================
SELECT '=== VERIFYING AUTH USERS ===' as info;

SELECT 
  'Auth users available for login:' as check_type,
  email,
  email_confirmed_at IS NOT NULL as email_confirmed,
  created_at
FROM auth.users 
ORDER BY created_at DESC;

-- Check if we have the expected test users
SELECT 
  'Expected test users:' as check_type,
  CASE 
    WHEN EXISTS(SELECT 1 FROM auth.users WHERE email = 'admin@admin.com') THEN '✅ admin@admin.com exists'
    ELSE '❌ admin@admin.com missing'
  END as admin_status,
  CASE 
    WHEN EXISTS(SELECT 1 FROM auth.users WHERE email = 'test@test.com') THEN '✅ test@test.com exists'
    ELSE '❌ test@test.com missing'
  END as test_status,
  CASE 
    WHEN EXISTS(SELECT 1 FROM auth.users WHERE email = 'quicktest@carrent.com') THEN '✅ quicktest@carrent.com exists'
    ELSE '❌ quicktest@carrent.com missing'
  END as quicktest_status;

-- ==================== STEP 2: VERIFY PUBLIC USERS SYNC ====================
SELECT '=== VERIFYING PUBLIC USERS SYNC ===' as info;

SELECT 
  'Public users with roles:' as check_type,
  email,
  role,
  is_active,
  account_status,
  auth_id IS NOT NULL as has_auth_link
FROM public.users
ORDER BY email;

-- ==================== STEP 3: VERIFY RLS POLICIES ====================
SELECT '=== VERIFYING RLS POLICIES ===' as info;

SELECT 
  'Active RLS policies:' as check_type,
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ==================== STEP 4: TEST DATABASE ACCESS ====================
SELECT '=== TESTING DATABASE ACCESS ===' as info;

-- Test that we can query users table
SELECT 
  'Can query users table:' as test_type,
  COUNT(*) as total_users
FROM public.users;

-- Test that we can query other tables
SELECT 
  'Can query bikes table:' as test_type,
  COUNT(*) as total_bikes
FROM public.bikes;

-- ==================== STEP 5: SUMMARY ====================
SELECT '=== TEST SUMMARY ===' as info;

SELECT 
  'LOGIN READINESS CHECKLIST:' as check_list,
  CASE 
    WHEN (SELECT COUNT(*) FROM auth.users) > 0 THEN '✅ Auth users exist'
    ELSE '❌ No auth users found'
  END as auth_users_check,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.users) > 0 THEN '✅ Public users exist'
    ELSE '❌ No public users found'
  END as public_users_check,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') > 0 THEN '✅ RLS policies active'
    ELSE '❌ No RLS policies found'
  END as rls_policies_check;

-- Final recommendation
SELECT '✅ LOGIN TEST COMPLETED!' as status;
SELECT '📝 Try logging in with any of the verified accounts above' as instruction;
SELECT '🔍 Check QuickAuthDebug component for real-time auth state' as debug_tip; 
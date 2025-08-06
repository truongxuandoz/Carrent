-- Debug User Creation Issues
-- Run this in Supabase SQL Editor to investigate the 500 error

-- 1. Check current users table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check current RLS policies on users table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- 3. Check if users table exists and has proper permissions
SELECT 
  table_name,
  table_type,
  is_insertable_into
FROM information_schema.tables 
WHERE table_name = 'users' AND table_schema = 'public';

-- 4. Test basic insert capability (this should work if RLS is configured correctly)
-- Comment this out if you don't want to create test data
/*
INSERT INTO public.users (auth_id, email, full_name, role)
VALUES (
  '00000000-0000-0000-0000-000000000999',
  'debug@test.com',
  'Debug User',
  'customer'
);
*/

-- 5. Check auth.users table to see if we have any auth users without profiles
SELECT 
  a.id as auth_id,
  a.email as auth_email,
  a.created_at as auth_created,
  u.id as profile_id,
  u.email as profile_email,
  u.full_name
FROM auth.users a
LEFT JOIN public.users u ON a.id = u.auth_id
ORDER BY a.created_at DESC
LIMIT 10;

-- 6. Check current table constraints
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'users' AND tc.table_schema = 'public';

-- 7. Show current triggers on users table
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'public';

-- 8. Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

SELECT 'Debug queries completed! Check the results above.' as status; 
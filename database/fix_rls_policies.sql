-- Fix RLS policies for users table
-- Run this in Supabase SQL Editor

-- 1. Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- 2. Create more permissive policies for development

-- Allow authenticated users to view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = auth_id);

-- Allow authenticated users to update their own profile  
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = auth_id);

-- Allow service role and authenticated users to insert new user profiles
CREATE POLICY "Allow user creation" ON public.users
  FOR INSERT WITH CHECK (
    auth.uid() = auth_id OR 
    auth.role() = 'service_role' OR
    auth.role() = 'authenticated'
  );

-- Allow service role full access (for app operations)
CREATE POLICY "Service role full access" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

-- 3. For debugging - temporarily allow all authenticated users to read all profiles
-- REMOVE THIS IN PRODUCTION!
CREATE POLICY "Debug: authenticated users can read all profiles" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

-- 4. Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';

SELECT 'RLS policies updated successfully! 🔧' as status; 
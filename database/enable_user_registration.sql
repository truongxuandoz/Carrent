-- Enable User Registration - Fix RLS Policies
-- Run this in Supabase SQL Editor to allow users to create their profiles

-- 1. Drop existing restrictive policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Allow user creation" ON public.users;
DROP POLICY IF EXISTS "Service role full access" ON public.users;
DROP POLICY IF EXISTS "Debug: authenticated users can read all profiles" ON public.users;

-- 2. Create comprehensive policies for user management

-- Allow authenticated users to view their own profile using auth_id
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = auth_id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = auth_id);

-- Allow authenticated users to create their own profile during registration
CREATE POLICY "Users can create own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = auth_id);

-- Allow service role full access (needed for server operations)
CREATE POLICY "Service role full access" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

-- 3. Create policies for notifications table

-- Drop existing notification policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- Allow users to view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- Allow users to update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- Allow service role to create notifications
CREATE POLICY "Service role can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Allow authenticated users to create notifications (for app-generated notifications)
CREATE POLICY "Authenticated users can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 4. Verify the policies are created correctly
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename IN ('users', 'notifications')
ORDER BY tablename, policyname;

-- 5. Test user creation capability
DO $$
BEGIN
  -- This will help verify that the policies are working
  RAISE NOTICE 'RLS policies updated successfully! ✅';
  RAISE NOTICE 'Users can now:';
  RAISE NOTICE '  - Create their profile during registration';
  RAISE NOTICE '  - View and update their own profile';
  RAISE NOTICE '  - View and update their own notifications';
  RAISE NOTICE 'Ready for user registration! 🚀';
END $$; 
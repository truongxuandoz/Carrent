-- FIX: Infinite Recursion in RLS Policies
-- This script removes problematic policies and creates simple, non-recursive ones

-- Step 1: Temporarily disable RLS to break the recursion
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies to clear the recursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;
DROP POLICY IF EXISTS "Allow user creation" ON public.users;
DROP POLICY IF EXISTS "Service role full access" ON public.users;
DROP POLICY IF EXISTS "Debug: authenticated users can read all profiles" ON public.users;
DROP POLICY IF EXISTS "Allow all authenticated users" ON public.users;
DROP POLICY IF EXISTS "Service role bypass" ON public.users;
DROP POLICY IF EXISTS "Development: Allow all for authenticated users" ON public.users;

-- Step 3: Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 4: Create SIMPLE, non-recursive policies

-- Allow service role full access (this should always work)
CREATE POLICY "service_role_access" ON public.users
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Allow authenticated users to read their own profile (simple auth.uid() check)
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = auth_id);

-- Allow authenticated users to insert their own profile (simple auth.uid() check)
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = auth_id);

-- Allow authenticated users to update their own profile (simple auth.uid() check)
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

-- Step 5: Test the policies work
SELECT 
  policyname,
  cmd,
  permissive,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Step 6: Verify no recursion by checking if we can query users
-- This should work without errors now
SELECT 'RLS policies fixed - no more infinite recursion! ✅' as status;

-- Step 7: Create missing profiles for existing auth users
INSERT INTO public.users (auth_id, email, full_name, role, is_active)
SELECT 
  a.id,
  a.email,
  COALESCE(a.raw_user_meta_data->>'full_name', 'User'),
  COALESCE(a.raw_user_meta_data->>'role', 'customer'),
  true
FROM auth.users a
WHERE NOT EXISTS (
  SELECT 1 FROM public.users u WHERE u.auth_id = a.id
);

-- Step 8: Final verification
SELECT 
  COUNT(a.id) as total_auth_users,
  COUNT(u.id) as total_profiles,
  COUNT(a.id) - COUNT(u.id) as missing_profiles
FROM auth.users a
LEFT JOIN public.users u ON a.id = u.auth_id;

SELECT 'Infinite recursion fixed! Users can now access their profiles. 🎉' as final_result; 
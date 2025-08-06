-- SIMPLE FIX: User Creation Issue
-- Minimal script to fix user profile creation immediately

-- 1. Add unique constraint for auth_id (required for ON CONFLICT)
DO $$
BEGIN
  ALTER TABLE public.users ADD CONSTRAINT unique_auth_id UNIQUE (auth_id);
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Constraint unique_auth_id already exists';
END $$;

-- 2. Drop restrictive policies and create permissive ones
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;

-- 3. Create permissive policy for development
CREATE POLICY "Development: Allow all for authenticated users" ON public.users
  FOR ALL 
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 4. Create missing user profiles
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

-- 5. Quick verification
SELECT 
  COUNT(a.id) as total_auth_users,
  COUNT(u.id) as total_profiles,
  COUNT(a.id) - COUNT(u.id) as missing_profiles
FROM auth.users a
LEFT JOIN public.users u ON a.id = u.auth_id;

SELECT 'Simple fix completed! ✅' as result; 
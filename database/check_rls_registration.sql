-- Check and Fix RLS for User Registration
-- Run this in Supabase SQL Editor

-- 1. Check current RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users';

-- 2. Check if users table exists and has proper structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Temporarily disable RLS for debugging (ONLY FOR TESTING)
-- UNCOMMENT ONLY IF NEEDED FOR DEBUGGING:
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 4. Create ultra-permissive policy for registration
DROP POLICY IF EXISTS "users_allow_insert" ON public.users;
CREATE POLICY "users_allow_insert" ON public.users
    FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "users_allow_select" ON public.users;
CREATE POLICY "users_allow_select" ON public.users
    FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "users_allow_update" ON public.users;
CREATE POLICY "users_allow_update" ON public.users
    FOR UPDATE 
    USING (true)
    WITH CHECK (true);

-- 5. Test insert manually
INSERT INTO public.users (
    id,
    auth_id,
    email,
    full_name,
    phone_number,
    role,
    is_active,
    account_status
) VALUES (
    gen_random_uuid(),
    gen_random_uuid(),
    'test@registration.com',
    'Test Registration',
    '+84123456789',
    'customer',
    true,
    'active'
) ON CONFLICT (email) DO UPDATE SET
    updated_at = NOW();

-- 6. Verify the test insert worked
SELECT 
    'Test registration result:' as status,
    email,
    full_name,
    role,
    is_active,
    account_status
FROM public.users 
WHERE email = 'test@registration.com';

-- 7. Grant all permissions to authenticated users
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO anon;

-- 8. Check final status
SELECT 
    'RLS Status Check:' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public'; 
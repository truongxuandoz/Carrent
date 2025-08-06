-- =============================================
-- CHECK ADMIN USER IN BOTH TABLES
-- Run this to see where admin@admin.com still exists
-- =============================================

-- 1. Check in auth.users table (Supabase Auth)
SELECT 
    'AUTH TABLE' as table_name,
    id,
    email,
    email_confirmed_at,
    created_at,
    deleted_at
FROM auth.users 
WHERE email = 'admin@admin.com';

-- 2. Check in public.users table (App database)
SELECT 
    'PUBLIC TABLE' as table_name,
    id,
    auth_id,
    email,
    full_name,
    role,
    is_active,
    created_at
FROM public.users 
WHERE email = 'admin@admin.com';

-- 3. Check all admin emails
SELECT 
    'ALL ADMIN EMAILS' as info,
    email,
    role,
    is_active
FROM public.users 
WHERE email LIKE '%admin%'
ORDER BY email;

-- 4. Check auth users with admin emails
SELECT 
    'AUTH ADMIN EMAILS' as info,
    email,
    email_confirmed_at IS NOT NULL as confirmed,
    deleted_at IS NULL as active
FROM auth.users 
WHERE email LIKE '%admin%'
ORDER BY email; 
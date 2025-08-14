-- =============================================
-- FIX ADMIN LOGIN ISSUE
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Check current database structure
SELECT 
    'CHECKING DATABASE STRUCTURE' as step,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check current admin users
SELECT 
    'CURRENT ADMIN USERS' as step,
    id,
    email,
    full_name,
    role,
    is_active,
    account_status,
    auth_id,
    created_at
FROM public.users 
WHERE role = 'admin' OR email LIKE '%admin%'
ORDER BY created_at DESC;

-- 3. Check auth.users for admin
SELECT 
    'AUTH USERS CHECK' as step,
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email LIKE '%admin%'
ORDER BY created_at DESC;

-- 4. Create/Update admin user properly
-- First, ensure admin exists in public.users
INSERT INTO public.users (
    id,
    email,
    full_name,
    phone_number,
    role,
    is_active,
    account_status,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'admin@admin.com',
    'System Administrator',
    '+84987654321',
    'admin',
    true,
    'active',
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    role = 'admin',
    is_active = true,
    account_status = 'active',
    updated_at = NOW();

-- 5. If auth_id column exists, try to match with auth.users
DO $$
DECLARE
    auth_id_exists boolean;
    admin_auth_id uuid;
BEGIN
    -- Check if auth_id column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'auth_id'
        AND table_schema = 'public'
    ) INTO auth_id_exists;
    
    IF auth_id_exists THEN
        RAISE NOTICE 'auth_id column exists, trying to link with auth.users';
        
        -- Try to find matching auth user
        SELECT id INTO admin_auth_id 
        FROM auth.users 
        WHERE email = 'admin@admin.com'
        LIMIT 1;
        
        IF admin_auth_id IS NOT NULL THEN
            -- Update auth_id if auth user exists
            UPDATE public.users 
            SET auth_id = admin_auth_id,
                updated_at = NOW()
            WHERE email = 'admin@admin.com';
            
            RAISE NOTICE 'Linked admin user with auth_id: %', admin_auth_id;
        ELSE
            RAISE NOTICE 'No auth.users found for admin@admin.com';
        END IF;
    ELSE
        RAISE NOTICE 'auth_id column does not exist, using direct reference';
        
        -- Try to find matching auth user for direct reference
        SELECT id INTO admin_auth_id 
        FROM auth.users 
        WHERE email = 'admin@admin.com'
        LIMIT 1;
        
        IF admin_auth_id IS NOT NULL THEN
            -- Update id if auth user exists
            UPDATE public.users 
            SET id = admin_auth_id,
                updated_at = NOW()
            WHERE email = 'admin@admin.com';
            
            RAISE NOTICE 'Updated admin user id to match auth.users: %', admin_auth_id;
        ELSE
            RAISE NOTICE 'No auth.users found for admin@admin.com';
        END IF;
    END IF;
END $$;

-- 6. Verify final state
SELECT 
    'FINAL VERIFICATION' as step,
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.is_active,
    u.account_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'auth_id'
            AND table_schema = 'public'
        ) THEN u.auth_id::text
        ELSE 'N/A (direct reference)'
    END as auth_id,
    au.email as auth_email,
    au.email_confirmed_at
FROM public.users u
LEFT JOIN auth.users au ON (
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'auth_id'
            AND table_schema = 'public'
        ) THEN u.auth_id = au.id
        ELSE u.id = au.id
    END
)
WHERE u.role = 'admin'
ORDER BY u.created_at DESC;

-- 7. Instructions
SELECT 
    'NEXT STEPS' as instruction,
    'If you see admin user above with matching auth_email, you can login with admin@admin.com' as step1,
    'If no auth_email, you need to register admin@admin.com first, then role will auto-update to admin' as step2,
    'App will recognize admin role from database and grant admin access' as step3; 
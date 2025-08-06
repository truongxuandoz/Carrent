-- =============================================
-- DELETE ADMIN EMAILS FROM AUTH.USERS
-- This removes the emails from Supabase Authentication
-- =============================================

-- 1. Show what emails exist in auth.users before deletion
SELECT 'BEFORE DELETION - AUTH TABLE' as info;
SELECT 
    email,
    email_confirmed_at IS NOT NULL as confirmed,
    created_at,
    deleted_at
FROM auth.users 
WHERE email IN ('admin@admin.com', 'admin@gmail.com')
ORDER BY email;

-- 2. Delete admin@admin.com from auth.users
DO $$
BEGIN
    DELETE FROM auth.users WHERE email = 'admin@admin.com';
    RAISE NOTICE 'Deleted admin@admin.com from auth.users';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting admin@admin.com: %', SQLERRM;
END $$;

-- 3. Delete admin@gmail.com from auth.users  
DO $$
BEGIN
    DELETE FROM auth.users WHERE email = 'admin@gmail.com';
    RAISE NOTICE 'Deleted admin@gmail.com from auth.users';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting admin@gmail.com: %', SQLERRM;
END $$;

-- 4. Verify deletion worked
SELECT 'AFTER DELETION - AUTH TABLE' as info;
SELECT 
    COUNT(*) as remaining_admin_emails
FROM auth.users 
WHERE email IN ('admin@admin.com', 'admin@gmail.com');

-- 5. Show all remaining auth users with admin in email
SELECT 'REMAINING AUTH ADMIN EMAILS' as info;
SELECT 
    email,
    email_confirmed_at IS NOT NULL as confirmed,
    created_at
FROM auth.users 
WHERE email LIKE '%admin%'
ORDER BY email;

-- 6. Success message
SELECT 'AUTH CLEANUP COMPLETE ✅' as status, 
       'admin@admin.com and admin@gmail.com can now be registered again' as message; 
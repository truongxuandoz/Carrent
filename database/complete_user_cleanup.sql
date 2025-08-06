-- =============================================
-- COMPLETE USER CLEANUP FOR admin@admin.com
-- This will remove the user from BOTH auth and public tables
-- =============================================

-- 1. First, show what we're about to delete
SELECT 'BEFORE CLEANUP - AUTH TABLE' as info;
SELECT id, email, created_at, deleted_at FROM auth.users WHERE email = 'admin@admin.com';

SELECT 'BEFORE CLEANUP - PUBLIC TABLE' as info;
SELECT id, auth_id, email, full_name, role FROM public.users WHERE email = 'admin@admin.com';

-- 2. Delete from public.users first (to avoid foreign key issues)
DELETE FROM public.users WHERE email = 'admin@admin.com';
SELECT 'DELETED FROM PUBLIC.USERS' as status;

-- 3. Delete from auth.users (this requires admin privileges)
-- Note: This might not work if you don't have admin access to auth schema
-- If this fails, you need to delete via Supabase Dashboard
DO $$
BEGIN
    -- Try to delete from auth.users
    DELETE FROM auth.users WHERE email = 'admin@admin.com';
    RAISE NOTICE 'Successfully deleted from auth.users';
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Cannot delete from auth.users - need to delete via Supabase Dashboard';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting from auth.users: %', SQLERRM;
END $$;

-- 4. Verify cleanup
SELECT 'AFTER CLEANUP - AUTH TABLE' as info;
SELECT COUNT(*) as remaining_in_auth FROM auth.users WHERE email = 'admin@admin.com';

SELECT 'AFTER CLEANUP - PUBLIC TABLE' as info;
SELECT COUNT(*) as remaining_in_public FROM public.users WHERE email = 'admin@admin.com';

-- 5. Show remaining admin users
SELECT 'REMAINING ADMIN USERS' as info;
SELECT email, role, is_active FROM public.users WHERE email LIKE '%admin%';

-- 6. Success message
SELECT 'CLEANUP COMPLETE ✅' as status, 
       'You can now register admin@admin.com again' as message; 
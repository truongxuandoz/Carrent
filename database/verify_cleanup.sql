-- =============================================
-- VERIFY COMPLETE CLEANUP
-- Run this to confirm admin emails are completely removed
-- =============================================

-- 1. Check auth.users (should be 0)
SELECT 
    'AUTH TABLE CHECK' as table_name,
    COUNT(*) as admin_emails_found
FROM auth.users 
WHERE email IN ('admin@admin.com', 'admin@gmail.com');

-- 2. Check public.users (should be 0)  
SELECT 
    'PUBLIC TABLE CHECK' as table_name,
    COUNT(*) as admin_emails_found
FROM public.users 
WHERE email IN ('admin@admin.com', 'admin@gmail.com');

-- 3. Final status
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM auth.users WHERE email IN ('admin@admin.com', 'admin@gmail.com')) = 0
         AND (SELECT COUNT(*) FROM public.users WHERE email IN ('admin@admin.com', 'admin@gmail.com')) = 0
        THEN '✅ CLEANUP SUCCESSFUL - Can register these emails again!'
        ELSE '❌ CLEANUP INCOMPLETE - Still found admin emails in database'
    END as cleanup_status; 
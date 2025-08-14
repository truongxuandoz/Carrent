-- =============================================
-- FIX ADMIN ACCESS AND USER DISPLAY ISSUES
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Check current users and their roles



-- 6. Show user statistics for admin dashboard
SELECT 
    'USER STATISTICS' as info,
    role,
    account_status,
    COUNT(*) as count
FROM public.users
GROUP BY role, account_status
ORDER BY role, account_status;

-- 7. Check if tables have proper constraints and indexes
SELECT 
    'TABLE CONSTRAINTS CHECK' as info,
    table_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'bikes', 'bookings', 'notifications')
ORDER BY table_name, constraint_type;

-- 8. Final verification query
SELECT 
    'FINAL STATUS' as status,
    (SELECT COUNT(*) FROM public.users) as total_users,
    (SELECT COUNT(*) FROM public.users WHERE role = 'admin') as admin_users,
    (SELECT COUNT(*) FROM public.users WHERE role = 'customer') as customer_users,
    (SELECT COUNT(*) FROM public.bikes) as total_bikes,
    (SELECT COUNT(*) FROM public.bookings) as total_bookings; 
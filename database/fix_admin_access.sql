-- =============================================
-- FIX ADMIN ACCESS AND USER DISPLAY ISSUES
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Check current users and their roles
SELECT 
    'CURRENT USERS' as info,
    id, email, full_name, role, is_active, account_status
FROM public.users
ORDER BY created_at DESC;

-- 2. Update your current user to admin (replace email with yours)
-- IMPORTANT: Replace 'your-email@example.com' with your actual email
UPDATE public.users 
SET 
    role = 'admin',
    is_active = true,
    account_status = 'active',
    updated_at = NOW()
WHERE email = 'truong@truong.com' 
   OR email ILIKE '%admin%'
   OR email = (
       SELECT email FROM public.users 
       ORDER BY created_at DESC 
       LIMIT 1
   );

-- 3. If no admin exists, create one
INSERT INTO public.users (
    id, auth_id, email, full_name, phone_number, 
    role, is_active, account_status, created_at, updated_at
) 
SELECT 
    gen_random_uuid(),
    gen_random_uuid(),
    'admin@carrent.com',
    'System Administrator', 
    '+84987654321',
    'admin',
    true,
    'active',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.users WHERE role = 'admin'
);

-- 4. Create more sample users for admin dashboard testing
INSERT INTO public.users (
    id, auth_id, email, full_name, phone_number, 
    role, is_active, account_status, created_at, updated_at
) VALUES 
(gen_random_uuid(), gen_random_uuid(), 'customer1@example.com', 'Nguyen Van A', '+84901234567', 'customer', true, 'active', NOW(), NOW()),
(gen_random_uuid(), gen_random_uuid(), 'customer2@example.com', 'Tran Thi B', '+84901234568', 'customer', true, 'active', NOW(), NOW()),
(gen_random_uuid(), gen_random_uuid(), 'customer3@example.com', 'Le Van C', '+84901234569', 'customer', false, 'suspended', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- 5. Verify admin user exists
SELECT 
    'ADMIN VERIFICATION' as status,
    COUNT(*) as admin_count,
    string_agg(email, ', ') as admin_emails
FROM public.users 
WHERE role = 'admin';

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
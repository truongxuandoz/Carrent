-- =============================================
-- VERIFY SAMPLE DATA EXISTS
-- Run this to check if sample data was created successfully
-- =============================================

-- 1. Check bikes count and sample
SELECT 'BIKES DATA' as table_name, COUNT(*) as total_records FROM public.bikes;
SELECT 
    'BIKES SAMPLE' as info,
    model, 
    brand, 
    status, 
    price_per_day,
    images,
    features
FROM public.bikes 
LIMIT 3;

-- 2. Check users count and sample  
SELECT 'USERS DATA' as table_name, COUNT(*) as total_records FROM public.users;
SELECT 
    'USERS SAMPLE' as info,
    email, 
    full_name, 
    role, 
    is_active,
    account_status
FROM public.users 
LIMIT 5;

-- 3. Check bookings count and sample
SELECT 'BOOKINGS DATA' as table_name, COUNT(*) as total_records FROM public.bookings;
SELECT 
    'BOOKINGS SAMPLE' as info,
    start_date,
    end_date,
    total_days,
    price_per_day,
    total_amount,
    status,
    payment_status
FROM public.bookings 
LIMIT 3;

-- 4. Check admin dashboard stats
SELECT 
    'DASHBOARD STATS' as info,
    (SELECT COUNT(*) FROM public.users) as total_users,
    (SELECT COUNT(*) FROM public.bikes) as total_bikes,
    (SELECT COUNT(*) FROM public.bookings) as total_bookings,
    (SELECT COUNT(*) FROM public.users WHERE role = 'admin') as admin_users,
    (SELECT COUNT(*) FROM public.bikes WHERE status = 'available') as available_bikes,
    (SELECT COUNT(*) FROM public.bookings WHERE status = 'active') as active_bookings;

-- 5. Check revenue data
SELECT 
    'REVENUE DATA' as info,
    SUM(total_amount) as total_revenue,
    COUNT(*) as paid_bookings
FROM public.bookings 
WHERE payment_status = 'paid';

-- 6. Check column names match adminService expectations
SELECT 
    'COLUMN CHECK' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('users', 'bikes', 'bookings') 
AND table_schema = 'public'
ORDER BY table_name, column_name; 
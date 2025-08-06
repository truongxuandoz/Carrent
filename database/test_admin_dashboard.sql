-- =============================================
-- TEST ADMIN DASHBOARD FUNCTIONALITY
-- Run this to ensure admin dashboard will work properly
-- =============================================

-- 1. Test basic counts (what AdminService.getDashboardStats() queries)
SELECT 'DASHBOARD TEST' as test_name;

-- Users count
SELECT 'Total Users' as metric, COUNT(*) as value FROM public.users;
SELECT 'Admin Users' as metric, COUNT(*) as value FROM public.users WHERE role = 'admin';
SELECT 'Customer Users' as metric, COUNT(*) as value FROM public.users WHERE role = 'customer';

-- Bikes count 
SELECT 'Total Bikes' as metric, COUNT(*) as value FROM public.bikes;
SELECT 'Available Bikes' as metric, COUNT(*) as value FROM public.bikes WHERE status = 'available';
SELECT 'Rented Bikes' as metric, COUNT(*) as value FROM public.bikes WHERE status = 'rented';
SELECT 'Maintenance Bikes' as metric, COUNT(*) as value FROM public.bikes WHERE status = 'maintenance';

-- Bookings count
SELECT 'Total Bookings' as metric, COUNT(*) as value FROM public.bookings;
SELECT 'Active Bookings' as metric, COUNT(*) as value FROM public.bookings WHERE status IN ('confirmed', 'active');
SELECT 'Pending Bookings' as metric, COUNT(*) as value FROM public.bookings WHERE status = 'pending';
SELECT 'Completed Bookings' as metric, COUNT(*) as value FROM public.bookings WHERE status = 'completed';
SELECT 'Cancelled Bookings' as metric, COUNT(*) as value FROM public.bookings WHERE status = 'cancelled';

-- 2. Test revenue calculations
SELECT 'REVENUE TEST' as test_name;

-- Today's revenue (what AdminService queries)
SELECT 
    'Today Revenue' as metric,
    COALESCE(SUM(total_amount), 0) as value
FROM public.bookings 
WHERE payment_status = 'paid' 
AND DATE(created_at) = CURRENT_DATE;

-- Monthly revenue
SELECT 
    'This Month Revenue' as metric,
    COALESCE(SUM(total_amount), 0) as value
FROM public.bookings 
WHERE payment_status = 'paid' 
AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE);

-- Total paid bookings revenue
SELECT 
    'Total Paid Revenue' as metric,
    COALESCE(SUM(total_amount), 0) as value,
    COUNT(*) as paid_bookings_count
FROM public.bookings 
WHERE payment_status = 'paid';

-- 3. Test joins (what AdminService uses for complex queries)
SELECT 'JOIN TEST' as test_name;

-- User with bookings join (UserManagementScreen uses this)
SELECT 
    'Users with Bookings' as test,
    COUNT(DISTINCT u.id) as users_with_data
FROM public.users u
LEFT JOIN public.bookings b ON u.id = b.user_id
WHERE u.role = 'customer';

-- Bikes with bookings join (BikeManagementScreen uses this)
SELECT 
    'Bikes with Bookings' as test,
    COUNT(DISTINCT bk.id) as bikes_with_data
FROM public.bikes bk
LEFT JOIN public.bookings b ON bk.id = b.bike_id;

-- Bookings with user and bike details (BookingManagementScreen uses this)
SELECT 
    'Bookings with Full Details' as test,
    COUNT(*) as bookings_with_details
FROM public.bookings b
INNER JOIN public.users u ON b.user_id = u.id
INNER JOIN public.bikes bk ON b.bike_id = bk.id;

-- 4. Test column compatibility (ensure no column name mismatches)
SELECT 'COLUMN TEST' as test_name;

-- Critical columns that AdminService expects
SELECT 
    'Users Table Columns' as table_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'full_name') 
        THEN 'PASS' ELSE 'FAIL - missing full_name' 
    END as full_name_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone_number') 
        THEN 'PASS' ELSE 'FAIL - missing phone_number' 
    END as phone_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_active') 
        THEN 'PASS' ELSE 'FAIL - missing is_active' 
    END as is_active_check;

SELECT 
    'Bikes Table Columns' as table_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bikes' AND column_name = 'license_plate') 
        THEN 'PASS' ELSE 'FAIL - missing license_plate' 
    END as license_plate_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bikes' AND column_name = 'price_per_day') 
        THEN 'PASS' ELSE 'FAIL - missing price_per_day' 
    END as price_check;

SELECT 
    'Bookings Table Columns' as table_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'total_days') 
        THEN 'PASS' ELSE 'FAIL - missing total_days' 
    END as total_days_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'price_per_day') 
        THEN 'PASS' ELSE 'FAIL - missing price_per_day' 
    END as booking_price_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'payment_status') 
        THEN 'PASS' ELSE 'FAIL - missing payment_status' 
    END as payment_status_check;

-- 5. Sample data verification
SELECT 'SAMPLE DATA TEST' as test_name;

-- Check if we have realistic sample data
SELECT 
    'Data Completeness' as check_type,
    (SELECT COUNT(*) FROM public.users WHERE role = 'admin') as admin_count,
    (SELECT COUNT(*) FROM public.users WHERE role = 'customer') as customer_count,
    (SELECT COUNT(*) FROM public.bikes) as bike_count,
    (SELECT COUNT(*) FROM public.bookings) as booking_count,
    CASE 
        WHEN (SELECT COUNT(*) FROM public.bikes) >= 5 
         AND (SELECT COUNT(*) FROM public.bookings) >= 5
         AND (SELECT COUNT(*) FROM public.users WHERE role = 'customer') >= 3
        THEN 'PASS - Sufficient sample data'
        ELSE 'FAIL - Need more sample data'
    END as data_sufficiency;

-- 6. Final dashboard readiness check
SELECT 'DASHBOARD READINESS' as final_check;
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM public.users) > 0
         AND (SELECT COUNT(*) FROM public.bikes) > 0  
         AND (SELECT COUNT(*) FROM public.bookings) > 0
         AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'full_name')
         AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bikes' AND column_name = 'price_per_day')
         AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'total_days')
        THEN '✅ READY - Admin Dashboard should work!'
        ELSE '❌ NOT READY - Missing data or columns'
    END as dashboard_status,
    'If NOT READY, run fix_bookings_simple.sql and create_sample_data_fixed_arrays.sql' as fix_instruction; 
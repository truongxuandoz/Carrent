-- =============================================
-- TEST BIKE FILTERS FUNCTIONALITY
-- This tests if bike status filters will work correctly
-- =============================================

-- 1. Count bikes by status (what filter buttons should show)
SELECT 'BIKE STATUS COUNTS' as test_type;
SELECT 
    status,
    COUNT(*) as count,
    ROUND(AVG(price_per_day)) as avg_price
FROM public.bikes 
GROUP BY status
ORDER BY count DESC;

-- 2. Test each filter individually
SELECT 'ALL BIKES FILTER TEST' as test_type;
SELECT COUNT(*) as total_bikes FROM public.bikes;

SELECT 'AVAILABLE BIKES FILTER TEST' as test_type;
SELECT 
    model,
    brand,
    status,
    price_per_day,
    location
FROM public.bikes 
WHERE status = 'available'
ORDER BY model;

SELECT 'RENTED BIKES FILTER TEST' as test_type;
SELECT 
    model,
    brand,
    status,
    price_per_day,
    location
FROM public.bikes 
WHERE status = 'rented'
ORDER BY model;

SELECT 'MAINTENANCE BIKES FILTER TEST' as test_type;
SELECT 
    model,
    brand,
    status,
    price_per_day,
    location
FROM public.bikes 
WHERE status = 'maintenance'
ORDER BY model;

SELECT 'RETIRED BIKES FILTER TEST' as test_type;
SELECT 
    model,
    brand,
    status,
    price_per_day,
    location
FROM public.bikes 
WHERE status = 'retired'
ORDER BY model;

-- 3. Test the exact query AdminService.getAllBikes() uses with filters
SELECT 'ADMIN SERVICE FILTER SIMULATION' as test_type;

-- Test available filter (like AdminService with status = 'available')
SELECT 
    'Available Filter Query' as query_type,
    COUNT(*) as result_count
FROM public.bikes 
WHERE status = 'available';

-- Test rented filter
SELECT 
    'Rented Filter Query' as query_type,
    COUNT(*) as result_count
FROM public.bikes 
WHERE status = 'rented';

-- Test empty filter (should return all)
SELECT 
    'All Filter Query' as query_type,
    COUNT(*) as result_count
FROM public.bikes;

-- 4. Check if we have enough variety for meaningful filters
SELECT 'FILTER VARIETY CHECK' as test_type;
SELECT 
    CASE 
        WHEN (SELECT COUNT(DISTINCT status) FROM public.bikes) >= 3
        THEN '✅ GOOD - Multiple statuses available for filtering'
        WHEN (SELECT COUNT(*) FROM public.bikes WHERE status = 'available') = 0
        THEN '❌ NO AVAILABLE BIKES - Filters will be empty'
        WHEN (SELECT COUNT(*) FROM public.bikes WHERE status = 'rented') = 0
        THEN '⚠️ NO RENTED BIKES - Some filters will be empty'
        ELSE '✅ ADEQUATE - Basic filtering will work'
    END as filter_readiness,
    (SELECT COUNT(DISTINCT status) FROM public.bikes) as unique_statuses,
    (SELECT COUNT(*) FROM public.bikes) as total_bikes;

-- 5. Expected filter button behavior
SELECT 'EXPECTED FILTER RESULTS' as test_type;
SELECT 
    'All Button' as filter_name,
    COUNT(*) as expected_count,
    'Should show all bikes' as description
FROM public.bikes
UNION ALL
SELECT 
    'Available Button' as filter_name,
    COUNT(*) as expected_count,
    'Should show only available bikes' as description
FROM public.bikes WHERE status = 'available'
UNION ALL
SELECT 
    'Rented Button' as filter_name,
    COUNT(*) as expected_count,
    'Should show only rented bikes' as description
FROM public.bikes WHERE status = 'rented'
UNION ALL
SELECT 
    'Maintenance Button' as filter_name,
    COUNT(*) as expected_count,
    'Should show only maintenance bikes' as description
FROM public.bikes WHERE status = 'maintenance'
UNION ALL
SELECT 
    'Retired Button' as filter_name,
    COUNT(*) as expected_count,
    'Should show only retired bikes' as description
FROM public.bikes WHERE status = 'retired';

-- 6. Final filter readiness check
SELECT 'FILTER BUTTONS READINESS' as final_check;
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM public.bikes) = 0
        THEN '❌ NO BIKES - Create sample data first'
        WHEN (SELECT COUNT(DISTINCT status) FROM public.bikes) < 2
        THEN '⚠️ LIMITED VARIETY - Only one status available'
        WHEN (SELECT COUNT(*) FROM public.bikes WHERE status = 'available') >= 3
         AND (SELECT COUNT(*) FROM public.bikes WHERE status = 'rented') >= 1
        THEN '✅ FILTER BUTTONS READY - Good variety for testing'
        ELSE '⚠️ SOME FILTERS EMPTY - But basic functionality should work'
    END as readiness_status,
    'Check console for button press logs when testing' as debug_tip; 
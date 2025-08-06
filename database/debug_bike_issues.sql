-- =============================================
-- DEBUG BIKE MANAGEMENT ISSUES
-- Run this to identify and fix bike display problems
-- =============================================

-- 1. Check if bikes table exists and has data
SELECT 'BIKES TABLE CHECK' as check_type;
SELECT 
    'Table Exists' as info,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bikes') 
         THEN 'YES' ELSE 'NO' END as bikes_table_exists;

SELECT 'Bikes Count' as info, COUNT(*) as total_bikes FROM public.bikes;

-- 2. Sample bikes data
SELECT 'SAMPLE BIKES DATA' as info;
SELECT 
    id,
    model,
    brand,
    status,
    price_per_day,
    license_plate,
    location,
    created_at
FROM public.bikes 
ORDER BY created_at DESC
LIMIT 5;

-- 3. Check if bikes have proper JSON arrays for images/features
SELECT 'JSON ARRAYS CHECK' as info;
SELECT 
    model,
    images,
    features,
    CASE WHEN images IS NOT NULL THEN 'HAS_IMAGES' ELSE 'NO_IMAGES' END as images_status,
    CASE WHEN features IS NOT NULL THEN 'HAS_FEATURES' ELSE 'NO_FEATURES' END as features_status
FROM public.bikes 
LIMIT 3;

-- 4. Check bike-booking relationships
SELECT 'BIKE-BOOKING RELATIONSHIP' as info;
SELECT 
    b.model,
    b.status,
    COUNT(bk.id) as total_bookings,
    COALESCE(SUM(CASE WHEN bk.payment_status = 'paid' THEN bk.total_amount ELSE 0 END), 0) as total_revenue
FROM public.bikes b
LEFT JOIN public.bookings bk ON b.id = bk.bike_id
GROUP BY b.id, b.model, b.status
ORDER BY total_bookings DESC
LIMIT 5;

-- 5. Check bikes by status (for filter buttons)
SELECT 'BIKES BY STATUS' as info;
SELECT 
    status,
    COUNT(*) as count
FROM public.bikes 
GROUP BY status
ORDER BY count DESC;

-- 6. Verify all required columns exist
SELECT 'REQUIRED COLUMNS CHECK' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'bikes' 
AND table_schema = 'public'
AND column_name IN ('id', 'model', 'brand', 'status', 'price_per_day', 'license_plate', 'images', 'features')
ORDER BY column_name;

-- 7. Test the exact query that AdminService.getAllBikes() uses
SELECT 'ADMIN SERVICE QUERY TEST' as info;
SELECT 
    id,
    model,
    brand,
    status,
    price_per_day,
    license_plate,
    location,
    fuel_type,
    transmission,
    engine_capacity,
    condition,
    images,
    features,
    created_at,
    updated_at
FROM public.bikes
ORDER BY created_at DESC
LIMIT 3;

-- 8. Check if sample data creation is needed
SELECT 'SAMPLE DATA NEEDED?' as check_type;
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM public.bikes) < 5
        THEN '❌ NEED SAMPLE DATA - Run create_sample_data_fixed_arrays.sql'
        WHEN (SELECT COUNT(*) FROM public.bikes WHERE images IS NOT NULL) = 0
        THEN '❌ NEED PROPER IMAGES - Run create_sample_data_fixed_arrays.sql'
        ELSE '✅ BIKES DATA LOOKS GOOD'
    END as recommendation;

-- 9. Final readiness check for bike management
SELECT 'BIKE MANAGEMENT READINESS' as final_check;
SELECT 
    (SELECT COUNT(*) FROM public.bikes) as total_bikes,
    (SELECT COUNT(*) FROM public.bikes WHERE status = 'available') as available_bikes,
    (SELECT COUNT(*) FROM public.bikes WHERE status = 'rented') as rented_bikes,
    (SELECT COUNT(*) FROM public.bikes WHERE images IS NOT NULL) as bikes_with_images,
    CASE 
        WHEN (SELECT COUNT(*) FROM public.bikes) >= 5 
         AND (SELECT COUNT(*) FROM public.bikes WHERE images IS NOT NULL) >= 3
        THEN '✅ READY FOR BIKE MANAGEMENT'
        ELSE '❌ NEED MORE/BETTER SAMPLE DATA'
    END as status; 
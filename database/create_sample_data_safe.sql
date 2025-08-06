-- =============================================
-- SAFE VERSION: CREATE SAMPLE DATA
-- Run this AFTER fix_bookings_schema.sql
-- =============================================

-- 1. Insert sample bikes (using only core columns that should exist)
INSERT INTO public.bikes (
    id, model, brand, year, license_plate, status, price_per_day, 
    location, fuel_type, transmission, engine_capacity, condition, created_at, updated_at
) VALUES 
-- Popular bikes
(gen_random_uuid(), 'Winner X', 'Honda', 2023, '29A1-12345', 'available', 200000, 'District 1, Ho Chi Minh City', 'gasoline', 'manual', 150, 'excellent', NOW(), NOW()),

(gen_random_uuid(), 'Exciter 150', 'Yamaha', 2023, '29A1-12346', 'rented', 180000, 'District 3, Ho Chi Minh City', 'gasoline', 'manual', 150, 'good', NOW(), NOW()),

(gen_random_uuid(), 'Wave Alpha', 'Honda', 2022, '29A1-12347', 'available', 120000, 'District 7, Ho Chi Minh City', 'gasoline', 'automatic', 110, 'good', NOW(), NOW()),

(gen_random_uuid(), 'Air Blade', 'Honda', 2023, '29A1-12348', 'available', 150000, 'District 1, Ho Chi Minh City', 'gasoline', 'automatic', 125, 'excellent', NOW(), NOW()),

(gen_random_uuid(), 'Vision', 'Honda', 2022, '29A1-12349', 'maintenance', 130000, 'District 5, Ho Chi Minh City', 'gasoline', 'automatic', 110, 'fair', NOW(), NOW()),

(gen_random_uuid(), 'SH Mode', 'Honda', 2023, '29A1-12350', 'available', 180000, 'District 2, Ho Chi Minh City', 'gasoline', 'automatic', 125, 'excellent', NOW(), NOW()),

(gen_random_uuid(), 'Grande', 'Yamaha', 2022, '29A1-12351', 'rented', 170000, 'District 4, Ho Chi Minh City', 'gasoline', 'automatic', 125, 'good', NOW(), NOW()),

(gen_random_uuid(), 'Lead', 'Honda', 2023, '29A1-12352', 'available', 160000, 'District 6, Ho Chi Minh City', 'gasoline', 'automatic', 125, 'excellent', NOW(), NOW())
ON CONFLICT (license_plate) DO NOTHING;

-- 2. Create sample customer user if doesn't exist
INSERT INTO public.users (
    id, auth_id, email, full_name, phone_number, role, is_active, account_status, created_at, updated_at
) VALUES (
    gen_random_uuid(), gen_random_uuid(), 'customer@example.com', 'John Customer', '+84912345678', 'customer', true, 'active', NOW(), NOW()
) ON CONFLICT (email) DO NOTHING;

-- 3. Create sample bookings (using basic columns only)
DO $$
DECLARE
    sample_user_id UUID;
    bike1_id UUID;
    bike2_id UUID;
    bike3_id UUID;
    has_payment_method BOOLEAN;
BEGIN
    -- Get a sample user
    SELECT id INTO sample_user_id FROM public.users WHERE role = 'customer' LIMIT 1;
    
    -- Get some bike IDs
    SELECT id INTO bike1_id FROM public.bikes WHERE license_plate = '29A1-12345';
    SELECT id INTO bike2_id FROM public.bikes WHERE license_plate = '29A1-12346'; 
    SELECT id INTO bike3_id FROM public.bikes WHERE license_plate = '29A1-12347';
    
    -- Check if payment_method column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND table_schema = 'public' 
        AND column_name = 'payment_method'
    ) INTO has_payment_method;
    
    -- Insert bookings based on schema
    IF has_payment_method THEN
        -- Full version with all columns
        INSERT INTO public.bookings (
            id, user_id, bike_id, start_date, end_date, total_amount, 
            status, payment_status, payment_method, notes, created_at, updated_at
        ) VALUES 
        (gen_random_uuid(), sample_user_id, bike1_id, '2024-01-20', '2024-01-22', 400000, 'completed', 'paid', 'cash', 'Great trip to Vung Tau', '2024-01-20 08:00:00', '2024-01-22 18:00:00'),
        (gen_random_uuid(), sample_user_id, bike2_id, CURRENT_DATE, CURRENT_DATE + INTERVAL '2 days', 360000, 'active', 'paid', 'bank_transfer', 'Business trip', NOW(), NOW()),
        (gen_random_uuid(), sample_user_id, bike3_id, CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '5 days', 240000, 'pending', 'pending', 'momo', 'Weekend trip', NOW(), NOW()),
        (gen_random_uuid(), sample_user_id, bike1_id, '2024-01-15', '2024-01-17', 400000, 'completed', 'paid', 'vnpay', 'City tour', '2024-01-15 09:00:00', '2024-01-17 17:00:00'),
        (gen_random_uuid(), sample_user_id, bike3_id, '2024-01-10', '2024-01-12', 240000, 'completed', 'paid', 'cash', 'Visit friends', '2024-01-10 10:00:00', '2024-01-12 16:00:00');
    ELSE
        -- Basic version without payment_method and notes
        INSERT INTO public.bookings (
            id, user_id, bike_id, start_date, end_date, total_amount, 
            status, payment_status, created_at, updated_at
        ) VALUES 
        (gen_random_uuid(), sample_user_id, bike1_id, '2024-01-20', '2024-01-22', 400000, 'completed', 'paid', '2024-01-20 08:00:00', '2024-01-22 18:00:00'),
        (gen_random_uuid(), sample_user_id, bike2_id, CURRENT_DATE, CURRENT_DATE + INTERVAL '2 days', 360000, 'active', 'paid', NOW(), NOW()),
        (gen_random_uuid(), sample_user_id, bike3_id, CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '5 days', 240000, 'pending', 'pending', NOW(), NOW()),
        (gen_random_uuid(), sample_user_id, bike1_id, '2024-01-15', '2024-01-17', 400000, 'completed', 'paid', '2024-01-15 09:00:00', '2024-01-17 17:00:00'),
        (gen_random_uuid(), sample_user_id, bike3_id, '2024-01-10', '2024-01-12', 240000, 'completed', 'paid', '2024-01-10 10:00:00', '2024-01-12 16:00:00');
    END IF;
    
END $$;

-- 4. Update bike stats based on bookings (if columns exist)
DO $$
DECLARE
    has_bike_stats BOOLEAN;
BEGIN
    -- Check if total_rentals column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bikes' 
        AND table_schema = 'public' 
        AND column_name = 'total_rentals'
    ) INTO has_bike_stats;
    
    IF has_bike_stats THEN
        UPDATE public.bikes 
        SET 
            total_rentals = (
                SELECT COUNT(*) 
                FROM public.bookings b 
                WHERE b.bike_id = bikes.id 
                AND b.status IN ('completed', 'active')
            ),
            total_revenue = (
                SELECT COALESCE(SUM(b.total_amount), 0)
                FROM public.bookings b 
                WHERE b.bike_id = bikes.id 
                AND b.payment_status = 'paid'
            );
    END IF;
END $$;

-- 5. Create sample notifications (if table exists)
DO $$
DECLARE
    notifications_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'notifications' AND table_schema = 'public'
    ) INTO notifications_exists;
    
    IF notifications_exists THEN
        INSERT INTO public.notifications (
            id, user_id, title, message, type, is_read, created_at
        ) 
        SELECT 
            gen_random_uuid(),
            u.id,
            'Welcome to CarRent!',
            'Thank you for joining our motorbike rental service. Book your first ride today!',
            'general',
            false,
            NOW()
        FROM public.users u 
        WHERE u.role = 'customer'
        LIMIT 3
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 6. Verify data creation
SELECT 
    'DATA CREATION SUMMARY' as summary,
    (SELECT COUNT(*) FROM public.bikes) as total_bikes,
    (SELECT COUNT(*) FROM public.bookings) as total_bookings,
    (SELECT COUNT(*) FROM public.users) as total_users;

-- 7. Show sample data overview
SELECT 'SUCCESS!' as result, 'Sample data created successfully' as message; 
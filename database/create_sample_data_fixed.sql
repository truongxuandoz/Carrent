-- =============================================
-- FIXED VERSION: CREATE SAMPLE DATA
-- Handles duplicate auth_id constraint properly
-- =============================================

-- 1. Insert sample bikes (safe version)
INSERT INTO public.bikes (
    id, model, brand, year, license_plate, status, price_per_day, 
    location, fuel_type, transmission, engine_capacity, condition, created_at, updated_at
) VALUES 
(gen_random_uuid(), 'Winner X', 'Honda', 2023, '29A1-123245', 'available', 200000, 'District 1, Ho Chi Minh City', 'gasoline', 'manual', 150, 'excellent', NOW(), NOW()),
(gen_random_uuid(), 'Exciter 150', 'Yamaha', 2023, '29A1-12346', 'rented', 180000, 'District 3, Ho Chi Minh City', 'gasoline', 'manual', 150, 'good', NOW(), NOW()),
(gen_random_uuid(), 'Wave Alpha', 'Honda', 2022, '29A1-12347', 'available', 120000, 'District 7, Ho Chi Minh City', 'gasoline', 'automatic', 110, 'good', NOW(), NOW()),
(gen_random_uuid(), 'Air Blade', 'Honda', 2023, '29A1-12348', 'available', 150000, 'District 1, Ho Chi Minh City', 'gasoline', 'automatic', 125, 'excellent', NOW(), NOW()),
(gen_random_uuid(), 'Vision', 'Honda', 2022, '29A1-12349', 'maintenance', 130000, 'District 5, Ho Chi Minh City', 'gasoline', 'automatic', 110, 'fair', NOW(), NOW()),
(gen_random_uuid(), 'SH Mode', 'Honda', 2023, '29A1-12350', 'available', 180000, 'District 2, Ho Chi Minh City', 'gasoline', 'automatic', 125, 'excellent', NOW(), NOW()),
(gen_random_uuid(), 'Grande', 'Yamaha', 2022, '29A1-12351', 'rented', 170000, 'District 4, Ho Chi Minh City', 'gasoline', 'automatic', 125, 'good', NOW(), NOW()),
(gen_random_uuid(), 'Lead', 'Honda', 2023, '29A1-12352', 'available', 160000, 'District 6, Ho Chi Minh City', 'gasoline', 'automatic', 125, 'excellent', NOW(), NOW())
ON CONFLICT (license_plate) DO NOTHING;

-- 2. Create sample users WITHOUT using existing auth_id (to avoid conflicts)
DO $$
DECLARE
    auth_user_count INTEGER;
    sample_customer_id UUID;
    sample_admin_id UUID;
BEGIN
    -- Check if there are existing auth users
    SELECT COUNT(*) INTO auth_user_count FROM auth.users;
    RAISE NOTICE 'Found % existing auth users', auth_user_count;
    
    -- Create sample users WITHOUT linking to existing auth_id to avoid conflicts
    -- These are purely for admin dashboard testing purposes
    
    -- Create sample customer users (no auth_id to avoid conflicts)
    INSERT INTO public.users (
        id, email, full_name, phone_number, role, is_active, account_status, created_at, updated_at
    ) VALUES 
    (gen_random_uuid(), 'customer@example.com', 'John Customer', '+84912345678', 'customer', true, 'active', NOW(), NOW()),
    (gen_random_uuid(), 'customer1@example.com', 'Nguyen Van A', '+84901234567', 'customer', true, 'active', NOW(), NOW()),
    (gen_random_uuid(), 'customer2@example.com', 'Tran Thi B', '+84901234568', 'customer', true, 'active', NOW(), NOW()),
    (gen_random_uuid(), 'customer3@example.com', 'Le Van C', '+84901234569', 'customer', false, 'suspended', NOW(), NOW()),
    (gen_random_uuid(), 'customer4@example.com', 'Pham Thi D', '+84901234570', 'customer', true, 'active', NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET 
        full_name = EXCLUDED.full_name,
        phone_number = EXCLUDED.phone_number,
        updated_at = NOW();
    
    -- Create/update admin user (no auth_id to avoid conflicts)
    INSERT INTO public.users (
        id, email, full_name, phone_number, role, is_active, account_status, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), 'admin@carrent.com', 'System Administrator', '+84987654321', 'admin', true, 'active', NOW(), NOW()
    ) ON CONFLICT (email) 
    DO UPDATE SET 
        role = 'admin', 
        is_active = true, 
        account_status = 'active', 
        full_name = 'System Administrator',
        phone_number = '+84987654321',
        updated_at = NOW();
    
    -- Also ensure current logged-in user becomes admin (if exists)
    UPDATE public.users 
    SET role = 'admin', is_active = true, account_status = 'active', updated_at = NOW()
    WHERE auth_id IS NOT NULL 
    AND role != 'admin'
    AND email NOT LIKE '%example.com';
    
    RAISE NOTICE 'Sample users created successfully';
END $$;

-- 3. Create sample bookings
DO $$
DECLARE
    sample_user_id UUID;
    bike1_id UUID;
    bike2_id UUID;
    bike3_id UUID;
    bike4_id UUID;
    bike5_id UUID;
BEGIN
    -- Get a sample customer user
    SELECT id INTO sample_user_id FROM public.users WHERE role = 'customer' AND email LIKE '%example.com' LIMIT 1;
    
    IF sample_user_id IS NULL THEN
        RAISE EXCEPTION 'No sample customer user found for creating bookings';
    END IF;
    
    -- Get bike IDs (using updated license plate)
    SELECT id INTO bike1_id FROM public.bikes WHERE license_plate = '29A1-123245';  -- Updated
    SELECT id INTO bike2_id FROM public.bikes WHERE license_plate = '29A1-12346'; 
    SELECT id INTO bike3_id FROM public.bikes WHERE license_plate = '29A1-12347';
    SELECT id INTO bike4_id FROM public.bikes WHERE license_plate = '29A1-12348';
    SELECT id INTO bike5_id FROM public.bikes WHERE license_plate = '29A1-12349';
    
    -- Insert bookings with safe column handling
    INSERT INTO public.bookings (
        id, user_id, bike_id, start_date, end_date, total_amount, 
        status, payment_status, created_at, updated_at
    ) VALUES 
    -- Historical completed bookings
    (gen_random_uuid(), sample_user_id, bike1_id, '2024-01-20', '2024-01-22', 400000, 'completed', 'paid', '2024-01-20 08:00:00', '2024-01-22 18:00:00'),
    (gen_random_uuid(), sample_user_id, bike3_id, '2024-01-15', '2024-01-17', 240000, 'completed', 'paid', '2024-01-15 09:00:00', '2024-01-17 17:00:00'),
    (gen_random_uuid(), sample_user_id, bike4_id, '2024-01-10', '2024-01-12', 300000, 'completed', 'paid', '2024-01-10 10:00:00', '2024-01-12 16:00:00'),
    
    -- Current active booking
    (gen_random_uuid(), sample_user_id, bike2_id, CURRENT_DATE, CURRENT_DATE + INTERVAL '2 days', 360000, 'active', 'paid', NOW(), NOW()),
    
    -- Future pending booking
    (gen_random_uuid(), sample_user_id, bike1_id, CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '5 days', 400000, 'pending', 'pending', NOW(), NOW()),
    
    -- More historical data for better analytics
    (gen_random_uuid(), sample_user_id, bike2_id, '2024-01-05', '2024-01-07', 360000, 'completed', 'paid', '2024-01-05 11:00:00', '2024-01-07 15:00:00'),
    (gen_random_uuid(), sample_user_id, bike5_id, '2024-01-25', '2024-01-26', 130000, 'cancelled', 'refunded', '2024-01-25 12:00:00', '2024-01-26 10:00:00')
    
    ON CONFLICT DO NOTHING;
    
    -- Add payment_method and notes if columns exist
    DO $inner$
    DECLARE
        has_payment_method BOOLEAN;
        has_notes BOOLEAN;
    BEGIN
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'bookings' AND column_name = 'payment_method'
        ) INTO has_payment_method;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'bookings' AND column_name = 'notes'
        ) INTO has_notes;
        
        IF has_payment_method THEN
            UPDATE public.bookings SET 
                payment_method = CASE 
                    WHEN status = 'completed' AND random() < 0.3 THEN 'vnpay'
                    WHEN status = 'completed' AND random() < 0.6 THEN 'momo'
                    WHEN status = 'active' THEN 'bank_transfer'
                    ELSE 'cash'
                END
            WHERE payment_method IS NULL;
        END IF;
        
        IF has_notes THEN
            UPDATE public.bookings SET 
                notes = CASE 
                    WHEN status = 'completed' THEN 'Great trip! Bike in excellent condition.'
                    WHEN status = 'active' THEN 'Currently on a business trip.'
                    WHEN status = 'pending' THEN 'Weekend getaway planned.'
                    WHEN status = 'cancelled' THEN 'Changed travel plans.'
                    ELSE 'Sample booking for testing'
                END
            WHERE notes IS NULL;
        END IF;
    END $inner$;
    
    RAISE NOTICE 'Sample bookings created successfully';
END $$;

-- 4. Update bike statistics
DO $$
DECLARE
    has_bike_stats BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bikes' AND column_name = 'total_rentals'
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
        RAISE NOTICE 'Bike statistics updated';
    END IF;
END $$;

-- 5. Verify data creation
SELECT 
    'DATA CREATION COMPLETE ✅' as status,
    (SELECT COUNT(*) FROM public.bikes) as total_bikes,
    (SELECT COUNT(*) FROM public.bookings) as total_bookings,
    (SELECT COUNT(*) FROM public.users) as total_users,
    (SELECT COUNT(*) FROM public.users WHERE role = 'admin') as admin_users,
    (SELECT COUNT(*) FROM public.users WHERE role = 'customer') as customer_users;

-- 6. Show sample statistics for admin dashboard
SELECT 
    'BIKES BY STATUS' as category,
    status,
    COUNT(*) as count,
    ROUND(AVG(price_per_day)) as avg_price
FROM public.bikes 
GROUP BY status
ORDER BY count DESC;

SELECT 
    'BOOKINGS BY STATUS' as category,
    status,
    COUNT(*) as count,
    COALESCE(SUM(total_amount), 0) as total_revenue
FROM public.bookings
GROUP BY status
ORDER BY count DESC;

SELECT 
    'REVENUE BY BIKE' as category,
    b.model || ' (' || b.license_plate || ')' as bike_info,
    COUNT(bk.id) as total_bookings,
    COALESCE(SUM(CASE WHEN bk.payment_status = 'paid' THEN bk.total_amount ELSE 0 END), 0) as total_revenue
FROM public.bikes b
LEFT JOIN public.bookings bk ON b.id = bk.bike_id
GROUP BY b.id, b.model, b.license_plate
ORDER BY total_revenue DESC;

-- 7. Final success message
SELECT 'SUCCESS! 🎉' as result, 'All sample data created without conflicts!' as message;
SELECT '📊 Admin Dashboard Ready!' as status, 'Login and check the Admin tab for real data' as instruction; 
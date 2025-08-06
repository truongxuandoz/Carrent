-- =============================================
-- FINAL VERSION: CREATE SAMPLE DATA
-- Run this AFTER fix_foreign_key_constraint.sql
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

-- 2. Create sample users with proper auth_id handling
DO $$
DECLARE
    existing_auth_user_id UUID;
    auth_user_count INTEGER;
    sample_customer_id UUID;
    sample_admin_id UUID;
BEGIN
    -- Check if there are existing auth users
    SELECT COUNT(*) INTO auth_user_count FROM auth.users;
    
    -- Get first existing auth user ID if available
    IF auth_user_count > 0 THEN
        SELECT id INTO existing_auth_user_id FROM auth.users ORDER BY created_at DESC LIMIT 1;
        RAISE NOTICE 'Found existing auth user: %', existing_auth_user_id;
    END IF;
    
    -- Create sample customer user
    IF existing_auth_user_id IS NOT NULL THEN
        -- Use existing auth_id for one user
        INSERT INTO public.users (
            id, auth_id, email, full_name, phone_number, role, is_active, account_status, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), existing_auth_user_id, 'customer@example.com', 'John Customer', '+84912345678', 'customer', true, 'active', NOW(), NOW()
        ) ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
        RETURNING id INTO sample_customer_id;
    ELSE
        -- Create without auth_id (will be NULL)
        INSERT INTO public.users (
            id, email, full_name, phone_number, role, is_active, account_status, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), 'customer@example.com', 'John Customer', '+84912345678', 'customer', true, 'active', NOW(), NOW()
        ) ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
        RETURNING id INTO sample_customer_id;
    END IF;
    
    -- Create more sample users without auth_id (for admin dashboard testing)
    INSERT INTO public.users (
        id, email, full_name, phone_number, role, is_active, account_status, created_at, updated_at
    ) VALUES 
    (gen_random_uuid(), 'customer1@example.com', 'Nguyen Van A', '+84901234567', 'customer', true, 'active', NOW(), NOW()),
    (gen_random_uuid(), 'customer2@example.com', 'Tran Thi B', '+84901234568', 'customer', true, 'active', NOW(), NOW()),
    (gen_random_uuid(), 'customer3@example.com', 'Le Van C', '+84901234569', 'customer', false, 'suspended', NOW(), NOW())
    ON CONFLICT (email) DO NOTHING;
    
    -- Create admin user (update existing or create new)
    INSERT INTO public.users (
        id, email, full_name, phone_number, role, is_active, account_status, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), 'admin@carrent.com', 'System Administrator', '+84987654321', 'admin', true, 'active', NOW(), NOW()
    ) ON CONFLICT (email) 
    DO UPDATE SET role = 'admin', is_active = true, account_status = 'active', updated_at = NOW()
    RETURNING id INTO sample_admin_id;
    
    RAISE NOTICE 'Sample users created successfully';
END $$;

-- 3. Create sample bookings
DO $$
DECLARE
    sample_user_id UUID;
    bike1_id UUID;
    bike2_id UUID;
    bike3_id UUID;
BEGIN
    -- Get a sample customer user
    SELECT id INTO sample_user_id FROM public.users WHERE role = 'customer' LIMIT 1;
    
    IF sample_user_id IS NULL THEN
        RAISE EXCEPTION 'No customer user found for creating bookings';
    END IF;
    
    -- Get bike IDs
    SELECT id INTO bike1_id FROM public.bikes WHERE license_plate = '29A1-12345';
    SELECT id INTO bike2_id FROM public.bikes WHERE license_plate = '29A1-12346'; 
    SELECT id INTO bike3_id FROM public.bikes WHERE license_plate = '29A1-12347';
    
    -- Insert bookings with safe column handling
    INSERT INTO public.bookings (
        id, user_id, bike_id, start_date, end_date, total_amount, 
        status, payment_status, created_at, updated_at
    ) VALUES 
    (gen_random_uuid(), sample_user_id, bike1_id, '2024-01-20', '2024-01-22', 400000, 'completed', 'paid', '2024-01-20 08:00:00', '2024-01-22 18:00:00'),
    (gen_random_uuid(), sample_user_id, bike2_id, CURRENT_DATE, CURRENT_DATE + INTERVAL '2 days', 360000, 'active', 'paid', NOW(), NOW()),
    (gen_random_uuid(), sample_user_id, bike3_id, CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '5 days', 240000, 'pending', 'pending', NOW(), NOW()),
    (gen_random_uuid(), sample_user_id, bike1_id, '2024-01-15', '2024-01-17', 400000, 'completed', 'paid', '2024-01-15 09:00:00', '2024-01-17 17:00:00'),
    (gen_random_uuid(), sample_user_id, bike3_id, '2024-01-10', '2024-01-12', 240000, 'completed', 'paid', '2024-01-10 10:00:00', '2024-01-12 16:00:00');
    
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
            UPDATE public.bookings SET payment_method = 'cash' WHERE payment_method IS NULL;
        END IF;
        
        IF has_notes THEN
            UPDATE public.bookings SET notes = 'Sample booking for testing' WHERE notes IS NULL;
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
    'DATA CREATION COMPLETE' as status,
    (SELECT COUNT(*) FROM public.bikes) as total_bikes,
    (SELECT COUNT(*) FROM public.bookings) as total_bookings,
    (SELECT COUNT(*) FROM public.users) as total_users,
    (SELECT COUNT(*) FROM public.users WHERE role = 'admin') as admin_users,
    (SELECT COUNT(*) FROM public.users WHERE role = 'customer') as customer_users;

-- 6. Show sample statistics for admin dashboard
SELECT 
    'ADMIN DASHBOARD PREVIEW' as section,
    'Bikes by Status' as metric,
    status,
    COUNT(*) as count
FROM public.bikes 
GROUP BY status
UNION ALL
SELECT 
    'ADMIN DASHBOARD PREVIEW' as section,
    'Bookings by Status' as metric,
    status,
    COUNT(*) as count
FROM public.bookings
GROUP BY status
ORDER BY section, metric, status;

SELECT 'SUCCESS! 🎉' as result, 'All sample data created successfully' as message; 
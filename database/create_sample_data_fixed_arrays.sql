-- =============================================
-- SAMPLE DATA WITH PROPER ARRAY SYNTAX
-- Run this AFTER fix_bookings_simple.sql
-- =============================================

-- 1. Insert sample bikes with proper array syntax
INSERT INTO public.bikes (
    id, model, brand, year, license_plate, status, price_per_day, 
    location, fuel_type, transmission, engine_capacity, condition, 
    images, features, last_maintenance, next_maintenance, created_at, updated_at
) VALUES 
(gen_random_uuid(), 'Winner X', 'Honda', 2023, '29A1-123245', 'available', 200000, 'District 1, Ho Chi Minh City', 'gasoline', 'manual', 150, 'excellent', 
 to_jsonb(ARRAY['https://example.com/winner1.jpg']), to_jsonb(ARRAY['ABS', 'LED Lights', 'Digital Display']), '2024-01-15', '2024-04-15', NOW(), NOW()),

(gen_random_uuid(), 'Exciter 150', 'Yamaha', 2023, '29A1-12346', 'rented', 180000, 'District 3, Ho Chi Minh City', 'gasoline', 'manual', 150, 'good',
 to_jsonb(ARRAY['https://example.com/exciter1.jpg']), to_jsonb(ARRAY['LED Lights', 'Digital Display']), '2024-01-10', '2024-04-10', NOW(), NOW()),

(gen_random_uuid(), 'Wave Alpha', 'Honda', 2022, '29A1-12347', 'available', 120000, 'District 7, Ho Chi Minh City', 'gasoline', 'automatic', 110, 'good',
 to_jsonb(ARRAY['https://example.com/wave1.jpg']), to_jsonb(ARRAY['Fuel Efficient', 'Easy Ride']), '2024-01-20', '2024-04-20', NOW(), NOW()),

(gen_random_uuid(), 'Air Blade', 'Honda', 2023, '29A1-12348', 'available', 150000, 'District 1, Ho Chi Minh City', 'gasoline', 'automatic', 125, 'excellent',
 to_jsonb(ARRAY['https://example.com/airblade1.jpg']), to_jsonb(ARRAY['Smart Key', 'LED Lights', 'Large Storage']), '2024-01-25', '2024-04-25', NOW(), NOW()),

(gen_random_uuid(), 'Vision', 'Honda', 2022, '29A1-12349', 'maintenance', 130000, 'District 5, Ho Chi Minh City', 'gasoline', 'automatic', 110, 'fair',
 to_jsonb(ARRAY['https://example.com/vision1.jpg']), to_jsonb(ARRAY['Economic', 'Reliable']), '2024-01-05', '2024-04-05', NOW(), NOW()),

(gen_random_uuid(), 'SH Mode', 'Honda', 2023, '29A1-12350', 'available', 180000, 'District 2, Ho Chi Minh City', 'gasoline', 'automatic', 125, 'excellent',
 to_jsonb(ARRAY['https://example.com/shmode1.jpg']), to_jsonb(ARRAY['Smart Key', 'LED Lights', 'Premium Design']), '2024-02-01', '2024-05-01', NOW(), NOW()),

(gen_random_uuid(), 'Grande', 'Yamaha', 2022, '29A1-12351', 'rented', 170000, 'District 4, Ho Chi Minh City', 'gasoline', 'automatic', 125, 'good',
 to_jsonb(ARRAY['https://example.com/grande1.jpg']), to_jsonb(ARRAY['Smart Key', 'LED Lights']), '2024-01-30', '2024-04-30', NOW(), NOW()),

(gen_random_uuid(), 'Lead', 'Honda', 2023, '29A1-12352', 'available', 160000, 'District 6, Ho Chi Minh City', 'gasoline', 'automatic', 125, 'excellent',
 to_jsonb(ARRAY['https://example.com/lead1.jpg']), to_jsonb(ARRAY['Large Storage', 'LED Lights']), '2024-02-05', '2024-05-05', NOW(), NOW())

ON CONFLICT (license_plate) DO NOTHING;

-- 2. Create sample users (avoiding auth_id conflicts)
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

-- Create/update admin user
INSERT INTO public.users (
    id, email, full_name, phone_number, role, is_active, account_status, created_at, updated_at
) VALUES (
    gen_random_uuid(), 'admin@carrent.com', 'System Administrator', '+84987654321', 'admin', true, 'active', NOW(), NOW()
) ON CONFLICT (email) 
DO UPDATE SET 
    role = 'admin', 
    is_active = true, 
    account_status = 'active', 
    updated_at = NOW();

-- Promote current user to admin (if exists)
UPDATE public.users 
SET role = 'admin', is_active = true, account_status = 'active', updated_at = NOW()
WHERE auth_id IS NOT NULL 
AND role != 'admin'
AND email NOT LIKE '%example.com';

-- 3. Create sample bookings with ALL required fields
DO $$
DECLARE
    sample_user_id UUID;
    bike1_id UUID;
    bike2_id UUID;
    bike3_id UUID;
    bike4_id UUID;
    bike5_id UUID;
    bike1_price INTEGER;
    bike2_price INTEGER;
    bike3_price INTEGER;
    bike4_price INTEGER;
    bike5_price INTEGER;
BEGIN
    -- Get a sample customer user
    SELECT id INTO sample_user_id FROM public.users WHERE role = 'customer' AND email LIKE '%example.com' LIMIT 1;
    
    IF sample_user_id IS NULL THEN
        RAISE EXCEPTION 'No sample customer user found for creating bookings';
    END IF;
    
    -- Get bike IDs and their prices
    SELECT id, price_per_day INTO bike1_id, bike1_price FROM public.bikes WHERE license_plate = '29A1-123245';
    SELECT id, price_per_day INTO bike2_id, bike2_price FROM public.bikes WHERE license_plate = '29A1-12346'; 
    SELECT id, price_per_day INTO bike3_id, bike3_price FROM public.bikes WHERE license_plate = '29A1-12347';
    SELECT id, price_per_day INTO bike4_id, bike4_price FROM public.bikes WHERE license_plate = '29A1-12348';
    SELECT id, price_per_day INTO bike5_id, bike5_price FROM public.bikes WHERE license_plate = '29A1-12349';
    
    -- Insert bookings with ALL required columns including total_days and price_per_day
    INSERT INTO public.bookings (
        id, user_id, bike_id, start_date, end_date, total_days, price_per_day, total_amount, 
        status, payment_status, payment_method, notes, 
        pickup_location, return_location, created_at, updated_at
    ) VALUES 
    -- Historical completed bookings (2 days each)
    (gen_random_uuid(), sample_user_id, bike1_id, '2024-01-20', '2024-01-22', 2, bike1_price, bike1_price * 2, 
     'completed', 'paid', 'cash', 'Great trip to Vung Tau!', 
     'District 1, Ho Chi Minh City', 'District 1, Ho Chi Minh City', '2024-01-20 08:00:00', '2024-01-22 18:00:00'),
    
    (gen_random_uuid(), sample_user_id, bike3_id, '2024-01-15', '2024-01-17', 2, bike3_price, bike3_price * 2, 
     'completed', 'paid', 'vnpay', 'Nice weekend trip', 
     'District 7, Ho Chi Minh City', 'District 7, Ho Chi Minh City', '2024-01-15 09:00:00', '2024-01-17 17:00:00'),
    
    (gen_random_uuid(), sample_user_id, bike4_id, '2024-01-10', '2024-01-12', 2, bike4_price, bike4_price * 2, 
     'completed', 'paid', 'momo', 'Business trip to Binh Duong', 
     'District 1, Ho Chi Minh City', 'District 1, Ho Chi Minh City', '2024-01-10 10:00:00', '2024-01-12 16:00:00'),
    
    -- Current active booking (2 days)
    (gen_random_uuid(), sample_user_id, bike2_id, CURRENT_DATE, CURRENT_DATE + INTERVAL '2 days', 2, bike2_price, bike2_price * 2, 
     'active', 'paid', 'bank_transfer', 'Currently on business trip', 
     'District 3, Ho Chi Minh City', 'District 3, Ho Chi Minh City', NOW(), NOW()),
    
    -- Future pending booking (2 days)
    (gen_random_uuid(), sample_user_id, bike1_id, CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '5 days', 2, bike1_price, bike1_price * 2, 
     'pending', 'pending', 'momo', 'Weekend getaway planned', 
     'District 1, Ho Chi Minh City', 'District 1, Ho Chi Minh City', NOW(), NOW()),
    
    -- More historical data (2 days)
    (gen_random_uuid(), sample_user_id, bike2_id, '2024-01-05', '2024-01-07', 2, bike2_price, bike2_price * 2, 
     'completed', 'paid', 'vnpay', 'New Year holiday trip', 
     'District 3, Ho Chi Minh City', 'District 3, Ho Chi Minh City', '2024-01-05 11:00:00', '2024-01-07 15:00:00'),
    
    -- Cancelled booking (1 day)
    (gen_random_uuid(), sample_user_id, bike5_id, '2024-01-25', '2024-01-26', 1, bike5_price, bike5_price * 1, 
     'cancelled', 'refunded', 'cash', 'Changed travel plans', 
     'District 5, Ho Chi Minh City', 'District 5, Ho Chi Minh City', '2024-01-25 12:00:00', '2024-01-26 10:00:00')
    
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Sample bookings created successfully with all required fields';
END $$;

-- 4. Update bike statistics
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
        WHERE u.role = 'customer' AND u.email LIKE '%example.com'
        LIMIT 3
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Sample notifications created';
    END IF;
END $$;

-- 6. Verify data creation
SELECT 
    'DATA CREATION COMPLETE ✅' as status,
    (SELECT COUNT(*) FROM public.bikes) as total_bikes,
    (SELECT COUNT(*) FROM public.bookings) as total_bookings,
    (SELECT COUNT(*) FROM public.users) as total_users,
    (SELECT COUNT(*) FROM public.users WHERE role = 'admin') as admin_users,
    (SELECT COUNT(*) FROM public.users WHERE role = 'customer') as customer_users;

-- 7. Show detailed statistics for admin dashboard
SELECT 
    'BIKES BY STATUS' as category,
    status,
    COUNT(*) as count,
    ROUND(AVG(price_per_day)) as avg_price_per_day
FROM public.bikes 
GROUP BY status
ORDER BY count DESC;

SELECT 
    'BOOKINGS BY STATUS' as category,
    status,
    COUNT(*) as count,
    SUM(total_days) as total_rental_days,
    COALESCE(SUM(total_amount), 0) as total_revenue
FROM public.bookings
GROUP BY status
ORDER BY count DESC;

SELECT 
    'TOP BIKES BY REVENUE' as category,
    b.model || ' (' || b.license_plate || ')' as bike_info,
    b.status,
    COUNT(bk.id) as total_bookings,
    SUM(COALESCE(bk.total_days, 0)) as total_rental_days,
    COALESCE(SUM(CASE WHEN bk.payment_status = 'paid' THEN bk.total_amount ELSE 0 END), 0) as total_revenue
FROM public.bikes b
LEFT JOIN public.bookings bk ON b.id = bk.bike_id
GROUP BY b.id, b.model, b.license_plate, b.status
ORDER BY total_revenue DESC;

-- 8. Show sample of bikes with jsonb arrays
SELECT 
    'BIKES WITH JSONB ARRAYS' as info,
    model,
    status,
    images,
    features
FROM public.bikes 
LIMIT 3;

-- 9. Final success message
SELECT 'SUCCESS! 🎉' as result, 'Complete sample data created with proper JSONB arrays!' as message;
SELECT '📊 Admin Dashboard Ready!' as status, 'Login and check the Admin tab for real data' as instruction; 
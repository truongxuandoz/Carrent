-- =============================================
-- CREATE REAL SAMPLE DATA FOR ADMIN DASHBOARD
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. FIRST: Insert sample bikes
INSERT INTO public.bikes (
    id, model, brand, year, license_plate, status, price_per_day, 
    location, fuel_type, transmission, engine_capacity, images, 
    features, condition, last_maintenance, next_maintenance, created_at, updated_at
) VALUES 
-- Popular bikes
(gen_random_uuid(), 'Winner X', 'Honda', 2023, '29A1-12345', 'available', 200000, 'District 1, Ho Chi Minh City', 'gasoline', 'manual', 150, 
 '["https://example.com/winner1.jpg"]', '["ABS", "LED Lights", "Digital Display"]', 'excellent', '2024-01-15', '2024-04-15', NOW(), NOW()),

(gen_random_uuid(), 'Exciter 150', 'Yamaha', 2023, '29A1-12346', 'rented', 180000, 'District 3, Ho Chi Minh City', 'gasoline', 'manual', 150,
 '["https://example.com/exciter1.jpg"]', '["LED Lights", "Digital Display"]', 'good', '2024-01-10', '2024-04-10', NOW(), NOW()),

(gen_random_uuid(), 'Wave Alpha', 'Honda', 2022, '29A1-12347', 'available', 120000, 'District 7, Ho Chi Minh City', 'gasoline', 'automatic', 110,
 '["https://example.com/wave1.jpg"]', '["Fuel Efficient", "Easy Ride"]', 'good', '2024-01-20', '2024-04-20', NOW(), NOW()),

(gen_random_uuid(), 'Air Blade', 'Honda', 2023, '29A1-12348', 'available', 150000, 'District 1, Ho Chi Minh City', 'gasoline', 'automatic', 125,
 '["https://example.com/airblade1.jpg"]', '["Smart Key", "LED Lights", "Large Storage"]', 'excellent', '2024-01-25', '2024-04-25', NOW(), NOW()),

(gen_random_uuid(), 'Vision', 'Honda', 2022, '29A1-12349', 'maintenance', 130000, 'District 5, Ho Chi Minh City', 'gasoline', 'automatic', 110,
 '["https://example.com/vision1.jpg"]', '["Economic", "Reliable"]', 'fair', '2024-01-05', '2024-04-05', NOW(), NOW()),

-- More bikes for variety
(gen_random_uuid(), 'SH Mode', 'Honda', 2023, '29A1-12350', 'available', 180000, 'District 2, Ho Chi Minh City', 'gasoline', 'automatic', 125,
 '["https://example.com/shmode1.jpg"]', '["Smart Key", "LED Lights", "Premium Design"]', 'excellent', '2024-02-01', '2024-05-01', NOW(), NOW()),

(gen_random_uuid(), 'Grande', 'Yamaha', 2022, '29A1-12351', 'rented', 170000, 'District 4, Ho Chi Minh City', 'gasoline', 'automatic', 125,
 '["https://example.com/grande1.jpg"]', '["Smart Key", "LED Lights"]', 'good', '2024-01-30', '2024-04-30', NOW(), NOW()),

(gen_random_uuid(), 'Lead', 'Honda', 2023, '29A1-12352', 'available', 160000, 'District 6, Ho Chi Minh City', 'gasoline', 'automatic', 125,
 '["https://example.com/lead1.jpg"]', '["Large Storage", "LED Lights"]', 'excellent', '2024-02-05', '2024-05-05', NOW(), NOW());

-- 2. Create sample bookings (make sure user exists first)
DO $$
DECLARE
    sample_user_id UUID;
    bike1_id UUID;
    bike2_id UUID;
    bike3_id UUID;
BEGIN
    -- Get a sample user (or create one)
    SELECT id INTO sample_user_id FROM public.users LIMIT 1;
    
    IF sample_user_id IS NULL THEN
        -- Create a sample customer user
        INSERT INTO public.users (id, auth_id, email, full_name, phone_number, role, is_active, account_status)
        VALUES (gen_random_uuid(), gen_random_uuid(), 'customer@example.com', 'John Customer', '+84912345678', 'customer', true, 'active')
        RETURNING id INTO sample_user_id;
    END IF;
    
    -- Get some bike IDs
    SELECT id INTO bike1_id FROM public.bikes WHERE license_plate = '29A1-12345';
    SELECT id INTO bike2_id FROM public.bikes WHERE license_plate = '29A1-12346'; 
    SELECT id INTO bike3_id FROM public.bikes WHERE license_plate = '29A1-12347';
    
    -- Insert sample bookings
    INSERT INTO public.bookings (
        id, user_id, bike_id, start_date, end_date, total_amount, 
        status, payment_status, payment_method, notes, created_at, updated_at
    ) VALUES 
    -- Recent completed booking
    (gen_random_uuid(), sample_user_id, bike1_id, 
     '2024-01-20', '2024-01-22', 400000, 
     'completed', 'paid', 'cash', 'Great trip to Vung Tau', 
     '2024-01-20 08:00:00', '2024-01-22 18:00:00'),
     
    -- Current active booking
    (gen_random_uuid(), sample_user_id, bike2_id,
     CURRENT_DATE, CURRENT_DATE + INTERVAL '2 days', 360000,
     'active', 'paid', 'bank_transfer', 'Business trip',
     NOW(), NOW()),
     
    -- Pending booking
    (gen_random_uuid(), sample_user_id, bike3_id,
     CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '5 days', 240000,
     'pending', 'pending', 'momo', 'Weekend trip',
     NOW(), NOW()),
     
    -- More historical data for analytics
    (gen_random_uuid(), sample_user_id, bike1_id,
     '2024-01-15', '2024-01-17', 400000,
     'completed', 'paid', 'vnpay', 'City tour',
     '2024-01-15 09:00:00', '2024-01-17 17:00:00'),
     
    (gen_random_uuid(), sample_user_id, bike3_id,
     '2024-01-10', '2024-01-12', 240000,
     'completed', 'paid', 'cash', 'Visit friends',
     '2024-01-10 10:00:00', '2024-01-12 16:00:00');
     
END $$;

-- 3. Create sample notifications
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
LIMIT 3;

INSERT INTO public.notifications (
    id, user_id, title, message, type, is_read, created_at
) 
SELECT 
    gen_random_uuid(),
    u.id,
    'Booking Confirmed',
    'Your booking has been confirmed. Please arrive 15 minutes early.',
    'booking',
    true,
    NOW() - INTERVAL '1 day'
FROM public.users u 
WHERE u.role = 'customer'
LIMIT 2;

-- 4. Update bike stats based on bookings
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

-- 5. Verify data creation
SELECT 
    'DATA CREATION SUMMARY' as summary,
    (SELECT COUNT(*) FROM public.bikes) as total_bikes,
    (SELECT COUNT(*) FROM public.bookings) as total_bookings,
    (SELECT COUNT(*) FROM public.users) as total_users,
    (SELECT COUNT(*) FROM public.notifications) as total_notifications;

-- 6. Show sample data overview
SELECT 'BIKES OVERVIEW' as section, status, COUNT(*) as count
FROM public.bikes 
GROUP BY status
UNION ALL
SELECT 'BOOKINGS OVERVIEW' as section, status, COUNT(*) as count  
FROM public.bookings
GROUP BY status
ORDER BY section, count DESC; 
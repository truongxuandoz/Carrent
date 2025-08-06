-- =============================================
-- FIX BOOKINGS TABLE SCHEMA
-- Run this FIRST before create_sample_data.sql
-- =============================================

-- 1. Check current bookings table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bookings' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Add missing columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cash';

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Add other useful columns if not exists
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS pickup_location VARCHAR(255);

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS return_location VARCHAR(255);

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS pickup_time TIME;

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS return_time TIME;

-- 4. Add missing columns to bikes table if needed
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS total_rentals INTEGER DEFAULT 0;

ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS total_revenue BIGINT DEFAULT 0;

-- 5. Verify schema is correct
SELECT 
    'BOOKINGS SCHEMA UPDATED' as status,
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
    'BIKES SCHEMA UPDATED' as status,
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'bikes' AND table_schema = 'public'
AND column_name IN ('total_rentals', 'total_revenue')
ORDER BY ordinal_position; 
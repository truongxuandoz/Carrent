-- =============================================
-- FIX BOOKINGS TABLE - CORRECTED VERSION
-- Run this FIRST to ensure all columns exist
-- =============================================

-- 1. Check current bookings table structure
SELECT 
    'CURRENT BOOKINGS SCHEMA' as info,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Add missing columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS total_days INTEGER;

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS price_per_day BIGINT;

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cash';

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS pickup_location VARCHAR(255);

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS return_location VARCHAR(255);

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS pickup_time TIME;

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS return_time TIME;

-- 3. Make total_days nullable if it has NOT NULL constraint
DO $$
DECLARE
    column_nullable BOOLEAN;
BEGIN
    SELECT is_nullable = 'YES' INTO column_nullable
    FROM information_schema.columns 
    WHERE table_name = 'bookings' 
    AND table_schema = 'public' 
    AND column_name = 'total_days';
    
    IF column_nullable = FALSE THEN
        -- If total_days is NOT NULL, make it nullable first
        ALTER TABLE public.bookings ALTER COLUMN total_days DROP NOT NULL;
        RAISE NOTICE 'Made total_days column nullable';
    END IF;
END $$;

-- 4. Update existing records to calculate total_days (FIXED SYNTAX)
UPDATE public.bookings 
SET total_days = GREATEST(1, (EXTRACT(EPOCH FROM (end_date - start_date)) / 86400)::INTEGER)
WHERE total_days IS NULL 
AND start_date IS NOT NULL 
AND end_date IS NOT NULL;

-- 5. Update existing records to set price_per_day (FIXED SYNTAX)
UPDATE public.bookings 
SET price_per_day = CASE 
    WHEN total_days > 0 THEN (total_amount / total_days)
    ELSE total_amount
END
WHERE price_per_day IS NULL 
AND total_amount IS NOT NULL 
AND total_days IS NOT NULL;

-- 6. Add missing columns to bikes table if needed
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS total_rentals INTEGER DEFAULT 0;

ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS total_revenue BIGINT DEFAULT 0;

ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';

ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS last_maintenance DATE;

ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS next_maintenance DATE;

-- 7. Verify schema is correct
SELECT 
    'UPDATED BOOKINGS SCHEMA' as info,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' AND table_schema = 'public'
AND column_name IN ('total_days', 'price_per_day', 'payment_method', 'notes')
ORDER BY ordinal_position;

-- 8. Show bikes schema update
SELECT 
    'UPDATED BIKES SCHEMA' as info,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'bikes' AND table_schema = 'public'
AND column_name IN ('total_rentals', 'total_revenue', 'images', 'features')
ORDER BY ordinal_position;

SELECT 'SCHEMA FIX COMPLETE ✅' as status, 'Ready for sample data creation' as message; 
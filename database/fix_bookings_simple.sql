-- =============================================
-- SIMPLE FIX BOOKINGS TABLE
-- Uses simple syntax to avoid type casting issues
-- =============================================

-- 1. Add missing columns to bookings table (simple approach)
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

-- 2. Make total_days nullable (simple approach)
DO $$
BEGIN
    -- Try to make total_days nullable, ignore error if already nullable
    BEGIN
        ALTER TABLE public.bookings ALTER COLUMN total_days DROP NOT NULL;
        RAISE NOTICE 'Made total_days column nullable';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'total_days column is already nullable or does not exist';
    END;
END $$;

-- 3. Update existing records using simple date arithmetic
UPDATE public.bookings 
SET total_days = CASE 
    WHEN end_date IS NOT NULL AND start_date IS NOT NULL 
    THEN GREATEST(1, end_date::date - start_date::date)
    ELSE 1
END
WHERE total_days IS NULL;

-- 4. Update price_per_day using simple division
UPDATE public.bookings 
SET price_per_day = CASE 
    WHEN total_days > 0 AND total_amount IS NOT NULL 
    THEN total_amount / total_days
    ELSE total_amount
END
WHERE price_per_day IS NULL;

-- 5. Add missing columns to bikes table
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

-- 6. Verify columns were added
SELECT 
    'BOOKINGS COLUMNS CHECK' as info,
    COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND table_schema = 'public'
AND column_name IN ('total_days', 'price_per_day', 'payment_method', 'notes');

SELECT 
    'BIKES COLUMNS CHECK' as info,
    COUNT(*) as total_columns  
FROM information_schema.columns 
WHERE table_name = 'bikes' 
AND table_schema = 'public'
AND column_name IN ('total_rentals', 'total_revenue', 'images', 'features');

-- 7. Show sample of updated data
SELECT 
    'SAMPLE BOOKINGS DATA' as info,
    start_date,
    end_date, 
    total_days,
    total_amount,
    price_per_day
FROM public.bookings 
LIMIT 3;

SELECT 'SIMPLE SCHEMA FIX COMPLETE ✅' as status, 'Ready for sample data creation' as message; 
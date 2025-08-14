-- FIX MISSING COLUMNS IN TABLES
-- This fixes the "column 'is_approved' does not exist" error and adds other missing columns

-- ==================== CHECK CURRENT TABLE STRUCTURES ====================
SELECT '=== CHECKING CURRENT TABLE STRUCTURES ===' as info;

-- Check bikes table structure
SELECT 
  'BIKES TABLE COLUMNS:' as table_info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'bikes' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ==================== ADD MISSING COLUMNS TO BIKES TABLE ====================
SELECT '=== ADDING MISSING COLUMNS TO BIKES ===' as info;

-- Add is_approved column if missing
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- Add is_available column if missing  
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- Add rating column if missing
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0;

-- Add review_count column if missing
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Add owner_id column if missing (foreign key to users)
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

-- Add location column for PostGIS if missing
-- ALTER TABLE public.bikes 
-- ADD COLUMN IF NOT EXISTS location POINT;

-- Add address column if missing
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add images column if missing
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Add name column if missing
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Add type column if missing
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('scooter', 'manual', 'sport', 'electric')) DEFAULT 'scooter';

-- Add year column if missing
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS year INTEGER DEFAULT 2023;

-- Add engine_capacity column if missing
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS engine_capacity INTEGER DEFAULT 110;

-- Add fuel_type column if missing
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS fuel_type TEXT CHECK (fuel_type IN ('gasoline', 'electric')) DEFAULT 'gasoline';

-- Add transmission column if missing
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS transmission TEXT CHECK (transmission IN ('automatic', 'manual')) DEFAULT 'automatic';

-- Add color column if missing
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS color TEXT;

-- Add license_plate column if missing
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS license_plate TEXT UNIQUE;

-- Add rating column if missing
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0;

-- Add review_count column if missing
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Add description column if missing
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add price columns if missing
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS price_per_day DECIMAL(10,2) DEFAULT 0;

ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS price_per_hour DECIMAL(10,2) DEFAULT 0;

ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS deposit DECIMAL(10,2) DEFAULT 0;

ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS insurance DECIMAL(10,2) DEFAULT 0;

-- ==================== ADD MISSING COLUMNS TO BOOKINGS TABLE ====================
SELECT '=== ADDING MISSING COLUMNS TO BOOKINGS ===' as info;

-- Add delivery_type column if missing
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS delivery_type TEXT CHECK (delivery_type IN ('pickup', 'delivery')) DEFAULT 'pickup';

-- Add delivery_fee column if missing
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0;

-- Add pickup_location and delivery_location if missing
-- ALTER TABLE public.bookings 
-- ADD COLUMN IF NOT EXISTS pickup_location POINT;

-- ALTER TABLE public.bookings 
-- ADD COLUMN IF NOT EXISTS delivery_location POINT;

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS pickup_address TEXT;

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS delivery_address TEXT;

-- Add payment columns if missing
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('vnpay', 'momo', 'zalopay', 'cash', 'card'));

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT;

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending';

-- Add admin columns if missing
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES public.users(id);

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;

-- ==================== ADD MISSING COLUMNS TO REVIEWS TABLE ====================
SELECT '=== ADDING MISSING COLUMNS TO REVIEWS ===' as info;

-- Add is_verified column if missing
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Add images column if missing
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- ==================== ADD MISSING COLUMNS TO NOTIFICATIONS TABLE ====================
SELECT '=== ADDING MISSING COLUMNS TO NOTIFICATIONS ===' as info;

-- Add type column if missing
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('booking_created', 'booking_confirmed', 'delivery_started', 'booking_completed', 'booking_cancelled', 'payment', 'emergency', 'system')) DEFAULT 'system';

-- Add booking_id reference if missing
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE;

-- Add data column if missing
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;

-- ==================== CREATE SAMPLE DATA ====================
SELECT '=== CREATING SAMPLE BIKES ===' as info;

-- Create sample bikes for testing
INSERT INTO public.bikes (
  name,
  brand,
  model,
  year,
  type,
  engine_capacity,
  fuel_type,
  transmission,
  color,
  license_plate,
  description,
  price_per_day,
  price_per_hour,
  deposit,
  insurance,
  address,
  owner_id,
  is_available,
  is_approved
) 
SELECT 
  'Honda Wave Alpha',
  'Honda',
  'Wave Alpha',
  2023,
  'scooter',
  110,
  'gasoline',
  'automatic',
  'Đỏ',
  '59A1-12345',
  'Xe số Honda Wave Alpha 2023, tiết kiệm xăng, phù hợp đi phố',
  200000,
  25000,
  2000000,
  50000,
  'Quận 1, TP.HCM',
  u.id,
  true,
  true
FROM public.users u 
WHERE u.email = 'admin@admin.com'
AND NOT EXISTS (SELECT 1 FROM public.bikes WHERE license_plate = '59A1-12345');

INSERT INTO public.bikes (
  name,
  brand,
  model,
  year,
  type,
  engine_capacity,
  fuel_type,
  transmission,
  color,
  license_plate,
  description,
  price_per_day,
  price_per_hour,
  deposit,
  insurance,
  address,
  owner_id,
  is_available,
  is_approved
) 
SELECT 
  'Yamaha Exciter 155',
  'Yamaha',
  'Exciter',
  2023,
  'sport',
  155,
  'gasoline',
  'manual',
  'Xanh',
  '59B2-67890',
  'Yamaha Exciter 155 2023, động cơ mạnh mẽ, thiết kế thể thao',
  300000,
  40000,
  3000000,
  75000,
  'Quận 3, TP.HCM',
  u.id,
  true,
  true
FROM public.users u 
WHERE u.email = 'admin@admin.com'
AND NOT EXISTS (SELECT 1 FROM public.bikes WHERE license_plate = '59B2-67890');

-- ==================== VERIFICATION ====================
SELECT '=== VERIFICATION ===' as info;

-- Show updated bikes table structure
SELECT 
  'UPDATED BIKES TABLE:' as table_info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'bikes' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show sample bikes created
SELECT 
  'SAMPLE BIKES:' as data_info,
  name,
  brand,
  model,
  is_approved,
  is_available,
  price_per_day
FROM public.bikes
ORDER BY created_at DESC
LIMIT 5;

SELECT '✅ MISSING COLUMNS FIXED!' as status;
SELECT '🚗 Sample bikes created for testing' as bikes_status; 
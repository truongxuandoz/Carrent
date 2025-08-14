-- Add Missing Columns to Bikes Table
-- This script adds all columns that the application code expects but may be missing from the database

-- First check current structure
SELECT 
  'CURRENT BIKES TABLE STRUCTURE:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'bikes' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add is_available column (critical for bike availability logic)
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- Add is_approved column (for admin approval workflow)
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- Add rating column (for user reviews)
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0;

-- Add review_count column (for review statistics)
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Add owner_id column (to track bike owners)
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

-- Add name column (for bike display name)
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Add type column (scooter, manual, sport, electric)
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('scooter', 'manual', 'sport', 'electric')) DEFAULT 'scooter';

-- Add color column 
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'Unknown';

-- Add description column
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add price columns with proper data types
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS price_per_hour DECIMAL(10,2) DEFAULT 0;

-- Ensure price_per_day exists with correct type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bikes' AND column_name = 'price_per_day') THEN
        ALTER TABLE public.bikes ADD COLUMN price_per_day DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- Add deposit column
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS deposit DECIMAL(10,2) DEFAULT 0;

-- Add insurance column
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS insurance DECIMAL(10,2) DEFAULT 0;

-- Add address column
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Ensure images column exists as JSONB
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bikes' AND column_name = 'images') THEN
        ALTER TABLE public.bikes ADD COLUMN images JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Verify all columns are added
SELECT 
  'UPDATED BIKES TABLE STRUCTURE:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'bikes' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Update existing bikes to have proper default values
UPDATE public.bikes 
SET 
  is_available = COALESCE(is_available, true),
  is_approved = COALESCE(is_approved, false),
  rating = COALESCE(rating, 0),
  review_count = COALESCE(review_count, 0),
  name = COALESCE(name, model || ' ' || brand),
  type = COALESCE(type, 'scooter'),
  color = COALESCE(color, 'Unknown'),
  price_per_hour = COALESCE(price_per_hour, 0),
  deposit = COALESCE(deposit, price_per_day * 2), -- Default deposit = 2x daily price
  insurance = COALESCE(insurance, 0),
  images = COALESCE(images, '[]'::jsonb)
WHERE id IS NOT NULL;

SELECT '✅ All missing columns added successfully!' as status;
SELECT '🚗 Sample bikes data:' as data_status;

-- Show sample data to verify
SELECT 
  id,
  name,
  brand,
  model,
  condition,
  is_available,
  is_approved,
  price_per_day,
  created_at
FROM public.bikes
ORDER BY created_at DESC
LIMIT 3; 
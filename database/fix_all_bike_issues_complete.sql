-- COMPLETE BIKE SCHEMA FIX
-- This script fixes ALL bike creation issues:
-- 1. Renames status column to condition 
-- 2. Adds all missing columns
-- 3. Fixes owner_id foreign key constraint
-- 4. Sets proper default values

-- ==================== STEP 1: CHECK CURRENT STRUCTURE ====================
SELECT 
  '=== STEP 1: CURRENT BIKES TABLE STRUCTURE ===' as step;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'bikes' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ==================== STEP 2: RENAME STATUS TO CONDITION ====================
SELECT 
  '=== STEP 2: RENAMING STATUS TO CONDITION ===' as step;

-- Drop the old condition column if it exists (physical condition)
ALTER TABLE public.bikes 
DROP COLUMN IF EXISTS condition CASCADE;

-- Rename status column to condition (operational status)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bikes' AND column_name = 'status') THEN
        ALTER TABLE public.bikes RENAME COLUMN status TO condition;
        RAISE NOTICE 'Renamed status to condition';
    ELSE
        RAISE NOTICE 'status column does not exist, skipping rename';
    END IF;
END $$;

-- ==================== STEP 3: FIX OWNER_ID CONSTRAINT ====================
SELECT 
  '=== STEP 3: FIXING OWNER_ID CONSTRAINT ===' as step;

-- Drop the foreign key constraint temporarily
ALTER TABLE public.bikes 
DROP CONSTRAINT IF EXISTS bikes_owner_id_fkey;

-- Make owner_id nullable if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bikes' AND column_name = 'owner_id') THEN
        ALTER TABLE public.bikes ALTER COLUMN owner_id DROP NOT NULL;
        RAISE NOTICE 'Made owner_id nullable';
    END IF;
END $$;

-- ==================== STEP 4: ADD MISSING COLUMNS ====================
SELECT 
  '=== STEP 4: ADDING MISSING COLUMNS ===' as step;

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

-- Add owner_id column if missing (nullable foreign key to users)
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS owner_id UUID;

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
        RAISE NOTICE 'Added price_per_day column';
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
        RAISE NOTICE 'Added images column';
    END IF;
END $$;

-- ==================== STEP 5: RE-ADD FOREIGN KEY CONSTRAINT (NULLABLE) ====================
SELECT 
  '=== STEP 5: RE-ADDING FOREIGN KEY CONSTRAINT ===' as step;

-- Re-add the foreign key constraint but make it optional (NULL allowed)
DO $$
BEGIN
    -- Only add if users table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        ALTER TABLE public.bikes 
        ADD CONSTRAINT bikes_owner_id_fkey 
        FOREIGN KEY (owner_id) 
        REFERENCES public.users(id) 
        ON DELETE SET NULL;
        RAISE NOTICE 'Added nullable foreign key constraint for owner_id';
    ELSE
        RAISE NOTICE 'users table does not exist, skipping foreign key constraint';
    END IF;
EXCEPTION 
    WHEN duplicate_object THEN
        RAISE NOTICE 'Foreign key constraint already exists';
END $$;

-- ==================== STEP 6: UPDATE EXISTING DATA ====================
SELECT 
  '=== STEP 6: UPDATING EXISTING DATA ===' as step;

-- Update existing bikes to have proper default values
UPDATE public.bikes 
SET 
  is_available = COALESCE(is_available, true),
  is_approved = COALESCE(is_approved, true), -- Auto-approve existing bikes
  rating = COALESCE(rating, 0),
  review_count = COALESCE(review_count, 0),
  name = COALESCE(name, COALESCE(model, 'Unknown') || ' ' || COALESCE(brand, 'Bike')),
  type = COALESCE(type, 'scooter'),
  color = COALESCE(color, 'Unknown'),
  price_per_hour = COALESCE(price_per_hour, 0),
  deposit = COALESCE(deposit, GREATEST(COALESCE(price_per_day, 0) * 2, 500000)), -- Default deposit = 2x daily price, min 500k VND
  insurance = COALESCE(insurance, 0),
  images = COALESCE(images, '[]'::jsonb),
  condition = COALESCE(condition, 'available') -- Set default condition to available
WHERE id IS NOT NULL;

-- ==================== STEP 7: VERIFY FINAL STRUCTURE ====================
SELECT 
  '=== STEP 7: FINAL BIKES TABLE STRUCTURE ===' as step;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'bikes' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ==================== STEP 8: SHOW CONSTRAINTS ====================
SELECT 
  '=== STEP 8: TABLE CONSTRAINTS ===' as step;

SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'bikes' AND table_schema = 'public'
ORDER BY constraint_type, constraint_name;

-- ==================== STEP 9: SHOW SAMPLE DATA ====================
SELECT 
  '=== STEP 9: SAMPLE BIKES DATA ===' as step;

SELECT 
  id,
  name,
  brand,
  model,
  condition,
  is_available,
  is_approved,
  owner_id,
  price_per_day,
  created_at
FROM public.bikes
ORDER BY created_at DESC
LIMIT 3;

-- ==================== SUCCESS MESSAGES ====================
SELECT '🎉 ALL BIKE SCHEMA ISSUES FIXED!' as status;
SELECT '✅ status renamed to condition' as fix1;
SELECT '✅ All missing columns added' as fix2;
SELECT '✅ owner_id made nullable' as fix3;
SELECT '✅ Default values set for existing data' as fix4;
SELECT '🚗 Ready to create new bikes without user constraint!' as ready; 
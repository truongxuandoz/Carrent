-- Rename status column to condition in bikes table
-- This aligns the database schema with the business logic

-- First, check current table structure
SELECT 
  'CURRENT BIKES TABLE COLUMNS:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'bikes' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Drop the old condition column if it exists (the one about bike physical condition)
ALTER TABLE public.bikes 
DROP COLUMN IF EXISTS condition;

-- Rename status column to condition (this represents the bike's availability/operational status)
ALTER TABLE public.bikes 
RENAME COLUMN status TO condition;

-- Verify the change
SELECT 
  'UPDATED BIKES TABLE COLUMNS:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'bikes' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show sample data to verify
SELECT 
  'SAMPLE BIKES WITH NEW CONDITION COLUMN:' as data_info,
  id,
  name,
  brand,
  model,
  condition,
  created_at
FROM public.bikes
ORDER BY created_at DESC
LIMIT 3;

SELECT '✅ Successfully renamed status to condition!' as status; 
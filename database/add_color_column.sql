-- ==========================================
-- ADD MISSING COLOR COLUMN TO BIKES TABLE
-- ==========================================

BEGIN;

-- Add color column to bikes table
ALTER TABLE public.bikes 
ADD COLUMN IF NOT EXISTS color TEXT;

-- Update existing records with default colors
UPDATE public.bikes 
SET color = CASE 
  WHEN color IS NULL OR color = '' THEN 
    CASE (id % 7)
      WHEN 0 THEN 'Đỏ'
      WHEN 1 THEN 'Xanh'
      WHEN 2 THEN 'Đen'
      WHEN 3 THEN 'Trắng'
      WHEN 4 THEN 'Vàng'
      WHEN 5 THEN 'Bạc'
      ELSE 'Xám'
    END
  ELSE color
END
WHERE color IS NULL OR color = '';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bikes' 
  AND table_schema = 'public'
  AND column_name = 'color';

-- Show sample data
SELECT id, name, brand, model, color
FROM public.bikes
LIMIT 5;

COMMIT; 
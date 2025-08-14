-- Fix owner_id foreign key constraint issue
-- Make owner_id nullable so bikes can be created without requiring a user record

-- Check current owner_id constraint
SELECT 
  'CURRENT owner_id CONSTRAINT:' as info,
  constraint_name,
  constraint_type,
  column_name,
  is_nullable
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
JOIN information_schema.columns c 
  ON c.table_name = tc.table_name AND c.column_name = ccu.column_name
WHERE tc.table_name = 'bikes' 
  AND tc.table_schema = 'public' 
  AND ccu.column_name = 'owner_id';

-- Drop the foreign key constraint temporarily
ALTER TABLE public.bikes 
DROP CONSTRAINT IF EXISTS bikes_owner_id_fkey;

-- Make owner_id nullable
ALTER TABLE public.bikes 
ALTER COLUMN owner_id DROP NOT NULL;

-- Re-add the foreign key constraint but make it optional (NULL allowed)
ALTER TABLE public.bikes 
ADD CONSTRAINT bikes_owner_id_fkey 
FOREIGN KEY (owner_id) 
REFERENCES public.users(id) 
ON DELETE SET NULL;

-- Verify the change
SELECT 
  'UPDATED owner_id INFO:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'bikes' 
  AND table_schema = 'public' 
  AND column_name = 'owner_id';

-- Show current constraints
SELECT 
  'UPDATED CONSTRAINTS:' as info,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'bikes' 
  AND table_schema = 'public' 
  AND constraint_name LIKE '%owner%';

SELECT '✅ owner_id constraint fixed - now nullable!' as status; 
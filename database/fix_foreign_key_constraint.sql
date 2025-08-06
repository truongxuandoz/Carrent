-- =============================================
-- FIX FOREIGN KEY CONSTRAINT FOR AUTH_ID
-- Run this FIRST to handle auth_id constraint
-- =============================================

-- 1. Check current foreign key constraints
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'users';

-- 2. Temporarily drop the foreign key constraint (if exists)
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'users' 
        AND constraint_name = 'users_auth_id_fkey'
        AND constraint_type = 'FOREIGN KEY'
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        ALTER TABLE public.users DROP CONSTRAINT users_auth_id_fkey;
        RAISE NOTICE 'Dropped foreign key constraint users_auth_id_fkey';
    ELSE
        RAISE NOTICE 'Foreign key constraint users_auth_id_fkey does not exist';
    END IF;
END $$;

-- 3. Alternative: Make auth_id nullable and use existing auth users
-- First, check if there are any existing auth users
SELECT 
    'EXISTING AUTH USERS' as info,
    COUNT(*) as auth_user_count
FROM auth.users;

-- 4. Get existing auth user IDs for sample data (if any)
SELECT 
    'AVAILABLE AUTH IDS' as info,
    id as auth_id,
    email,
    created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 5;

-- 5. Make auth_id nullable to allow sample data creation
ALTER TABLE public.users 
ALTER COLUMN auth_id DROP NOT NULL;

-- 6. Add a note about the constraint removal
SELECT 
    'CONSTRAINT STATUS' as status,
    'Foreign key constraint temporarily removed for sample data creation' as message,
    'You can re-add it later after creating sample data' as note; 
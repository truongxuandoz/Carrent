-- FIXED Admin Account Creation
-- Run this in Supabase SQL Editor

-- Option 1: Update existing user to admin (RECOMMENDED)
-- Replace with your actual email:

-- Option 2: Create admin with proper UUID
INSERT INTO public.users (
    id,
    auth_id,
    email,
    full_name,
    phone_number,
    role,
    is_active,
    account_status,
    email_confirmed_at,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    gen_random_uuid(),  -- Use proper UUID instead of string
    'admin@admin.com',
    'System Administrator',
    '+84987654321',
    'admin',
    true,
    'active',
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    role = 'admin',
    is_active = true,
    account_status = 'active',
    updated_at = NOW();

-- Verify admin accounts
SELECT 
    'Admin setup complete! ✅' as status,
    email,
    full_name,
    role,
    account_status,
    is_active
FROM public.users 
WHERE role = 'admin'
ORDER BY created_at DESC; 
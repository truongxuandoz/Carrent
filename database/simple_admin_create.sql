-- SIMPLE Admin Account Creation
-- Run this in Supabase SQL Editor

-- Option 1: Update existing user to admin (if you have an account)
-- Replace 'YOUR_EMAIL_HERE' with your actual email
-- UPDATE public.users 
-- SET role = 'admin', account_status = 'active', is_active = true 
-- WHERE email = 'YOUR_EMAIL_HERE';

-- Option 2: Create a test admin directly in public.users table
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
    'temp-admin-auth-id',
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

-- Verify the admin was created
SELECT 
    'Admin created successfully! ✅' as status,
    email,
    full_name,
    role,
    account_status
FROM public.users 
WHERE role = 'admin';

-- Show instructions
SELECT 
    'NEXT STEPS:' as instruction,
    '1. Register normally with email: admin@admin.com' as step1,
    '2. The role will already be set to admin' as step2,
    '3. Login and access Admin tab' as step3; 
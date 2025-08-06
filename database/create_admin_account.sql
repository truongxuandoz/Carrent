-- Create Admin Account
-- Run this in Supabase SQL Editor

-- Step 1: Create admin user in auth.users (if not exists)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'admin-uuid-1234-5678-9012-123456789012',
    'authenticated',
    'authenticated',
    'admin',
    crypt('admin', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Administrator"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (email) DO NOTHING;

-- Step 2: Create admin profile in public.users
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
    'admin-uuid-1234-5678-9012-123456789012',
    'admin-uuid-1234-5678-9012-123456789012',
    'admin',
    'Administrator',
    '+84123456789',
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

-- Step 3: Verify admin account was created
SELECT 
    'Admin account created successfully! 🎉' as message,
    u.email,
    u.role,
    u.is_active,
    u.account_status
FROM public.users u 
WHERE u.email = 'admin';

-- Step 4: Show all admin users
SELECT 
    email,
    full_name,
    role,
    is_active,
    account_status,
    created_at
FROM public.users 
WHERE role = 'admin' 
ORDER BY created_at DESC; 
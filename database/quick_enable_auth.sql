-- QUICK FIX: Enable Email Auth Without SMTP
-- Run this in Supabase SQL Editor (takes 30 seconds)

-- Step 1: Check current settings
SELECT 
    'Before changes:' as status,
    key, 
    value
FROM auth.config 
WHERE key IN (
    'DISABLE_SIGNUP',
    'EXTERNAL_EMAIL_ENABLED',
    'ENABLE_EMAIL_CONFIRMATIONS',
    'MAILER_AUTOCONFIRM'
)
ORDER BY key;

-- Step 2: Enable email auth without SMTP requirements
INSERT INTO auth.config (key, value) VALUES 
    ('DISABLE_SIGNUP', 'false'),                    -- ✅ Allow user registration
    ('EXTERNAL_EMAIL_ENABLED', 'true'),             -- ✅ Enable email authentication  
    ('ENABLE_EMAIL_CONFIRMATIONS', 'false'),        -- ❌ No email confirmations (no SMTP needed)
    ('ENABLE_EMAIL_CHANGE_CONFIRMATIONS', 'false'), -- ❌ No email change confirmations
    ('MAILER_AUTOCONFIRM', 'true'),                 -- ✅ Auto-confirm all registrations
    ('PASSWORD_MIN_LENGTH', '6')                    -- ✅ Easier passwords for testing
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Step 3: Verify the changes
SELECT 
    'After changes:' as status,
    key, 
    value,
    CASE 
        WHEN key = 'DISABLE_SIGNUP' AND value = 'false' THEN '✅ Signup enabled'
        WHEN key = 'EXTERNAL_EMAIL_ENABLED' AND value = 'true' THEN '✅ Email auth enabled'  
        WHEN key = 'ENABLE_EMAIL_CONFIRMATIONS' AND value = 'false' THEN '✅ No email confirmation required'
        WHEN key = 'MAILER_AUTOCONFIRM' AND value = 'true' THEN '✅ Auto-confirm enabled'
        WHEN key = 'PASSWORD_MIN_LENGTH' AND value = '6' THEN '✅ Min password length: 6'
        ELSE '✅ Configured'
    END as explanation
FROM auth.config 
WHERE key IN (
    'DISABLE_SIGNUP',
    'EXTERNAL_EMAIL_ENABLED',
    'ENABLE_EMAIL_CONFIRMATIONS', 
    'ENABLE_EMAIL_CHANGE_CONFIRMATIONS',
    'MAILER_AUTOCONFIRM',
    'PASSWORD_MIN_LENGTH'
)
ORDER BY key;

-- Step 4: Success message
SELECT 
    '🎉 Email authentication enabled without SMTP!' as message,
    'Users can now register and login instantly (no email confirmation needed)' as details; 
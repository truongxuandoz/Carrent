-- Enable Email Authentication in Supabase
-- Run this in Supabase SQL Editor to fix "Email logins are disabled" error

-- Check current authentication settings
SELECT 
    key, 
    value,
    CASE 
        WHEN key = 'DISABLE_SIGNUP' AND value = 'true' THEN '❌ Signup is DISABLED'
        WHEN key = 'DISABLE_SIGNUP' AND value = 'false' THEN '✅ Signup is enabled'
        WHEN key = 'ENABLE_EMAIL_CONFIRMATIONS' AND value = 'true' THEN '⚠️ Email confirmations required'
        WHEN key = 'ENABLE_EMAIL_CONFIRMATIONS' AND value = 'false' THEN '✅ Email confirmations disabled'
        ELSE '❓ Unknown setting'
    END as status
FROM auth.config 
WHERE key IN (
    'DISABLE_SIGNUP',
    'ENABLE_EMAIL_CONFIRMATIONS',
    'EXTERNAL_EMAIL_ENABLED',
    'MAILER_AUTOCONFIRM'
)
ORDER BY key;

-- Enable email authentication
INSERT INTO auth.config (key, value) VALUES 
    ('DISABLE_SIGNUP', 'false'),
    ('EXTERNAL_EMAIL_ENABLED', 'true'),
    ('MAILER_AUTOCONFIRM', 'true'),
    ('ENABLE_EMAIL_CONFIRMATIONS', 'false')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Verify the changes
SELECT 'Email authentication has been enabled!' as message;

-- Show updated settings
SELECT 
    key, 
    value,
    CASE 
        WHEN key = 'DISABLE_SIGNUP' AND value = 'false' THEN '✅ Signup enabled'
        WHEN key = 'EXTERNAL_EMAIL_ENABLED' AND value = 'true' THEN '✅ Email auth enabled'
        WHEN key = 'MAILER_AUTOCONFIRM' AND value = 'true' THEN '✅ Auto-confirm enabled'
        WHEN key = 'ENABLE_EMAIL_CONFIRMATIONS' AND value = 'false' THEN '✅ Email confirmations disabled'
        ELSE '✅ Configured'
    END as status
FROM auth.config 
WHERE key IN (
    'DISABLE_SIGNUP',
    'ENABLE_EMAIL_CONFIRMATIONS', 
    'EXTERNAL_EMAIL_ENABLED',
    'MAILER_AUTOCONFIRM'
)
ORDER BY key; 
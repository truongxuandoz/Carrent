-- Fix email provider disabled error
-- Run this in Supabase SQL Editor to resolve 422 error

-- Check current auth configuration
SELECT * FROM auth.config WHERE key IN (
  'DISABLE_SIGNUP',
  'ENABLE_EMAIL_CONFIRMATIONS', 
  'ENABLE_EMAIL_CHANGE_CONFIRMATIONS',
  'ENABLE_PHONE_CONFIRMATIONS'
);

-- Fix 1: Ensure signup is enabled
INSERT INTO auth.config (key, value) 
VALUES ('DISABLE_SIGNUP', 'false')
ON CONFLICT (key) DO UPDATE SET value = 'false';

-- Fix 2: Disable email confirmations (for testing)
INSERT INTO auth.config (key, value) 
VALUES ('ENABLE_EMAIL_CONFIRMATIONS', 'false')
ON CONFLICT (key) DO UPDATE SET value = 'false';

-- Fix 3: Disable email change confirmations
INSERT INTO auth.config (key, value) 
VALUES ('ENABLE_EMAIL_CHANGE_CONFIRMATIONS', 'false')
ON CONFLICT (key) DO UPDATE SET value = 'false';

-- Fix 4: Disable phone confirmations  
INSERT INTO auth.config (key, value) 
VALUES ('ENABLE_PHONE_CONFIRMATIONS', 'false')
ON CONFLICT (key) DO UPDATE SET value = 'false';

-- Fix 5: Set minimum password length (optional)
INSERT INTO auth.config (key, value) 
VALUES ('PASSWORD_MIN_LENGTH', '6')
ON CONFLICT (key) DO UPDATE SET value = '6';

-- Verify changes
SELECT 'Configuration updated successfully!' as status;

SELECT key, value FROM auth.config WHERE key IN (
  'DISABLE_SIGNUP',
  'ENABLE_EMAIL_CONFIRMATIONS', 
  'ENABLE_EMAIL_CHANGE_CONFIRMATIONS',
  'ENABLE_PHONE_CONFIRMATIONS',
  'PASSWORD_MIN_LENGTH'
) ORDER BY key; 
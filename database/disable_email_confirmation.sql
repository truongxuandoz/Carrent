-- Disable email confirmation for testing
-- Run this in Supabase SQL Editor to make registration easier

-- This allows users to register and login immediately without email confirmation

-- Note: In Supabase Dashboard, you should also:
-- 1. Go to Authentication > Settings
-- 2. Set "Enable email confirmations" to OFF
-- 3. Set "Enable email change confirmations" to OFF  
-- 4. Optionally set "Minimum password length" to 6 for easier testing

-- For production, you should re-enable email confirmations for security

SELECT 'Email confirmation settings should be disabled in Supabase Dashboard > Authentication > Settings' as instruction; 
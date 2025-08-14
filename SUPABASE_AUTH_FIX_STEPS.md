# 🚨 FIX SUPABASE AUTH 400 ERROR - COMPLETE GUIDE

## ❌ PROBLEM
Error 400 when trying to login means NO USERS exist in `auth.users` table or email confirmation is blocking login.

## 🔧 SOLUTION STEPS

### STEP 1: Fix Supabase Auth Configuration 

**Open Supabase Dashboard → Authentication → Settings:**

1. **Email Confirmation Settings:**
   - ✅ **Disable "Enable email confirmations"** (for development)
   - OR set **Confirm email** to OFF

2. **Email Auth Settings:**
   - ✅ **Enable email-based logins** should be ON
   - ✅ **Allow new users to sign up** should be ON

3. **Site URL Settings:**
   - Set to your app URL (e.g., `http://localhost:8081` for Expo)

### STEP 2: Run SQL Script to Create Users

Copy and paste this script in **Supabase SQL Editor:**

```sql
-- Content from: database/fix_auth_400_error.sql
```

### STEP 3: Test Login Credentials

After running the script, try these accounts:

| Email | Password | Role |
|-------|----------|------|
| `admin@admin.com` | `admin123` | Admin |
| `test@test.com` | `test123` | Customer |

### STEP 4: Restart Your App

```bash
# Stop current app (Ctrl+C)
# Clear cache and restart:
npx expo start --clear
```

## 🔍 TROUBLESHOOTING

### If Still Getting 400 Error:

1. **Check Supabase Project URL/Keys:**
   ```typescript
   // In src/config/supabase.ts
   const supabaseUrl = 'https://your-project.supabase.co'
   const supabaseKey = 'your-anon-key'
   ```

2. **Check Email Confirmation in Dashboard:**
   - Go to Authentication → Users
   - Look for created users
   - Check if `email_confirmed_at` is set

3. **Manual Email Confirmation:**
   ```sql
   UPDATE auth.users 
   SET email_confirmed_at = NOW() 
   WHERE email IN ('admin@admin.com', 'test@test.com');
   ```

## 🚀 EXPECTED RESULT

- ✅ Users exist in `auth.users` table
- ✅ Email confirmation disabled or bypassed  
- ✅ Login returns 200 instead of 400
- ✅ App shows user profile after login

## 📞 CONTACT FOR HELP

If still not working, provide:
1. Screenshot of Supabase Auth settings
2. Result from the SQL script verification 
3. Any new console errors 
# 🚨 Fix Lỗi 422: Email Logins Are Disabled

## ❌ Lỗi hiện tại:
```
Status: 422
Message: Email logins are disabled
Path: /auth/v1/token, /auth/v1/signup
```

## 🔍 Nguyên nhân:
Supabase Authentication có thể bị disable email login do:
1. **EXTERNAL_EMAIL_ENABLED** = false
2. **DISABLE_SIGNUP** = true  
3. Email provider chưa được cấu hình

## ✅ Giải pháp:

### 🎯 Method 1: Supabase Dashboard (Recommended)

#### Step 1: Vào Authentication Settings
```
1. Supabase Dashboard → Your Project
2. Authentication → Settings
3. Scroll down to "Email Auth"
```

#### Step 2: Enable Email Authentication
```
✅ Enable email confirmations: OFF (for testing)
✅ Enable email change confirmations: OFF  
✅ Allow email signups: ON
✅ Enable phone confirmations: OFF
```

#### Step 3: Configure Email Provider (Optional)
```
Option A: Use Supabase built-in (free tier)
- Leave SMTP settings empty
- Supabase will handle emails

Option B: Configure custom SMTP
- Gmail, SendGrid, Mailgun, etc.
- Fill in SMTP settings
```

#### Step 4: Save Settings
```
1. Scroll down and click "Save"
2. Wait 1-2 minutes for changes to apply
```

### 🛠️ Method 2: SQL Fix (Advanced)

#### Run in Supabase SQL Editor:
```sql
-- Copy paste from database/enable_email_auth.sql
INSERT INTO auth.config (key, value) VALUES 
    ('DISABLE_SIGNUP', 'false'),
    ('EXTERNAL_EMAIL_ENABLED', 'true'),
    ('MAILER_AUTOCONFIRM', 'true'),
    ('ENABLE_EMAIL_CONFIRMATIONS', 'false')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

## 🧪 Test Authentication:

### Option 1: Use App Debug Component
```
1. Login screen → "🔍 Auth State Debug"
2. Click "🚀 Create Test Account" 
3. Will create account + show credentials
4. Use credentials to login normally
```

### Option 2: Manual Test
```
1. Register new account in app
2. Should see success message
3. Login with same credentials
4. Should navigate to main app
```

### Option 3: Supabase Dashboard Test
```
1. Authentication → Users
2. Click "Invite a user" 
3. Add email and temp password
4. Try login in app
```

## ✅ Expected Results:

### After Fix:
```
✅ POST /auth/v1/signup → 200 (not 422)
✅ POST /auth/v1/token → 200 (not 422)  
✅ Registration works
✅ Login works
✅ User appears in Supabase Dashboard
```

### Auth State Debug Shows:
```
Context State:
- Loading: No
- Authenticated: Yes  
- Session: Yes
- User: Test User

Supabase State:  
- Auth User: test@example.com
- Profile: Test User
```

## 🔧 Troubleshooting:

### Still Getting 422?
```
1. Clear browser cache/app data
2. Wait 5 minutes after config changes
3. Check Supabase project is not paused
4. Verify API keys are correct
```

### Auth Works But No Profile?
```
1. Click "Create Missing Profile" in debug
2. Or run database/simple_schema.sql
3. Check RLS policies allow inserts
```

### Can't Access Auth Settings?
```
1. Check you're project owner/admin
2. Try incognito browser mode
3. Check internet connection
```

## 🎯 Quick Test Commands:

### In Auth Debug Component:
```
1. "Refresh State" → Check current status
2. "🚀 Create Test Account" → Auto-create working account
3. "Test Login" → Try login with test credentials  
4. "Force Logout" → Reset if stuck
```

### Manual Verification:
```
curl -X POST 'https://YOUR_PROJECT.supabase.co/auth/v1/signup' \
-H 'apikey: YOUR_ANON_KEY' \
-H 'Content-Type: application/json' \
-d '{"email":"test@test.com","password":"password123"}'
```

## 🚀 After Fix Checklist:

- [ ] 422 errors resolved
- [ ] Registration works in app  
- [ ] Login works in app
- [ ] User data shows in Supabase Dashboard
- [ ] Notifications created properly
- [ ] Remove debug components (optional)

**Fix email authentication và test ngay! 🎉** 
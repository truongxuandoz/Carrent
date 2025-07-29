# 🚨 Fix Lỗi 422: Email Provider Disabled

## ❌ Lỗi hiện tại:
```
Status: 422
Error Code: email_provider_disabled
Path: /auth/v1/signup
```

## ✅ Giải pháp:

### Bước 1: Vào Supabase Dashboard
1. Mở **Supabase Dashboard** → Your Project
2. Vào **Authentication** → **Settings**

### Bước 2: Disable Email Confirmations  
1. Tìm mục **"Email Auth"**
2. **TẮTT** các tùy chọn sau:
   - ❌ **Enable email confirmations** → Set to **OFF**
   - ❌ **Enable email change confirmations** → Set to **OFF**
   - ❌ **Enable phone confirmations** → Set to **OFF**

### Bước 3: Configure Email Provider (Optional)
Nếu muốn giữ email confirmations:
1. Vào **Authentication** → **Settings** → **SMTP Settings**
2. Setup email provider (Gmail, SendGrid, etc.)
3. Hoặc dùng built-in Supabase provider

### Bước 4: Verify Settings
1. Scroll xuống và click **Save**
2. Đợi 1-2 phút để settings được apply

## 🧪 Test Registration:

### Cách 1: Dùng Auth Debugger
1. Mở app → Home → Auth Debugger
2. Click **"Debug Registration"**
3. Xem kết quả trong status box

### Cách 2: Dùng App Registration
1. Vào Register screen
2. Điền form và submit
3. Không còn lỗi 422

## 🔧 Alternative Fix (SQL):

Nếu vẫn lỗi, chạy SQL này trong Supabase:

```sql
-- Disable email confirmation requirement
UPDATE auth.config 
SET value = 'false' 
WHERE key = 'DISABLE_SIGNUP';

-- Allow signup without email confirmation
UPDATE auth.config 
SET value = 'false' 
WHERE key = 'ENABLE_EMAIL_CONFIRMATIONS';
```

## ✅ Expected Result:

Sau khi fix:
- ✅ Registration hoạt động không lỗi 422
- ✅ User tạo ngay lập tức without email confirmation
- ✅ Profile và notifications được tạo tự động

## 🎯 Next Steps:

1. Fix email settings theo hướng dẫn trên
2. Test registration lại
3. Nếu thành công → Remove auth debugger component
4. Setup proper email provider cho production

**Hãy làm theo các bước trên và test lại! 🚀** 
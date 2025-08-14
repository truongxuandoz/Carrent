# 🔧 ADMIN LOGIN FIX

## ❌ Vấn đề 
- Đăng nhập admin@admin.com nhưng không có quyền admin
- Database query timeout
- Role fallback về customer

## ✅ Giải pháp

### Bước 1: Chạy SQL Fix
1. Mở **Supabase Dashboard** → **SQL Editor**
2. Chạy file: `database/fix_admin_login_issue.sql`
3. Kiểm tra output có hiển thị admin user

### Bước 2: Test Admin Login
1. **Nếu có auth_email trong kết quả SQL:**
   - Đăng nhập trực tiếp với `admin@admin.com` / password của bạn
   - App sẽ tự động nhận diện admin role

2. **Nếu không có auth_email:**
   - Đăng ký account mới với email `admin@admin.com`
   - Role sẽ tự động update thành admin
   - Đăng nhập lại để có quyền admin

### Bước 3: Verify Admin Access
```typescript
// Check trong Console log khi đăng nhập:
✅ Known admin email detected, granting admin role: admin@admin.com
✅ Admin role confirmed from database
✅ User profile loaded from database: System Administrator role: admin
```

## 🚀 Code Improvements Đã Thêm

### 1. Multiple Query Strategies
- Query bằng `auth_id`, `id`, và `email`
- Timeout ngắn hơn (2-3s thay vì 6s)
- Fallback robust hơn

### 2. Known Admin Email Detection
```typescript
const isKnownAdminEmail = authUser.email && (
  authUser.email.includes('admin') || 
  authUser.email === 'admin@admin.com' ||
  authUser.email === 'admin@carrent.com'
);
```

### 3. Better Role Preservation
- Preserve admin role trong refresh
- Respect cached admin role
- Auto-sync role to metadata

## 🧪 Test Cases

1. **Fresh Install:**
   - Chạy SQL script → Register admin@admin.com → Login → Should have admin access

2. **Existing User:**
   - Update existing user role to admin → Login → Should have admin access

3. **Database Timeout:**
   - Disconnect internet → Login admin email → Should fallback to admin role

## 📝 Log để Debug

Khi đăng nhập, check Console log:
```
🔍 [INITIAL] Fetching user profile for: admin@admin.com
✅ Profile found via email query: admin@admin.com role: admin
✅ User profile loaded from database: System Administrator role: admin
🔍 User role check: admin
```

Nếu vẫn thấy `customer role`, có thể:
1. Database chưa có admin user → Chạy lại SQL
2. RLS policy block → Check Supabase Auth settings
3. Cache cũ → Clear app data và đăng nhập lại 
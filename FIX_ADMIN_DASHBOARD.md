# 🔧 Fix Admin Dashboard Issues - Complete Guide

## 🎯 Vấn đề cần fix:
1. ❌ **Admin Dashboard không có dữ liệu thật** (fake data)
2. ❌ **Admin button biến mất** từ navigation
3. ❌ **User Management không hiển thị users** có trong database
4. ❌ **Filter buttons bị lỗi hiển thị**

## 📋 **BƯỚC 1: Chạy SQL Scripts (QUAN TRỌNG)**

### 1.1 Tạo Sample Data
Chạy file `database/create_sample_data.sql` trong **Supabase SQL Editor**:

```sql
-- Copy toàn bộ content từ database/create_sample_data.sql và paste vào Supabase
-- Script này sẽ tạo:
-- ✅ 8 bikes thật với thông tin chi tiết
-- ✅ 5 bookings thật với payment history  
-- ✅ Sample users và notifications
-- ✅ Tính toán revenue và stats thật
```

### 1.2 Fix Admin Access
Chạy file `database/fix_admin_access.sql` trong **Supabase SQL Editor**:

```sql
-- Copy toàn bộ content từ database/fix_admin_access.sql và paste vào Supabase
-- Script này sẽ:
-- ✅ Update user hiện tại thành admin role
-- ✅ Tạo thêm sample users cho testing
-- ✅ Verify admin access đúng cách
```

## 📱 **BƯỚC 2: Restart App và Debug**

### 2.1 Clear Cache và Restart
```bash
# Stop current app
# Clear cache
npx expo start --clear

# Or force restart
npx expo start --reset-cache
```

### 2.2 Check Debug Info
1. **Mở app** → **Home Screen**
2. **Scroll down** → Tìm **"Admin Access Debug"** box (chỉ hiện trong development)
3. **Click "Show Full Debug Info"** → Kiểm tra:
   - ✅ `isAuthenticated: true`
   - ✅ `userRole: "admin"`
   - ✅ `Admin Access: GRANTED`

### 2.3 Nếu vẫn không thấy Admin tab:
```javascript
// Check console logs trong DevTools:
// 🔍 User role check: admin isAdmin: true
// Nếu vẫn thấy role: "customer" → User chưa được update đúng
```

## 🔧 **BƯỚC 3: Force Update User Role**

Nếu admin tab vẫn không hiện, chạy SQL này:

```sql
-- Update user hiện tại thành admin (thay email của bạn)
UPDATE public.users 
SET role = 'admin', account_status = 'active', is_active = true
WHERE email = 'YOUR_EMAIL_HERE';

-- Kiểm tra
SELECT email, role, is_active FROM public.users WHERE role = 'admin';
```

## 📊 **BƯỚC 4: Verify Data**

### 4.1 Check Database có data:
```sql
-- Verify sample data đã được tạo
SELECT 
    (SELECT COUNT(*) FROM public.bikes) as bikes_count,
    (SELECT COUNT(*) FROM public.bookings) as bookings_count,  
    (SELECT COUNT(*) FROM public.users) as users_count,
    (SELECT COUNT(*) FROM public.users WHERE role = 'admin') as admin_count;
```

### 4.2 Check Admin Dashboard:
1. **Login** với admin account
2. **Mở Admin tab** (bottom navigation)
3. **Check Dashboard stats:**
   - ✅ Total Users > 0
   - ✅ Total Bikes = 8  
   - ✅ Revenue numbers thật
   - ✅ Status charts có data

## 🎨 **BƯỚC 5: Test All Features**

### 5.1 Dashboard Tab:
- ✅ **Stats cards** hiển thị số liệu thật
- ✅ **Charts** có data from database
- ✅ **Quick actions** hoạt động

### 5.2 Users Tab:
- ✅ **User list** hiển thị users từ database
- ✅ **Search** hoạt động
- ✅ **User details** modal
- ✅ **Status update** (activate/suspend)

### 5.3 Bikes Tab:
- ✅ **Bike list** hiển thị 8 bikes
- ✅ **Status filters** (All, Available, Rented, Maintenance)
- ✅ **Add/Edit bike** forms
- ✅ **Delete bike** functionality

### 5.4 Bookings Tab:
- ✅ **Booking list** với real bookings
- ✅ **Status updates**
- ✅ **Revenue calculations**

### 5.5 Reports Tab:
- ✅ **Revenue charts** với real data
- ✅ **Popular bikes** analytics
- ✅ **Period selector** hoạt động

## 🚨 **Troubleshooting**

### Admin tab vẫn không hiện:
1. **Force logout/login** lại
2. **Check email** trong database có role admin chưa
3. **Clear app cache** và restart

### User Management trống:
1. **Check console logs** xem có error không
2. **Verify RLS policies** không block query
3. **Run fix_admin_access.sql** lại

### Dashboard stats = 0:
1. **Run create_sample_data.sql** lại
2. **Check database** có data chưa
3. **Verify adminService** không có error

## ✅ **Expected Results**

Sau khi fix xong:

### 🎯 **Dashboard Homepage:**
```
📊 Total Users: 4+
🚗 Total Bikes: 8  
📈 Today Revenue: 360,000đ+
💰 Monthly Revenue: 1,200,000đ+
```

### 🎯 **Bike Management:**
```
🏍️ Available: 5 bikes
🔄 Rented: 2 bikes  
🔧 Maintenance: 1 bike
📊 Real revenue per bike
```

### 🎯 **User Management:**
```
👥 Customer accounts với booking history
📧 Real emails và phone numbers
💰 Total spent calculations thật
```

### 🎯 **Analytics:**
```
📈 Revenue trend charts
🚗 Popular bikes ranking  
📊 Real booking statistics
```

---

## 🚀 **Quick Verification Commands**

```bash
# 1. Check if sample data exists
# In Supabase SQL Editor:
SELECT COUNT(*) FROM bikes; -- Should be 8
SELECT COUNT(*) FROM bookings; -- Should be 5
SELECT COUNT(*) FROM users WHERE role = 'admin'; -- Should be 1+

# 2. Restart app
npx expo start --clear

# 3. Login và check Admin tab xuất hiện
```

**Sau khi follow guide này → Admin Dashboard sẽ có full real data! 🎉** 
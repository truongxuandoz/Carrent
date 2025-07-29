# 🚀 Quick Supabase Setup

## Bước 1: Tạo Database Schema

1. Vào **Supabase Dashboard** → **SQL Editor**
2. Copy toàn bộ nội dung file `database/simple_schema.sql`
3. Paste vào SQL Editor và **RUN**
4. Thấy message: `"Database schema created successfully! 🎉"`

## Bước 2: Test Connection

1. Mở app → Home screen
2. Sẽ thấy **"🔗 Supabase Connection Test"** component
3. Nhấn **"Test Connection"** → Phải thấy `✅ Connected!`
4. Nhấn **"Check Tables"** → Phải thấy:
   ```
   Tables:
   users: ✅ Exists
   notifications: ✅ Exists
   ```

## Bước 3: Test Registration

1. Nhấn **"Test SignUp"** trong test component
2. Sẽ tạo account test tự động
3. Check Supabase Dashboard:
   - **Authentication** → **Users** → Thấy user mới
   - **Table Editor** → **users** → Thấy profile mới

## Bước 4: Test App Registration

1. Trong app → Đi tới **Register screen**
2. Đăng ký account mới
3. Check trong Supabase:
   - **Authentication** → **Users** → Thấy user mới
   - **Table Editor** → **users** → Thấy profile
   - **Table Editor** → **notifications** → Thấy welcome notification

## Bước 5: Test Login + Notifications

1. Login bằng account vừa tạo
2. Vào **Notifications tab**
3. Sẽ thấy:
   - 🎉 Welcome notification
   - 👋 Login notification

## 🔧 Troubleshooting

### ❌ Connection Error
- Check lại Supabase URL và API Key trong `src/config/supabase.ts`
- Đảm bảo project đang active

### ❌ Table Missing  
- Chạy lại `database/simple_schema.sql`
- Check RLS policies được enable

### ❌ Registration Failed
- Check email format
- Check RLS policies
- Xem console logs

### ❌ No Notifications
- Check user có profile trong `users` table
- Check RLS policies cho `notifications` table

## 📱 Ready to Use Features

Sau khi setup xong:

✅ **Authentication**: Register, Login, Logout  
✅ **User Profiles**: Auto-created with registration  
✅ **Notifications**: Welcome + Login notifications  
✅ **Real-time**: Notifications update live  
✅ **Database**: Connected to Supabase PostgreSQL  

## 🎯 Next Steps

1. Remove test component từ HomeScreen
2. Add thêm features: Bookings, Bikes, Reviews
3. Setup production authentication settings

**Happy coding! 🚀** 
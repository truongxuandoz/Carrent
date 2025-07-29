# 🚀 Hướng dẫn Setup Supabase cho CarRent

## 📋 Bước 1: Tạo Project Supabase

1. **Truy cập Supabase**: Đi đến [https://supabase.com](https://supabase.com)
2. **Đăng ký/Đăng nhập**: Tạo tài khoản hoặc đăng nhập
3. **Tạo project mới**:
   - Click "New Project"
   - Chọn Organization (hoặc tạo mới)
   - Nhập tên project: `carrent-app`
   - Chọn Database Password (lưu lại password này!)
   - Chọn Region: `Southeast Asia (Singapore)` (gần Việt Nam nhất)
   - Click "Create new project"

## 🗄️ Bước 2: Tạo Database Schema

1. **Vào SQL Editor**:
   - Trong dashboard Supabase, click "SQL Editor"
   - Click "New query"

2. **Copy và chạy schema**:
   - Copy toàn bộ nội dung file `database/schema.sql`
   - Paste vào SQL Editor
   - Click "Run" để tạo database schema
   
3. **Fix Authentication Issues**:
   - Copy nội dung file `database/auth_setup.sql`
   - Paste vào SQL Editor (new query)
   - Click "Run" để fix authentication

## 🔐 Bước 3: Cấu hình Authentication

1. **Vào Authentication Settings**:
   - Click "Authentication" → "Settings"
   - Trong tab "General":
     - **Site URL**: `http://localhost:8081` (cho development)
     - **Redirect URLs**: Thêm `http://localhost:8081`

2. **Cấu hình Email Templates** (tùy chọn):
   - Trong tab "Email Templates"
   - Có thể customize email confirm, reset password

## 🔑 Bước 4: Lấy API Keys

1. **Vào Settings**:
   - Click "Settings" → "API"

2. **Copy các thông tin quan trọng**:
   ```
   Project URL: https://xxxxxxxxxxx.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## ⚙️ Bước 5: Cấu hình Project

1. **Cập nhật file `src/config/supabase.ts`**:
   ```typescript
   const supabaseUrl = 'https://xxxxxxxxxxx.supabase.co'; // Thay YOUR_PROJECT_URL
   const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Thay YOUR_ANON_KEY
   ```

2. **Tạo file `.env` (tùy chọn)**:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## 🧪 Bước 6: Test Connection

1. **Kiểm tra kết nối**:
   ```typescript
   // Trong src/config/supabase.ts
   console.log('Supabase configured:', isSupabaseConfigured());
   ```

2. **Test authentication**:
   - Chạy app: `npx expo start --tunnel`
   - Thử đăng ký tài khoản mới
   - Kiểm tra email xác nhận (nếu bật)

## 📊 Bước 7: Thêm Sample Data (Tùy chọn)

1. **Tạo admin user**:
   - Đăng ký tài khoản qua app
   - Vào Table Editor → users
   - Tìm user vừa tạo và update `role = 'admin'`

2. **Thêm sample bikes**:
   ```sql
   INSERT INTO bikes (name, brand, model, year, type, fuel_type, transmission, color, license_plate, description, price_per_day, price_per_hour, deposit, address, owner_id, is_approved) VALUES 
   ('Honda Vision 2023', 'Honda', 'Vision', 2023, 'scooter', 'gasoline', 'automatic', 'Đỏ', '29A1-12345', 'Xe mới, tiết kiệm xăng', 150000, 15000, 1000000, '123 Nguyễn Huệ, Q1, TP.HCM', 'YOUR_USER_ID', true);
   ```

## 🔔 Bước 8: Real-time Subscriptions

1. **Enable Realtime**:
   - Vào "Database" → "Replication"
   - Bật realtime cho tables: `bookings`, `notifications`

2. **Test realtime**:
   ```typescript
   // Trong NotificationsScreen
   useEffect(() => {
     const subscription = supabase
       .channel('public:notifications')
       .on('postgres_changes', 
         { event: '*', schema: 'public', table: 'notifications' },
         (payload) => console.log('New notification:', payload)
       )
       .subscribe();
       
     return () => subscription.unsubscribe();
   }, []);
   ```

## 🗺️ Bước 9: PostGIS Setup (Cho Location Features)

1. **Enable PostGIS Extension**:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "postgis";
   ```

2. **Tạo function cho location search**:
   ```sql
   CREATE OR REPLACE FUNCTION bikes_within_radius(lat float, lng float, radius_km float)
   RETURNS TABLE(id UUID, distance_km float) 
   LANGUAGE sql
   AS $$
     SELECT id, ST_Distance(location, ST_Point(lng, lat)::geography) / 1000 as distance_km
     FROM bikes 
     WHERE ST_DWithin(location, ST_Point(lng, lat)::geography, radius_km * 1000)
     AND is_available = true 
     AND is_approved = true
     ORDER BY distance_km;
   $$;
   ```

## 🔒 Bước 10: Row Level Security (RLS) Policies

RLS policies đã được tạo trong schema. Kiểm tra trong "Authentication" → "Policies":

- ✅ Users can only see own profile
- ✅ Customers can only see own bookings  
- ✅ Admins can see all data
- ✅ Anyone can see approved bikes

## 🚀 Bước 11: Production Setup

1. **Update Site URL cho production**:
   - Trong Authentication Settings
   - Thay `http://localhost:8081` bằng production URL

2. **Environment Variables**:
   ```bash
   # Production
   EXPO_PUBLIC_SUPABASE_URL=https://production.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=production_key
   ```

3. **Database Backup**:
   - Vào "Settings" → "Database"
   - Enable automatic backups

## 🎯 Features Đã Có Sẵn

### ✅ Authentication
- User registration/login
- Email confirmation (tùy chọn)
- Password reset
- Session persistence

### ✅ Database Tables
- `users` - User profiles và roles
- `bikes` - Bike listings với geolocation
- `bookings` - Booking management
- `reviews` - Rating và reviews
- `notifications` - Real-time notifications
- `emergency_reports` - Emergency reports

### ✅ Row Level Security
- Customers chỉ thấy data của mình
- Admins có quyền truy cập toàn bộ
- Bikes được filter theo availability

### ✅ Real-time Features
- Booking status updates
- Notifications
- Auto-generated notifications khi booking status thay đổi

### ✅ Business Logic
- Auto update bike rating khi có review mới
- Auto tạo notifications khi booking status thay đổi
- Availability checking cho bookings
- Updated_at triggers cho tất cả tables

## 🔧 Troubleshooting

### Lỗi thường gặp:

1. **"Invalid JWT"**:
   - Kiểm tra lại API keys trong `supabase.ts`
   - Đảm bảo dùng đúng anon key (không phải service_role key)

2. **"Row level security policy violation"**:
   - Kiểm tra user đã login chưa
   - Verify RLS policies trong Supabase dashboard

3. **Connection timeout**:
   - Kiểm tra network connection
   - Thử dùng `--tunnel` với expo start

4. **Schema errors**:
   - Kiểm tra lại SQL syntax
   - Verify extensions (uuid-ossp, postgis) đã enable

## 📞 Support

Nếu gặp vấn đề:
1. Check Supabase Logs trong dashboard
2. Kiểm tra browser console/app debugger
3. Xem Supabase documentation: [https://supabase.com/docs](https://supabase.com/docs)

**Supabase setup hoàn tất! 🎉 Giờ bạn có thể chạy app với database thật.** 
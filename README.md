# 🏍️ CarRent - Ứng dụng thuê xe máy

Ứng dụng mobile React Native cho thuê xe máy với hỗ trợ đa ngôn ngữ (Tiếng Việt 🇻🇳 và Tiếng Anh 🇺🇸).

## 📱 Tính năng chính

### 👥 Hai vai trò người dùng:
- **Khách hàng (Customer)**: Tìm kiếm, đặt và thuê xe máy
- **Quản trị viên (Admin)**: Quản lý xe, người dùng và đơn đặt xe

### 🔧 Tính năng cho Khách hàng:
- ✅ Đăng ký/Đăng nhập tài khoản
- 🔍 Tìm kiếm xe theo vị trí, loại xe, giá, hãng xe
- 📱 Xem chi tiết xe: hình ảnh, mô tả, đánh giá, giá thuê
- 💳 Đặt xe và thanh toán online (VNPay, Momo, ZaloPay)
- 🚚 Tùy chọn giao xe tận nơi hoặc nhận tại điểm cố định
- 📊 Theo dõi lịch sử thuê xe và hóa đơn
- ⭐ Đánh giá xe sau khi sử dụng
- 📱 Mở khóa xe bằng mã QR hoặc smart lock
- 🚨 Báo cáo khẩn cấp khi có sự cố

### 🛠️ Tính năng cho Admin:
- 👥 Quản lý tài khoản người dùng
- 🏍️ Quản lý thông tin xe và duyệt xe mới
- 📋 Theo dõi các đơn thuê xe
- 📈 Thống kê doanh thu và hiệu suất
- 📢 Gửi thông báo hệ thống

### 🌐 Hỗ trợ đa ngôn ngữ:
- **Tiếng Việt** (vi) 🇻🇳
- **Tiếng Anh** (en) 🇺🇸
- Tự động phát hiện ngôn ngữ thiết bị
- Cho phép người dùng thay đổi ngôn ngữ trong cài đặt

## 🛠️ Công nghệ sử dụng

- **Frontend**: React Native với Expo
- **Navigation**: React Navigation v6
- **UI Components**: React Native Paper, React Native Elements
- **Đa ngôn ngữ**: react-i18next
- **State Management**: React Context API
- **Storage**: AsyncStorage
- **Maps**: React Native Maps
- **Icons**: Expo Vector Icons
- **Animations**: React Native Reanimated
- **TypeScript**: Full TypeScript support

## 📋 Yêu cầu hệ thống

- **Node.js**: ≥ 16.0.0
- **npm** hoặc **yarn**
- **Expo CLI**: `npm install -g @expo/cli`
- **React Native CLI** (tùy chọn)
- **Android Studio** (cho Android development)
- **Xcode** (cho iOS development - chỉ trên macOS)

## 🚀 Cài đặt và chạy dự án

### 1. Clone repository
```bash
git clone https://github.com/yourusername/carrent-app.git
cd carrent-app
```

### 2. Cài đặt Node.js
Tải và cài đặt Node.js từ [nodejs.org](https://nodejs.org/)

### 3. Cài đặt Expo CLI
```bash
npm install -g @expo/cli
```

### 4. Cài đặt dependencies
```bash
npm install
# hoặc
yarn install
```

### 5. Chạy ứng dụng
```bash
# Chạy trên Expo
npm start
# hoặc
expo start

# Chạy trên Android
npm run android
# hoặc
expo start --android

# Chạy trên iOS
npm run ios
# hoặc
expo start --ios

# Chạy trên web
npm run web
# hoặc
expo start --web
```

### 6. Cài đặt Expo Go app trên điện thoại
- **Android**: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iOS**: [App Store](https://apps.apple.com/app/expo-go/id982107779)

Sau đó quét QR code hiển thị trong terminal hoặc browser để chạy app trên điện thoại.

## 📁 Cấu trúc dự án

```
CarRent/
├── App.tsx                 # Entry point chính
├── app.json               # Cấu hình Expo
├── package.json           # Dependencies và scripts
├── src/
│   ├── components/        # Các component tái sử dụng
│   │   └── TabBarIcon.tsx
│   ├── context/          # React Context
│   │   └── AuthContext.tsx
│   ├── i18n/             # Cấu hình đa ngôn ngữ
│   │   └── index.ts
│   ├── locales/          # File ngôn ngữ
│   │   ├── vi.json       # Tiếng Việt
│   │   └── en.json       # Tiếng Anh
│   ├── screens/          # Các màn hình
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   ├── BookingsScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── AdminScreen.tsx
│   │   ├── BikeDetailScreen.tsx
│   │   ├── BookingDetailScreen.tsx
│   │   └── SettingsScreen.tsx
│   └── types/            # TypeScript types
│       └── index.ts
└── assets/               # Hình ảnh, icons, fonts
```

## 🎯 Tính năng sẽ phát triển

### Phase 1 (Hiện tại)
- ✅ Cấu trúc dự án cơ bản
- ✅ Authentication system
- ✅ Đa ngôn ngữ (i18n)
- ✅ Navigation
- ✅ UI cơ bản

### Phase 2 (Tiếp theo)
- 🔄 Tích hợp Backend API
- 🔄 Tìm kiếm và lọc xe
- 🔄 Chi tiết xe với hình ảnh
- 🔄 Hệ thống đặt xe
- 🔄 Tích hợp Google Maps
- 🔄 Camera và QR Scanner

### Phase 3 (Tương lai)
- 🔄 Tích hợp thanh toán (VNPay, Momo)
- 🔄 Push notifications
- 🔄 Chat/messaging
- 🔄 Rating và review system
- 🔄 Admin dashboard
- 🔄 Analytics và reporting

## 🔧 Cấu hình Backend

Dự án này cần backend API để hoạt động đầy đủ. Bạn có thể sử dụng:

### Option 1: Node.js + Express
```bash
# Tạo backend folder
mkdir carrent-backend
cd carrent-backend
npm init -y
npm install express cors helmet morgan dotenv
npm install -D nodemon @types/node typescript
```

### Option 2: Django (Python)
```bash
pip install django djangorestframework django-cors-headers
django-admin startproject carrent_backend
```

### Option 3: Spring Boot (Java)
Sử dụng Spring Initializr để tạo project với:
- Spring Web
- Spring Data JPA
- Spring Security
- MySQL Driver

## 🔐 Environment Variables

Tạo file `.env` trong root directory:

```env
# API Configuration
API_BASE_URL=http://localhost:3000/api
API_TIMEOUT=10000

# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Payment Gateways
VNPAY_MERCHANT_ID=your_vnpay_merchant_id
VNPAY_SECRET_KEY=your_vnpay_secret_key
MOMO_PARTNER_CODE=your_momo_partner_code
MOMO_ACCESS_KEY=your_momo_access_key

# Firebase (for notifications)
FIREBASE_CONFIG=your_firebase_config
```

## 📱 Testing

```bash
# Chạy tests
npm test

# Test với coverage
npm run test:coverage

# E2E testing với Detox
npm run test:e2e
```

## 🚀 Build và Deploy

### Build cho production
```bash
# Build cho Android
expo build:android

# Build cho iOS
expo build:ios

# EAS Build (recommended)
eas build --platform android
eas build --platform ios
```

### Deploy
```bash
# Publish to Expo
expo publish

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

## 🤝 Contributing

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Dự án này sử dụng MIT License. Xem file `LICENSE` để biết thêm chi tiết.

## 📞 Liên hệ

- **Email**: contact@carrent.app
- **Website**: https://carrent.app
- **Documentation**: https://docs.carrent.app

## 🙏 Credits

- **UI Inspiration**: Various bike rental apps
- **Icons**: Expo Vector Icons
- **Maps**: Google Maps Platform
- **Payments**: VNPay, MoMo API

---

**Made with ❤️ by CarRent Team** 
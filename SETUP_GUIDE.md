# 🚀 Hướng dẫn cài đặt chi tiết - CarRent App

## 📋 Chuẩn bị môi trường phát triển

### 1. Cài đặt Node.js

#### Windows:
1. Truy cập [nodejs.org](https://nodejs.org/)
2. Tải phiên bản LTS (Long Term Support) - khuyến nghị phiên bản 18.x trở lên
3. Chạy file `.msi` đã tải và làm theo hướng dẫn
4. Mở Command Prompt hoặc PowerShell và kiểm tra:
```bash
node --version
npm --version
```

#### macOS:
1. **Option 1**: Tải từ [nodejs.org](https://nodejs.org/) và cài đặt file `.pkg`
2. **Option 2**: Sử dụng Homebrew:
```bash
# Cài đặt Homebrew nếu chưa có
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Cài đặt Node.js
brew install node
```

#### Linux (Ubuntu/Debian):
```bash
# Cập nhật package list
sudo apt update

# Cài đặt Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Hoặc sử dụng snap
sudo snap install node --classic
```

### 2. Cài đặt Expo CLI

```bash
npm install -g @expo/cli
```

Kiểm tra cài đặt:
```bash
expo --version
```

### 3. Cài đặt Git (nếu chưa có)

#### Windows:
- Tải từ [git-scm.com](https://git-scm.com/)
- Cài đặt với các tùy chọn mặc định

#### macOS:
```bash
# Sử dụng Homebrew
brew install git

# Hoặc cài đặt Xcode Command Line Tools
xcode-select --install
```

#### Linux:
```bash
sudo apt install git
```

### 4. Cài đặt Editor (Khuyến nghị)

#### Visual Studio Code:
1. Tải từ [code.visualstudio.com](https://code.visualstudio.com/)
2. Cài đặt các extension hữu ích:
   - React Native Tools
   - ES7+ React/Redux/React-Native snippets
   - TypeScript Hero
   - Prettier - Code formatter
   - Auto Rename Tag
   - Bracket Pair Colorizer

## 📱 Cài đặt để test trên thiết bị

### Android:

#### Option 1: Sử dụng Expo Go (Đơn giản - Khuyến nghị)
1. Cài đặt Expo Go từ Google Play Store
2. Quét QR code từ terminal/browser khi chạy `expo start`

#### Option 2: Android Studio (Để build native)
1. Tải Android Studio từ [developer.android.com](https://developer.android.com/studio)
2. Cài đặt Android SDK và Android Virtual Device (AVD)
3. Thiết lập biến môi trường:
   - `ANDROID_HOME`: Đường dẫn đến Android SDK
   - Thêm `platform-tools` vào PATH

### iOS (chỉ trên macOS):

#### Option 1: Sử dụng Expo Go (Đơn giản - Khuyến nghị)
1. Cài đặt Expo Go từ App Store
2. Quét QR code từ terminal/browser khi chạy `expo start`

#### Option 2: Xcode (Để build native)
1. Cài đặt Xcode từ Mac App Store
2. Mở Xcode và accept license agreements
3. Cài đặt iOS Simulator

## 🔧 Thiết lập dự án

### 1. Clone dự án
```bash
git clone https://github.com/yourusername/carrent-app.git
cd carrent-app
```

### 2. Cài đặt dependencies
```bash
# Sử dụng npm
npm install

# Hoặc sử dụng yarn (nếu có)
yarn install
```

### 3. Khởi chạy dự án
```bash
# Khởi động development server
npm start
# hoặc
expo start

# Chạy trên Android
npm run android

# Chạy trên iOS (chỉ macOS)
npm run ios

# Chạy trên web browser
npm run web
```

## 🐛 Xử lý sự cố thường gặp

### 1. Lỗi "npm command not found"
**Nguyên nhân**: Node.js chưa được cài đặt hoặc PATH chưa được thiết lập
**Giải pháp**: 
- Cài đặt lại Node.js
- Restart terminal/command prompt
- Kiểm tra biến môi trường PATH

### 2. Lỗi "expo command not found"
**Nguyên nhân**: Expo CLI chưa được cài đặt globally
**Giải pháp**:
```bash
npm install -g @expo/cli
```

### 3. Lỗi Metro bundler
**Nguyên nhân**: Cache bị lỗi
**Giải pháp**:
```bash
# Clear Metro cache
npx react-native start --reset-cache

# Hoặc với Expo
expo start -c
```

### 4. Lỗi "Unable to resolve module"
**Nguyên nhân**: Dependencies chưa được cài đặt đầy đủ
**Giải pháp**:
```bash
# Xóa node_modules và cài đặt lại
rm -rf node_modules
npm install

# Hoặc với yarn
rm -rf node_modules
yarn install
```

### 5. Lỗi Android build
**Nguyên nhân**: Android SDK chưa được thiết lập
**Giải pháp**:
- Kiểm tra ANDROID_HOME environment variable
- Cài đặt Android SDK platforms và build-tools cần thiết
- Restart computer sau khi thiết lập environment variables

### 6. Lỗi iOS build (macOS)
**Nguyên nhân**: Xcode hoặc Command Line Tools chưa được cài đặt
**Giải pháp**:
```bash
# Cài đặt Command Line Tools
xcode-select --install

# Hoặc mở Xcode và accept license agreements
sudo xcodebuild -license accept
```

## 📚 Tài liệu tham khảo

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [React Native Paper](https://reactnativepaper.com/)
- [React i18next](https://react.i18next.com/)

## 💡 Tips để phát triển hiệu quả

1. **Sử dụng Expo Go để test nhanh**:
   - Không cần setup Android Studio/Xcode ban đầu
   - Test ngay trên thiết bị thật

2. **Enable Hot Reload**:
   - Tự động refresh khi save file
   - Giúp phát triển nhanh hơn

3. **Sử dụng TypeScript**:
   - Dự án đã được setup với TypeScript
   - Giúp catch errors sớm và code dễ maintain

4. **Kiểm tra logs**:
```bash
# Xem logs trong terminal
expo start

# Hoặc mở debugger trong browser
# Press 'j' trong terminal để mở debugger
```

5. **Sử dụng React Developer Tools**:
   - Cài đặt extension cho Chrome/Firefox
   - Debug component state và props

## ⚡ Next Steps

Sau khi cài đặt thành công:

1. **Khám phá cấu trúc dự án**:
   - Đọc README.md để hiểu tổng quan
   - Xem qua các file trong thư mục `src/`

2. **Thử nghiệm các tính năng**:
   - Đăng ký/đăng nhập
   - Chuyển đổi ngôn ngữ trong Settings
   - Navigation giữa các màn hình

3. **Customize theo nhu cầu**:
   - Thay đổi colors, fonts trong styles
   - Thêm tính năng mới
   - Tích hợp với backend API

4. **Deploy lên store**:
   - Build APK/IPA để test
   - Publish lên Google Play/App Store

---

**🎉 Chúc bạn code vui vẻ!** 
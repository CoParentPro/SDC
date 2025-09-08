# Platform Support Guide

## Secure Data Compiler (SDC) - Cross-Platform Deployment

### Platform Overview

SDC supports multiple deployment methods across various platforms and devices. Choose the method that best fits your needs.

---

## 🖥️ Desktop Platforms

### Windows Desktop
**Recommended Method:** Native Electron App
- **Location:** `install-and-run/windows-desktop/`
- **Installation:** Run `install-windows.ps1` or `install-windows.bat`
- **Features:** Full desktop integration, file associations, system tray
- **Requirements:** Windows 10+, 4GB RAM

### macOS Desktop
**Recommended Method:** Native Electron App or Web Browser
- **Electron Build:**
  ```bash
  npm run build
  npm run electron-build -- --mac
  ```
- **Web Browser:** Use Safari, Chrome, or Firefox
- **PWA:** Add to Dock from browser
- **Requirements:** macOS 10.15+

### Linux Desktop
**Recommended Method:** Web Browser or AppImage
- **AppImage Build:**
  ```bash
  npm run build
  npm run electron-build -- --linux
  ```
- **Web Browser:** Chrome/Chromium recommended
- **Docker:** Available for containerized deployment
- **Requirements:** Modern Linux distribution

---

## 📱 Mobile Platforms

### Android
**Method 1: Progressive Web App (PWA)**
1. Open Chrome on Android
2. Navigate to SDC web app
3. Tap "Add to Home screen"
4. Launches like native app

**Method 2: Cordova Wrapper**
```bash
# Install Cordova
npm install -g cordova

# Create mobile project
cordova create sdc-mobile com.coparentpro.sdc "SDC"
cd sdc-mobile

# Add Android platform
cordova platform add android

# Copy web build
npm run build
cp -r out/* platforms/android/app/src/main/assets/www/

# Build APK
cordova build android
```

**Method 3: Capacitor (Recommended)**
```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# Initialize Capacitor
npx cap init sdc-mobile com.coparentpro.sdc

# Add Android platform
npx cap add android

# Copy web assets
npm run build
npx cap copy

# Open in Android Studio
npx cap open android
```

### iOS
**Method 1: Safari Web App**
1. Open Safari on iOS
2. Navigate to SDC web app
3. Tap Share → "Add to Home Screen"
4. Launches in full-screen mode

**Method 2: Capacitor (Recommended)**
```bash
# Install Capacitor with iOS
npm install @capacitor/ios

# Add iOS platform
npx cap add ios

# Copy web assets
npm run build
npx cap copy

# Open in Xcode
npx cap open ios
```

**Requirements:**
- iOS 14.5+ for full PWA features
- Xcode for native build
- Apple Developer account for distribution

---

## 🌐 Web Browser Deployment

### Supported Browsers
- ✅ Chrome 90+ (Best performance)
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ❌ Internet Explorer (Not supported)

### Deployment Options

#### 1. Development Server
```bash
cd install-and-run/web-browser
./deploy-web.sh  # Linux/macOS
# or
deploy-web.bat  # Windows
```

#### 2. Production Server
```bash
npm run build
npm start
```

#### 3. Static Hosting
```bash
npm run build
npm run export  # Creates static files in /out
```

#### 4. Docker Deployment
```bash
cd install-and-run/web-browser
docker-compose up
```

---

## ☁️ Cloud Platforms

### Vercel (Recommended for Web)
```bash
npm install -g vercel
vercel deploy
```

### Netlify
```bash
npm run build
# Upload /out folder to Netlify
```

### AWS
- **EC2:** Use Docker deployment
- **S3 + CloudFront:** Use static export
- **Amplify:** Connect GitHub repository

### Azure
- **App Service:** Deploy using GitHub Actions
- **Static Web Apps:** Use static export

### Google Cloud
- **Cloud Run:** Use Docker deployment
- **Firebase Hosting:** Use static export

---

## 🔧 Enterprise Deployment

### On-Premises
- **Windows Server:** IIS with Node.js
- **Linux Server:** Nginx + PM2
- **Docker Swarm:** Multi-container orchestration
- **Kubernetes:** Scale across multiple nodes

### Security Configurations
- **HTTPS Required:** All production deployments
- **CSP Headers:** Configured automatically
- **CORS:** Configured for same-origin
- **Authentication:** Integrated with enterprise SSO

---

## 📋 Feature Comparison by Platform

| Feature | Windows | macOS | Linux | Android | iOS | Web |
|---------|---------|-------|-------|---------|-----|-----|
| Offline Mode | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| File System Access | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ |
| Native Notifications | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Auto Updates | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| System Tray | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| File Associations | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ |
| Performance | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ |

**Legend:**
- ✅ Full support
- ⚠️ Limited support
- ❌ Not available
- ⭐ Performance rating (1-3 stars)

---

## 🚀 Quick Start Commands

### Windows
```cmd
cd install-and-run\windows-desktop
install-windows.bat
```

### macOS/Linux
```bash
cd install-and-run/web-browser
./deploy-web.sh
```

### Docker (Any Platform)
```bash
cd install-and-run/web-browser
docker-compose up
```

### Mobile PWA (Any Platform)
1. Visit the web app URL
2. Look for "Install" or "Add to Home Screen"
3. Follow browser prompts

---

## 📞 Support and Troubleshooting

### Common Issues
1. **Build failures:** Check Node.js version (18+ required)
2. **Permission errors:** Run installers as administrator
3. **Browser compatibility:** Use supported browser versions
4. **Mobile issues:** Enable PWA features in browser settings

### Getting Help
- Check platform-specific README files
- Review application logs
- Consult the main repository documentation
- File issues with platform details and error logs

---

**Note:** This guide covers all major deployment scenarios. Choose the method that best fits your security requirements, user base, and infrastructure constraints.
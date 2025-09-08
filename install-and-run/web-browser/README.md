# Web Browser Deployment Guide

## Secure Data Compiler (SDC) - Web Browser Version

### Overview
The SDC web application provides full functionality through modern web browsers with client-side processing, ensuring data security and privacy.

### Supported Browsers
- ✅ Chrome 90+ (Recommended)
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ Internet Explorer: Not supported

### Quick Start

#### Automatic Deployment
1. Run the deployment script:
   ```bash
   ./deploy-web.sh
   ```
2. Access the application at: `http://localhost:3000`

#### Manual Deployment

##### Prerequisites
- Node.js 18+ installed
- Git (for cloning)

##### Steps
1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

3. **Access the application:**
   - Open your browser
   - Navigate to `http://localhost:3000`
   - Begin using SDC immediately

### Deployment Options

#### Option 1: Local Development Server
```bash
npm run dev
```
- Best for: Development and testing
- Accessible at: `http://localhost:3000`
- Features: Hot reload, debugging tools

#### Option 2: Production Server
```bash
npm run build
npm start
```
- Best for: Production use
- Optimized performance
- Static asset caching

#### Option 3: Static Export (No Server Required)
```bash
npm run build
npm run export
```
- Best for: Hosting on CDN or static hosting
- Generates static files in `/out` folder
- Can be served from any web server

### Advanced Deployment

#### Docker Deployment
```bash
docker build -t sdc-web .
docker run -p 3000:3000 sdc-web
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Platform-Specific Instructions

#### Android Deployment
1. **Progressive Web App (PWA):**
   - Open SDC in Chrome on Android
   - Tap "Add to Home Screen"
   - Launch like a native app

2. **Cordova/PhoneGap Wrapper:**
   ```bash
   npm install -g cordova
   cordova create sdc-mobile com.coparentpro.sdc "SDC"
   cd sdc-mobile
   cordova platform add android
   # Copy web build to www folder
   cordova build android
   ```

#### iOS Deployment
1. **Safari Web App:**
   - Open SDC in Safari on iOS
   - Tap Share button → "Add to Home Screen"
   - Launches in full-screen mode

2. **Ionic Capacitor:**
   ```bash
   npm install -g @ionic/cli @capacitor/cli
   npx cap init sdc-mobile com.coparentpro.sdc "SDC"
   npx cap add ios
   npx cap copy ios
   npx cap open ios
   ```

#### macOS Deployment
1. **Web Browser:** Same as other desktop platforms
2. **Native Wrapper:**
   ```bash
   npm install -g electron
   npm run electron-build
   ```
3. **PWA:** Add to Dock from Safari or Chrome

### Features Available in Web Version
- ✅ Full application functionality
- ✅ Client-side encryption
- ✅ Offline support (Service Worker)
- ✅ File system access (where supported)
- ✅ Real-time collaboration
- ✅ Progressive Web App features
- ✅ Cross-platform compatibility
- ⚠️ Limited file system access on mobile

### Performance Optimization
- **Code Splitting:** Automatic with Next.js
- **Lazy Loading:** Components load on demand
- **Service Worker:** Caches assets for offline use
- **WebAssembly:** Used for cryptographic operations
- **Local Storage:** Encrypted client-side storage

### Security Features
- 🔒 Zero server-side data storage
- 🔒 End-to-end encryption
- 🔒 Content Security Policy (CSP)
- 🔒 Secure contexts (HTTPS required for production)
- 🔒 No third-party trackers or analytics

### Troubleshooting

#### Common Issues
1. **App won't load:** Check browser console for errors
2. **Slow performance:** Try clearing browser cache
3. **Features not working:** Ensure modern browser version
4. **Offline issues:** Check Service Worker registration

#### Browser-Specific Notes
- **Safari:** Some features require iOS 14.5+ or macOS 11+
- **Firefox:** Enable advanced web features in about:config
- **Chrome:** Best performance and feature support

### Environment Variables
Create a `.env.local` file:
```env
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_API_URL=https://your-api.com
NEXT_PUBLIC_ENCRYPTION_KEY=your-encryption-key
```

### Monitoring and Analytics
- Built-in performance monitoring
- Client-side error reporting
- Usage analytics (privacy-compliant)
- Real-time application health metrics

---
*For technical support, check browser console logs and refer to the main documentation.*
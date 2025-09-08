# Windows Desktop Installation Guide

## Secure Data Compiler (SDC) - Windows Desktop Version

### System Requirements
- Windows 10 or later (64-bit)
- Minimum 4GB RAM (8GB recommended)
- 2GB free disk space
- Internet connection for initial setup

### Automatic Installation (Recommended)

#### Option 1: One-Click Installer
1. Download `SDC-Windows-Installer.exe` from this folder
2. Right-click and select "Run as administrator"
3. Follow the installation wizard
4. Launch SDC from Desktop shortcut or Start Menu

#### Option 2: Quick Install Script
1. Open PowerShell as Administrator
2. Navigate to this folder
3. Run: `.\install-windows.ps1`
4. The application will be installed and launched automatically

### Manual Installation

#### Prerequisites
1. Install Node.js 18+ from https://nodejs.org
2. Install Git from https://git-scm.com

#### Installation Steps
1. Extract the SDC application files to your desired location
2. Open Command Prompt as Administrator
3. Navigate to the SDC folder
4. Run the following commands:
   ```cmd
   npm install
   npm run build
   npm run electron-build
   ```
5. The installer will be created in the `dist` folder

### Running the Application

#### From Installed Version
- Double-click the SDC desktop icon
- Or search "Secure Data Compiler" in Start Menu
- Or run from Start Menu → All Programs → SDC

#### From Development Version
1. Open Command Prompt in the SDC folder
2. Run: `npm run electron`
3. The application will start in development mode

### Features Available in Windows Desktop Version
- ✅ Full offline functionality
- ✅ Advanced file system access
- ✅ Native Windows integration
- ✅ System tray support
- ✅ File associations (.sdc files)
- ✅ Context menu integration
- ✅ Windows notifications
- ✅ Auto-updater support

### Troubleshooting

#### Common Issues
1. **Installation fails**: Run as Administrator
2. **App won't start**: Check Windows Defender exclusions
3. **Performance issues**: Close other applications, restart Windows
4. **Update problems**: Reinstall using the latest installer

#### Support
- Check application logs in: `%APPDATA%/SDC/logs/`
- Contact support with log files for faster resolution

### Security Features
- Zero-trust architecture
- Client-side encryption
- Offline-first design
- No data transmission without explicit user consent
- Windows security integration

### Uninstallation
1. Go to Settings → Apps & Features
2. Search for "Secure Data Compiler"
3. Click Uninstall
4. Follow the removal wizard

---
*For technical support or bug reports, please refer to the main repository documentation.*
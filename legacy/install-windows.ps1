# SDC Windows Installation Script
# Requires PowerShell 5.1 or later running as Administrator

param(
    [switch]$NoInteractive = $false,
    [string]$InstallPath = "$env:ProgramFiles\SDC",
    [switch]$CreateDesktopShortcut = $true,
    [switch]$CreateStartMenuShortcut = $true
)

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script requires Administrator privileges." -ForegroundColor Red
    Write-Host "Please right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

Write-Host "🚀 Starting SDC Installation..." -ForegroundColor Green

# Function to check if Node.js is installed
function Test-NodeJs {
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
            return $true
        }
    }
    catch {
        return $false
    }
    return $false
}

# Function to install Node.js
function Install-NodeJs {
    Write-Host "📦 Installing Node.js..." -ForegroundColor Yellow
    
    $nodeUrl = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
    $nodeInstaller = "$env:TEMP\nodejs-installer.msi"
    
    try {
        Write-Host "Downloading Node.js installer..." -ForegroundColor Blue
        Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller
        
        Write-Host "Installing Node.js..." -ForegroundColor Blue
        Start-Process -FilePath "msiexec.exe" -ArgumentList "/i", $nodeInstaller, "/quiet", "/norestart" -Wait
        
        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        Remove-Item $nodeInstaller -Force
        Write-Host "✅ Node.js installed successfully" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Failed to install Node.js: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to create application shortcuts
function New-Shortcuts {
    param(
        [string]$TargetPath,
        [string]$AppName
    )
    
    $shell = New-Object -ComObject WScript.Shell
    
    if ($CreateDesktopShortcut) {
        $desktopPath = [Environment]::GetFolderPath("Desktop")
        $shortcut = $shell.CreateShortcut("$desktopPath\$AppName.lnk")
        $shortcut.TargetPath = $TargetPath
        $shortcut.WorkingDirectory = Split-Path $TargetPath
        $shortcut.Description = "Secure Data Compiler - Enterprise Productivity Suite"
        $shortcut.Save()
        Write-Host "✅ Desktop shortcut created" -ForegroundColor Green
    }
    
    if ($CreateStartMenuShortcut) {
        $startMenuPath = [Environment]::GetFolderPath("StartMenu")
        $shortcut = $shell.CreateShortcut("$startMenuPath\Programs\$AppName.lnk")
        $shortcut.TargetPath = $TargetPath
        $shortcut.WorkingDirectory = Split-Path $TargetPath
        $shortcut.Description = "Secure Data Compiler - Enterprise Productivity Suite"
        $shortcut.Save()
        Write-Host "✅ Start Menu shortcut created" -ForegroundColor Green
    }
}

# Main installation process
try {
    # Check and install Node.js if needed
    if (-not (Test-NodeJs)) {
        if ($NoInteractive) {
            Write-Host "❌ Node.js is required but not found. Please install Node.js manually." -ForegroundColor Red
            exit 1
        }
        
        $choice = Read-Host "Node.js is required. Install automatically? (Y/n)"
        if ($choice -eq '' -or $choice -eq 'Y' -or $choice -eq 'y') {
            if (-not (Install-NodeJs)) {
                exit 1
            }
        } else {
            Write-Host "❌ Installation cancelled. Please install Node.js manually." -ForegroundColor Red
            exit 1
        }
    }
    
    # Create installation directory
    Write-Host "📁 Creating installation directory: $InstallPath" -ForegroundColor Blue
    if (-not (Test-Path $InstallPath)) {
        New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
    }
    
    # Get the script directory (where SDC files should be)
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $sourceDir = Split-Path -Parent (Split-Path -Parent $scriptDir)
    
    # Copy application files
    Write-Host "📋 Copying application files..." -ForegroundColor Blue
    Copy-Item -Path "$sourceDir\*" -Destination $InstallPath -Recurse -Force -Exclude ".git", "node_modules", ".next", "out", "dist"
    
    # Install dependencies
    Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
    Set-Location $InstallPath
    npm install --production
    
    # Build the application
    Write-Host "🔨 Building application..." -ForegroundColor Blue
    npm run build
    
    # Build Electron app
    Write-Host "⚡ Building desktop application..." -ForegroundColor Blue
    npm run electron-build
    
    # Find the built executable
    $exePath = Get-ChildItem -Path "$InstallPath\dist" -Name "*.exe" -Recurse | Select-Object -First 1
    if ($exePath) {
        $fullExePath = "$InstallPath\dist\$exePath"
        Write-Host "✅ Application built successfully: $fullExePath" -ForegroundColor Green
        
        # Create shortcuts
        New-Shortcuts -TargetPath $fullExePath -AppName "SDC"
        
        # Register file associations
        Write-Host "🔗 Registering file associations..." -ForegroundColor Blue
        reg add "HKEY_CLASSES_ROOT\.sdc" /ve /d "SDC.Document" /f
        reg add "HKEY_CLASSES_ROOT\SDC.Document" /ve /d "SDC Secure Document" /f
        reg add "HKEY_CLASSES_ROOT\SDC.Document\shell\open\command" /ve /d "`"$fullExePath`" `"%1`"" /f
        
        Write-Host "🎉 Installation completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now:" -ForegroundColor Cyan
        Write-Host "  • Launch SDC from your Desktop shortcut" -ForegroundColor White
        Write-Host "  • Find it in Start Menu under 'SDC'" -ForegroundColor White
        Write-Host "  • Double-click .sdc files to open them" -ForegroundColor White
        Write-Host ""
        
        if (-not $NoInteractive) {
            $launch = Read-Host "Launch SDC now? (Y/n)"
            if ($launch -eq '' -or $launch -eq 'Y' -or $launch -eq 'y') {
                Start-Process -FilePath $fullExePath
            }
        }
    } else {
        Write-Host "❌ Failed to build application executable" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ Installation failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}

Write-Host "📝 Installation log saved to: $InstallPath\install.log" -ForegroundColor Blue
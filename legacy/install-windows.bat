@echo off
title SDC - Secure Data Compiler Installer

echo =========================================
echo  SDC - Secure Data Compiler Installer
echo =========================================
echo.

:: Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Administrator privileges required
    echo Please right-click this file and select "Run as administrator"
    pause
    exit /b 1
)

:: Check for Node.js
echo Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed
    echo Please install Node.js from https://nodejs.org
    echo Then run this installer again
    pause
    exit /b 1
)

echo Node.js found - OK
echo.

:: Set installation directory
set "INSTALL_DIR=%ProgramFiles%\SDC"
echo Installation directory: %INSTALL_DIR%
echo.

:: Create installation directory
if not exist "%INSTALL_DIR%" (
    echo Creating installation directory...
    mkdir "%INSTALL_DIR%"
)

:: Copy files
echo Copying application files...
xcopy /E /I /Y "..\..\*" "%INSTALL_DIR%" /EXCLUDE:install-exclude.txt

:: Install dependencies
echo Installing dependencies...
cd /d "%INSTALL_DIR%"
npm install --production

:: Build application
echo Building application...
npm run build

:: Build Electron app
echo Building desktop application...
npm run electron-build

:: Create shortcuts
echo Creating shortcuts...
powershell -Command "& {$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\SDC.lnk'); $s.TargetPath = '%INSTALL_DIR%\dist\SDC Setup.exe'; $s.Save()}"

:: Register file associations
echo Registering file associations...
reg add "HKEY_CLASSES_ROOT\.sdc" /ve /d "SDC.Document" /f >nul
reg add "HKEY_CLASSES_ROOT\SDC.Document" /ve /d "SDC Secure Document" /f >nul
reg add "HKEY_CLASSES_ROOT\SDC.Document\shell\open\command" /ve /d "\"%INSTALL_DIR%\dist\SDC.exe\" \"%%1\"" /f >nul

echo.
echo =========================================
echo  Installation completed successfully!
echo =========================================
echo.
echo You can now launch SDC from:
echo - Desktop shortcut
echo - Start Menu
echo - Double-clicking .sdc files
echo.

set /p launch="Launch SDC now? (Y/n): "
if /i "%launch%"=="y" goto launch
if /i "%launch%"=="" goto launch
goto end

:launch
start "" "%INSTALL_DIR%\dist\SDC.exe"

:end
echo.
echo Thank you for installing SDC!
pause
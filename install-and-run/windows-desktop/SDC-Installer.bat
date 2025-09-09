@echo off
setlocal EnableDelayedExpansion

title SDC Professional Installation

echo.
echo =========================================
echo   SDC - Secure Data Compiler
echo   Professional Installation
echo =========================================
echo.

:: Check if running from the correct directory
if not exist "package.json" (
    echo ERROR: This installer must be run from the SDC application directory
    echo Please extract the complete application package and run this installer from that directory
    pause
    exit /b 1
)

:: Create Program Files directory
set "INSTALL_DIR=%ProgramFiles%\SDC"
echo Installation Target: %INSTALL_DIR%
echo.

:: Check for administrator privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo This installation requires administrator privileges.
    echo Please right-click this file and select "Run as administrator"
    pause
    exit /b 1
)

:: Check if Node.js exists (optional)
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Node.js detected (for development features)
) else (
    echo ◊ Node.js not found (some advanced features may be limited)
)

echo.
echo Installing SDC Application...
echo.

:: Create installation directory
if not exist "%INSTALL_DIR%" (
    echo Creating installation directory...
    mkdir "%INSTALL_DIR%"
)

:: Copy application files
echo Copying application files...
robocopy "." "%INSTALL_DIR%" /E /XD node_modules .git .next dist legacy /XF .gitignore *.log npm-debug.log* .DS_Store

:: Copy the built application if it exists
if exist "out" (
    echo Copying production build...
    robocopy "out" "%INSTALL_DIR%\app" /E
) else (
    echo Production build not found, creating minimal structure...
    mkdir "%INSTALL_DIR%\app"
    copy "package.json" "%INSTALL_DIR%\app\"
    copy "next.config.ts" "%INSTALL_DIR%\app\"
)

:: Create startup script
echo Creating application launcher...
(
echo @echo off
echo title SDC - Secure Data Compiler
echo cd /d "%INSTALL_DIR%"
echo.
echo if exist "app\index.html" ^(
echo     echo Starting SDC Web Application...
echo     start "" "app\index.html"
echo ^) else if exist "node_modules" ^(
echo     echo Starting SDC Development Server...
echo     npm run dev
echo ^) else ^(
echo     echo SDC application files not found.
echo     echo Please reinstall the application.
echo     pause
echo ^)
) > "%INSTALL_DIR%\SDC.bat"

:: Create desktop shortcut
echo Creating desktop shortcut...
powershell -Command "& {$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\SDC.lnk'); $s.TargetPath = '%INSTALL_DIR%\SDC.bat'; $s.WorkingDirectory = '%INSTALL_DIR%'; $s.Description = 'SDC - Secure Data Compiler'; $s.Save()}"

:: Create Start Menu shortcut
echo Creating Start Menu shortcut...
if not exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\SDC" mkdir "%APPDATA%\Microsoft\Windows\Start Menu\Programs\SDC"
powershell -Command "& {$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%APPDATA%\Microsoft\Windows\Start Menu\Programs\SDC\SDC.lnk'); $s.TargetPath = '%INSTALL_DIR%\SDC.bat'; $s.WorkingDirectory = '%INSTALL_DIR%'; $s.Description = 'SDC - Secure Data Compiler'; $s.Save()}"

:: Register file associations for .sdc files
echo Registering file associations...
reg add "HKEY_CLASSES_ROOT\.sdc" /ve /d "SDC.Document" /f >nul 2>&1
reg add "HKEY_CLASSES_ROOT\SDC.Document" /ve /d "SDC Secure Document" /f >nul 2>&1
reg add "HKEY_CLASSES_ROOT\SDC.Document\shell\open\command" /ve /d "\"%INSTALL_DIR%\SDC.bat\" \"%%1\"" /f >nul 2>&1

:: Create uninstaller
echo Creating uninstaller...
(
echo @echo off
echo title SDC Uninstaller
echo echo Removing SDC application...
echo.
echo del "%USERPROFILE%\Desktop\SDC.lnk" 2^>nul
echo del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\SDC\SDC.lnk" 2^>nul
echo rmdir "%APPDATA%\Microsoft\Windows\Start Menu\Programs\SDC" 2^>nul
echo.
echo reg delete "HKEY_CLASSES_ROOT\.sdc" /f 2^>nul
echo reg delete "HKEY_CLASSES_ROOT\SDC.Document" /f 2^>nul
echo.
echo echo Removing installation directory...
echo cd /d "%ProgramFiles%"
echo rmdir /s /q "SDC" 2^>nul
echo.
echo echo SDC has been uninstalled.
echo pause
) > "%INSTALL_DIR%\Uninstall.bat"

echo.
echo =========================================
echo   Installation Complete!
echo =========================================
echo.
echo SDC has been successfully installed to:
echo %INSTALL_DIR%
echo.
echo You can now launch SDC from:
echo • Desktop shortcut
echo • Start Menu ^> Programs ^> SDC
echo • Double-clicking .sdc files
echo.
echo To uninstall, run: %INSTALL_DIR%\Uninstall.bat
echo.

set /p launch="Would you like to launch SDC now? (Y/n): "
if /i "!launch!"=="Y" goto launch
if /i "!launch!"=="" goto launch
goto end

:launch
echo Launching SDC...
start "" "%INSTALL_DIR%\SDC.bat"

:end
echo.
echo Thank you for installing SDC!
pause
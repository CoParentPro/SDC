@echo off
title SDC Web Deployment

echo =========================================
echo   SDC Web Deployment Script
echo =========================================
echo.

:: Check for Node.js
echo Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo Node.js found - OK
echo.

:: Change to project root
cd /d "%~dp0..\.."

echo Choose deployment option:
echo 1) Development server (hot reload)
echo 2) Production server
echo 3) Static export (for hosting)
echo 4) Full setup + production server
echo 5) Quick development start
echo.

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto dev
if "%choice%"=="2" goto prod
if "%choice%"=="3" goto static
if "%choice%"=="4" goto full
if "%choice%"=="5" goto quick
goto invalid

:dev
echo Starting development server...
npm run dev
goto end

:prod
echo Building and starting production server...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)
npm start
goto end

:static
echo Creating static export...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)
npx next export
echo Static files created in ./out folder
goto end

:full
echo Full setup and deployment...
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Dependency installation failed!
    pause
    exit /b 1
)
echo Building application...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)
echo Starting production server...
npm start
goto end

:quick
echo Quick development start...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)
npm run dev
goto end

:invalid
echo Invalid choice. Please run the script again.
pause
exit /b 1

:end
echo.
echo Deployment completed!
echo Access the application at: http://localhost:3000
pause
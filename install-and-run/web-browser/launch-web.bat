@echo off
title SDC Web Deployment

echo.
echo ========================================
echo   SDC Web Browser Deployment
echo ========================================
echo.

:: Check if we're in the right directory
if not exist "package.json" (
    echo ERROR: This script must be run from the SDC application directory
    echo Please navigate to the SDC folder and run this script again
    pause
    exit /b 1
)

echo This will start the SDC application in your web browser.
echo All data will be stored locally on your computer.
echo.

:: Check for Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is required for web deployment.
    echo.
    echo Please install Node.js from: https://nodejs.org
    echo Then run this script again.
    echo.
    pause
    exit /b 1
)

echo ✓ Node.js found
echo.

:: Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
)

echo ✓ Dependencies ready
echo.

:: Build the application
echo Building application...
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo ✓ Application built successfully
echo.

:: Start the web server
echo Starting SDC Web Application...
echo.
echo The application will open in your browser at: http://localhost:3000
echo.
echo To stop the application, close this window or press Ctrl+C
echo.

:: Start the development server
start "" http://localhost:3000
npm run dev
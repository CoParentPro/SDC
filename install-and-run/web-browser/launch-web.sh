#!/bin/bash

echo "========================================"
echo "  SDC Web Browser Deployment"
echo "========================================"
echo

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "ERROR: This script must be run from the SDC application directory"
    echo "Please navigate to the SDC folder and run this script again"
    exit 1
fi

echo "This will start the SDC application in your web browser."
echo "All data will be stored locally on your computer."
echo

# Check for Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "Node.js is required for web deployment."
    echo
    echo "Please install Node.js from: https://nodejs.org"
    echo "Then run this script again."
    echo
    exit 1
fi

echo "✓ Node.js found"
echo

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies"
        exit 1
    fi
    echo
fi

echo "✓ Dependencies ready"
echo

# Build the application
echo "Building application..."
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Build failed"
    exit 1
fi

echo "✓ Application built successfully"
echo

# Start the web server
echo "Starting SDC Web Application..."
echo
echo "The application will be available at: http://localhost:3000"
echo
echo "To stop the application, press Ctrl+C"
echo

# Start the development server
npm run dev
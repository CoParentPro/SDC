#!/bin/bash

# SDC Web Deployment Script
# This script automatically sets up and deploys the web version of SDC

set -e  # Exit on any error

echo "🚀 SDC Web Deployment Script"
echo "=============================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_nodejs() {
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version)
        print_success "Node.js found: $NODE_VERSION"
        
        # Check if version is 18 or higher
        MAJOR_VERSION=$(echo $NODE_VERSION | sed 's/v\([0-9]*\).*/\1/')
        if [ "$MAJOR_VERSION" -lt 18 ]; then
            print_error "Node.js version 18 or higher is required. Current version: $NODE_VERSION"
            exit 1
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org"
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    if command -v npm >/dev/null 2>&1; then
        NPM_VERSION=$(npm --version)
        print_success "npm found: $NPM_VERSION"
    else
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
}

# Get to the project root
cd "$(dirname "$0")/../.."
PROJECT_ROOT=$(pwd)
print_status "Project root: $PROJECT_ROOT"

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    if npm install; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Build the application
build_application() {
    print_status "Building application for production..."
    if npm run build; then
        print_success "Application built successfully"
    else
        print_error "Build failed"
        exit 1
    fi
}

# Start the server
start_server() {
    print_status "Starting production server..."
    print_success "Server will start on http://localhost:3000"
    print_status "Press Ctrl+C to stop the server"
    npm start
}

# Export static version
export_static() {
    print_status "Exporting static version..."
    if npm run export 2>/dev/null || npx next export; then
        print_success "Static export completed - files in ./out folder"
    else
        print_warning "Static export not available, using standard build"
    fi
}

# Main deployment process
main() {
    echo "Choose deployment option:"
    echo "1) Development server (hot reload)"
    echo "2) Production server"
    echo "3) Static export (for hosting)"
    echo "4) Full setup + production server"
    echo "5) Quick development start"
    
    read -p "Enter your choice (1-5): " choice
    
    case $choice in
        1)
            print_status "Starting development server..."
            check_nodejs
            check_npm
            npm run dev
            ;;
        2)
            print_status "Starting production server..."
            check_nodejs
            check_npm
            build_application
            start_server
            ;;
        3)
            print_status "Creating static export..."
            check_nodejs
            check_npm
            build_application
            export_static
            ;;
        4)
            print_status "Full setup and deployment..."
            check_nodejs
            check_npm
            install_dependencies
            build_application
            start_server
            ;;
        5)
            print_status "Quick development start..."
            check_nodejs
            check_npm
            if [ ! -d "node_modules" ]; then
                install_dependencies
            fi
            npm run dev
            ;;
        *)
            print_error "Invalid choice. Please run the script again."
            exit 1
            ;;
    esac
}

# Run main function
main

print_success "Deployment completed!"
print_status "Access the application at: http://localhost:3000"
#!/bin/bash

# Fernando Backend - Quick Deployment Script
# This script helps you quickly deploy the Fernando backend

set -e

echo "🚀 Fernando Backend Deployment Script"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        print_success ".env file created. Please update it with your values."
        print_warning "Exiting. Please configure .env file and run this script again."
        exit 1
    else
        print_error ".env.example not found!"
        exit 1
    fi
else
    print_success ".env file found"
fi

# Ask deployment method
echo ""
echo "Choose deployment method:"
echo "1) Docker Compose (Recommended)"
echo "2) PM2 (VPS/Server)"
echo "3) Just build and test"
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        print_warning "Deploying with Docker Compose..."
        
        # Check if Docker is installed
        if ! command -v docker &> /dev/null; then
            print_error "Docker is not installed. Please install Docker first."
            exit 1
        fi
        
        if ! command -v docker-compose &> /dev/null; then
            print_error "Docker Compose is not installed. Please install Docker Compose first."
            exit 1
        fi
        
        print_success "Docker and Docker Compose found"
        
        # Build and start
        echo ""
        print_warning "Building Docker images..."
        docker-compose build
        
        echo ""
        print_warning "Starting services..."
        docker-compose up -d
        
        echo ""
        print_success "Services started!"
        
        # Wait for services to be ready
        echo ""
        print_warning "Waiting for services to be ready..."
        sleep 5
        
        # Check health
        echo ""
        print_warning "Checking health..."
        if curl -f http://localhost:4000/api/v1/health > /dev/null 2>&1; then
            print_success "Health check passed!"
        else
            print_error "Health check failed. Check logs with: docker-compose logs -f"
        fi
        
        # Ask to seed admin
        echo ""
        read -p "Do you want to seed admin user? (y/n): " seed_choice
        if [ "$seed_choice" = "y" ]; then
            docker-compose exec fernando-backend npm run seed
            print_success "Admin user seeded"
        fi
        
        echo ""
        print_success "Deployment complete!"
        echo ""
        echo "View logs: docker-compose logs -f"
        echo "Stop services: docker-compose down"
        echo "Restart services: docker-compose restart"
        ;;
        
    2)
        echo ""
        print_warning "Deploying with PM2..."
        
        # Check if Node.js is installed
        if ! command -v node &> /dev/null; then
            print_error "Node.js is not installed. Please install Node.js 20+ first."
            exit 1
        fi
        
        # Check if PM2 is installed
        if ! command -v pm2 &> /dev/null; then
            print_warning "PM2 not found. Installing PM2 globally..."
            npm install -g pm2
        fi
        
        print_success "Node.js and PM2 found"
        
        # Install dependencies
        echo ""
        print_warning "Installing dependencies..."
        npm install
        
        # Build
        echo ""
        print_warning "Building TypeScript..."
        npm run build
        
        # Seed admin
        echo ""
        read -p "Do you want to seed admin user? (y/n): " seed_choice
        if [ "$seed_choice" = "y" ]; then
            npm run seed
            print_success "Admin user seeded"
        fi
        
        # Start with PM2
        echo ""
        print_warning "Starting application with PM2..."
        pm2 start ecosystem.config.js
        
        # Save PM2 config
        pm2 save
        
        print_success "Application started!"
        
        echo ""
        echo "View logs: pm2 logs fernando-backend"
        echo "Stop app: pm2 stop fernando-backend"
        echo "Restart app: pm2 restart fernando-backend"
        echo "Monitor: pm2 monit"
        ;;
        
    3)
        echo ""
        print_warning "Building and testing..."
        
        # Install dependencies
        echo ""
        print_warning "Installing dependencies..."
        npm install
        
        # Run linter
        echo ""
        print_warning "Running linter..."
        npm run lint
        
        # Build
        echo ""
        print_warning "Building TypeScript..."
        npm run build
        
        print_success "Build successful!"
        
        echo ""
        echo "To run in development mode: npm run dev"
        echo "To run in production mode: npm start"
        ;;
        
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

echo ""
print_success "Done! 🎉"

# Fernando Backend - Quick Deployment Script (PowerShell)
# This script helps you quickly deploy the Fernando backend on Windows

$ErrorActionPreference = "Stop"

Write-Host "🚀 Fernando Backend Deployment Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

function Print-Success {
    param($Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Print-Error {
    param($Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Print-Warning {
    param($Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

# Check if .env file exists
if (-not (Test-Path .env)) {
    Print-Warning ".env file not found. Creating from .env.example..."
    if (Test-Path .env.example) {
        Copy-Item .env.example .env
        Print-Success ".env file created. Please update it with your values."
        Print-Warning "Exiting. Please configure .env file and run this script again."
        exit 1
    } else {
        Print-Error ".env.example not found!"
        exit 1
    }
} else {
    Print-Success ".env file found"
}

# Ask deployment method
Write-Host ""
Write-Host "Choose deployment method:"
Write-Host "1) Docker Compose (Recommended)"
Write-Host "2) PM2 (VPS/Server)"
Write-Host "3) Just build and test"
$choice = Read-Host "Enter choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host ""
        Print-Warning "Deploying with Docker Compose..."
        
        # Check if Docker is installed
        if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
            Print-Error "Docker is not installed. Please install Docker Desktop first."
            exit 1
        }
        
        if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
            Print-Error "Docker Compose is not installed. Please install Docker Compose first."
            exit 1
        }
        
        Print-Success "Docker and Docker Compose found"
        
        # Build and start
        Write-Host ""
        Print-Warning "Building Docker images..."
        docker-compose build
        
        Write-Host ""
        Print-Warning "Starting services..."
        docker-compose up -d
        
        Write-Host ""
        Print-Success "Services started!"
        
        # Wait for services to be ready
        Write-Host ""
        Print-Warning "Waiting for services to be ready..."
        Start-Sleep -Seconds 5
        
        # Check health
        Write-Host ""
        Print-Warning "Checking health..."
        try {
            $response = Invoke-WebRequest -Uri http://localhost:4000/api/v1/health -UseBasicParsing -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Print-Success "Health check passed!"
            }
        } catch {
            Print-Error "Health check failed. Check logs with: docker-compose logs -f"
        }
        
        # Ask to seed admin
        Write-Host ""
        $seedChoice = Read-Host "Do you want to seed admin user? (y/n)"
        if ($seedChoice -eq "y") {
            docker-compose exec fernando-backend npm run seed
            Print-Success "Admin user seeded"
        }
        
        Write-Host ""
        Print-Success "Deployment complete!"
        Write-Host ""
        Write-Host "View logs: docker-compose logs -f"
        Write-Host "Stop services: docker-compose down"
        Write-Host "Restart services: docker-compose restart"
    }
    
    "2" {
        Write-Host ""
        Print-Warning "Deploying with PM2..."
        
        # Check if Node.js is installed
        if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
            Print-Error "Node.js is not installed. Please install Node.js 20+ first."
            exit 1
        }
        
        # Check if PM2 is installed
        if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
            Print-Warning "PM2 not found. Installing PM2 globally..."
            npm install -g pm2
        }
        
        Print-Success "Node.js and PM2 found"
        
        # Install dependencies
        Write-Host ""
        Print-Warning "Installing dependencies..."
        npm install
        
        # Build
        Write-Host ""
        Print-Warning "Building TypeScript..."
        npm run build
        
        # Seed admin
        Write-Host ""
        $seedChoice = Read-Host "Do you want to seed admin user? (y/n)"
        if ($seedChoice -eq "y") {
            npm run seed
            Print-Success "Admin user seeded"
        }
        
        # Start with PM2
        Write-Host ""
        Print-Warning "Starting application with PM2..."
        pm2 start ecosystem.config.js
        
        # Save PM2 config
        pm2 save
        
        Print-Success "Application started!"
        
        Write-Host ""
        Write-Host "View logs: pm2 logs fernando-backend"
        Write-Host "Stop app: pm2 stop fernando-backend"
        Write-Host "Restart app: pm2 restart fernando-backend"
        Write-Host "Monitor: pm2 monit"
    }
    
    "3" {
        Write-Host ""
        Print-Warning "Building and testing..."
        
        # Install dependencies
        Write-Host ""
        Print-Warning "Installing dependencies..."
        npm install
        
        # Run linter
        Write-Host ""
        Print-Warning "Running linter..."
        npm run lint
        
        # Build
        Write-Host ""
        Print-Warning "Building TypeScript..."
        npm run build
        
        Print-Success "Build successful!"
        
        Write-Host ""
        Write-Host "To run in development mode: npm run dev"
        Write-Host "To run in production mode: npm start"
    }
    
    default {
        Print-Error "Invalid choice"
        exit 1
    }
}

Write-Host ""
Print-Success "Done! 🎉"

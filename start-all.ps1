#!/usr/bin/env pwsh
# LocalCart - Start All Services
# This script starts the entire application stack: Infrastructure + Backend + Frontend

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  LocalCart - Full Stack Startup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Function to print colored messages
function Log-Info($message) {
    Write-Host "[INFO] $message" -ForegroundColor Blue
}

function Log-Success($message) {
    Write-Host "[SUCCESS] $message" -ForegroundColor Green
}

function Log-Warning($message) {
    Write-Host "[WARNING] $message" -ForegroundColor Yellow
}

function Log-Error($message) {
    Write-Host "[ERROR] $message" -ForegroundColor Red
}

# STEP 1: Check Prerequisites
Write-Host ""
Write-Host "STEP 1: Checking Prerequisites..." -ForegroundColor Cyan
Write-Host "-----------------------------------" -ForegroundColor Cyan

# Check Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Log-Error "Docker is not installed! Please install Docker Desktop."
    exit 1
}
Log-Success "Docker is installed"

# Check Docker Compose
if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Log-Error "Docker Compose is not installed!"
    exit 1
}
Log-Success "Docker Compose is installed"

# Check Maven wrapper
if (-not (Test-Path ".\mvnw.cmd")) {
    Log-Error "Maven wrapper (mvnw.cmd) not found!"
    exit 1
}
Log-Success "Maven wrapper is available"

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Log-Error "Node.js is not installed! Please install Node.js (LTS version recommended)."
    Log-Info "Run: choco install nodejs-lts -y (if you have Chocolatey)"
    exit 1
}
Log-Success "Node.js is installed ($(node --version))"

# Check if frontend dependencies are installed
if (-not (Test-Path ".\frontend\node_modules")) {
    Log-Warning "Frontend dependencies not installed. Installing now..."
    Push-Location frontend
    npm install
    Pop-Location
    Log-Success "Frontend dependencies installed"
} else {
    Log-Success "Frontend dependencies already installed"
}

# STEP 2: Check Environment Configuration
Write-Host ""
Write-Host "STEP 2: Checking Environment Configuration..." -ForegroundColor Cyan
Write-Host "----------------------------------------------" -ForegroundColor Cyan

if (-not (Test-Path ".env")) {
    Log-Warning ".env file not found! Creating from template..."
    Copy-Item ".env.example" ".env" -ErrorAction SilentlyContinue
    if (-not (Test-Path ".env")) {
        Log-Error ".env.example not found! Cannot create .env file."
        exit 1
    }
    Log-Success ".env file created from template"
} else {
    Log-Success ".env file exists"
}

# STEP 3: Start Docker Infrastructure
Write-Host ""
Write-Host "STEP 3: Starting Docker Infrastructure..." -ForegroundColor Cyan
Write-Host "------------------------------------------" -ForegroundColor Cyan
Log-Info "Starting PostgreSQL, Redis, and monitoring services..."

docker-compose up -d

# Wait for services to be healthy
Log-Info "Waiting for services to be ready (15 seconds)..."
Start-Sleep -Seconds 15

# Check if services are running
$postgresRunning = docker ps --filter "name=localcart-postgres" --filter "status=running" --quiet
$redisRunning = docker ps --filter "name=localcart-redis" --filter "status=running" --quiet

if ($postgresRunning) {
    Log-Success "PostgreSQL is running"
} else {
    Log-Error "PostgreSQL failed to start!"
}

if ($redisRunning) {
    Log-Success "Redis is running"
} else {
    Log-Error "Redis failed to start!"
}

# STEP 4: Build Backend
Write-Host ""
Write-Host "STEP 4: Building Backend (Spring Boot)..." -ForegroundColor Cyan
Write-Host "------------------------------------------" -ForegroundColor Cyan
Log-Info "Running Maven clean install..."

.\mvnw.cmd clean install -DskipTests

if ($LASTEXITCODE -eq 0) {
    Log-Success "Backend build completed"
} else {
    Log-Error "Backend build failed!"
    exit 1
}

# STEP 5: Build Frontend
Write-Host ""
Write-Host "STEP 5: Building Frontend (Next.js)..." -ForegroundColor Cyan
Write-Host "---------------------------------------" -ForegroundColor Cyan
Log-Info "Building Next.js application..."

Push-Location frontend
npm run build
$buildStatus = $LASTEXITCODE
Pop-Location

if ($buildStatus -eq 0) {
    Log-Success "Frontend build completed"
} else {
    Log-Warning "Frontend build had issues, but continuing..."
}

# STEP 6: Start Backend & Frontend
Write-Host ""
Write-Host "STEP 6: Starting Applications..." -ForegroundColor Cyan
Write-Host "----------------------------------" -ForegroundColor Cyan
Write-Host ""
Log-Info "Starting Backend on port 8080..."
Log-Info "Starting Frontend on port 3000..."
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  STARTING ALL SERVICES NOW" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Yellow
Write-Host "  Frontend:    http://localhost:3000" -ForegroundColor White
Write-Host "  Backend API: http://localhost:8080" -ForegroundColor White
Write-Host "  API Health:  http://localhost:8080/actuator/health" -ForegroundColor White
Write-Host "  Adminer:     http://localhost:8081" -ForegroundColor White
Write-Host "  Grafana:     http://localhost:3001 (admin/admin)" -ForegroundColor White
Write-Host "  Prometheus:  http://localhost:9090" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
Write-Host ""

# Start backend in background job
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    .\mvnw.cmd spring-boot:run
}

# Wait a bit for backend to start
Start-Sleep -Seconds 5

# Start frontend in background job
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location frontend
    npm run dev
}

Write-Host ""
Log-Success "Backend started (Job ID: $($backendJob.Id))"
Log-Success "Frontend started (Job ID: $($frontendJob.Id))"
Write-Host ""
Log-Info "Monitoring logs... (showing combined output)"
Write-Host ""

# Monitor both jobs and display output
try {
    while ($true) {
        # Show backend output
        $backendOutput = Receive-Job -Job $backendJob -ErrorAction SilentlyContinue
        if ($backendOutput) {
            $backendOutput | ForEach-Object {
                Write-Host "[BACKEND] $_" -ForegroundColor Cyan
            }
        }
        
        # Show frontend output
        $frontendOutput = Receive-Job -Job $frontendJob -ErrorAction SilentlyContinue
        if ($frontendOutput) {
            $frontendOutput | ForEach-Object {
                Write-Host "[FRONTEND] $_" -ForegroundColor Magenta
            }
        }
        
        # Check if jobs are still running
        if ($backendJob.State -eq "Failed" -or $backendJob.State -eq "Stopped") {
            Log-Error "Backend job stopped unexpectedly!"
            break
        }
        
        if ($frontendJob.State -eq "Failed" -or $frontendJob.State -eq "Stopped") {
            Log-Error "Frontend job stopped unexpectedly!"
            break
        }
        
        Start-Sleep -Milliseconds 500
    }
}
finally {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Yellow
    Write-Host "  Shutting down services..." -ForegroundColor Yellow
    Write-Host "=========================================" -ForegroundColor Yellow
    
    # Stop the jobs
    Stop-Job -Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job -Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $frontendJob -ErrorAction SilentlyContinue
    
    # Stop Docker services (optional - uncomment if you want to stop Docker too)
    # docker-compose down
    
    Log-Success "Services stopped"
}

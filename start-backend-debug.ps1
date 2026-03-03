#!/usr/bin/env pwsh
# Debug Backend Startup - Shows all errors in THIS window

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  LocalCart Backend Debug Startup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Docker Services
Write-Host "[1/5] Checking Docker Services..." -ForegroundColor Yellow
$postgresStatus = docker ps --filter "name=localcart-postgres" --filter "status=running" --quiet
$redisStatus = docker ps --filter "name=localcart-redis" --filter "status=running" --quiet

if (-not $postgresStatus) {
    Write-Host "  [ERROR] PostgreSQL is not running!" -ForegroundColor Red
    Write-Host "  Action: Starting PostgreSQL..." -ForegroundColor Yellow
    docker-compose up -d postgres
    Write-Host "  Waiting for PostgreSQL to be ready (15 seconds)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
} else {
    Write-Host "  [OK] PostgreSQL is running" -ForegroundColor Green
}

if (-not $redisStatus) {
    Write-Host "  [ERROR] Redis is not running!" -ForegroundColor Red
    Write-Host "  Action: Starting Redis..." -ForegroundColor Yellow
    docker-compose up -d redis
    Start-Sleep -Seconds 5
} else {
    Write-Host "  [OK] Redis is running" -ForegroundColor Green
}

# Step 2: Test Database Connection
Write-Host ""
Write-Host "[2/5] Testing Database Connection..." -ForegroundColor Yellow
try {
    $dbTest = docker exec localcart-postgres pg_isready -U localcart -d localcart 2>&1
    if ($dbTest -match "accepting connections") {
        Write-Host "  [OK] Database is accepting connections" -ForegroundColor Green
    } else {
        Write-Host "  [WARNING] Database status: $dbTest" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [ERROR] Cannot connect to database: $_" -ForegroundColor Red
}

# Step 3: Check if port 8080 is already in use
Write-Host ""
Write-Host "[3/5] Checking Port 8080..." -ForegroundColor Yellow
$portCheck = netstat -ano | Select-String ":8080.*LISTENING"
if ($portCheck) {
    Write-Host "  [ERROR] Port 8080 is already in use!" -ForegroundColor Red
    Write-Host "  $portCheck" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Kill the process? (Y/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq 'Y' -or $response -eq 'y') {
        $pid = ($portCheck -split '\s+')[-1]
        Stop-Process -Id $pid -Force
        Write-Host "  Process killed. Waiting 3 seconds..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
    } else {
        Write-Host "  Cannot start backend while port is in use. Exiting." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  [OK] Port 8080 is available" -ForegroundColor Green
}

# Step 4: Check .env file
Write-Host ""
Write-Host "[4/5] Checking Configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "  [OK] .env file exists" -ForegroundColor Green
} else {
    Write-Host "  [WARNING] .env file not found" -ForegroundColor Yellow
}

if (Test-Path "mvnw.cmd") {
    Write-Host "  [OK] Maven wrapper found" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] mvnw.cmd not found!" -ForegroundColor Red
    exit 1
}

# Step 5: Start Backend with Full Logging
Write-Host ""
Write-Host "[5/5] Starting Spring Boot Backend..." -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  BACKEND LOGS (Watch for errors below)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Watch for these messages:" -ForegroundColor Yellow
Write-Host "  - 'Started LocalcartApplication' = SUCCESS" -ForegroundColor Green
Write-Host "  - 'Tomcat started on port(s): 8080' = SUCCESS" -ForegroundColor Green
Write-Host "  - ERROR, Exception, Failed = PROBLEMS" -ForegroundColor Red
Write-Host ""
Write-Host "Press Ctrl+C to stop the backend" -ForegroundColor Gray
Write-Host ""
Write-Host "------------------------------------------" -ForegroundColor Gray

# Start Maven in this window so we can see ALL output
.\mvnw.cmd spring-boot:run

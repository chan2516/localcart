#!/usr/bin/env pwsh
# LocalCart - Simple Start Script (Opens in separate windows)
# This is simpler than start-all.ps1 - it opens each service in its own terminal window

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  LocalCart - Starting All Services" -ForegroundColor Cyan
Write-Host "  (Each service in separate window)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Start Docker services
Write-Host "Starting Docker services..." -ForegroundColor Yellow
docker-compose up -d

Write-Host "Waiting for services to initialize (15 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check if Node modules are installed
if (-not (Test-Path ".\frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location frontend
    npm install
    Pop-Location
}

# Start Backend in new window
Write-Host "Starting Backend (Spring Boot) in new window..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host 'Starting Backend...' -ForegroundColor Green; .\mvnw.cmd spring-boot:run"

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start Frontend in new window
Write-Host "Starting Frontend (Next.js) in new window..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; Write-Host 'Starting Frontend...' -ForegroundColor Magenta; npm run dev"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  ✅ ALL SERVICES STARTED!" -ForegroundColor Green
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
Write-Host "To stop all services:" -ForegroundColor Cyan
Write-Host "   1. Close the Backend and Frontend PowerShell windows" -ForegroundColor White
Write-Host "   2. Run: docker-compose down" -ForegroundColor White
Write-Host ""

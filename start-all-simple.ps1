#!/usr/bin/env pwsh
# LocalCart - Simple Start Script (Opens in separate windows)
# This is simpler than start-all.ps1 - it opens each service in its own terminal window

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  LocalCart - Starting All Services" -ForegroundColor Cyan
Write-Host "  (Each service in separate window)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

function Wait-ForContainerHealthy {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ContainerName,
        [int]$TimeoutSeconds = 120
    )

    $elapsed = 0
    while ($elapsed -lt $TimeoutSeconds) {
        $running = docker inspect -f "{{.State.Running}}" $ContainerName 2>$null
        if ($running -ne "true") {
            Start-Sleep -Seconds 2
            $elapsed += 2
            continue
        }

        $health = docker inspect -f "{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}" $ContainerName 2>$null
        if ($health -eq "healthy" -or $health -eq "none") {
            Write-Host "  $ContainerName is ready (health: $health)" -ForegroundColor Green
            return
        }

        Start-Sleep -Seconds 2
        $elapsed += 2
    }

    throw "Timed out waiting for container '$ContainerName' to become healthy."
}

# Start Docker services
Write-Host "Starting Docker services..." -ForegroundColor Yellow
docker compose up -d postgres redis adminer n8n prometheus grafana loki promtail

Write-Host "Waiting for PostgreSQL and Redis to be healthy..." -ForegroundColor Yellow
Wait-ForContainerHealthy -ContainerName "localcart-postgres" -TimeoutSeconds 120
Wait-ForContainerHealthy -ContainerName "localcart-redis" -TimeoutSeconds 120

Write-Host "Core infra is ready." -ForegroundColor Green

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
Write-Host "   2. Run: docker compose down" -ForegroundColor White
Write-Host ""

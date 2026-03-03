#!/usr/bin/env pwsh
# Simple Backend Startup - No interruptions

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Starting LocalCart Backend" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Quick checks
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

$postgres = docker ps --filter "name=localcart-postgres" --filter "status=running" --quiet
$redis = docker ps --filter "name=localcart-redis" --filter "status=running" --quiet

if (-not $postgres -or -not $redis) {
    Write-Host "Starting Docker services..." -ForegroundColor Yellow
    docker-compose up -d postgres redis
    Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
}

Write-Host "[OK] Docker services are ready" -ForegroundColor Green
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Starting Spring Boot..." -ForegroundColor Cyan  
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Wait for: 'Started LocalcartApplication'" -ForegroundColor Yellow
Write-Host "Then test at: http://localhost:8080/actuator/health" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

# Start backend - Let it run!
.\mvnw.cmd spring-boot:run

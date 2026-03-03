#!/usr/bin/env pwsh
# Test Registration Endpoint

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  LocalCart Registration Test" -ForegroundColor Cyan
Write-Host "=========================================="-ForegroundColor Cyan
Write-Host ""

# Test 1: Backend Health
Write-Host "[1/4] Testing Backend Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8080/actuator/health" -TimeoutSec 5
    Write-Host "  [SUCCESS] Backend is healthy: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Backend is not responding!" -ForegroundColor Red
    Write-Host "  Action: Start backend with: .\mvnw.cmd spring-boot:run" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Test 2: Database Connection
Write-Host ""
Write-Host "[2/4] Testing Database..." -ForegroundColor Yellow
try {
    $dbStatus = docker exec localcart-postgres pg_isready -U localcart 2>&1
    if ($dbStatus -match "accepting connections") {
        Write-Host "  [SUCCESS] Database is ready" -ForegroundColor Green
    } else {
        Write-Host "  [WARNING] Database status: $dbStatus" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [ERROR] Database check failed" -ForegroundColor Red
}

# Test 3: Check if user already exists
Write-Host ""
Write-Host "[3/4] Checking test user..." -ForegroundColor Yellow
$testEmail = "test-$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
Write-Host "  Using email: $testEmail" -ForegroundColor Cyan

# Test 4: Try Registration
Write-Host ""
Write-Host "[4/4] Testing Registration Endpoint..." -ForegroundColor Yellow
try {
    $body = @{
        email = $testEmail
        password = "Test123456"
        firstName = "Test"
        lastName = "User"
        phoneNumber = "+1234567890"
    } | ConvertTo-Json

    Write-Host "  Sending request to: http://localhost:8080/api/v1/auth/register" -ForegroundColor Gray
    
    $response = Invoke-RestMethod `
        -Uri "http://localhost:8080/api/v1/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -TimeoutSec 10
    
    Write-Host ""
    Write-Host "  [SUCCESS] Registration works!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response Details:" -ForegroundColor Cyan
    Write-Host "  User ID: $($response.userId)" -ForegroundColor White
    Write-Host "  Email: $($response.email)" -ForegroundColor White
    Write-Host "  Name: $($response.firstName) $($response.lastName)" -ForegroundColor White
    Write-Host "  Message: $($response.message)" -ForegroundColor White
    Write-Host "  Token: $($response.accessToken.Substring(0, 20))..." -ForegroundColor White
    
} catch {
    Write-Host ""
    Write-Host "  [ERROR] Registration failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error Details:" -ForegroundColor Yellow
    Write-Host "  Status: $($_.Exception.Response.StatusCode.value__) $($_.Exception.Response.StatusDescription)" -ForegroundColor White
    
    if ($_.ErrorDetails.Message) {
        try {
            $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "  Error: $($errorJson.message)" -ForegroundColor White
            Write-Host "  Code: $($errorJson.errorCode)" -ForegroundColor White
        } catch {
            Write-Host "  Error: $($_.ErrorDetails.Message)" -ForegroundColor White
        }
    }
    
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Cyan
    Write-Host "  1. Check backend logs in the terminal running 'mvnw.cmd spring-boot:run'" -ForegroundColor White
    Write-Host "  2. Look for ERROR or Exception messages" -ForegroundColor White
    Write-Host "  3. Common issues:" -ForegroundColor White
    Write-Host "     - Database not initialized (roles table empty)" -ForegroundColor White
    Write-Host "     - Database connection failed" -ForegroundColor White
    Write-Host "     - JWT configuration missing" -ForegroundColor White
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

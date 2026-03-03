# Troubleshooting Registration Issue

## Problem
The backend appears to be running but not responding on port 8080. Registration is failing.

## How to See Logs and Debug

### Method 1: Start Backend in Current Terminal (RECOMMENDED for debugging)

1. **Stop any existing backend process:**
   ```powershell
   # Kill any running Java processes
   Get-Process -Name "java" -ErrorAction SilentlyContinue | Stop-Process -Force
   ```

2. **Start backend in this terminal to see live logs:**
   ```powershell
   # From project root
   cd D:\Chandan\projects\localcart
   
   # Start Spring Boot - you'll see all logs here
   .\mvnw.cmd spring-boot:run
   ```

3. **Watch for these important log lines:**
   - `Started LocalcartApplication` - Backend is ready
   - `Tomcat started on port(s): 8080` - Port is open
   - Any ERROR or Exception messages - These show the problem

4. **Test registration from another terminal:**
   ```powershell
   # Open a NEW PowerShell window and run:
   Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/register" `
     -Method POST `
     -ContentType "application/json" `
     -Body '{"email":"test@example.com","password":"Test123456","firstName":"Test","lastName":"User"}'
   ```

### Method 2: Check Existing Logs

If backend is already running in another window:

```powershell
# View last 50 lines of logs
Get-Content logs/application-startup.log -Tail 50 -Wait

# Search for errors
Select-String -Path logs/application-startup.log -Pattern "ERROR|Exception|Failed" | Select-Object -Last 20
```

### Method 3: Check Database Connection

The most common issue is database not being ready:

```powershell
# Check if PostgreSQL is running
docker ps | Select-String "postgres"

# Test database connection
docker exec localcart-postgres psql -U localcart -d localcart -c "\dt"
```

If database isn't running:
```powershell
docker-compose up -d postgres
# Wait 10 seconds
timeout /t 10
```

## Common Errors and Solutions

### Error 1: "Unable to obtain connection from database"
**Solution:** Start PostgreSQL first
```powershell
docker-compose up -d postgres redis
# Wait 15 seconds for database to initialize
timeout /t 15
# Then start backend
.\mvnw.cmd spring-boot:run
```

### Error 2: "Port 8080 already in use"
**Solution:** Kill the process using port 8080
```powershell
# Find process on port 8080
netstat -ano | Select-String ":8080"
# Kill it (replace PID with actual process ID from above)
Stop-Process -Id <PID> -Force
```

### Error 3: "Role not found" during registration
**Solution:** Database needs to be initialized with roles
```powershell
# Check if roles exist
docker exec localcart-postgres psql -U localcart -d localcart -c "SELECT * FROM roles;"

# If empty, the backend should create them automatically on first startup
# Make sure the backend fully starts before testing registration
```

## Step-by-Step Debugging Process

1. **Start backend with visible logs:**
   ```powershell
   .\mvnw.cmd spring-boot:run
   ```

2. **Wait for this message:**
   ```
   Started LocalcartApplication in X.XXX seconds
   ```

3. **Test health endpoint:**
   ```powershell
   curl http://localhost:8080/actuator/health
   ```
   Should return: `{"status":"UP"}`

4. **Try registration again from UI** (http://localhost:3000)

5. **Watch the backend terminal for errors** - You'll see exactly what's failing

## Quick Test Script

Save this as `test-registration.ps1`:
```powershell
# Test full stack
Write-Host "Testing LocalCart Registration..." -ForegroundColor Cyan

# Test backend health
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8080/actuator/health"
    Write-Host "[SUCCESS] Backend is healthy: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Backend is not responding!" -ForegroundColor Red
    Write-Host "Start backend with: .\mvnw.cmd spring-boot:run" -ForegroundColor Yellow
    exit 1
}

# Test registration
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"email":"test@example.com","password":"Test123456","firstName":"Test","lastName":"User"}'
    
    Write-Host "[SUCCESS] Registration works!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)"
} catch {
    Write-Host "[ERROR] Registration failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Response: $($_.ErrorDetails.Message)"
}
```

Run it: `.\test-registration.ps1`

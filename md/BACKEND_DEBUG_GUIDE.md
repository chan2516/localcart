# Backend Not Running - Debugging Guide

## Quick Diagnosis: Run This Command

```powershell
.\start-backend-debug.ps1
```

This script will:
1. ✅ Check if Docker services are running
2. ✅ Test database connection  
3. ✅ Verify port 8080 is available
4. ✅ Start backend with FULL logging visible
5. ✅ Show you EXACTLY what's failing

---

## Manual Debugging Steps

### Step 1: Check What's Running

```powershell
# Check if backend is running (should show nothing or wrong process)
Get-Process | Where-Object { $_.ProcessName -eq "java" }

# Check port 8080 (should be empty if backend isn't running)
netstat -ano | Select-String ":8080.*LISTENING"

# Check Docker services
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Step 2: Start Backend Manually (See All Logs)

```powershell
# Make sure you're in project root
cd D:\Chandan\projects\localcart

# Start backend - you'll see ALL logs here
.\mvnw.cmd spring-boot:run
```

**Watch for these key log messages:**

✅ **SUCCESS Messages:**
```
Started LocalcartApplication in X seconds
Tomcat started on port(s): 8080 (http)
```

❌ **ERROR Messages to Watch For:**

1. **Database Connection Error:**
```
Failed to obtain JDBC Connection
Unable to create initial connections of pool
```
**Fix:** Start PostgreSQL first
```powershell
docker-compose up -d postgres
Start-Sleep -Seconds 15
```

2. **Port Already in Use:**
```
Port 8080 was already in use
```
**Fix:** Kill the process
```powershell
$processId = (netstat -ano | Select-String ":8080.*LISTENING" | Select-Object -First 1) -replace '.*\s+(\d+)$','$1'
Stop-Process -Id $processId -Force
```

3. **Role Not Found Error:**
```
CUSTOMER role not found
```
**Fix:** Database needs initialization - happens automatically on first start, just wait for complete startup

4. **JWT Configuration Missing:**
```
JWT secret not configured
```
**Fix:** Check .env file exists and has JWT_SECRET

### Step 3: Test the Backend

Once you see "Started LocalcartApplication", open a NEW PowerShell window:

```powershell
# Test health endpoint
curl http://localhost:8080/actuator/health

# Should return:
# {"status":"UP"}

# Test registration
.\test-registration.ps1
```

---

## Common Error Scenarios

### Scenario 1: Backend Window Opens and Closes Immediately

**Cause:** Maven or Java error during startup  
**Solution:** Run `.\start-backend-debug.ps1` to see the error

### Scenario 2: Backend Starts But Port 8080 Doesn't Respond

**Cause:** Application failed during Spring Boot initialization  
**Check:** Look for ERROR in the logs  
**Common Issues:**
- Database connection failed
- Missing environment variables
- Configuration file error

### Scenario 3: "Started" Message Appears But Still Fails

**Cause:** Application started but endpoints aren't working  
**Check:** 
```powershell
# See if Tomcat actually started
Get-Content logs/application-startup.log | Select-String "Tomcat"

# Check actual port binding
netstat -ano | Select-String ":8080"
```

---

## The Right Way to Start Everything

### Option 1: Debug Mode (Recommended when troubleshooting)

**Terminal 1:** Start backend with visible logs
```powershell
.\start-backend-debug.ps1
```

**Terminal 2:** Start frontend
```powershell
cd frontend
npm run dev
```

**Terminal 3:** Docker services (if not already running)
```powershell
docker-compose up -d
```

### Option 2: Production Mode (Once everything works)

```powershell
.\start-all-simple.ps1
```

But this hides logs, making debugging harder!

---

## Logging Locations

When backend IS running, logs go to:

1. **Console Output** - Most reliable, shows everything
2. **logs/application-startup.log** - If started with `start-backend.sh`
3. **logs/localcart.json** - JSON formatted logs
4. **System out** - If running via Maven

**To watch logs in real-time:**
```powershell
Get-Content logs/application-startup.log -Tail 50 -Wait
```

---

## Currently: Backend is NOT Running

Based on diagnosis:
- ✅ Java process exists (PID 20972) BUT it's VS Code's language server, NOT your backend
- ❌ Port 8080 is NOT listening
- ❌ No recent backend logs
- ✅ Docker services ARE running

**Action:** Run `.\start-backend-debug.ps1` to start it properly and see why it's failing!

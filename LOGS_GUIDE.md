# 📋 LocalCart - Complete Logging Guide

## ✅ Quick Commands (Use These in Terminal)

### **1. View Backend Logs (Most Common)**

```powershell
# View last 50 logs
docker logs localcart-backend --tail 50

# Follow logs in real-time (live updates)
docker logs localcart-backend -f

# View only ERROR logs
docker logs localcart-backend 2>&1 | Select-String "ERROR"

# View logs from last 10 minutes
docker logs localcart-backend --since 10m

# Search for specific text
docker logs localcart-backend 2>&1 | Select-String "authentication"
```

### **2. Using the Log Viewer Script**

```powershell
# View last 50 backend logs
.\view-logs.ps1

# Follow logs in real-time
.\view-logs.ps1 -Follow

# Show only errors
.\view-logs.ps1 -Errors

# View frontend logs
.\view-logs.ps1 -Service frontend -Lines 100

# View other services
.\view-logs.ps1 -Service postgres
.\view-logs.ps1 -Service redis
.\view-logs.ps1 -Service grafana
```

---

## 📁 **Local Log Files**

Logs are also saved to files in the `logs/` directory:

```powershell
# View JSON logs (what Loki uses)
Get-Content logs\localcart.json -Tail 20 -Wait

# Filter for errors
Get-Content logs\localcart.json | Select-String "ERROR"

# View startup log
Get-Content logs\application-startup.log
```

**Log Files:**
- `logs/localcart.json` - Main JSON logs (418KB currently)
- `logs/application-startup.log` - Startup logs
- `logs/system-all.log` - All system logs

---

## 🔍 **View All Services Logs**

```powershell
# View all services together
docker-compose logs -f

# View specific services
docker-compose logs backend frontend

# View with timestamps
docker-compose logs -f --timestamps

# Last 100 lines from all services
docker-compose logs --tail 100
```

---

## 📊 **Grafana + Loki (Web Interface)**

### Access Grafana:
1. Open http://localhost:3001
2. Login: `admin` / `admin`
3. Click **Explore** (compass icon)
4. Select **Loki** datasource
5. Enter query: `{job="localcart"}`
6. Click **Run query**

### Useful LogQL Queries:

```logql
# All backend logs
{job="localcart"}

# Only ERROR logs
{job="localcart"} |= "ERROR"

# Authentication-related logs
{job="localcart"} |~ "(?i)auth|login|register"

# Logs with exceptions
{job="localcart"} |~ "Exception|Error"

# Logs from specific logger
{job="localcart"} | json | logger_name="com.localcart.controller"

# Count errors per minute
sum(count_over_time({job="localcart"} |= "ERROR" [1m]))
```

---

## 🐛 **Debugging Workflow**

When something doesn't work:

1. **Open terminal and run:**
   ```powershell
   docker logs localcart-backend -f
   ```

2. **Try the action** (e.g., login, register) in the frontend

3. **Watch the logs** appear in real-time

4. **Look for ERROR or Exception** messages

5. **For detailed analysis**, go to Grafana → Loki

---

## 📌 **Quick Reference**

| Command | What It Does |
|---------|--------------|
| `docker logs localcart-backend -f` | **Follow live logs** (best for debugging) |
| `docker logs localcart-backend --tail 100` | Last 100 log lines |
| `docker logs localcart-backend --since 10m` | Logs from last 10 minutes |
| `docker-compose logs -f` | All services logs |
| `.\view-logs.ps1 -Follow` | Use the helper script |
| `Get-Content logs\localcart.json -Tail 20 -Wait` | View local log file |

---

## ✅ **Verify Everything is Working**

```powershell
# Check all containers are running
docker ps

# Check backend is healthy
docker ps | Select-String "backend"

# Test backend API
curl http://localhost:8080/actuator/health

# Check if logs are being written
Get-ChildItem logs\ | Select-Object Name, LastWriteTime, Length

# Check Promtail is collecting logs
docker logs localcart-promtail --tail 10

# Check Loki is running
curl http://localhost:3100/ready
```

---

## 🚨 **Common Issues**

### No logs appearing in Loki?
- Logs ARE being written to files and Docker logs
- Promtail IS collecting them (we verified this)
- May take a few minutes for Grafana to show them
- **Use terminal commands** (`docker logs`) for immediate debugging

### Backend not responding?
```powershell
# Check if it's healthy
docker ps | Select-String backend

# Restart if needed
docker-compose restart backend

# View startup logs
docker logs localcart-backend --tail 100
```

### Can't see recent logs?
```powershell
# Force refresh
docker logs localcart-backend --since 1m -f
```

---

## 💡 **Pro Tips**

1. **Use `-f` flag** to follow logs in real-time while testing
2. **Use `Select-String`** to filter for specific terms
3. **Use `--since`** to see recent logs only
4. **Use the `view-logs.ps1` script** for convenience
5. **Check Docker logs first**, then Grafana for analysis

---

**Most Important Command for Debugging:**
```powershell
docker logs localcart-backend -f
```

Then perform your action (login/register) and watch the logs!

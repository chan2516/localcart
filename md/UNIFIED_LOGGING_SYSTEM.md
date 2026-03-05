# 📊 LocalCart Unified Logging System

## Overview

This unified logging system consolidates logs from **all services** (PostgreSQL, Redis, Spring Boot Backend) into single/multiple log files for easy monitoring and troubleshooting.

---

## 🚀 Quick Start

### Start Comprehensive Logging

```bash
# Option 1: Continuous background aggregation (RECOMMENDED)
./aggregate-all-logs.sh start

# Option 2: Live monitoring dashboard with real-time updates
./monitor-all-logs.sh monitor

# Option 3: One-time collection
./collect-all-logs.sh collect
```

### View the Logs

```bash
# View unified log
./aggregate-all-logs.sh view

# Follow in real-time
./aggregate-all-logs.sh tail

# Search for errors
./aggregate-all-logs.sh search ERROR

# View last 50 lines
./aggregate-all-logs.sh view 50
```

---

## 📁 Log Files Created

```
logs/
├── system-all.log                    ← Main unified log (auto-updated)
├── live-combined.log                 ← Snapshot for monitoring
├── application-startup.log           ← Backend only
├── localcart.json                    ← JSON format backend logs
└── .offsets                          ← Internal tracking file
```

---

## 🔧 Three Logging Scripts

### 1. **aggregate-all-logs.sh** (RECOMMENDED - Continuous)

Best for: **Production and continuous monitoring**

```bash
./aggregate-all-logs.sh start          # Start aggregating in background
./aggregate-all-logs.sh status         # Check if running
./aggregate-all-logs.sh stop           # Stop aggregation
./aggregate-all-logs.sh view           # View complete log
./aggregate-all-logs.sh view 100       # Last 100 lines
./aggregate-all-logs.sh tail           # Follow in real-time
./aggregate-all-logs.sh search ERROR   # Search logs
```

**Features:**
- ✅ Runs in background
- ✅ Continuously collects logs from all services
- ✅ Auto-timestamps all entries
- ✅ Keeps track of what's been logged
- ✅ Organized by service (BACKEND, DATABASE, CACHE)

---

### 2. **monitor-all-logs.sh** (Interactive Dashboard)

Best for: **Real-time visual monitoring**

```bash
./monitor-all-logs.sh monitor          # Start live dashboard
./monitor-all-logs.sh single           # Show current state once
./monitor-all-logs.sh docker           # Docker logs only
./monitor-all-logs.sh backend          # Backend logs only
./monitor-all-logs.sh errors           # Errors and warnings only
./monitor-all-logs.sh tail             # Real-time tail of all logs
./monitor-all-logs.sh help             # Show help
```

**Features:**
- ✅ Color-coded output
- ✅ Auto-refreshing dashboard
- ✅ Organized by service
- ✅ Shows system status

**Color Legend:**
- 🔴 **Red** = Errors/Exceptions/Fatal
- 🟡 **Yellow** = Warnings
- 🟢 **Green** = Info/Started/Running
- 🔵 **Blue** = Database
- 🟦 **Cyan** = Redis Cache
- 🟪 **Magenta** = Debug/Trace

---

### 3. **collect-all-logs.sh** (One-Time Collection)

Best for: **One-time logs for analysis**

```bash
./collect-all-logs.sh init             # Initialize
./collect-all-logs.sh collect          # Collect all service logs
./collect-all-logs.sh view             # View collected logs
./collect-all-logs.sh view 50          # Last 50 lines
./collect-all-logs.sh tail             # Follow in real-time
./collect-all-logs.sh search ERROR     # Search for errors
./collect-all-logs.sh errors           # Show only errors
./collect-all-logs.sh archive          # Archive and start fresh
./collect-all-logs.sh status           # Show status
```

**Features:**
- ✅ Complete snapshot of all services
- ✅ Can archive old logs
- ✅ File size management
- ✅ Log cleanup capabilities

---

## 📊 What Each Service Logs

### PostgreSQL Database
```
[DATABASE] PostgreSQL Connection: OK
[DATABASE] Executing Query: SELECT * FROM users
[DATABASE] Migration: Applying V1__initial_schema.sql
```

### Redis Cache
```
[CACHE] Redis Connection: OK
[CACHE] Cache HIT for key: user_123
[CACHE] Cache MISS for key: product_456
```

### Spring Boot Backend
```
[BACKEND] Starting LocalcartApplication
[BACKEND] Mapping endpoints
[BACKEND] Started LocalcartApplication (5 seconds)
[BACKEND] HTTP GET /api/v1/products - 200 OK
[BACKEND] ERROR: NullPointerException in UserService
```

### System Information
```
[SYSTEM] Docker Services Status
[SYSTEM] Java Process Status
[SYSTEM] Disk Usage
```

---

## 🎯 Common Use Cases

### Use Case 1: Monitor Everything Live
```bash
# Terminal 1: Start aggregation
./aggregate-all-logs.sh start

# Terminal 2: Follow logs
./aggregate-all-logs.sh tail
```

### Use Case 2: Debug Application Issues
```bash
# Start live dashboard
./monitor-all-logs.sh monitor

# See all errors in one place
# Each service logs are color-coded
```

### Use Case 3: Find Specific Problem
```bash
# Search for database errors
./aggregate-all-logs.sh search "ERROR"

# Search for specific keyword
./aggregate-all-logs.sh search "connection refused"

# Search for warnings
./collect-all-logs.sh errors
```

### Use Case 4: Performance Analysis
```bash
# Collect once
./collect-all-logs.sh collect

# View full log
./collect-all-logs.sh view

# Archive for later analysis
./collect-all-logs.sh archive
```

### Use Case 5: Multi-Terminal Workflow
```bash
# Terminal 1: Start backend
./start-backend.sh

# Terminal 2: Start aggregation
./aggregate-all-logs.sh start

# Terminal 3: Follow logs
while true; do
  clear
  ./aggregate-all-logs.sh view 30
  sleep 2
done

# Terminal 4: Monitor real-time with dashboard
./monitor-all-logs.sh monitor
```

---

## 📈 Log Format

### Timestamp Format
```
[2026-02-17 10:30:45] [SERVICE] [LEVEL] Log message
```

### Example Complete Entry
```
[2026-02-17 10:30:45] [BACKEND] [INFO] Started LocalcartApplication
[2026-02-17 10:30:46] [DATABASE] [DEBUG] Connection pooled
[2026-02-17 10:30:47] [CACHE] [INFO] Redis ping successful
[2026-02-17 10:30:48] [BACKEND] [ERROR] NullPointerException
```

---

## 🔍 Searching and Filtering

### Find All Errors
```bash
./aggregate-all-logs.sh search "ERROR"
```

### Find Database Issues
```bash
./aggregate-all-logs.sh search "DATABASE"
```

### Find Connection Issues
```bash
./aggregate-all-logs.sh search "connection\|refused\|timeout"
```

### Find Specific Time Period
```bash
# Extract logs between specific times
./aggregate-all-logs.sh view | grep "10:30"
```

### Find Memory Issues
```bash
./collect-all-logs.sh errors | grep -i "memory\|heap\|out of"
```

---

## ⏱️ How It Works

### Aggregation Process
1. **Start** → Creates unified log file
2. **Monitor** → Continuously checks all services
3. **Collect** → Gathers new logs every 2 seconds
4. **Timestamp** → Adds date/time and service name
5. **Write** → Appends to unified log file
6. **Track** → Remembers what's been logged (prevents duplicates)

### Service Integration
```
PostgreSQL (Docker) ──┐
                       ├─→ Aggregator ──→ system-all.log
Redis (Docker) ─────┤
                       └─→ (continuously updated)
Backend (Java) ──────┘
```

---

## 📂 File Management

### Unified Log Size
```
# Check size
du -h logs/system-all.log

# First 100 lines
./aggregate-all-logs.sh view 100

# Last 50 lines
tail -50 logs/system-all.log
```

### Archive Old Logs
```bash
# Create backup
gzip logs/system-all.log

# Start fresh
./collect-all-logs.sh init
```

### Automatic Cleanup (Optional)
```bash
# Keep only last 10,000 lines
tail -10000 logs/system-all.log > logs/system-all.log.tmp
mv logs/system-all.log.tmp logs/system-all.log
```

---

## 🚨 Common Issues & Solutions

### Issue: "Aggregator already running"
```bash
# Check what's running
ps aux | grep aggregate

# Or just start - it'll skip if already running
```

### Issue: "No logs in unified file"
```bash
# Make sure aggregator is started
./aggregate-all-logs.sh start

# Give it a few seconds to collect
sleep 3
./aggregate-all-logs.sh view
```

### Issue: "Log file too large"
```bash
# Archive and clean
./collect-all-logs.sh archive

# Or manually
gzip logs/system-all.log
> logs/system-all.log
```

### Issue: Shows old logs
```bash
# Offset tracking needs reset
rm logs/.offsets
./aggregate-all-logs.sh stop
./aggregate-all-logs.sh start
```

---

## 🔐 Privacy & Security

- ⚠️ Logs may contain sensitive data (tokens, passwords)
- 📝 Never commit log files to Git
- 🔒 Keep log files in secure location
- 🗑️ Archive and delete old logs regularly
- 📄 Add `logs/` to `.gitignore`

---

## 💡 Pro Tips

1. **Always start aggregator in background**
   ```bash
   ./aggregate-all-logs.sh start
   ```

2. **Monitor in one terminal, develop in another**
   ```bash
   # Terminal 1
   ./aggregate-all-logs.sh tail
   
   # Terminal 2
   cd src && vim controller/MyController.java
   ```

3. **Use grep for advanced filtering**
   ```bash
   grep "ERROR\|WARN" logs/system-all.log
   grep -v "DEBUG" logs/system-all.log  # Exclude debug
   ```

4. **Real-time monitoring with watch**
   ```bash
   watch -n 2 "tail -20 logs/system-all.log"
   ```

5. **Combine with jq for JSON logs**
   ```bash
   tail logs/localcart.json | jq '.level'
   ```

---

## 📚 Related Documentation

- **[LOGGING_GUIDE.md](LOGGING_GUIDE.md)** - Basic logging
- **[QUICK_REFERENCE_BACKEND.md](QUICK_REFERENCE_BACKEND.md)** - Commands
- **[BACKEND_ISSUE_RESOLUTION.md](BACKEND_ISSUE_RESOLUTION.md)** - Troubleshooting

---

## 🎯 Recommended Workflow

```bash
# 1. Start the application
./start-backend.sh

# 2. Start the log aggregator
./aggregate-all-logs.sh start

# 3. In another terminal, watch logs
./aggregate-all-logs.sh tail

# 4. If something goes wrong, search
./aggregate-all-logs.sh search "ERROR"

# 5. Or use the interactive monitor
./monitor-all-logs.sh monitor
```

---

## ✅ Verification

```bash
# Verify aggregator is working
./aggregate-all-logs.sh status

# Should show:
# ✓ Aggregator running (PID: 12345)
# Unified log file: logs/system-all.log
# Log size: 256K
# Log lines: 1240
```

---

**Everything centralized in one place! Logs, logs, and more logs! 📊**

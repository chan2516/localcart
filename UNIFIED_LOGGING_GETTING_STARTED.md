# 🎯 Unified Logging System - Complete Usage Guide

## Your Unified Logging is Now ACTIVE! ✅

The system is **already running** and collecting logs from:
- ✅ **PostgreSQL** (Database)
- ✅ **Redis** (Cache)
- ✅ **Spring Boot** (Your Application)

All logs are being centralized into: **`logs/system-all.log`**

---

## 🚀 Getting Started (30 seconds)

### Step 1: Check it's working
```bash
./aggregate-all-logs.sh status
```

**Expected Output:**
```
✓ Aggregator running (PID: 46871)
Unified log file: logs/system-all.log
Log size: 132K
Log lines: 994
```

### Step 2: View the logs
```bash
# See last 30 lines
./aggregate-all-logs.sh view 30

# Or follow in real-time
./aggregate-all-logs.sh tail
```

### Step 3: Search for issues
```bash
./aggregate-all-logs.sh search "ERROR"
```

**That's it! You're now monitoring everything.** 🎉

---

## 📊 What You'll See

### PostgreSQL Logs (DATABASE)
```
[2026-02-17 10:16:23] [DATABASE] database system was shut down at 2026-02-17 09:43:53 UTC
[2026-02-17 10:16:23] [DATABASE] database system is ready to accept connections
[2026-02-17 10:16:23] [DATABASE] 2026-02-17 09:43:53.959 UTC [41] LOG: background worker "logical replication launcher" (PID 46) exited with exit code 1
```

### Redis Logs (CACHE)
```
[2026-02-17 10:16:23] [CACHE] 1:M 17 Feb 2026 09:43:50.934 * Running mode=standalone, port=6379.
[2026-02-17 10:16:23] [CACHE] 1:M 17 Feb 2026 09:43:50.935 * Server initialized
[2026-02-17 10:16:23] [CACHE] 1:M 17 Feb 2026 09:43:50.935 * Ready to accept connections tcp
```

### Spring Boot Logs (BACKEND)
```
[2026-02-17 10:30:45] [BACKEND] [INFO] Starting LocalcartApplication
[2026-02-17 10:30:46] [BACKEND] [DEBUG] Spring Boot Started
[2026-02-17 10:30:47] [BACKEND] [ERROR] Connection refused
```

---

## 🎓 Common Tasks

### Task 1: Monitor in Real-Time
```bash
# Terminal 1: Application
./start-backend.sh

# Terminal 2: Follow logs live
./aggregate-all-logs.sh tail

# You'll see all activity in real-time!
```

### Task 2: Find What Broke
```bash
# Search for errors
./aggregate-all-logs.sh search "ERROR"

# Count how many errors
./aggregate-all-logs.sh search "ERROR" | wc -l

# See most recent error
./aggregate-all-logs.sh search "ERROR" | tail -1
```

### Task 3: Debug Database Issues
```bash
# See all database activity
./aggregate-all-logs.sh search "DATABASE"

# Or with context:
grep -i "database.*error" logs/system-all.log
```

### Task 4: Check Redis Cache
```bash
# See all cache activity
./aggregate-all-logs.sh search "CACHE"

# Check for cache issues
./aggregate-all-logs.sh search "CACHE.*ERROR\|CACHE.*refused"
```

### Task 5: Performance Analysis
```bash
# How many total log entries?
wc -l logs/system-all.log

# File size?
du -h logs/system-all.log

# Oldest and newest entries?
head -1 logs/system-all.log
tail -1 logs/system-all.log
```

---

## 🎯 Three Ways to View Logs

### Way 1: Follow in Real-Time (Best for Monitoring)
```bash
./aggregate-all-logs.sh tail
```
✅ See logs as they happen  
✅ Press `Ctrl+C` to stop  
✅ Great for debugging live issues

### Way 2: Colored Dashboard (Best for Visual)
```bash
./monitor-all-logs.sh monitor
```
✅ Auto-refreshing display  
✅ Color-coded by service and level  
✅ Beautiful visualization  
✅ Press `Ctrl+C` to stop

### Way 3: Manual Inspection (Best for Analysis)
```bash
./aggregate-all-logs.sh view 100
```
✅ See specific number of lines  
✅ Copy/paste friendly  
✅ Pipe-friendly for grep/awk

---

## 🔍 Powerful Searches

### Find Errors
```bash
./aggregate-all-logs.sh search "ERROR"
```

### Find Warnings
```bash
./aggregate-all-logs.sh search "WARN"
```

### Find Database Errors
```bash
./aggregate-all-logs.sh search "DATABASE.*ERROR\|ERROR.*DATABASE"
```

### Find Connection Issues
```bash
./aggregate-all-logs.sh search "connection\|refused\|timeout\|Connection reset"
```

### Find Specific Time
```bash
./aggregate-all-logs.sh search "10:30"  # All logs from 10:30
```

### Find by Service
```bash
./aggregate-all-logs.sh search "\[BACKEND\]"    # Backend only
./aggregate-all-logs.sh search "\[DATABASE\]"   # Database only
./aggregate-all-logs.sh search "\[CACHE\]"      # Cache only
```

---

## 📈 Log File Details

| Item | Value |
|------|-------|
| **Main unified log** | `logs/system-all.log` |
| **Current size** | ~132K (growing continuously) |
| **Current lines** | ~994 entries |
| **Services tracked** | 3 (Database, Cache, Backend) |
| **Update frequency** | Every 2 seconds |
| **Retention** | All entries kept (no rotation) |
| **Format** | `[YYYY-MM-DD HH:MM:SS] [SERVICE] message` |

---

## 🛠️ System Health Check

```bash
# Everything in one command
./aggregate-all-logs.sh status
```

This shows you:
- ✓ Is aggregator running?
- ✓ What's the log file path?
- ✓ How big is the log?
- ✓ How many entries?
- ✓ What's happening now?

---

## 🚨 Troubleshooting

### "Aggregator not running"
```bash
./aggregate-all-logs.sh start
sleep 2
./aggregate-all-logs.sh status
```

### "No logs appearing"
```bash
# Wait a few seconds (2 sec collection cycle)
sleep 3

# Then view
./aggregate-all-logs.sh view
```

### "Seeing old logs?"
```bash
# Reset offset tracking
rm logs/.offsets

# Restart
./aggregate-all-logs.sh stop
./aggregate-all-logs.sh start
```

### "Log file too big?"
```bash
# Backup and clean
gzip logs/system-all.log
> logs/system-all.log
```

---

## 💡 Pro Workflow Setup

### Multi-Terminal Productivity

**Terminal 1: Run Backend**
```bash
./start-backend.sh
```

**Terminal 2: Live Log Follow**
```bash
./aggregate-all-logs.sh tail
```

**Terminal 3: Problem Solver**
```bash
# As needed:
./aggregate-all-logs.sh search "ERROR"
./aggregate-all-logs.sh view 50
./aggregate-all-logs.sh search "CONNECTION"
```

**Terminal 4: Development**
```bash
# Code/debug in your IDE
# Logs are being monitored in Terminal 2!
```

---

## 📚 Script Reference

### **aggregate-all-logs.sh** (MAIN - Continuous)
```bash
start      # Start background aggregation
stop       # Stop aggregation
status     # Check if running
view       # View all logs (or N lines)
view N     # Last N lines
tail       # Follow in real-time
search     # Search for text
help       # Show all commands
```

### **monitor-all-logs.sh** (VISUAL - Dashboard)
```bash
monitor    # Live colored dashboard
single     # Show once (no refresh)
docker     # Docker logs only
backend    # Backend logs only
errors     # Errors only
tail       # Real-time colored tail
help       # Show commands
```

### **collect-all-logs.sh** (MANUAL - One-time)
```bash
collect    # Collect all logs now
view       # View collected
archive    # Archive and clean
status     # Show info
```

---

## 🎯 Next Steps

1. **Test It**: Run `./aggregate-all-logs.sh view 20`
2. **Monitor It**: Run `./aggregate-all-logs.sh tail`
3. **Search It**: Run `./aggregate-all-logs.sh search "ERROR"`
4. **Automate It**: Let it run in background 24/7

---

## 📞 Help & Documentation

| Document | Purpose |
|----------|---------|
| **UNIFIED_LOGGING_SYSTEM.md** | Complete system guide |
| **UNIFIED_LOGGING_QUICK_REFERENCE.md** | Cheat sheet & commands |
| **This file** | Getting started guide |

---

## ✅ Verification Checklist

- [ ] Run `./aggregate-all-logs.sh status` → Shows running
- [ ] Run `./aggregate-all-logs.sh view 30` → Shows logs
- [ ] Run `./aggregate-all-logs.sh search "DATABASE"` → Shows results
- [ ] Run `./aggregate-all-logs.sh tail` → Follow live
- [ ] Check file exists: `ls -lh logs/system-all.log` → Shows file

**All checks passing? You're ready to monitor everything!** 🎉

---

## 🔐 Notes

⚠️ **Important:**
- Logs may contain sensitive information (tokens, passwords)
- Never commit `logs/` directory to Git
- Archive old logs periodically (`./collect-all-logs.sh archive`)
- Use `.gitignore` to exclude logs from version control

---

**Now you have complete visibility into your entire system!**  
**From database to cache to backend, it's all in one place.** 🎊

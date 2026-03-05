# 🔍 Unified Logging - Quick Reference Card

## One-Command Cheat Sheet

```bash
# ✅ MOST USEFUL - Start continuous logging
./aggregate-all-logs.sh start

# ✅ Follow in real-time 
./aggregate-all-logs.sh tail

# ✅ Check status
./aggregate-all-logs.sh status

# ✅ Search for issues
./aggregate-all-logs.sh search "ERROR"
```

---

## Command Reference Matrix

| What You Want | Command | Output |
|---|---|---|
| **Start logging** | `./aggregate-all-logs.sh start` | Background daemon |
| **Check if running** | `./aggregate-all-logs.sh status` | PID and log stats |
| **Stop logging** | `./aggregate-all-logs.sh stop` | Confirms stop |
| **View all logs** | `./aggregate-all-logs.sh view` | Last 50 lines |
| **View N lines** | `./aggregate-all-logs.sh view 100` | Last 100 lines |
| **Follow live** | `./aggregate-all-logs.sh tail` | Real-time stream |
| **Search for text** | `./aggregate-all-logs.sh search "ERROR"` | Matching lines |
| **Live dashboard** | `./monitor-all-logs.sh monitor` | Colored refresh |
| **One-time collect** | `./collect-all-logs.sh collect` | Snapshot |
| **View collected** | `./collect-all-logs.sh view` | File output |

---

## Daily Workflows

### Workflow 1: Start & Monitor
```bash
# Terminal 1: Start app
./start-backend.sh

# Terminal 2: Start logging + follow
./aggregate-all-logs.sh start
./aggregate-all-logs.sh tail
```

### Workflow 2: Debug Issues
```bash
# Check status
./aggregate-all-logs.sh status

# See errors
./aggregate-all-logs.sh search "ERROR"

# Or use colored monitor
./monitor-all-logs.sh monitor
```

### Workflow 3: Check Last 10 Minutes
```bash
date -d "10 minutes ago"
./aggregate-all-logs.sh view 100
```

---

## Service Log Prefixes

| Prefix | Service | Color |
|--------|---------|-------|
| `[BACKEND]` | Spring Boot | Yellow/Default |
| `[DATABASE]` | PostgreSQL | Blue |
| `[CACHE]` | Redis | Cyan |
| `[SYSTEM]` | System Info | Green |

---

## Real-Time Monitoring

### Option A: Simple tail
```bash
./aggregate-all-logs.sh tail
```

### Option B: Colored dashboard
```bash
./monitor-all-logs.sh monitor
```

### Option C: Watch command (2 sec refresh)
```bash
watch -n 2 "tail -30 logs/system-all.log"
```

### Option D: Custom grep
```bash
tail -f logs/system-all.log | grep "ERROR\|WARN"
```

---

## Search Examples

```bash
# All errors
./aggregate-all-logs.sh search "ERROR"

# Database problems
./aggregate-all-logs.sh search "DATABASE.*ERROR"

# Connection issues
./aggregate-all-logs.sh search "connection\|refused\|timeout"

# Specific time
./aggregate-all-logs.sh search "10:30"

# Stack traces
./aggregate-all-logs.sh search "Exception\|at java"
```

---

## File Locations

```
📍 Primary unified log:
   logs/system-all.log

📍 Live monitoring snapshot:
   logs/live-combined.log

📍 Backend only (JSON):
   logs/localcart.json

📍 Backend startup:
   logs/application-startup.log

📍 Offset tracking:
   logs/.offsets
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No logs appear | `./aggregate-all-logs.sh start` first |
| "Already running" message | Check: `./aggregate-all-logs.sh status` |
| Old logs still showing | Reset: `rm logs/.offsets` + `./aggregate-all-logs.sh stop` + `./aggregate-all-logs.sh start` |
| Log file too large | Run: `./collect-all-logs.sh archive` |
| Can't find error | Use: `./aggregate-all-logs.sh search "keyword"` |
| Want colored output | Use: `./monitor-all-logs.sh monitor` |

---

## System Status Check

```bash
# One-stop shop for everything
./aggregate-all-logs.sh status

# Shows:
# ✓ Aggregator running (PID: XXXXX)
# Unified log file: logs/system-all.log
# Log size: 256K
# Log lines: 1240
# Recent entries: [last 5 lines]
```

---

## Auto-Starting (Optional)

Make aggregator start on boot:

```bash
# Add to ~/.bashrc or ~/.zshrc
if [ -f "./aggregate-all-logs.sh" ]; then
  ./aggregate-all-logs.sh start 2>/dev/null
fi
```

---

## Advanced Queries

```bash
# Count errors by type
./aggregate-all-logs.sh search "ERROR" | awk '{print $NF}' | sort | uniq -c

# Timeline of issues
grep "ERROR" logs/system-all.log | cut -d']' -f-3

# Errors per service
grep "ERROR" logs/system-all.log | cut -d'[' -f2 | sort | uniq -c

# Last error time
grep "ERROR" logs/system-all.log | tail -1
```

---

## Pro Tip: Multi-Terminal Setup

```bash
# Terminal 1: Backend
./start-backend.sh

# Terminal 2: Log aggregator (auto-start recommended)
./aggregate-all-logs.sh start

# Terminal 3: Real-time follower
watch -n 1 "tail -40 logs/system-all.log"

# Terminal 4: For manual searches
./aggregate-all-logs.sh search "keyword"
```

---

**Print this card and keep it by your desk!** 📌

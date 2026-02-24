# 🐛 Unified Logging System - Troubleshooting Guide

## Quick Diagnosis

```bash
# First, check if everything is running
./aggregate-all-logs.sh status

# If it shows "running", you're good!
# If not, see "Aggregator Won't Start" below
```

---

## Common Problems & Solutions

### Problem 1: Aggregator Won't Start

**Symptom:**
```
✗ Aggregator not running
```

**Solution:**
```bash
# Try starting it
./aggregate-all-logs.sh start

# Verify it started
./aggregate-all-logs.sh status
```

If still doesn't work:
```bash
# Check if another instance exists
ps aux | grep aggregate

# Kill any old processes
pkill -f aggregate-all-logs

# Start fresh
./aggregate-all-logs.sh start
```

---

### Problem 2: No Logs Appearing

**Symptom:**
```bash
./aggregate-all-logs.sh view
# Shows nothing or very old logs
```

**Solution:**
```bash
# Give it time to collect (2 second cycle)
sleep 5
./aggregate-all-logs.sh view

# If still nothing, check if services are running
docker ps  # Should show postgres and redis containers
```

If services aren't running:
```bash
docker-compose up -d postgres redis
sleep 5
./aggregate-all-logs.sh start
```

---

### Problem 3: Seeing Old/Duplicate Logs

**Symptom:**
```
[OLD DATE] Still seeing yesterday's logs
```

**Solution:**
```bash
# Reset offset tracking
rm logs/.offsets

# Restart aggregation
./aggregate-all-logs.sh stop
sleep 1
./aggregate-all-logs.sh start
```

---

### Problem 4: Log File Too Large

**Symptom:**
```
logs/system-all.log is 500MB+
```

**Solution Option 1: Archive**
```bash
# Keep current, archive old
./collect-all-logs.sh archive

# Or manually
gzip logs/system-all.log
```

**Solution Option 2: Clean Start**
```bash
# Back up first
cp logs/system-all.log logs/system-all.log.backup

# Clear it
> logs/system-all.log

# Reset tracking
rm logs/.offsets
```

---

### Problem 5: Can't Find Errors

**Symptom:**
```bash
./aggregate-all-logs.sh search "ERROR"
# Returns nothing
```

**Solution:**
```bash
# Try different formats
./aggregate-all-logs.sh search "error"      # lowercase
./aggregate-all-logs.sh search "Exception"  # Java exceptions
./aggregate-all-logs.sh search "ERROR\|WARN"  # Errors or warnings

# View raw logs
./aggregate-all-logs.sh view 100
```

---

### Problem 6: Colors Not Showing

**Symptom:**
```bash
./monitor-all-logs.sh monitor
# Shows plain text, no colors
```

**Solution:**
```bash
# Make sure you're on a terminal that supports colors
# Try the other viewers:
./aggregate-all-logs.sh tail       # Real-time white
./monitor-all-logs.sh single       # One-time colored

# If terminal doesn't support colors, use:
less logs/system-all.log           # Better formatting
cat logs/system-all.log | head -50 # Raw output
```

---

### Problem 7: Tail Doesn't Follow

**Symptom:**
```bash
./aggregate-all-logs.sh tail
# Prints once, doesn't update
```

**Solution:**
```bash
# Make sure aggregator is running
./aggregate-all-logs.sh status

# Should show PID if running
# If not, start it
./aggregate-all-logs.sh start
```

---

### Problem 8: Grep Search Not Working

**Symptom:**
```bash
./aggregate-all-logs.sh search "DATABASE" 
# Returns nothing even though we saw DATABASE logs
```

**Solution:**
```bash
# Try escaping brackets
./aggregate-all-logs.sh search "\[DATABASE\]"

# Or use case-insensitive
./aggregate-all-logs.sh search -i "database"

# Direct grep for debugging
grep "DATABASE" logs/system-all.log

# Count matches
grep "DATABASE" logs/system-all.log | wc -l
```

---

### Problem 9: Permission Denied Error

**Symptom:**
```
./aggregate-all-logs.sh: Permission denied
```

**Solution:**
```bash
# Make scripts executable
chmod +x aggregate-all-logs.sh
chmod +x monitor-all-logs.sh
chmod +x collect-all-logs.sh

# Try again
./aggregate-all-logs.sh start
```

---

### Problem 10: "Already Running" Message

**Symptom:**
```
✓ Aggregator already running
```

**This is normal!** It means it's already running in background.

**To see it:**
```bash
./aggregate-all-logs.sh view
./aggregate-all-logs.sh tail
```

**To stop it:**
```bash
./aggregate-all-logs.sh stop
```

**To restart:**
```bash
./aggregate-all-logs.sh stop
sleep 1
./aggregate-all-logs.sh start
```

---

## Advanced Diagnostics

### Check All Services

```bash
# PostgreSQL running?
docker ps | grep postgres

# Redis running?
docker ps | grep redis

# Backend running?
ps aux | grep java

# Aggregator running?
ps aux | grep aggregate
```

### Check Log File Permissions

```bash
# Check if log directory is writable
ls -ld logs/
# Should show: drwxrwxrwx (or similar)

# If not, fix it
chmod 777 logs/
```

### Check Disk Space

```bash
# Is disk full?
df -h

# Check logs directory specifically
du -sh logs/

# If over 1GB, archive it
./collect-all-logs.sh archive
```

### View Latest System Journal

```bash
# See system errors
journalctl -n 50

# Docker logs
docker logs postgres 2>&1 | tail -20
docker logs redis 2>&1 | tail -20
```

---

## Detailed Error Examples

### Error: "Connection refused"

```bash
# This means database/redis not running
docker-compose up -d postgres redis
sleep 10

# Check they're actually running
docker ps

# Start aggregation again
./aggregate-all-logs.sh start
```

### Error: "Permission denied - /proc/..."

```bash
# Aggregator can't read docker logs
# Solution: Run with proper permissions
sudo ./aggregate-all-logs.sh start

# Or add user to docker group
sudo usermod -aG docker $USER
newgrp docker
./aggregate-all-logs.sh start
```

### Error: "No such file or directory: logs/"

```bash
# Log directory doesn't exist
mkdir -p logs

# Start fresh
./aggregate-all-logs.sh start
```

---

## Debugging Real Issues

### Finding Database Connection Errors

```bash
# 1. Check if PostgreSQL is running
docker logs postgres | grep ERROR

# 2. Search unified logs
./aggregate-all-logs.sh search "DATABASE.*ERROR"

# 3. Or check complete database logs
./aggregate-all-logs.sh search "\[DATABASE\]" | head -20
```

### Finding Backend Crashes

```bash
# 1. Search for exceptions
./aggregate-all-logs.sh search "Exception"

# 2. Search for failures
./aggregate-all-logs.sh search "FAILED\|ERROR\|Exception"

# 3. View raw logs around timestamp
./aggregate-all-logs.sh view | grep "10:30"  # Your time
```

### Finding Cache Issues

```bash
# 1. Check Redis status
docker logs redis | grep -i error

# 2. Search unified logs
./aggregate-all-logs.sh search "\[CACHE\].*error"

# 3. Check Redis connection
./aggregate-all-logs.sh search "CACHE" | grep -i "connect\|refused"
```

---

## Prevention & Best Practices

### 1. Keep Aggregator Running Always
```bash
# Add to your startup script or cron
./aggregate-all-logs.sh start > /dev/null 2>&1
```

### 2. Monitor Disk Space
```bash
# Weekly check
du -sh logs/
# If over 500MB, archive
./collect-all-logs.sh archive
```

### 3. Regular Log Review
```bash
# Check for errors daily
./aggregate-all-logs.sh search "ERROR" | wc -l
# Should be 0 or very low
```

### 4. Archive Strategy
```bash
# Weekly backup
cp logs/system-all.log logs/backups/system-all-$(date +%Y-%m-%d).log
gzip logs/backups/system-all-*.log
```

### 5. Retention Policy
```bash
# Keep 30 days of logs
find logs/backups -name "*.gz" -mtime +30 -delete
```

---

## When Nothing Works

### Nuclear Option: Complete Reset

```bash
# 1. Stop everything
./aggregate-all-logs.sh stop

# 2. Clear log files
rm logs/system-all.log
rm logs/live-combined.log
rm logs/.offsets

# 3. Stop containers
docker-compose stop postgres redis

# 4. Start containers
docker-compose up -d postgres redis

# 5. Wait for services
sleep 10

# 6. Start aggregation
./aggregate-all-logs.sh start

# 7. Verify
./aggregate-all-logs.sh status
```

### Verify Success
```bash
# Should show running
./aggregate-all-logs.sh status

# Should show logs
./aggregate-all-logs.sh view

# Should see recent entries
./aggregate-all-logs.sh view | head -5
```

---

## Getting Help

### Information to Provide

When reporting issues, provide:
1. Output of: `./aggregate-all-logs.sh status`
2. Output of: `docker ps`
3. Recent logs: `./aggregate-all-logs.sh view 50`
4. Error message: Copy exact text
5. Steps to reproduce: What were you doing?

### Example Support Request
```
Issue: Errors appear in logs constantly

Status output:
./aggregate-all-logs.sh status
→ [output here]

Docker status:
docker ps
→ [output here]

Error logs:
./aggregate-all-logs.sh search "ERROR" | head -10
→ [output here]

What I was doing:
→ Running the backend and API tests
```

---

## 🆘 Still Stuck?

### Quick Checklist
- [ ] Run `./aggregate-all-logs.sh status` → Is it running?
- [ ] Run `docker ps` → Are containers up?
- [ ] Run `./aggregate-all-logs.sh view` → Any logs?
- [ ] Run `./aggregate-all-logs.sh search "ERROR"` → Errors?
- [ ] Check script permissions: `ls -l aggregate-all-logs.sh` → x present?
- [ ] Check log directory: `ls -d logs/` → Exists?
- [ ] Check disk space: `df -h` → Under 90%?
- [ ] Try the nuclear reset above

---

**Still need help? Check the main documentation:**
- [UNIFIED_LOGGING_SYSTEM.md](UNIFIED_LOGGING_SYSTEM.md)
- [UNIFIED_LOGGING_QUICK_REFERENCE.md](UNIFIED_LOGGING_QUICK_REFERENCE.md)
- [UNIFIED_LOGGING_GETTING_STARTED.md](UNIFIED_LOGGING_GETTING_STARTED.md)

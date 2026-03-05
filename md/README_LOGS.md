# 📝 LocalCart Logging & Troubleshooting Guide

## Quick Status
✅ **Backend is running and healthy**

---

## 🚀 Start Here

### 1. Start the Application
```bash
./start-backend.sh
```

This script will:
- Load environment variables
- Check Docker services
- Start Spring Boot
- Save all logs to `logs/application-startup.log`
- Show real-time output

### 2. Monitor Logs in Real-Time
```bash
tail -f logs/application-startup.log
```

### 3. Analyze for Issues
```bash
./analyze-logs.sh
```

This shows:
- Error count
- Warning count
- Application status
- Common issues detected
- Recent log entries

---

## 📊 Log Files Location

All logs are saved in the `logs/` directory:

```
logs/
├── application-startup.log         # Full startup output (main log)
├── localcart.json                 # JSON formatted logs
├── localcart.2026-02-17.json.gz  # Compressed archive (daily)
├── maven-compile.log              # Compilation logs
└── error-analysis.log             # Errors (when generated)
```

---

## 🔍 How to Find Issues

### Option 1: Auto Analysis (Easiest)
```bash
./analyze-logs.sh
```
Shows everything in a clean format.

### Option 2: Manual Search
```bash
# Find all errors
grep ERROR logs/application-startup.log

# Find exceptions
grep Exception logs/application-startup.log

# Find specific issue
grep -i "database\|connection\|auth" logs/application-startup.log
```

### Option 3: View JSON Logs
```bash
# Pretty print JSON
cat logs/localcart.json | jq .

# Find errors in JSON
grep '"level":"ERROR"' logs/localcart.json | jq .
```

---

## 🎯 Common Issues & Solutions

### Issue 1: "Password authentication failed"
**Cause:** PostgreSQL user not set up properly

**Solution:**
```bash
docker-compose down -v
docker-compose --env-file .env up -d postgres redis
```

### Issue 2: "Port 8080 already in use"
**Cause:** Another process using port 8080

**Solution:**
```bash
# Find the process
lsof -i :8080

# Kill it
kill -9 <PID>
```

### Issue 3: "Connection refused"
**Cause:** Database or Redis not running

**Solution:**
```bash
# Check services
docker-compose ps

# Restart if needed
docker-compose restart postgres redis
```

### Issue 4: No logs being created
**Cause:** Logs directory doesn't exist

**Solution:**
```bash
mkdir -p logs
```

---

## 📈 Log Format

### Console Output
```
2026-02-17T09:40:35.123Z  INFO 12345 --- [main] c.l.LocalcartApplication : Started LocalcartApplication
```

### JSON Output (logs/localcart.json)
```json
{
  "@timestamp": "2026-02-17T09:40:35.123Z",
  "message": "Started LocalcartApplication",
  "logger_name": "com.localcart.LocalcartApplication",
  "level": "INFO",
  "application": "localcart",
  "env": "dev"
}
```

---

## 🛠️ Configuration

### Log Levels
Edit `src/main/resources/application-dev.properties`:

```properties
# Set log level for specific packages
logging.level.com.localcart=DEBUG
logging.level.org.springframework.web=INFO
logging.level.org.hibernate.SQL=DEBUG
```

### Log Rotation
Edit `src/main/resources/logback-spring.xml`:

```xml
<!-- Change retention period -->
<maxHistory>30</maxHistory>  <!-- 30 days -->
<totalSizeCap>1GB</totalSizeCap>  <!-- Max 1GB total -->
```

---

## ✅ Verification Checklist

Run these to verify everything works:

```bash
# 1. Backend running?
ps aux | grep spring-boot | grep -v grep
# Should show Java process

# 2. Docker services up?
docker-compose ps
# Should show postgres and redis as "Up (healthy)"

# 3. Application responding?
curl http://localhost:8080/actuator/health
# Should return {"status":"UP"}

# 4. Logs created?
ls -lh logs/application-startup.log
# Should show file exists

# 5. No errors in logs?
./analyze-logs.sh
# Should show "Application started successfully!"
```

---

## 🎓 Useful Commands

### View Logs
```bash
tail -f logs/application-startup.log          # Follow in real-time
head -20 logs/application-startup.log         # First 20 lines
tail -20 logs/application-startup.log         # Last 20 lines
wc -l logs/application-startup.log            # Count total lines
```

### Search Logs
```bash
grep ERROR logs/application-startup.log       # All errors
grep -c ERROR logs/application-startup.log    # Count errors
grep -i "keyword" logs/application-startup.log # Case-insensitive
grep -B 3 -A 3 ERROR logs/application-startup.log  # With context
```

### JSON Processing
```bash
brew install jq  # (or apt-get install jq on Linux)
cat logs/localcart.json | jq .                # Pretty print
tail -1 logs/localcart.json | jq .error      # Last entry, just error field
grep ERROR logs/localcart.json | jq .message # All error messages
```

---

## 🔧 Advanced Troubleshooting

### Enable Debug Mode
```bash
# Edit application-dev.properties
logging.level.com.localcart=DEBUG

# Restart application
./start-backend.sh
```

### Verbose Compilation
```bash
./mvnw clean compile -X 2>&1 | tee logs/maven-verbose.log
```

### Full Stack Trace
```bash
./mvnw spring-boot:run -X 2>&1 | tee logs/full-startup.log
```

### Monitor in Real-Time
```bash
# Terminal 1: Start app
./start-backend.sh

# Terminal 2: Watch logs
watch -n 1 'tail -5 logs/application-startup.log'

# Terminal 3: Monitor health
watch -n 5 'curl -s http://localhost:8080/actuator/health'
```

---

## 📊 What Each Log Level Means

| Level | Frequency | Use Case |
|-------|-----------|----------|
| ERROR | Low | Something failed - always investigate |
| WARN | Medium | Potential issue but app still works |
| INFO | High | General information (startup, shutdown) |
| DEBUG | Very High | Detailed flow (only in dev mode) |
| TRACE | Extreme | SQL parameters, very detailed |

---

## 🎯 Development Checklist

Before testing your code:

- [ ] `./start-backend.sh` runs without errors
- [ ] Docker containers are healthy: `docker-compose ps`
- [ ] Health endpoint returns UP: `curl http://localhost:8080/actuator/health`
- [ ] Can access Swagger: http://localhost:8080/swagger-ui.html
- [ ] No errors in logs: `./analyze-logs.sh`
- [ ] Database connected: Check logs for "Started LocalcartApplication"

---

## 💡 Pro Tips

1. **Always start with logs**: `./analyze-logs.sh` gives instant issue summary
2. **Keep logs while developing**: `tail -f logs/application-startup.log` in another window
3. **Use Swagger to test**: Better than curl for API testing
4. **Archive old logs**: Logs rotate automatically but you can manually compress
5. **Monitor health**: `watch curl http://localhost:8080/actuator/health`

---

## 🆘 Getting Help

1. **Check logs first**: `./analyze-logs.sh`
2. **Search for error**: `grep -i "your error" logs/application-startup.log`
3. **View context**: `grep -B 5 -A 10 ERROR logs/application-startup.log`
4. **Check Docker**: `docker-compose logs postgres` or `docker-compose logs redis`
5. **Restart everything**: `docker-compose down -v && docker-compose --env-file .env up -d`

---

## 📚 Files Related to Logging

- **`logback-spring.xml`** - Logging configuration
- **`application-dev.properties`** - Log level settings
- **`.env`** - Spring profile selector
- **`logs/`** - Where logs are saved
- **`LOGGING_GUIDE.md`** - Full logging documentation

---

**Questions? Always start with: `./analyze-logs.sh`** 📊

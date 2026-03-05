# LocalCart Logging Guide

## 📋 Log Files Location

All log files are stored in the `logs/` directory:

```
logs/
├── application-startup.log    # Full application startup output
├── localcart.json            # JSON formatted logs (rolling)
├── localcart.2026-02-17.json.gz  # Archived logs (compressed)
├── maven-compile.log         # Compilation logs
└── error-analysis.log        # Filtered error logs
```

## 🚀 Starting the Application with Logging

### Quick Start
```bash
# Make the script executable
chmod +x start-backend.sh

# Start the application
./start-backend.sh
```

### Manual Start with Logging
```bash
# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Start with logging to file
./mvnw spring-boot:run 2>&1 | tee logs/application-startup.log
```

## 🔍 Analyzing Logs

### View Real-time Logs
```bash
# Follow the startup log
tail -f logs/application-startup.log

# Follow JSON logs
tail -f logs/localcart.json | jq .
```

### Search for Errors
```bash
# Find all errors
grep -i "error" logs/application-startup.log

# Find specific exceptions
grep -i "exception" logs/application-startup.log

# Find authentication errors
grep -i "auth" logs/application-startup.log
```

### Extract Error Stack Traces
```bash
# Get full error details
grep -A 20 "ERROR" logs/application-startup.log
```

### Analyze JSON Logs
```bash
# Install jq if not available
sudo apt-get install jq

# View formatted JSON logs
cat logs/localcart.json | jq .

# Filter by log level
cat logs/localcart.json | jq 'select(.level == "ERROR")'

# Filter by logger name
cat logs/localcart.json | jq 'select(.logger_name | contains("localcart"))'

# Get last 10 errors
grep '"level":"ERROR"' logs/localcart.json | tail -10 | jq .
```

## 📊 Log Levels

The application uses different log levels:

- **TRACE**: Most detailed logging (SQL parameters)
- **DEBUG**: Detailed application flow
- **INFO**: General information
- **WARN**: Warning messages
- **ERROR**: Error messages with stack traces

## 🔧 Common Issues and Solutions

### Issue 1: Application Stops Immediately

**Error in logs:**
```
FATAL: password authentication failed for user "localcart_user"
```

**Solution:**
1. Check `.env` file exists with correct credentials
2. Restart Docker containers:
   ```bash
   docker-compose down -v
   docker-compose --env-file .env up -d postgres redis
   ```

### Issue 2: Port Already in Use

**Error in logs:**
```
Port 8080 is already in use
```

**Solution:**
```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>
```

### Issue 3: Database Connection Timeout

**Error in logs:**
```
Connection refused: localhost:5432
```

**Solution:**
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Restart PostgreSQL
docker-compose restart postgres
```

## 📈 Log Rotation

Logs are automatically rotated:
- **JSON logs**: Rotated daily
- **Retention**: 30 days
- **Max size**: 1GB total
- **Format**: Compressed (gzip)

## 🎯 Monitoring Application Health

### Check if Application is Running
```bash
# Check process
ps aux | grep spring-boot

# Check port
curl http://localhost:8080/actuator/health
```

### View Metrics
```bash
# Application metrics
curl http://localhost:8080/actuator/metrics

# Prometheus metrics
curl http://localhost:8080/actuator/prometheus
```

## 🐛 Debugging Tips

### Enable Debug Mode
In `application-dev.properties`, set:
```properties
logging.level.com.localcart=DEBUG
logging.level.org.springframework.security=DEBUG
```

### View SQL Queries
Already enabled in dev mode:
```properties
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
logging.level.org.hibernate.SQL=DEBUG
```

### Capture Full Stack Traces
```bash
# Run with verbose output
./mvnw spring-boot:run -X 2>&1 | tee logs/verbose-startup.log
```

## 📝 Log Format

### Console Output (Development)
```
2026-02-17T09:40:35.123Z  INFO [main] c.l.LocalcartApplication : Starting LocalcartApplication
```

### JSON Format (Production)
```json
{
  "@timestamp": "2026-02-17T09:40:35.123Z",
  "@version": "1",
  "message": "Starting LocalcartApplication",
  "logger_name": "com.localcart.LocalcartApplication",
  "thread_name": "main",
  "level": "INFO",
  "level_value": 20000,
  "application": "localcart",
  "service": "localcart",
  "env": "dev"
}
```

## 🔐 Important Notes

1. **Never commit logs to Git** - They may contain sensitive information
2. **Log rotation enabled** - Old logs are automatically compressed
3. **JSON format** - Makes logs easy to parse and analyze
4. **MDC fields** - trace_id, span_id, userId for distributed tracing

## 📚 Additional Resources

- [Spring Boot Logging Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.logging)
- [Logback Configuration](https://logback.qos.ch/manual/configuration.html)
- [Logstash Encoder](https://github.com/logfellow/logstash-logback-encoder)

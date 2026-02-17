#!/bin/bash

# LocalCart Log Analysis Script
# Analyzes application logs and provides a summary

LOG_DIR="logs"
STARTUP_LOG="$LOG_DIR/application-startup.log"
JSON_LOG="$LOG_DIR/localcart.json"
ERROR_LOG="$LOG_DIR/error-analysis.log"

echo "========================================="
echo "LocalCart Log Analysis"
echo "========================================="
echo "Analysis Date: $(date)"
echo ""

# Check if logs exist
if [ ! -f "$STARTUP_LOG" ]; then
    echo "⚠ No startup log found at $STARTUP_LOG"
    echo "   Run the application first: ./start-backend.sh"
    exit 1
fi

# Create error analysis log
> "$ERROR_LOG"

echo "📊 Log File Statistics"
echo "========================================="
echo "Startup Log: $STARTUP_LOG"
echo "  - Size: $(du -h $STARTUP_LOG | cut -f1)"
echo "  - Lines: $(wc -l < $STARTUP_LOG)"
echo ""

# Count log levels
echo "📈 Log Level Summary"
echo "========================================="
echo "ERROR:   $(grep -c '"level":"ERROR"' $STARTUP_LOG 2>/dev/null || grep -c 'ERROR' $STARTUP_LOG)"
echo "WARN:    $(grep -c '"level":"WARN"' $STARTUP_LOG 2>/dev/null || grep -c 'WARN' $STARTUP_LOG)"
echo "INFO:    $(grep -c '"level":"INFO"' $STARTUP_LOG 2>/dev/null || grep -c 'INFO' $STARTUP_LOG)"
echo "DEBUG:   $(grep -c '"level":"DEBUG"' $STARTUP_LOG 2>/dev/null || grep -c 'DEBUG' $STARTUP_LOG)"
echo ""

# Find errors
echo "🔴 Error Analysis"
echo "========================================="
ERROR_COUNT=$(grep -c 'ERROR' $STARTUP_LOG)
if [ $ERROR_COUNT -gt 0 ]; then
    echo "Found $ERROR_COUNT errors in logs"
    echo ""
    echo "Top Errors:"
    echo "----------"
    grep -i "error\|exception" $STARTUP_LOG | grep -v "no error" | head -10 >> "$ERROR_LOG"
    grep -i "error\|exception" $STARTUP_LOG | grep -v "no error" | head -10
    echo ""
    echo "Full error details saved to: $ERROR_LOG"
else
    echo "✅ No errors found in logs!"
fi
echo ""

# Check for common issues
echo "🔍 Common Issue Detection"
echo "========================================="

# Database connection
if grep -q "password authentication failed" $STARTUP_LOG; then
    echo "⚠ DATABASE AUTHENTICATION FAILED"
    echo "   Issue: Cannot connect to PostgreSQL"
    echo "   Solution: Check .env file and restart database"
    echo "   Commands:"
    echo "     docker-compose down -v"
    echo "     docker-compose --env-file .env up -d postgres redis"
fi

# Port in use
if grep -q "Port.*already in use\|Address already in use" $STARTUP_LOG; then
    echo "⚠ PORT ALREADY IN USE"
    echo "   Issue: Port 8080 is occupied"
    echo "   Solution: Kill the process using port 8080"
    echo "   Command: lsof -i :8080 | grep LISTEN"
fi

# Connection refused
if grep -q "Connection refused" $STARTUP_LOG; then
    echo "⚠ CONNECTION REFUSED"
    echo "   Issue: Cannot connect to database or Redis"
    echo "   Solution: Ensure Docker services are running"
    echo "   Command: docker-compose ps"
fi

# Redis connection
if grep -q "Redis.*connect\|RedisConnectionException" $STARTUP_LOG; then
    echo "⚠ REDIS CONNECTION FAILED"
    echo "   Issue: Cannot connect to Redis"
    echo "   Solution: Start Redis container"
    echo "   Command: docker-compose up -d redis"
fi

# Email configuration
if grep -q "mail.*authentication failed\|SMTP.*failed" $STARTUP_LOG; then
    echo "⚠ EMAIL CONFIGURATION ISSUE"
    echo "   Issue: SMTP authentication failed"
    echo "   Solution: Check SMTP credentials in .env"
    echo "   Note: Email is optional for development"
fi

echo ""

# Check if application started successfully
echo "✅ Application Status"
echo "========================================="
if grep -q "Started LocalcartApplication" $STARTUP_LOG; then
    echo "✅ Application started successfully!"
    echo ""
    UPTIME=$(grep "Started LocalcartApplication" $STARTUP_LOG | tail -1)
    echo "$UPTIME"
    echo ""
    echo "🌐 Access Points:"
    echo "   API: http://localhost:8080"
    echo "   Swagger: http://localhost:8080/swagger-ui.html"
    echo "   Health: http://localhost:8080/actuator/health"
elif grep -q "Application run failed" $STARTUP_LOG; then
    echo "❌ Application failed to start"
    echo ""
    echo "Last error:"
    grep -A 5 "Application run failed" $STARTUP_LOG | tail -10
else
    echo "⏳ Application status unknown (may still be starting)"
fi
echo ""

# Recent logs
echo "📜 Recent Log Entries (Last 10 lines)"
echo "========================================="
tail -10 $STARTUP_LOG
echo ""

echo "========================================="
echo "Analysis Complete"
echo "========================================="
echo ""
echo "💡 Tips:"
echo "  - View full logs: cat logs/application-startup.log"
echo "  - Follow live logs: tail -f logs/application-startup.log"
echo "  - Search errors: grep ERROR logs/application-startup.log"
echo "  - Restart app: ./start-backend.sh"
echo ""

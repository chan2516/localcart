#!/bin/bash
# Quick status check for LocalCart application

echo "🚀 LocalCart - Quick Status Check"
echo "=================================="
echo ""

# Check Docker services
echo "📦 Docker Services:"
if docker ps | grep -q localcart-postgres; then
    echo "  ✅ PostgreSQL - Running"
else
    echo "  ❌ PostgreSQL - Stopped"
fi

if docker ps | grep -q localcart-redis; then
    echo "  ✅ Redis - Running"
else
    echo "  ❌ Redis - Stopped"
fi
echo ""

# Check backend
echo "🖥️  Backend Application:"
if ps aux | grep -q "[s]pring-boot:run"; then
    echo "  ✅ Running"
    # Get health status
    if curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
        echo "  ✅ Responding to requests"
        echo "  🌐 API: http://localhost:8080"
        echo "  📚 Swagger: http://localhost:8080/swagger-ui.html"
    else
        echo "  ⚠️  Process running but not responding yet"
    fi
else
    echo "  ❌ Not running"
    echo "  💡 Start with: ./start-backend.sh"
fi
echo ""

# Check logs
echo "📝 Latest Logs:"
if [ -f logs/application-startup.log ]; then
    ERROR_COUNT=$(grep -c 'ERROR' logs/application-startup.log 2>/dev/null || echo 0)
    if [ $ERROR_COUNT -gt 0 ]; then
        echo "  ⚠️  $ERROR_COUNT errors in logs"
        echo "  💡 Run: ./analyze-logs.sh"
    else
        echo "  ✅ No errors"
    fi
else
    echo "  ℹ️  No logs yet"
fi
echo ""

echo "=================================="
echo "💡 Quick Commands:"
echo "  Start backend: ./start-backend.sh"
echo "  Analyze logs: ./analyze-logs.sh"
echo "  View logs: tail -f logs/application-startup.log"
echo "  Test API: curl http://localhost:8080/actuator/health"

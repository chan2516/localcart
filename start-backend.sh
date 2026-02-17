#!/bin/bash

# LocalCart Backend Startup Script with Logging
# This script starts the Spring Boot application and captures all logs

echo "========================================="
echo "Starting LocalCart Backend Application"
echo "========================================="
echo "Date: $(date)"
echo ""

# Load environment variables
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    export $(cat .env | grep -v '^#' | xargs)
    echo "✓ Environment variables loaded"
else
    echo "⚠ Warning: .env file not found. Using defaults."
fi

# Create logs directory
mkdir -p logs
echo "✓ Logs directory created/verified"

# Check if Docker services are running
echo ""
echo "Checking Docker services..."
if docker ps | grep -q localcart-postgres; then
    echo "✓ PostgreSQL is running"
else
    echo "✗ PostgreSQL is not running"
    echo "  Starting PostgreSQL..."
    docker-compose up -d postgres
    sleep 5
fi

if docker ps | grep -q localcart-redis; then
    echo "✓ Redis is running"
else
    echo "✗ Redis is not running"
    echo "  Starting Redis..."
    docker-compose up -d redis
    sleep 2
fi

echo ""
echo "========================================="
echo "Starting Spring Boot Application..."
echo "========================================="
echo "Logs will be saved to:"
echo "  - logs/application-startup.log (full output)"
echo "  - logs/localcart.json (JSON format)"
echo "  - Console (real-time)"
echo ""
echo "Press Ctrl+C to stop the application"
echo ""

# Start the application with logging
./mvnw spring-boot:run 2>&1 | tee logs/application-startup.log

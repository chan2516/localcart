# Docker Troubleshooting & Running Guide

## Quick Start Checklist

- [ ] Docker is installed (`docker --version`)
- [ ] Docker Compose is installed (`docker-compose --version`)
- [ ] `.env` file exists in project root
- [ ] `.env` has correct database credentials
- [ ] PostgreSQL container is running and healthy
- [ ] Application JAR is built (`mvn clean package`)

---

## Step-by-Step: Running Everything

### 1. Prepare the Environment

```bash
# Navigate to project directory
cd /workspaces/localcart

# Verify .env file exists and has correct values
cat .env
# Look for:
# - DB_HOST=postgres (not localhost!)
# - POSTGRES_PASSWORD
# - JWT_SECRET
```

### 2. Start Docker Services

```bash
# Start all services in background
docker-compose up -d

# Wait 10 seconds for services to initialize
sleep 10

# Check if all services are running
docker-compose ps
```

**Expected Status:**
```
NAME                        STATUS
localcart-postgres          Up (healthy)
localcart-redis             Up (healthy)
localcart-n8n               Up
localcart-prometheus        Up
localcart-grafana           Up
localcart-adminer           Up
```

### 3. Verify PostgreSQL Health

```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Test connection
docker exec localcart-postgres pg_isready -U localcart -d localcart

# You should see: accepting connections
```

### 4. Build the Application

```bash
# Build without tests (faster)
./mvnw clean package -DskipTests

# OR with tests (slower but validates everything)
./mvnw clean package

# Check if JAR was created
ls -lh target/localcart-0.0.1-SNAPSHOT.jar
```

### 5. Run the Application

#### Option A: Maven (Recommended for Development)

```bash
./mvnw spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"
```

#### Option B: Run JAR Directly

```bash
java -jar target/localcart-0.0.1-SNAPSHOT.jar --spring.profiles.active=dev
```

#### Option C: Run in Docker Container

First, create `Dockerfile`:
```dockerfile
FROM openjdk:17-slim
WORKDIR /app
COPY target/localcart-0.0.1-SNAPSHOT.jar app.jar
ENV SPRING_PROFILES_ACTIVE=dev
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
```

Then run:
```bash
# Build image
docker build -t localcart-backend:latest .

# Run container
docker run \
  --env-file .env \
  --network localcart-network \
  -p 8080:8080 \
  --name localcart-app \
  localcart-backend:latest
```

### 6. Verify Application is Running

```bash
# Quick health check
curl http://localhost:8080/actuator/health

# Should respond with: {"status":"UP"}

# List all endpoints
curl http://localhost:8080/actuator/env | grep PORT
```

---

## Docker Common Commands

### View Logs

```bash
# View logs for specific service
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f adminer

# View logs for running app (if in container)
docker logs -f localcart-app
```

### Interact with Database

```bash
# Connect to PostgreSQL CLI
docker exec -it localcart-postgres psql -U localcart -d localcart

# Commands inside psql:
# \dt                  - list tables
# \d users             - describe users table
# SELECT * FROM users; - query users
# \q                   - quit
```

### Stop Services

```bash
# Stop all services (keep volumes)
docker-compose stop

# Stop and remove all services (keep volumes)
docker-compose down

# Stop and remove everything including volumes
docker-compose down -v
```

### Restart Services

```bash
# Restart a specific service
docker-compose restart postgres
docker-compose restart redis

# Restart all services
docker-compose restart
```

### Remove and Recreate

```bash
# Remove all containers and volumes
docker-compose down -v

# Rebuild services
docker-compose up -d

# Recreate a specific service
docker-compose up -d --force-recreate postgres
```

---

## Troubleshooting by Error Message

### Error 1: "Connection Refused" to PostgreSQL

**Error Message:**
```
org.postgresql.util.PSQLException: Connection to localhost:5432 refused
```

**Cause:** `DB_HOST=localhost` but PostgreSQL is in Docker

**Solution:**
```bash
# Update .env
DB_HOST=postgres  # NOT localhost!

# Restart application
```

### Error 2: "Could Not Find Eligible Postgres Connection"

**Error Message:**
```
No suitable PostgreSQL driver found for the specified database type
```

**Solution:**
```bash
# Make sure pom.xml has PostgreSQL driver
grep -A 2 "postgresql" pom.xml

# If not found, rebuild
./mvnw clean package -DskipTests
```

### Error 3: "No Matching Manifest for AMD64"

**When:** Running on M1/M2 Mac

**Solution:**
```bash
# Use architecture-specific image
docker pull --platform linux/amd64 postgres:15-alpine
```

### Error 4: "Port Already in Use"

**Error Message:**
```
Address already in use: 0.0.0.0:5432
```

**Solution:**
```bash
# Find what's using the port
lsof -i :5432

# Kill the process
kill -9 <PID>

# OR use different port in docker-compose.yml
# Change: "5432:5432" to "5433:5432"
```

### Error 5: "Flyway Migration Failed"

**Error Message:**
```
org.flywaydb.core.internal.command.DbValidate$ValidateResult
```

**Cause:** Schema mismatch between code and database

**Solution:**
```bash
# Option 1: Reset database
docker-compose down -v
docker-compose up -d
./mvnw clean package -DskipTests

# Option 2: Manual reset
docker exec localcart-postgres psql -U localcart -d localcart << EOF
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO localcart;
EOF

# Then restart application
```

### Error 6: "JWT Token Invalid" (401 Unauthorized)

**Cause:** JWT_SECRET missing or incorrect

**Solution:**
```bash
# Check .env
grep JWT_SECRET .env

# Should be set and same across restarts

# Generate new secret if needed
openssl rand -base64 32

# Update .env
JWT_SECRET=<new-value>

# Restart application
```

### Error 7: "Maven Build Fails"

**Error Message:**
```
BUILD FAILURE
```

**Solution:**
```bash
# Check Java version (needs 17+)
java -version

# Clear Maven cache
rm -rf ~/.m2/repository

# Try build again with verbose output
./mvnw clean package -DskipTests -X

# Check for specific errors in output
```

### Error 8: "Redis Connection Failed"

**Error Message:**
```
redis.clients.jedis.exceptions.JedisConnectionException
```

**Solution:**
```bash
# Restart Redis
docker-compose restart redis

# Check Redis logs
docker-compose logs redis

# Test Redis connection
docker exec localcart-redis redis-cli ping
# Should respond: PONG
```

---

## Performance Tips

### Build Faster

```bash
# Skip tests during build
./mvnw clean package -DskipTests

# Use parallel builds
./mvnw -T 4 clean package -DskipTests

# Use daemon mode
./mvnw -DskipTests -T 1C clean package
```

### Reduce Container Memory Usage

Edit `docker-compose.yml`:
```yaml
services:
  postgres:
    deploy:
      resources:
        limits:
          memory: 512M  # Limit to 512MB
        reservations:
          memory: 256M
```

### Enable Development Hot Reload

```bash
# Use Spring Boot DevTools
./mvnw spring-boot:run -Dspring-boot.run.arguments="--spring.devtools.restart.enabled=true"

# Changes to files will auto-reload the app
```

---

## Health Monitoring

### Check Application Health

```bash
# Full health check with all details
curl http://localhost:8080/actuator/health

# With details
curl http://localhost:8080/actuator/health/liveness
curl http://localhost:8080/actuator/health/readiness

# Database health
curl -s http://localhost:8080/actuator/health | grep -i db

# Cache health
curl -s http://localhost:8080/actuator/health | grep -i redis
```

### Monitor Metrics

```bash
# Get metrics
curl http://localhost:8080/actuator/metrics

# Get specific metric
curl http://localhost:8080/actuator/metrics/jvm.memory.used

# Get HTTP requests
curl http://localhost:8080/actuator/metrics/http.server.requests
```

### View in Prometheus

```bash
# Open browser
open http://localhost:9090

# Or use curl
curl http://localhost:9090/api/v1/query?query=http_server_requests_seconds_count
```

### View in Grafana

```bash
# Open browser
open http://localhost:3001

# Default credentials
# User: admin
# Password: admin

# Import dashboard or create new one with Prometheus as datasource
```

---

## Database Operations

### Backup Database

```bash
# Create backup
docker-compose exec -T postgres pg_dump -U localcart localcart > backup.sql

# Verify backup
head backup.sql
```

### Restore Database

```bash
# Restore from backup
docker-compose exec -T postgres psql -U localcart localcart < backup.sql
```

### Export Data

```bash
# Export users to CSV
docker-compose exec postgres psql -U localcart -d localcart << EOF
COPY users TO STDOUT WITH CSV HEADER > /tmp/users.csv;
EOF

# Copy out of container
docker cp localcart-postgres:/tmp/users.csv ./users.csv
```

---

## Production Readiness Checklist

- [ ] Remove test data from database
- [ ] Change all default passwords
- [ ] Set strong JWT_SECRET (e.g., `openssl rand -base64 32`)
- [ ] Configure payment gateway with live keys
- [ ] Enable HTTPS/TLS in docker-compose
- [ ] Set resource limits for containers
- [ ] Configure backups for PostgreSQL
- [ ] Set up log aggregation
- [ ] Configure monitoring alerts
- [ ] Enable database encryption
- [ ] Implement rate limiting
- [ ] Set up WAF if needed

---

## Quick Reference: Essential Commands

```bash
# Start everything
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f postgres

# Build app
./mvnw clean package -DskipTests

# Run app
./mvnw spring-boot:run

# Health check
curl http://localhost:8080/actuator/health

# Query database
docker exec -it localcart-postgres psql -U localcart -d localcart

# Stop all
docker-compose down

# Clean up everything
docker-compose down -v
```


# 🚀 LocalCart - Quick Start Commands

## TL;DR - Start Everything (5 minutes)

### Windows/PowerShell
```powershell
# 1. Start database and supporting services
docker-compose up -d

# 2. Build the project
mvnw.cmd clean install

# 3. Run Spring Boot
mvnw.cmd spring-boot:run

# 4. Test the API
curl http://localhost:8080/actuator/health
```

### Linux/Mac
```bash
# 1. Start database and supporting services
docker-compose up -d

# 2. Build the project
./mvnw clean install

# 3. Run Spring Boot
./mvnw spring-boot:run

# 4. Test the API
curl http://localhost:8080/actuator/health
```

---

## Service Ports Reference

| Service | Port | URL |
|---------|------|-----|
| Spring Boot API | 8080 | http://localhost:8080 |
| PostgreSQL DB | 5432 | postgres://localhost:5432 |
| Redis Cache | 6379 | redis://localhost:6379 |
| Adminer (DB GUI) | 8081 | http://localhost:8081 |
| N8N Automation | 5678 | http://localhost:5678 |
| Prometheus | 9090 | http://localhost:9090 |
| Grafana | 3001 | http://localhost:3001 |
| Loki (Logs) | 3100 | http://localhost:3100 |

---

## Essential Commands

### Docker
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View service status
docker-compose ps

# View logs
docker-compose logs -f [service-name]
# Example:
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Maven (Build/Run)
```bash
# Full build
mvnw clean install

# Run tests
mvnw test

# Start Spring Boot
mvnw spring-boot:run

# Build JAR
mvnw clean package -DskipTests
```

### Testing
```bash
# Health check
curl http://localhost:8080/actuator/health

# Full API test suite
bash test_endpoints.sh

# Prometheus metrics
curl http://localhost:8080/actuator/metrics
```

---

## API Testing

### Register User
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get Products (with token)
```bash
curl -X GET http://localhost:8080/api/v1/products \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Database Access

**Adminer Web UI:** http://localhost:8081
- System: PostgreSQL
- Server: postgres
- User: localcart_user
- Password: localcart_password
- Database: localcart

---

## Debugging

### Issue: Port already in use
```bash
docker-compose down
# or kill process on port 8080 (Spring Boot)
```

### Issue: Can't connect to database
```bash
# Check if PostgreSQL is healthy
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Issue: Maven not found
```bash
# Use Maven wrapper
mvnw.cmd clean install        # Windows
./mvnw clean install          # Linux/Mac
```

---

## Environment Setup (.env file)

Create `.env` file in project root:
```env
SPRING_PROFILES_ACTIVE=dev
POSTGRES_DB=localcart
POSTGRES_USER=localcart_user
POSTGRES_PASSWORD=localcart_password
APP_PASSWORD_RESET_URL=http://localhost:3000/reset?token=
```

---

## Full Documentation

For detailed information, see:
- [RUN_AND_TEST_GUIDE.md](RUN_AND_TEST_GUIDE.md) - Complete guide
- [API_QUICK_REFERENCE.md](API_QUICK_REFERENCE.md) - API endpoints
- [BACKEND_READY_FOR_FRONTEND.md](BACKEND_READY_FOR_FRONTEND.md) - Implementation details


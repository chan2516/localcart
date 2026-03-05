# 🚀 LocalCart - Quick Start Commands

## ⚡ EASIEST WAY - Start Everything at Once (Windows)

### **Option 1: Separate Windows (RECOMMENDED)**
This opens Backend and Frontend in separate terminal windows for easy monitoring:

```powershell
.\start-all-simple.ps1
```

### **Option 2: Single Window**
This runs everything in one terminal with combined logs:

```powershell
.\start-all.ps1
```

**What Gets Started:**
- ✅ Docker services (PostgreSQL, Redis, Monitoring)
- ✅ Spring Boot Backend (port 8080)
- ✅ Next.js Frontend (port 3000)

**Access URLs after startup:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- API Health: http://localhost:8080/actuator/health

---

## Manual Start (Step-by-Step)

### Windows/PowerShell
```powershell
# 1. Start infrastructure services
docker-compose up -d

# 2. Install frontend dependencies (first time only)
cd frontend
npm install
cd ..

# 3. Build backend
mvnw.cmd clean install

# 4. Start backend (in one terminal)
mvnw.cmd spring-boot:run

# 5. Start frontend (in another terminal)
cd frontend
npm run dev

# 6. Test the API
curl http://localhost:8080/actuator/health
```

### Linux/Mac
```bash
# 1. Start infrastructure services
docker-compose up -d

# 2. Install frontend dependencies (first time only)
cd frontend
npm install
cd ..

# 3. Build backend
./mvnw clean install

# 4. Start backend (in one terminal)
./mvnw spring-boot:run

# 5. Start frontend (in another terminal)
cd frontend
npm run dev

# 6. Test the API
curl http://localhost:8080/actuator/health
```

---

## 📊 Service Ports Reference

| Service | Port | URL | Credentials |
|---------|------|-----|-------------|
| **Next.js Frontend** | 3000 | http://localhost:3000 | - |
| **Spring Boot API** | 8080 | http://localhost:8080 | - |
| PostgreSQL DB | 5432 | postgres://localhost:5432 | localcart/localcart |
| Redis Cache | 6379 | redis://localhost:6379 | - |
| Adminer (DB GUI) | 8081 | http://localhost:8081 | localcart/localcart |
| N8N Automation | 5678 | http://localhost:5678 | admin/changeme123 |
| Prometheus | 9090 | http://localhost:9090 | - |
| Grafana | 3001 | http://localhost:3001 | admin/admin |
| Loki (Logs) | 3100 | http://localhost:3100 | - |

---
🛑 Stop All Services

### Windows
```powershell
# If using start-all-simple.ps1:
# Close the Backend and Frontend PowerShell windows, then:
docker-compose down

# If using start-all.ps1:
# Press Ctrl+C in the terminal, services will stop automatically
```

### Linux/Mac
```bash
# Stop all running processes (Ctrl+C in each terminal), then:
docker-compose down
```

---

## Essential Commands

### Frontend (Next.js)
```bash
cd frontend

# Development mode (with hot reload)
npm run dev

# Production build
npm run build

# Start production server
npm start
```
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


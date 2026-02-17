# 📊 LocalCart - Complete Testing & Running Guide Overview

## 🎯 What You Need to Know

Your **LocalCart backend** is a fully functional Spring Boot 4.0.2 REST API with:

✅ **Complete Authentication** - JWT-based user login/registration  
✅ **Product Management** - CRUD with images and vendor management  
✅ **Shopping Cart** - Full cart operations with stock validation  
✅ **Orders System** - Order creation, tracking, and status updates  
✅ **Vendor Dashboard** - Business analytics and statistics  
✅ **Monitoring** - Prometheus metrics, Loki logs, Grafana dashboards  
✅ **Automation** - N8N integration for workflows  

---

## 🚀 Getting Started (Pick Your Path)

### 👨‍💻 **Path 1: I Want the Quick Version (5 min)**
→ Read: [QUICK_START_COMMANDS.md](QUICK_START_COMMANDS.md)

```bash
# TL;DR:
docker-compose up -d
mvnw.cmd spring-boot:run  # Windows
./mvnw spring-boot:run    # Linux/Mac
curl http://localhost:8080/actuator/health
```

---

### 📚 **Path 2: I Want Details (30 min)**
→ Read: [RUN_AND_TEST_GUIDE.md](RUN_AND_TEST_GUIDE.md)

Complete guide covering:
- Prerequisites and environment setup
- Docker Compose configuration
- Step-by-step startup instructions
- Health checks and verification
- Database access (Adminer)
- Monitoring setup (Prometheus/Grafana)
- Troubleshooting

---

### 🧪 **Path 3: I Want to Test Endpoints (1 hour)**
→ Read: [TEST_SCENARIOS.md](TEST_SCENARIOS.md)

Practical examples covering:
- Authentication flow (register, login, refresh tokens)
- Vendor setup and product management
- Shopping cart operations
- Order creation and tracking
- Dashboard access
- Running automated test suite
- Troubleshooting failed tests

---

### 💻 **Path 4: I Want API Reference (Reference)**
→ Read: [API_QUICK_REFERENCE.md](API_QUICK_REFERENCE.md)

Complete API documentation with:
- All endpoints
- Request/response schemas
- Authentication requirements
- Error codes
- Status codes

---

## 📋 Startup Checklist

### Before Starting
- [ ] Java 17+ installed: `java -version`
- [ ] Maven installed: `mvn -version`
- [ ] Docker installed: `docker --version`
- [ ] Docker Compose: `docker-compose --version`
- [ ] curl installed: `curl --version` (for testing)

### Startup Steps
```bash
# 1. Create .env file (copy from RUN_AND_TEST_GUIDE.md)
# 2. Start Docker containers
docker-compose up -d

# 3. Wait for services to be healthy (30-60 seconds)
docker-compose ps

# 4. Build project
mvnw clean install

# 5. Run Spring Boot
mvnw spring-boot:run

# 6. Verify health
curl http://localhost:8080/actuator/health
```

---

## 🗺️ Service Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser/Postman)             │
└────────────────┬────────────────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    ▼                         ▼
Spring Boot API         Next.js Frontend
:8080/api/v1            :3000
    │
    ├─► PostgreSQL        Redis Cache
    │   :5432            :6379
    │
    ├─► Adminer (DB GUI)
    │   :8081
    │
    └─► Supporting Services:
        ├─ N8N Automation    :5678
        ├─ Prometheus        :9090
        ├─ Grafana Dashboard :3001
        └─ Loki Logs         :3100
```

---

## 🔌 Critical Ports

| Component | Port | Purpose | Access |
|-----------|------|---------|--------|
| **Spring Boot** | 8080 | Main API | http://localhost:8080 |
| **PostgreSQL** | 5432 | Database | localhost:5432 |
| **Redis** | 6379 | Cache | localhost:6379 |
| **Adminer** | 8081 | DB GUI | http://localhost:8081 |
| **N8N** | 5678 | Automation | http://localhost:5678 |
| **Prometheus** | 9090 | Metrics | http://localhost:9090 |
| **Grafana** | 3001 | Dashboards | http://localhost:3001 |
| **Loki** | 3100 | Logs | http://localhost:3100 |

---

## 🧪 Testing Strategy

### Level 1: Health Check (2 minutes)
```bash
curl http://localhost:8080/actuator/health
```

### Level 2: Manual API Testing (15 minutes)
```bash
# Register user
curl -X POST http://localhost:8080/api/v1/auth/register ...

# Login
curl -X POST http://localhost:8080/api/v1/auth/login ...

# Get products
curl -H "Authorization: Bearer TOKEN" http://localhost:8080/api/v1/products
```

### Level 3: Automated Test Suite (5 minutes)
```bash
bash test_endpoints.sh
```

Automatically tests:
- Health status
- User registration
- Authentication
- All product endpoints
- Cart operations
- Order processing
- Dashboard access

---

## 📊 Monitoring & Observability

### System Metrics (Prometheus)
```
http://localhost:9090
- JVM metrics
- Application metrics
- HTTP request metrics
- Custom business metrics
```

### Visual Dashboards (Grafana)
```
http://localhost:3001
- Pre-built dashboards
- Custom alerts
- Real-time monitoring
Credentials: admin/admin
```

### Application Logs (Loki)
```
http://localhost:3100
- Centralized logging
- Log visualization
- Log querying
```

### Database GUI (Adminer)
```
http://localhost:8081
- View database tables
- Execute queries
- Data manipulation
Credentials: See RUN_AND_TEST_GUIDE.md
```

---

## 🔐 Authentication Details

### Token Types
- **Access Token**: Short-lived (default: 15 minutes), used for API calls
- **Refresh Token**: Long-lived (default: 7 days), used to get new access token

### Usage
```bash
# Get tokens
curl -X POST http://localhost:8080/api/v1/auth/login \
  -d '{"email":"test@example.com","password":"password123"}'

# Use in requests
curl -H "Authorization: Bearer {accessToken}" \
  http://localhost:8080/api/v1/protected-endpoint

# Refresh when expired
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -d '{"refreshToken":"{refreshToken}"}'
```

---

## 🐛 Common Issues & Solutions

| Issue | Solution | Reference |
|-------|----------|-----------|
| Port already in use | `docker-compose down` | [RUN_AND_TEST_GUIDE.md](RUN_AND_TEST_GUIDE.md#troubleshooting) |
| Can't connect to database | Check postgres logs: `docker-compose logs postgres` | [RUN_AND_TEST_GUIDE.md](RUN_AND_TEST_GUIDE.md#troubleshooting) |
| 401 Unauthorized errors | Missing/invalid token, regenerate with `/auth/login` | [TEST_SCENARIOS.md](TEST_SCENARIOS.md#troubleshooting-tests) |
| Maven command not found | Use wrapper: `mvnw.cmd` (Windows) or `./mvnw` (Mac/Linux) | [QUICK_START_COMMANDS.md](QUICK_START_COMMANDS.md) |
| Application won't start | Check Java version, Maven version, and logs | [RUN_AND_TEST_GUIDE.md](RUN_AND_TEST_GUIDE.md#troubleshooting) |

---

## 📈 Project Structure

```
localcart/
├── src/
│   ├── main/
│   │   ├── java/com/localcart/
│   │   │   ├── controller/       # REST API endpoints
│   │   │   ├── service/          # Business logic
│   │   │   ├── entity/           # Database models
│   │   │   ├── dto/              # Data transfer objects
│   │   │   ├── security/         # JWT & authentication
│   │   │   └── config/           # Spring configuration
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── db/migration/     # Flyway migrations
│   │       └── logback-spring.xml
│   └── test/                     # Unit tests
│
├── frontend/                     # Next.js React frontend
│   └── src/
│
├── monitoring/                   # Prometheus, Grafana, Loki config
├── pom.xml                       # Maven configuration
├── docker-compose.yml            # Docker services
└── test_endpoints.sh             # Automated test script
```

---

## 🎯 What's Ready for Frontend

✅ **Authentication**: Full JWT-based auth system ready  
✅ **Products API**: Complete list, search, detail endpoints  
✅ **Cart API**: Full cart operations with stock validation  
✅ **Orders API**: Order creation, tracking, status updates  
✅ **Vendor API**: Vendor registration and profile management  
✅ **Images**: Product images fully integrated  
✅ **Pagination**: All list endpoints support pagination  
✅ **Search/Filter**: Product search with multiple filters  
✅ **Stock Management**: Real-time stock validation  
✅ **Error Handling**: Comprehensive error responses  

---

## 🚀 Next Steps

### For Frontend Development
1. Connect Next.js to `http://localhost:8080/api/v1`
2. Use tokens from `/auth/login` endpoint
3. Reference [API_QUICK_REFERENCE.md](API_QUICK_REFERENCE.md) for all endpoints
4. Use [TEST_SCENARIOS.md](TEST_SCENARIOS.md) for endpoint examples

### For API Enhancement
1. See [BACKEND_READY_FOR_FRONTEND.md](BACKEND_READY_FOR_FRONTEND.md) for completed features
2. Check [IMPLEMENTATION_STATUS_REPORT.md](IMPLEMENTATION_STATUS_REPORT.md) for roadmap

### For Deployment
1. Follow [QUICK_START_GUIDE.md](QUICK_START_GUIDE.md) for deployment steps
2. Configure Docker for production environment
3. Set up CI/CD pipeline with GitHub Actions

---

## 📞 Quick Reference Links

| Document | Purpose | Duration |
|----------|---------|----------|
| [QUICK_START_COMMANDS.md](QUICK_START_COMMANDS.md) | Fast startup | 5 min |
| [RUN_AND_TEST_GUIDE.md](RUN_AND_TEST_GUIDE.md) | Complete guide | 30 min |
| [TEST_SCENARIOS.md](TEST_SCENARIOS.md) | Endpoint testing | 1 hour |
| [API_QUICK_REFERENCE.md](API_QUICK_REFERENCE.md) | Complete API ref | Reference |
| [BACKEND_READY_FOR_FRONTEND.md](BACKEND_READY_FOR_FRONTEND.md) | What's done | Reference |

---

## ✅ Verification Checklist

Run this to verify everything is working:

```bash
# 1. Check Docker
docker-compose ps

# 2. Check Spring Boot
curl http://localhost:8080/actuator/health

# 3. Check Database
curl -X GET http://localhost:8080/api/v1/products

# 4. Check Authentication
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# 5. Run test suite
bash test_endpoints.sh
```

All returning valid responses? **You're ready to go!** 🎉

---

## 📝 Notes

- **Default Profile**: `dev` (set in application.properties)
- **Database**: PostgreSQL (configured in docker-compose.yml)
- **Java Version**: 17+
- **Maven**: Can use system Maven or included wrapper (mvnw)
- **Port**: 8080 (configurable in application.properties)


# 🚀 LocalCart Backend - Run & Test Guide

## Quick Overview
Your LocalCart project is a **Spring Boot 4.0.2** REST API backend with:
- PostgreSQL database (configured via docker-compose)
- Redis for caching
- JWT-based authentication
- N8N for automation
- Prometheus/Loki for monitoring

---

## 📋 Prerequisites

### Before you start, ensure you have:
1. **Java 17+** installed
   ```bash
   java -version
   ```
2. **Maven 3.6+** installed
   ```bash
   mvn -version
   ```
3. **Docker & Docker Compose** installed (for database + services)
   ```bash
   docker --version
   docker-compose --version
   ```
4. **curl** or **Postman** for testing API endpoints

---

## 🗄️ Method 1: Using Docker Compose (Recommended - Full Setup)

### Step 1: Create .env file
Create a `.env` file in the root directory:
```env
SPRING_PROFILES_ACTIVE=dev
POSTGRES_DB=localcart
POSTGRES_USER=localcart_user
POSTGRES_PASSWORD=localcart_password
APP_PASSWORD_RESET_URL=http://localhost:3000/reset?token=
N8N_WEBHOOK_URL=http://n8n:5678/webhook
N8N_WEBHOOK_ENABLED=true
AUTOMATION_ENABLED=true
LOW_STOCK_THRESHOLD=10
ABANDONED_CART_HOURS=24
REVIEW_REQUEST_DAYS=7
```

### Step 2: Build the Backend (Maven)
```bash
# Clean and build
mvn clean package -DskipTests

# Or just compile without building jar
mvn clean install
```

### Step 3: Start Docker Services
```bash
# Start all services (PostgreSQL, Redis, N8N, Prometheus, Adminer, etc.)
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Step 4: Start Spring Boot Application
```bash
# Option A: Using Maven
mvn spring-boot:run

# Option B: Using JAR
java -jar target/localcart-0.0.1-SNAPSHOT.jar

# Option C: Using IDE (VS Code/IntelliJ) - Simply run the main class
```

**Expected Output:**
```
Started LocalcartApplication in X.XXX seconds (JVM running for X.XXX)
```

### Step 5: Verify API is Running
```bash
# Health check
curl http://localhost:8080/actuator/health

# Should return:
{
  "status": "UP"
}
```

---

## 🗄️ Method 2: Quick Start (Minimal - Without Docker)

If you want to run just the backend without full Docker setup:

### Step 1: Configure application.properties
The default profile should work. If needed, edit:
```properties
# src/main/resources/application.properties
spring.profiles.active=dev
```

### Step 2: Start Only Core Services (PostgreSQL + Redis)
```bash
# Start only PostgreSQL and Redis
docker-compose up -d postgres redis

# Or use alternative databases
# You can use H2 in-memory for quick testing (no database needed)
```

### Step 3: Run Spring Boot
```bash
mvn spring-boot:run
```

---

## 🧪 Testing the API

### Quick Test - Health & Info Endpoints
```bash
# Health check
curl http://localhost:8080/actuator/health

# Application info
curl http://localhost:8080/actuator/info

# Metrics
curl http://localhost:8080/actuator/metrics
```

### Using the Provided Test Script
```bash
# Option 1: Run the full test suite
bash test_endpoints.sh

# This will:
# 1. Check API health
# 2. Register a test user
# 3. Login to get tokens
# 4. Test all endpoints (products, cart, orders, etc.)
# 5. Generate a test report
```

### Manual Testing with cURL

#### 1. Register User
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

#### 2. Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123"
  }'

# Response will include accessToken and refreshToken
# Save the accessToken for next requests
```

#### 3. Get Products (using token)
```bash
curl -X GET http://localhost:8080/api/v1/products \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 4. Create Product (Vendor only)
```bash
curl -X POST http://localhost:8080/api/v1/products \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "description": "A test product",
    "price": 99.99,
    "categoryId": 1,
    "imageUrls": ["https://example.com/image.jpg"]
  }'
```

### Using Postman
1. Import the API from [API_QUICK_REFERENCE.md](API_QUICK_REFERENCE.md)
2. Set token in Authorization header
3. Test endpoints

---

## 📊 Using Adminer (Database GUI)

Once Docker is running:
1. Open: http://localhost:8081
2. Login with:
   - System: PostgreSQL
   - Server: postgres
   - User: localcart_user
   - Password: localcart_password
   - Database: localcart

---

## 📈 Monitoring & Logs

### View Application Logs
```bash
# Real-time logs
docker-compose logs -f spring-boot

# Or from IDE console
```

### Prometheus Metrics
- URL: http://localhost:9090
- View metrics, create dashboards

### Application Endpoints
```bash
# Health endpoint
GET http://localhost:8080/actuator/health

# Detailed health info
GET http://localhost:8080/actuator/health/liveness
GET http://localhost:8080/actuator/health/readiness

# Metrics
GET http://localhost:8080/actuator/metrics

# Prometheus format
GET http://localhost:8080/actuator/prometheus

# Environment info
GET http://localhost:8080/actuator/env
```

---

## 🛑 Stopping Services

```bash
# Stop Docker containers
docker-compose down

# Stop and remove volumes (data)
docker-compose down -v

# Kill Spring Boot (Ctrl+C in the terminal)
```

---

## 🐛 Troubleshooting

### Issue: "Port 5432 already in use"
```bash
# Kill existing PostgreSQL process
docker-compose down
# Or change port in docker-compose.yml
```

### Issue: "Connection refused" when running Spring Boot
```bash
# Make sure Docker services are running
docker-compose ps

# Check if PostgreSQL is healthy
docker-compose logs postgres
```

### Issue: "Maven command not found"
```bash
# Use the Maven wrapper (already included)
# On Windows:
mvnw.cmd clean install

# On Linux/Mac:
./mvnw clean install
```

### Issue: "No authority with granted authority role..." error
This means you don't have proper user setup. Run the test_endpoints.sh to auto-create test data.

---

## 📚 API Endpoints Reference

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get tokens
- `POST /api/v1/auth/refresh` - Refresh access token

### Products
- `GET /api/v1/products` - List all products
- `GET /api/v1/products/{id}` - Get product by ID
- `GET /api/v1/products/search` - Search products
- `POST /api/v1/products` - Create product (vendor only)
- `PUT /api/v1/products/{id}` - Update product (vendor only)
- `DELETE /api/v1/products/{id}` - Delete product (vendor only)

### Cart
- `GET /api/v1/cart` - Get user's cart
- `POST /api/v1/cart/items` - Add item to cart
- `PUT /api/v1/cart/items/{itemId}` - Update cart item
- `DELETE /api/v1/cart/items/{itemId}` - Remove from cart
- `DELETE /api/v1/cart` - Clear cart

### Orders
- `GET /api/v1/orders` - Get user's orders
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders/{id}` - Get order details
- `PUT /api/v1/orders/{id}/status` - Update order status

### Vendors
- `POST /api/v1/vendors/register` - Register as vendor
- `GET /api/v1/vendors/profile` - Get vendor profile
- `PUT /api/v1/vendors/profile` - Update vendor profile
- `GET /api/v1/vendors/dashboard` - Get vendor dashboard

For complete endpoint reference, see [API_QUICK_REFERENCE.md](API_QUICK_REFERENCE.md)

---

## ✅ Verification Checklist

After startup, verify:
- [ ] Health check returns `"status": "UP"`
- [ ] PostgreSQL connected (Adminer accessible at :8081)
- [ ] Redis running (`docker-compose ps` shows redis as UP)
- [ ] Can register user via `/auth/register`
- [ ] Can login and receive tokens
- [ ] Can fetch products list
- [ ] Can create product as vendor

---

## 🎯 Next Steps

1. **For Frontend Development**: Connect your Next.js frontend to `http://localhost:8080/api/v1`
2. **For API Testing**: Use Postman or the test_endpoints.sh script
3. **For Production**: See [IMPLEMENTATION_STATUS_REPORT.md](IMPLEMENTATION_STATUS_REPORT.md)


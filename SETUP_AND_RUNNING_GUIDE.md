# LocalCart - Complete Setup, Configuration & Running Guide

## TABLE OF CONTENTS
1. [Pre-Requirements](#pre-requirements)
2. [Environment Configuration](#environment-configuration)
3. [Docker Setup & Running](#docker-setup--running)
4. [Database Setup & Querying](#database-setup--querying)
5. [Troubleshooting](#troubleshooting)
6. [Complete API Reference](#complete-api-reference)

---

## Pre-Requirements

Before starting, ensure you have:
- ✅ Docker installed
- ✅ Docker Compose installed
- ✅ Java 17+ (for local development)
- ✅ Maven (for building)

---

## Environment Configuration

### Critical: Create `.env` File in Project Root

The application **requires** an `.env` file with the following configuration. This is what's likely missing and causing the app not to run.

**Create file: `/workspaces/localcart/.env`**

```env
# =====================================================
# DATABASE CONFIGURATION
# =====================================================
DB_HOST=postgres
DB_PORT=5432
DB_NAME=localcart
DB_USER=localcart
DB_PASSWORD=localcart_password_123

# PostgreSQL Environment
POSTGRES_DB=localcart
POSTGRES_USER=localcart
POSTGRES_PASSWORD=localcart_password_123

# =====================================================
# REDIS CONFIGURATION
# =====================================================
REDIS_HOST=redis
REDIS_PORT=6379

# =====================================================
# JWT CONFIGURATION
# =====================================================
# IMPORTANT: Change this in production!
# Generate with: openssl rand -base64 32
JWT_SECRET=your-secret-key-change-in-production-base64-encoded-32-bytes

# =====================================================
# SPRING PROFILES
# =====================================================
SPRING_PROFILES_ACTIVE=dev

# =====================================================
# PAYMENT GATEWAY CONFIGURATION
# =====================================================

# STRIPE (if using Stripe)
# Get these from: https://dashboard.stripe.com/apikeys
STRIPE_API_KEY=sk_test_your_test_key_here
STRIPE_PUBLIC_KEY=pk_test_your_public_key_here
STRIPE_WEBHOOK_SECRET=whsec_test_your_webhook_secret_here

# PAYPAL (if using PayPal)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# RAZORPAY (if using Razorpay - Optional)
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Payment Encryption Key (AES-256)
# IMPORTANT: Change in production
PAYMENT_ENCRYPTION_KEY=dev-insecure-key-change-in-production-12345678901234567890

# =====================================================
# EMAIL CONFIGURATION (SMTP)
# =====================================================
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=
SMTP_AUTH=false
SMTP_STARTTLS=false
SMTP_FROM=no-reply@localcart.com

# =====================================================
# APP CONFIGURATION
# =====================================================

# Password Reset Configuration
APP_PASSWORD_RESET_URL=http://localhost:3000/reset?token=

# N8N AUTOMATION CONFIGURATION
N8N_WEBHOOK_URL=http://n8n:5678/webhook
N8N_WEBHOOK_ENABLED=true

# Automation Settings
AUTOMATION_ENABLED=true
LOW_STOCK_THRESHOLD=10
ABANDONED_CART_HOURS=24
REVIEW_REQUEST_DAYS=7

```

### Optional: Environment Variables for Production

```env
# For production deployments
NODE_ENV=production
SPRING_PROFILES_ACTIVE=prod
JWT_SECRET=use-a-strong-256-bit-base64-key
STRIPE_API_KEY=sk_live_your_live_key
PAYMENT_ENCRYPTION_KEY=prod-256-bit-encryption-key
```

---

## Docker Setup & Running

### Step 1: Build the Backend JAR

```bash
cd /workspaces/localcart
./mvnw clean package -DskipTests
```

This creates `target/localcart-0.0.1-SNAPSHOT.jar`

### Step 2: Build Docker Image (Optional)

If you need to build a custom image:

```bash
docker build -t localcart-backend:latest .
```

### Step 3: Start All Services with Docker Compose

```bash
cd /workspaces/localcart

# Start all services (PostgreSQL, Redis, N8N, Prometheus, Grafana, MailHog)
docker-compose up -d

# Wait for services to be healthy (about 30 seconds)
docker-compose ps

# Check service health
docker-compose logs postgres
docker-compose logs redis
```

**Expected Output:**
```
NAME                        STATUS
localcart-postgres          Up (healthy)
localcart-redis             Up (healthy)
localcart-n8n               Up
localcart-prometheus        Up
localcart-grafana           Up
localcart-adminer           Up
```

### Step 4: Run the Spring Boot Application

**Option A: Run using Maven (Development)**
```bash
cd /workspaces/localcart

# Run with dev profile (uses .env file)
./mvnw spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"
```

**Option B: Build and Run JAR**
```bash
cd /workspaces/localcart

# Build
./mvnw clean package -DskipTests

# Run
java -jar target/localcart-0.0.1-SNAPSHOT.jar --spring.profiles.active=dev
```

**Option C: Run in Docker Container**

Create `Dockerfile` in project root (if not exists):
```dockerfile
FROM openjdk:17-slim
COPY target/localcart-0.0.1-SNAPSHOT.jar app.jar
ENV SPRING_PROFILES_ACTIVE=dev
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

Then run:
```bash
docker build -t localcart-backend:latest .
docker run --env-file .env --network localcart-network -p 8080:8080 localcart-backend:latest
```

### Step 5: Verify Application is Running

```bash
# Check if app is running on port 8080
curl http://localhost:8080/actuator/health

# Should respond with:
# {"status":"UP"}
```

### Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| **Backend API** | http://localhost:8080 | N/A |
| **Swagger/OpenAPI** | http://localhost:8080/swagger-ui.html | N/A |
| **Actuator Health** | http://localhost:8080/actuator/health | N/A |
| **Adminer (DB UI)** | http://localhost:8081 | See below |
| **Prometheus** | http://localhost:9090 | N/A |
| **Grafana** | http://localhost:3001 | admin/admin |
| **N8N** | http://localhost:5678 | admin/changeme123 |

---

## Database Setup & Querying

### Adminer Web Interface (Easiest)

**URL:** http://localhost:8081

**Login:**
- System: PostgreSQL
- Server: postgres
- Username: localcart
- Password: localcart_password_123
- Database: localcart

**Actions:**
- Click on table names to view data
- Use "SQL command" tab to run custom queries

### psql Command Line (Direct Access)

```bash
# Connect to PostgreSQL inside Docker
docker exec -it localcart-postgres psql -U localcart -d localcart

# Then run SQL commands:
psql> \dt                    # List all tables
psql> \d users               # Describe 'users' table structure
psql> SELECT * FROM users;   # View all users
psql> SELECT COUNT(*) FROM orders;  # Count orders
```

### Common Database Queries

```sql
-- View all users
SELECT id, email, first_name, last_name, created_at FROM users;

-- View all products
SELECT id, name, price, stock, vendor_id FROM products;

-- View all orders
SELECT 
    id, 
    order_number, 
    user_id, 
    total_amount, 
    status, 
    created_at 
FROM orders;

-- View pending orders
SELECT * FROM orders WHERE status = 'PENDING' ORDER BY created_at DESC;

-- View user payments
SELECT 
    p.id, 
    p.order_number, 
    p.amount, 
    p.status, 
    p.created_at 
FROM payments p 
WHERE p.user_id = 1;

-- Count records by entity
SELECT 'Users' as entity, COUNT(*) as count FROM users
UNION ALL
SELECT 'Products', COUNT(*) FROM products
UNION ALL
SELECT 'Orders', COUNT(*) FROM orders
UNION ALL
SELECT 'Payments', COUNT(*) FROM payments;

-- View database size
SELECT datname, pg_size_pretty(pg_database_size(datname)) 
FROM pg_database 
WHERE datname = 'localcart';
```

### Reset Database (Delete All Data)

```bash
# WARNING: This deletes all data!
docker exec -it localcart-postgres psql -U localcart -d localcart << EOF
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO localcart;
EOF

# Restart application so Flyway recreates tables
```

---

## Troubleshooting

### Issue 1: Application Won't Start

**Symptom:** `Connection refused to PostgreSQL`

**Solution:**
```bash
# 1. Check if containers are running
docker-compose ps

# 2. If not running, start them
docker-compose up -d

# 3. Check container logs
docker-compose logs postgres
docker-compose logs redis

# 4. Ensure .env file exists with correct values
cat .env
```

### Issue 2: "Connection refused" on Port 8080

**Symptom:** `Failed to connect to localhost:8080`

**Solution:**
```bash
# 1. Check if application is running
ps aux | grep java

# 2. Check application logs
tail -f target/logs/application.log

# 3. Try running again
./mvnw spring-boot:run
```

### Issue 3: Database Won't Create Tables

**Symptom:** `SQL error: table "users" does not exist`

**Solution:**
```bash
# 1. Check Flyway migrations
ls -la src/main/resources/db/migration/

# 2. Restart the application (triggers Flyway)
./mvnw spring-boot:run

# 3. Check migration status
docker exec -it localcart-postgres psql -U localcart -d localcart << EOF
SELECT * FROM flyway_schema_history;
EOF
```

### Issue 4: JWT Token Errors

**Symptom:** `401 Unauthorized` on protected endpoints

**Solution:**
```bash
# 1. Check JWT_SECRET is set correctly
grep JWT_SECRET .env

# 2. Generate new secret (if needed)
openssl rand -base64 32

# 3. Update .env with new secret
# 4. Restart application
```

### Issue 5: Port Already in Use

**Symptom:** `Address already in use: 8080`

**Solution:**
```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>

# Or use different port
java -jar target/localcart-0.0.1-SNAPSHOT.jar --server.port=8090
```

### Issue 6: Stripe/Payment Errors

**Symptom:** `Invalid API key` or payment fails

**Solution:**
```bash
# 1. Verify Stripe keys are set
grep STRIPE .env

# 2. Get keys from: https://dashboard.stripe.com/apikeys

# 3. Update .env with correct test keys

# 4. For development, mock gateway is enabled:
#    payment.mock.enabled=true
#    All payments will succeed automatically
```

---

## Complete API Reference

### Authentication Service

#### 1. Register New User

**Endpoint:** `POST /api/v1/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890"
}
```

**Response:** Status 201 Created
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "roles": ["CUSTOMER"],
  "message": "Registration successful, you are now logged in"
}
```

#### 2. Login

**Endpoint:** `POST /api/v1/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** Status 200 OK
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "roles": ["CUSTOMER"],
  "message": "Login successful"
}
```

#### 3. Refresh Token

**Endpoint:** `POST /api/v1/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** Status 200 OK
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "message": "Token refreshed successfully"
}
```

#### 4. Get Current User Profile

**Endpoint:** `GET /api/v1/auth/profile`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:** Status 200 OK
```json
{
  "userId": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "isActive": true,
  "isEmailVerified": false,
  "roles": ["CUSTOMER"]
}
```

#### 5. Forgot Password

**Endpoint:** `POST /api/v1/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:** Status 200 OK
```json
{
  "message": "Reset link sent to your email"
}
```

#### 6. Reset Password

**Endpoint:** `POST /api/v1/auth/reset-password`

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePass123!"
}
```

**Response:** Status 200 OK
```json
{
  "message": "Password has been reset successfully"
}
```

---

### Products Service

#### 1. List Products (Paginated)

**Endpoint:** `GET /api/v1/products?page=0&size=20`

**Query Parameters:**
- `page` (default: 0)
- `size` (default: 20)

**Response:** Status 200 OK
```json
{
  "products": [
    {
      "id": 1,
      "name": "Wireless Headphones",
      "description": "High quality wireless headphones",
      "price": 99.99,
      "stock": 50,
      "sku": "WH-001",
      "vendorId": 1,
      "categoryId": 2,
      "images": ["url1", "url2"],
      "rating": 4.5,
      "reviewCount": 25,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "currentPage": 0,
  "totalItems": 100,
  "totalPages": 5
}
```

#### 2. Get Product Details

**Endpoint:** `GET /api/v1/products/{id}`

**Response:** Status 200 OK
```json
{
  "id": 1,
  "name": "Wireless Headphones",
  "description": "High quality wireless headphones with noise cancellation",
  "price": 99.99,
  "stock": 50,
  "sku": "WH-001",
  "vendorId": 1,
  "vendorName": "TechStore",
  "categoryId": 2,
  "categoryName": "Electronics",
  "images": [
    "https://example.com/product1.jpg",
    "https://example.com/product2.jpg"
  ],
  "rating": 4.5,
  "reviewCount": 25,
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-20T15:45:00Z"
}
```

#### 3. Search Products

**Endpoint:** `GET /api/v1/products/search?q=headphones&category=2&minPrice=50&maxPrice=150`

**Query Parameters:**
- `q` (search query)
- `category` (category ID)
- `minPrice` (minimum price)
- `maxPrice` (maximum price)
- `page` (default: 0)
- `size` (default: 20)

**Response:** Status 200 OK
```json
{
  "products": [
    {
      "id": 1,
      "name": "Wireless Headphones",
      "price": 99.99,
      "stock": 50,
      "rating": 4.5
    }
  ],
  "currentPage": 0,
  "totalItems": 5,
  "totalPages": 1
}
```

#### 4. Create Product (Vendor Only)

**Endpoint:** `POST /api/v1/products`

**Headers:**
```
Authorization: Bearer <vendorToken>
```

**Request Body:**
```json
{
  "name": "Wireless Headphones",
  "description": "High quality wireless headphones with noise cancellation",
  "price": 99.99,
  "stock": 50,
  "sku": "WH-001",
  "categoryId": 2,
  "images": ["url1", "url2"]
}
```

**Response:** Status 201 Created
```json
{
  "id": 101,
  "name": "Wireless Headphones",
  "description": "High quality wireless headphones with noise cancellation",
  "price": 99.99,
  "stock": 50,
  "sku": "WH-001",
  "vendorId": <loggedInVendorId>,
  "categoryId": 2,
  "images": ["url1", "url2"],
  "isActive": true,
  "createdAt": "2024-02-16T10:30:00Z"
}
```

---

### Categories Service

#### 1. List Categories

**Endpoint:** `GET /api/v1/categories`

**Response:** Status 200 OK
```json
[
  {
    "id": 1,
    "name": "Electronics",
    "description": "Electronic devices and accessories",
    "imageUrl": "https://example.com/electronics.jpg",
    "productCount": 150,
    "isActive": true
  },
  {
    "id": 2,
    "name": "Clothing",
    "description": "Apparel and fashion items",
    "imageUrl": "https://example.com/clothing.jpg",
    "productCount": 200,
    "isActive": true
  }
]
```

#### 2. Get Category Details

**Endpoint:** `GET /api/v1/categories/{id}`

**Response:** Status 200 OK
```json
{
  "id": 1,
  "name": "Electronics",
  "description": "Electronic devices and accessories",
  "imageUrl": "https://example.com/electronics.jpg",
  "productCount": 150,
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

### Cart Service

#### 1. Get Cart

**Endpoint:** `GET /api/v1/cart`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:** Status 200 OK
```json
{
  "cartId": 101,
  "userId": 1,
  "items": [
    {
      "cartItemId": 1,
      "productId": 1,
      "productName": "Wireless Headphones",
      "quantity": 2,
      "price": 99.99,
      "subtotal": 199.98,
      "vendorId": 1
    }
  ],
  "totalItems": 2,
  "totalPrice": 199.98,
  "updatedAt": "2024-02-16T12:30:00Z"
}
```

#### 2. Add to Cart

**Endpoint:** `POST /api/v1/cart/items`

**Request Body:**
```json
{
  "productId": 1,
  "quantity": 2
}
```

**Response:** Status 201 Created
```json
{
  "message": "Item added to cart",
  "cartItemId": 1,
  "productId": 1,
  "quantity": 2,
  "price": 99.99,
  "subtotal": 199.98
}
```

#### 3. Update Cart Item

**Endpoint:** `PUT /api/v1/cart/items/{cartItemId}`

**Request Body:**
```json
{
  "quantity": 3
}
```

**Response:** Status 200 OK
```json
{
  "message": "Cart item updated",
  "cartItemId": 1,
  "quantity": 3,
  "subtotal": 299.97
}
```

#### 4. Remove from Cart

**Endpoint:** `DELETE /api/v1/cart/items/{cartItemId}`

**Response:** Status 200 OK
```json
{
  "message": "Item removed from cart"
}
```

#### 5. Clear Cart

**Endpoint:** `DELETE /api/v1/cart`

**Response:** Status 200 OK
```json
{
  "message": "Cart cleared successfully"
}
```

---

### Orders Service

#### 1. List User Orders

**Endpoint:** `GET /api/v1/orders?page=0&size=10&status=DELIVERED`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Query Parameters:**
- `page` (default: 0)
- `size` (default: 10)
- `status` (optional: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED)

**Response:** Status 200 OK
```json
{
  "orders": [
    {
      "id": 101,
      "orderNumber": "ORD-2024-001",
      "userId": 1,
      "totalAmount": 299.97,
      "itemCount": 2,
      "status": "DELIVERED",
      "shippingAddress": "123 Main St, City, State 12345",
      "trackingNumber": "TRK123456789",
      "createdAt": "2024-02-01T10:30:00Z",
      "shippedAt": "2024-02-03T14:00:00Z",
      "deliveredAt": "2024-02-06T09:00:00Z"
    }
  ],
  "currentPage": 0,
  "totalItems": 5,
  "totalPages": 1
}
```

#### 2. Get Order Details

**Endpoint:** `GET /api/v1/orders/{id}`

**Response:** Status 200 OK
```json
{
  "id": 101,
  "orderNumber": "ORD-2024-001",
  "userId": 1,
  "itemCount": 2,
  "items": [
    {
      "productId": 1,
      "productName": "Wireless Headphones",
      "quantity": 2,
      "price": 99.99,
      "subtotal": 199.98,
      "vendorId": 1
    }
  ],
  "totalAmount": 299.97,
  "status": "DELIVERED",
  "shippingAddress": "123 Main St, City, State 12345",
  "trackingNumber": "TRK123456789",
  "paymentMethod": "CREDIT_CARD",
  "createdAt": "2024-02-01T10:30:00Z",
  "shippedAt": "2024-02-03T14:00:00Z",
  "deliveredAt": "2024-02-06T09:00:00Z"
}
```

#### 3. Track Order

**Endpoint:** `GET /api/v1/orders/{id}/track`

**Response:** Status 200 OK
```json
{
  "orderId": 101,
  "status": "DELIVERED",
  "trackingNumber": "TRK123456789",
  "shippedAt": "2024-02-03T14:00:00Z",
  "deliveredAt": "2024-02-06T09:00:00Z"
}
```

#### 4. Cancel Order

**Endpoint:** `POST /api/v1/orders/{id}/cancel?reason=Changed mind`

**Response:** Status 200 OK
```json
{
  "id": 101,
  "orderNumber": "ORD-2024-001",
  "status": "CANCELLED",
  "cancellationReason": "Changed mind",
  "message": "Order cancelled successfully"
}
```

---

### Payments Service

#### 1. Initiate Payment

**Endpoint:** `POST /api/v1/payments/initiate`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "orderNumber": "ORD-2024-001",
  "amount": 299.97,
  "currency": "USD",
  "paymentMethod": "CREDIT_CARD",
  "cardNumber": "4242424242424242",
  "cardholderName": "John Doe",
  "cardExpiryMonth": "12",
  "cardExpiryYear": "2025",
  "cvv": "123",
  "billingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}
```

**Response:** Status 201 Created
```json
{
  "transactionId": "txn_12345678",
  "orderNumber": "ORD-2024-001",
  "amount": 299.97,
  "currency": "USD",
  "status": "PENDING",
  "paymentMethod": "CREDIT_CARD",
  "cardLast4": "4242",
  "message": "Payment initiated. Awaiting confirmation."
}
```

#### 2. Confirm Payment

**Endpoint:** `POST /api/v1/payments/{id}/confirm`

**Request Body:**
```json
{
  "orderNumber": "ORD-2024-001",
  "amount": 299.97,
  "currency": "USD",
  "paymentMethod": "CREDIT_CARD",
  "cardNumber": "4242424242424242",
  "cardholderName": "John Doe",
  "cardExpiryMonth": "12",
  "cardExpiryYear": "2025",
  "cvv": "123"
}
```

**Response:** Status 200 OK
```json
{
  "transactionId": "txn_12345678",
  "orderNumber": "ORD-2024-001",
  "amount": 299.97,
  "currency": "USD",
  "status": "SUCCESS",
  "paymentMethod": "CREDIT_CARD",
  "cardLast4": "4242",
  "authorizedAt": "2024-02-16T12:35:00Z",
  "message": "Payment processed successfully"
}
```

#### 3. Get Payment Details

**Endpoint:** `GET /api/v1/payments/{id}`

**Response:** Status 200 OK
```json
{
  "transactionId": "txn_12345678",
  "orderNumber": "ORD-2024-001",
  "amount": 299.97,
  "currency": "USD",
  "status": "SUCCESS",
  "paymentMethod": "CREDIT_CARD",
  "cardLast4": "4242",
  "authorizedAt": "2024-02-16T12:35:00Z",
  "createdAt": "2024-02-16T12:30:00Z"
}
```

#### 4. Refund Payment

**Endpoint:** `POST /api/v1/payments/{id}/refund`

**Request Body:**
```json
{
  "refundAmount": 299.97,
  "reason": "Customer requested refund"
}
```

**Response:** Status 201 Created
```json
{
  "transactionId": "txn_12345678",
  "refundId": "ref_87654321",
  "amount": 299.97,
  "currency": "USD",
  "status": "PROCESSING",
  "reason": "Customer requested refund",
  "initiatedAt": "2024-02-16T12:40:00Z",
  "message": "Refund has been initiated. You will receive funds in 3-5 business days."
}
```

#### 5. Payment Health Check

**Endpoint:** `GET /api/v1/payments/health`

**Response:** Status 200 OK
```json
{
  "status": "UP",
  "gateways": {
    "mock": "UP",
    "stripe": "UP",
    "paypal": "DOWN"
  },
  "message": "Payment service is healthy"
}
```

---

### Vendors Service

#### 1. Register as Vendor

**Endpoint:** `POST /api/v1/vendors/register`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "businessName": "My Online Store",
  "description": "Selling high quality electronics and gadgets",
  "businessEmail": "shop@example.com",
  "businessPhone": "+1234567890",
  "businessAddress": "123 Business St, City, State 12345",
  "taxId": "12-3456789",
  "businessRegistrationNumber": "BRN123456",
  "businessType": "LLC",
  "businessLicense": "license_doc_url",
  "bankAccountNumber": "****5678",
  "bankRoutingNumber": "021000021"
}
```

**Response:** Status 201 Created
```json
{
  "id": 1,
  "userId": 1,
  "businessName": "My Online Store",
  "description": "Selling high quality electronics and gadgets",
  "businessEmail": "shop@example.com",
  "businessPhone": "+1234567890",
  "status": "PENDING_APPROVAL",
  "commissionRate": 10.0,
  "createdAt": "2024-02-16T12:30:00Z",
  "message": "Vendor registration submitted. Awaiting admin approval."
}
```

#### 2. Get Vendor Profile

**Endpoint:** `GET /api/v1/vendors/{id}`

**Response:** Status 200 OK
```json
{
  "id": 1,
  "businessName": "My Online Store",
  "description": "Selling high quality electronics and gadgets",
  "businessEmail": "shop@example.com",
  "businessPhone": "+1234567890",
  "status": "APPROVED",
  "rating": 4.7,
  "reviewCount": 89,
  "productCount": 45,
  "commissionRate": 10.0,
  "createdAt": "2024-02-16T12:30:00Z"
}
```

#### 3. Get My Vendor Dashboard (Vendor Only)

**Endpoint:** `GET /api/v1/vendors/dashboard/my-dashboard`

**Headers:**
```
Authorization: Bearer <vendorToken>
```

**Response:** Status 200 OK
```json
{
  "vendorId": 1,
  "businessName": "My Online Store",
  "totalProducts": 45,
  "totalOrders": 234,
  "totalRevenue": 15634.50,
  "pendingOrders": 12,
  "monthlyRevenue": 2345.67,
  "vendorRating": 4.7,
  "reviewCount": 89,
  "activeListings": 40,
  "suspendedListings": 5
}
```

---

### Addresses Service

#### 1. List User Addresses

**Endpoint:** `GET /api/v1/addresses`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:** Status 200 OK
```json
{
  "addresses": [
    {
      "id": 1,
      "type": "HOME",
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA",
      "phoneNumber": "+1234567890",
      "isDefault": true,
      "createdAt": "2024-02-01T10:30:00Z"
    }
  ]
}
```

#### 2. Create Address

**Endpoint:** `POST /api/v1/addresses`

**Request Body:**
```json
{
  "type": "HOME",
  "street": "456 Oak Ave",
  "city": "Los Angeles",
  "state": "CA",
  "zipCode": "90001",
  "country": "USA",
  "phoneNumber": "+0987654321",
  "isDefault": false
}
```

**Response:** Status 201 Created
```json
{
  "id": 2,
  "type": "HOME",
  "street": "456 Oak Ave",
  "city": "Los Angeles",
  "state": "CA",
  "zipCode": "90001",
  "country": "USA",
  "phoneNumber": "+0987654321",
  "isDefault": false,
  "createdAt": "2024-02-16T12:30:00Z"
}
```

#### 3. Update Address

**Endpoint:** `PUT /api/v1/addresses/{id}`

**Request Body:**
```json
{
  "type": "WORK",
  "street": "789 Business Blvd",
  "city": "Chicago",
  "state": "IL",
  "zipCode": "60601"
}
```

**Response:** Status 200 OK
```json
{
  "id": 2,
  "type": "WORK",
  "street": "789 Business Blvd",
  "city": "Chicago",
  "state": "IL",
  "zipCode": "60601",
  "country": "USA",
  "phoneNumber": "+0987654321",
  "isDefault": false,
  "updatedAt": "2024-02-16T12:35:00Z"
}
```

#### 4. Delete Address

**Endpoint:** `DELETE /api/v1/addresses/{id}`

**Response:** Status 200 OK
```json
{
  "message": "Address deleted successfully"
}
```

#### 5. Set Default Address

**Endpoint:** `PATCH /api/v1/addresses/{id}`

**Response:** Status 200 OK
```json
{
  "id": 1,
  "isDefault": true,
  "message": "Address set as default"
}
```

---

### Admin Service

#### 1. Get Pending Vendor Applications

**Endpoint:** `GET /api/v1/admin/vendors/pending?page=0&size=10`

**Headers:**
```
Authorization: Bearer <adminToken>
```

**Response:** Status 200 OK
```json
{
  "content": [
    {
      "id": 2,
      "userId": 5,
      "businessName": "New Electronics Shop",
      "businessEmail": "newshop@example.com",
      "status": "PENDING_APPROVAL",
      "createdAt": "2024-02-15T10:30:00Z"
    }
  ],
  "totalElements": 5,
  "totalPages": 1,
  "number": 0,
  "size": 10
}
```

#### 2. Approve/Reject Vendor

**Endpoint:** `POST /api/v1/admin/vendors/approve`

**Request Body:**
```json
{
  "vendorId": 2,
  "status": "APPROVED"
}
```

or

```json
{
  "vendorId": 2,
  "status": "REJECTED",
  "reason": "Missing tax documentation"
}
```

**Response:** Status 200 OK
```json
{
  "id": 2,
  "businessName": "New Electronics Shop",
  "status": "APPROVED",
  "message": "Vendor approved successfully"
}
```

#### 3. Get Admin Dashboard

**Endpoint:** `GET /api/v1/admin/dashboard`

**Response:** Status 200 OK
```json
{
  "totalUsers": 1250,
  "totalVendors": 45,
  "totalOrders": 5678,
  "totalRevenue": 156340.50,
  "pendingVendorApplications": 8,
  "activeListings": 890,
  "averageOrderValue": 27.50,
  "monthlyRevenue": 15634.50
}
```

#### 4. Get Platform Metrics

**Endpoint:** `GET /api/v1/admin/metrics?period=MONTH`

**Query Parameters:**
- `period` (DAY, WEEK, MONTH, YEAR - default: MONTH)

**Response:** Status 200 OK
```json
{
  "period": "MONTH",
  "totalRevenue": 15634.50,
  "totalOrders": 567,
  "averageOrderValue": 27.50,
  "totalProductsSold": 1234,
  "totalRefunds": 234.50,
  "topVendors": [
    {
      "vendorId": 1,
      "businessName": "Tech Store",
      "revenue": 5678.90,
      "orderCount": 234
    }
  ],
  "topProducts": [
    {
      "productId": 1,
      "name": "Wireless Headphones",
      "soldCount": 156,
      "revenue": 15594.44
    }
  ]
}
```

---

## Quick Testing with cURL

### 1. Test Health Check

```bash
curl -X GET http://localhost:8080/actuator/health
```

### 2. Register User

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123!",
    "firstName": "Test",
    "lastName": "User",
    "phoneNumber": "+1234567890"
  }'
```

### 3. Login and Get Token

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123!"
  }'
```

### 4. Use Token in Protected Endpoint

```bash
# Replace TOKEN with actual token from login response
curl -X GET http://localhost:8080/api/v1/cart \
  -H "Authorization: Bearer TOKEN"
```

### 5. List Products

```bash
curl -X GET "http://localhost:8080/api/v1/products?page=0&size=20"
```

### 6. Search Products

```bash
curl -X GET "http://localhost:8080/api/v1/products/search?q=headphones&minPrice=50&maxPrice=200"
```

---

## Summary of Configuration Steps

1. **Create `.env` file** with all required variables
2. **Start Docker services**: `docker-compose up -d`
3. **Wait for PostgreSQL to be healthy** (check healthcheck)
4. **Build JAR** `./mvnw clean package -DskipTests`
5. **Run application**: `./mvnw spring-boot:run`
6. **Verify running**: `curl http://localhost:8080/actuator/health`
7. **Query database**: Use Adminer at `http://localhost:8081`
8. **Access API**: Use endpoints listed above

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `Connection refused: localhost:5432` | Ensure Docker container is running: `docker-compose ps` |
| `JWT_SECRET not set` | Create `.env` file with `JWT_SECRET` variable |
| `Flyway migration failed` | Reset database and restart app |
| `Port 8080 in use` | Change port with `--server.port=8090` |
| `Authentication required` | Add `Authorization: Bearer <token>` header |


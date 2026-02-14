# 🧪 LocalCart API - Test Scenarios & Examples

## Overview
This guide provides practical test scenarios with real cURL commands you can run to verify the API is working correctly.

---

## 📋 Prerequisites

Before running tests:
1. **Docker services running**: `docker-compose ps` should show all services as UP
2. **Spring Boot running**: Available at `http://localhost:8080`
3. **jq installed** (for JSON parsing in test_endpoints.sh): `jq --version`

---

## 🔐 Scenario 1: Authentication Flow

### 1.1 Register a New Customer
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer001@example.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Expected Response:**
```json
{
  "id": 1,
  "email": "customer001@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "userType": "CUSTOMER",
  "message": "User registered successfully"
}
```

### 1.2 Login and Get Tokens
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer001@example.com",
    "password": "SecurePassword123!"
  }'
```

**Expected Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 1,
  "email": "customer001@example.com",
  "userType": "CUSTOMER"
}
```

**Save token for next requests:**
```bash
# Store in variable (Linux/Mac)
TOKEN="your_access_token_here"

# Or for Windows PowerShell
$TOKEN="your_access_token_here"
```

### 1.3 Refresh Token
```bash
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

---

## 🛍️ Scenario 2: Vendor Registration & Product Management

### 2.1 Register as Vendor
```bash
# First register as regular user
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vendor001@example.com",
    "password": "VendorPass123!",
    "firstName": "Rajesh",
    "lastName": "Kumar"
  }'

# Then login to get token
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vendor001@example.com",
    "password": "VendorPass123!"
  }'
# Save the accessToken

# Then register as vendor
VENDOR_TOKEN="your_token_here"

curl -X POST http://localhost:8080/api/v1/vendors/register \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "TechStore Electronics",
    "businessType": "INDIVIDUAL",
    "gstNumber": "29ABCDE1234F2Z5",
    "bankAccount": "1234567890",
    "ifscCode": "HDFC0000001",
    "businessAddress": "123 Commerce Lane, Bangalore",
    "businessPincode": "560001",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "radiusInKm": 5
  }'
```

### 2.2 Create Product with Images
```bash
VENDOR_TOKEN="your_token_here"

curl -X POST http://localhost:8080/api/v1/products \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "iPhone 15 Pro",
    "description": "Latest iPhone with A17 Pro chip",
    "price": 129999.00,
    "categoryId": 1,
    "stock": 50,
    "sku": "IP15P-256GB",
    "imageUrls": [
      "https://via.placeholder.com/400?text=iPhone+15+Pro+Front",
      "https://via.placeholder.com/400?text=iPhone+15+Pro+Back"
    ]
  }'
```

**Expected Response:**
```json
{
  "id": 1,
  "name": "iPhone 15 Pro",
  "slug": "iphone-15-pro",
  "description": "Latest iPhone with A17 Pro chip",
  "price": 129999.00,
  "stock": 50,
  "vendorId": 2,
  "images": [
    {
      "id": 1,
      "imageUrl": "https://via.placeholder.com/400?text=iPhone+15+Pro+Front",
      "isPrimary": true
    },
    {
      "id": 2,
      "imageUrl": "https://via.placeholder.com/400?text=iPhone+15+Pro+Back",
      "isPrimary": false
    }
  ]
}
```

### 2.3 Get Vendor Profile
```bash
VENDOR_TOKEN="your_token_here"

curl -X GET http://localhost:8080/api/v1/vendors/profile \
  -H "Authorization: Bearer $VENDOR_TOKEN"
```

### 2.4 Update Product
```bash
VENDOR_TOKEN="your_token_here"
PRODUCT_ID=1

curl -X PUT http://localhost:8080/api/v1/products/$PRODUCT_ID \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "iPhone 15 Pro Max",
    "price": 139999.00,
    "stock": 45
  }'
```

---

## 🛒 Scenario 3: Shopping Cart Operations

### 3.1 View Products List (Public - No Auth Required)
```bash
# Get all products
curl -X GET http://localhost:8080/api/v1/products

# Get products with pagination
curl -X GET "http://localhost:8080/api/v1/products?page=0&size=10"

# Search products
curl -X GET "http://localhost:8080/api/v1/products/search?query=iPhone"

# Filter by category
curl -X GET "http://localhost:8080/api/v1/products/category/1"
```

### 3.2 Get Single Product Details
```bash
PRODUCT_ID=1

curl -X GET http://localhost:8080/api/v1/products/$PRODUCT_ID
```

### 3.3 Add Item to Cart
```bash
CUSTOMER_TOKEN="your_token_here"

curl -X POST http://localhost:8080/api/v1/cart/items \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "quantity": 2
  }'
```

**Expected Response:**
```json
{
  "id": 1,
  "userId": 1,
  "items": [
    {
      "id": 1,
      "productId": 1,
      "productName": "iPhone 15 Pro",
      "quantity": 2,
      "price": 129999.00,
      "totalPrice": 259998.00,
      "productImage": "https://via.placeholder.com/400?text=iPhone+15+Pro+Front"
    }
  ],
  "totalItems": 2,
  "totalPrice": 259998.00
}
```

### 3.4 View Cart
```bash
CUSTOMER_TOKEN="your_token_here"

curl -X GET http://localhost:8080/api/v1/cart \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
```

### 3.5 Update Cart Item Quantity
```bash
CUSTOMER_TOKEN="your_token_here"
CART_ITEM_ID=1

curl -X PUT http://localhost:8080/api/v1/cart/items/$CART_ITEM_ID \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 3
  }'
```

### 3.6 Remove Item from Cart
```bash
CUSTOMER_TOKEN="your_token_here"
CART_ITEM_ID=1

curl -X DELETE http://localhost:8080/api/v1/cart/items/$CART_ITEM_ID \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
```

### 3.7 Clear Cart
```bash
CUSTOMER_TOKEN="your_token_here"

curl -X DELETE http://localhost:8080/api/v1/cart \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
```

---

## 📦 Scenario 4: Orders

### 4.1 Create Order from Cart
```bash
CUSTOMER_TOKEN="your_token_here"

curl -X POST http://localhost:8080/api/v1/orders \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddress": "123 Main Street, Bangalore 560001",
    "paymentMethod": "CREDIT_CARD",
    "notes": "Please deliver after 6 PM"
  }'
```

### 4.2 View My Orders
```bash
CUSTOMER_TOKEN="your_token_here"

curl -X GET http://localhost:8080/api/v1/orders \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
```

### 4.3 Get Order Details
```bash
CUSTOMER_TOKEN="your_token_here"
ORDER_ID=1

curl -X GET http://localhost:8080/api/v1/orders/$ORDER_ID \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
```

### 4.4 Update Order Status (Vendor/Admin Only)
```bash
VENDOR_TOKEN="your_token_here"
ORDER_ID=1

curl -X PUT http://localhost:8080/api/v1/orders/$ORDER_ID/status \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "SHIPPED"
  }'
```

---

## 📊 Scenario 5: Vendor Dashboard

### 5.1 Get Dashboard Stats
```bash
VENDOR_TOKEN="your_token_here"

curl -X GET http://localhost:8080/api/v1/vendors/dashboard \
  -H "Authorization: Bearer $VENDOR_TOKEN"
```

**Expected Response:**
```json
{
  "totalProducts": 15,
  "totalOrders": 42,
  "totalRevenue": 450000.00,
  "averageRating": 4.5,
  "totalCustomers": 38,
  "pendingOrders": 5,
  "thisMonthRevenue": 45000.00,
  "thisMonthOrders": 8
}
```

---

## 🧪 Scenario 6: Running Full Automated Tests

### Use the Provided Test Script
```bash
# Linux/Mac
bash test_endpoints.sh

# Windows PowerShell
powershell -ExecutionPolicy Bypass -File "test_endpoints.sh"
```

This script will:
1. ✅ Check API health
2. ✅ Register test user
3. ✅ Login and save tokens
4. ✅ Test all product endpoints
5. ✅ Test cart operations
6. ✅ Test order creation
7. ✅ Generate test report

---

## 🔧 Troubleshooting Tests

### Common Issues

#### 401 Unauthorized
```bash
# Issue: Invalid or missing token
# Solution: Make sure token is valid and not expired
# Get new token by logging in again
```

#### 400 Bad Request
```bash
# Issue: Invalid request body
# Solution: Check JSON syntax and required fields
# Use jq to validate JSON:
echo '{"email": "test@example.com"}' | jq .
```

#### 404 Not Found
```bash
# Issue: Resource doesn't exist
# Solution: Verify the ID exists
# Check endpoint path spelling
```

#### 500 Internal Server Error
```bash
# Issue: Server error
# Solution: Check Docker logs
docker-compose logs spring-boot
# Check database connection
docker-compose logs postgres
```

---

## 💡 Tips & Tricks

### Save Tokens in Environment Variables
```bash
# After login, save tokens
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')

# Use in subsequent requests
curl -X GET http://localhost:8080/api/v1/products \
  -H "Authorization: Bearer $TOKEN"
```

### Pretty Print JSON Responses
```bash
curl -s http://localhost:8080/api/v1/products | jq .
```

### Test with Postman
1. Create a collection with POST `/auth/login`
2. Set {{token}} variable in pre-request script:
   ```javascript
   pm.environment.set("token", pm.response.json().accessToken);
   ```
3. Use `Authorization: Bearer {{token}}` in Headers
4. All subsequent requests will use the token

---

## 📚 Reference

- **API Docs**: [API_QUICK_REFERENCE.md](API_QUICK_REFERENCE.md)
- **Run Guide**: [RUN_AND_TEST_GUIDE.md](RUN_AND_TEST_GUIDE.md)
- **Quick Commands**: [QUICK_START_COMMANDS.md](QUICK_START_COMMANDS.md)


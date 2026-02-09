# LocalCart API Endpoints - Complete Reference

**Base URL**: `http://localhost:8080/api/v1`  
**Authentication**: Bearer JWT Token (except auth endpoints)

---

## 🔐 Authentication Endpoints (Public)

### 1. Register New User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890"
}

Response 201:
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "userId": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "roles": ["CUSTOMER"],
  "message": "Registration successful"
}
```

### 2. Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response 200:
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "userId": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "roles": ["CUSTOMER"],
  "message": "Login successful"
}
```

### 3. Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}

Response 200:
{
  "accessToken": "eyJhbGc...",  # New token
  "refreshToken": "eyJhbGc...",  # Same or rotated
  "userId": 1,
  "message": "Token refreshed"
}
```

### 4. Logout
```http
POST /auth/logout
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}

Response 200:
{
  "message": "Logout successful"
}
```

### 5. Get User Profile
```http
GET /auth/profile
Authorization: Bearer {accessToken}

Response 200:
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

### 6. Change Password
```http
POST /auth/change-password
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "oldPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}

Response 200:
{
  "message": "Password changed successfully"
}
```

### 7. Forgot Password (Request Reset)
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response 200:
{
  "message": "If the email exists, a password reset link has been sent"
}
```

### 8. Reset Password (With Token)
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "eyJhbGc...",
  "newPassword": "NewSecurePass123!"
}

Response 200:
{
  "message": "Password has been reset successfully"
}
```

---

## 🛍️ Product Endpoints

### 1. List All Products (Public)
```http
GET /products?page=0&size=20&sort=id,desc
Authorization: Optional

Response 200:
{
  "message": "Product listing coming soon"
}
```

### 2. Get Product by ID (Public)
```http
GET /products/{id}

Response 200:
{
  "message": "Get product by ID coming soon",
  "productId": 1
}
```

### 3. Get Product by Slug (Public)
```http
GET /products/slug/{slug}

Response 200:
{
  "message": "Get product by slug coming soon",
  "slug": "iphone-15-pro"
}
```

### 4. Search Products (Public)
```http
GET /products/search?q=iphone&category=1&minPrice=100&maxPrice=1000

Response 200:
{
  "message": "Search functionality coming soon",
  "query": "iphone"
}
```

### 5. Create Product (Vendor Only)
```http
POST /products
Authorization: Bearer {vendorToken}
Content-Type: application/json

{
  "name": "iPhone 15 Pro",
  "slug": "iphone-15-pro",
  "description": "Latest flagship phone",
  "price": 999.99,
  "discountPrice": 899.99,
  "stock": 50,
  "sku": "IPHONE15PRO",
  "categoryId": 1,
  "isActive": true,
  "isFeatured": true
}

Response 201:
{
  "message": "Create product coming soon"
}
```

### 6. Update Product (Vendor Only)
```http
PUT /products/{id}
Authorization: Bearer {vendorToken}
Content-Type: application/json

{
  "name": "iPhone 15 Pro Max",
  "price": 1099.99,
  ...
}

Response 200:
{
  "message": "Update product coming soon"
}
```

### 7. Delete Product (Vendor Only)
```http
DELETE /products/{id}
Authorization: Bearer {vendorToken}

Response 200:
{
  "message": "Product deleted successfully"
}
```

---

## 🛒 Shopping Cart Endpoints

### 1. Get Cart
```http
GET /cart
Authorization: Bearer {accessToken}

Response 200:
{
  "message": "Get cart coming soon"
}
```

### 2. Add Item to Cart
```http
POST /cart/add-item
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "productId": 1,
  "quantity": 2
}

Response 201:
{
  "message": "Add to cart coming soon",
  "productId": 1,
  "quantity": 2
}
```

### 3. Update Cart Item Quantity
```http
PUT /cart/items/{cartItemId}?quantity=5
Authorization: Bearer {accessToken}

Response 200:
{
  "message": "Update cart item coming soon",
  "cartItemId": 1,
  "quantity": 5
}
```

### 4. Remove Item from Cart
```http
DELETE /cart/items/{cartItemId}
Authorization: Bearer {accessToken}

Response 200:
{
  "message": "Item removed from cart",
  "cartItemId": 1
}
```

### 5. Clear Cart
```http
DELETE /cart
Authorization: Bearer {accessToken}

Response 200:
{
  "message": "Shopping cart cleared"
}
```

### 6. Checkout (Create Order)
```http
POST /cart/checkout
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "shippingAddressId": 1,
  "billingAddressId": 1,
  "paymentMethod": "CREDIT_CARD",
  "couponCode": "SAVE10",
  "notes": "Please deliver before 5pm"
}

Response 201:
{
  "message": "Checkout coming soon"
}
```

---

## 📦 Order Endpoints

### 1. Get User's Orders
```http
GET /orders?page=0&size=10&status=PENDING
Authorization: Bearer {accessToken}

Response 200:
{
  "message": "Order list coming soon",
  "page": 0,
  "size": 10,
  "status": "PENDING"
}
```

### 2. Get Order by ID
```http
GET /orders/{id}
Authorization: Bearer {accessToken}

Response 200:
{
  "message": "Get order coming soon",
  "orderId": 1
}
```

### 3. Track Order
```http
GET /orders/{id}/track
Authorization: Bearer {accessToken}

Response 200:
{
  "message": "Track order coming soon",
  "orderId": 1,
  "tracking": {
    "status": "PROCESSING",
    "trackingNumber": "TRACK123456",
    "estimatedDelivery": "2026-02-12"
  }
}
```

### 4. Cancel Order
```http
POST /orders/{id}/cancel?reason=Changed my mind
Authorization: Bearer {accessToken}

Response 200:
{
  "message": "Order cancelled successfully",
  "orderId": 1,
  "newStatus": "CANCELLED"
}
```

---

## 📂 Category Endpoints (Admin Only)

### 1. List All Categories
```http
GET /categories

Response 200:
{
  "message": "Category listing coming soon"
}
```

### 2. Get Category by ID
```http
GET /categories/{id}

Response 200:
{
  "message": "Get category coming soon",
  "categoryId": 1
}
```

### 3. Create Category (Admin)
```http
POST /categories
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "name": "Electronics",
  "slug": "electronics",
  "description": "Electronic devices and gadgets",
  "parentCategoryId": null,
  "isActive": true
}

Response 201:
{
  "message": "Create category coming soon"
}
```

### 4. Update Category (Admin)
```http
PUT /categories/{id}
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "name": "Consumer Electronics",
  "description": "Updated description"
}

Response 200:
{
  "message": "Update category coming soon"
}
```

### 5. Delete Category (Admin)
```http
DELETE /categories/{id}
Authorization: Bearer {adminToken}

Response 200:
{
  "message": "Category deleted successfully"
}
```

---

## 📍 Address Endpoints

### 1. List User Addresses
```http
GET /addresses?type=SHIPPING
Authorization: Bearer {accessToken}

Response 200:
{
  "message": "Address list coming soon",
  "type": "SHIPPING"
}
```

### 2. Get Address by ID
```http
GET /addresses/{id}
Authorization: Bearer {accessToken}

Response 200:
{
  "message": "Get address coming soon",
  "addressId": 1
}
```

### 3. Create Address
```http
POST /addresses
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "street": "123 Main Street",
  "apartment": "Apt 4B",
  "city": "New York",
  "state": "NY",
  "country": "USA",
  "zipCode": "10001",
  "addressType": "BOTH",
  "isDefault": true
}

Response 201:
{
  "message": "Create address coming soon"
}
```

### 4. Update Address
```http
PUT /addresses/{id}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "street": "456 Oak Avenue",
  "city": "Los Angeles",
  ...
}

Response 200:
{
  "message": "Update address coming soon"
}
```

### 5. Delete Address
```http
DELETE /addresses/{id}
Authorization: Bearer {accessToken}

Response 200:
{
  "message": "Address deleted successfully"
}
```

### 6. Set Default Address
```http
PATCH /addresses/{id}/set-default?type=SHIPPING
Authorization: Bearer {accessToken}

Response 200:
{
  "message": "Default address updated",
  "addressId": 1,
  "type": "SHIPPING"
}
```

---

## 💳 Payment Endpoints

### 1. Initiate Payment
```http
POST /payments/initiate
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "orderNumber": "ORD-20260209-ABC12",
  "amount": 5999.99,
  "currency": "USD",
  "paymentMethod": "CREDIT_CARD",
  "cardNumber": "4242424242424242",
  "cardholderName": "John Doe",
  "cardExpiryMonth": "12",
  "cardExpiryYear": "2025",
  "cvv": "123"
}

Response 201:
{
  "transactionId": "TXN123",
  "status": "PENDING",
  "message": "Payment initiated"
}
```

### 2. Get Payment Details
```http
GET /payments/{id}
Authorization: Bearer {accessToken}

Response 200:
{
  "paymentId": 1,
  "amount": 5999.99,
  "status": "COMPLETED",
  "maskedCardNumber": "****4242"
}
```

### 3. Refund Payment
```http
POST /payments/{id}/refund
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "refundAmount": 5999.99,
  "reason": "Customer requested cancellation"
}

Response 201:
{
  "refundId": "REF123",
  "status": "REFUNDED",
  "amount": 5999.99
}
```

---

## 🔑 Error Responses

All endpoints may return these error formats:

### 400 Bad Request
```json
{
  "errorCode": "VALIDATION_ERROR",
  "message": "Invalid input data"
}
```

### 401 Unauthorized
```json
{
  "errorCode": "UNAUTHORIZED",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "errorCode": "FORBIDDEN",
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "errorCode": "NOT_FOUND",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "errorCode": "INTERNAL_ERROR",
  "message": "An error occurred"
}
```

---

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- All amounts are in decimal format (e.g., 999.99)
- Page numbering starts at 0
- Default page size is 20 items
- JWT tokens expire: access (15 min), refresh (7 days)
- Password reset tokens expire in 15 minutes

---

**For implementation details, see: COMPREHENSIVE_DEVELOPMENT_REPORT.md**

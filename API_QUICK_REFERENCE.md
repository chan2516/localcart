# Quick Reference - API Endpoints Cheat Sheet

## 🔐 Authentication Endpoints (No Auth Required)

### Register
```bash
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "Pass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1-555-0100"
}
→ Returns: accessToken, refreshToken, userId, email, roles
```

### Login
```bash
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "Pass123!"
}
→ Returns: accessToken, refreshToken, userId, email, roles
```

### Refresh Token
```bash
POST /api/v1/auth/refresh
{
  "refreshToken": "your-refresh-token"
}
→ Returns: New accessToken, refreshToken
```

---

## 📦 Product Endpoints (Public)

### List Products
```bash
GET /api/v1/products?page=0&size=20
→ Returns: List of products with pagination
```

### Get Product
```bash
GET /api/v1/products/{id}
→ Returns: Product details
```

### Get Product by Slug
```bash
GET /api/v1/products/slug/product-name
→ Returns: Product details
```

### Search Products
```bash
GET /api/v1/products/search?q=laptop&category=1&minPrice=100&maxPrice=5000
→ Returns: Filtered products
```

### Create Product (VENDOR only)
```bash
POST /api/v1/products
Authorization: Bearer {token}
{
  "name": "Product Name",
  "slug": "product-name",
  "description": "Description",
  "price": 99.99,
  "discountPrice": 79.99,
  "stock": 100,
  "categoryId": 1,
  "sku": "SKU123"
}
→ Returns: Created product with ID
```

### Update Product (VENDOR only)
```bash
PUT /api/v1/products/{id}
Authorization: Bearer {token}
{...product fields...}
→ Returns: Updated product
```

### Delete Product (VENDOR only)
```bash
DELETE /api/v1/products/{id}
Authorization: Bearer {token}
→ Returns: Success message
```

---

## 🏷️ Category Endpoints (Public)

### List Categories
```bash
GET /api/v1/categories
→ Returns: List of all categories
```

### Get Category
```bash
GET /api/v1/categories/{id}
→ Returns: Category with product count
```

### Create Category (ADMIN only)
```bash
POST /api/v1/categories
Authorization: Bearer {token}
{
  "name": "Electronics",
  "slug": "electronics",
  "description": "Electronic devices",
  "isActive": true
}
→ Returns: Created category with ID
```

### Update Category (ADMIN only)
```bash
PUT /api/v1/categories/{id}
Authorization: Bearer {token}
{...category fields...}
→ Returns: Updated category
```

### Delete Category (ADMIN only)
```bash
DELETE /api/v1/categories/{id}
Authorization: Bearer {token}
→ Returns: Success message
```

---

## 🛒 Shopping Cart Endpoints (Auth Required)

### Get Cart
```bash
GET /api/v1/cart
Authorization: Bearer {token}
→ Returns: Cart with items, subtotal, total
```

### Add to Cart
```bash
POST /api/v1/cart/add-item
Authorization: Bearer {token}
{
  "productId": 123,
  "quantity": 2
}
→ Returns: Updated cart
```

### Update Cart Item
```bash
PUT /api/v1/cart/items/{id}?quantity=5
Authorization: Bearer {token}
→ Returns: Updated cart
```

### Remove from Cart
```bash
DELETE /api/v1/cart/items/{id}
Authorization: Bearer {token}
→ Returns: Updated cart
```

### Clear Cart
```bash
DELETE /api/v1/cart
Authorization: Bearer {token}
→ Returns: Success message
```

### Checkout
```bash
POST /api/v1/cart/checkout
Authorization: Bearer {token}
{
  "shippingAddressId": 1,
  "billingAddressId": 1,
  "paymentMethod": "CREDIT_CARD",
  "couponCode": "SAVE10",  // optional
  "notes": "Deliver before 5pm"  // optional
}
→ Returns: Order ID, payment details
```

---

## 📍 Address Endpoints (Auth Required)

### List Addresses
```bash
GET /api/v1/addresses
Authorization: Bearer {token}
→ Returns: All user addresses
```

### Get Address
```bash
GET /api/v1/addresses/{id}
Authorization: Bearer {token}
→ Returns: Address details
```

### Create Address
```bash
POST /api/v1/addresses
Authorization: Bearer {token}
{
  "street": "123 Main St",
  "apartment": "Apt 5B",
  "city": "New York",
  "state": "NY",
  "country": "United States",
  "zipCode": "10001",
  "addressType": "SHIPPING",  // or BILLING, BOTH
  "isDefault": false
}
→ Returns: Created address with ID
```

### Update Address
```bash
PUT /api/v1/addresses/{id}
Authorization: Bearer {token}
{...address fields...}
→ Returns: Updated address
```

### Delete Address
```bash
DELETE /api/v1/addresses/{id}
Authorization: Bearer {token}
→ Returns: Success message
```

### Set Default Address
```bash
PATCH /api/v1/addresses/{id}/set-default?type=SHIPPING
Authorization: Bearer {token}
→ Returns: Success message
```

---

## 📋 Order Endpoints (Auth Required)

### List Orders
```bash
GET /api/v1/orders?page=0&size=10&status=PENDING
Authorization: Bearer {token}
→ Returns: User's orders with pagination
```

### Get Order
```bash
GET /api/v1/orders/{id}
Authorization: Bearer {token}
→ Returns: Order details with items
```

### Track Order
```bash
GET /api/v1/orders/{id}/track
Authorization: Bearer {token}
→ Returns: Order status, tracking number, estimated delivery
```

### Cancel Order
```bash
POST /api/v1/orders/{id}/cancel?reason=Changed%20mind
Authorization: Bearer {token}
→ Returns: Updated order status
```

---

## 💳 Payment Endpoints (Auth Required)

### Initiate Payment
```bash
POST /api/v1/payments/initiate
Authorization: Bearer {token}
{
  "orderId": 1,
  "orderNumber": "ORD-2026-001",
  "amount": 599.99,
  "currency": "USD",
  "paymentMethod": "CREDIT_CARD",
  "cardNumber": "4242424242424242",
  "cardHolderName": "John Doe",
  "expiryMonth": "12",
  "expiryYear": "2025",
  "cvv": "123"
}
→ Returns: Payment ID, transaction ID,status
```

### Confirm Payment
```bash
POST /api/v1/payments/{id}/confirm
Authorization: Bearer {token}
{...payment details...}
→ Returns: Updated payment status
```

### Get Payment
```bash
GET /api/v1/payments/{id}
Authorization: Bearer {token}
→ Returns: Payment details
```

### Refund Payment
```bash
POST /api/v1/payments/{id}/refund
Authorization: Bearer {token}
{
  "paymentId": 1,
  "refundAmount": 599.99,
  "reason": "Customer request"
}
→ Returns: Refund ID, status
```

---

## 👤 Profile Endpoints (Auth Required)

### Get Profile
```bash
GET /api/v1/auth/profile
Authorization: Bearer {token}
→ Returns: Current user details
```

### Change Password
```bash
POST /api/v1/auth/change-password
Authorization: Bearer {token}
{
  "oldPassword": "OldPass123!",
  "newPassword": "NewPass123!",
  "confirmPassword": "NewPass123!"
}
→ Returns: Success message
```

### Logout
```bash
POST /api/v1/auth/logout
Authorization: Bearer {token}
{
  "refreshToken": "your-refresh-token"
}
→ Returns: Success message
```

---

## 🔑 Authorization Header Format
```
Authorization: Bearer {accessToken}

Example:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📊 Common Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Check request body |
| 401 | Unauthorized | Add Authorization header with token |
| 403 | Forbidden | Insufficient role/permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Internal server error |

---

## ⏰ Token Information

**Access Token:**
- Expires in: 15 minutes
- Use for: Calling protected endpoints
- Header: `Authorization: Bearer {accessToken}`

**Refresh Token:**
- Expires in: 7 days
- Use for: Getting new access tokens
- Endpoint: `POST /api/v1/auth/refresh`

---

## 🧪 Test with cURL

```bash
# 1. Register
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Pass123!","firstName":"Test"}'

# 2. Login and extract token
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Pass123!"}' \
  | jq -r '.accessToken')

# 3. Use token in requests
curl -X GET http://localhost:8080/api/v1/cart \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📝 Test Credentials

For testing (if seeded in database):
```
Email: customer@example.com
Password: Password123!
Role: CUSTOMER

Email: vendor@example.com
Password: Password123!
Role: VENDOR

Email: admin@example.com
Password: Password123!
Role: ADMIN
```

---

**Last Updated**: February 7, 2026  
**Version**: 1.0  
**Status**: Production Ready

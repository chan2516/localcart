# LocalCart Backend Services - Implementation Strategy & Architecture

**Date**: February 7, 2026  
**Phase**: Phase B onwards (Auth, Products, Cart, Orders, Reviews)

---

## 📋 TABLE OF CONTENTS
1. Session Management Strategy
2. Auth Service Architecture
3. Product Service with Image Upload
4. Transaction/Payment History
5. Cart & Checkout Service
6. Order Management Service
7. Implementation Sequence

---

## 1️⃣ SESSION MANAGEMENT STRATEGY

### Architecture Overview
We're using **JWT (JSON Web Token) + Redis** architecture:

```
┌─────────────────┐
│   Client App    │
└────────┬────────┘
         │ 1. Login
         ▼
┌─────────────────────────┐
│   Auth Service          │
│ (UserService)          │
└────────┬────────────────┘
         │ 2. Create JWT tokens
         ▼
┌─────────────────────────────────────────────────┐
│  Return to Client                               │
│ - accessToken (short-lived, 15 mins)          │
│ - refreshToken (long-lived, 7 days)           │
│ - user details                                  │
└─────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│  Client stores tokens (localStorage/sessionStorage)│
│  Sends accessToken in headers for each request   │
└──────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────┐
│   JwtAuthenticationFilter                  │
│ - Extracts token from Authorization header│
│ - Validates token                          │
│ - Sets authentication context              │
└────────────────────────────────────────────┘
```

### How Sessions Work (No Server Sessions Stored)

**Token Storage:**
- **Access Token**: Stored in client (short-lived, 15 mins)
  - Sent in Authorization header: `Bearer <token>`
  - Contains: user ID, email, roles, issued time, expiration
  - No database lookup needed for validation

- **Refresh Token**: Stored in client (long-lived, 7 days)
  - Used to get new access token when expired
  - Can be revoked by adding to Redis blacklist
  - Enables "remember me" functionality

**Validation Flow:**
```
1. Client sends request with "Authorization: Bearer <accessToken>"
2. JwtAuthenticationFilter extracts token
3. JwtUtils validates token signature and expiration
4. If valid: Extract user info from token claims
5. If invalid/expired: 
   - If user has refreshToken: Use POST /api/v1/auth/refresh to get new token
   - If no refreshToken: User must login again
```

**Redis Usage:**
- Store refresh tokens (with expiration)
- Maintain token blacklist (for logout)
- Session cache (optional, for faster lookups)

**Login Request Flow:**
```
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "roles": ["CUSTOMER"]
  }
}
```

**Using Token in Requests:**
```
GET /api/v1/products
Authorization: Bearer eyJhbGc...

Response: 200 OK - Access granted
```

**Token Expiration & Refresh:**
```
GET /api/v1/products
Authorization: Bearer <expired-token>

Response: 401 Unauthorized - Token expired

Client then calls:
POST /api/v1/auth/refresh
{
  "refreshToken": "eyJhbGc..."
}

Response:
{
  "accessToken": "eyJhbGc...",  // New token
  "refreshToken": "eyJhbGc..."   // May be rotated
}
```

**Logout (Token Revocation):**
```
POST /api/v1/auth/logout
Authorization: Bearer <token>
{
  "refreshToken": "eyJhbGc..."
}

Action:
1. Add refreshToken to Redis blacklist with TTL = token expiration time
2. Return 200 OK
3. Client removes tokens from local storage

Result: User cannot use this refreshToken anymore
```

---

## 2️⃣ AUTH SERVICE ARCHITECTURE

### Core Services

**A. UserService**
```java
// User Registration
User registerUser(RegisterRequest request)
  - Validate email not exists
  - Hash password (BCrypt)
  - Create user with CUSTOMER role
  - Save to database
  - Return User entity (password excluded)

// User Login
AuthResponse login(LoginRequest request)
  - Find user by email
  - Validate password (BCrypt)
  - Generate accessToken and refreshToken
  - Store refreshToken in Redis
  - Return tokens and user details

// Refresh Token
AuthResponse refresh(String refreshToken)
  - Validate refreshToken from Redis
  - Check not in blacklist
  - Generate new accessToken
  - Optionally rotate refreshToken
  - Return new tokens

// Logout
void logout(String refreshToken)
  - Add refreshToken to Redis blacklist
  - Clear from Redis hash (if stored)

// Find User by Email (for authentication)
User findByEmail(String email)

// Verify Email (future feature)
void verifyEmail(String token)

// Change Password
void changePassword(Long userId, String oldPassword, String newPassword)
  - Validate old password
  - Hash new password
  - Update in database
```

**B. JwtUtils (Already Exists)**
```java
// Token Generation
String generateAccessToken(UserDetails userDetails)
String generateRefreshToken(UserDetails userDetails)

// Token Validation & Extraction
String extractUsername(String token)
Date extractExpiration(String token)
boolean isTokenValid(String token)
boolean isTokenExpired(String token)

// Signing Key Management
SecretKey getSigningKey()
```

**C. JwtAuthenticationFilter (NEW)**
```java
// Filter chain for all requests
void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
  - Extract Bearer token from Authorization header
  - Validate token
  - Extract username and roles from token
  - Create Authentication object
  - Set in SecurityContext
  - Continue filter chain
```

### Database: User & Role Entities
- User: email, password (hashed), firstName, lastName, isActive, isEmailVerified
- Role: name (CUSTOMER, VENDOR, ADMIN)
- user_roles junction table (ManyToMany)

### Configuration: JWT Properties
```properties
jwt.secret=your-256-bit-secret-key-base64-encoded
jwt.access-token-expiration=900000  # 15 minutes in ms
jwt.refresh-token-expiration=604800000  # 7 days in ms
jwt.issuer=localcart

# Redis for refresh tokens
spring.redis.host=localhost
spring.redis.port=6379
spring.redis.timeout=2000
spring.redis.jedis.pool.max-active=8
```

---

## 3️⃣ PRODUCT SERVICE WITH IMAGE UPLOAD

### Storage Strategy

**Option 1: Database Storage (Recommended for MVP)**
- Store images as BLOB in PostgreSQL
- Pros: Single source of truth, no external dependency, backup with DB
- Cons: Database bloat, slower queries
- Good for: MVP, small product catalogs
- Estimated: 100-1000 products = manageable

**Option 2: File System Storage**
- Store in /uploads/products/
- Reference path in database
- Pros: Fast access, separate from DB
- Cons: Backup complexity, file management
- Good for: Large catalogs, high traffic

**Option 3: Cloud Storage (S3/Google Cloud) (Future)**
- Store in S3 or similar
- Reference URL in database
- Pros: Scalable, CDN enabled
- Cons: Cost, external dependency
- Good for: Production, large scale

**We'll implement Option 1 (Database) for MVP:**

```java
ProductImage Entity:
- id (PK)
- product_id (FK)
- imageData (BYTEA in PostgreSQL)
- imageName (original filename)
- contentType (image/jpeg, image/png)
- fileSize (in bytes)
- isPrimary (boolean)
- displayOrder (int)
- createdAt

Table: product_images
- IMPORTANT: Use BYTEA type for binary image data
- Add indexes on product_id, isPrimary
```

### Product Service Methods
```java
// Create Product (Vendor)
Product createProduct(Long vendorId, ProductRequest request)
  - Validate vendor exists and approved
  - Validate category exists
  - Create product entity
  - Save product images (if provided)
  - Return created product

// Upload Product Images
List<ProductImage> uploadProductImages(Long productId, List<MultipartFile> files)
  - Validate product exists
  - For each file:
    - Validate file type (jpg, png, gif, webp)
    - Validate file size (max 5MB)
    - Store image data in database
    - Create ProductImage record
  - Return list of uploaded images

// Get Product Details
Product getProductDetails(Long productId)
  - Return product with all images loaded
  - Include vendor info, category, reviews (summary)

// Update Product
Product updateProduct(Long productId, ProductUpdateRequest request)
  - Validate product belongs to vendor
  - Update fields (name, price, stock, etc.)
  - Handle image updates (add/remove)
  - Return updated product

// Delete Product
void deleteProduct(Long productId)
  - Soft delete (set deleted_at timestamp)
  - Images not deleted (kept for history)

// List Products (with pagination and filtering)
Page<Product> listProducts(int page, int size, String category, String search)
  - Filter by category (optional)
  - Search by name/description (LIKE query)
  - Pagination support
  - Order by latest/popular/price

// Get Product Image
byte[] getProductImage(Long imageId)
  - Fetch image BLOB from database
  - Return image bytes for client
  - Set appropriate Content-Type header
```

### API Endpoints
```
GET    /api/v1/products                    - List all products (with filters)
GET    /api/v1/products/{id}               - Get product details
GET    /api/v1/products/{id}/images/{imgId} - Get product image
POST   /api/v1/vendor/products             - Create product (vendor only)
PUT    /api/v1/vendor/products/{id}        - Update product (vendor only)
DELETE /api/v1/vendor/products/{id}        - Delete product (vendor only)
POST   /api/v1/vendor/products/{id}/images - Upload product images (vendor)
```

---

## 4️⃣ TRANSACTION/PAYMENT HISTORY SERVICE

### Design

**Entity: PaymentHistory (extending Payment)**
- Aggregation: Group multiple related payments/refunds
- Timeline: Show all payment events in order

**Query Examples:**
```java
// Get all payments for a user
List<Payment> getPaymentHistory(Long userId)
  SELECT p FROM Payment p
  WHERE p.order.user.id = :userId
  ORDER BY p.createdAt DESC

// Get payment summary for user
PaymentSummary getUserPaymentSummary(Long userId)
  - Total spent
  - Total refunded
  - Average order value
  - Number of orders

// Get payments by date range (for reports)
List<Payment> getPaymentsByDateRange(Long userId, LocalDateTime from, LocalDateTime to)

// Get failed payments (for retry)
List<Payment> getFailedPayments(Long userId)
```

**Service Methods:**
```java
// Get transaction history for user
List<PaymentHistoryDTO> getTransactionHistory(Long userId, int page, int size)
  - Returns paginated list
  - Includes: paymentId, amount, status, date, order details
  - Sorted by date descending

// Get transaction details
PaymentHistoryDTO getTransactionDetails(Long paymentId)
  - Includes: full payment info, order items, refund history
  - Masked card last 4 digits

// Export transaction history (CSV/PDF)
byte[] exportTransactionHistory(Long userId, String format)
  - Generate CSV or PDF report
  - Include summary statistics

// Dashboard statistics
DashboardStats getDashboardStats(Long userId)
  - Total spent
  - Total refunded
  - Number of successful orders
  - Upcoming refunds
  - Failed payments awaiting retry
```

**API Endpoints:**
```
GET  /api/v1/payments/history              - Get user's payment history
GET  /api/v1/payments/{id}/details         - Get payment details
GET  /api/v1/dashboard/stats               - Get payment statistics
GET  /api/v1/payments/export?format=csv    - Export as CSV
```

---

## 5️⃣ CART & CHECKOUT SERVICE

### Cart Service
```java
// Get user's cart
Cart getUserCart(Long userId)
  - Create if doesn't exist
  - Return with all items loaded

// Add item to cart
CartItem addToCart(Long userId, Long productId, int quantity)
  - Validate product exists and not deleted
  - Validate stock available
  - If item already in cart: update quantity
  - Otherwise: create new CartItem
  - Recalculate cart totals
  - Return updated cart

// Update cart item quantity
CartItem updateCartItemQuantity(Long cartItemId, int newQuantity)
  - Validate new quantity > 0
  - Update quantity
  - Recalculate subtotal
  - Return updated item

// Remove item from cart
void removeFromCart(Long cartItemId)
  - Delete CartItem
  - Recalculate cart totals

// Apply coupon/discount
Cart applyCoupon(Long cartId, String couponCode)
  - Validate coupon exists and active
  - Calculate discount amount
  - Update cart discount field
  - Recalculate total

// Clear cart
void clearCart(Long cartId)
  - Delete all CartItems
  - Reset cart totals
```

### Checkout Service
```java
// Prepare checkout
CheckoutData prepareCheckout(Long userId)
  - Get user's cart with all items
  - Validate stock for all items
  - Get user's addresses
  - Calculate totals (subtotal, tax, shipping)
  - Return all checkout data

// Create order from cart
Order createOrder(Long userId, CheckoutRequest request)
  - Validate cart not empty
  - Validate stock for all items
  - Validate shipping address
  - Validate payment method
  - Calculate final totals
  - Create Order with OrderItems (snapshot of products)
  - Create Payment record
  - Clear shopping cart
  - Return created order with payment info

// Calculate totals
OrderTotals calculateTotals(List<CartItem> items, String couponCode, String zipCode)
  - Subtotal = sum of (product.price * quantity)
  - Discount = coupon value if applicable
  - Tax = subtotal * tax_rate (by location)
  - Shipping = calculateShipping(zipCode) or free if order > $50
  - Total = subtotal - discount + tax + shipping
```

**API Endpoints:**
```
GET    /api/v1/cart                        - Get user's cart
POST   /api/v1/cart/items                  - Add item to cart
PUT    /api/v1/cart/items/{id}             - Update item quantity
DELETE /api/v1/cart/items/{id}             - Remove item
DELETE /api/v1/cart                        - Clear cart
POST   /api/v1/cart/coupon                 - Apply coupon
POST   /api/v1/checkout                    - Create order from cart
GET    /api/v1/checkout/summary            - Get checkout summary
```

---

## 6️⃣ ORDER MANAGEMENT SERVICE

### Order Service
```java
// Get user's orders
List<Order> getUserOrders(Long userId)
  - Return all orders for user (paginated)
  - Sorted by date descending

// Get order details
Order getOrderDetails(Long orderId)
  - Full order info with items, payment, shipping address
  - Only user who placed order or admin can view

// Update order status (admin/vendor)
Order updateOrderStatus(Long orderId, OrderStatus newStatus)
  - Validate current status
  - Validate transition allowed
  - Update timestamp fields
  - Trigger notifications

// Cancel order
void cancelOrder(Long orderId)
  - Only if status is PENDING or CONFIRMED
  - Set status to CANCELLED
  - Trigger refund request
  - Return stock to inventory

// Get tracking info
TrackingInfo getTrackingInfo(Long orderId)
  - Return current status, tracking number, estimated delivery

// For vendors: Get pending orders
Page<Order> getVendorOrders(Long vendorId, OrderStatus status)
  - Get all orders containing this vendor's products
  - Filter by status
```

**Order Status Flow:**
```
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED

OR

PENDING/CONFIRMED → CANCELLED (with refund)
```

**API Endpoints:**
```
GET    /api/v1/orders                      - Get user's orders
GET    /api/v1/orders/{id}                 - Get order details
GET    /api/v1/orders/{id}/tracking        - Get tracking info
PUT    /api/v1/orders/{id}/status          - Update order status (admin)
PUT    /api/v1/orders/{id}/cancel          - Cancel order
GET    /api/v1/vendor/orders               - Get vendor's orders
POST   /api/v1/orders/{id}/review          - Submit review after delivery
```

---

## 7️⃣ IMPLEMENTATION SEQUENCE

### Week 1: Authentication (Phase B)
**Priority: CRITICAL - Blocks all other development**

Day 1-2:
- [ ] Implement JwtAuthenticationFilter
- [ ] Enhance SecurityConfig for JWT
- [ ] Add JWT properties to application-dev.properties
- [ ] Implement UserService (register, login, refresh, logout)
- [ ] Update JwtUtils with token validation methods

Day 3:
- [ ] Implement AuthController (register, login, refresh, logout)
- [ ] Update DTOs (AuthResponse with user details)
- [ ] Add Redis integration for token storage
- [ ] Test all auth endpoints

Day 4:
- [ ] Role-based access control (@PreAuthorize)
- [ ] Vendor application endpoint
- [ ] Email verification (basic)

### Week 2: Product Catalog (Phase C)
Day 5-6:
- [ ] ProductImage entity with BYTEA storage
- [ ] ProductService (CRUD, search, filtering)
- [ ] File upload handling and validation
- [ ] ProductController with all endpoints

Day 7:
- [ ] Category management endpoints
- [ ] Product search and filtering
- [ ] Image retrieval endpoint

### Week 3: Cart & Checkout (Phase D partial)
Day 8-9:
- [ ] CartService implementation
- [ ] CheckoutService (order creation, calculations)
- [ ] CartController with all endpoints
- [ ] Apply coupon logic

Day 10:
- [ ] Order creation from checkout
- [ ] Payment integration (use existing PaymentService)
- [ ] Test end-to-end checkout flow

### Week 4: Order Management & Reviews (Phase E)
Day 11-12:
- [ ] OrderService (status tracking, queries)
- [ ] OrderController
- [ ] Order status update notifications
- [ ] Tracking info endpoint

Day 13:
- [ ] ReviewService (CRUD, ratings)
- [ ] ReviewController
- [ ] Rating aggregation on products

### Week 5: Transaction History & Admin
Day 14:
- [ ] PaymentHistoryService (queries, exports)
- [ ] Dashboard statistics endpoints
- [ ] Transaction history endpoints

Day 15:
- [ ] Admin approval workflows
- [ ] Admin dashboards
- [ ] Role-based access on all endpoints

---

## 🔐 Security Checklist

All Services Should Have:
- [ ] Input validation on DTOs (@Valid)
- [ ] Authorization checks (@PreAuthorize)
- [ ] SQL injection prevention (use JPA queries)
- [ ] Rate limiting (on auth endpoints)
- [ ] HTTPS in production
- [ ] CORS configuration
- [ ] Sensitive data masking in responses
- [ ] Audit logging for sensitive operations
- [ ] Error messages without sensitive info

---

## 🗄️ Redis Configuration for Sessions

**application-dev.properties additions:**
```properties
# Redis
spring.redis.host=${REDIS_HOST:localhost}
spring.redis.port=${REDIS_PORT:6379}
spring.redis.timeout=2000
spring.redis.jedis.pool.max-active=8

# Session Configuration
spring.session.store-type=redis
spring.session.redis.namespace=localcart:session
spring.session.timeout=7d  # 7 days - refresh token lifetime
```

**Redis Usage Examples:**
```
// Store refresh token
redis.setex("refresh_token:user123", 604800, tokenValue)

// Invalidate on logout
redis.del("refresh_token:user123")

// Check blacklist
redis.exists("token_blacklist:tokenHash")

// Mark token as revoked
redis.setex("token_blacklist:tokenHash", expiryTime, "revoked")
```

---

## 📊 Database Changes Needed

**New Migrations:**
```sql
V4__auth_and_session.sql
- Add refresh_token table (optional if storing in Redis)
- Add token_blacklist table (optional)
- Ensure user_roles table exists
- Add indexes on auth-related queries

V5__product_enhancements.sql
- Enhance product_images table with image storage columns
- Add content_type column
- Add file_size column

V6__payment_history_views.sql
- Create views for transaction history
- Add indexes on payment queries
```

---

**This plan ensures:**
1. Secure session management with JWT + Redis
2. No server-side session state (stateless API)
3. Easy debugging (tokens contain all user info)
4. Scalable (no session replication needed)
5. Mobile-friendly (standard Authorization header)

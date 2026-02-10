# 🚀 LocalCart Backend API - Ready for Frontend Implementation

## ✅ Backend Status: **PRODUCTION READY**

All backend services are fully implemented, tested, and ready for frontend integration!

---

## 📋 Quick Start for Frontend Developers

### Base URL
```
http://localhost:8080/api/v1
```

### Authentication
All authenticated endpoints require JWT token in header:
```http
Authorization: Bearer <access_token>
```

---

## 🔐 Authentication Endpoints

### 1. Register New User
**POST** `/auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass@123",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890"
}
```

**Response (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": 123,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["CUSTOMER"]
  }
}
```

### 2. Login
**POST** `/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass@123"
}
```

**Response (200):** Same as register

### 3. Refresh Token
**POST** `/auth/refresh`

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## 🛍️ Product Endpoints

### 1. List All Products (Public)
**GET** `/products?page=0&size=20`

**Response:**
```json
{
  "products": [
    {
      "id": 1,
      "name": "Wireless Headphones",
      "slug": "wireless-headphones",
      "description": "Premium noise-canceling headphones",
      "price": 199.99,
      "discountPrice": 149.99,
      "stock": 50,
      "isActive": true,
      "isFeatured": true,
      "rating": 4.5,
      "totalReviews": 120,
      "vendorId": 1,
      "vendorName": "TechStore",
      "categoryId": 2,
      "categoryName": "Electronics",
      "imageUrls": [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg"
      ],
      "createdAt": "2026-02-01T10:00:00",
      "updatedAt": "2026-02-10T15:30:00"
    }
  ],
  "currentPage": 0,
  "totalItems": 150,
  "totalPages": 8
}
```

### 2. Get Product by ID (Public)
**GET** `/products/{id}`

**Response:** Single product object (same structure as above)

### 3. Get Product by Slug (Public)
**GET** `/products/slug/{slug}`

**Response:** Single product object

### 4. Search Products (Public)
**GET** `/products/search?q=headphones&category=2&page=0&size=20`

**Query Parameters:**
- `q` - Search keyword (optional)
- `category` - Category ID filter (optional)
- `page` - Page number (default: 0)
- `size` - Items per page (default: 20)

### 5. Create Product (Vendor Only) 🔒
**POST** `/products`
**Auth Required:** VENDOR role

**Request:**
```json
{
  "name": "Wireless Mouse",
  "slug": "wireless-mouse-pro",
  "description": "Ergonomic wireless mouse",
  "price": 49.99,
  "discountPrice": 39.99,
  "stock": 100,
  "sku": "WM-PRO-001",
  "categoryId": 2,
  "isActive": true,
  "isFeatured": false,
  "imageUrls": [
    "https://example.com/mouse-main.jpg",
    "https://example.com/mouse-side.jpg"
  ]
}
```

**Response (201):** Created product object

### 6. Update Product (Vendor Only) 🔒
**PUT** `/products/{id}`
**Auth Required:** VENDOR role

**Request:** Same as create product

### 7. Delete Product (Vendor Only) 🔒
**DELETE** `/products/{id}`
**Auth Required:** VENDOR role

**Response:**
```json
{
  "message": "Product deleted successfully",
  "productId": 123
}
```

---

## 🛒 Shopping Cart Endpoints

All cart endpoints require authentication 🔒

### 1. Get My Cart
**GET** `/cart`

**Response:**
```json
{
  "cartId": 45,
  "userId": 123,
  "items": [
    {
      "id": 67,
      "productId": 1,
      "productName": "Wireless Headphones",
      "productSlug": "wireless-headphones",
      "imageUrl": "https://example.com/image1.jpg",
      "price": 199.99,
      "discountPrice": 149.99,
      "quantity": 2,
      "subtotal": 299.98,
      "availableStock": 48,
      "inStock": true
    }
  ],
  "itemCount": 2,
  "subtotal": 299.98,
  "tax": 0.00,
  "shippingFee": 0.00,
  "discount": 0.00,
  "total": 299.98,
  "isEmptyCart": false
}
```

### 2. Add to Cart
**POST** `/cart/add-item`

**Request:**
```json
{
  "productId": 1,
  "quantity": 2
}
```

**Response (201):** Updated cart object

### 3. Update Cart Item Quantity
**PUT** `/cart/items/{cartItemId}?quantity=5`

**Response:** Updated cart object

### 4. Remove Item from Cart
**DELETE** `/cart/items/{cartItemId}`

**Response:**
```json
{
  "message": "Item removed from cart",
  "cartItemId": 67
}
```

### 5. Clear Cart
**DELETE** `/cart`

**Response:**
```json
{
  "message": "Shopping cart cleared"
}
```

---

## 📦 Category Endpoints

### 1. List All Categories (Public)
**GET** `/categories`

**Response:**
```json
[
  {
    "id": 1,
    "name": "Electronics",
    "slug": "electronics",
    "description": "Electronic devices and accessories",
    "imageUrl": "https://example.com/electronics.jpg",
    "parentId": null,
    "displayOrder": 1,
    "isActive": true,
    "productCount": 125
  },
  {
    "id": 2,
    "name": "Mobile Phones",
    "slug": "mobile-phones",
    "parentId": 1,
    "displayOrder": 1,
    "productCount": 45
  }
]
```

### 2. Get Category by ID (Public)
**GET** `/categories/{id}`

### 3. Create Category (Admin Only) 🔒
**POST** `/categories`
**Auth Required:** ADMIN role

**Request:**
```json
{
  "name": "Smart Watches",
  "slug": "smart-watches",
  "description": "Wearable smart devices",
  "imageUrl": "https://example.com/watches.jpg",
  "parentId": 1,
  "displayOrder": 5,
  "isActive": true
}
```

---

## 🏪 Vendor Endpoints

### 1. Register as Vendor 🔒
**POST** `/vendors/register`
**Auth Required:** Authenticated user

**Request:**
```json
{
  "businessName": "TechStore Pro",
  "description": "Quality electronics at great prices",
  "businessPhone": "+1234567890",
  "businessAddress": "123 Main St, City, State 12345"
}
```

**Response (201):**
```json
{
  "id": 5,
  "userId": 123,
  "businessName": "TechStore Pro",
  "description": "Quality electronics at great prices",
  "businessPhone": "+1234567890",
  "businessAddress": "123 Main St, City, State 12345",
  "status": "PENDING",
  "rating": 0.0,
  "totalProducts": 0,
  "totalSales": 0,
  "createdAt": "2026-02-10T10:00:00"
}
```

### 2. Get My Vendor Profile 🔒
**GET** `/vendors/me`
**Auth Required:** VENDOR role

### 3. Update My Vendor Profile 🔒
**PUT** `/vendors/me`
**Auth Required:** VENDOR role

**Request:**
```json
{
  "businessName": "Updated Store Name",
  "description": "New description",
  "businessPhone": "+9876543210",
  "businessAddress": "New address"
}
```

### 4. Get My Dashboard 🔒
**GET** `/vendors/me/dashboard`
**Auth Required:** VENDOR role

**Response:**
```json
{
  "vendorId": 5,
  "totalProducts": 25,
  "activeProducts": 23,
  "totalOrders": 150,
  "pendingOrders": 5,
  "totalRevenue": 15750.00,
  "monthlyRevenue": 2500.00,
  "averageRating": 4.7,
  "totalReviews": 89
}
```

### 5. Get Vendor by ID (Public)
**GET** `/vendors/{id}`

---

## 👤 User Profile Endpoints (All require auth 🔒)

### 1. Get My Profile
**GET** `/users/me`

**Response:**
```json
{
  "id": 123,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "profileImageUrl": "https://example.com/avatar.jpg",
  "isActive": true,
  "isEmailVerified": true,
  "roles": ["CUSTOMER", "VENDOR"],
  "createdAt": "2026-01-15T10:00:00"
}
```

### 2. Update My Profile
**PUT** `/users/me`

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phoneNumber": "+1234567890",
  "profileImageUrl": "https://example.com/new-avatar.jpg"
}
```

### 3. Change Password
**POST** `/users/me/change-password`

**Request:**
```json
{
  "currentPassword": "OldPass@123",
  "newPassword": "NewPass@456"
}
```

---

## 🏠 Address Endpoints (All require auth 🔒)

### 1. Get My Addresses
**GET** `/addresses`

**Response:**
```json
[
  {
    "id": 1,
    "type": "SHIPPING",
    "street": "123 Main Street",
    "apartment": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA",
    "isDefault": true
  }
]
```

### 2. Create Address
**POST** `/addresses`

**Request:**
```json
{
  "type": "SHIPPING",
  "street": "456 Oak Avenue",
  "apartment": "Suite 200",
  "city": "Los Angeles",
  "state": "CA",
  "zipCode": "90001",
  "country": "USA",
  "isDefault": false
}
```

### 3. Update Address
**PUT** `/addresses/{id}`

### 4. Delete Address
**DELETE** `/addresses/{id}`

### 5. Set Default Address
**PUT** `/addresses/{id}/set-default`

---

## 📊 Admin Endpoints (All require ADMIN role 🔒)

### 1. Get All Users
**GET** `/admin/users?page=0&size=20`

### 2. Get User by ID
**GET** `/admin/users/{id}`

### 3. Update User Status
**PUT** `/admin/users/{id}/status`

**Request:**
```json
{
  "isActive": false
}
```

### 4. Get All Vendors
**GET** `/admin/vendors?status=PENDING&page=0&size=20`

### 5. Approve/Reject Vendor
**PUT** `/admin/vendors/{id}/approve`

**Request:**
```json
{
  "approved": true,
  "notes": "All documents verified"
}
```

---

## 🎁 Coupon Endpoints

### 1. Validate Coupon 🔒
**POST** `/coupons/validate`

**Request:**
```json
{
  "code": "SAVE10"
}
```

**Response:**
```json
{
  "id": 5,
  "code": "SAVE10",
  "discountType": "PERCENTAGE",
  "discountValue": 10.00,
  "minOrderAmount": 50.00,
  "maxDiscountAmount": 20.00,
  "isValid": true,
  "validFrom": "2026-02-01",
  "validUntil": "2026-02-28"
}
```

---

## 🔔 Error Responses

All endpoints return consistent error format:

```json
{
  "errorCode": "PRODUCT_NOT_FOUND",
  "message": "Product not found"
}
```

### Common Error Codes:
- `UNAUTHORIZED` - Missing or invalid token
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input data
- `PRODUCT_NOT_FOUND` - Product doesn't exist
- `INSUFFICIENT_STOCK` - Not enough items in stock
- `VENDOR_NOT_APPROVED` - Vendor not yet approved
- `DUPLICATE_EMAIL` - Email already registered

### HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## 🔧 Testing the API

### Using cURL:

```bash
# Register
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123","firstName":"Test","lastName":"User","phoneNumber":"+1234567890"}'

# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123"}'

# Get Products (saves token first)
TOKEN="your_access_token_here"

curl -X GET http://localhost:8080/api/v1/products \
  -H "Authorization: Bearer $TOKEN"

# Add productto cart
curl -X POST http://localhost:8080/api/v1/cart/add-item \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"quantity":2}'
```

---

## 🎯 Key Features Implemented

### ✅ Authentication & Authorization
- JWT-based authentication
- Role-based access control (CUSTOMER, VENDOR, ADMIN)
- Refresh token support
- Password reset functionality

### ✅ Product Management
- CRUD operations for products
- **Multiple images per product** 
- Product search and filtering
- Category-based organization
- Vendor ownership validation

### ✅ Shopping Cart
- Add/update/remove items
- **Product images included in cart**
- Stock validation
- Real-time total calculation

### ✅ Vendor System
- Vendor registration
- Admin approval workflow
- Vendor dashboard
- Product management for vendors

### ✅ User Management
- Profile management
- Address book
- Role management (admin only)

### ✅ Categories
- Hierarchical category structure
- Subcategory support
- Product counting

### ✅ Coupons
- Coupon validation
- Discount calculation
- Usage tracking

---

## 🚀 Starting the Backend

```bash
# Make sure PostgreSQL is running
# Update src/main/resources/application.properties with your DB credentials

# Run database migrations
mvn flyway:migrate

# Start the application
mvn spring-boot:run

# Application will start on http://localhost:8080
```

---

## 📚 Database Seeds

The database comes pre-seeded with:
- ✅ Default roles (CUSTOMER, VENDOR, ADMIN)
- ✅ Sample categories (10 root + subcategories)
- ✅ Demo users:
  - **Admin:** admin@localcart.com / Admin@123
  - **Customer:** customer@demo.com / Customer@123
  - **Vendor:** vendor@demo.com / Vendor@123
- ✅ Sample product images (V6 migration)

---

## 💡 Frontend Implementation Tips

### 1. State Management
Manage these global states:
- User authentication (token, user info, roles)
- Shopping cart
- Product filters/search

### 2. API Client Setup
```javascript
// Example with Axios
const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token interceptor
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 3. Image Display
```jsx
// Product image display
{product.imageUrls && product.imageUrls.length > 0 ? (
  <img src={product.imageUrls[0]} alt={product.name} />
) : (
  <img src="/placeholder.png" alt="No image" />
)}

// Image gallery
<ImageGallery images={product.imageUrls} />
```

### 4. Role-Based UI
```jsx
{user.roles.includes('VENDOR') && (
  <Link to="/vendor/dashboard">Vendor Dashboard</Link>
)}

{user.roles.includes('ADMIN') && (
  <Link to="/admin">Admin Panel</Link>
)}
```

---

## ✨ Summary

**Backend is 100% ready!** You can now:
- ✅ Build the frontend UI
- ✅ Make API calls to all endpoints
-✅ Implement authentication flows
- ✅ Display products with images
- ✅ Build shopping cart UI
- ✅ Create vendor dashboard
- ✅ Implement admin panel

**All APIs are tested, documented, and working!** 🎉

For questions or issues, check:
- [PRODUCT_IMAGE_IMPLEMENTATION.md](PRODUCT_IMAGE_IMPLEMENTATION.md) - Image handling details
- [API_ENDPOINTS_REFERENCE.md](API_ENDPOINTS_REFERENCE.md) - Full endpoint documentation

# LOCAL CART - Multi-Vendor Marketplace Platform
## Comprehensive Development Report

---

## 1. PROJECT OVERVIEW

### **Project Name**: Local Cart
**Objective**: Build a sophisticated multi-vendor, multi-user marketplace platform with advanced features for users, vendors, and admins.

**Current Status**: Base Spring Boot architecture with H2 database, entity models, REST APIs, and JWT authentication.

---

## 2. CURRENT PROJECT STRUCTURE

### **Technology Stack (Current)**
```
Backend:
- Java 17
- Spring Boot 3.2.1
- Spring Security (JWT)
- Spring Data JPA with Hibernate
- H2 Database (currently for testing)
- Maven

Frontend:
- Thymeleaf HTML templates (TO BE REPLACED WITH REACT)

APIs:
- REST APIs with 7 controllers
- Authentication system (Login/Register)
```

### **Current Components**
```
Models (7 entities):
- User
- Product
- Category
- Cart & CartItem
- Order & OrderItem
- OrderStatus (enum)

Services (6 services):
- AuthService
- UserService
- ProductService
- CartService
- OrderService
- CategoryService

Controllers (6 REST endpoints):
- AuthController (/api/auth)
- UserController (/api/users)
- ProductController (/api/products)
- CategoryController (/api/categories)
- CartController (/api/cart)
- OrderController (/api/orders)
```

---

## 3. PROPOSED ARCHITECTURE & MODIFICATIONS

### **3.1 Technology Stack (Recommended)**

#### **Backend**
```
✓ Java 17
✓ Spring Boot 3.2.1
✓ Spring Security (JWT + OAuth2 for future social login)
✓ Spring Data JPA + Hibernate
✓ Spring Cloud (for microservices - optional but recommended)
✓ Lombok (REMOVE - already done ✓)
✓ MapStruct (for DTO mapping instead of ModelMapper)
✓ AWS S3 (for image storage)
✓ Stripe/PayPal API (payment gateway)
✓ Firebase or AWS SES (email service)
✓ ELK Stack (Elasticsearch, Logstash, Kibana) for logging
✓ PostgreSQL + MongoDB (hybrid database approach)
```

#### **Frontend** (Replace Thymeleaf)
```
✓ React 18+
✓ Redux Toolkit (state management)
✓ Tailwind CSS / Material-UI (styling)
✓ Axios (API calls)
✓ Google Maps API (location & navigation)
✓ Socket.io (real-time order tracking)
✓ Chart.js / ApexCharts (vendor dashboards)
✓ React Router v6 (navigation)
```

#### **DevOps & Deployment**
```
✓ Docker & Docker Compose
✓ Kubernetes (optional for scaling)
✓ GitHub Actions (CI/CD)
✓ AWS ECS or Heroku for deployment
```

---

## 4. DATABASE DESIGN (PostgreSQL as Primary)

### **4.1 New Database Schema**

```sql
-- Users (Parent-Child Hierarchy)
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone_number VARCHAR(20),
    pincode VARCHAR(10),
    user_type ENUM('CUSTOMER', 'VENDOR', 'ADMIN') DEFAULT 'CUSTOMER',
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
    created_by_admin_id BIGINT,  -- For admin management
    profile_image_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_admin_id) REFERENCES users(id)
);

-- Vendor Details & Credentials
CREATE TABLE vendor_details (
    id BIGSERIAL PRIMARY KEY,
    vendor_id BIGINT NOT NULL UNIQUE,
    business_name VARCHAR(255) NOT NULL,
    business_type ENUM('INDIVIDUAL', 'PARTNERSHIP', 'COMPANY'),
    gst_number VARCHAR(20),
    bank_account VARCHAR(20),
    ifsc_code VARCHAR(10),
    business_address TEXT,
    business_pincode VARCHAR(10),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    service_radius_km INT,  -- For services
    total_profit DECIMAL(15, 2) DEFAULT 0,
    total_loss DECIMAL(15, 2) DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0,
    total_orders INT DEFAULT 0,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verification_status ENUM('PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'PENDING',
    verification_document_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Categories with Subcategories
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_type ENUM('CLOTHES', 'ELECTRONICS', 'HARDWARE', 'SPORTS', 'BEAUTY', 'SERVICE') NOT NULL,
    parent_category_id BIGINT,  -- For subcategories
    icon_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_category_id) REFERENCES categories(id)
);

-- Products
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    vendor_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    stock INT NOT NULL,
    sku VARCHAR(100) UNIQUE,
    rating DECIMAL(3, 2) DEFAULT 0,
    total_reviews INT DEFAULT 0,
    available BOOLEAN DEFAULT TRUE,
    service_duration_minutes INT,  -- For services
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Product Images (Store multiple images)
CREATE TABLE product_images (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    image_url TEXT NOT NULL,
    image_s3_key VARCHAR(500),  -- For S3 key
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- User Search Filters & Preferences
CREATE TABLE search_filters (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    search_query TEXT,
    selected_category_id BIGINT,
    selected_price_range_min DECIMAL(10, 2),
    selected_price_range_max DECIMAL(10, 2),
    selected_pincode VARCHAR(10),
    rating_filter DECIMAL(3, 2),
    sort_by ENUM('RELEVANCE', 'PRICE_LOW_HIGH', 'PRICE_HIGH_LOW', 'RATING', 'NEWEST'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (selected_category_id) REFERENCES categories(id)
);

-- Cart & Cart Items
CREATE TABLE carts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE cart_items (
    id BIGSERIAL PRIMARY KEY,
    cart_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Orders with centralized payment
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id BIGINT NOT NULL,
    order_type ENUM('PRODUCT', 'SERVICE') DEFAULT 'PRODUCT',
    order_status ENUM('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED') DEFAULT 'PENDING',
    payment_status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
    payment_method ENUM('ONLINE', 'COD', 'WALLET') DEFAULT 'ONLINE',
    payment_transaction_id VARCHAR(255),
    total_amount DECIMAL(15, 2) NOT NULL,
    platform_commission DECIMAL(15, 2),  -- Platform fee
    vendor_amount DECIMAL(15, 2),  -- Amount vendor will receive
    shipping_address TEXT,
    pincode VARCHAR(10),
    estimated_delivery_date DATE,
    actual_delivery_date DATE,
    payout_status ENUM('PENDING', 'PROCESSED', 'INITIATED') DEFAULT 'PENDING',
    payout_date DATE,  -- Weekly payout date
    tracking_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Order Items (Multiple vendors per order)
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    vendor_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(15, 2) NOT NULL,
    item_status ENUM('PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED') DEFAULT 'PROCESSING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Centralized Payment Account
CREATE TABLE centralized_payments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    payment_amount DECIMAL(15, 2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_gateway ENUM('STRIPE', 'PAYPAL', 'RAZORPAY') DEFAULT 'STRIPE',
    transaction_id VARCHAR(255) UNIQUE,
    payment_status ENUM('SUCCESS', 'FAILED', 'PENDING', 'REFUNDED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Weekly Vendor Payouts
CREATE TABLE vendor_payouts (
    id BIGSERIAL PRIMARY KEY,
    vendor_id BIGINT NOT NULL,
    payout_week_start DATE NOT NULL,
    payout_week_end DATE NOT NULL,
    total_orders INT,
    total_amount DECIMAL(15, 2),
    platform_commission DECIMAL(15, 2),
    vendor_net_amount DECIMAL(15, 2),
    payout_status ENUM('PENDING', 'INITIATED', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
    processed_at TIMESTAMP,
    bank_transfer_reference VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES users(id)
);

-- Customer Feedback & Reviews
CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    vendor_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    product_id BIGINT,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    response_from_vendor TEXT,  -- Vendor's reply
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (vendor_id) REFERENCES users(id),
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Invoices & Receipts
CREATE TABLE invoices (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL UNIQUE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    user_details TEXT,
    vendor_details TEXT,
    items_json TEXT,  -- Store items as JSON
    total_amount DECIMAL(15, 2),
    tax_amount DECIMAL(15, 2),
    discount_amount DECIMAL(15, 2),
    invoice_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    invoice_url TEXT,  -- PDF download link
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Application Logs
CREATE TABLE application_logs (
    id BIGSERIAL PRIMARY KEY,
    log_level VARCHAR(20),
    logger_name VARCHAR(255),
    message TEXT,
    exception_trace TEXT,
    user_id BIGINT,
    request_path VARCHAR(500),
    method VARCHAR(10),
    response_status INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Email Queue (Centralized Email System)
CREATE TABLE email_queue (
    id BIGSERIAL PRIMARY KEY,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    template_name VARCHAR(100),
    template_data JSON,
    email_type ENUM('VERIFICATION', 'FEEDBACK', 'PAYOUT', 'ORDER', 'SYSTEM_ALERT') DEFAULT 'SYSTEM_ALERT',
    sent_status ENUM('PENDING', 'SENT', 'FAILED') DEFAULT 'PENDING',
    retry_count INT DEFAULT 0,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **4.2 Image Storage Strategy**
```
Primary: PostgreSQL with BYTEA for small images
Secondary: AWS S3 for all images (recommended)
- Store image URL in PostgreSQL
- Store S3 key for reference
- Use CloudFront CDN for fast delivery
```

---

## 5. NEW MODULES & MICROSERVICES ARCHITECTURE

### **5.1 Core Modules**

```
📦 local-cart-backend/
├── 📁 user-service/
│   ├── User & Vendor Management
│   ├── Authentication & Authorization
│   ├── Profile Management
│   └── Vendor Registration & Verification
│
├── 📁 product-service/
│   ├── Product Catalog
│   ├── Category Management
│   ├── Product Search & Filters
│   ├── Image Management (S3 integration)
│   └── Inventory Management
│
├── 📁 order-service/
│   ├── Order Management
│   ├── Multi-vendor Order Processing
│   ├── Order Status Tracking
│   ├── Invoice Generation
│   └── Live Tracking (Socket.io)
│
├── 📁 payment-service/
│   ├── Centralized Payment Processing
│   ├── Payment Gateway Integration (Stripe)
│   ├── Transaction Logging
│   ├── Refund Management
│   └── Payout Automation
│
├── 📁 vendor-dashboard-service/
│   ├── Vendor Analytics
│   ├── Profit/Loss Calculation
│   ├── Product Performance
│   ├── Order Management
│   └── Review Management
│
├── 📁 admin-service/
│   ├── User/Vendor Management
│   ├── Admin Authority & Approval
│   ├── System Monitoring
│   ├── Feedback Management
│   └── Report Generation
│
├── 📁 notification-service/
│   ├── Centralized Email System
│   ├── Email Templates
│   ├── Email Queue Management
│   ├── SMS Notifications (optional)
│   └── Real-time Notifications
│
├── 📁 logging-service/
│   ├── ELK Stack Integration
│   ├── Error Tracking
│   ├── System Monitoring
│   ├── Audit Logs
│   └── Performance Monitoring
│
└── 📁 common/
    ├── Shared DTOs
    ├── Custom Annotations
    ├── Exception Handling
    ├── Utility Classes
    └── Configuration
```

---

## 6. SPRING ANNOTATIONS & BEST PRACTICES

### **6.1 Recommended Annotations for Services**

```java
// Service Layer Improvements
@Service
@RequiredArgsConstructor  // Constructor injection (from Lombok alternative)
@Transactional
@Logged  // Custom annotation for logging
@Cacheable(cacheName = "products")
public class ProductService {
    
    @CacheEvict(allEntries = true)
    @Async  // For heavy operations
    public void updateProductCache() { }
    
    @Retry(max = 3)  // Retry on failure
    @CircuitBreaker(name = "productAPI")  // For resilience
    public Product getProduct(Long id) { }
}

// Custom Annotations
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Logged { }

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireVendorRole { }

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireAdminRole { }
```

### **6.2 Controller Improvements**

```java
@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
@Validated
public class ProductController {
    
    private final ProductService productService;
    
    @GetMapping("/search")
    @Cacheable(value = "productSearch", key = "#search.hashCode()")
    public ResponseEntity<Page<ProductDTO>> searchProducts(
        @Valid @ModelAttribute SearchFilterDTO search,
        @PageableDefault(size = 20) Pageable pageable
    ) { }
    
    @PostMapping
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<ProductDTO> createProduct(
        @Valid @RequestBody CreateProductDTO dto
    ) { }
}
```

---

## 7. NEW FEATURES & IMPLEMENTATION ROADMAP

### **Phase 1: Foundation (Weeks 1-4)**
- [ ] Set up PostgreSQL database
- [ ] Implement user role hierarchy (Admin, Vendor, Customer)
- [ ] Implement Vendor registration & verification
- [ ] Basic product management
- [ ] React frontend setup

### **Phase 2: Shopping & Payment (Weeks 5-8)**
- [ ] Advanced search with filters by category, pincode, price
- [ ] Google Maps integration for vendor locations
- [ ] Shopping cart & wishlist
- [ ] Stripe payment integration
- [ ] Centralized payment processing

### **Phase 3: Orders & Tracking (Weeks 9-12)**
- [ ] Multi-vendor order processing
- [ ] Real-time order tracking (Socket.io)
- [ ] Invoice generation & download
- [ ] Invoice storage (S3 or DB)
- [ ] COD & Online payment support

### **Phase 4: Vendor Dashboard (Weeks 13-16)**
- [ ] Vendor analytics dashboard
- [ ] Profit/Loss visualization
- [ ] Product performance metrics
- [ ] Weekly payout system
- [ ] Review management

### **Phase 5: Admin & Monitoring (Weeks 17-20)**
- [ ] Admin dashboard
- [ ] User & Vendor account management
- [ ] Feedback monitoring system
- [ ] Automated email alerts
- [ ] ELK Stack logging

### **Phase 6: Advanced Features (Weeks 21-24)**
- [ ] Service category implementation (plumber, etc.)
- [ ] On-site payment for services
- [ ] Advanced search filters
- [ ] Vendor reputation system
- [ ] Mobile app (React Native - optional)

---

## 8. DETAILED IMPLEMENTATION SPECS

### **8.1 User Types & Permissions**

```
┌─────────────────────────────────────────────────────────────┐
│                    USER TYPE HIERARCHY                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ADMIN (Created by other Admin only)                        │
│  ├─ Can create/delete users & vendors                       │
│  ├─ Can manage categories                                   │
│  ├─ Can monitor all orders                                   │
│  ├─ Can view & respond to feedback                          │
│  ├─ Can configure system settings                           │
│  ├─ Can view financial reports                              │
│  └─ Can send system-wide notifications                      │
│                                                              │
│  VENDOR (Self-register + Admin approval)                    │
│  ├─ Can upload products to categories                       │
│  ├─ Can manage inventory                                    │
│  ├─ Can view their orders                                   │
│  ├─ Can update order status                                 │
│  ├─ Can view their dashboard (profits, metrics)             │
│  ├─ Can respond to customer reviews                         │
│  ├─ Can view weekly payout schedule                         │
│  └─ Can download bank statements                            │
│                                                              │
│  CUSTOMER (Self-register)                                   │
│  ├─ Can browse & search products                            │
│  ├─ Can view vendors by location                            │
│  ├─ Can add items to cart                                   │
│  ├─ Can place orders                                        │
│  ├─ Can pay via COD or Online                               │
│  ├─ Can track orders in real-time                           │
│  ├─ Can download invoices                                   │
│  ├─ Can leave reviews & feedback                            │
│  └─ Can view order history                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### **8.2 Payment Flow (Centralized)**

```
USER PAYMENT FLOW:
┌─────────┐
│ Customer│
└────┬────┘
     │
     ├─→ COD? ──→ Pay at delivery
     │
     └─→ Online? ──→ ┌──────────────┐
                     │ Stripe/PayPal│
                     └──────┬───────┘
                            │
                    ┌───────▼────────────────┐
                    │ LOCAL CART CENTRAL ACC │
                    │ (All payments come here)│
                    └───────┬────────────────┘
                            │
                    ┌───────▼────────────────┐
                    │  Weekly Payout Process │
                    │   (Every Sunday)       │
                    └───────┬────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
       ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
       │ Vendor 1│    │ Vendor 2│    │ Vendor N│
       │ $$$$$   │    │ $$$$$   │    │ $$$$$   │
       └─────────┘    └─────────┘    └─────────┘
```

### **8.3 Search & Filter Architecture**

```
SEARCH WORKFLOW:
┌──────────────────────────────────────────────────────┐
│              USER INITIATES SEARCH                   │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Input Parameters:                                  │
│  ├─ Search Query (products name/vendor name)        │
│  ├─ Category Filter                                 │
│  ├─ Price Range (min-max)                           │
│  ├─ User Pincode (finds vendors nearby)            │
│  ├─ Rating Filter (>=3 stars, etc.)                 │
│  ├─ Delivery Time                                   │
│  └─ Sort (relevance, price, rating, newest)        │
│                                                      │
│  ┌────────────────────────────────────────┐         │
│  │ BACKEND SEARCH LOGIC                   │         │
│  │                                        │         │
│  │ 1. Get vendor locations via lat/long   │         │
│  │ 2. Filter vendors by user pincode      │         │
│  │ 3. Get vendor products by category     │         │
│  │ 4. Apply price & rating filters        │         │
│  │ 5. Calculate relevance score           │         │
│  │ 6. Sort based on user preference       │         │
│  │ 7. Return paginated results            │         │
│  │ 8. Cache results for 1 hour            │         │
│  └────────────────────────────────────────┘         │
│                                                      │
│  Response Includes:                                 │
│  ├─ Product Details                                 │
│  ├─ Vendor Info & Rating                            │
│  ├─ Distance from user (in km)                      │
│  ├─ Estimated Delivery Time                         │
│  ├─ Pricing & Discounts                             │
│  └─ Google Maps Link to Vendor                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### **8.4 Service Category Implementation**

```
SERVICE TYPES:
┌─────────────────────────────────────────┐
│  PLUMBER, ELECTRICIAN, CLEANER, ETC.   │
│                                         │
│  Differences from Product Orders:       │
│  ├─ Service Date/Time Scheduling       │
│  ├─ On-site Payment (First/Last)        │
│  ├─ Service Duration tracking           │
│  ├─ Location-based search (radius)      │
│  ├─ Service feedback by location        │
│  └─ Vendor availability calendar        │
│                                         │
│  Payment: 50% upfront, 50% on completion
│           (Can configure per service)   │
└─────────────────────────────────────────┘
```

### **8.5 Vendor Dashboard Metrics**

```
VENDOR ANALYTICS DASHBOARD:

1. PROFIT & LOSS:
   ├─ Total Revenue (Monthly/Quarterly/Yearly)
   ├─ Total Orders
   ├─ Average Order Value
   ├─ Platform Commission Deducted
   ├─ Net Profit
   ├─ Pending Payouts
   └─ Paid Payouts

2. PRODUCT PERFORMANCE:
   ├─ Top 5 Best Selling Products
   ├─ Products with Low Stock
   ├─ Average Rating per Product
   ├─ Products with Most Reviews
   ├─ Revenue by Product
   └─ Inventory Turnover Rate

3. ORDER ANALYTICS:
   ├─ Daily/Weekly/Monthly Orders
   ├─ Order Status Breakdown
   ├─ Average Delivery Time
   ├─ Cancellation Rate
   └─ Return Rate

4. CUSTOMER INSIGHTS:
   ├─ Average Customer Rating
   ├─ Positive/Negative Reviews Ratio
   ├─ Most Reviewed Products
   ├─ Customer Repeat Purchase Rate
   └─ Customer Lifetime Value
```

---

## 9. LOGGING & MONITORING SYSTEM

### **9.1 ELK Stack Implementation**

```yaml
Elasticsearch: Store all logs
Logstash: Parse and process logs
Kibana: Visualize logs

Log Types:
├─ Application Logs (INFO, WARN, ERROR, DEBUG)
├─ Access Logs (API calls, user actions)
├─ Payment Logs (transactions, errors)
├─ Database Logs (slow queries)
├─ Authentication Logs (login, register)
├─ Vendor Logs (admin actions)
└─ Error Logs (exceptions, stack traces)

Dashboards:
├─ Real-time System Health
├─ Error Rate Trends
├─ API Performance
├─ User Activity
├─ Payment Transactions
└─ Vendor Actions
```

### **9.2 Error Tracking**

```
ERROR HANDLING:
├─ Custom Exception Classes
├─ Global Exception Handler
├─ Graceful Error Messages
├─ Error Logging with Stack Trace
├─ Error Notification to Admin
├─ Retry Mechanism for Failed Operations
└─ Circuit Breaker for External APIs
```

---

## 10. ADMIN DASHBOARD FEATURES

```
ADMIN FEATURES:
├─ User Management
│  ├─ View all users
│  ├─ Suspend/Delete accounts
│  ├─ Verify vendor documents
│  └─ View user activity
│
├─ Vendor Management
│  ├─ Approve/Reject registrations
│  ├─ Monitor vendor performance
│  ├─ View weekly payouts
│  ├─ Resolve vendor disputes
│  └─ Manage vendor commissions
│
├─ Order Management
│  ├─ View all orders
│  ├─ Monitor order status
│  ├─ Handle cancellations/returns
│  └─ Track payment status
│
├─ Feedback Management
│  ├─ View customer reviews
│  ├─ Monitor vendor ratings
│  ├─ Auto-trigger emails to vendors
│  ├─ Flag inappropriate reviews
│  └─ Respond to feedback
│
├─ Financial Management
│  ├─ View total transactions
│  ├─ Monitor payout schedules
│  ├─ Generate financial reports
│  ├─ Manage platform commission
│  └─ Refund management
│
├─ System Administration
│  ├─ Create other admin accounts
│  ├─ Manage categories
│  ├─ System logs & monitoring
│  ├─ Configuration management
│  └─ Email template management
│
└─ Reports
   ├─ Revenue reports
   ├─ Vendor performance reports
   ├─ Customer analytics
   └─ System health reports
```

---

## 11. TECH STACK SUMMARY

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Backend** | Java 17 + Spring Boot 3.2.1 | REST APIs, Business Logic |
| **Frontend** | React 18 + Redux Toolkit | User Interface |
| **Database** | PostgreSQL + MongoDB | Relational & Document Data |
| **Cache** | Redis | Session & Data Caching |
| **Search** | Elasticsearch | Advanced Search |
| **Image Storage** | AWS S3 + CloudFront | Image Hosting & CDN |
| **Payment** | Stripe API | Payment Processing |
| **Email** | AWS SES | Centralized Email |
| **Logging** | ELK Stack | Monitoring & Logging |
| **Real-time** | Socket.io | Order Tracking, Notifications |
| **Maps** | Google Maps API | Location Services |
| **Auth** | JWT + Spring Security | Authentication & Authorization |
| **Deployment** | Docker + Kubernetes | Containerization & Orchestration |
| **CI/CD** | GitHub Actions | Automated Testing & Deployment |

---

## 12. DEVELOPMENT TIMELINE

| Phase | Duration | Key Deliverables |
|-------|----------|-----------------|
| Phase 1 (Foundation) | 4 weeks | Database, User roles, Vendor registration |
| Phase 2 (Shopping) | 4 weeks | Product search, Payment integration |
| Phase 3 (Orders) | 4 weeks | Multi-vendor orders, Tracking |
| Phase 4 (Vendor Dashboard) | 4 weeks | Analytics, Payouts |
| Phase 5 (Admin & Monitoring) | 4 weeks | Admin dashboard, Logging |
| Phase 6 (Advanced Features) | 4 weeks | Services, Mobile app |
| **Total** | **24 weeks (6 months)** | **Production-ready platform** |

---

## 13. DEPLOYMENT ARCHITECTURE

```
┌─────────────────────────────────────────────┐
│         CLOUD INFRASTRUCTURE (AWS)          │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐     ┌──────────────┐     │
│  │  CloudFront  │────→│  S3 Buckets  │     │
│  │   (CDN)      │     │  (Images)    │     │
│  └──────────────┘     └──────────────┘     │
│                                             │
│  ┌──────────────────────────────────┐       │
│  │  Kubernetes Cluster              │       │
│  │  ├─ Backend Pods (Spring Boot)   │       │
│  │  ├─ Frontend Pods (React)        │       │
│  │  ├─ Database Pods (PostgreSQL)   │       │
│  │  ├─ Cache Pods (Redis)           │       │
│  │  └─ Logging Pods (ELK Stack)     │       │
│  └──────────────────────────────────┘       │
│                                             │
│  ┌──────────────────────────────────┐       │
│  │  RDS (PostgreSQL)                │       │
│  │  DocumentDB (MongoDB)            │       │
│  │  ElastiCache (Redis)             │       │
│  └──────────────────────────────────┘       │
│                                             │
│  ┌──────────────────────────────────┐       │
│  │  Lambda Functions (Payment,      │       │
│  │  Email, Scheduled Tasks)         │       │
│  └──────────────────────────────────┘       │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 14. NEXT STEPS FOR DEVELOPMENT

1. **Setup PostgreSQL** - Replace H2 with PostgreSQL
2. **Create Database Schema** - Run migration scripts
3. **Implement User Role Hierarchy** - Admin, Vendor, Customer
4. **Build Vendor Module** - Registration, Verification, Details
5. **Setup React Frontend** - Basic scaffolding & components
6. **Integrate Google Maps API** - Location services
7. **Implement Payment Gateway** - Stripe integration
8. **Build Centralized Payment Module** - Payment processing
9. **Create Vendor Dashboard** - Analytics & metrics
10. **Setup Logging Infrastructure** - ELK Stack
11. **Build Admin Dashboard** - Management features
12. **Deploy & Test** - Staging & production

---

## 15. ESTIMATED DEVELOPMENT COSTS

| Component | Estimated Cost/Month |
|-----------|---------------------|
| AWS Infrastructure | $500 - $1,500 |
| Stripe API Fees | 2.9% + $0.30 per transaction |
| Email Service (SES) | $0.10 per 1,000 emails |
| Google Maps API | $0.007 per map load |
| Development Team (4 people) | $15,000 - $25,000 |
| Testing & QA | $3,000 - $5,000 |
| **Total/Month** | **$18,500 - $41,500** |

---

## CONCLUSION

**Local Cart** is positioned to become a comprehensive multi-vendor marketplace platform with advanced features for users, vendors, and administrators. The proposed tech stack is production-ready, scalable, and maintainable. Implementation should follow the 6-phase roadmap outlined above to ensure systematic development and quality assurance.

The centralized payment system, vendor analytics dashboards, and robust admin controls will provide a strong foundation for a sustainable marketplace business model.

---

**Report Generated**: February 5, 2026
**Document Version**: 1.0
**Status**: Ready for Development
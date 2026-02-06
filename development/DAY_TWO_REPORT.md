# LOCAL CART - Day Two Development Report
**Date**: February 6, 2026  
**Project**: Local Cart - Multi-Vendor Marketplace Platform  
**Development Phase**: Phase A - Foundation and Data Model

---

## EXECUTIVE SUMMARY

### Status: ✅ PHASE A COMPLETED - DATABASE & ENTITY LAYER READY
Day 2 focused on completing the foundational data model for the entire application. We successfully implemented all core entities, repositories, and database migration scripts. The application now has a complete persistence layer ready for service and API development.

**Key Achievement**: Complete end-to-end database architecture from entities to PostgreSQL migrations with seed data.

---

## 1. WHAT WE HAVE IMPLEMENTED

### A. Entity Layer (13 Core Entities)

#### Tier 1: User Management
1. **User Entity** (`User.java`)
   - **Purpose**: Core user account management
   - **What it does**: Stores user credentials, profile information, and manages relationships with roles, addresses, vendors, carts, orders, and reviews
   - **Key Fields**: email, password (encrypted), firstName, lastName, phoneNumber, isActive, isEmailVerified
   - **Relationships**: 
     - Many-to-Many with Roles (via user_roles table)
     - One-to-Many with Addresses
     - One-to-One with Vendor (for vendor users)
     - One-to-One with Cart
     - One-to-Many with Orders and Reviews

2. **Role Entity** (`Role.java`)
   - **Purpose**: Role-based access control (RBAC)
   - **What it does**: Defines user permissions (CUSTOMER, VENDOR, ADMIN)
   - **Usage**: Users can have multiple roles enabling flexible permission management

3. **Address Entity** (`Address.java`)
   - **Purpose**: Store shipping and billing addresses
   - **What it does**: Manages user addresses with support for multiple addresses per user
   - **Key Fields**: street, apartment, city, state, zipCode, country, type (SHIPPING/BILLING), isDefault
   - **Usage**: Used in order checkout for shipping and billing information

#### Tier 2: Vendor & Product Management
4. **Vendor Entity** (`Vendor.java`)
   - **Purpose**: Multi-vendor marketplace vendor profiles
   - **What it does**: Stores business information, approval status, and vendor ratings
   - **Key Fields**: businessName, description, taxId, businessPhone, status (PENDING/APPROVED/REJECTED), rating, totalReviews
   - **Workflow**: Admin approves/rejects vendor applications
   - **Usage**: Links products to vendors, tracks vendor performance

5. **Category Entity** (`Category.java`)
   - **Purpose**: Product categorization hierarchy
   - **What it does**: Organizes products into categories and subcategories
   - **Key Features**: 
     - Self-referential relationship for parent-child hierarchy
     - Slug for SEO-friendly URLs
     - Display order for custom sorting
   - **Usage**: Customers browse products by category

6. **Product Entity** (`Product.java`)
   - **Purpose**: Product catalog management
   - **What it does**: Stores complete product information including pricing, inventory, and ratings
   - **Key Fields**: name, slug, description, price, discountPrice, stock, SKU, isActive, isFeatured, rating
   - **Relationships**: Belongs to Vendor and Category, has multiple ProductImages
   - **Usage**: Core marketplace offering - what customers purchase

7. **ProductImage Entity** (`ProductImage.java`)
   - **Purpose**: Product visual assets management
   - **What it does**: Stores product images with support for multiple images per product
   - **Key Fields**: imageUrl, altText, isPrimary, displayOrder
   - **Usage**: Display product photos in listings and detail pages

#### Tier 3: Shopping & Orders
8. **Cart Entity** (`Cart.java`)
   - **Purpose**: Shopping cart management
   - **What it does**: One cart per user to store items before checkout
   - **Relationships**: One-to-One with User, One-to-Many with CartItems
   - **Usage**: Temporary storage before order creation

9. **CartItem Entity** (`CartItem.java`)
   - **Purpose**: Individual items in shopping cart
   - **What it does**: Links products to cart with quantity
   - **Key Fields**: product reference, quantity
   - **Usage**: Track what and how much user wants to buy

10. **Order Entity** (`Order.java`)
    - **Purpose**: Customer order management
    - **What it does**: Captures complete order details including items, amounts, addresses, and status
    - **Key Fields**: orderNumber (unique), status, subtotal, tax, shippingFee, discount, total, trackingNumber
    - **Status Workflow**: PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED (or CANCELLED)
    - **Relationships**: Belongs to User, has many OrderItems, has one Payment
    - **Usage**: Core transaction record for purchases

11. **OrderItem Entity** (`OrderItem.java`)
    - **Purpose**: Line items in orders
    - **What it does**: Stores snapshot of product details at time of purchase
    - **Key Fields**: productName (snapshot), unitPrice, quantity, subtotal, vendor reference
    - **Why snapshot**: Preserves order details even if product is later modified/deleted
    - **Usage**: Order history and vendor fulfillment

#### Tier 4: Payments & Reviews
12. **Payment Entity** (`Payment.java`)
    - **Purpose**: Payment transaction tracking
    - **What it does**: Records payment method, status, transaction IDs, and refund information
    - **Key Fields**: transactionId, paymentMethod, amount, status (PENDING/COMPLETED/FAILED/REFUNDED)
    - **Relationships**: One-to-One with Order
    - **Usage**: Financial audit trail and payment reconciliation

13. **Review Entity** (`Review.java`)
    - **Purpose**: Customer feedback and ratings
    - **What it does**: Allows customers to rate and review products and vendors
    - **Key Fields**: rating (1-5), title, comment, isVerifiedPurchase
    - **Relationships**: Links User, Product, Vendor, and optionally Order
    - **Usage**: Build trust, help customers make decisions, track vendor/product quality

---

### B. Repository Layer (13 Repositories)

Each entity has a corresponding Spring Data JPA repository with custom query methods:

1. **UserRepository**
   - Find by email (for authentication)
   - Check email existence (for registration)
   - Find with roles pre-loaded (for authorization)
   - List active users only

2. **RoleRepository**
   - Find role by name (RoleType enum)
   - Check role existence

3. **AddressRepository**
   - Find addresses by user
   - Get default address
   - Filter by address type (SHIPPING/BILLING)

4. **VendorRepository**
   - Find by user ID
   - Find by business name
   - List by status (PENDING for admin approval queue)
   - List all approved vendors

5. **CategoryRepository**
   - Find by slug (for SEO URLs)
   - Get root categories (no parent)
   - Get subcategories by parent ID
   - Ordered categories for display

6. **ProductRepository**
   - Find by slug (for product pages)
   - Paginated listing by vendor, category
   - Active products only (for customer view)
   - Featured products (for homepage)
   - Search by keyword (name and description)

7. **ProductImageRepository**
   - Find images by product
   - Get primary image
   - Ordered images for gallery

8. **CartRepository**
   - Find cart by user ID
   - Load cart with items (JOIN FETCH)

9. **CartItemRepository**
   - Find items by cart
   - Find specific product in cart
   - Delete all items in cart (on checkout)

10. **OrderRepository**
    - Find by order number
    - Paginated user order history
    - Filter by status
    - Find orders by vendor (for vendor dashboard)
    - Orders by date range (for reporting)
    - Count user orders

11. **OrderItemRepository**
    - Find items by order
    - Find items by vendor (for fulfillment)

12. **PaymentRepository**
    - Find payment by order
    - Find by transaction ID (for webhook callbacks)
    - Filter by status

13. **ReviewRepository**
    - Paginated product reviews
    - User review history
    - Vendor reviews
    - Calculate average rating (aggregation queries)
    - Check if user已 reviewed product

**Purpose of Repositories**: Provide data access layer with type-safe queries, reducing boilerplate code and SQL injection risks.

---

### C. Database Migration Scripts

#### V1__initial_schema.sql (Main Schema)
- **Purpose**: Create all database tables, indexes, constraints, and triggers
- **What it does**:
  1. Creates 13 main tables matching entities
  2. Defines foreign key relationships
  3. Adds indexes for frequently queried columns (email, slug, status, dates)
  4. Implements constraints (CHECK for positive prices, valid ratings 1-5)
  5. Creates `updated_at` auto-update triggers for all tables
  6. Enables soft delete pattern (is_deleted, deleted_at)

- **Key Tables Created**:
  - `users` - User accounts
  - `roles` - Permission roles
  - `user_roles` - Many-to-many junction
  - `addresses` - User addresses
  - `vendors` - Vendor business profiles
  - `categories` - Product categories (hierarchical)
  - `products` - Product catalog
  - `product_images` - Product photos
  - `carts` - Shopping carts
  - `cart_items` - Cart contents
  - `orders` - Customer orders
  - `order_items` - Order line items  
  - `payments` - Payment transactions
  - `reviews` - Product/vendor reviews

- **Indexes Created**: 30+ indexes for performance optimization on:
  - Unique fields (email, slug, orderNumber, businessName)
  - Foreign keys (for JOIN performance)
  - Frequently filtered fields (status, isActive, createdAt, rating)

#### V2__seed_data.sql (Initial Data)
- **Purpose**: Populate database with essential bootstrap data
- **What it does**:
  1. **Inserts 3 Roles**: CUSTOMER, VENDOR, ADMIN
  2. **Creates 10 Root Categories**: Electronics, Fashion, Home & Kitchen, Beauty, Sports, Books, Toys, Food, Health, Automotive
  3. **Creates 20 Subcategories**: Under Electronics (Mobile Phones, Laptops, Audio, Cameras), Fashion (Men's/Women's Clothing, Shoes, Accessories), Home & Kitchen (Appliances, Decor, Furniture, Bedding)
  4. **Creates 3 Demo Users**:
     - Admin user (admin@localcart.com) - for platform management
     - Customer user (customer@demo.com) - for testing shopping flow
     - Vendor user (vendor@demo.com) - for testing vendor features
  5. **Creates 1 Demo Vendor**: "Demo Electronics Store" (APPROVED status)
  6. **Creates cart and address** for demo customer

- **Purpose of Seed Data**: Enable immediate testing without manual data entry, provide realistic category structure, demonstrate multi-role assignment

---

## 2. WHAT IT WILL DO - APPLICATION CAPABILITIES

### A. User Management Capabilities
✅ **User Registration & Authentication**
- Store encrypted passwords
- Email-based login
- Email verification tracking
- Account activation/deactivation

✅ **Role-Based Access Control**
- Users can be: Customers, Vendors, Admins, or multiple roles
- Flexible permission management
- Vendor-specific features unlocked upon approval

✅ **Address Management**
- Multiple shipping/billing addresses per user
- Default address selection
- Address reuse across orders

### B. Vendor Management Capabilities
✅ **Vendor Onboarding**
- Vendor application submission
- Admin approval workflow (PENDING → APPROVED/REJECTED)
- Business profile management
- Rejection feedback

✅ **Vendor Performance Tracking**
- Average rating calculation
- Total review count
- Product sales tracking (via order items)

### C. Product Catalog Capabilities
✅ **Product Management**
- Vendor can create/update products
- Stock management (inventory tracking)
- Pricing with optional discounts
- SKU tracking
- Product activation/deactivation
- Featured product promotion

✅ **Category Organization**
- Hierarchical category structure (categories + subcategories)
- SEO-friendly URLs via slugs
- Custom ordering for display

✅ **Product Images**
- Multiple images per product
- Primary image designation
- Image ordering for galleries

✅ **Product Discovery**
- Browse by category
- Search by keyword
- Filter by featured products
- Filter by vendor

### D. Shopping & Checkout Capabilities
✅ **Shopping Cart**
- Add/remove/update product quantities
- Persistent cart (database-backed)
- One cart per user
- Clear cart on checkout

✅ **Order Processing**
- Unique order number generation
- Order total calculation (subtotal + tax + shipping - discount)
- Multi-vendor order support (different items from different vendors)
- Shipping and billing address capture
- Order status tracking workflow

✅ **Order Status Tracking**
- PENDING: Order placed, awaiting confirmation
- CONFIRMED: Vendor confirmed, ready to process
- PROCESSING: Being prepared for shipment
- SHIPPED: Dispatched with tracking number
- DELIVERED: Completed successfully
- CANCELLED: Order cancelled (with reason)

### E. Payment Capabilities
✅ **Payment Processing**
- Payment method capture
- Transaction ID tracking
- Payment status management
- Refund support with refund amount tracking
- Failure reason capture

### F. Review & Rating Capabilities
✅ **Customer Reviews**
- Rate products (1-5 stars)
- Write review title and detailed comments
- Verified purchase badges
- Link reviews to specific orders

✅ **Rating Aggregation**
- Automatic average rating calculation for products
- Automatic average rating calculation for vendors
- Total review counts

---

## 3. PURPOSE & ARCHITECTURE DECISIONS

### A. Why These Entities?
**MVP Requirement Mapping**:
- **User, Role, Address**: Essential for any e-commerce platform - authentication, authorization, shipping
- **Vendor**: Core to multi-vendor marketplace model
- **Category, Product, ProductImage**: Product catalog is the heart of e-commerce
- **Cart, CartItem**: Standard shopping cart pattern for online retail
- **Order, OrderItem, Payment**: Transaction processing and order fulfillment
- **Review**: Trust-building through social proof

### B. Why These Repositories?
- **Abstraction**: Separate data access from business logic
- **Type Safety**: Compile-time checking of queries
- **Reduced Boilerplate**: Spring Data JPA auto-implements basic CRUD
- **Custom Queries**: Optimized queries for specific use cases (e.g., JOIN FETCH to avoid N+1)
- **Testability**: Easy to mock for unit testing

### C. Design Patterns Used

1. **Soft Delete Pattern**
   - All entities have `isDeleted` and `deletedAt`
   - Enables data recovery and audit trails
   - Maintains referential integrity

2. **Audit Trail Pattern**
   - `createdAt` and `updatedAt` on all entities
   - Auto-updated via database triggers
   - Tracks data lifecycle

3. **Snapshot Pattern (OrderItem)**
   - Stores `productName`, `unitPrice` at time of purchase
   - Preserves order history even if product changes
   - Critical for financial records

4. **Slug Pattern (Product, Category)**
   - SEO-friendly URLs
   - Human-readable identifiers
   - Improved search rankings

5. **Builder Pattern (Lombok)**
   - Fluent object creation
   - Optional parameter handling
   - Improved code readability

6. **Repository Pattern**
   - Centralized data access
   - Separation of concerns
   - Database abstraction

### D. Database Schema Decisions

1. **PostgreSQL Choice**
   - ACID compliance for financial transactions
   - Advanced indexing for performance
   - JSON support for metadata fields
   - Wide industry adoption

2. **Flyway Migrations**
   - Version-controlled database changes
   - Reproducible schema across environments
   - Automatic migration execution on startup
   - Safe, incremental updates

3. **Index Strategy**
   - Primary keys (auto-indexed)
   - Unique constraints (email, slug, orderNumber, businessName)
   - Foreign keys (JOIN optimization)
   - Filtered columns (status, isActive, rating)
   - Date columns (reporting queries)

4. **Constraint Strategy**
   - NOT NULL for required fields
   - CHECK constraints for data validation (price > 0, rating BETWEEN 1 AND 5)
   - UNIQUE constraints for business rules
   - Foreign key ON DELETE CASCADE/SET NULL based on relationship semantics

5. **Cascading Strategy**
   - CASCADE: Parent deletion removes children (e.g., Order → OrderItems)
   - ORPHAN REMOVAL: Removing from collection deletes entity
   - Selective to prevent accidental data loss

### E. Technology Choices

1. **Spring Data JPA + Hibernate**
   - Industry standard ORM
   - Reduces boilerplate SQL
   - Lazy loading for performance
   - Automatic dirty checking

2. **Lombok**
   - Reduces boilerplate code (getters, setters, constructors)
   - Builder pattern generation
   - Improved maintainability

3. **Jakarta Validation**
   - Declarative validation (@NotBlank, @Email, @Size, @Min, @Max)
   - Automatic validation before persistence
   - Consistent error messages

4. **Jakarta Persistence API**
   - Vendor-neutral JPA implementation
   - Future-proof (JEE standard)
   - Wide tooling support

---

## 4. TECHNICAL SPECIFICATIONS

### A. Entity Relationship Diagram (Summary)
```
User (1) ←→ (N) Role [user_roles junction]
User (1) → (N) Address
User (1) → (1) Vendor [optional]
User (1) → (1) Cart
User (1) → (N) Order
User (1) → (N) Review

Vendor (1) → (N) Product
Vendor (1) ← (N) Review

Category (1) → (N) Product
Category (1) → (N) Category [self-referential]

Product (1) → (N) ProductImage
Product (1) → (N) Review
Product (1) → (N) CartItem
Product (1) → (N) OrderItem

Cart (1) → (N) CartItem

Order (1) → (N) OrderItem
Order (1) → (1) Payment
Order (1) → (1) Address [shipping]
Order (1) → (1) Address [billing]
```

### B. File Structure Created
```
src/main/java/com/localcart/
├── entity/
│   ├── base/
│   │   ├── BaseEntity.java (ID, isDeleted, deletedAt)
│   │   └── AuditableEntity.java (extends BaseEntity + createdAt, updatedAt)
│   ├── enums/
│   │   ├── RoleType.java (CUSTOMER, VENDOR, ADMIN)
│   │   ├── AddressType.java (SHIPPING, BILLING)
│   │   ├── VendorStatus.java (PENDING, APPROVED, REJECTED, SUSPENDED)
│   │   ├── OrderStatus.java (PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, RETURNED, REFUNDED)
│   │   └── PaymentStatus.java (PENDING, COMPLETED, FAILED, REFUNDED, CANCELLED)
│   ├── User.java
│   ├── Role.java
│   ├── Address.java
│   ├── Vendor.java
│   ├── Category.java
│   ├── Product.java
│   ├── ProductImage.java
│   ├── Cart.java
│   ├── CartItem.java
│   ├── Order.java
│   ├── OrderItem.java
│   ├── Payment.java
│   └── Review.java
│
└── repository/
    ├── UserRepository.java
    ├── RoleRepository.java
    ├── AddressRepository.java
    ├── VendorRepository.java
    ├── CategoryRepository.java
    ├── ProductRepository.java
    ├── ProductImageRepository.java
    ├── CartRepository.java
    ├── CartItemRepository.java
    ├── OrderRepository.java
    ├── OrderItemRepository.java
    ├── PaymentRepository.java
    └── ReviewRepository.java

src/main/resources/db/migration/
├── V1__initial_schema.sql (319 lines)
└── V2__seed_data.sql (106 lines)
```

### C. Code Metrics
- **Total Java Files**: 36
- **Entity Classes**: 13 main + 2 base + 5 enums = 20
- **Repository Interfaces**: 13
- **SQL Migration Scripts**: 2
- **Total Lines of SQL**: ~425 lines
- **Database Tables**: 13
- **Database Indexes**: 30+
- **Database Constraints**: 40+

---

## 5. NEXT STEPS & REMAINING WORK

### Phase B: Service Layer (Next Priority)
1. **Service Classes** (6-8 services needed):
   - AuthService - registration, login, JWT token management
   - UserService - profile management
   - VendorService - vendor CRUD, approval workflow
   - ProductService - product CRUD, search, filtering
   - CartService - add/remove/update items, calculate totals
   - OrderService - checkout, order creation, status updates
   - PaymentService - payment initiation, confirmation, refunds
   - ReviewService - submit review, calculate ratings

2. **DTOs (Data Transfer Objects)**:
   - Request DTOs for API input validation
   - Response DTOs for API output formatting
   - Mapper utilities (entity ↔ DTO conversion)

3. **Business Logic**:
   - Inventory validation (sufficient stock)
   - Price calculations (tax, shipping, discounts)
   - Order number generation
   - Password encryption handling
   - JWT token generation/validation

### Phase C: REST API Controllers
1. **Controller Classes** (8-10 controllers):
   - AuthController - `/api/v1/auth/**`
   - UserController - `/api/v1/users/**`
   - VendorController - `/api/v1/vendors/**`
   - ProductController - `/api/v1/products/**`
   - CategoryController - `/api/v1/categories/**`
   - CartController - `/api/v1/cart/**`
   - OrderController - `/api/v1/orders/**`
   - PaymentController - `/api/v1/payments/**`
   - ReviewController - `/api/v1/reviews/**`
   - AdminController - `/api/v1/admin/**`

2. **Security Configuration**:
   - JWT filter implementation
   - Role-based endpoint protection
   - CORS configuration
   - CSRF protection

3. **Exception Handling**:
   - Global exception handler
   - Custom exceptions (ResourceNotFoundException, etc.)
   - Standardized error responses

### Testing & Deployment
1. **Unit Tests**:
   - Repository tests
   - Service tests
   - Controller tests

2. **Integration Tests**:
   - End-to-end API tests
   - Database integration tests

3. **Documentation**:
   - API documentation (Swagger/OpenAPI)
   - Deployment guide
   - Developer setup guide

---

## 6. CHALLENGES RESOLVED

1. **Challenge**: Address.java compilation error
   - **Issue**: Duplicate `@Size(max = 100)` annotation after closing brace
   - **Resolution**: Removed duplicate line, file now compiles successfully

2. **Challenge**: Complex entity relationships
   - **Issue**: Circular dependencies between User, Vendor, Product, Order, etc.
   - **Resolution**: Used Lazy Loading (@FetchType.LAZY) and proper bidirectional relationship mapping

3. **Challenge**: Database schema design for multi-vendor
   - **Issue**: Orders can contain items from multiple vendors
   - **Resolution**: OrderItem references both Product and Vendor, enabling per-vendor fulfillment

4. **Challenge**: Product history preservation
   - **Issue**: What if product is deleted after order is placed?
   - **Resolution**: OrderItem stores snapshot of productName and unitPrice at purchase time

---

## 7. SUCCESS METRICS

✅ **Completed Deliverables**:
- 13 fully-featured JPA entities with validation
- 13 Spring Data repositories with custom queries
- 2 comprehensive database migration scripts
- Category hierarchy with 10 root + 20 subcategories
- Demo data for immediate testing (3 users, 1 vendor)
- Zero compilation errors
- Build success confirmed

✅ **Code Quality**:
- Following Spring Boot best practices
- Clean entity-repository separation
- Proper use of Lombok for readable code
- Comprehensive validation annotations
- Optimized database indexes

✅ **Database Quality**:
- Normalized schema (avoiding data duplication)
- Referential integrity (foreign keys)
- Data integrity constraints (CHECK constraints)
- Performance optimization (strategic indexes)
- Audit trail support (timestamps, soft delete)

---

## 8. READINESS ASSESSMENT

### What's Ready:
✅ Complete persistence layer (entities + repositories)  
✅ Database schema with indexes and constraints  
✅ Seed data for testing  
✅ Application builds successfully  
✅ Ready for service layer development

### What's NOT Ready Yet:
❌ Service classes (business logic)  
❌ REST API controllers  
❌ JWT authentication implementation  
❌ DTOs and mappers  
❌ Exception handling  
❌ API documentation  
❌ Unit/integration tests  
❌ Security configuration

### Estimated Completion:
- **Phase A (Data Model)**: 100% ✅
- **Phase B (Service Layer)**: 0% - Starting next
- **Overall MVP Progress**: ~25% complete

---

## CONCLUSION

Day 2 successfully completed Phase A of the MVP development. We now have a robust, well-designed database schema and persistence layer that supports all core marketplace features: multi-vendor management, product catalog, shopping cart, order processing, payments, and reviews.

The entity models follow industry best practices with proper relationships, validation, soft deletes, and audit trails. The repository layer provides type-safe, optimized data access. The database migrations ensure consistent schema deployment across all environments.

**Ready to proceed with Phase B: Service Layer Implementation.**

---

**Report Generated**: February 6, 2026  
**Development Phase**: Phase A - Completed  
**Next Phase**: Phase B - Authentication and Services  
**Developer**: LocalCart Team

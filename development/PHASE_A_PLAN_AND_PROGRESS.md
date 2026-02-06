# PHASE A: Foundation and Data Model - Development Plan & Progress

**Date Started**: February 5, 2026  
**Phase Duration**: Week 1-2 (Estimated)  
**Status**: 🚀 IN PROGRESS

---

## CURRENT STATE ANALYSIS

### ✅ What We Have
- Spring Boot 4.0.2 application initialized
- Dependencies configured (JPA, Security, Validation, PostgreSQL, Redis, Lombok)
- Basic SecurityConfig (permits all - needs enhancement)
- Docker Compose setup (PostgreSQL, Redis, Adminer)
- Maven build configuration
- Project documentation complete

### ❌ What We DON'T Have (Phase A Requirements)
- **No Entity Models** - Missing all domain entities
- **No Repositories** - No data access layer
- **No Database Migrations** - No Flyway/Liquibase setup
- **No Audit Infrastructure** - No created/updated timestamps tracking
- **No API Versioning** - No /api/v1/ structure
- **No Base Classes** - No common entity patterns

---

## PHASE A OBJECTIVES

### Primary Goals
1. ✅ Set up PostgreSQL connection and migrations (Flyway)
2. ✅ Create base entity infrastructure with audit fields
3. ✅ Implement all core domain entities
4. ✅ Create repositories for all entities
5. ✅ Add API versioning structure
6. ✅ Implement soft delete mechanism
7. ✅ Add database seed data for testing

### Core Entities to Build (11 Total)
1. **User** - Authentication and profile
2. **Role** - User roles (CUSTOMER, VENDOR, ADMIN)
3. **Vendor** - Vendor profiles and business info
4. **Product** - Product catalog
5. **ProductImage** - Product images (1-to-many with Product)
6. **Category** - Product categories
7. **Cart** - Shopping cart
8. **CartItem** - Cart line items
9. **Order** - Customer orders
10. **OrderItem** - Order line items
11. **Address** - Shipping/billing addresses

### Additional Infrastructure
- **Payment** - Payment transactions
- **Review** - Product reviews
- **Audit Fields** - createdAt, updatedAt, createdBy, updatedBy
- **Soft Delete** - deletedAt field

---

## IMPLEMENTATION CHECKLIST

### Step 1: Database & Migration Setup
- [ ] Add Flyway dependency to pom.xml
- [ ] Configure Flyway in application.properties
- [ ] Update PostgreSQL connection settings
- [ ] Create migration folder structure
- [ ] Test database connection

### Step 2: Base Infrastructure Classes
- [ ] Create BaseEntity abstract class with ID
- [ ] Create Auditable abstract class with audit fields
- [ ] Create @AuditingConfig for JPA auditing
- [ ] Add soft delete support in BaseEntity

### Step 3: Enums and Value Objects
- [ ] Create RoleType enum (CUSTOMER, VENDOR, ADMIN)
- [ ] Create OrderStatus enum
- [ ] Create PaymentStatus enum
- [ ] Create VendorStatus enum (PENDING, APPROVED, SUSPENDED)

### Step 4: Core Entity Implementation (Priority Order)
#### Tier 1: Authentication & Users (Required First)
- [ ] Role entity
- [ ] User entity (with ManyToMany roles)
- [ ] Address entity

#### Tier 2: Vendor & Catalog
- [ ] Vendor entity
- [ ] Category entity
- [ ] Product entity
- [ ] ProductImage entity

#### Tier 3: Shopping & Orders
- [ ] Cart entity
- [ ] CartItem entity
- [ ] Order entity
- [ ] OrderItem entity

#### Tier 4: Payments & Reviews
- [ ] Payment entity
- [ ] Review entity

### Step 5: Repository Layer
- [ ] Create repository for each entity
- [ ] Add custom query methods where needed
- [ ] Test repository basic operations

### Step 6: Database Migrations
- [ ] V1__init_schema.sql - Create all tables
- [ ] V2__seed_roles.sql - Insert default roles
- [ ] V3__seed_categories.sql - Insert basic categories
- [ ] V4__seed_test_data.sql - Sample users and products

### Step 7: Validation & Constraints
- [ ] Add @Valid annotations
- [ ] Add field constraints (@NotNull, @Size, etc.)
- [ ] Add unique constraints where needed
- [ ] Add database indexes

### Step 8: Testing
- [ ] Unit tests for entities
- [ ] Repository integration tests
- [ ] Test soft delete behavior
- [ ] Test audit fields auto-population

---

## ENTITY RELATIONSHIPS DESIGN

```
User (1) ----< (Many) Roles
User (1) ----< (Many) Addresses
User (1) ----< (1) Cart
User (1) ----< (Many) Orders
User (1) ----< (1) Vendor

Vendor (1) ----< (Many) Products

Product (Many) >---- (1) Category
Product (1) ----< (Many) ProductImages
Product (1) ----< (Many) ReviewsCart (1) ----< (Many) CartItems
CartItem (Many) >---- (1) Product

Order (1) ----< (Many) OrderItems
Order (Many) >---- (1) User
Order (Many) >---- (1) Address
Order (1) ----< (1) Payment

OrderItem (Many) >---- (1) Product

Review (Many) >---- (1) Product
Review (Many) >---- (1) User
```

---

## DETAILED ENTITY SPECIFICATIONS

### 1. User Entity
```
Fields:
- id: Long (PK)
- email: String (unique, not null)
- password: String (hashed, not null)
- firstName: String
- lastName: String
- phoneNumber: String
- isEmailVerified: Boolean
- isActive: Boolean
- roles: Set<Role> (ManyToMany)
- vendor: Vendor (OneToOne, optional)
- cart: Cart (OneToOne)
- orders: List<Order> (OneToMany)
- addresses: List<Address> (OneToMany)
+ Audit fields
+ Soft delete
```

### 2. Role Entity
```
Fields:
- id: Long (PK)
- name: RoleType (enum: CUSTOMER, VENDOR, ADMIN)
- description: String
- users: Set<User> (ManyToMany)
+ Audit fields
```

### 3. Vendor Entity
```
Fields:
- id: Long (PK)
- user: User (OneToOne)
- businessName: String (not null)
- businessDescription: Text
- businessEmail: String
- businessPhone: String
- taxId: String
- status: VendorStatus (PENDING, APPROVED, SUSPENDED)
- approvedAt: LocalDateTime
- approvedBy: User
- products: List<Product> (OneToMany)
+ Audit fields
+ Soft delete
```

### 4. Product Entity
```
Fields:
- id: Long (PK)
- vendor: Vendor (ManyToOne)
- category: Category (ManyToOne)
- name: String (not null)
- description: Text
- price: BigDecimal (not null)
- stockQuantity: Integer
- sku: String (unique)
- isActive: Boolean
- images: List<ProductImage> (OneToMany)
- reviews: List<Review> (OneToMany)
+ Audit fields
+ Soft delete
```

### 5. Category Entity
```
Fields:
- id: Long (PK)
- name: String (not null, unique)
- slug: String (unique)
- description: String
- parentCategory: Category (ManyToOne, self-reference)
- products: List<Product> (OneToMany)
+ Audit fields
```

### 6. Cart & CartItem
```
Cart:
- id: Long (PK)
- user: User (OneToOne)
- items: List<CartItem> (OneToMany)
+ Audit fields

CartItem:
- id: Long (PK)
- cart: Cart (ManyToOne)
- product: Product (ManyToOne)
- quantity: Integer
- priceAtAdd: BigDecimal
+ Audit fields
```

### 7. Order & OrderItem
```
Order:
- id: Long (PK)
- user: User (ManyToOne)
- orderNumber: String (unique)
- status: OrderStatus
- totalAmount: BigDecimal
- shippingAddress: Address (ManyToOne)
- items: List<OrderItem> (OneToMany)
- payment: Payment (OneToOne)
+ Audit fields
+ Soft delete

OrderItem:
- id: Long (PK)
- order: Order (ManyToOne)
- product: Product (ManyToOne)
- quantity: Integer
- priceAtOrder: BigDecimal
- vendor: Vendor (for split orders)
+ Audit fields
```

### 8. Address Entity
```
Fields:
- id: Long (PK)
- user: User (ManyToOne)
- type: String (SHIPPING, BILLING)
- street: String
- city: String
- state: String
- zipCode: String
- country: String
- isDefault: Boolean
+ Audit fields
```

### 9. Payment Entity
```
Fields:
- id: Long (PK)
- order: Order (OneToOne)
- amount: BigDecimal
- status: PaymentStatus
- paymentMethod: String
- transactionId: String
- paymentGateway: String
- paidAt: LocalDateTime
+ Audit fields
```

### 10. Review Entity
```
Fields:
- id: Long (PK)
- product: Product (ManyToOne)
- user: User (ManyToOne)
- rating: Integer (1-5)
- title: String
- comment: Text
- isVerifiedPurchase: Boolean
+ Audit fields
+ Soft delete
```

---

## TECHNOLOGY DECISIONS

### Database Migration: Flyway
- **Why**: Native Spring Boot support, simple SQL-based migrations
- **Location**: `src/main/resources/db/migration/`
- **Naming**: `V1__description.sql`

### Audit Fields: JPA Auditing
- **@CreatedDate**, **@LastModifiedDate** annotations
- **@CreatedBy**, **@LastModifiedBy** with SecurityContext
- **@EntityListeners(AuditingEntityListener.class)**

### Soft Delete: Custom Implementation
- `deletedAt` field in BaseEntity
- Override repository methods to filter deleted records
- Custom @Where annotation for automatic filtering

---

## SUCCESS CRITERIA FOR PHASE A

✅ **Phase A Complete When**:
1. All 11+ entities created and validated
2. All repositories implemented
3. Database migrations tested successfully
4. Seed data loaded and verified
5. Basic integration tests passing
6. Application starts without errors
7. Can perform basic CRUD on all entities
8. Audit fields auto-populate correctly
9. Soft delete working as expected

---

## NEXT PHASE PREVIEW

**Phase B: Authentication and Roles**
- JWT token generation and validation
- UserDetailsService implementation
- Registration endpoint
- Login endpoint
- Password encryption
- Role-based authorization

---

## DEVELOPMENT LOG

### 2026-02-05 - Phase A Kickoff
- Phase A plan created
- Current state analyzed
- Beginning implementation
- Starting with: Database setup & Base classes

---

**Last Updated**: February 5, 2026  
**Next Milestone**: Complete Tier 1 entities (User, Role, Address)

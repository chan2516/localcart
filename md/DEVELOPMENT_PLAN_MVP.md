# LOCAL CART - MVP Development Plan

Date: 2026-02-05
Version: 0.1

## 1) Purpose
Define the initial development plan based on the MVP scope in SCOPE.md. This plan focuses on what to build first, in the right order, to reach an MVP launch.

## 2) What We Build First (Initial Stage)
Priority is to establish a stable foundation and the minimal end-to-end purchase flow:

1. Foundation: repository structure, database, API versioning, and core entities.
2. Authentication and roles: Customer, Vendor, Admin.
3. Product catalog: vendor listings and customer browsing.
4. Cart and checkout: order creation with payment.
5. Order flow and status tracking.
6. Basic admin moderation and vendor approval.

This sequence ensures that customers can discover products, purchase, and track orders while vendors can list products and fulfill them.

## 3) MVP Development Phases (Actual Implementation)

### Phase A: Foundation and Data Model (Week 1-2)
- Set up PostgreSQL and database migrations.
- Define core entities:
  - User, Role
  - Vendor
  - Product, ProductImage
  - Category
  - Cart, CartItem
  - Order, OrderItem
  - Payment
  - Address
  - Review
- Add audit fields and soft delete.
- Apply API versioning: /api/v1/.

Deliverables:
- Database schema and migrations
- Core entity models and repositories
- Basic seed data

### Phase B: Authentication and Roles (Week 2-3)
- JWT authentication with access and refresh tokens.
- Roles: CUSTOMER, VENDOR, ADMIN.
- Vendor application and approval workflow.
- Role-based endpoint protection.

Deliverables:
- Auth APIs: register, login, refresh, logout
- Vendor onboarding flow
- Role-based access control

### Phase C: Product Catalog (Week 3-4)
- Vendor CRUD for products.
- Product image upload handling (MVP storage choice).
- Category assignment and basic search.
- Customer product list and product detail.

Deliverables:
- Product APIs for vendor and customer
- Category APIs
- Basic search and filtering

### Phase D: Cart, Checkout, and Payment (Week 4-5)
- Add to cart and cart management.
- Price calculation and validation.
- Checkout flow and order creation.
- Payment integration with one provider.

Deliverables:
- Cart APIs
- Checkout APIs
- Payment initiation and confirmation

### Phase E: Order Management and Reviews (Week 5-6)
- Order status workflow for vendors and customers.
- Customer order history and tracking.
- Review submission after delivery.

Deliverables:
- Order APIs and status updates
- Review APIs

### Phase F: Admin Basics and Release Readiness (Week 6-7)
- Vendor approvals and product moderation.
- Basic analytics endpoints (orders, users, GMV).
- Logging, health checks, and error handling.
- Minimal CI pipeline and smoke tests.

Deliverables:
- Admin APIs
- Basic reporting endpoints
- CI pipeline and smoke test

## 4) MVP Success Criteria
- 10 vendors onboarded
- 100 products listed
- First paid order completed
- Repeat order rate above 10% within 60 days

## 5) Out of Scope for MVP
- Real-time delivery tracking with maps
- Advanced recommendation engine
- Multi-language support
- Mobile apps
- Vendor payout automation (manual for MVP)
- Complex marketing automation
- Multi-warehouse logistics

## 6) Risks to Monitor
- Payment integration delays
- Vendor onboarding friction
- Product quality moderation overhead
- Inventory consistency at checkout

## 7) Reporting Format (Weekly)
Use this template for progress reports:

- Week:
- Completed:
- In Progress:
- Blockers:
- Risks:
- Next Week Focus:

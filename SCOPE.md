# LOCAL CART - Scope Document (MVP)

Date: 2026-02-05
Version: 0.1

## 1) Purpose
Define the MVP scope for Local Cart, a multi-vendor marketplace focused on local businesses. This document summarizes customer, vendor, and admin flows, plus what is in-scope and out-of-scope for the first release.

## 2) Simple Research Summary (Desk Research Assumptions)
Note: This is lightweight, non-exhaustive research based on common marketplace patterns and the project plan.

- Market pattern: Multi-vendor marketplaces succeed when vendor onboarding and product discovery are fast and low-friction.
- Competitive baseline: Amazon, Etsy, and Shopify-based stores set expectations for search, cart, and order tracking.
- Local advantage: Customers value local discovery, unique items, faster delivery, and community support.
- Vendor pain points: Managing listings and orders must be simple; payouts and visibility are critical.

## 3) Target Users
- Customer: Shops local products, wants quick discovery and reliable delivery.
- Vendor: Lists products, fulfills orders, and tracks sales.
- Admin: Ensures platform quality, safety, and compliance.

## 4) Product Summary
Local Cart is a multi-vendor marketplace where local vendors list products and customers browse, purchase, and track orders. The MVP focuses on core commerce, vendor onboarding, and basic admin moderation.

## 5) MVP In-Scope Features
### Customer Flow
- Browse and search products
- View product details
- Register and login
- Add to cart and checkout
- Pay with one provider (Stripe or PayPal)
- View order status and order history
- Submit a review after purchase

### Vendor Flow
- Apply or register as vendor
- Create and manage product listings
- Upload product images
- Manage inventory and pricing
- View orders for their products
- Update order status (processing, shipped, delivered)

### Admin Flow
- Approve or reject vendor applications
- Moderate products (approve, disable)
- Manage categories
- View basic analytics (orders, users, GMV)
- Handle refund or dispute requests (basic workflow)

### Platform Capabilities
- API versioning from day 1 (/api/v1/)
- Role-based access control (Customer, Vendor, Admin)
- Audit logs for critical actions
- Basic email notifications (order placed, order shipped)

## 6) Out of Scope for MVP
- Real-time delivery tracking with maps
- Advanced recommendation engine
- Multi-language support
- Mobile apps
- Vendor payout automation (manual for MVP)
- Complex marketing automation
- Multi-warehouse logistics

## 7) Core User Journeys (High-Level)
### Customer Journey
1. Browse products and view details
2. Add to cart
3. Checkout and payment
4. Order confirmation
5. Track order status
6. Leave review

### Vendor Journey
1. Apply and get approved
2. Create listings
3. Receive orders
4. Fulfill orders and update status
5. Manage inventory

### Admin Journey
1. Review vendor applications
2. Approve or reject
3. Review products for quality
4. Monitor orders and disputes
5. Review basic platform analytics

## 8) MVP Success Criteria
- At least 10 vendors onboarded
- At least 100 products listed
- First successful paid order completed
- Repeat order rate above 10% within 60 days

## 9) Assumptions
- Single region or city for initial launch
- One payment provider for MVP
- Web-only experience (no native mobile apps)

## 10) Open Decisions
- Final choice of payment provider
- Initial target market and product category
- Shipping model (vendor-managed or platform-assisted)

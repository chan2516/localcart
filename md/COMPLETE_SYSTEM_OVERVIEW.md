# LocalCart Application - Complete System Overview

## 📋 Executive Summary

Your LocalCart application is a **Spring Boot e-commerce platform** with **microservice capabilities**, designed to handle:
- User authentication & profiles
- Product catalog & search
- Shopping cart management
- Order processing
- Payment integration (Stripe, PayPal)
- Vendor management & approval
- Admin dashboard & analytics
- N8N automation workflows

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                       │
│                   (localhost:3000)                          │
└────────────────────────┬──────────────────────────────────────┘
                         │
                    HTTP/REST API
                         │
┌────────────────────────▼──────────────────────────────────────┐
│           Backend Application (Spring Boot)                  │
│  Port: 8080  |  OpenAPI: /swagger-ui.html                    │
├──────────────────────────────────────────────────────────────┤
│  Controllers:                                                 │
│  • AuthController (JWT, login, register)                     │
│  • ProductController (catalog, search)                       │
│  • CartController (shopping cart)                            │
│  • OrderController (order management)                        │
│  • PaymentController (payment gateway)                       │
│  • VendorController (seller management)                      │
│  • AddressController (shipping addresses)                    │
│  • AdminController (platform management)                     │
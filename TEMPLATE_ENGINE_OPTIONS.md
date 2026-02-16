# Template Engine Options - EJS, Thymeleaf, Freemarker

**Status**: Feasible to implement alongside existing frontend  
**Current Setup**: Next.js (React) frontend + Spring Boot backend  
**Question**: Can we add server-side templating?  
**Answer**: ✅ **YES - Multiple Options Available**

---

## 📊 Current Architecture Review

```
Current Stack:
├─ Frontend: Next.js 16.1.6 (React with TypeScript)
│  └─ API Consumption: REST endpoints from backend
│
└─ Backend: Spring Boot 4.0.2
   ├─ REST APIs: 50+ endpoints
   ├─ No server-side rendering currently
   └─ Serves JSON, not HTML templates
```

---

## 🎯 Template Engine Options for Your System

### Option 1: EJS in Node.js Backend ✅ 
**Feasibility**: High | **Effort**: Medium | **Use Case**: Form-heavy features

Create a **separate Node.js service** for template rendering:

```javascript
// server.js - Simple Express + EJS setup
const express = require('express');
const app = express();

app.set('view engine', 'ejs');
app.set('views', './views');

// For admin reports, invoice generation, etc
app.get('/admin/reports', (req, res) => {
  res.render('admin-report', {
    orders: data,
    totalSales: 50000
  });
});

app.listen(3001);
```

**Pros**:
- ✅ Very easy to implement
- ✅ Great for dynamic HTML generation
- ✅ Works alongside Next.js (separate port)
- ✅ Good for PDF generation (invoke from backend)

**Cons**:
- ⚠️ Another service to manage
- ⚠️ Separate from main backend

**Best For**:
- Admin reports & dashboards
- Email HTML generation
- Invoice/receipt generation
- Export functionality

---

### Option 2: Thymeleaf in Spring Boot ✅ RECOMMENDED
**Feasibility**: High | **Effort**: Low | **Use Case**: Mixed approach

Add Thymeleaf templates to your existing Spring Boot:

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-thymeleaf</artifactId>
</dependency>
```

```java
// AdminReportController.java
@Controller
@RequestMapping("/reports")
public class AdminReportController {
    
    @GetMapping("/sales")
    public String salesReport(Model model) {
        model.addAttribute("orders", orderService.getOrders());
        model.addAttribute("totalSales", orderService.getTotalSales());
        return "reports/sales-report"; // Renders: templates/reports/sales-report.html
    }
}
```

```html
<!-- templates/reports/sales-report.html -->
<html xmlns:th="http://www.thymeleaf.org">
<body>
    <h1>Sales Report</h1>
    <table>
        <tr th:each="order : ${orders}">
            <td th:text="${order.id}">Order ID</td>
            <td th:text="${order.total}">Total</td>
        </tr>
    </table>
    <h2 th:text="|Total Sales: $${totalSales}|">Total Sales</h2>
</body>
</html>
```

**Pros**:
- ✅ Native Spring Boot integration
- ✅ No extra service needed
- ✅ Easy to access backend data
- ✅ Good for server-side features

**Cons**:
- ⚠️ Adds complexity to backend
- ⚠️ Can't be cached by Next.js

**Best For**:
- Admin dashboards
- Reports and analytics
- Email templates
- PDF generation
- Legacy feature requirements

---

### Option 3: Freemarker in Spring Boot ✅
**Feasibility**: High | **Effort**: Low | **Use Case**: Similar to Thymeleaf

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-freemarker</artifactId>
</dependency>
```

```java
// Similar to Thymeleaf but with different syntax
@GetMapping("/invoice/{id}")
public String invoice(@PathVariable Long id, Model model) {
    model.addAttribute("invoice", invoiceService.getInvoice(id));
    return "invoice"; // templates/invoice.ftl
}
```

```freemarker
<!-- templates/invoice.ftl -->
<!DOCTYPE html>
<html>
<head>
    <title>Invoice ${invoice.id}</title>
</head>
<body>
    <h1>Invoice #${invoice.id}</h1>
    <p>Amount: $${invoice.amount?string['0.00']}</p>
    <#if invoice.isPaid>
        <p style="color:green">PAID</p>
    </#if>
</body>
</html>
```

**Pros**:
- ✅ More powerful templating
- ✅ Better for complex logic
- ✅ Spring Boot native

**Cons**:
- ⚠️ Steeper learning curve

**Best For**:
- Complex templates
- Advanced business logic in templates
- Email generation
- Document generation

---

### Option 4: Keep Next.js Only (Current) ✅ RECOMMENDED
**Feasibility**: Highest | **Effort**: Zero | **Use Case**: Modern approach

Continue with your existing architecture:

```typescript
// pages/admin/reports.tsx
export async function getServerSideProps() {
  const res = await fetch('http://backend:8080/api/v1/reports/sales');
  const data = await res.json();
  return { props: { data } };
}

export default function SalesReport({ data }) {
  return (
    <div>
      <h1>Sales Report</h1>
      <table>
        {data.orders.map(order => (
          <tr key={order.id}>
            <td>{order.id}</td>
            <td>${order.total}</td>
          </tr>
        ))}
      </table>
      <h2>Total Sales: ${data.totalSales}</h2>
    </div>
  );
}
```

**Pros**:
- ✅ Already built & working
- ✅ Modern approach
- ✅ Better performance (caching)
- ✅ Consistent with frontend

**Cons**:
- ⚠️ Can't do pure backend templating
- ⚠️ Requires frontend deployment

**Best For**:
- 90% of your use cases
- Admin dashboards
- Reports
- All customer-facing features

---

## 🎯 Recommendation by Feature

### For Admin Reports
**Option 1**: Keep using Next.js  
```typescript
// Better: Modern, cached, fast
<AdminReportPage />
```

**Option 2**: Add Thymeleaf if backend-heavy  
```java
// If extreme backend complexity needed
@GetMapping("/report") → render.html
```

---

### For PDF Generation
**Option 1**: Use Next.js + iText/PDFKit  
```typescript
import { PDFDocument } from 'pdf-lib';
// Generate PDF from React component
```

**Option 2**: Use Spring Boot + Thymeleaf + Flying Saucer  
```java
// Render Thymeleaf template → PDF
```

---

### For Email Templates
**Option 1**: Use Simple HTML Strings (Current)  
```java
String html = "<h1>Order Confirmation</h1><p>" + order.getId() + "</p>";
emailService.send(html);
```

**Option 2**: Add Thymeleaf for Emails  
```java
String html = templateEngine.process("email/order-confirmation", context);
emailService.send(html);
```

**Option 3**: Use Node.js EJS Service  
```javascript
const html = ejs.render(template, { order });
// Call from backend remotely
```

---

### For Invoice Generation
**Best Option**: Thymeleaf in Spring Boot
```java
@GetMapping("/invoices/{id}")
public String invoice(@PathVariable Long id, Model model, HttpServletResponse response) {
    response.setContentType("text/html;charset=UTF-8");
    model.addAttribute("invoice", invoiceRepository.findById(id).get());
    return "invoice"; // Rendered as HTML/PDF
}
```

---

## 🏗️ Implementation Paths

### Path A: Keep Everything in Next.js (Recommended for MVP)
```
Current: ✅ Working
├─ All UI in Next.js
├─ All data from REST APIs
└─ Reports rendered by React components

Time to implement: **0 hours** (already done!)
Complexity: Low
Maintenance: Simple
```

### Path B: Add Thymeleaf for Backend Features
```
Add: Thymeleaf to Spring Boot
│
├─ Admin features on backend (faster iteration)
├─ Reports with complex SQL
├─ Email templates with rich design
└─ Optional: PDF export

Time to implement: **4-8 hours**
├─ 1 hour: Add dependency
├─ 2 hours: Create 3-5 templates
├─ 2 hours: Create controller methods
└─ 1-2 hours: Testing
Complexity: Low
Maintenance: Moderate (2 template systems)
```

### Path C: Add Node.js EJS Service
```
Create: Separate Node.js + Express service
│
├─ Advanced template features
├─ Dynamic HTML generation
├─ Email HTML generation
└─ Can invoke from Java backend

Time to implement: **8-12 hours**
├─ 2 hours: Set up Node.js server
├─ 3 hours: Create EJS templates
├─ 2 hours: API endpoints
├─ 2 hours: Integration with Java backend
└─ 1-2 hours: Testing
Complexity: Medium
Maintenance: Higher (3 systems)
```

### Path D: Advanced - Keep Next.js + Add Thymeleaf
```
Keep: Next.js for user-facing features
Add: Thymeleaf for admin/backend features
│
├─ Best of both worlds
├─ Clean separation of concerns
├─ Scalable architecture
└─ Future microservices ready

Time to implement: **4-8 hours**
Complexity: Medium
Maintenance: Good (clear boundaries)
```

---

## 💻 Code Examples

### Example 1: Admin Dashboard with Thymeleaf

**Backend - Java**:
```java
package com.localcart.feature.admin.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/admin")
public class AdminDashboardController {
    
    private final OrderService orderService;
    private final PaymentService paymentService;
    private final ProductService productService;
    
    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        // Get data from backend
        model.addAttribute("totalOrders", orderService.getTotalCount());
        model.addAttribute("totalRevenue", paymentService.getTotalRevenue());
        model.addAttribute("lowStockProducts", productService.getLowStockProducts());
        model.addAttribute("recentOrders", orderService.getRecentOrders(10));
        
        return "admin/dashboard"; // Thymeleaf template
    }
}
```

**Template - Thymeleaf**:
```html
<!-- templates/admin/dashboard.html -->
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <title>Admin Dashboard</title>
    <link rel="stylesheet" href="/css/admin.css"/>
</head>
<body>
    <div class="container">
        <h1>Admin Dashboard</h1>
        
        <!-- Stats Cards -->
        <div class="stats">
            <div class="card">
                <h3>Total Orders</h3>
                <p class="stat" th:text="${totalOrders}">0</p>
            </div>
            <div class="card">
                <h3>Total Revenue</h3>
                <p class="stat" th:text="|$${totalRevenue}|">$0</p>
            </div>
        </div>
        
        <!-- Low Stock Alert -->
        <div th:if="${!lowStockProducts.isEmpty()}" class="alert alert-warning">
            <h3>Low Stock Products</h3>
            <ul>
                <li th:each="product : ${lowStockProducts}" 
                    th:text="|${product.name} (${product.stock} units)|">
                    Product Name (0 units)
                </li>
            </ul>
        </div>
        
        <!-- Recent Orders Table -->
        <div class="orders-section">
            <h2>Recent Orders</h2>
            <table class="table">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    <tr th:each="order : ${recentOrders}">
                        <td th:text="${order.id}">1</td>
                        <td th:text="${order.user.name}">John Doe</td>
                        <td th:text="|$${order.total}|">$100</td>
                        <td th:text="${order.status}">pending</td>
                        <td th:text="${#dates.format(order.createdAt, 'MMM dd, yyyy')}">Jan 01, 2025</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>
```

---

### Example 2: Email Template with Thymeleaf

**Java Service**:
```java
package com.localcart.infrastructure.email;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
public class EmailService {
    
    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    
    public void sendOrderConfirmation(Order order) throws Exception {
        // Prepare context
        Context context = new Context();
        context.setVariable("order", order);
        context.setVariable("orderItems", order.getItems());
        context.setVariable("totalAmount", order.getTotal());
        context.setVariable("estimatedDelivery", "2-3 business days");
        
        // Render template
        String htmlContent = templateEngine.process("email/order-confirmation", context);
        
        // Send email
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setTo(order.getUser().getEmail());
        helper.setSubject("Order Confirmation #" + order.getId());
        helper.setText(htmlContent, true); // true = HTML content
        
        mailSender.send(message);
    }
}
```

**Email Template**:
```html
<!-- templates/email/order-confirmation.html -->
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background-color: #f5f5f5; padding: 20px; }
        .content { padding: 20px; }
        .items-table { width: 100%; border-collapse: collapse; }
        .items-table th { background-color: #e0e0e0; padding: 10px; text-align: left; }
        .items-table td { padding: 10px; border-bottom: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Order Confirmation</h1>
            <p th:text="|Order #${order.id}|">Order #123</p>
        </div>
        
        <div class="content">
            <p>Thank you for your order!</p>
            
            <h2>Order Details</h2>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    <tr th:each="item : ${orderItems}">
                        <td th:text="${item.product.name}">Product Name</td>
                        <td th:text="${item.quantity}">1</td>
                        <td th:text="|$${item.price}|">$10</td>
                        <td th:text="|$${item.quantity * item.price}|">$10</td>
                    </tr>
                </tbody>
            </table>
            
            <h2>Order Summary</h2>
            <p th:text="|Total Amount: $${totalAmount}|">Total Amount: $0</p>
            <p th:text="|Estimated Delivery: ${estimatedDelivery}|">Estimated Delivery: ...</p>
            
            <p>We'll send you tracking information as soon as your order ships.</p>
        </div>
    </div>
</body>
</html>
```

---

### Example 3: EJS in Node.js (If Separate Service)

**Node.js Server**:
```javascript
// server.js - Express + EJS
const express = require('express');
const ejs = require('ejs');
const axios = require('axios');

const app = express();

app.set('view engine', 'ejs');
app.set('views', './views');

// Get data from Java backend and render
app.get('/admin/reports/sales', async (req, res) => {
    try {
        // Fetch from backend
        const response = await axios.get('http://backend:8080/api/v1/reports/sales');
        const { orders, totalSales } = response.data;
        
        // Render EJS template
        res.render('admin/sales-report', {
            orders,
            totalSales,
            generatedAt: new Date()
        });
    } catch (error) {
        res.status(500).send('Error generating report');
    }
});

app.listen(3002, () => console.log('EJS server on port 3002'));
```

**EJS Template**:
```ejs
<!-- views/admin/sales-report.ejs -->
<!DOCTYPE html>
<html>
<head>
    <title>Sales Report</title>
</head>
<body>
    <h1>Sales Report</h1>
    <p>Generated: <%= generatedAt.toLocaleDateString() %></p>
    
    <table border="1">
        <thead>
            <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Date</th>
            </tr>
        </thead>
        <tbody>
            <% orders.forEach(order => { %>
                <tr>
                    <td><%= order.id %></td>
                    <td><%= order.customer.name %></td>
                    <td>$<%= order.total.toFixed(2) %></td>
                    <td><%= new Date(order.createdAt).toLocaleDateString() %></td>
                </tr>
            <% }); %>
        </tbody>
    </table>
    
    <h2>Total Sales: $<%= totalSales.toFixed(2) %></h2>
</body>
</html>
```

---

## 📊 Comparison Table

| Feature | Next.js Only | + Thymeleaf | + Node.js EJS |
|---------|:---:|:---:|:---:|
| **Learning Curve** | Low | Medium | Medium |
| **Implementation Time** | Done | 4-8 hrs | 8-12 hrs |
| **Performance** | Excellent | Good | Good |
| **Caching** | Excellent | Good | Good |
| **Scalability** | Excellent | Good | Good |
| **Maintenance** | Simple | Moderate | Complex |
| **Admin Features** | Good | Excellent | Excellent |
| **Email Templates** | Fair | Excellent | Excellent |
| **PDF Generation** | Good | Excellent | Good |
| **Best For** | User-facing | Backend features | Advanced templates |

---

## ✅ My Recommendation

### For Your Current MVP (Recommended)
```
✅ KEEP: Next.js for all user-facing features (already working)
✅ ADD: Simple Thymeleaf for 2-3 admin features that need it
❌ SKIP: Separate Node.js service (too complex for MVP)

Time Investment: 2-4 hours
Risk: Low (Thymeleaf is Spring Boot native)
Benefit: 10x easier admin features
```

### Implementation Priority

**Week 1** (If needed):
- Add Thymeleaf dependency to pom.xml (5 min)
- Create 1-2 admin templates (1 hour)
- Add dashboard controller (30 min)

**Weeks 2-4** (Only if required):
- Add more admin pages (3-5 pages)
- Email template generation
- PDF export functionality

**Later** (If you need):
- Upgrade to separate Node.js service for complex templates
- Move to microservices architecture
- Add WebSocket support

---

## 🎯 Final Answer

**Yes, you can absolutely add EJS, Thymeleaf, or Freemarker!**

### Best Path Forward:
1. **Keep Next.js** for customer-facing features ✅ (already excellent)
2. **Optionally add Thymeleaf** for admin/backend features (easy 4-8 hour addition)
3. **Skip separate Node.js** unless you have complex template needs

This gives you:
- ✅ Modern frontend (Next.js)
- ✅ Flexible backend rendering (Thymeleaf optional)
- ✅ Best of both worlds
- ✅ Minimal complexity

---

**Recommendation**: Stay with Next.js for MVP, add Thymeleaf **only if** you have admin features that really need server-side rendering.

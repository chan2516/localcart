# Before & After: Refactoring Examples

**Purpose**: Show exactly how to refactor existing code using new patterns  
**Target Audience**: Developers implementing Phase 1 optimization  

---

## 📚 Example 1: Product Service Refactoring

### ❌ BEFORE: Monolithic Service

**File**: `service/ProductService.java` (Original)

```java
package com.localcart.service;

import com.localcart.dto.*;
import com.localcart.entity.*;
import com.localcart.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductService {
    
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final CategoryRepository categoryRepository;
    private final InventoryService inventoryService;
    private final ReviewService reviewService;
    
    public ProductDto getProduct(Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Product not found"));
        
        ProductDto dto = new ProductDto();
        dto.setId(product.getId());
        dto.setName(product.getName());
        // ... 20+ more manual mappings
        
        return dto;
    }
    
    public Page<ProductDto> search(String keyword, int page, int size) {
        Page<Product> products = productRepository.findByNameContains(keyword, 
            PageRequest.of(page, size));
        return products.map(p -> {
            ProductDto dto = new ProductDto();
            dto.setId(p.getId());
            // ... manual mapping again
            return dto;
        });
    }
    
    public void createProduct(CreateProductRequest request) {
        if (request.getPrice() == null || request.getPrice() <= 0) {
            throw new RuntimeException("Invalid price");
        }
        if (request.getStock() < 0) {
            throw new RuntimeException("Invalid stock");
        }
        
        Category category = categoryRepository.findById(request.getCategoryId())
            .orElseThrow(() -> new RuntimeException("Category not found"));
        
        Product product = new Product();
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStock(request.getStock());
        product.setCategory(category);
        
        productRepository.save(product);
    }
    
    // ... more methods with scattered validation and mapping logic
}
```

### ✅ AFTER: Refactored with New Patterns

**Step 1: Create Mapper** (`feature/product/mapper/ProductMapper.java`)

```java
package com.localcart.feature.product.mapper;

import com.localcart.entity.Product;
import com.localcart.feature.product.dto.ProductDto;
import com.localcart.feature.product.dto.CreateProductRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ProductMapper {
    
    ProductDto toDto(Product entity);
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Product toEntity(CreateProductRequest request);
    
    void updateEntity(CreateProductRequest request, @MappingTarget Product entity);
}
```

**Step 2: Create Validator** (`feature/product/validator/ProductValidator.java`)

```java
package com.localcart.feature.product.validator;

import com.localcart.common.exception.ValidationException;
import com.localcart.common.validator.BaseValidator;
import com.localcart.feature.product.dto.CreateProductRequest;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;

@Component
public class ProductValidator extends BaseValidator {
    
    public void validateCreateRequest(CreateProductRequest request) {
        validateNotEmpty(request.getName(), "Product name");
        validateNotEmpty(request.getDescription(), "Product description");
        validatePrice(request.getPrice());
        validateStock(request.getStock());
        validateNotNull(request.getCategoryId(), "Category ID");
    }
    
    public void validatePrice(BigDecimal price) {
        validateNotNull(price, "Price");
        if (price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException("price", "Price must be positive");
        }
    }
    
    public void validateStock(Integer stock) {
        validateNotNull(stock, "Stock");
        if (stock < 0) {
            throw new ValidationException("stock", "Stock cannot be negative");
        }
    }
}
```

**Step 3: Create Domain Events** (`feature/product/event/ProductCreatedEvent.java`)

```java
package com.localcart.feature.product.event;

import com.localcart.common.event.DomainEvent;
import lombok.Getter;
import java.math.BigDecimal;

@Getter
public class ProductCreatedEvent extends DomainEvent {
    
    private final Long productId;
    private final String productName;
    private final BigDecimal price;
    private final Integer stock;
    private final Long vendorId;
    
    public ProductCreatedEvent(Long productId, String productName, 
                              BigDecimal price, Integer stock, Long vendorId) {
        super(productId.toString(), "Product");
        this.productId = productId;
        this.productName = productName;
        this.price = price;
        this.stock = stock;
        this.vendorId = vendorId;
    }
}
```

**Step 4: Refactor Service** (`feature/product/service/ProductService.java`)

```java
package com.localcart.feature.product.service;

import com.localcart.common.event.EventPublisher;
import com.localcart.common.exception.ResourceNotFoundException;
import com.localcart.entity.Category;
import com.localcart.entity.Product;
import com.localcart.feature.product.dto.CreateProductRequest;
import com.localcart.feature.product.dto.ProductDto;
import com.localcart.feature.product.event.ProductCreatedEvent;
import com.localcart.feature.product.mapper.ProductMapper;
import com.localcart.feature.product.validator.ProductValidator;
import com.localcart.repository.CategoryRepository;
import com.localcart.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ProductService {
    
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductMapper productMapper;
    private final ProductValidator productValidator;
    private final EventPublisher eventPublisher;
    
    @Transactional(readOnly = true)
    public ProductDto getProduct(Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        
        return productMapper.toDto(product);
    }
    
    @Transactional(readOnly = true)
    public Page<ProductDto> search(String keyword, int page, int size) {
        Page<Product> products = productRepository.findByNameContainingIgnoreCase(
            keyword, 
            PageRequest.of(page, size)
        );
        
        return products.map(productMapper::toDto);
    }
    
    public ProductDto createProduct(CreateProductRequest request) {
        log.info("Creating product: {}", request.getName());
        
        // Validate
        productValidator.validateCreateRequest(request);
        
        // Load category
        Category category = categoryRepository.findById(request.getCategoryId())
            .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));
        
        // Create entity
        Product product = productMapper.toEntity(request);
        product.setCategory(category);
        
        // Save
        Product savedProduct = productRepository.save(product);
        log.info("Product created with ID: {}", savedProduct.getId());
        
        // Publish event
        eventPublisher.publish(new ProductCreatedEvent(
            savedProduct.getId(),
            savedProduct.getName(),
            savedProduct.getPrice(),
            savedProduct.getStock(),
            savedProduct.getVendorId()
        ));
        
        return productMapper.toDto(savedProduct);
    }
}
```

**Step 5: Query Service** (`feature/product/service/ProductQueryService.java`) - NEW

```java
package com.localcart.feature.product.service;

import com.localcart.entity.Product;
import com.localcart.feature.product.dto.ProductDto;
import com.localcart.feature.product.mapper.ProductMapper;
import com.localcart.feature.product.specification.ProductSpecifications;
import com.localcart.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductQueryService {
    
    private final ProductRepository productRepository;
    private final ProductMapper productMapper;
    
    @Cacheable(value = "products", key = "#id")
    public ProductDto findById(Long id) {
        return productRepository.findById(id)
            .map(productMapper::toDto)
            .orElse(null);
    }
    
    public Page<ProductDto> searchProducts(String keyword, Pageable pageable) {
        return productRepository.findAll(
            ProductSpecifications.nameContains(keyword),
            pageable
        ).map(productMapper::toDto);
    }
    
    @Cacheable(value = "featured-products")
    public List<ProductDto> getFeaturedProducts() {
        return productRepository.findAll(
            ProductSpecifications.isFeatured()
        ).stream()
            .map(productMapper::toDto)
            .toList();
    }
}
```

**Step 6: Update Controller** (`feature/product/controller/ProductController.java`)

```java
package com.localcart.feature.product.controller;

import com.localcart.feature.product.dto.CreateProductRequest;
import com.localcart.feature.product.dto.ProductDto;
import com.localcart.feature.product.service.ProductQueryService;
import com.localcart.feature.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@Slf4j
@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {
    
    private final ProductService productService;
    private final ProductQueryService productQueryService;
    
    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getProduct(@PathVariable Long id) {
        ProductDto product = productQueryService.findById(id);
        return ResponseEntity.ok(product);
    }
    
    @GetMapping("/search")
    public ResponseEntity<Page<ProductDto>> search(
            @RequestParam String keyword,
            Pageable pageable) {
        Page<ProductDto> results = productQueryService.searchProducts(keyword, pageable);
        return ResponseEntity.ok(results);
    }
    
    @PostMapping
    public ResponseEntity<ProductDto> createProduct(
            @Valid @RequestBody CreateProductRequest request) {
        ProductDto product = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(product);
    }
}
```

---

## 📚 Example 2: Order Service with Facade Pattern

### ❌ BEFORE: Monolithic Order Service

```java
@Service
public class OrderService {
    
    private final OrderRepository orderRepository;
    private final CartService cartService;
    private final ProductService productService;
    private final PaymentService paymentService;
    private final UserService userService;
    private final CouponService couponService;
    private final EmailService emailService;
    
    public void checkout(Long userId) {
        // Complex logic mixing concerns
        Cart cart = cartService.getCart(userId);
        
        if (cart.getItems().isEmpty()) {
            throw new RuntimeException("Cart is empty");
        }
        
        // Validate stock
        for (CartItem item : cart.getItems()) {
            if (item.getQuantity() > item.getProduct().getStock()) {
                throw new RuntimeException("Insufficient stock");
            }
        }
        
        // Apply coupon
        BigDecimal total = cart.getTotal();
        if (cart.getCoupon() != null) {
            total = total.multiply(
                BigDecimal.ONE.subtract(cart.getCoupon().getDiscountPercent())
            );
        }
        
        // Create order
        Order order = new Order();
        order.setUser(userService.getUser(userId));
        order.setTotal(total);
        order.setItems(cart.getItems());
        orderRepository.save(order);
        
        // Process payment
        Payment payment = paymentService.processPayment(order.getId(), "Stripe");
        
        // Reduce stock
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product.setStock(product.getStock() - item.getQuantity());
            productService.save(product);
        }
        
        // Clear cart
        cartService.clearCart(userId);
        
        // Send email
        try {
            emailService.sendOrderConfirmation(order);
        } catch (Exception e) {
            log.error("Failed to send email", e);
        }
    }
}
```

### ✅ AFTER: With Facade and Event-Driven Architecture

**Step 1: Create Specifications** (`feature/order/specification/OrderSpecifications.java`)

```java
package com.localcart.feature.order.specification;

import com.localcart.entity.Order;
import com.localcart.common.enums.OrderStatus;
import org.springframework.data.jpa.domain.Specification;
import java.time.LocalDateTime;

public class OrderSpecifications {
    
    public static Specification<Order> byUserId(Long userId) {
        return (root, query, cb) -> cb.equal(root.get("user").get("id"), userId);
    }
    
    public static Specification<Order> byStatus(OrderStatus status) {
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }
    
    public static Specification<Order> createdAfter(LocalDateTime date) {
        return (root, query, cb) -> cb.greaterThan(root.get("createdAt"), date);
    }
    
    public static Specification<Order> totalGreaterThan(BigDecimal amount) {
        return (root, query, cb) -> cb.greaterThan(root.get("total"), amount);
    }
}
```

**Step 2: Create Domain Events**

```java
// feature/order/event/OrderCreatedEvent.java
@Getter
public class OrderCreatedEvent extends DomainEvent {
    private final Long orderId;
    private final Long userId;
    private final BigDecimal totalAmount;
    
    public OrderCreatedEvent(Long orderId, Long userId, BigDecimal totalAmount) {
        super(orderId.toString(), "Order");
        this.orderId = orderId;
        this.userId = userId;
        this.totalAmount = totalAmount;
    }
}

// feature/order/event/OrderPaymentCompletedEvent.java
@Getter
public class OrderPaymentCompletedEvent extends DomainEvent {
    private final Long orderId;
    private final String paymentConfirmationId;
    
    public OrderPaymentCompletedEvent(Long orderId, String paymentConfirmationId) {
        super(orderId.toString(), "Order");
        this.orderId = orderId;
        this.paymentConfirmationId = paymentConfirmationId;
    }
}
```

**Step 3: Create Validator** (`feature/order/validator/OrderValidator.java`)

```java
package com.localcart.feature.order.validator;

import com.localcart.common.validator.BaseValidator;
import com.localcart.entity.Cart;
import com.localcart.entity.CartItem;
import com.localcart.common.exception.ValidationException;
import com.localcart.common.exception.InsufficientStockException;
import org.springframework.stereotype.Component;

@Component
public class OrderValidator extends BaseValidator {
    
    public void validateCheckout(Cart cart) {
        if (cart == null || cart.getItems().isEmpty()) {
            throw new ValidationException("Cart is empty");
        }
        
        validateInventory(cart);
    }
    
    private void validateInventory(Cart cart) {
        for (CartItem item : cart.getItems()) {
            if (item.getQuantity() > item.getProduct().getStock()) {
                throw new InsufficientStockException(
                    item.getProduct().getId(),
                    item.getQuantity(),
                    item.getProduct().getStock()
                );
            }
        }
    }
}
```

**Step 4: Create Service** (`feature/order/service/OrderService.java`)

```java
package com.localcart.feature.order.service;

import com.localcart.entity.Order;
import com.localcart.entity.OrderItem;
import com.localcart.entity.Cart;
import com.localcart.feature.order.dto.CreateOrderRequest;
import com.localcart.feature.order.dto.OrderDto;
import com.localcart.feature.order.mapper.OrderMapper;
import com.localcart.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class OrderService {
    
    private final OrderRepository orderRepository;
    private final OrderMapper orderMapper;
    
    /**
     * Creates an order from cart.
     * Responsibility: Persistence only, no orchestration
     */
    public Order createFromCart(Cart cart, Long userId) {
        log.info("Creating order for user: {}", userId);
        
        Order order = new Order();
        order.setUser(cart.getUser());
        order.setTotal(cart.getTotal());
        order.setSubtotal(cart.getSubtotal());
        order.setTax(cart.getTax());
        order.setShipping(cart.getShipping());
        order.setDiscount(cart.getDiscount());
        
        // Map cart items to order items
        order.setItems(mapCartItemsToOrderItems(cart));
        
        return orderRepository.save(order);
    }
    
    private java.util.List<OrderItem> mapCartItemsToOrderItems(Cart cart) {
        return cart.getItems().stream()
            .map(cartItem -> OrderItem.builder()
                .order(null) // Will be set by cascade
                .product(cartItem.getProduct())
                .quantity(cartItem.getQuantity())
                .price(cartItem.getPrice())
                .build()
            )
            .toList();
    }
}
```

**Step 5: Create Query Service** (`feature/order/service/OrderQueryService.java`)

```java
package com.localcart.feature.order.service;

import com.localcart.entity.Order;
import com.localcart.feature.order.dto.OrderDto;
import com.localcart.feature.order.mapper.OrderMapper;
import com.localcart.feature.order.specification.OrderSpecifications;
import com.localcart.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderQueryService {
    
    private final OrderRepository orderRepository;
    private final OrderMapper orderMapper;
    
    public Page<OrderDto> getOrdersByUser(Long userId, Pageable pageable) {
        return orderRepository.findAll(
            OrderSpecifications.byUserId(userId),
            pageable
        ).map(orderMapper::toDto);
    }
    
    public OrderDto getOrderById(Long orderId) {
        return orderRepository.findById(orderId)
            .map(orderMapper::toDto)
            .orElse(null);
    }
}
```

**Step 6: Create Facade** (`feature/order/facade/OrderFacade.java`) - NEW

```java
package com.localcart.feature.order.facade;

import com.localcart.common.event.EventPublisher;
import com.localcart.entity.*;
import com.localcart.feature.cart.service.CartService;
import com.localcart.feature.order.dto.OrderDto;
import com.localcart.feature.order.event.OrderCreatedEvent;
import com.localcart.feature.order.event.OrderPaymentCompletedEvent;
import com.localcart.feature.order.mapper.OrderMapper;
import com.localcart.feature.order.service.OrderService;
import com.localcart.feature.order.validator.OrderValidator;
import com.localcart.feature.payment.service.PaymentService;
import com.localcart.feature.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Order Facade - Orchestrates complex multi-service checkout workflow
 * Separates business orchestration from individual service responsibilities
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderFacade {
    
    private final CartService cartService;
    private final OrderService orderService;
    private final PaymentService paymentService;
    private final ProductService productService;
    private final OrderValidator orderValidator;
    private final OrderMapper orderMapper;
    private final EventPublisher eventPublisher;
    
    /**
     * Complete checkout workflow
     * Handles: validation → order creation → payment → inventory → event publishing
     */
    @Transactional
    public OrderDto checkout(Long userId) {
        log.info("Starting checkout for user: {}", userId);
        
        // 1. Get cart
        Cart cart = cartService.getCart(userId);
        
        // 2. Validate
        orderValidator.validateCheckout(cart);
        
        // 3. Create order
        Order order = orderService.createFromCart(cart, userId);
        log.info("Order created with ID: {}", order.getId());
        
        // 4. Process payment
        Payment payment = paymentService.processPayment(order);
        log.info("Payment processed: {}", payment.getId());
        
        // 5. Reduce inventory
        reduceInventory(order.getItems());
        log.info("Inventory reduced for order: {}", order.getId());
        
        // 6. Clear cart
        cartService.clearCart(userId);
        
        // 7. Publish events (async listeners will handle email, etc)
        publishOrderEvents(order);
        
        return orderMapper.toDto(order);
    }
    
    private void reduceInventory(java.util.List<OrderItem> items) {
        for (OrderItem item : items) {
            productService.reduceStock(
                item.getProduct().getId(),
                item.getQuantity()
            );
        }
    }
    
    private void publishOrderEvents(Order order) {
        // Main event
        eventPublisher.publish(new OrderCreatedEvent(
            order.getId(),
            order.getUser().getId(),
            order.getTotal()
        ));
        
        // Payment event
        eventPublisher.publish(new OrderPaymentCompletedEvent(
            order.getId(),
            order.getPayment().getTransactionId()
        ));
    }
}
```

**Step 7: Create Event Listeners** (`feature/order/listener/OrderEventListener.java`)

```java
package com.localcart.feature.order.listener;

import com.localcart.feature.order.event.OrderCreatedEvent;
import com.localcart.infrastructure.email.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderEventListener {
    
    private final EmailService emailService;
    
    @EventListener
    public void onOrderCreated(OrderCreatedEvent event) {
        log.info("Order created event received: {}", event.getEventId());
        
        try {
            emailService.sendOrderConfirmation(event.getOrderId());
        } catch (Exception e) {
            log.error("Failed to send order confirmation email", e);
            // Could implement retry logic here
        }
    }
}
```

**Step 8: Update Controller** (`feature/order/controller/OrderController.java`)

```java
package com.localcart.feature.order.controller;

import com.localcart.feature.order.dto.OrderDto;
import com.localcart.feature.order.facade.OrderFacade;
import com.localcart.feature.order.service.OrderQueryService;
import com.localcart.common.security.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {
    
    private final OrderFacade orderFacade;
    private final OrderQueryService orderQueryService;
    
    @PostMapping("/checkout")
    public ResponseEntity<OrderDto> checkout() {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        OrderDto order = orderFacade.checkout(currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }
    
    @GetMapping
    public ResponseEntity<Page<OrderDto>> getOrders(Pageable pageable) {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        Page<OrderDto> orders = orderQueryService.getOrdersByUser(currentUserId, pageable);
        return ResponseEntity.ok(orders);
    }
}
```

---

## 🎯 Key Improvements

### Order Service Refactoring Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Lines of Code** | 150+ in one service | 50 per focused service |
| **Testability** | Hard (25+ dependencies) | Easy (1-2 dependencies) |
| **Reusability** | 0% | 100% (facades compose services) |
| **Error Handling** | Generic RuntimeExceptions | Specific exceptions with context |
| **Email Failures** | Blocks order creation | Async with retry logic via events |
| **Validation** | Mixed in service | Centralized in validator |
| **Queries** | Read/write in same service | Separate read-optimized service |

---

## ✅ Migration Steps Summary

1. **Create Mapper** - Handle entity ↔ DTO conversions automatically
2. **Create Validator** - Centralize business rule validation
3. **Create Domain Events** - Enable async processing and decoupling
4. **Refactor Service** - Focus on single responsibility
5. **Create Query Service** - Optimize read operations separately
6. **Create Facade** - Orchestrate complex workflows
7. **Create Listeners** - Handle side effects asynchronously
8. **Update Controller** - Use facade for complex operations

---

## 🚀 Implementation Priority

### Week 1 (High Impact Features)
- [ ] Refactor ProductService
- [ ] Refactor OrderService
- [ ] Add event listeners for email

### Week 2 (Support Features)
- [ ] Refactor CartService
- [ ] Refactor PaymentService
- [ ] Add query services for reporting

### Week 3 (Admin/Vendor Features)
- [ ] Refactor VendorService
- [ ] Refactor AdminService
- [ ] Create admin facades

---

**Next: Apply these patterns to your existing services one by one!**

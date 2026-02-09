package com.localcart.service;

import com.localcart.dto.order.CreateOrderRequest;
import com.localcart.dto.order.OrderDto;
import com.localcart.dto.order.OrderItemDto;
import com.localcart.entity.*;
import com.localcart.entity.enums.OrderStatus;
import com.localcart.repository.*;
import com.localcart.exception.PaymentException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Order Service
 * Handles order operations: create, retrieve, status tracking, cancellation
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class OrderService {
    
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final WebhookService webhookService;
    
    /**
     * Get user's orders (paginated)
     */
    @Transactional(readOnly = true)
    public Page<Order> getUserOrders(Long userId, Pageable pageable) {
        log.info("Fetching orders for user: {}", userId);
        return orderRepository.findByUserId(userId, pageable);
    }
    
    /**
     * Get order by ID
     */
    @Transactional(readOnly = true)
    public Order getOrderById(Long id) {
        log.info("Fetching order: {}", id);
        return orderRepository.findById(id)
                .orElseThrow(() -> new PaymentException("Order not found", "ORDER_NOT_FOUND"));
    }
    
    /**
     * Create new order from cart
     */
    public Order createOrder(Long userId, CreateOrderRequest request) {
        log.info("Creating order for user: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new PaymentException("User not found", "USER_NOT_FOUND"));
        
        // Get shipping and billing addresses
        Address shippingAddress = addressRepository.findById(request.getShippingAddressId())
                .orElseThrow(() -> new PaymentException("Shipping address not found", "ADDRESS_NOT_FOUND"));
        
        Address billingAddress = addressRepository.findById(request.getBillingAddressId())
                .orElseThrow(() -> new PaymentException("Billing address not found", "ADDRESS_NOT_FOUND"));
        
        // Verify addresses belong to user
        if (!shippingAddress.getUser().getId().equals(userId) || !billingAddress.getUser().getId().equals(userId)) {
            throw new PaymentException("Addresses do not belong to this user", "UNAUTHORIZED");
        }
        
        // Get user's cart
        Cart cart = cartRepository.findByUserIdWithItems(userId)
                .orElseThrow(() -> new PaymentException("Cart not found", "CART_NOT_FOUND"));
        
        if (cart.getItems().isEmpty()) {
            throw new PaymentException("Cart is empty", "EMPTY_CART");
        }
        
        // Calculate totals
        BigDecimal subtotal = calculateSubtotal(cart);
        BigDecimal tax = calculateTax(subtotal);
        BigDecimal shippingFee = calculateShippingFee(subtotal);
        BigDecimal discount = BigDecimal.ZERO; // TODO: Apply coupon if provided
        BigDecimal total = subtotal.add(tax).add(shippingFee).subtract(discount);
        
        // Create order
        Order order = Order.builder()
                .orderNumber(generateOrderNumber())
                .user(user)
                .status(OrderStatus.PENDING)
                .subtotal(subtotal)
                .tax(tax)
                .shippingFee(shippingFee)
                .discount(discount)
                .total(total)
                .shippingAddress(shippingAddress)
                .billingAddress(billingAddress)
                .notes(request.getNotes())
                .build();
        
        // Create order items from cart
        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();
            
            // Verify stock
            if (product.getStock() < cartItem.getQuantity()) {
                throw new PaymentException("Insufficient stock for product: " + product.getName(), "INSUFFICIENT_STOCK");
            }
            
            BigDecimal unitPrice = product.getDiscountPrice() != null ? product.getDiscountPrice() : product.getPrice();
            BigDecimal itemSubtotal = unitPrice.multiply(BigDecimal.valueOf(cartItem.getQuantity()));
            
            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .vendor(product.getVendor())
                    .productName(product.getName())
                    .unitPrice(unitPrice)
                    .quantity(cartItem.getQuantity())
                    .subtotal(itemSubtotal)
                    .build();
            
            order.getItems().add(orderItem);
            
            // Reduce stock
            product.setStock(product.getStock() - cartItem.getQuantity());
        }
        
        Order savedOrder = orderRepository.save(order);
        
        // Clear cart
        cartItemRepository.deleteByCartId(cart.getId());
        cart.getItems().clear();
        
        log.info("Order created successfully: {}", savedOrder.getOrderNumber());
        
        // Trigger webhook for n8n automation
        webhookService.triggerOrderCreated(savedOrder);
        
        return savedOrder;
    }
    
    /**
     * Get order by order number
     */
    @Transactional(readOnly = true)
    public Order getOrderByNumber(String orderNumber) {
        log.info("Fetching order by number: {}", orderNumber);
        return orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new PaymentException("Order not found", "ORDER_NOT_FOUND"));
    }
    
    /**
     * Update order status
     */
    public Order updateOrderStatus(Long orderId, OrderStatus newStatus) {
        log.info("Updating order {} status to {}", orderId, newStatus);
        
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new PaymentException("Order not found", "ORDER_NOT_FOUND"));
        
        OrderStatus previousStatus = order.getStatus();
        order.setStatus(newStatus);
        
        // Update timestamps based on status
        switch (newStatus) {
            case SHIPPED:
                order.setShippedAt(LocalDateTime.now());
                break;
            case DELIVERED:
                order.setDeliveredAt(LocalDateTime.now());
                // Trigger review request after 7 days
                break;
            case CANCELLED:
                order.setCancelledAt(LocalDateTime.now());
                break;
        }
        
        Order savedOrder = orderRepository.save(order);
        
        // Trigger webhook for status change
        webhookService.triggerOrderStatusChanged(savedOrder, previousStatus.name());
        
        return savedOrder;
    }
    
    /**
     * Cancel order (only if pending or payment confirmed)
     */
    public Order cancelOrder(Long orderId, Long userId, String reason) {
        log.info("Cancelling order: {}, reason: {}", orderId, reason);
        
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new PaymentException("Order not found", "ORDER_NOT_FOUND"));
        
        // Verify ownership
        if (!order.getUser().getId().equals(userId)) {
            throw new PaymentException("Order does not belong to this user", "UNAUTHORIZED");
        }
        
        // Validate order can be cancelled
        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.PAYMENT_CONFIRMED) {
            throw new PaymentException("Order cannot be cancelled in current status", "INVALID_STATUS");
        }
        
        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelledAt(LocalDateTime.now());
        order.setCancellationReason(reason);
        
        // Restore stock
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product.setStock(product.getStock() + item.getQuantity());
        }
        
        return orderRepository.save(order);
    }
    
    /**
     * Convert Order to OrderDto
     */
    @Transactional(readOnly = true)
    public OrderDto convertToDto(Order order) {
        List<OrderItemDto> itemDtos = order.getItems().stream()
                .map(this::convertToOrderItemDto)
                .collect(Collectors.toList());
        
        return OrderDto.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .userId(order.getUser().getId())
                .userEmail(order.getUser().getEmail())
                .items(itemDtos)
                .subtotal(order.getSubtotal())
                .tax(order.getTax())
                .shippingFee(order.getShippingFee())
                .discount(order.getDiscount())
                .total(order.getTotal())
                .shippingAddressLine(order.getShippingAddress().getStreet())
                .shippingCity(order.getShippingAddress().getCity())
                .shippingState(order.getShippingAddress().getState())
                .shippingCountry(order.getShippingAddress().getCountry())
                .shippingZipCode(order.getShippingAddress().getZipCode())
                .status(order.getStatus().toString())
                .trackingNumber(order.getTrackingNumber())
                .paymentId(order.getPayment() != null ? order.getPayment().getId() : null)
                .paymentStatus(order.getPayment() != null ? order.getPayment().getStatus().toString() : null)
                .build();
    }
    
    private OrderItemDto convertToOrderItemDto(OrderItem item) {
        return OrderItemDto.builder()
                .id(item.getId())
                .productId(item.getProduct().getId())
                .productName(item.getProductName())
                .priceAtPurchase(item.getUnitPrice())
                .quantity(item.getQuantity())
                .subtotal(item.getSubtotal())
                .vendorId(item.getVendor().getId())
                .vendorName(item.getVendor().getBusinessName())
                .build();
    }
    
    /**
     * Calculate subtotal from cart
     */
    private BigDecimal calculateSubtotal(Cart cart) {
        return cart.getItems().stream()
                .map(item -> {
                    BigDecimal price = item.getProduct().getDiscountPrice() != null 
                            ? item.getProduct().getDiscountPrice() 
                            : item.getProduct().getPrice();
                    return price.multiply(BigDecimal.valueOf(item.getQuantity()));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    
    /**
     * Calculate tax (10% for demo)
     */
    private BigDecimal calculateTax(BigDecimal subtotal) {
        return subtotal.multiply(new BigDecimal("0.10"));
    }
    
    /**
     * Calculate shipping fee (free over $50, else $10)
     */
    private BigDecimal calculateShippingFee(BigDecimal subtotal) {
        if (subtotal.compareTo(new BigDecimal("50.00")) >= 0) {
            return BigDecimal.ZERO;
        }
        return new BigDecimal("10.00");
    }
    
    /**
     * Generate unique order number
     */
    private String generateOrderNumber() {
        String timestamp = java.time.LocalDate.now()
                .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
        String random = UUID.randomUUID().toString().substring(0, 5).toUpperCase();
        return "ORD-" + timestamp + "-" + random;
    }
}

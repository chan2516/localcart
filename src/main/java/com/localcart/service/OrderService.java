package com.localcart.service;

import com.localcart.entity.Order;
import com.localcart.entity.User;
import com.localcart.repository.OrderRepository;
import com.localcart.repository.UserRepository;
import com.localcart.exception.PaymentException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

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
    
    /**
     * Get user's orders (paginated)
     */
    public Page<Order> getUserOrders(Long userId, Pageable pageable) {
        log.info("Fetching orders for user: {}", userId);
        return orderRepository.findAll(pageable);
    }
    
    /**
     * Get order by ID
     */
    public Optional<Order> getOrderById(Long id) {
        log.info("Fetching order: {}", id);
        return orderRepository.findById(id);
    }
    
    /**
     * Create new order from cart
     */
    public Order createOrder(Long userId) {
        log.info("Creating order for user: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new PaymentException("User not found", "USER_NOT_FOUND"));
        
        // TODO: Implement order creation from cart
        // - Validate shipping address
        // - Validate billing address
        // - Calculate totals (subtotal, tax, shipping)
        // - Create order items from cart
        // - Clear cart after order creation
        
        return new Order();
    }
    
    /**
     * Get order by order number
     */
    public Optional<Order> getOrderByNumber(String orderNumber) {
        log.info("Fetching order by number: {}", orderNumber);
        return orderRepository.findByOrderNumber(orderNumber);
    }
    
    /**
     * Update order status
     */
    public Order updateOrderStatus(Long orderId, String newStatus) {
        log.info("Updating order {} status to {}", orderId, newStatus);
        
        return orderRepository.findById(orderId)
                .map(order -> {
                    // TODO: Update order status with proper validation
                    return orderRepository.save(order);
                })
                .orElseThrow(() -> new PaymentException("Order not found", "ORDER_NOT_FOUND"));
    }
    
    /**
     * Cancel order (only if pending)
     */
    public Order cancelOrder(Long orderId, String reason) {
        log.info("Cancelling order: {}, reason: {}", orderId, reason);
        
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new PaymentException("Order not found", "ORDER_NOT_FOUND"));
        
        // Validate order can be cancelled
        // TODO: Check order status is PENDING or CONFIRMED
        
        return orderRepository.save(order);
    }
    
    /**
     * Generate unique order number
     */
    private String generateOrderNumber() {
        // Format: ORD-YYYYMMDD-XXXXX
        String timestamp = java.time.LocalDate.now()
                .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
        String random = UUID.randomUUID().toString().substring(0, 5).toUpperCase();
        return "ORD-" + timestamp + "-" + random;
    }
}

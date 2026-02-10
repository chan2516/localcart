package com.localcart.controller;

import com.localcart.dto.order.OrderDto;
import com.localcart.entity.enums.OrderStatus;
import com.localcart.exception.PaymentException;
import com.localcart.security.CustomUserDetails;
import com.localcart.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Order Management REST Controller
 * 
 * Endpoints:
 * - GET    /api/v1/orders              - List user's orders
 * - GET    /api/v1/orders/{id}         - Get order details
 * - GET    /api/v1/orders/{id}/track   - Track order status
 * - POST   /api/v1/orders/{id}/cancel  - Cancel order
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Validated
@PreAuthorize("isAuthenticated()")
public class OrderController {
    
    private final OrderService orderService;
    
    /**
     * GET /api/v1/orders
     * 
     * List all orders for current user with pagination
     * 
     * Query Parameters:
     * - page: pagination page (default 0)
     * - size: items per page (default 10)
     * - status: filter by status (optional: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
     */
    @GetMapping
    public ResponseEntity<?> listOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            log.info("Fetching orders for user: {} page={}, size={}, status={}",
                    userDetails.getUserId(), page, size, status);
            
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<OrderDto> orders;
            
            if (status != null && !status.isBlank()) {
                OrderStatus orderStatus = OrderStatus.valueOf(status.toUpperCase());
                orders = orderService.getUserOrdersByStatus(userDetails.getUserId(), orderStatus, pageable)
                        .map(orderService::convertToDto);
            } else {
                orders = orderService.getUserOrders(userDetails.getUserId(), pageable)
                        .map(orderService::convertToDto);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("orders", orders.getContent());
            response.put("currentPage", orders.getNumber());
            response.put("totalItems", orders.getTotalElements());
            response.put("totalPages", orders.getTotalPages());
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.error("Invalid order status: {}", status);
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("INVALID_STATUS", "Invalid order status"));
        } catch (Exception e) {
            log.error("Error fetching orders", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("ERROR", "Failed to fetch orders"));
        }
    }
    
    /**
     * GET /api/v1/orders/{id}
     * 
     * Get detailed information about a specific order
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            log.info("Fetching order: {} for user: {}", id, userDetails.getUserId());
            
            OrderDto order = orderService.convertToDto(
                    orderService.getUserOrderById(userDetails.getUserId(), id)
            );
            
            return ResponseEntity.ok(order);
            
        } catch (PaymentException e) {
            log.error("Order not found or unauthorized: {}", id);
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getErrorCode(), e.getMessage()));
        } catch (Exception e) {
            log.error("Error fetching order", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("ERROR", "Failed to fetch order"));
        }
    }
    
    /**
     * GET /api/v1/orders/{id}/track
     * 
     * Track order status and get tracking information
     */
    @GetMapping("/{id}/track")
    public ResponseEntity<?> trackOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            log.info("Tracking order: {} for user: {}", id, userDetails.getUserId());
            
            var order = orderService.getUserOrderById(userDetails.getUserId(), id);
            Map<String, Object> response = new HashMap<>();
            response.put("orderId", id);
            response.put("status", order.getStatus().toString());
            response.put("trackingNumber", order.getTrackingNumber());
            response.put("shippedAt", order.getShippedAt() != null ? order.getShippedAt().toString() : null);
            response.put("deliveredAt", order.getDeliveredAt() != null ? order.getDeliveredAt().toString() : null);
            
            return ResponseEntity.ok(response);
            
        } catch (PaymentException e) {
            log.error("Order not found for tracking: {}", id);
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getErrorCode(), e.getMessage()));
        } catch (Exception e) {
            log.error("Error tracking order", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("ERROR", "Failed to track order"));
        }
    }
    
    /**
     * POST /api/v1/orders/{id}/cancel
     * 
     * Cancel an order (only if order is pending)
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(
            @PathVariable Long id,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            log.info("Cancelling order: {} for user: {}", id, userDetails.getUserId());
            
            OrderDto order = orderService.convertToDto(
                    orderService.cancelOrder(id, userDetails.getUserId(), reason)
            );
            
            return ResponseEntity.ok(order);
            
        } catch (PaymentException e) {
            log.error("Cannot cancel order: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getErrorCode(), e.getMessage()));
        } catch (Exception e) {
            log.error("Error cancelling order", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("ERROR", "Failed to cancel order"));
        }
    }
    
    /**
     * Error response class for consistent error formatting
     */
    record ErrorResponse(String errorCode, String message) {}
}

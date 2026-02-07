package com.localcart.dto.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Order Data Transfer Object
 * Used for displaying order details to customers
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderDto {
    
    private Long id;
    private String orderNumber;
    
    // User info
    private Long userId;
    private String userEmail;
    
    // Items
    private List<OrderItemDto> items;
    
    // Pricing
    private BigDecimal subtotal;
    private BigDecimal tax;
    private BigDecimal shippingFee;
    private BigDecimal discount;
    private BigDecimal total;
    
    // Shipping info
    private String shippingAddressId;
    private String shippingAddressLine;
    private String shippingCity;
    private String shippingState;
    private String shippingCountry;
    private String shippingZipCode;
    
    // Status
    private String status; // PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
    private String trackingNumber;
    
    // Payment info
    private Long paymentId;
    private String paymentStatus;
    
    // Timestamps
    private String createdAt;
    private String shippedAt;
    private String deliveredAt;
    private String cancelledAt;
}

package com.localcart.dto.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Order Item Data Transfer Object
 * Represents a product in an order
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItemDto {
    
    private Long id;
    
    // Product info
    private Long productId;
    private String productName;
    private String productSlug;
    private String imageUrl;
    
    // Pricing (captured at time of order)
    private BigDecimal priceAtPurchase;
    private BigDecimal discountAtPurchase;
    private Integer quantity;
    private BigDecimal subtotal;
    
    // Vendor info
    private Long vendorId;
    private String vendorName;
}

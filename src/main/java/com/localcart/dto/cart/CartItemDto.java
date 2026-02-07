package com.localcart.dto.cart;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Cart Item Data Transfer Object
 * Represents a single item in the shopping cart
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItemDto {
    
    private Long id;
    
    // Product info
    private Long productId;
    private String productName;
    private String productSlug;
    private String imageUrl;
    
    // Pricing
    private BigDecimal price;
    private BigDecimal discountPrice;
    private Integer quantity;
    private BigDecimal subtotal; // price * quantity (or discountPrice * quantity if discount exists)
    
    // Stock info
    private Integer availableStock;
    private Boolean inStock;
    
    // Timestamps
    private String addedAt;
}

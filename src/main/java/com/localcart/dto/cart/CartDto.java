package com.localcart.dto.cart;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Shopping Cart Data Transfer Object
 * Contains all items in the cart with totals
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartDto {
    
    private Long cartId;
    private Long userId;
    
    // Items
    private List<CartItemDto> items;
    private Integer itemCount;
    
    // Totals
    private BigDecimal subtotal; // Sum of all item subtotals
    private BigDecimal tax; // Tax amount (calculated in checkout)
    private BigDecimal shippingFee; // Shipping cost (calculated in checkout)
    private BigDecimal discount; // Discount amount
    private BigDecimal total; // Final total
    
    // Metadata
    private String lastUpdated;
    private Boolean isEmptyCart;
}

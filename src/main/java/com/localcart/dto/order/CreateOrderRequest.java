package com.localcart.dto.order;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request object for creating an order from cart
 * Called from checkout endpoint
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateOrderRequest {
    
    @NotNull(message = "Shipping address ID is required")
    private Long shippingAddressId;
    
    @NotNull(message = "Billing address ID is required")
    private Long billingAddressId;
    
    // Coupon/Discount code (optional)
    private String couponCode;
    
    // Payment method (will be processed by PaymentService)
    @NotBlank(message = "Payment method is required")
    private String paymentMethod; // CREDIT_CARD, DEBIT_CARD, WALLET, etc.
    
    // Notes (optional)
    @Size(max = 500, message = "Order notes cannot exceed 500 characters")
    private String notes;
    
    // Delivery preference (optional)
    private String deliveryPreference; // STANDARD, EXPRESS, OVERNIGHT
}

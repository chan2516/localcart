package com.localcart.dto.payment;

import com.localcart.entity.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentRequest {
    
    // Order information
    private Long orderId;
    private String orderNumber;
    private BigDecimal amount;
    
    // Payment method
    private String paymentMethod; // CREDIT_CARD, DEBIT_CARD, WALLET, UPI, etc.
    private String currency; // USD, INR, EUR, etc.
    
    // Card details (encrypted in transit)
    private String cardToken; // Tokenized card from payment gateway
    private String cardNumber; // Last 4 digits only for display
    private String cardHolderName;
    private String expiryMonth;
    private String expiryYear;
    private String cvv; // Only in transit, never stored
    
    // Wallet/UPI details
    private String walletId;
    private String upiId;
    
    // Billing address
    private String billingAddressId;
    private String billingEmail;
    private String billingPhone;
    
    // Additional data
    private String description; // Order description for payment provider
    private String metadataJson; // Additional metadata
    private Boolean saveCard; // Save card for future use
}

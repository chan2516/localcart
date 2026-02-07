package com.localcart.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavedPaymentMethod {
    
    private Long id;
    private String token; // Tokenized payment method from gateway
    private String type; // CARD, WALLET, UPI, BANK_TRANSFER
    
    private String maskedValue; // e.g., "****1234", "user@upi"
    private String displayName; // e.g., "Visa ending in 1234"
    
    private String expiryMonth;
    private String expiryYear;
    private Boolean isExpired;
    private Boolean isDefault;
}

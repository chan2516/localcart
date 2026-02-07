package com.localcart.service.payment.gateway;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentMethodDetails {
    
    private String type; // CARD, WALLET, UPI, BANK_TRANSFER
    private String maskedValue; // Safe to display, e.g., "****1234"
    private String cardBrand; // VISA, MASTERCARD, AMEX
    
    private String cardHolderName;
    private String expiryMonth;
    private String expiryYear;
    private Boolean isExpired;
    
    private String binNumber; // First 6 digits for card type detection
    private String lastFourDigits;
    
    private String walletProvider; // PayPal, Apple Pay, Google Pay, etc.
    private String walletIdentifier; // Email or phone
    
    // Bank transfer details (sensitive info should be minimal)
    private String bankName;
    private String accountHolderName;
    private String accountNumberMasked; // e.g., "****5678"
}

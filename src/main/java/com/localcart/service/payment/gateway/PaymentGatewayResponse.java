package com.localcart.service.payment.gateway;

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
public class PaymentGatewayResponse {
    
    private String transactionId; // Gateway's transaction ID
    private String status; // SUCCESS, PENDING, FAILED, CANCELLED
    private String statusCode; // Confirmation code from gateway
    
    // Payment details
    private BigDecimal amount;
    private String currency;
    private String paymentMethod;
    private String maskedPaymentDetails; // e.g., "****1234"
    
    // Timestamps
    private LocalDateTime processedAt;
    
    // Error information
    private String errorCode;
    private String errorMessage;
    private String failureReason;
    
    // Additional data
    private String authorizationCode;
    private String receiptUrl;
    private String metadata; // JSON string for additional data
    
    // Refund information
    private String refundId;
    private BigDecimal refundAmount;
    private String refundStatus;
}

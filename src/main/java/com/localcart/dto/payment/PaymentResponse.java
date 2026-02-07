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
public class PaymentResponse {
    
    private Long paymentId;
    private Long orderId;
    private String orderNumber;
    
    private String transactionId;
    private String paymentMethod;
    private String maskedCardNumber; // e.g., "****1234"
    
    private BigDecimal amount;
    private String currency;
    
    private PaymentStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
    private LocalDateTime refundedAt;
    
    private String failureReason;
    private String failureCode;
    
    private BigDecimal refundAmount;
    private Boolean isRefundable;
    private Boolean isPartialRefundable;
}

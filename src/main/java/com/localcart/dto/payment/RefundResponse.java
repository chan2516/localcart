package com.localcart.dto.payment;

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
public class RefundResponse {
    
    private Long paymentId;
    private String transactionId;
    private String refundId;
    private String status; // SUCCESS, PENDING, FAILED
    
    private BigDecimal refundAmount;
    private String reason;
    
    private LocalDateTime refundedAt;
    private String failureReason;
}

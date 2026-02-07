package com.localcart.dto.payment;

import com.localcart.entity.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundRequest {
    
    private Long paymentId;
    private String transactionId;
    private String orderNumber;
    
    // Refund amount (null = full refund)
    private BigDecimal refundAmount;
    
    // Reason for refund
    private String reason;
    
    // Additional note
    private String notes;
}

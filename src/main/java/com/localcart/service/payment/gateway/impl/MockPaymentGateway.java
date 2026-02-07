package com.localcart.service.payment.gateway.impl;

import com.localcart.dto.payment.PaymentRequest;
import com.localcart.exception.PaymentGatewayException;
import com.localcart.service.payment.gateway.PaymentGateway;
import com.localcart.service.payment.gateway.PaymentGatewayResponse;
import com.localcart.service.payment.gateway.PaymentMethodDetails;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Mock/Development Payment Gateway
 * Used for testing without actual payment processing
 */
@Slf4j
@Component
public class MockPaymentGateway implements PaymentGateway {
    
    @Value("${payment.mock.enabled:true}")
    private Boolean mockEnabled;
    
    @Value("${payment.mock.auto-approve:true}")
    private Boolean autoApprove;
    
    @Override
    public PaymentGatewayResponse initializePayment(PaymentRequest request) throws Exception {
        if (!mockEnabled) {
            throw new PaymentGatewayException("Mock gateway is disabled", "MOCK_DISABLED");
        }
        
        log.info("Mock: Initializing payment for order: {}, amount: {}", request.getOrderNumber(), request.getAmount());
        
        String transactionId = "mock_" + UUID.randomUUID().toString().substring(0, 24);
        
        return PaymentGatewayResponse.builder()
                .transactionId(transactionId)
                .status("PENDING")
                .amount(request.getAmount())
                .currency(request.getCurrency() != null ? request.getCurrency() : "USD")
                .processedAt(LocalDateTime.now())
                .build();
    }
    
    @Override
    public PaymentGatewayResponse processPayment(String transactionId, PaymentRequest request) throws Exception {
        log.info("Mock: Processing payment: {}", transactionId);
        
        if (autoApprove) {
            return PaymentGatewayResponse.builder()
                    .transactionId(transactionId)
                    .status("SUCCESS")
                    .statusCode("charge_succeeded")
                    .amount(request.getAmount())
                    .currency(request.getCurrency() != null ? request.getCurrency() : "USD")
                    .paymentMethod(request.getPaymentMethod())
                    .maskedPaymentDetails("****1234")
                    .processedAt(LocalDateTime.now())
                    .authorizationCode("AUTH_MOCK_" + UUID.randomUUID().toString().substring(0, 8))
                    .build();
        } else {
            return PaymentGatewayResponse.builder()
                    .transactionId(transactionId)
                    .status("FAILED")
                    .errorCode("MOCK_DECLINE")
                    .errorMessage("Mock payment declined for testing")
                    .processedAt(LocalDateTime.now())
                    .build();
        }
    }
    
    @Override
    public PaymentGatewayResponse verifyPayment(String transactionId) throws Exception {
        log.info("Mock: Verifying payment: {}", transactionId);
        
        return PaymentGatewayResponse.builder()
                .transactionId(transactionId)
                .status("SUCCESS")
                .processedAt(LocalDateTime.now())
                .build();
    }
    
    @Override
    public PaymentGatewayResponse refundPayment(String transactionId, BigDecimal refundAmount, String reason) throws Exception {
        log.info("Mock: Refunding payment: {}, amount: {}", transactionId, refundAmount);
        
        String refundId = "mock_refund_" + UUID.randomUUID().toString().substring(0, 20);
        
        return PaymentGatewayResponse.builder()
                .transactionId(transactionId)
                .refundId(refundId)
                .refundAmount(refundAmount)
                .refundStatus("SUCCESS")
                .processedAt(LocalDateTime.now())
                .build();
    }
    
    @Override
    public String tokenizeCard(String cardNumber, String expiryMonth, String expiryYear, String cvv) throws Exception {
        log.info("Mock: Tokenizing card");
        
        return "mock_token_" + UUID.randomUUID().toString().substring(0, 20);
    }
    
    @Override
    public PaymentGatewayResponse chargeToken(String token, BigDecimal amount, String currency, String description) throws Exception {
        log.info("Mock: Charging token: {}, amount: {}", token, amount);
        
        String transactionId = "mock_" + UUID.randomUUID().toString().substring(0, 24);
        
        return PaymentGatewayResponse.builder()
                .transactionId(transactionId)
                .status("SUCCESS")
                .amount(amount)
                .currency(currency)
                .processedAt(LocalDateTime.now())
                .build();
    }
    
    @Override
    public PaymentMethodDetails getPaymentMethodDetails(String transactionId) throws Exception {
        log.info("Mock: Getting payment method details: {}", transactionId);
        
        return PaymentMethodDetails.builder()
                .type("CARD")
                .maskedValue("****1234")
                .cardBrand("VISA")
                .expiryMonth("12")
                .expiryYear("2025")
                .lastFourDigits("1234")
                .build();
    }
    
    @Override
    public boolean isHealthy() {
        return mockEnabled;
    }
}

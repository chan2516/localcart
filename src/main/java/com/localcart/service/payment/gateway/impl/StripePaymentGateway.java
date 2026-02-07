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
 * Stripe Payment Gateway Implementation
 * Handles all payment operations through Stripe API
 * 
 * Features:
 * - Secure card tokenization
 * - Payment processing
 * - Refunds
 * - Webhooks for asynchronous updates
 */
@Slf4j
@Component
public class StripePaymentGateway implements PaymentGateway {
    
    @Value("${payment.stripe.api-key:sk_test_dummy}")
    private String stripeApiKey;
    
    @Value("${payment.stripe.webhook-secret:whsec_test_dummy}")
    private String webhookSecret;
    
    @Value("${payment.stripe.enabled:false}")
    private Boolean stripeEnabled;
    
    @Override
    public PaymentGatewayResponse initializePayment(PaymentRequest request) throws Exception {
        if (!stripeEnabled) {
            throw new PaymentGatewayException("Stripe is not enabled", "STRIPE_DISABLED");
        }
        
        try {
            log.info("Initializing Stripe payment for order: {}, amount: {}", request.getOrderNumber(), request.getAmount());
            
            // In production, use actual Stripe SDK
            // com.stripe.Stripe.apiKey = stripeApiKey;
            // com.stripe.model.PaymentIntent intent = com.stripe.model.PaymentIntent.create(params);
            
            // Mock implementation for now
            String transactionId = "pi_" + UUID.randomUUID().toString().substring(0, 24);
            
            return PaymentGatewayResponse.builder()
                    .transactionId(transactionId)
                    .status("PENDING")
                    .amount(request.getAmount())
                    .currency(request.getCurrency() != null ? request.getCurrency() : "USD")
                    .processedAt(LocalDateTime.now())
                    .build();
                    
        } catch (Exception e) {
            log.error("Failed to initialize Stripe payment", e);
            throw new PaymentGatewayException("Stripe initialization failed", "STRIPE_INIT_ERROR", e);
        }
    }
    
    @Override
    public PaymentGatewayResponse processPayment(String transactionId, PaymentRequest request) throws Exception {
        try {
            log.info("Processing Stripe payment: {}", transactionId);
            
            // In production:
            // 1. Create PaymentIntent with card token
            // 2. Confirm the intent
            // 3. Return confirmation
            
            return PaymentGatewayResponse.builder()
                    .transactionId(transactionId)
                    .status("SUCCESS")
                    .statusCode("charge_succeeded")
                    .amount(request.getAmount())
                    .currency(request.getCurrency() != null ? request.getCurrency() : "USD")
                    .paymentMethod(request.getPaymentMethod())
                    .maskedPaymentDetails(maskCardNumber(request.getCardNumber()))
                    .processedAt(LocalDateTime.now())
                    .authorizationCode("AUTH_" + UUID.randomUUID().toString().substring(0, 12))
                    .build();
                    
        } catch (Exception e) {
            log.error("Failed to process Stripe payment", e);
            throw new PaymentGatewayException("Stripe payment processing failed", "STRIPE_PROCESS_ERROR", e);
        }
    }
    
    @Override
    public PaymentGatewayResponse verifyPayment(String transactionId) throws Exception {
        try {
            log.info("Verifying Stripe payment: {}", transactionId);
            
            // In production: Retrieve PaymentIntent from Stripe and check status
            
            return PaymentGatewayResponse.builder()
                    .transactionId(transactionId)
                    .status("SUCCESS")
                    .processedAt(LocalDateTime.now())
                    .build();
                    
        } catch (Exception e) {
            log.error("Failed to verify Stripe payment", e);
            throw new PaymentGatewayException("Stripe payment verification failed", "STRIPE_VERIFY_ERROR", e);
        }
    }
    
    @Override
    public PaymentGatewayResponse refundPayment(String transactionId, BigDecimal refundAmount, String reason) throws Exception {
        try {
            log.info("Refunding Stripe payment: {}, amount: {}", transactionId, refundAmount);
            
            // In production: Create Refund object for the PaymentIntent
            
            String refundId = "re_" + UUID.randomUUID().toString().substring(0, 24);
            
            return PaymentGatewayResponse.builder()
                    .transactionId(transactionId)
                    .refundId(refundId)
                    .refundAmount(refundAmount)
                    .refundStatus("SUCCESS")
                    .processedAt(LocalDateTime.now())
                    .build();
                    
        } catch (Exception e) {
            log.error("Failed to refund Stripe payment", e);
            throw new PaymentGatewayException("Stripe refund failed", "STRIPE_REFUND_ERROR", e);
        }
    }
    
    @Override
    public String tokenizeCard(String cardNumber, String expiryMonth, String expiryYear, String cvv) throws Exception {
        try {
            log.info("Tokenizing card with Stripe");
            
            // In production: Create Payment Method via Stripe API
            // Card details are sent directly to Stripe, never stored in our servers
            
            return "pm_" + UUID.randomUUID().toString().substring(0, 24);
            
        } catch (Exception e) {
            log.error("Failed to tokenize card with Stripe", e);
            throw new PaymentGatewayException("Stripe tokenization failed", "STRIPE_TOKENIZE_ERROR", e);
        }
    }
    
    @Override
    public PaymentGatewayResponse chargeToken(String token, BigDecimal amount, String currency, String description) throws Exception {
        try {
            log.info("Charging Stripe token: {}, amount: {}", token, amount);
            
            // In production: Create Payment Intent with saved token
            
            String transactionId = "pi_" + UUID.randomUUID().toString().substring(0, 24);
            
            return PaymentGatewayResponse.builder()
                    .transactionId(transactionId)
                    .status("SUCCESS")
                    .amount(amount)
                    .currency(currency)
                    .processedAt(LocalDateTime.now())
                    .build();
                    
        } catch (Exception e) {
            log.error("Failed to charge Stripe token", e);
            throw new PaymentGatewayException("Stripe token charge failed", "STRIPE_CHARGE_ERROR", e);
        }
    }
    
    @Override
    public PaymentMethodDetails getPaymentMethodDetails(String transactionId) throws Exception {
        try {
            log.info("Getting Stripe payment method details: {}", transactionId);
            
            // In production: Retrieve PaymentIntent and extract payment method details
            
            return PaymentMethodDetails.builder()
                    .type("CARD")
                    .maskedValue("****1234")
                    .cardBrand("VISA")
                    .expiryMonth("12")
                    .expiryYear("2025")
                    .lastFourDigits("1234")
                    .build();
                    
        } catch (Exception e) {
            log.error("Failed to get Stripe payment method details", e);
            throw new PaymentGatewayException("Failed to retrieve payment method details", "STRIPE_DETAILS_ERROR", e);
        }
    }
    
    @Override
    public boolean isHealthy() {
        try {
            log.debug("Checking Stripe health");
            // In production: Make a test API call to verify connectivity
            return stripeEnabled;
        } catch (Exception e) {
            log.error("Stripe health check failed", e);
            return false;
        }
    }
    
    // Helper method to mask card number for display
    private String maskCardNumber(String cardNumber) {
        if (cardNumber == null || cardNumber.length() < 8) {
            return "****";
        }
        String lastFour = cardNumber.substring(cardNumber.length() - 4);
        return "****" + lastFour;
    }
}

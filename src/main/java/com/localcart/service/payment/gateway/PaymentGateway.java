package com.localcart.service.payment.gateway;

import com.localcart.dto.payment.PaymentRequest;
import com.localcart.dto.payment.RefundRequest;
import java.math.BigDecimal;

/**
 * Abstract payment gateway interface for handling payments from different providers
 * Implements strategy pattern to support multiple payment providers (Stripe, PayPal, Razorpay, etc.)
 */
public interface PaymentGateway {
    
    /**
     * Initialize a payment transaction with the payment gateway
     * Returns transaction ID for tracking and reference
     */
    PaymentGatewayResponse initializePayment(PaymentRequest request) throws Exception;
    
    /**
     * Process/confirm a payment that was initialized
     * Called after customer completes payment on gateway's hosted page
     */
    PaymentGatewayResponse processPayment(String transactionId, PaymentRequest request) throws Exception;
    
    /**
     * Verify payment status with the gateway
     * Used to confirm payment completion
     */
    PaymentGatewayResponse verifyPayment(String transactionId) throws Exception;
    
    /**
     * Refund a completed payment (full or partial)
     */
    PaymentGatewayResponse refundPayment(String transactionId, BigDecimal refundAmount, String reason) throws Exception;
    
    /**
     * Tokenize card details for future use
     * Never stores sensitive data - returns token only
     */
    String tokenizeCard(String cardNumber, String expiryMonth, String expiryYear, String cvv) throws Exception;
    
    /**
     * Charge a previously tokenized card
     * Safe way to charge saved payment methods
     */
    PaymentGatewayResponse chargeToken(String token, BigDecimal amount, String currency, String description) throws Exception;
    
    /**
     * Get payment method details for a transaction
     */
    PaymentMethodDetails getPaymentMethodDetails(String transactionId) throws Exception;
    
    /**
     * Health check - verify gateway connectivity
     */
    boolean isHealthy();
}

package com.localcart.service.payment;

import com.localcart.dto.payment.PaymentRequest;
import com.localcart.dto.payment.PaymentResponse;
import com.localcart.dto.payment.RefundRequest;
import com.localcart.dto.payment.RefundResponse;
import com.localcart.entity.Payment;
import com.localcart.entity.Order;
import com.localcart.entity.enums.PaymentStatus;
import com.localcart.entity.enums.PaymentMethod;
import com.localcart.exception.PaymentException;
import com.localcart.exception.PaymentGatewayException;
import com.localcart.repository.PaymentRepository;
import com.localcart.repository.OrderRepository;
import com.localcart.service.payment.gateway.PaymentGateway;
import com.localcart.service.payment.gateway.PaymentGatewayResponse;
import com.localcart.service.payment.encryption.PaymentEncryption;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Centralized Payment Service
 * 
 * Responsibilities:
 * - Orchestrate payment flow (init -> process -> confirm)
 * - Handle multiple payment providers (Strategy Pattern)
 * - Manage payment lifecycle and status updates
 * - Process refunds and chargebacks
 * - Encrypt sensitive payment data
 * - Provide audit trails for all transactions
 * 
 * Design Pattern: Orchestrator Pattern
 * - Acts as mediator between orders, payments, and payment gateways
 * - Handles business logic and workflows
 * - Provides single point of payment management
 */
@Slf4j
@Service
public class PaymentService {
    
    @Autowired
    private PaymentRepository paymentRepository;
    
    @Autowired
    private OrderRepository orderRepository;
    
    // Payment gateway implementations (can be swapped via configuration)
    @Autowired
    @Qualifier("mockPaymentGateway")
    private PaymentGateway paymentGateway;
    
    @Autowired
    private PaymentEncryption paymentEncryption;
    
    /**
     * Step 1: Initialize a payment
     * Creates a payment record and initiates with payment gateway
     * Returns a payment intent that customer needs to complete
     */
    @Transactional
    public PaymentResponse initiatePayment(PaymentRequest request) {
        try {
            log.info("Initiating payment for order: {}, amount: {}", request.getOrderNumber(), request.getAmount());
            
            // Validate order exists and is in correct status
            Order order = orderRepository.findByOrderNumber(request.getOrderNumber())
                    .orElseThrow(() -> new PaymentException("Order not found", "ORDER_NOT_FOUND"));
            
            if (order.getPayment() != null && !order.getPayment().getStatus().equals(PaymentStatus.FAILED)) {
                throw new PaymentException("Payment already exists for this order", "PAYMENT_EXISTS");
            }
            
            // Validate amount matches order total
            if (!request.getAmount().equals(order.getTotal())) {
                throw new PaymentException("Payment amount does not match order total", "AMOUNT_MISMATCH");
            }
            
            // Initialize with payment gateway
            PaymentGatewayResponse gatewayResponse = paymentGateway.initializePayment(request);
            
            if (!gatewayResponse.getStatus().equals("PENDING")) {
                throw new PaymentException("Failed to initialize payment with gateway", "GATEWAY_INIT_FAILED");
            }
            
            // Create payment record
            Payment payment = Payment.builder()
                    .order(order)
                    .transactionId(gatewayResponse.getTransactionId())
                    .paymentMethod(request.getPaymentMethod())
                    .amount(request.getAmount())
                    .status(PaymentStatus.PENDING)
                    // Encrypt sensitive data before storing
                    .metadata(paymentEncryption.encryptMetadata(request.getMetadataJson()))
                    .build();
            
            Payment saved = paymentRepository.save(payment);
            order.setPayment(saved);
            orderRepository.save(order);
            
            log.info("Payment initiated successfully: {}", saved.getId());
            
            return mapToPaymentResponse(saved);
            
        } catch (PaymentException e) {
            log.error("Payment initiation error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during payment initiation", e);
            throw new PaymentException("Payment initiation failed", "INIT_ERROR", e);
        }
    }
    
    /**
     * Step 2: Process/confirm payment
     * Called after customer completes payment on gateway
     * Verifies payment with gateway and updates status
     */
    @Transactional
    public PaymentResponse processPayment(String paymentId, PaymentRequest request) {
        try {
            log.info("Processing payment: {}", paymentId);
            
            // Fetch payment
            Payment payment = paymentRepository.findById(Long.parseLong(paymentId))
                    .orElseThrow(() -> new PaymentException("Payment not found", "PAYMENT_NOT_FOUND"));
            
            // Process with gateway
            PaymentGatewayResponse gatewayResponse = paymentGateway.processPayment(
                    payment.getTransactionId(), 
                    request
            );
            
            if (gatewayResponse.getStatus().equals("SUCCESS")) {
                // Update payment status
                payment.setStatus(PaymentStatus.COMPLETED);
                payment.setPaidAt(LocalDateTime.now());
                paymentRepository.save(payment);
                
                // Update order status
                Order order = payment.getOrder();
                order.setStatus(order.getStatus()); // Trigger subsequent workflow
                orderRepository.save(order);
                
                log.info("Payment processed successfully: {}", paymentId);
                
            } else if (gatewayResponse.getStatus().equals("FAILED")) {
                payment.setStatus(PaymentStatus.FAILED);
                payment.setFailureReason(gatewayResponse.getErrorMessage());
                paymentRepository.save(payment);
                
                throw new PaymentException("Payment failed: " + gatewayResponse.getErrorMessage(), 
                        gatewayResponse.getErrorCode());
            }
            
            return mapToPaymentResponse(payment);
            
        } catch (PaymentException e) {
            log.error("Payment processing error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during payment processing", e);
            throw new PaymentException("Payment processing failed", "PROCESS_ERROR", e);
        }
    }
    
    /**
     * Verify payment status with gateway
     * Used for webhooks or manual verification
     */
    @Transactional
    public PaymentResponse verifyPayment(String paymentId) {
        try {
            log.info("Verifying payment: {}", paymentId);
            
            Payment payment = paymentRepository.findById(Long.parseLong(paymentId))
                    .orElseThrow(() -> new PaymentException("Payment not found", "PAYMENT_NOT_FOUND"));
            
            // Verify with gateway
            PaymentGatewayResponse gatewayResponse = paymentGateway.verifyPayment(payment.getTransactionId());
            
            if (gatewayResponse.getStatus().equals("SUCCESS") && !payment.getStatus().equals(PaymentStatus.COMPLETED)) {
                // Update status if not already updated
                payment.setStatus(PaymentStatus.COMPLETED);
                payment.setPaidAt(LocalDateTime.now());
                paymentRepository.save(payment);
                
                log.info("Payment verified and status updated: {}", paymentId);
            }
            
            return mapToPaymentResponse(payment);
            
        } catch (Exception e) {
            log.error("Payment verification failed", e);
            throw new PaymentException("Payment verification failed", "VERIFY_ERROR", e);
        }
    }
    
    /**
     * Process a refund
     * Supports full and partial refunds
     * Maintains audit trail
     */
    @Transactional
    public RefundResponse refundPayment(RefundRequest request) {
        try {
            log.info("Processing refund for payment: {}", request.getPaymentId());
            
            // Fetch payment
            Payment payment = paymentRepository.findById(request.getPaymentId())
                    .orElseThrow(() -> new PaymentException("Payment not found", "PAYMENT_NOT_FOUND"));
            
            // Validate refund amount
            BigDecimal refundAmount = request.getRefundAmount() != null ? 
                    request.getRefundAmount() : payment.getAmount();
            
            if (refundAmount.compareTo(payment.getAmount()) > 0) {
                throw new PaymentException("Refund amount exceeds payment amount", "EXCESS_REFUND");
            }
            
            if (!payment.getStatus().equals(PaymentStatus.COMPLETED)) {
                throw new PaymentException("Only completed payments can be refunded", "INVALID_PAYMENT_STATUS");
            }
            
            // Process refund with gateway
            PaymentGatewayResponse gatewayResponse = paymentGateway.refundPayment(
                    payment.getTransactionId(),
                    refundAmount,
                    request.getReason()
            );
            
            if (gatewayResponse.getRefundStatus().equals("SUCCESS")) {
                // Update payment
                if (refundAmount.equals(payment.getAmount())) {
                    payment.setStatus(PaymentStatus.REFUNDED);
                } else {
                    payment.setStatus(PaymentStatus.PARTIALLY_REFUNDED);
                }
                payment.setRefundAmount(refundAmount);
                payment.setRefundedAt(LocalDateTime.now());
                paymentRepository.save(payment);
                
                log.info("Refund processed successfully: {}", gatewayResponse.getRefundId());
                
                return RefundResponse.builder()
                        .paymentId(payment.getId())
                        .transactionId(payment.getTransactionId())
                        .refundId(gatewayResponse.getRefundId())
                        .status("SUCCESS")
                        .refundAmount(refundAmount)
                        .reason(request.getReason())
                        .refundedAt(LocalDateTime.now())
                        .build();
            } else {
                throw new PaymentException("Refund failed: " + gatewayResponse.getErrorMessage(),
                        gatewayResponse.getErrorCode());
            }
            
        } catch (PaymentException e) {
            log.error("Refund error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during refund", e);
            throw new PaymentException("Refund processing failed", "REFUND_ERROR", e);
        }
    }
    
    /**
     * Save a payment method for future use
     * Card details are tokenized - never stored in our database
     */
    public String savePaymentMethod(String cardNumber, String expiryMonth, String expiryYear, String cvv) {
        try {
            log.info("Saving payment method");
            
            // Tokenize with payment gateway
            String token = paymentGateway.tokenizeCard(cardNumber, expiryMonth, expiryYear, cvv);
            
            log.info("Payment method saved successfully");
            
            return token;
            
        } catch (Exception e) {
            log.error("Failed to save payment method", e);
            throw new PaymentException("Failed to save payment method", "TOKENIZE_ERROR", e);
        }
    }
    
    /**
     * Charge a previously saved payment method
     * Uses tokenized card - no sensitive data handled
     */
    @Transactional
    public PaymentResponse chargeToken(Long orderId, String token, String description) {
        try {
            log.info("Charging saved token for order: {}", orderId);
            
            // Fetch order
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new PaymentException("Order not found", "ORDER_NOT_FOUND"));
            
            // Charge token
            PaymentGatewayResponse gatewayResponse = paymentGateway.chargeToken(
                    token,
                    order.getTotal(),
                    "USD",
                    description
            );
            
            if (gatewayResponse.getStatus().equals("SUCCESS")) {
                // Create payment record
                Payment payment = Payment.builder()
                        .order(order)
                        .transactionId(gatewayResponse.getTransactionId())
                        .paymentMethod("SAVED_CARD")
                        .amount(order.getTotal())
                        .status(PaymentStatus.COMPLETED)
                        .paidAt(LocalDateTime.now())
                        .build();
                
                Payment saved = paymentRepository.save(payment);
                order.setPayment(saved);
                orderRepository.save(order);
                
                log.info("Token charge successful: {}", gatewayResponse.getTransactionId());
                
                return mapToPaymentResponse(saved);
            } else {
                throw new PaymentException("Token charge failed", gatewayResponse.getErrorCode());
            }
            
        } catch (Exception e) {
            log.error("Failed to charge token", e);
            throw new PaymentException("Token charge failed", "CHARGE_ERROR", e);
        }
    }
    
    /**
     * Get payment details
     */
    public PaymentResponse getPaymentDetails(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new PaymentException("Payment not found", "PAYMENT_NOT_FOUND"));
        
        return mapToPaymentResponse(payment);
    }
    
    /**
     * Get payment by order
     */
    public PaymentResponse getPaymentByOrder(Long orderId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new PaymentException("Payment not found for order", "PAYMENT_NOT_FOUND"));
        
        return mapToPaymentResponse(payment);
    }
    
    /**
     * Healthcare check - verify payment gateway is available
     */
    public boolean isPaymentGatewayHealthy() {
        return paymentGateway.isHealthy();
    }
    
    // Helper method to map entity to response DTO
    private PaymentResponse mapToPaymentResponse(Payment payment) {
        return PaymentResponse.builder()
                .paymentId(payment.getId())
                .orderId(payment.getOrder().getId())
                .orderNumber(payment.getOrder().getOrderNumber())
                .transactionId(payment.getTransactionId())
                .paymentMethod(payment.getPaymentMethod())
                .maskedCardNumber(maskCardNumber(payment.getPaymentMethod()))
                .amount(payment.getAmount())
                .currency("USD")
                .status(payment.getStatus())
                .createdAt(payment.getCreatedAt())
                .paidAt(payment.getPaidAt())
                .refundedAt(payment.getRefundedAt())
                .failureReason(payment.getFailureReason())
                .refundAmount(payment.getRefundAmount())
                .isRefundable(payment.getStatus().equals(PaymentStatus.COMPLETED))
                .isPartialRefundable(payment.getStatus().equals(PaymentStatus.COMPLETED))
                .build();
    }
    
    private String maskCardNumber(String method) {
        // Return masked version based on payment method
        return "****1234"; // Placeholder
    }
}

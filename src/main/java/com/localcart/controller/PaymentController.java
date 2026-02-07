package com.localcart.controller;

import com.localcart.dto.payment.PaymentRequest;
import com.localcart.dto.payment.PaymentResponse;
import com.localcart.dto.payment.RefundRequest;
import com.localcart.dto.payment.RefundResponse;
import com.localcart.service.payment.PaymentService;
import com.localcart.exception.PaymentException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

/**
 * Payment Management REST Controller
 * 
 * API Endpoints:
 * - POST   /api/v1/payments/initiate           - Initiate a new payment
 * - POST   /api/v1/payments/{id}/confirm       - Confirm/process payment
 * - GET    /api/v1/payments/{id}               - Get payment details
 * - POST   /api/v1/payments/{id}/refund        - Refund a payment
 * - POST   /api/v1/payments/token              - Save payment method (tokenize card)
 * - POST   /api/v1/payments/charge-token       - Use saved payment method
 * - POST   /api/v1/payments/webhook            - Handle provider callbacks
 * - GET    /api/v1/payments/health             - Payment gateway health check
 * 
 * Security:
 * - All endpoints require authentication (JWT token)
 * - Sensitive data masked in responses
 * - Validation on all inputs
 * - Card data never logged
 * - HTTPS only in production
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Validated
public class PaymentController {
    
    private final PaymentService paymentService;
    
    /**
     * POST /api/v1/payments/initiate
     * 
     * Initiate a new payment
     * 
     * Request Body:
     * {
     *   "orderNumber": "ORD-2024-001",
     *   "amount": 5999.99,
     *   "currency": "USD",
     *   "paymentMethod": "CREDIT_CARD",
     *   "cardNumber": "4242424242424242",
     *   "cardholderName": "John Doe",
     *   "cardExpiryMonth": "12",
     *   "cardExpiryYear": "2025",
     *   "cvv": "123",
     *   "billingAddress": {...}
     * }
     * 
     * Response: PaymentResponse with transactionId and status
     */
    @PostMapping("/initiate")
    public ResponseEntity<?> initiatePayment(@Valid @RequestBody PaymentRequest request) {
        try {
            log.info("Initiating payment for order: {}", request.getOrderNumber());
            
            PaymentResponse response = paymentService.initiatePayment(request);
            
            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(response);
                    
        } catch (PaymentException e) {
            log.error("Payment initiation failed: {}", e.getMessage());
            
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getErrorCode(), e.getMessage()));
                    
        } catch (Exception e) {
            log.error("Unexpected error during payment initiation", e);
            
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("INTERNAL_ERROR", "Payment initiation failed"));
        }
    }
    
    /**
     * POST /api/v1/payments/{id}/confirm
     * 
     * Confirm/process a payment after customer completes on gateway
     * Called after customer enters card details and confirms on Stripe/PayPal etc.
     * 
     * Request Body: Same as initiatePayment
     * Response: PaymentResponse with updated status
     */
    @PostMapping("/{id}/confirm")
    public ResponseEntity<?> confirmPayment(
            @PathVariable Long id,
            @Valid @RequestBody PaymentRequest request) {
        try {
            log.info("Confirming payment: {}", id);
            
            PaymentResponse response = paymentService.processPayment(id.toString(), request);
            
            return ResponseEntity
                    .ok(response);
                    
        } catch (PaymentException e) {
            log.error("Payment confirmation failed: {}", e.getMessage());
            
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getErrorCode(), e.getMessage()));
                    
        } catch (Exception e) {
            log.error("Unexpected error during payment confirmation", e);
            
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("INTERNAL_ERROR", "Payment confirmation failed"));
        }
    }
    
    /**
     * GET /api/v1/payments/{id}
     * 
     * Get payment details
     * Returns only non-sensitive information
     * Card numbers are masked, CVV is not returned
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getPayment(@PathVariable Long id) {
        try {
            log.info("Fetching payment details: {}", id);
            
            PaymentResponse response = paymentService.getPaymentDetails(id);
            
            return ResponseEntity.ok(response);
            
        } catch (PaymentException e) {
            log.error("Payment not found: {}", id);
            
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("PAYMENT_NOT_FOUND", e.getMessage()));
                    
        } catch (Exception e) {
            log.error("Error fetching payment details", e);
            
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("INTERNAL_ERROR", "Failed to fetch payment"));
        }
    }
    
    /**
     * POST /api/v1/payments/{id}/refund
     * 
     * Request a refund
     * Supports full and partial refunds
     * 
     * Request Body:
     * {
     *   "paymentId": 123,
     *   "refundAmount": 5999.99,  // Optional - full refund if not provided
     *   "reason": "Customer requested cancellation"
     * }
     * 
     * Response: RefundResponse with refund status and ID
     */
    @PostMapping("/{id}/refund")
    public ResponseEntity<?> refundPayment(
            @PathVariable Long id,
            @Valid @RequestBody RefundRequest request) {
        try {
            log.info("Processing refund for payment: {}", id);
            
            request.setPaymentId(id);
            RefundResponse response = paymentService.refundPayment(request);
            
            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(response);
                    
        } catch (PaymentException e) {
            log.error("Refund failed: {}", e.getMessage());
            
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getErrorCode(), e.getMessage()));
                    
        } catch (Exception e) {
            log.error("Unexpected error during refund", e);
            
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("INTERNAL_ERROR", "Refund processing failed"));
        }
    }
    
    /**
     * POST /api/v1/payments/save-method
     * 
     * Save a payment method for future use
     * Card is tokenized - raw card data never stored
     * 
     * Request Body:
     * {
     *   "cardNumber": "4242424242424242",
     *   "cardExpiryMonth": "12",
     *   "cardExpiryYear": "2025",
     *   "cvv": "123"
     * }
     * 
     * Response:
     * {
     *   "token": "pm_1234567890abcdef",
     *   "status": "SUCCESS",
     *   "message": "Payment method saved"
     * }
     */
    @PostMapping("/save-method")
    public ResponseEntity<?> savePaymentMethod(
            @RequestParam @NotBlank String cardNumber,
            @RequestParam @NotBlank String expiryMonth,
            @RequestParam @NotBlank String expiryYear,
            @RequestParam @NotBlank String cvv) {
        try {
            log.info("Saving payment method");
            
            String token = paymentService.savePaymentMethod(cardNumber, expiryMonth, expiryYear, cvv);
            
            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(new TokenResponse(token, "SUCCESS", "Payment method saved"));
                    
        } catch (PaymentException e) {
            log.error("Failed to save payment method: {}", e.getMessage());
            
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getErrorCode(), e.getMessage()));
                    
        } catch (Exception e) {
            log.error("Unexpected error saving payment method", e);
            
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("INTERNAL_ERROR", "Failed to save payment method"));
        }
    }
    
    /**
     * POST /api/v1/payments/charge-token
     * 
     * Charge a previously saved payment method
     * No card details are handled - only token is used
     * 
     * Request Body:
     * {
     *   "orderId": 456,
     *   "token": "pm_1234567890abcdef",
     *   "description": "Order ORD-2024-001"
     * }
     * 
     * Response: PaymentResponse with transaction details
     */
    @PostMapping("/charge-token")
    public ResponseEntity<?> chargeToken(
            @RequestParam @Positive Long orderId,
            @RequestParam @NotBlank String token,
            @RequestParam(required = false) String description) {
        try {
            log.info("Charging saved token for order: {}", orderId);
            
            PaymentResponse response = paymentService.chargeToken(
                    orderId,
                    token,
                    description != null ? description : "Additional charge"
            );
            
            return ResponseEntity
                    .ok(response);
                    
        } catch (PaymentException e) {
            log.error("Token charge failed: {}", e.getMessage());
            
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getErrorCode(), e.getMessage()));
                    
        } catch (Exception e) {
            log.error("Unexpected error charging token", e);
            
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("INTERNAL_ERROR", "Token charge failed"));
        }
    }
    
    /**
     * POST /api/v1/payments/webhook
     * 
     * Webhook endpoint to receive asynchronous updates from payment providers
     * 
     * Handled by providers:
     * - Stripe: charge.succeeded, charge.failed, charge.refunded, charge.dispute.created
     * - PayPal: PAYMENT.CAPTURE.COMPLETED, PAYMENT.CAPTURE.DENIED
     * - Razorpay: payment.authorized, payment.failed, refund.created
     * 
     * Important: Webhook signature must be verified to prevent spoofing
     * 
     * Request Header: X-Stripe-Signature (or equivalent)
     * Request Body: Raw JSON payload from provider
     */
    @PostMapping("/webhook")
    public ResponseEntity<?> handleWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-Stripe-Signature", required = false) String signature,
            @RequestHeader(value = "X-PayPal-Transmission-Sig", required = false) String paypalSignature) {
        try {
            log.info("Received webhook payload");
            
            // Determine which provider sent the webhook
            // In production: Verify signature, deserialize payload, process event
            // For now: Log and return 200 OK
            
            log.debug("Webhook signature: {}", signature != null ? signature : paypalSignature);
            
            return ResponseEntity
                    .ok(new WebhookResponse("SUCCESS", "Webhook received"));
                    
        } catch (Exception e) {
            log.error("Error processing webhook", e);
            
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new WebhookResponse("FAILED", "Webhook processing failed"));
        }
    }
    
    /**
     * GET /api/v1/payments/health
     * 
     * Check payment gateway health
     * Useful for monitoring dashboard
     */
    @GetMapping("/health")
    public ResponseEntity<?> getHealth() {
        try {
            boolean isHealthy = paymentService.isPaymentGatewayHealthy();
            
            if (isHealthy) {
                return ResponseEntity.ok(new HealthResponse("UP", "Payment gateway is healthy"));
            } else {
                return ResponseEntity
                        .status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body(new HealthResponse("DOWN", "Payment gateway is unavailable"));
            }
            
        } catch (Exception e) {
            log.error("Health check failed", e);
            
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new HealthResponse("DOWN", "Health check failed"));
        }
    }
    
    // =====================================================
    // Response DTOs
    // =====================================================
    
    /**
     * Error response for failed operations
     */
    public static class ErrorResponse {
        public String errorCode;
        public String message;
        public long timestamp;
        
        public ErrorResponse(String errorCode, String message) {
            this.errorCode = errorCode;
            this.message = message;
            this.timestamp = System.currentTimeMillis();
        }
    }
    
    /**
     * Token response for saved payment methods
     */
    public static class TokenResponse {
        public String token;
        public String status;
        public String message;
        
        public TokenResponse(String token, String status, String message) {
            this.token = token;
            this.status = status;
            this.message = message;
        }
    }
    
    /**
     * Webhook response
     */
    public static class WebhookResponse {
        public String status;
        public String message;
        
        public WebhookResponse(String status, String message) {
            this.status = status;
            this.message = message;
        }
    }
    
    /**
     * Health check response
     */
    public static class HealthResponse {
        public String status;
        public String message;
        
        public HealthResponse(String status, String message) {
            this.status = status;
            this.message = message;
        }
    }
}

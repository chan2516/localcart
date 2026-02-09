package com.localcart.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Webhook Controller for n8n Callbacks
 * Receives data from n8n workflows for two-way automation
 */
@Slf4j
@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
public class WebhookController {

    /**
     * Generic webhook receiver for n8n callbacks
     * n8n can send data back to this endpoint after processing
     */
    @PostMapping("/n8n-callback")
    public ResponseEntity<Map<String, String>> receiveN8nCallback(@RequestBody Map<String, Object> payload) {
        log.info("Received n8n callback: {}", payload);
        
        try {
            String eventType = (String) payload.get("eventType");
            
            switch (eventType) {
                case "email_sent":
                    handleEmailSent(payload);
                    break;
                case "sms_sent":
                    handleSmsSent(payload);
                    break;
                case "payment_processed":
                    handlePaymentProcessed(payload);
                    break;
                default:
                    log.warn("Unknown event type: {}", eventType);
            }
            
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Webhook received"
            ));
        } catch (Exception e) {
            log.error("Error processing n8n callback", e);
            return ResponseEntity.ok(Map.of(
                "status", "error",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * Webhook for email delivery confirmations from n8n
     */
    @PostMapping("/email-status")
    public ResponseEntity<Map<String, String>> emailStatus(@RequestBody Map<String, Object> payload) {
        log.info("Email status update: {}", payload);
        
        // You can track email delivery, opens, clicks here
        // Update database with email status
        
        return ResponseEntity.ok(Map.of("status", "received"));
    }

    /**
     * Webhook for SMS delivery confirmations
     */
    @PostMapping("/sms-status")
    public ResponseEntity<Map<String, String>> smsStatus(@RequestBody Map<String, Object> payload) {
        log.info("SMS status update: {}", payload);
        return ResponseEntity.ok(Map.of("status", "received"));
    }

    /**
     * Webhook for external payment notifications (Stripe webhooks via n8n)
     */
    @PostMapping("/payment-notification")
    public ResponseEntity<Map<String, String>> paymentNotification(@RequestBody Map<String, Object> payload) {
        log.info("Payment notification: {}", payload);
        
        // Handle payment confirmations, refunds, etc.
        
        return ResponseEntity.ok(Map.of("status", "received"));
    }

    /**
     * Health check endpoint for n8n to verify connectivity
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "healthy",
            "service", "localcart-webhooks",
            "timestamp", String.valueOf(System.currentTimeMillis())
        ));
    }

    // Private helper methods

    private void handleEmailSent(Map<String, Object> payload) {
        String recipient = (String) payload.get("recipient");
        String emailType = (String) payload.get("emailType");
        Boolean success = (Boolean) payload.get("success");
        
        log.info("Email {} to {}: {}", emailType, recipient, success ? "sent" : "failed");
        
        // Update database to track email delivery
        // E.g., mark order notification as sent, track marketing campaign metrics
    }

    private void handleSmsSent(Map<String, Object> payload) {
        String phoneNumber = (String) payload.get("phoneNumber");
        Boolean success = (Boolean) payload.get("success");
        
        log.info("SMS to {}: {}", phoneNumber, success ? "sent" : "failed");
    }

    private void handlePaymentProcessed(Map<String, Object> payload) {
        String orderId = (String) payload.get("orderId");
        String paymentId = (String) payload.get("paymentId");
        String status = (String) payload.get("status");
        
        log.info("Payment {} for order {}: {}", paymentId, orderId, status);
        
        // Update order payment status
    }
}

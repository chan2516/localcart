package com.localcart.service;

import com.localcart.entity.Order;
import com.localcart.entity.Product;
import com.localcart.entity.Vendor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for triggering n8n automation workflows
 * Sends webhook events to n8n for various business processes
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WebhookService {

    private final RestTemplate restTemplate;

    @Value("${n8n.webhook.base-url:http://n8n:5678/webhook}")
    private String n8nBaseUrl;

    @Value("${n8n.webhook.enabled:true}")
    private boolean webhookEnabled;

    /**
     * Trigger when new order is created
     * Used for: order confirmation emails, vendor notifications, analytics
     */
    @Async
    public void triggerOrderCreated(Order order) {
        if (!webhookEnabled) {
            log.debug("Webhooks disabled, skipping order.created event");
            return;
        }

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("event", "order.created");
            payload.put("timestamp", LocalDateTime.now());
            payload.put("orderId", order.getId());
            payload.put("orderNumber", order.getOrderNumber());
            payload.put("totalAmount", order.getTotal());
            payload.put("status", order.getStatus().name());
            payload.put("customerEmail", order.getUser().getEmail());
            payload.put("customerName", order.getUser().getFirstName() + " " + order.getUser().getLastName());
            payload.put("itemCount", order.getItems().size());
            
            // Vendor information from first item (for single-vendor orders)
            if (!order.getItems().isEmpty() && order.getItems().get(0).getProduct().getVendor() != null) {
                Vendor vendor = order.getItems().get(0).getProduct().getVendor();
                payload.put("vendorId", vendor.getId());
                payload.put("vendorEmail", vendor.getBusinessEmail());
                payload.put("vendorName", vendor.getBusinessName());
            }

            sendWebhook("/order-created", payload);
            log.info("Triggered order.created webhook for order: {}", order.getOrderNumber());
        } catch (Exception e) {
            log.error("Failed to trigger order.created webhook for order: {}", order.getOrderNumber(), e);
        }
    }

    /**
     * Trigger when order status changes
     * Used for: status update emails, delivery notifications
     */
    @Async
    public void triggerOrderStatusChanged(Order order, String previousStatus) {
        if (!webhookEnabled) return;

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("event", "order.status_changed");
            payload.put("timestamp", LocalDateTime.now());
            payload.put("orderId", order.getId());
            payload.put("orderNumber", order.getOrderNumber());
            payload.put("previousStatus", previousStatus);
            payload.put("newStatus", order.getStatus().name());
            payload.put("customerEmail", order.getUser().getEmail());
            payload.put("customerName", order.getUser().getFirstName() + " " + order.getUser().getLastName());

            sendWebhook("/order-status-changed", payload);
            log.info("Triggered order.status_changed webhook for order: {} ({} -> {})", 
                order.getOrderNumber(), previousStatus, order.getStatus());
        } catch (Exception e) {
            log.error("Failed to trigger order.status_changed webhook", e);
        }
    }

    /**
     * Trigger when vendor is approved
     * Used for: welcome emails, onboarding workflows, Stripe Connect setup
     */
    @Async
    public void triggerVendorApproved(Vendor vendor) {
        if (!webhookEnabled) return;

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("event", "vendor.approved");
            payload.put("timestamp", LocalDateTime.now());
            payload.put("vendorId", vendor.getId());
            payload.put("businessName", vendor.getBusinessName());
            payload.put("businessEmail", vendor.getBusinessEmail());
            payload.put("ownerEmail", vendor.getUser().getEmail());
            payload.put("ownerName", vendor.getUser().getFirstName() + " " + vendor.getUser().getLastName());

            sendWebhook("/vendor-approved", payload);
            log.info("Triggered vendor.approved webhook for vendor: {}", vendor.getBusinessName());
        } catch (Exception e) {
            log.error("Failed to trigger vendor.approved webhook", e);
        }
    }

    /**
     * Trigger when new vendor application is submitted
     * Used for: admin notifications, auto-verification checks
     */
    @Async
    public void triggerVendorApplicationSubmitted(Vendor vendor) {
        if (!webhookEnabled) return;

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("event", "vendor.application_submitted");
            payload.put("timestamp", LocalDateTime.now());
            payload.put("vendorId", vendor.getId());
            payload.put("businessName", vendor.getBusinessName());
            payload.put("businessEmail", vendor.getBusinessEmail());
            payload.put("ownerEmail", vendor.getUser().getEmail());

            sendWebhook("/vendor-application", payload);
            log.info("Triggered vendor.application_submitted webhook for: {}", vendor.getBusinessName());
        } catch (Exception e) {
            log.error("Failed to trigger vendor.application_submitted webhook", e);
        }
    }

    /**
     * Trigger for low stock alerts
     * Used for: inventory notifications to vendors
     */
    @Async
    public void triggerLowStockAlert(Product product) {
        if (!webhookEnabled) return;

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("event", "product.low_stock");
            payload.put("timestamp", LocalDateTime.now());
            payload.put("productId", product.getId());
            payload.put("productName", product.getName());
            payload.put("currentStock", product.getStock());
            payload.put("sku", product.getSku());
            
            if (product.getVendor() != null) {
                payload.put("vendorId", product.getVendor().getId());
                payload.put("vendorEmail", product.getVendor().getBusinessEmail());
                payload.put("vendorName", product.getVendor().getBusinessName());
            }

            sendWebhook("/low-stock-alert", payload);
            log.info("Triggered product.low_stock webhook for product: {}", product.getName());
        } catch (Exception e) {
            log.error("Failed to trigger product.low_stock webhook", e);
        }
    }

    /**
     * Trigger for abandoned cart recovery
     * Used for: reminder emails with discount coupons
     */
    @Async
    public void triggerAbandonedCart(Long cartId, String userEmail, BigDecimal cartTotal, int itemCount) {
        if (!webhookEnabled) return;

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("event", "cart.abandoned");
            payload.put("timestamp", LocalDateTime.now());
            payload.put("cartId", cartId);
            payload.put("userEmail", userEmail);
            payload.put("cartTotal", cartTotal);
            payload.put("itemCount", itemCount);

            sendWebhook("/abandoned-cart", payload);
            log.info("Triggered cart.abandoned webhook for user: {}", userEmail);
        } catch (Exception e) {
            log.error("Failed to trigger cart.abandoned webhook", e);
        }
    }

    /**
     * Trigger for review requests
     * Used for: automated review request emails after delivery
     */
    @Async
    public void triggerReviewRequest(Order order) {
        if (!webhookEnabled) return;

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("event", "review.request");
            payload.put("timestamp", LocalDateTime.now());
            payload.put("orderId", order.getId());
            payload.put("orderNumber", order.getOrderNumber());
            payload.put("customerEmail", order.getUser().getEmail());
            payload.put("customerName", order.getUser().getFirstName() + " " + order.getUser().getLastName());

            sendWebhook("/review-request", payload);
            log.info("Triggered review.request webhook for order: {}", order.getOrderNumber());
        } catch (Exception e) {
            log.error("Failed to trigger review.request webhook", e);
        }
    }

    /**
     * Generic webhook sender
     */
    private void sendWebhook(String endpoint, Map<String, Object> payload) {
        try {
            String url = n8nBaseUrl + endpoint;
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            
            restTemplate.postForEntity(url, request, String.class);
            
        } catch (Exception e) {
            log.warn("Webhook failed for endpoint {}: {}", endpoint, e.getMessage());
            // Don't throw - webhooks are non-critical
        }
    }
}

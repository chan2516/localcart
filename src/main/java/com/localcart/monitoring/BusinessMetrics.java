package com.localcart.monitoring;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

/**
 * Custom metrics service for business operations
 */
@Slf4j
@Component
public class BusinessMetrics {

    private final MeterRegistry meterRegistry;
    
    // Counters
    private final Counter orderCreatedCounter;
    private final Counter orderCancelledCounter;
    private final Counter paymentSuccessCounter;
    private final Counter paymentFailedCounter;
    private final Counter productCreatedCounter;
    private final Counter userRegisteredCounter;
    private final Counter vendorApprovedCounter;

    // Timers
    private final Timer orderProcessingTimer;
    private final Timer paymentProcessingTimer;
    
    public BusinessMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        
        // Initialize counters
        this.orderCreatedCounter = Counter.builder("business.orders.created")
            .description("Total number of orders created")
            .register(meterRegistry);
            
        this.orderCancelledCounter = Counter.builder("business.orders.cancelled")
            .description("Total number of orders cancelled")
            .register(meterRegistry);
            
        this.paymentSuccessCounter = Counter.builder("business.payments.success")
            .description("Total number of successful payments")
            .register(meterRegistry);
            
        this.paymentFailedCounter = Counter.builder("business.payments.failed")
            .description("Total number of failed payments")
            .register(meterRegistry);
            
        this.productCreatedCounter = Counter.builder("business.products.created")
            .description("Total number of products created")
            .register(meterRegistry);
            
        this.userRegisteredCounter = Counter.builder("business.users.registered")
            .description("Total number of users registered")
            .register(meterRegistry);
            
        this.vendorApprovedCounter = Counter.builder("business.vendors.approved")
            .description("Total number of vendors approved")
            .register(meterRegistry);
        
        // Initialize timers
        this.orderProcessingTimer = Timer.builder("business.orders.processing.time")
            .description("Time taken to process an order")
            .register(meterRegistry);
            
        this.paymentProcessingTimer = Timer.builder("business.payments.processing.time")
            .description("Time taken to process a payment")
            .register(meterRegistry);
    }

    // Order metrics
    public void recordOrderCreated() {
        orderCreatedCounter.increment();
        log.debug("Order created metric recorded");
    }

    public void recordOrderCancelled() {
        orderCancelledCounter.increment();
        log.debug("Order cancelled metric recorded");
    }

    public void recordOrderProcessingTime(long durationMs) {
        orderProcessingTimer.record(durationMs, TimeUnit.MILLISECONDS);
        log.debug("Order processing time recorded: {}ms", durationMs);
    }

    // Payment metrics
    public void recordPaymentSuccess() {
        paymentSuccessCounter.increment();
        log.debug("Payment success metric recorded");
    }

    public void recordPaymentFailed() {
        paymentFailedCounter.increment();
        log.debug("Payment failed metric recorded");
    }

    public void recordPaymentProcessingTime(long durationMs) {
        paymentProcessingTimer.record(durationMs, TimeUnit.MILLISECONDS);
        log.debug("Payment processing time recorded: {}ms", durationMs);
    }

    // Product metrics
    public void recordProductCreated() {
        productCreatedCounter.increment();
        log.debug("Product created metric recorded");
    }

    // User metrics
    public void recordUserRegistered() {
        userRegisteredCounter.increment();
        log.debug("User registered metric recorded");
    }

    // Vendor metrics
    public void recordVendorApproved() {
        vendorApprovedCounter.increment();
        log.debug("Vendor approved metric recorded");
    }

    /**
     * Record custom counter metric
     */
    public void recordCounter(String name, String description, String... tags) {
        Counter.builder(name)
            .description(description)
            .tags(tags)
            .register(meterRegistry)
            .increment();
    }

    /**
     * Record custom timer metric
     */
    public void recordTimer(String name, long durationMs, String description, String... tags) {
        Timer.builder(name)
            .description(description)
            .tags(tags)
            .register(meterRegistry)
            .record(durationMs, TimeUnit.MILLISECONDS);
    }
}

package com.localcart.service.payment.gateway.factory;

import com.localcart.entity.enums.PaymentProvider;
import com.localcart.service.payment.gateway.PaymentGateway;
import com.localcart.exception.PaymentException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;

/**
 * Payment Gateway Factory
 * 
 * Factory Pattern Implementation
 * Creates and manages payment gateway instances
 * 
 * Usage:
 * - Get gateway by provider enum: factory.getGateway(PaymentProvider.STRIPE)
 * - Get default gateway: factory.getDefaultGateway()
 * - Register new gateway implementation: factory.register(provider, gateway)
 * 
 * Supports pluggable architecture:
 * - Add new provider without modifying this class
 * - Each provider is independent Spring component
 * - Configuration-driven provider selection
 */
@Slf4j
@Component
public class PaymentGatewayFactory {
    
    @Autowired
    @Qualifier("mockPaymentGateway")
    private PaymentGateway mockPaymentGateway;
    
    @Autowired(required = false)
    @Qualifier("stripePaymentGateway")
    private PaymentGateway stripePaymentGateway;
    
    // Future implementations - lazy inject when needed
    // @Autowired(required = false) @Qualifier("paypalPaymentGateway") 
    // private PaymentGateway paypalPaymentGateway;
    
    private final Map<PaymentProvider, PaymentGateway> gateways = new HashMap<>();
    
    private PaymentProvider defaultProvider = PaymentProvider.MOCK;
    
    /**
     * Initialize factory after beans are created
     * Called automatically by Spring
     */
    @PostConstruct
    public void init() {
        log.info("Initializing Payment Gateway Factory");
        
        // Register mock gateway (always available for testing)
        if (mockPaymentGateway != null) {
            register(PaymentProvider.MOCK, mockPaymentGateway);
            log.info("Mock payment gateway registered");
        }
        
        // Register Stripe gateway (if enabled and available)
        if (stripePaymentGateway != null) {
            register(PaymentProvider.STRIPE, stripePaymentGateway);
            log.info("Stripe payment gateway registered");
        }
        
        // Future gateways will be registered here
        // register(PaymentProvider.PAYPAL, paypalPaymentGateway);
        // register(PaymentProvider.RAZORPAY, razorpayPaymentGateway);
        
        log.info("Payment Gateway Factory initialized with {} providers", gateways.size());
    }
    
    /**
     * Get payment gateway by provider
     * 
     * @param provider Payment provider enum
     * @return PaymentGateway implementation
     * @throws PaymentException if provider not registered
     */
    public PaymentGateway getGateway(PaymentProvider provider) {
        PaymentGateway gateway = gateways.get(provider);
        
        if (gateway == null) {
            log.warn("Payment gateway not found for provider: {}", provider);
            throw new PaymentException(
                    "Payment gateway not configured for provider: " + provider,
                    "GATEWAY_NOT_FOUND"
            );
        }
        
        log.debug("Returning gateway for provider: {}", provider);
        return gateway;
    }
    
    /**
     * Get default payment gateway
     * Used when provider is not explicitly specified
     * 
     * @return Default PaymentGateway implementation
     */
    public PaymentGateway getDefaultGateway() {
        PaymentGateway gateway = gateways.get(defaultProvider);
        
        if (gateway == null) {
            log.error("Default payment gateway not available");
            throw new PaymentException(
                    "Default payment gateway not configured",
                    "DEFAULT_GATEWAY_NOT_FOUND"
            );
        }
        
        log.debug("Returning default gateway: {}", defaultProvider);
        return gateway;
    }
    
    /**
     * Register a payment gateway implementation
     * Allows runtime registration of new providers
     * 
     * @param provider Payment provider
     * @param gateway PaymentGateway implementation
     */
    public void register(PaymentProvider provider, PaymentGateway gateway) {
        if (gateway == null) {
            log.warn("Attempted to register null gateway for provider: {}", provider);
            return;
        }
        
        gateways.put(provider, gateway);
        log.info("Registered payment gateway for provider: {}", provider);
    }
    
    /**
     * Set default payment gateway provider
     * 
     * @param provider Default provider
     */
    public void setDefaultProvider(PaymentProvider provider) {
        if (!gateways.containsKey(provider)) {
            throw new PaymentException(
                    "Cannot set default provider - not registered: " + provider,
                    "PROVIDER_NOT_REGISTERED"
            );
        }
        
        this.defaultProvider = provider;
        log.info("Default payment provider set to: {}", provider);
    }
    
    /**
     * Get default provider
     * 
     * @return Current default provider
     */
    public PaymentProvider getDefaultProvider() {
        return defaultProvider;
    }
    
    /**
     * Check if provider is available
     * 
     * @param provider Provider to check
     * @return true if provider is registered and available
     */
    public boolean isProviderAvailable(PaymentProvider provider) {
        return gateways.containsKey(provider);
    }
    
    /**
     * Get all available providers
     * 
     * @return Array of registered providers
     */
    public PaymentProvider[] getAvailableProviders() {
        return gateways.keySet().toArray(new PaymentProvider[0]);
    }
    
    /**
     * Get count of registered gateways
     * 
     * @return Number of available payment gateways
     */
    public int getGatewayCount() {
        return gateways.size();
    }
    
    /**
     * Check health of all registered gateways
     * Used for monitoring/observability
     * 
     * @return Map of provider -> health status
     */
    public Map<PaymentProvider, Boolean> checkAllGatewayHealth() {
        Map<PaymentProvider, Boolean> healthStatus = new HashMap<>();
        
        for (Map.Entry<PaymentProvider, PaymentGateway> entry : gateways.entrySet()) {
            try {
                boolean isHealthy = entry.getValue().isHealthy();
                healthStatus.put(entry.getKey(), isHealthy);
                
                log.debug("Gateway health check - {}: {}", 
                    entry.getKey(), 
                    isHealthy ? "UP" : "DOWN");
                    
            } catch (Exception e) {
                log.warn("Health check failed for gateway: {}", entry.getKey(), e);
                healthStatus.put(entry.getKey(), false);
            }
        }
        
        return healthStatus;
    }
    
    /**
     * Check if any gateway is healthy
     * Useful for critical operations
     * 
     * @return true if at least one gateway is available
     */
    public boolean isAnyGatewayHealthy() {
        return checkAllGatewayHealth().values().stream()
                .anyMatch(healthy -> healthy);
    }
}

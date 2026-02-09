package com.localcart.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.client.RestTemplate;

/**
 * Application-wide configuration
 * - RestTemplate for HTTP client operations
 * - Async processing for webhooks
 * - Scheduled tasks for automations
 */
@Configuration
@EnableAsync
@EnableScheduling
public class AppConfig {

    /**
     * RestTemplate bean for making HTTP requests to external services
     * Used by WebhookService for n8n integration
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}

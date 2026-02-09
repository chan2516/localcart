package com.localcart.service;

import com.localcart.entity.Cart;
import com.localcart.entity.Order;
import com.localcart.entity.Product;
import com.localcart.entity.enums.OrderStatus;
import com.localcart.repository.CartRepository;
import com.localcart.repository.OrderRepository;
import com.localcart.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled Automation Service
 * Runs periodic tasks for business automation
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduledAutomationService {

    private final ProductRepository productRepository;
    private final CartRepository cartRepository;
    private final OrderRepository orderRepository;
    private final WebhookService webhookService;

    @Value("${automation.low-stock.threshold:10}")
    private int lowStockThreshold;

    @Value("${automation.abandoned-cart.hours:24}")
    private long abandonedCartHours;

    @Value("${automation.review-request.days:7}")
    private long reviewRequestDays;

    @Value("${automation.enabled:true}")
    private boolean automationEnabled;

    /**
     * Check for low stock products
     * Runs daily at 9 AM
     */
    @Scheduled(cron = "${automation.low-stock.cron:0 0 9 * * ?}")
    @Transactional(readOnly = true)
    public void checkLowStockProducts() {
        if (!automationEnabled) {
            log.debug("Automation disabled, skipping low stock check");
            return;
        }

        log.info("Running low stock check (threshold: {})", lowStockThreshold);

        try {
            List<Product> lowStockProducts = productRepository.findByStockLessThan(lowStockThreshold);
            
            log.info("Found {} products with low stock", lowStockProducts.size());

            for (Product product : lowStockProducts) {
                if (product.getVendor() != null) {
                    webhookService.triggerLowStockAlert(product);
                }
            }

            if (!lowStockProducts.isEmpty()) {
                log.info("Low stock alerts triggered for {} products", lowStockProducts.size());
            }
        } catch (Exception e) {
            log.error("Error checking low stock products", e);
        }
    }

    /**
     * Check for abandoned carts
     * Runs every 2 hours
     */
    @Scheduled(cron = "${automation.abandoned-cart.cron:0 0 */2 * * ?}")
    @Transactional(readOnly = true)
    public void checkAbandonedCarts() {
        if (!automationEnabled) {
            log.debug("Automation disabled, skipping abandoned cart check");
            return;
        }

        log.info("Running abandoned cart check (inactive for {} hours)", abandonedCartHours);

        try {
            LocalDateTime cutoffTime = LocalDateTime.now().minusHours(abandonedCartHours);
            
            // Find carts that haven't been updated in X hours and have items
            List<Cart> abandonedCarts = cartRepository.findAbandonedCarts(cutoffTime);
            
            log.info("Found {} abandoned carts", abandonedCarts.size());

            for (Cart cart : abandonedCarts) {
                if (!cart.getItems().isEmpty()) {
                    // Calculate cart total
                    BigDecimal total = cart.getItems().stream()
                        .map(item -> {
                            BigDecimal price = item.getProduct().getDiscountPrice() != null 
                                ? item.getProduct().getDiscountPrice() 
                                : item.getProduct().getPrice();
                            return price.multiply(BigDecimal.valueOf(item.getQuantity()));
                        })
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                    webhookService.triggerAbandonedCart(
                        cart.getId(),
                        cart.getUser().getEmail(),
                        total,
                        cart.getItems().size()
                    );
                    
                    // Mark cart as reminded (if you have this field)
                    // cart.setReminderSentAt(LocalDateTime.now());
                    // cartRepository.save(cart);
                }
            }

            if (!abandonedCarts.isEmpty()) {
                log.info("Abandoned cart reminders triggered for {} carts", abandonedCarts.size());
            }
        } catch (Exception e) {
            log.error("Error checking abandoned carts", e);
        }
    }

    /**
     * Send review requests for delivered orders
     * Runs daily at 10 AM
     */
    @Scheduled(cron = "${automation.review-request.cron:0 0 10 * * ?}")
    @Transactional(readOnly = true)
    public void sendReviewRequests() {
        if (!automationEnabled) {
            log.debug("Automation disabled, skipping review request check");
            return;
        }

        log.info("Running review request check (delivered {} days ago)", reviewRequestDays);

        try {
            LocalDateTime cutoffTime = LocalDateTime.now().minusDays(reviewRequestDays);
            
            // Find delivered orders from X days ago that don't have reviews
            List<Order> ordersNeedingReview = orderRepository.findDeliveredOrdersNeedingReview(cutoffTime);
            
            log.info("Found {} orders needing review requests", ordersNeedingReview.size());

            for (Order order : ordersNeedingReview) {
                webhookService.triggerReviewRequest(order);
                
                // Mark as review requested (if you have this field)
                // order.setReviewRequestedAt(LocalDateTime.now());
                // orderRepository.save(order);
            }

            if (!ordersNeedingReview.isEmpty()) {
                log.info("Review requests triggered for {} orders", ordersNeedingReview.size());
            }
        } catch (Exception e) {
            log.error("Error sending review requests", e);
        }
    }

    /**
     * Daily analytics summary
     * Runs daily at 8 AM
     */
    @Scheduled(cron = "${automation.daily-report.cron:0 0 8 * * ?}")
    @Transactional(readOnly = true)
    public void generateDailyReport() {
        if (!automationEnabled) {
            log.debug("Automation disabled, skipping daily report");
            return;
        }

        log.info("Generating daily analytics report");

        try {
            LocalDateTime startOfYesterday = LocalDateTime.now().minusDays(1).withHour(0).withMinute(0).withSecond(0);
            LocalDateTime endOfYesterday = LocalDateTime.now().minusDays(1).withHour(23).withMinute(59).withSecond(59);

            // You can add custom queries to get daily stats
            // For now, just log that the task ran
            log.info("Daily report generation completed");
            
            // In a real implementation, you would:
            // 1. Query for daily sales, new users, new vendors
            // 2. Send to n8n webhook for email/Slack notification
            // 3. Store in a daily_reports table
        } catch (Exception e) {
            log.error("Error generating daily report", e);
        }
    }
}

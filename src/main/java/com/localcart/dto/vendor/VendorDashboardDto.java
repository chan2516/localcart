package com.localcart.dto.vendor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Vendor Dashboard Statistics DTO
 * 
 * Used to display vendor performance metrics on the vendor dashboard.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorDashboardDto {
    
    // Sales Metrics
    private BigDecimal totalSales;
    private BigDecimal thisMonthSales;
    private BigDecimal lastMonthSales;
    private Long totalOrders;
    private Long thisMonthOrders;
    private Long pendingOrders;
    private Long completedOrders;
    
    // Financial
    private BigDecimal pendingPayout;
    private LocalDateTime lastPayoutAt;
    private BigDecimal lastPayoutAmount;
    private BigDecimal commissionRate;
    
    // Products
    private Long totalProducts;
    private Long activeProducts;
    private Long outOfStockProducts;
    private Long lowStockProducts;
    
    // Reviews & Rating
    private Double averageRating;
    private Integer totalReviews;
    private Integer thisMonthReviews;
    
    // Growth Metrics
    private Double salesGrowthPercentage;
    private Double orderGrowthPercentage;
    
    // Top Selling Products (could be a list)
    private Long topProductId;
    private String topProductName;
    private Long topProductSales;
}

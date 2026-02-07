package com.localcart.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Admin Dashboard Statistics DTO
 * 
 * High-level platform metrics for admin dashboard.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDto {
    
    // User Metrics
    private Long totalUsers;
    private Long activeUsers;
    private Long newUsersToday;
    private Long newUsersThisWeek;
    private Long newUsersThisMonth;
    
    // Vendor Metrics
    private Long totalVendors;
    private Long activeVendors;
    private Long pendingVendorApplications;
    private Long rejectedVendors;
    private Long suspendedVendors;
    
    // Product Metrics
    private Long totalProducts;
    private Long activeProducts;
    private Long outOfStockProducts;
    private Long pendingProductApprovals;
    
    // Order Metrics
    private Long totalOrders;
    private Long todayOrders;
    private Long thisWeekOrders;
    private Long thisMonthOrders;
    private Long pendingOrders;
    private Long processingOrders;
    private Long shippedOrders;
    private Long deliveredOrders;
    private Long cancelledOrders;
    
    // Revenue Metrics
    private BigDecimal totalRevenue;
    private BigDecimal todayRevenue;
    private BigDecimal thisWeekRevenue;
    private BigDecimal thisMonthRevenue;
    private BigDecimal platformCommissionEarned;
    
    // Payment Metrics
    private BigDecimal totalPayments;
    private BigDecimal pendingPayments;
    private BigDecimal completedPayments;
    private BigDecimal failedPayments;
    private BigDecimal refundedPayments;
    
    // Growth Metrics
    private Double userGrowthPercentage;
    private Double revenueGrowthPercentage;
    private Double orderGrowthPercentage;
    
    // Average Metrics
    private BigDecimal averageOrderValue;
    private Double averageRating;
    private Integer totalReviews;
}

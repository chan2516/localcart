package com.localcart.dto.vendor;

import com.localcart.entity.enums.VendorStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Vendor DTO for displaying vendor information
 * 
 * Used in:
 * - Vendor profile display
 * - Vendor listings
 * - Admin vendor management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorDto {
    
    private Long id;
    private Long userId;
    
    // Business Information
    private String businessName;
    private String description;
    private String businessEmail;
    private String businessPhone;
    private String businessAddress;
    private String website;
    private String logoUrl;
    
    // Registration Details
    private String taxId;
    private String businessRegistrationNumber;
    private String businessLicense;
    private String businessType;
    
    // Status
    private VendorStatus status;
    private LocalDate approvedAt;
    private String approvedByName;
    private String rejectionReason;
    private LocalDateTime kycVerifiedAt;
    
    // Policies
    private String returnPolicy;
    private String shippingPolicy;
    private BigDecimal minimumOrderValue;
    private BigDecimal freeShippingThreshold;
    
    // Performance
    private Double rating;
    private Integer totalReviews;
    private Long totalOrders;
    private BigDecimal totalSales;
    
    // Financial (only for vendor owner and admin)
    private BigDecimal commissionRate;
    private BigDecimal pendingPayout;
    private LocalDateTime lastPayoutAt;
    
    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

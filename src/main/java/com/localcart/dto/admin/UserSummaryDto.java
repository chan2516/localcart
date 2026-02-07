package com.localcart.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * User Summary DTO for Admin
 * 
 * Used in admin user listing/management views.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryDto {
    
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    
    // Account Info
    private Boolean isActive;
    private Boolean isEmailVerified;
    private LocalDateTime lastLoginAt;
    private Set<String> roles;
    
    // Vendor Info
    private Boolean isVendor;
    private String vendorBusinessName;
    private String vendorStatus;
    
    // Statistics
    private Long totalOrders;
    private Integer totalReviews;
    
    // Security
    private Integer failedLoginAttempts;
    private LocalDateTime accountLockedUntil;
    private String suspensionReason;
    
    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

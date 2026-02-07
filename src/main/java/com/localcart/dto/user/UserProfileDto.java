package com.localcart.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

/**
 * User Profile DTO
 * 
 * Used to display complete user profile information.
 * Includes all non-sensitive data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {
    
    private Long id;
    
    // Basic Information
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String profileImageUrl;
    
    // Personal Details
    private LocalDate dateOfBirth;
    private String gender;
    
    // Account Status
    private Boolean isActive;
    private Boolean isEmailVerified;
    private LocalDateTime lastLoginAt;
    
    // Preferences
    private String preferredLanguage;
    private String preferredCurrency;
    private String timezone;
    
    // Security
    private Boolean twoFactorEnabled;
    
    // Roles
    private Set<String> roles;
    
    // Vendor Info (if user is a vendor)
    private Boolean isVendor;
    private Long vendorId;
    private String vendorBusinessName;
    private String vendorStatus;
    
    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

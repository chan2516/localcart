package com.localcart.dto.address;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Address Data Transfer Object
 * Used for displaying address information
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddressDto {
    
    private Long id;
    
    // Address details
    private String street;
    private String apartment;
    private String city;
    private String state;
    private String country;
    private String zipCode;
    
    // Address type
    private String addressType; // BILLING, SHIPPING, BOTH
    
    // Default address
    private Boolean isDefault;
    
    // Timestamps
    private String createdAt;
    private String updatedAt;
}

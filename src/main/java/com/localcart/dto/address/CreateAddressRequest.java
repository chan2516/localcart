package com.localcart.dto.address;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request object for creating/updating addresses
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateAddressRequest {
    
    @NotBlank(message = "Street address is required")
    @Size(min = 5, max = 255, message = "Street address must be between 5 and 255 characters")
    private String street;
    
    @Size(max = 100, message = "Apartment cannot exceed 100 characters")
    private String apartment;
    
    @NotBlank(message = "City is required")
    @Size(min = 2, max = 100, message = "City must be between 2 and 100 characters")
    private String city;
    
    @NotBlank(message = "State is required")
    @Size(min = 2, max = 100, message = "State must be between 2 and 100 characters")
    private String state;
    
    @NotBlank(message = "Country is required")
    @Size(min = 2, max = 100, message = "Country must be between 2 and 100 characters")
    private String country;
    
    @NotBlank(message = "ZIP/Postal code is required")
    @Size(min = 3, max = 20, message = "ZIP code must be between 3 and 20 characters")
    private String zipCode;
    
    @NotBlank(message = "Address type is required")
    @Pattern(regexp = "BILLING|SHIPPING|BOTH", message = "Address type must be BILLING, SHIPPING, or BOTH")
    private String addressType;
    
    @Builder.Default
    private Boolean isDefault = false;
}

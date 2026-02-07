package com.localcart.dto.vendor;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Vendor Update Request DTO
 * 
 * Used when a vendor updates their profile/business information.
 * All fields are optional (partial update supported).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorUpdateRequest {
    
    @Size(min = 2, max = 100)
    private String businessName;
    
    @Size(max = 500)
    private String description;
    
    @Email
    @Size(max = 100)
    private String businessEmail;
    
    @Size(min = 10, max = 20)
    private String businessPhone;
    
    @Size(max = 255)
    private String businessAddress;
    
    @Size(max = 255)
    private String website;
    
    @Size(max = 255)
    private String logoUrl;
    
    // Policies
    @Size(max = 255)
    private String returnAddress;
    
    @Size(max = 2000)
    private String returnPolicy;
    
    @Size(max = 2000)
    private String shippingPolicy;
    
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal minimumOrderValue;
    
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal freeShippingThreshold;
    
    // Bank Details (sensitive - only updatable with additional verification)
    @Size(max = 100)
    private String bankAccountNumber;
    
    @Size(max = 100)
    private String bankName;
    
    @Size(max = 100)
    private String bankBranch;
    
    @Size(max = 50)
    private String ifscCode;
    
    @Size(max = 100)
    private String accountHolderName;
}

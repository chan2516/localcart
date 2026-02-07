package com.localcart.dto.vendor;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Vendor Registration Request DTO
 * 
 * Used when a user applies to become a vendor.
 * This is the initial vendor onboarding form.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorRegistrationRequest {
    
    // Business Basic Information
    @NotBlank(message = "Business name is required")
    @Size(min = 2, max = 100, message = "Business name must be between 2-100 characters")
    private String businessName;
    
    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;
    
    @Email(message = "Valid business email is required")
    @NotBlank(message = "Business email is required")
    @Size(max = 100)
    private String businessEmail;
    
    @NotBlank(message = "Business phone is required")
    @Size(min = 10, max = 20, message = "Phone must be between 10-20 characters")
    private String businessPhone;
    
    @NotBlank(message = "Business address is required")
    @Size(max = 255)
    private String businessAddress;
    
    @Size(max = 255)
    private String website;
    
    // Business Registration Details
    @NotBlank(message = "Tax ID is required")
    @Size(max = 50)
    private String taxId;
    
    @NotBlank(message = "Business registration number is required")
    @Size(max = 100)
    private String businessRegistrationNumber;
    
    @Size(max = 100)
    private String businessLicense;
    
    @NotBlank(message = "Business type is required")
    @Size(max = 50)
    private String businessType; // "LLC", "Corporation", "Sole Proprietor", etc.
    
    // Bank Details for Payouts
    @Size(max = 100)
    private String bankAccountNumber;
    
    @Size(max = 100)
    private String bankName;
    
    @Size(max = 100)
    private String bankBranch;
    
    @Size(max = 50)
    private String ifscCode; // Or routing number for US
    
    @Size(max = 100)
    private String accountHolderName;
    
    // Additional Information
    @Size(max = 255)
    private String returnAddress;
    
    @Size(max = 1000)
    private String returnPolicy;
    
    @Size(max = 1000)
    private String shippingPolicy;
}

package com.localcart.dto.admin;

import com.localcart.entity.enums.VendorStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Vendor Approval Request DTO
 * 
 * Used by admin to approve or reject vendor applications.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorApprovalRequest {
    
    @NotNull(message = "Vendor ID is required")
    private Long vendorId;
    
    @NotNull(message = "Status is required (APPROVED or REJECTED)")
    private VendorStatus status; // APPROVED or REJECTED
    
    @Size(max = 500, message = "Reason cannot exceed 500 characters")
    private String reason; // Required if REJECTED, optional if APPROVED
    
    // Commission rate can be set during approval
    private BigDecimal commissionRate;
    
    // Admin notes (internal only)
    @Size(max = 1000)
    private String adminNotes;
}

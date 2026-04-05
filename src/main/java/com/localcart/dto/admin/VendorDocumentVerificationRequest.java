package com.localcart.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Admin Vendor Document Verification Request
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorDocumentVerificationRequest {

    @NotNull(message = "Document ID is required")
    private Long documentId;

    @NotBlank(message = "Verification status is required (VERIFIED or REJECTED)")
    private String verificationStatus; // VERIFIED or REJECTED

    private String verificationComments; // Comments from admin about verification
}

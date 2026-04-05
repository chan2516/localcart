package com.localcart.dto.vendor;

import com.localcart.entity.enums.VendorDocumentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Vendor Document Upload Request DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorDocumentUploadRequest {

    @NotNull(message = "Document type is required")
    private VendorDocumentType documentType;

    @NotBlank(message = "Document URL is required")
    @Size(max = 500)
    private String documentUrl;

    @Size(max = 255)
    private String fileName;

    @Size(max = 100)
    private String mimeType;

    @Size(max = 100)
    private String documentNumber; // e.g., GSTIN Number, FASSAI Number

    private LocalDate expiryDate; // For certificates with expiry

    @Size(max = 500)
    private String uploadNotes; // Notes from vendor about the document
}

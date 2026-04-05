package com.localcart.dto.vendor;

import com.localcart.entity.enums.VendorDocumentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Vendor Document Response DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorDocumentDto {

    private Long id;

    private VendorDocumentType documentType;

    private String documentUrl;

    private String fileName;

    private Long fileSize;

    private String mimeType;

    private String verificationStatus; // PENDING, VERIFIED, REJECTED

    private LocalDateTime verifiedAt;

    private String verificationComments;

    private String documentNumber;

    private LocalDate expiryDate;

    private String uploadNotes;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}

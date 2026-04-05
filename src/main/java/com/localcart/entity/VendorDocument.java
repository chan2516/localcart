package com.localcart.entity;

import com.localcart.entity.base.AuditableEntity;
import com.localcart.entity.enums.VendorDocumentType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "vendor_documents", indexes = {
    @Index(name = "idx_vendor_documents_vendor_id", columnList = "vendor_id"),
    @Index(name = "idx_vendor_documents_type", columnList = "document_type"),
    @Index(name = "idx_vendor_documents_status", columnList = "verification_status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorDocument extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 50)
    private VendorDocumentType documentType;

    @NotBlank
    @Size(max = 500)
    @Column(name = "document_url", nullable = false, length = 500)
    private String documentUrl; // S3 or file storage URL

    @Column(name = "file_name")
    @Size(max = 255)
    private String fileName;

    @Column(name = "file_size")
    private Long fileSize; // In bytes

    @Column(name = "mime_type")
    @Size(max = 100)
    private String mimeType; // e.g., "image/jpeg", "application/pdf"

    // Verification Fields
    @Column(name = "verification_status", length = 20)
    @Builder.Default
    private String verificationStatus = "PENDING"; // PENDING, VERIFIED, REJECTED

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by")
    private User verifiedBy;

    @Column(name = "verification_comments", length = 1000)
    private String verificationComments;

    // Metadata
    @Column(name = "document_number")
    @Size(max = 100)
    private String documentNumber; // e.g., GSTIN Number, FASSAI Number

    @Column(name = "expiry_date")
    private java.time.LocalDate expiryDate; // For certificates with expiry

    @Column(name = "upload_notes", length = 500)
    private String uploadNotes; // Notes from vendor during upload
}

package com.localcart.entity;

import com.localcart.entity.base.AuditableEntity;
import com.localcart.entity.enums.VendorStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "vendors", indexes = {
    @Index(name = "idx_vendor_status", columnList = "status"),
    @Index(name = "idx_vendor_approved_date", columnList = "approved_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vendor extends AuditableEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @NotBlank
    @Size(max = 100)
    @Column(name = "business_name", nullable = false, unique = true, length = 100)
    private String businessName;

    @Size(max = 500)
    @Column(length = 500)
    private String description;

    // Business Contact Information
    @Email
    @Size(max = 100)
    @Column(name = "business_email", length = 100)
    private String businessEmail;

    @Size(max = 20)
    @Column(name = "business_phone", length = 20)
    private String businessPhone;

    @Size(max = 255)
    @Column(name = "business_address")
    private String businessAddress;

    @Size(max = 255)
    @Column(name = "website", length = 255)
    private String website;

    @Size(max = 255)
    @Column(name = "logo_url")
    private String logoUrl;

    // Business Registration & Verification (KYC)
    @Size(max = 50)
    @Column(name = "tax_id", length = 50)
    private String taxId;

    @Size(max = 100)
    @Column(name = "business_registration_number", length = 100)
    private String businessRegistrationNumber;

    @Size(max = 100)
    @Column(name = "business_license", length = 100)
    private String businessLicense;

    @Size(max = 50)
    @Column(name = "business_type", length = 50)
    private String businessType; // LLC, Corporation, Sole Proprietor, etc.

    @Size(max = 500)
    @Column(name = "kyc_document_url", length = 500)
    private String kycDocumentUrl;

    @Column(name = "kyc_verified_at")
    private LocalDateTime kycVerifiedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kyc_verified_by")
    private User kycVerifiedBy;

    // Business Status & Approval
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private VendorStatus status = VendorStatus.PENDING;

    @Column(name = "approved_at")
    private LocalDate approvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Size(max = 500)
    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    // Operations & Policies
    @Column(name = "business_hours_json", columnDefinition = "TEXT")
    private String businessHoursJson; // JSON: {"mon": "9-5", "tue": "9-5", ...}

    @Size(max = 255)
    @Column(name = "return_address")
    private String returnAddress;

    @Column(name = "return_policy", columnDefinition = "TEXT")
    private String returnPolicy;

    @Column(name = "shipping_policy", columnDefinition = "TEXT")
    private String shippingPolicy;

    @Column(name = "minimum_order_value", precision = 10, scale = 2)
    private BigDecimal minimumOrderValue;

    @Column(name = "free_shipping_threshold", precision = 10, scale = 2)
    private BigDecimal freeShippingThreshold;

    // Financial Information (Encrypted in production)
    @Column(name = "commission_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal commissionRate = new BigDecimal("15.00"); // 15% default

    @Size(max = 100)
    @Column(name = "bank_account_number", length = 100)
    private String bankAccountNumber; // Should be encrypted

    @Size(max = 100)
    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Size(max = 100)
    @Column(name = "bank_branch", length = 100)
    private String bankBranch;

    @Size(max = 50)
    @Column(name = "ifsc_code", length = 50)
    private String ifscCode; // Or routing number for US

    @Size(max = 100)
    @Column(name = "account_holder_name", length = 100)
    private String accountHolderName;

    // Performance Metrics
    @Column(name = "total_sales", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalSales = BigDecimal.ZERO;

    @Column(name = "total_orders")
    @Builder.Default
    private Long totalOrders = 0L;

    @Column(name = "pending_payout", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal pendingPayout = BigDecimal.ZERO;

    @Column(name = "last_payout_at")
    private LocalDateTime lastPayoutAt;

    @Column(name = "rating")
    private Double rating;

    @Column(name = "total_reviews")
    @Builder.Default
    private Integer totalReviews = 0;

    @OneToMany(mappedBy = "vendor", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Product> products = new ArrayList<>();
}

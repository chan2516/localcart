package com.localcart.controller;

import com.localcart.dto.admin.DashboardStatsDto;
import com.localcart.dto.admin.AdminAccountDto;
import com.localcart.dto.admin.AdminActionHistoryDto;
import com.localcart.dto.admin.AdminCreateRequest;
import com.localcart.dto.admin.ContactInfoDto;
import com.localcart.dto.admin.ContactInfoRequest;
import com.localcart.dto.admin.PlatformMetricsDto;
import com.localcart.dto.admin.UserManagementRequest;
import com.localcart.dto.admin.UserSummaryDto;
import com.localcart.dto.admin.VendorApprovalRequest;
import com.localcart.dto.admin.VendorDocumentVerificationRequest;
import com.localcart.dto.vendor.VendorDto;
import com.localcart.dto.vendor.VendorDocumentDto;
import com.localcart.entity.enums.AdminActionTargetType;
import com.localcart.entity.enums.VendorStatus;
import com.localcart.security.CustomUserDetails;
import com.localcart.service.AdminService;
import com.localcart.service.VendorService;
import com.localcart.service.VendorDocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Admin Controller
 * 
 * Endpoints for:
 * - Vendor approval/rejection
 * - User management (suspend, activate, ban)
 * - Platform dashboard statistics
 * - Content moderation
 * 
 * All endpoints require ADMIN role.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','ADMIN_L1','ADMIN_L2')")
public class AdminController {

    private final VendorService vendorService;
    private final AdminService adminService;
    private final VendorDocumentService vendorDocumentService;

    // ===========================
    // VENDOR MANAGEMENT
    // ===========================

    /**
     * Get pending vendor applications
     * 
     * GET /api/v1/admin/vendors/pending?page=0&size=10
     * 
     * Response: 200 OK with Page<VendorDto>
     */
    @GetMapping("/vendors/pending")
    public ResponseEntity<Page<VendorDto>> getPendingVendorApplications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        log.info("Admin fetching pending vendor applications - page: {}, size: {}", page, size);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        Page<VendorDto> vendors = vendorService.getPendingApplications(pageable);
        
        return ResponseEntity.ok(vendors);
    }

    /**
     * Get all vendors with optional status filter
     * 
     * GET /api/v1/admin/vendors?status=PENDING&page=0&size=20
     * 
     * Query Parameters:
     * - status: VendorStatus (PENDING, APPROVED, REJECTED, SUSPENDED)
     * - page: Page number
     * - size: Page size
     * 
     * Response: 200 OK with Page<VendorDto>
     */
    @GetMapping("/vendors")
    public ResponseEntity<Page<VendorDto>> getAllVendors(
            @RequestParam(required = false) VendorStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("Admin fetching vendors - status: {}, page: {}, size: {}", status, page, size);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<VendorDto> vendors = vendorService.getAllVendors(status, pageable);
        
        return ResponseEntity.ok(vendors);
    }

    /**
     * Get vendor details by ID
     * 
     * GET /api/v1/admin/vendors/{id}
     * 
     * Response: 200 OK with VendorDto
     */
    @GetMapping("/vendors/{id}")
    public ResponseEntity<VendorDto> getVendorById(@PathVariable Long id) {
        log.info("Admin fetching vendor details - ID: {}", id);
        
        VendorDto vendor = vendorService.getVendorById(id);
        
        return ResponseEntity.ok(vendor);
    }

    /**
     * Approve or reject vendor application
     * 
     * POST /api/v1/admin/vendors/approve
     * 
     * Request Body:
     * {
     *   "vendorId": 123,
     *   "status": "APPROVED",  // or "REJECTED"
     *   "reason": "All documents verified",  // Optional for APPROVED, required for REJECTED
     *   "commissionRate": 15.00,  // Optional, default 15%
     *   "adminNotes": "Good business plan"
     * }
     * 
     * Response: 200 OK with updated VendorDto
     */
    @PostMapping("/vendors/approve")
    public ResponseEntity<VendorDto> approveOrRejectVendor(
            @Valid @RequestBody VendorApprovalRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        log.info("Admin {} - vendor ID: {}, new status: {}", 
            request.getStatus() == VendorStatus.APPROVED ? "approving" : "rejecting",
            request.getVendorId(), request.getStatus());
        
        Long adminUserId = userDetails.getUserId();
        
        // Validate
        if (request.getStatus() == VendorStatus.REJECTED && 
            (request.getReason() == null || request.getReason().isBlank())) {
            throw new IllegalArgumentException("Reason is required when rejecting a vendor");
        }
        
        VendorDto vendor = vendorService.approveVendor(
            request.getVendorId(), 
            adminUserId, 
            request.getStatus(), 
            request.getReason(),
            request.getCommissionRate()
        );
        
        log.info("Vendor {} by admin. Vendor ID: {}", 
            request.getStatus() == VendorStatus.APPROVED ? "approved" : "rejected",
            request.getVendorId());
        
        return ResponseEntity.ok(vendor);
    }

    /**
     * Suspend vendor
     * 
     * POST /api/v1/admin/vendors/{id}/suspend
     * 
     * Request Body:
     * {
     *   "reason": "Violation of terms",
     *   "adminNotes": "Multiple customer complaints"
     * }
     * 
     * Response: 200 OK with updated VendorDto
     */
    @PostMapping("/vendors/{id}/suspend")
    public ResponseEntity<VendorDto> suspendVendor(
            @PathVariable Long id,
            @RequestBody VendorApprovalRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        log.info("Admin suspending vendor - ID: {}, reason: {}", id, request.getReason());
        
        Long adminUserId = userDetails.getUserId();
        
        VendorDto vendor = vendorService.approveVendor(
            id, 
            adminUserId, 
            VendorStatus.SUSPENDED, 
            request.getReason(),
            null
        );
        
        return ResponseEntity.ok(vendor);
    }

    @PostMapping("/vendors/{id}/ban")
    public ResponseEntity<VendorDto> banVendor(
            @PathVariable Long id,
            @RequestBody(required = false) VendorApprovalRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        String reason = (request == null || request.getReason() == null || request.getReason().isBlank())
                ? "You are banned. Please connect helpdesk for verification."
                : request.getReason();

        log.info("Admin banning vendor - ID: {}, reason: {}", id, reason);

        VendorDto vendor = vendorService.banVendor(id, userDetails.getUserId(), reason);
        return ResponseEntity.ok(vendor);
    }

    @PostMapping("/vendors/{id}/restore")
    public ResponseEntity<VendorDto> restoreVendor(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        log.info("Admin restoring vendor - ID: {}", id);
        VendorDto vendor = vendorService.restoreVendor(id, userDetails.getUserId());
        return ResponseEntity.ok(vendor);
    }

    // ===========================
    // USER MANAGEMENT
    // ===========================

    /**
     * Manage user account (suspend, activate, ban)
     * 
     * POST /api/v1/admin/users/manage
     * 
     * Request Body:
     * {
     *   "userId": 456,
     *   "action": "SUSPEND",  // ACTIVATE, SUSPEND, BAN
     *   "reason": "Fraudulent activity detected",
     *   "suspensionDurationDays": 30,  // Optional for SUSPEND
     *   "adminNotes": "Multiple fake reviews"
     * }
     * 
     * Response: 200 OK
     * 
     * TODO: Implement AdminService for user management
     */
    @PostMapping("/users/manage")
        public ResponseEntity<UserSummaryDto> manageUser(
            @Valid @RequestBody UserManagementRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        log.info("Admin managing user - User ID: {}, Action: {}", 
            request.getUserId(), request.getAction());
        
        UserSummaryDto user = adminService.manageUser(request, userDetails.getUserId());
        
        return ResponseEntity.ok(user);
    }

    /**
     * Get all users (with pagination and filtering)
     * 
     * GET /api/v1/admin/users?page=0&size=20&active=true
     * 
     * TODO: Implement AdminService with user listing
     */
    @GetMapping("/users")
    public ResponseEntity<Page<UserSummaryDto>> getAllUsers(
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("Admin fetching users - active: {}, page: {}, size: {}", active, page, size);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<UserSummaryDto> users = adminService.getAllUsers(active, pageable);
        
        return ResponseEntity.ok(users);
    }

    /**
     * Get user details by ID
     * 
     * GET /api/v1/admin/users/{id}
     * 
     * TODO: Implement AdminService
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<UserSummaryDto> getUserById(@PathVariable Long id) {
        log.info("Admin fetching user details - ID: {}", id);
        
        UserSummaryDto user = adminService.getUserById(id);
        
        return ResponseEntity.ok(user);
    }

    @GetMapping("/history")
    public ResponseEntity<Page<AdminActionHistoryDto>> getActionHistory(
            @RequestParam(required = false) AdminActionTargetType targetType,
            @RequestParam(required = false) Long targetId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(adminService.getActionHistory(targetType, targetId, pageable));
    }

    @GetMapping("/admins")
    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_L1')")
    public ResponseEntity<Page<AdminAccountDto>> getAllAdmins(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(adminService.getAllAdminAccounts(pageable));
    }

    @PostMapping("/admins")
    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_L1')")
    public ResponseEntity<AdminAccountDto> createSecondLevelAdmin(
            @Valid @RequestBody AdminCreateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        AdminAccountDto created = adminService.createSecondLevelAdmin(request, userDetails.getUserId());
        return ResponseEntity.ok(created);
    }

    @PostMapping("/admins/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_L1')")
    public ResponseEntity<AdminAccountDto> activateAdmin(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        return ResponseEntity.ok(adminService.setAdminAccountStatus(id, true, userDetails.getUserId()));
    }

    @PostMapping("/admins/{id}/suspend")
    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_L1')")
    public ResponseEntity<AdminAccountDto> suspendAdmin(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        return ResponseEntity.ok(adminService.setAdminAccountStatus(id, false, userDetails.getUserId()));
    }

    @GetMapping("/contact-info")
    public ResponseEntity<ContactInfoDto> getContactInfo() {
        return ResponseEntity.ok(adminService.getContactInfo());
    }

    @PutMapping("/contact-info")
    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_L1')")
    public ResponseEntity<ContactInfoDto> updateContactInfo(
            @Valid @RequestBody ContactInfoRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        return ResponseEntity.ok(adminService.updateContactInfo(request, userDetails.getUserId()));
    }

    // ===========================
    // DASHBOARD & ANALYTICS
    // ===========================

    /**
     * Get admin dashboard statistics
     * 
     * GET /api/v1/admin/dashboard
     * 
     * Response: 200 OK with DashboardStatsDto
     * 
     * TODO: Implement AdminService with dashboard statistics
     */
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStatsDto> getDashboard() {
        log.info("Admin fetching dashboard statistics");

        DashboardStatsDto stats = adminService.getDashboardStats();

        return ResponseEntity.ok(stats);
    }

    /**
     * Get platform metrics (revenue, GMV, etc.)
     * 
     * GET /api/v1/admin/metrics?period=MONTH
     * 
     * Query Parameters:
     * - period: DAY, WEEK, MONTH, YEAR
     * 
     * TODO: Implement AdminService with metrics calculation
     */
    @GetMapping("/metrics")
    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_L1')")
    public ResponseEntity<PlatformMetricsDto> getPlatformMetrics(
            @RequestParam(defaultValue = "MONTH") String period) {
        
        log.info("Admin fetching platform metrics - period: {}", period);

        PlatformMetricsDto metrics = adminService.getPlatformMetrics(period);
        
        return ResponseEntity.ok(metrics);
    }

    // ===========================
    // CONTENT MODERATION
    // ===========================

    /**
     * Get pending product approvals
     * 
     * GET /api/v1/admin/products/pending
     * 
     * TODO: Implement product moderation
     */
    @GetMapping("/products/pending")
    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_L1')")
    public ResponseEntity<String> getPendingProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("Admin fetching pending products for moderation");
        
        // TODO: Implement ProductService with moderation
        
        return ResponseEntity.ok("Pending products - Feature coming soon");
    }

    /**
     * Approve or reject product
     * 
     * POST /api/v1/admin/products/{id}/approve
     * 
     * TODO: Implement product approval workflow
     */
    @PostMapping("/products/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_L1')")
    public ResponseEntity<String> approveProduct(
            @PathVariable Long id,
            @RequestParam boolean approved,
            @RequestParam(required = false) String reason) {
        
        log.info("Admin {} product - ID: {}", approved ? "approving" : "rejecting", id);
        
        // TODO: Implement ProductService moderation
        
        return ResponseEntity.ok("Product moderation - Feature coming soon");
    }

    /**
     * Get flagged reviews for moderation
     * 
     * GET /api/v1/admin/reviews/flagged
     * 
     * TODO: Implement review moderation
     */
    @GetMapping("/reviews/flagged")
    @PreAuthorize("hasAnyRole('ADMIN','ADMIN_L1')")
    public ResponseEntity<String> getFlaggedReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("Admin fetching flagged reviews");
        
        // TODO: Implement ReviewService with flagging
        
        return ResponseEntity.ok("Flagged reviews - Feature coming soon");
    }

    // ===========================
    // VENDOR DOCUMENT VERIFICATION
    // ===========================

    /**
     * Get pending documents for verification
     * 
     * GET /api/v1/admin/vendor-documents/pending?page=0&size=10
     * 
     * Query Parameters:
     * - page: Page number (default: 0)
     * - size: Page size (default: 10)
     * 
     * Response: 200 OK with Page<VendorDocumentDto>
     */
    @GetMapping("/vendor-documents/pending")
    public ResponseEntity<org.springframework.data.domain.Page<com.localcart.dto.vendor.VendorDocumentDto>> getPendingDocuments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        log.info("Admin fetching pending documents for verification");
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        org.springframework.data.domain.Page<com.localcart.dto.vendor.VendorDocumentDto> documents = 
            vendorDocumentService.getPendingDocuments(pageable);
        
        return ResponseEntity.ok(documents);
    }

    /**
     * Get documents for a specific vendor
     * 
     * GET /api/v1/admin/vendors/{vendorId}/documents
     * 
     * Response: 200 OK with List<VendorDocumentDto>
     */
    @GetMapping("/vendors/{vendorId}/documents")
    public ResponseEntity<java.util.List<com.localcart.dto.vendor.VendorDocumentDto>> getVendorDocuments(
            @PathVariable Long vendorId) {
        
        log.info("Admin fetching documents for vendor: {}", vendorId);
        
        // Verify vendor exists
        vendorService.getVendorById(vendorId);
        
        java.util.List<com.localcart.dto.vendor.VendorDocumentDto> documents = 
            vendorDocumentService.getVendorDocuments(vendorId);
        
        return ResponseEntity.ok(documents);
    }

    /**
     * Verify or reject a vendor document
     * 
     * POST /api/v1/admin/vendor-documents/{documentId}/verify
     * 
     * Request Body:
     * {
     *   "documentId": 123,
     *   "verificationStatus": "VERIFIED",  // or "REJECTED"
     *   "verificationComments": "Document is valid and authentic"
     * }
     * 
     * Response: 200 OK with updated VendorDocumentDto
     */
    @PostMapping("/vendor-documents/{documentId}/verify")
    public ResponseEntity<com.localcart.dto.vendor.VendorDocumentDto> verifyDocument(
            @PathVariable Long documentId,
            @Valid @RequestBody com.localcart.dto.admin.VendorDocumentVerificationRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        log.info("Admin {} document ID: {}", 
            request.getVerificationStatus().equals("VERIFIED") ? "verifying" : "rejecting",
            documentId);
        
        Long adminUserId = userDetails.getUserId();
        
        com.localcart.dto.vendor.VendorDocumentDto document = 
            vendorDocumentService.verifyDocument(documentId, request, adminUserId);
        
        return ResponseEntity.ok(document);
    }

    /**
     * Bulk verify documents (quick verification for multiple documents)
     * 
     * POST /api/v1/admin/vendor-documents/bulk-verify
     * 
     * Request Body:
     * {
     *   "documentIds": [1, 2, 3],
     *   "verificationStatus": "VERIFIED",
     *   "verificationComments": "All documents verified"
     * }
     */
    @PostMapping("/vendor-documents/bulk-verify")
    public ResponseEntity<java.util.Map<String, Object>> bulkVerifyDocuments(
            @RequestBody java.util.Map<String, Object> request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        log.info("Admin bulk verifying documents");
        
        Long adminUserId = userDetails.getUserId();
        
        return ResponseEntity.ok(java.util.Map.of(
            "message", "Bulk verification - Feature coming soon",
            "status", "SUCCESS"
        ));
    }

    /**
     * Get vendor verification dashboard
     * 
     * GET /api/v1/admin/vendor-verification/dashboard
     * 
     * Response: 200 OK with statistics about pending vendors and documents
     */
    @GetMapping("/vendor-verification/dashboard")
    public ResponseEntity<java.util.Map<String, Object>> getVendorVerificationDashboard() {
        
        log.info("Admin fetching vendor verification dashboard");
        
        return ResponseEntity.ok(adminService.getVendorVerificationDashboard());
    }
}


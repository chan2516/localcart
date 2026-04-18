package com.localcart.controller;

import com.localcart.dto.product.ProductImageUploadResponse;
import com.localcart.dto.vendor.*;
import com.localcart.entity.enums.VendorStatus;
import com.localcart.entity.enums.VendorDocumentType;
import com.localcart.security.CustomUserDetails;
import com.localcart.service.ProductImageStorageService;
import com.localcart.service.VendorOnboardingStorageService;
import com.localcart.service.VendorService;
import com.localcart.service.VendorDocumentService;
import com.localcart.service.LocationSearchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.*;

/**
 * Vendor Controller
 * 
 * Endpoints for:
 * - Vendor registration and onboarding
 * - Vendor profile management
 * - Vendor dashboard
 * - Public vendor listings
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/vendors")
@RequiredArgsConstructor
public class VendorController {

    private final VendorService vendorService;
    private final VendorDocumentService vendorDocumentService;
    private final LocationSearchService locationSearchService;
    private final ProductImageStorageService productImageStorageService;
    private final VendorOnboardingStorageService vendorOnboardingStorageService;

    /**
     * Register as a vendor (authenticated users)
     * 
     * POST /api/v1/vendors/register
     * 
     * Request Body:
     * {
     *   "businessName": "My Shop",
     *   "description": "Selling quality products",
     *   "businessEmail": "shop@example.com",
     *   "businessPhone": "+1234567890",
     *   "businessAddress": "123 Main St",
     *   "taxId": "TAX123456",
     *   "businessRegistrationNumber": "REG123456",
     *   "businessType": "LLC",
     *   ...
     * }
     * 
     * Response: 201 Created with VendorDto
     */
    @PostMapping("/register")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<VendorDto> registerVendor(
            @Valid @RequestBody VendorRegistrationRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        log.info("Vendor registration request from user: {}", userDetails.getUserId());
        
        VendorDto vendor = vendorService.registerVendor(userDetails.getUserId(), request);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(vendor);
    }

    /**
     * Get my vendor profile (vendor owner)
     * 
     * GET /api/v1/vendors/me
     * 
     * Response: 200 OK with VendorDto
     */
    @GetMapping("/me")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<VendorDto> getMyVendorProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        log.info("Fetching vendor profile for user: {}", userDetails.getUserId());
        
        VendorDto vendor = vendorService.getVendorByUserId(userDetails.getUserId());
        
        return ResponseEntity.ok(vendor);
    }

    /**
     * Update my vendor profile
     * 
     * PUT /api/v1/vendors/me
     * 
     * Request Body: VendorUpdateRequest (all fields optional)
     * Response: 200 OK with updated VendorDto
     */
    @PutMapping("/me")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<VendorDto> updateMyVendorProfile(
            @Valid @RequestBody VendorUpdateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        log.info("Updating vendor profile for user: {}", userDetails.getUserId());
        
        VendorDto myVendor = vendorService.getVendorByUserId(userDetails.getUserId());
        VendorDto updated = vendorService.updateVendor(myVendor.getId(), userDetails.getUserId(), request);
        
        return ResponseEntity.ok(updated);
    }

    /**
     * Get vendor dashboard statistics
     * 
     * GET /api/v1/vendors/me/dashboard
     * 
     * Response: 200 OK with VendorDashboardDto
     */
    @GetMapping("/me/dashboard")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<VendorDashboardDto> getMyDashboard(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        log.info("Fetching dashboard for vendor: {}", userDetails.getVendorId());
        
        VendorDto myVendor = vendorService.getVendorByUserId(userDetails.getUserId());
        VendorDashboardDto dashboard = vendorService.getVendorDashboard(myVendor.getId());
        
        return ResponseEntity.ok(dashboard);
    }

    /**
     * Get vendor by ID (public)
     * 
     * GET /api/v1/vendors/{id}
     * 
     * Response: 200 OK with VendorDto
     */
    @GetMapping("/{id}")
    public ResponseEntity<VendorDto> getVendorById(@PathVariable Long id) {
        log.info("Fetching vendor by ID: {}", id);
        
        VendorDto vendor = vendorService.getVendorById(id);
        
        return ResponseEntity.ok(vendor);
    }

    /**
     * List all approved vendors (public)
     * 
     * GET /api/v1/vendors?page=0&size=10&sort=rating,desc
     * 
     * Query Parameters:
     * - page: Page number (default: 0)
     * - size: Page size (default: 10)
     * - sort: Sort field and direction (default: createdAt,desc)
     * 
     * Response: 200 OK with Page<VendorDto>
     */
    @GetMapping
    public ResponseEntity<Page<VendorDto>> getAllVendors(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {
        
        log.info("Fetching all approved vendors - page: {}, size: {}", page, size);
        
        String[] sortParams = sort.split(",");
        Sort sortObj = Sort.by(Sort.Direction.fromString(sortParams[1]), sortParams[0]);
        Pageable pageable = PageRequest.of(page, size, sortObj);
        
        Page<VendorDto> vendors = vendorService.getAllVendors(VendorStatus.APPROVED, pageable);
        
        return ResponseEntity.ok(vendors);
    }

    /**
     * Search vendors by name (public)
     * 
     * GET /api/v1/vendors/search?q=electronics
     * 
     * TODO: Implement search functionality
     */
    @GetMapping("/search")
    public ResponseEntity<Page<VendorDto>> searchVendors(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        log.info("Searching vendors with query: {}", q);
        
        // TODO: Implement search in VendorService
        Pageable pageable = PageRequest.of(page, size);
        Page<VendorDto> vendors = vendorService.getAllVendors(VendorStatus.APPROVED, pageable);
        
        return ResponseEntity.ok(vendors);
    }

    // ==================== LOCATION-BASED SEARCH ENDPOINTS ====================

    /**
     * Search shops by pincode (location-based)
     * 
     * GET /api/v1/vendors/location/search?pincode=560001
     * 
     * Returns vendors sorted by proximity (nearest first)
     */
    @GetMapping("/location/search")
    public ResponseEntity<java.util.List<VendorDto>> searchByPincode(
            @RequestParam String pincode) {
        
        log.info("Searching vendors by pincode: {}", pincode);
        
        java.util.List<VendorDto> vendors = locationSearchService.searchVendorsByPincodeWithProximity(pincode);
        
        return ResponseEntity.ok(vendors);
    }

    /**
     * Search shops and products by pincode and keyword
     * 
     * GET /api/v1/vendors/location/search-advanced?pincode=560001&keyword=groceries
     */
    @GetMapping("/location/search-advanced")
    public ResponseEntity<java.util.List<VendorDto>> searchByPincodeAndKeyword(
            @RequestParam String pincode,
            @RequestParam String keyword) {
        
        log.info("Searching vendors by pincode: {} and keyword: {}", pincode, keyword);
        
        java.util.List<VendorDto> vendors = locationSearchService.searchVendorsByPincodeAndKeyword(pincode, keyword);
        
        return ResponseEntity.ok(vendors);
    }

    /**
     * Get nearby shops
     * 
     * GET /api/v1/vendors/location/nearby?pincode=560001
     */
    @GetMapping("/location/nearby")
    public ResponseEntity<java.util.List<VendorDto>> getNearbyShops(@RequestParam String pincode) {
        
        log.info("Fetching nearby shops for pincode: {}", pincode);
        
        java.util.List<VendorDto> shops = locationSearchService.getNearbyShops(pincode);
        
        return ResponseEntity.ok(shops);
    }

    // ==================== VENDOR DOCUMENT ENDPOINTS ====================

    /**
     * Upload vendor document
     * 
     * POST /api/v1/vendors/me/documents
     * 
     * Request Body: VendorDocumentUploadRequest
     * Response: 201 Created with VendorDocumentDto
     */
    @PostMapping("/me/documents")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<VendorDocumentDto> uploadDocument(
            @Valid @RequestBody VendorDocumentUploadRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        log.info("Document upload request from vendor user: {}", userDetails.getUserId());
        
        VendorDto myVendor = vendorService.getVendorByUserId(userDetails.getUserId());
        VendorDocumentDto document = vendorDocumentService.uploadDocument(myVendor.getId(), request);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(document);
    }

    /**
     * Get all documents for my vendor
     * 
     * GET /api/v1/vendors/me/documents
     * 
     * Response: 200 OK with List<VendorDocumentDto>
     */
    @GetMapping("/me/documents")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<java.util.List<VendorDocumentDto>> getMyDocuments(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        log.info("Fetching documents for vendor: {}", userDetails.getUserId());
        
        VendorDto myVendor = vendorService.getVendorByUserId(userDetails.getUserId());
        java.util.List<VendorDocumentDto> documents = vendorDocumentService.getVendorDocuments(myVendor.getId());
        
        return ResponseEntity.ok(documents);
    }

    /**
     * Get specific document
     * 
     * GET /api/v1/vendors/me/documents/{documentId}
     */
    @GetMapping("/me/documents/{documentId}")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<VendorDocumentDto> getDocument(
            @PathVariable Long documentId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        log.info("Fetching document: {} for vendor: {}", documentId, userDetails.getUserId());
        
        VendorDocumentDto document = vendorDocumentService.getDocument(documentId);
        
        // Verify ownership
        VendorDto myVendor = vendorService.getVendorByUserId(userDetails.getUserId());
        java.util.List<VendorDocumentDto> myDocuments = vendorDocumentService.getVendorDocuments(myVendor.getId());
        boolean hasAccess = myDocuments.stream().anyMatch(d -> d.getId().equals(documentId));
        
        if (!hasAccess) {
            log.warn("Unauthorized access attempt to document: {} by user: {}", documentId, userDetails.getUserId());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        return ResponseEntity.ok(document);
    }

    /**
     * Delete document (only PENDING documents can be deleted)
     * 
     * DELETE /api/v1/vendors/me/documents/{documentId}
     */
    @DeleteMapping("/me/documents/{documentId}")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable Long documentId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        log.info("Delete document request: {} from vendor: {}", documentId, userDetails.getUserId());
        
        VendorDto myVendor = vendorService.getVendorByUserId(userDetails.getUserId());
        vendorDocumentService.deleteDocument(documentId, myVendor.getId());
        
        return ResponseEntity.noContent().build();
    }

    /**
     * Check if vendor can add items (must be APPROVED)
     * 
     * GET /api/v1/vendors/me/can-add-items
     */
    @GetMapping("/me/can-add-items")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<java.util.Map<String, Object>> canAddItems(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        log.info("Checking if vendor can add items: {}", userDetails.getUserId());
        
        VendorDto myVendor = vendorService.getVendorByUserId(userDetails.getUserId());
        boolean canAdd = vendorService.canAddItems(myVendor.getId());
        boolean allDocumentsVerified = vendorDocumentService.hasAllDocumentsVerified(myVendor.getId());
        long unverifiedCount = vendorDocumentService.getUnverifiedDocumentCount(myVendor.getId());
        
        return ResponseEntity.ok(java.util.Map.of(
            "canAddItems", canAdd,
            "vendorApproved", canAdd,
            "allDocumentsVerified", allDocumentsVerified,
            "unverifiedDocumentCount", unverifiedCount,
            "vendorStatus", myVendor.getStatus()
        ));
    }

    /**
     * Upload product images for the authenticated vendor.
     *
     * POST /api/v1/vendors/me/product-images
     */
    @PostMapping(value = "/me/product-images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<ProductImageUploadResponse> uploadProductImages(
            @RequestPart("files") java.util.List<MultipartFile> files,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        log.info("Uploading {} product image(s) for vendor user: {}", files != null ? files.size() : 0, userDetails.getUserId());

        VendorDto myVendor = vendorService.getVendorByUserId(userDetails.getUserId());
        if (!vendorService.canAddItems(myVendor.getId())) {
            throw new com.localcart.exception.PaymentException("Vendor account is not approved yet", "VENDOR_NOT_APPROVED");
        }

        java.util.List<String> urls = productImageStorageService.uploadProductImages(myVendor.getId(), files);

        return ResponseEntity.status(HttpStatus.CREATED).body(ProductImageUploadResponse.builder()
                .urls(urls)
                .uploadedCount(urls.size())
            .provider("local")
                .build());
    }

    /**
     * Upload an onboarding document before vendor registration is completed.
     *
     * POST /api/v1/vendors/onboarding/documents/upload
     */
    @PostMapping(value = "/onboarding/documents/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<VendorMediaUploadResponse> uploadOnboardingDocument(
            @RequestPart("file") MultipartFile file,
            @RequestParam VendorDocumentType documentType,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        log.info("Uploading onboarding document {} for user {}", documentType, userDetails.getUserId());

        var storedFile = vendorOnboardingStorageService.uploadOnboardingDocument(userDetails.getUserId(), documentType, file);

        return ResponseEntity.status(HttpStatus.CREATED).body(VendorMediaUploadResponse.builder()
                .url(storedFile.url())
                .fileName(storedFile.fileName())
                .mimeType(storedFile.mimeType())
                .provider("local-filesystem")
                .build());
    }

    /**
     * Error response record for consistent error handling
     */
    private record ErrorResponse(String message, String code) {}
}

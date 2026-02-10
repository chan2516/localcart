package com.localcart.controller;

import com.localcart.dto.vendor.*;
import com.localcart.entity.enums.VendorStatus;
import com.localcart.security.CustomUserDetails;
import com.localcart.service.VendorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    /**
     * Error response record for consistent error handling
     */
    private record ErrorResponse(String message, String code) {}
}

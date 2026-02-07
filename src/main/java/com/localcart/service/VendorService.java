package com.localcart.service;

import com.localcart.dto.vendor.*;
import com.localcart.entity.User;
import com.localcart.entity.Vendor;
import com.localcart.entity.Role;
import com.localcart.entity.enums.RoleType;
import com.localcart.entity.enums.VendorStatus;
import com.localcart.exception.PaymentException;
import com.localcart.repository.VendorRepository;
import com.localcart.repository.UserRepository;
import com.localcart.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Vendor Service
 * 
 * Responsibilities:
 * - Vendor registration and onboarding
 * - Vendor profile management
 * - Vendor approval workflow (for admin)
 * - Vendor dashboard statistics
 * - Vendor financial operations
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VendorService {

    private final VendorRepository vendorRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    /**
     * Register a new vendor (user applies to become a vendor)
     * 
     * @param userId User ID of the applicant
     * @param request Vendor registration details
     * @return Vendor DTO
     */
    @Transactional
    public VendorDto registerVendor(Long userId, VendorRegistrationRequest request) {
        log.info("Registering new vendor for user ID: {}", userId);
        
        // Get user
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new PaymentException("User not found", "USER_NOT_FOUND"));
        
        // Check if user already has a vendor account
        if (user.getVendor() != null) {
            throw new PaymentException("User already has a vendor account", "VENDOR_ALREADY_EXISTS");
        }
        
        // Check if business name is unique
        if (vendorRepository.findByBusinessName(request.getBusinessName()).isPresent()) {
            throw new PaymentException("Business name already exists", "BUSINESS_NAME_EXISTS");
        }
        
        // Create vendor entity
        Vendor vendor = Vendor.builder()
            .user(user)
            .businessName(request.getBusinessName())
            .description(request.getDescription())
            .businessEmail(request.getBusinessEmail())
            .businessPhone(request.getBusinessPhone())
            .businessAddress(request.getBusinessAddress())
            .website(request.getWebsite())
            .taxId(request.getTaxId())
            .businessRegistrationNumber(request.getBusinessRegistrationNumber())
            .businessLicense(request.getBusinessLicense())
            .businessType(request.getBusinessType())
            .bankAccountNumber(request.getBankAccountNumber()) // TODO: Encrypt this
            .bankName(request.getBankName())
            .bankBranch(request.getBankBranch())
            .ifscCode(request.getIfscCode())
            .accountHolderName(request.getAccountHolderName())
            .returnAddress(request.getReturnAddress())
            .returnPolicy(request.getReturnPolicy())
            .shippingPolicy(request.getShippingPolicy())
            .status(VendorStatus.PENDING)
            .totalSales(BigDecimal.ZERO)
            .totalOrders(0L)
            .pendingPayout(BigDecimal.ZERO)
            .totalReviews(0)
            .commissionRate(new BigDecimal("15.00")) // Default 15%
            .build();
        
        vendor = vendorRepository.save(vendor);
        
        // Add VENDOR role to user
        Role vendorRole = roleRepository.findByName(RoleType.VENDOR)
            .orElseThrow(() -> new PaymentException("Vendor role not found", "ROLE_NOT_FOUND"));
        user.getRoles().add(vendorRole);
        userRepository.save(user);
        
        log.info("Vendor registration successful. Vendor ID: {}, Status: PENDING", vendor.getId());
        
        return convertToDto(vendor);
    }

    /**
     * Get vendor by ID
     */
    @Transactional(readOnly = true)
    public VendorDto getVendorById(Long vendorId) {
        Vendor vendor = vendorRepository.findById(vendorId)
            .orElseThrow(() -> new PaymentException("Vendor not found", "VENDOR_NOT_FOUND"));
        return convertToDto(vendor);
    }

    /**
     * Get vendor by user ID
     */
    @Transactional(readOnly = true)
    public VendorDto getVendorByUserId(Long userId) {
        Vendor vendor = vendorRepository.findByUserId(userId)
            .orElseThrow(() -> new PaymentException("Vendor not found for this user", "VENDOR_NOT_FOUND"));
        return convertToDto(vendor);
    }

    /**
     * Update vendor profile
     */
    @Transactional
    public VendorDto updateVendor(Long vendorId, Long userId, VendorUpdateRequest request) {
        Vendor vendor = vendorRepository.findById(vendorId)
            .orElseThrow(() -> new PaymentException("Vendor not found", "VENDOR_NOT_FOUND"));
        
        // Verify ownership
        if (!vendor.getUser().getId().equals(userId)) {
            throw new PaymentException("Unauthorized to update this vendor", "UNAUTHORIZED");
        }
        
        // Update fields (optional fields)
        if (request.getBusinessName() != null) {
            // Check uniqueness
            Optional<Vendor> existing = vendorRepository.findByBusinessName(request.getBusinessName());
            if (existing.isPresent() && !existing.get().getId().equals(vendorId)) {
                throw new PaymentException("Business name already exists", "BUSINESS_NAME_EXISTS");
            }
            vendor.setBusinessName(request.getBusinessName());
        }
        if (request.getDescription() != null) vendor.setDescription(request.getDescription());
        if (request.getBusinessEmail() != null) vendor.setBusinessEmail(request.getBusinessEmail());
        if (request.getBusinessPhone() != null) vendor.setBusinessPhone(request.getBusinessPhone());
        if (request.getBusinessAddress() != null) vendor.setBusinessAddress(request.getBusinessAddress());
        if (request.getWebsite() != null) vendor.setWebsite(request.getWebsite());
        if (request.getLogoUrl() != null) vendor.setLogoUrl(request.getLogoUrl());
        if (request.getReturnAddress() != null) vendor.setReturnAddress(request.getReturnAddress());
        if (request.getReturnPolicy() != null) vendor.setReturnPolicy(request.getReturnPolicy());
        if (request.getShippingPolicy() != null) vendor.setShippingPolicy(request.getShippingPolicy());
        if (request.getMinimumOrderValue() != null) vendor.setMinimumOrderValue(request.getMinimumOrderValue());
        if (request.getFreeShippingThreshold() != null) vendor.setFreeShippingThreshold(request.getFreeShippingThreshold());
        
        // Bank details (should require additional verification in production)
        if (request.getBankAccountNumber() != null) vendor.setBankAccountNumber(request.getBankAccountNumber());
        if (request.getBankName() != null) vendor.setBankName(request.getBankName());
        if (request.getBankBranch() != null) vendor.setBankBranch(request.getBankBranch());
        if (request.getIfscCode() != null) vendor.setIfscCode(request.getIfscCode());
        if (request.getAccountHolderName() != null) vendor.setAccountHolderName(request.getAccountHolderName());
        
        vendor = vendorRepository.save(vendor);
        
        log.info("Vendor profile updated. Vendor ID: {}", vendorId);
        
        return convertToDto(vendor);
    }

    /**
     * Approve or reject vendor (Admin only)
     */
    @Transactional
    public VendorDto approveVendor(Long vendorId, Long adminUserId, VendorStatus newStatus, String reason, BigDecimal commissionRate) {
        Vendor vendor = vendorRepository.findById(vendorId)
            .orElseThrow(() -> new PaymentException("Vendor not found", "VENDOR_NOT_FOUND"));
        
        User admin = userRepository.findById(adminUserId)
            .orElseThrow(() -> new PaymentException("Admin user not found", "USER_NOT_FOUND"));
        
        if (newStatus == VendorStatus.APPROVED) {
            vendor.setStatus(VendorStatus.APPROVED);
            vendor.setApprovedAt(LocalDate.now());
            vendor.setApprovedBy(admin);
            vendor.setRejectionReason(null);
            
            if (commissionRate != null) {
                vendor.setCommissionRate(commissionRate);
            }
            
            log.info("Vendor approved. Vendor ID: {}, Approved by: {}", vendorId, adminUserId);
        } else if (newStatus == VendorStatus.REJECTED) {
            vendor.setStatus(VendorStatus.REJECTED);
            vendor.setRejectionReason(reason);
            
            log.info("Vendor rejected. Vendor ID: {}, Reason: {}", vendorId, reason);
        } else if (newStatus == VendorStatus.SUSPENDED) {
            vendor.setStatus(VendorStatus.SUSPENDED);
            vendor.setRejectionReason(reason);
            
            log.info("Vendor suspended. Vendor ID: {}, Reason: {}", vendorId, reason);
        }
        
        vendor = vendorRepository.save(vendor);
        
        return convertToDto(vendor);
    }

    /**
     * Get all vendors (with pagination and filtering)
     */
    @Transactional(readOnly = true)
    public Page<VendorDto> getAllVendors(VendorStatus status, Pageable pageable) {
        Page<Vendor> vendors;
        
        if (status != null) {
            vendors = vendorRepository.findByStatus(status, pageable);
        } else {
            vendors = vendorRepository.findAll(pageable);
        }
        
        return vendors.map(this::convertToDto);
    }

    /**
     * Get pending vendor applications (Admin)
     */
    @Transactional(readOnly = true)
    public Page<VendorDto> getPendingApplications(Pageable pageable) {
        return vendorRepository.findByStatus(VendorStatus.PENDING, pageable)
            .map(this::convertToDto);
    }

    /**
     * Get vendor dashboard statistics
     */
    @Transactional(readOnly = true)
    public VendorDashboardDto getVendorDashboard(Long vendorId) {
        Vendor vendor = vendorRepository.findById(vendorId)
            .orElseThrow(() -> new PaymentException("Vendor not found", "VENDOR_NOT_FOUND"));
        
        // TODO: Implement actual calculations from orders and products
        return VendorDashboardDto.builder()
            .totalSales(vendor.getTotalSales())
            .totalOrders(vendor.getTotalOrders())
            .pendingPayout(vendor.getPendingPayout())
            .lastPayoutAt(vendor.getLastPayoutAt())
            .commissionRate(vendor.getCommissionRate())
            .totalProducts(0L) // TODO: Count from products
            .activeProducts(0L) // TODO: Count from products
            .averageRating(vendor.getRating())
            .totalReviews(vendor.getTotalReviews())
            .build();
    }

    /**
     * Convert Vendor entity to DTO
     */
    private VendorDto convertToDto(Vendor vendor) {
        return VendorDto.builder()
            .id(vendor.getId())
            .userId(vendor.getUser().getId())
            .businessName(vendor.getBusinessName())
            .description(vendor.getDescription())
            .businessEmail(vendor.getBusinessEmail())
            .businessPhone(vendor.getBusinessPhone())
            .businessAddress(vendor.getBusinessAddress())
            .website(vendor.getWebsite())
            .logoUrl(vendor.getLogoUrl())
            .taxId(vendor.getTaxId())
            .businessRegistrationNumber(vendor.getBusinessRegistrationNumber())
            .businessLicense(vendor.getBusinessLicense())
            .businessType(vendor.getBusinessType())
            .status(vendor.getStatus())
            .approvedAt(vendor.getApprovedAt())
            .approvedByName(vendor.getApprovedBy() != null ? 
                vendor.getApprovedBy().getFirstName() + " " + vendor.getApprovedBy().getLastName() : null)
            .rejectionReason(vendor.getRejectionReason())
            .kycVerifiedAt(vendor.getKycVerifiedAt())
            .returnPolicy(vendor.getReturnPolicy())
            .shippingPolicy(vendor.getShippingPolicy())
            .minimumOrderValue(vendor.getMinimumOrderValue())
            .freeShippingThreshold(vendor.getFreeShippingThreshold())
            .rating(vendor.getRating())
            .totalReviews(vendor.getTotalReviews())
            .totalOrders(vendor.getTotalOrders())
            .totalSales(vendor.getTotalSales())
            .commissionRate(vendor.getCommissionRate())
            .pendingPayout(vendor.getPendingPayout())
            .lastPayoutAt(vendor.getLastPayoutAt())
            .createdAt(vendor.getCreatedAt())
            .updatedAt(vendor.getUpdatedAt())
            .build();
    }
}

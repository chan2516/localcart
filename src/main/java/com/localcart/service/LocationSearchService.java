package com.localcart.service;

import com.localcart.dto.product.ProductDto;
import com.localcart.dto.vendor.VendorDto;
import com.localcart.entity.Product;
import com.localcart.entity.ProductImage;
import com.localcart.entity.Vendor;
import com.localcart.entity.enums.VendorStatus;
import com.localcart.repository.ProductRepository;
import com.localcart.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Location-Based Search Service
 * 
 * Responsibilities:
 * - Search vendors by pincode (nearest vendors first)
 * - Search products by location
 * - Proximity-based product recommendations
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LocationSearchService {

    private final VendorRepository vendorRepository;
    private final ProductRepository productRepository;
    private final VendorService vendorService;

    /**
     * Search vendors by pincode
     * Results are ordered by proximity (exact pincode match first)
     */
    @Transactional(readOnly = true)
    public List<VendorDto> searchVendorsByPincode(String userPincode) {
        log.info("Searching vendors by pincode: {}", userPincode);

        // Get exact pincode match first
        List<Vendor> exactMatches = vendorRepository.findApprovedVendorsByPincode(userPincode);
        
        return exactMatches.stream()
            .map(vendor -> {
                VendorDto dto = vendorService.getVendorById(vendor.getId());
                return dto;
            })
            .toList();
    }

    /**
     * Search vendors by pincode with proximity sorting
     * Sorts by pincode distance (nearest first)
     */
    @Transactional(readOnly = true)
    public List<VendorDto> searchVendorsByPincodeWithProximity(String userPincode) {
        log.info("Searching vendors by pincode with proximity: {}", userPincode);

        // Get exact match
        List<Vendor> exactMatches = vendorRepository.findApprovedVendorsByPincode(userPincode);
        
        // Get all approved vendors and sort by pincode proximity
        List<Vendor> allApprovedVendors = vendorRepository.findAllApprovedVendors();

        return allApprovedVendors.stream()
            .sorted((v1, v2) -> {
                // Exact pincode match comes first
                if (v1.getShopPincode().equals(userPincode) && !v2.getShopPincode().equals(userPincode)) {
                    return -1;
                }
                if (!v1.getShopPincode().equals(userPincode) && v2.getShopPincode().equals(userPincode)) {
                    return 1;
                }
                
                // If both are exact match or both are not, sort by pincode numeric distance
                int distance1 = calculatePincodeDistance(userPincode, v1.getShopPincode());
                int distance2 = calculatePincodeDistance(userPincode, v2.getShopPincode());
                return Integer.compare(distance1, distance2);
            })
            .map(vendor -> vendorService.getVendorById(vendor.getId()))
            .toList();
    }

    /**
     * Search vendors by pincode and keyword
     */
    @Transactional(readOnly = true)
    public List<VendorDto> searchVendorsByPincodeAndKeyword(String pincode, String keyword) {
        log.info("Searching vendors by pincode: {} and keyword: {}", pincode, keyword);

        List<Vendor> vendors = vendorRepository.searchByPincodeAndKeyword(pincode, keyword);
        return vendors.stream()
            .map(vendor -> vendorService.getVendorById(vendor.getId()))
            .toList();
    }

    /**
     * Calculate numeric distance between two pincodes
     * This is a simple implementation based on numeric difference
     * In production, you might want to use actual geographic coordinates
     */
    private int calculatePincodeDistance(String pincode1, String pincode2) {
        try {
            int pin1 = Integer.parseInt(pincode1.replaceAll("[^0-9]", ""));
            int pin2 = Integer.parseInt(pincode2.replaceAll("[^0-9]", ""));
            return Math.abs(pin1 - pin2);
        } catch (NumberFormatException e) {
            log.warn("Invalid pincode format: {} or {}", pincode1, pincode2);
            return Integer.MAX_VALUE;
        }
    }

    /**
     * Get nearby shops (all approved vendors in a specific pincode)
     */
    @Transactional(readOnly = true)
    public List<VendorDto> getNearbyShops(String userPincode) {
        return searchVendorsByPincodeWithProximity(userPincode);
    }

    /**
     * Get products from vendors in a specific pincode
     */
    @Transactional(readOnly = true)
    public List<ProductDto> getProductsByPincode(String pincode, int limit) {
        List<Vendor> vendors = vendorRepository.findApprovedVendorsByPincode(pincode);
        
        return vendors.stream()
            .flatMap(vendor -> vendor.getProducts().stream())
            .filter(product -> !product.getIsDeleted())
            .limit(limit)
            .map(this::convertProductToDto)
            .toList();
    }

    /**
     * Search products by pincode and keyword
     */
    @Transactional(readOnly = true)
    public List<ProductDto> searchProductsByPincodeAndKeyword(String pincode, String keyword, int limit) {
        List<Vendor> vendors = vendorRepository.findApprovedVendorsByPincode(pincode);
        
        return vendors.stream()
            .flatMap(vendor -> vendor.getProducts().stream())
            .filter(product -> !product.getIsDeleted() && 
                    (product.getName().toLowerCase().contains(keyword.toLowerCase()) ||
                     product.getDescription().toLowerCase().contains(keyword.toLowerCase())))
            .limit(limit)
            .map(this::convertProductToDto)
            .toList();
    }

    /**
     * Convert Product entity to DTO (basic conversion)
     */
    private ProductDto convertProductToDto(Product product) {
        List<String> imageUrls = product.getImages().stream()
            .map(ProductImage::getImageUrl)
            .toList();

        return ProductDto.builder()
            .id(product.getId())
            .name(product.getName())
            .slug(product.getSlug())
            .description(product.getDescription())
            .price(product.getPrice())
            .vendorId(product.getVendor().getId())
            .vendorName(product.getVendor().getBusinessName())
            .imageUrls(imageUrls)
            .createdAt(product.getCreatedAt() != null ? product.getCreatedAt().toString() : null)
            .updatedAt(product.getUpdatedAt() != null ? product.getUpdatedAt().toString() : null)
            .build();
    }
}

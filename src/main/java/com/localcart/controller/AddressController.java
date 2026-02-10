package com.localcart.controller;

import com.localcart.dto.address.AddressDto;
import com.localcart.dto.address.CreateAddressRequest;
import com.localcart.entity.enums.AddressType;
import com.localcart.exception.PaymentException;
import com.localcart.security.CustomUserDetails;
import com.localcart.service.AddressService;
import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Address Management REST Controller
 * 
 * Endpoints:
 * - GET    /api/v1/addresses           - List user's addresses
 * - GET    /api/v1/addresses/{id}      - Get address details
 * - POST   /api/v1/addresses           - Create new address
 * - PUT    /api/v1/addresses/{id}      - Update address
 * - DELETE /api/v1/addresses/{id}      - Delete address
 * - PATCH  /api/v1/addresses/{id}      - Set as default address
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/addresses")
@RequiredArgsConstructor
@Validated
@PreAuthorize("isAuthenticated()")
public class AddressController {
    
    private final AddressService addressService;
    
    /**
     * GET /api/v1/addresses
     * 
     * List all addresses for current user
     * 
     * Query Parameters:
     * - type: filter by type (BILLING, SHIPPING, BOTH)
     */
    @GetMapping
    public ResponseEntity<?> listAddresses(
            @RequestParam(required = false) String type,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            log.info("Fetching addresses for user: {}, type={}", userDetails.getUserId(), type);
            
            var addressType = type != null && !type.isBlank()
                    ? AddressType.valueOf(type.toUpperCase())
                    : null;
            
            var addresses = (addressType == null
                    ? addressService.getUserAddresses(userDetails.getUserId())
                    : addressService.getUserAddressesByType(userDetails.getUserId(), addressType))
                    .stream()
                    .map(addressService::convertToDto)
                    .toList();
            
            Map<String, Object> response = new HashMap<>();
            response.put("addresses", addresses);
            response.put("totalCount", addresses.size());
            if (addressType != null) {
                response.put("filterType", addressType.toString());
            }
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.error("Invalid address type: {}", type);
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("INVALID_TYPE", "Invalid address type"));
        } catch (Exception e) {
            log.error("Error fetching addresses", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("ERROR", "Failed to fetch addresses"));
        }
    }
    
    /**
     * GET /api/v1/addresses/{id}
     * 
     * Get single address details
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getAddress(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            log.info("Fetching address: {} for user: {}", id, userDetails.getUserId());
            
            var address = addressService.getAddressById(id);
            if (!address.getUser().getId().equals(userDetails.getUserId())) {
                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(new ErrorResponse("FORBIDDEN", "Access denied"));
            }
            
            return ResponseEntity.ok(addressService.convertToDto(address));
            
        } catch (PaymentException e) {
            log.error("Address not found: {}", id);
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("NOT_FOUND", "Address not found"));
        } catch (Exception e) {
            log.error("Error fetching address", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("ERROR", "Failed to fetch address"));
        }
    }
    
    /**
     * POST /api/v1/addresses
     * 
     * Create a new address
     */
    @PostMapping
    public ResponseEntity<?> createAddress(
            @Valid @RequestBody CreateAddressRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            log.info("Creating address for user: {}: {}, {}", userDetails.getUserId(), request.getCity(), request.getCountry());
            
            var address = addressService.createAddress(userDetails.getUserId(), request);
            AddressDto dto = addressService.convertToDto(address);
            
            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(dto);
            
        } catch (PaymentException e) {
            log.error("Address creation error: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getErrorCode(), e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error creating address", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("ERROR", "Address creation failed"));
        }
    }
    
    /**
     * PUT /api/v1/addresses/{id}
     * 
     * Update an address
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateAddress(
            @PathVariable Long id,
            @Valid @RequestBody CreateAddressRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            log.info("Updating address: {} for user: {}", id, userDetails.getUserId());
            
            var address = addressService.updateAddress(id, userDetails.getUserId(), request);
            return ResponseEntity.ok(addressService.convertToDto(address));
            
        } catch (PaymentException e) {
            log.error("Address update error: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getErrorCode(), e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error updating address", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("ERROR", "Address update failed"));
        }
    }
    
    /**
     * DELETE /api/v1/addresses/{id}
     * 
     * Delete an address
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAddress(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            log.info("Deleting address: {} for user: {}", id, userDetails.getUserId());
            
            addressService.deleteAddress(id, userDetails.getUserId());
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Address deleted successfully");
            response.put("addressId", id);
            
            return ResponseEntity.ok(response);
            
        } catch (PaymentException e) {
            log.error("Address deletion error: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getErrorCode(), e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error deleting address", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("ERROR", "Address deletion failed"));
        }
    }
    
    /**
     * PATCH /api/v1/addresses/{id}/set-default
     * 
     * Set an address as default shipping or billing address
     */
    @PatchMapping("/{id}/set-default")
    public ResponseEntity<?> setDefaultAddress(
            @PathVariable Long id,
            @RequestParam String type,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            AddressType addressType = AddressType.valueOf(type.toUpperCase());
            log.info("Setting address {} as default {} for user: {}", id, addressType, userDetails.getUserId());
            
            var address = addressService.setDefaultAddress(id, userDetails.getUserId());
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Default address updated");
            response.put("addressId", id);
            response.put("type", addressType.toString());
            response.put("address", addressService.convertToDto(address));
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.error("Invalid address type: {}", type);
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("INVALID_TYPE", "Invalid address type"));
        } catch (PaymentException e) {
            log.error("Error setting default address: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getErrorCode(), e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error setting default address", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("ERROR", "Failed to set default address"));
        }
    }
    
    /**
     * Error response class for consistent error formatting
     */
    record ErrorResponse(String errorCode, String message) {}
}
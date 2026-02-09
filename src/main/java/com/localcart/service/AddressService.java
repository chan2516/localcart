package com.localcart.service;

import com.localcart.dto.address.AddressDto;
import com.localcart.dto.address.CreateAddressRequest;
import com.localcart.entity.Address;
import com.localcart.entity.User;
import com.localcart.entity.enums.AddressType;
import com.localcart.repository.AddressRepository;
import com.localcart.repository.UserRepository;
import com.localcart.exception.PaymentException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Address Service
 * Handles user addresses: CRUD, defaults
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AddressService {
    
    private final AddressRepository addressRepository;
    private final UserRepository userRepository;
    
    /**
     * Get all addresses for user
     */
    @Transactional(readOnly = true)
    public List<Address> getUserAddresses(Long userId) {
        log.info("Fetching addresses for user: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new PaymentException("User not found", "USER_NOT_FOUND"));
        
        return addressRepository.findByUserIdAndIsDeletedFalse(userId);
    }
    
    /**
     * Get addresses by type
     */
    @Transactional(readOnly = true)
    public List<Address> getUserAddressesByType(Long userId, AddressType type) {
        log.info("Fetching {} addresses for user: {}", type, userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new PaymentException("User not found", "USER_NOT_FOUND"));
        
        return addressRepository.findByUserAndType(user, type);
    }
    
    /**
     * Get address by ID
     */
    @Transactional(readOnly = true)
    public Address getAddressById(Long id) {
        log.info("Fetching address: {}", id);
        return addressRepository.findById(id)
                .orElseThrow(() -> new PaymentException("Address not found", "ADDRESS_NOT_FOUND"));
    }
    
    /**
     * Get default address for user
     */
    @Transactional(readOnly = true)
    public Optional<Address> getDefaultAddress(Long userId) {
        log.info("Fetching default address for user: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new PaymentException("User not found", "USER_NOT_FOUND"));
        
        return addressRepository.findByUserAndIsDefaultTrue(user);
    }
    
    /**
     * Create new address
     */
    public Address createAddress(Long userId, CreateAddressRequest request) {
        log.info("Creating address for user: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new PaymentException("User not found", "USER_NOT_FOUND"));
        
        Address address = Address.builder()
                .user(user)
                .street(request.getStreet())
                .apartment(request.getApartment())
                .city(request.getCity())
                .state(request.getState())
                .country(request.getCountry())
                .zipCode(request.getZipCode())
                .type(AddressType.valueOf(request.getAddressType()))
                .isDefault(request.getIsDefault())
                .build();
        
        // If this is set as default, unset other defaults
        if (request.getIsDefault()) {
            unsetDefaultAddresses(userId);
        }
        
        return addressRepository.save(address);
    }
    
    /**
     * Update address
     */
    public Address updateAddress(Long addressId, Long userId, CreateAddressRequest request) {
        log.info("Updating address: {}", addressId);
        
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new PaymentException("Address not found", "ADDRESS_NOT_FOUND"));
        
        // Verify ownership
        if (!address.getUser().getId().equals(userId)) {
            throw new PaymentException("Address does not belong to this user", "UNAUTHORIZED");
        }
        
        address.setStreet(request.getStreet());
        address.setApartment(request.getApartment());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setCountry(request.getCountry());
        address.setZipCode(request.getZipCode());
        address.setType(AddressType.valueOf(request.getAddressType()));
        
        // If this is set as default, unset other defaults
        if (request.getIsDefault() && !address.getIsDefault()) {
            unsetDefaultAddresses(userId);
            address.setIsDefault(true);
        }
        
        return addressRepository.save(address);
    }
    
    /**
     * Delete address (soft delete)
     */
    public void deleteAddress(Long addressId, Long userId) {
        log.info("Deleting address: {}", addressId);
        
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new PaymentException("Address not found", "ADDRESS_NOT_FOUND"));
        
        // Verify ownership
        if (!address.getUser().getId().equals(userId)) {
            throw new PaymentException("Address does not belong to this user", "UNAUTHORIZED");
        }
        
        // Soft delete
        address.softDelete();
        addressRepository.save(address);
    }
    
    /**
     * Set address as default
     */
    public Address setDefaultAddress(Long addressId, Long userId) {
        log.info("Setting address {} as default for user {}", addressId, userId);
        
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new PaymentException("Address not found", "ADDRESS_NOT_FOUND"));
        
        // Verify ownership
        if (!address.getUser().getId().equals(userId)) {
            throw new PaymentException("Address does not belong to this user", "UNAUTHORIZED");
        }
        
        // Unset all other defaults
        unsetDefaultAddresses(userId);
        
        address.setIsDefault(true);
        return addressRepository.save(address);
    }
    
    /**
     * Unset all default addresses for user
     */
    private void unsetDefaultAddresses(Long userId) {
        List<Address> addresses = addressRepository.findByUserIdAndIsDeletedFalse(userId);
        for (Address addr : addresses) {
            if (addr.getIsDefault()) {
                addr.setIsDefault(false);
                addressRepository.save(addr);
            }
        }
    }
}

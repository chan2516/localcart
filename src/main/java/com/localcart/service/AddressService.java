package com.localcart.service;

import com.localcart.entity.Address;
import com.localcart.entity.User;
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
    public List<Address> getUserAddresses(Long userId) {
        log.info("Fetching addresses for user: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new PaymentException("User not found", "USER_NOT_FOUND"));
        
        return addressRepository.findAll();
    }
    
    /**
     * Get address by ID
     */
    public Optional<Address> getAddressById(Long id) {
        log.info("Fetching address: {}", id);
        return addressRepository.findById(id);
    }
    
    /**
     * Create new address
     */
    public Address createAddress(Long userId, Address address) {
        log.info("Creating address for user: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new PaymentException("User not found", "USER_NOT_FOUND"));
        
        address.setUser(user);
        return addressRepository.save(address);
    }
    
    /**
     * Update address
     */
    public Address updateAddress(Long id, Address addressDetails) {
        log.info("Updating address: {}", id);
        
        return addressRepository.findById(id)
                .map(address -> {
                    address.setStreet(addressDetails.getStreet());
                    address.setApartment(addressDetails.getApartment());
                    address.setCity(addressDetails.getCity());
                    address.setState(addressDetails.getState());
                    address.setCountry(addressDetails.getCountry());
                    address.setZipCode(addressDetails.getZipCode());
                    address.setType(addressDetails.getType());
                    return addressRepository.save(address);
                })
                .orElseThrow(() -> new PaymentException("Address not found", "ADDRESS_NOT_FOUND"));
    }
    
    /**
     * Delete address
     */
    public void deleteAddress(Long id) {
        log.info("Deleting address: {}", id);
        addressRepository.deleteById(id);
    }
    
    /**
     * Set address as default shipping
     */
    public void setDefaultShippingAddress(Long userId, Long addressId) {
        log.info("Setting address {} as default shipping for user {}", addressId, userId);
        // TODO: Implement default address logic
    }
    
    /**
     * Set address as default billing
     */
    public void setDefaultBillingAddress(Long userId, Long addressId) {
        log.info("Setting address {} as default billing for user {}", addressId, userId);
        // TODO: Implement default address logic
    }
}

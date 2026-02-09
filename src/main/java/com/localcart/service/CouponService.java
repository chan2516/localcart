package com.localcart.service;

import com.localcart.entity.Coupon;
import com.localcart.entity.Vendor;
import com.localcart.exception.PaymentException;
import com.localcart.repository.CouponRepository;
import com.localcart.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CouponService {
    
    private final CouponRepository couponRepository;
    private final VendorRepository vendorRepository;
    
    /**
     * Create a new coupon (Vendor only)
     */
    public Coupon createCoupon(Long vendorId, Coupon coupon) {
        log.info("Creating coupon: {} for vendor: {}", coupon.getCode(), vendorId);
        
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new PaymentException("Vendor not found", "VENDOR_NOT_FOUND"));
        
        if (couponRepository.existsByCode(coupon.getCode())) {
            throw new PaymentException("Coupon code already exists", "COUPON_EXISTS");
        }
        
        coupon.setVendor(vendor);
        coupon.setUsageCount(0);
        
        return couponRepository.save(coupon);
    }
    
    /**
     * Validate and apply coupon code
     */
    public BigDecimal applyCoupon(String code, BigDecimal orderAmount) {
        log.info("Applying coupon: {} to order amount: {}", code, orderAmount);
        
        Coupon coupon = couponRepository.findByCode(code)
                .orElseThrow(() -> new PaymentException("Invalid coupon code", "COUPON_INVALID"));
        
        if (!coupon.isValid()) {
            throw new PaymentException("Coupon is not valid or has expired", "COUPON_EXPIRED");
        }
        
        BigDecimal discount = coupon.calculateDiscount(orderAmount);
        
        if (discount.compareTo(BigDecimal.ZERO) == 0) {
            throw new PaymentException("Minimum purchase amount not met", "COUPON_MIN_NOT_MET");
        }
        
        // Increment usage count
        coupon.setUsageCount(coupon.getUsageCount() + 1);
        couponRepository.save(coupon);
        
        log.info("Coupon applied. Discount: {}", discount);
        return discount;
    }
    
    /**
     * Get all coupons for a vendor
     */
    public List<Coupon> getVendorCoupons(Long vendorId) {
        return couponRepository.findByVendorId(vendorId);
    }
    
    /**
     * Deactivate coupon
     */
    public void deactivateCoupon(Long couponId, Long vendorId) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new PaymentException("Coupon not found", "COUPON_NOT_FOUND"));
        
        if (!coupon.getVendor().getId().equals(vendorId)) {
            throw new PaymentException("Unauthorized", "UNAUTHORIZED");
        }
        
        coupon.setIsActive(false);
        couponRepository.save(coupon);
    }
}

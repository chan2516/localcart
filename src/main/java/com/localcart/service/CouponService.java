package com.localcart.service;

import com.localcart.dto.coupon.CouponDto;
import com.localcart.dto.coupon.CreateCouponRequest;
import com.localcart.entity.Coupon;
import com.localcart.entity.Product;
import com.localcart.entity.Vendor;
import com.localcart.exception.PaymentException;
import com.localcart.repository.CouponRepository;
import com.localcart.repository.ProductRepository;
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
    private final ProductRepository productRepository;
    
    /**
     * Create a new coupon (Vendor only)
     */
    public Coupon createCoupon(Long vendorId, CreateCouponRequest request) {
        log.info("Creating coupon: {} for vendor: {}", request.getCode(), vendorId);
        
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new PaymentException("Vendor not found", "VENDOR_NOT_FOUND"));
        
        if (couponRepository.existsByCode(request.getCode())) {
            throw new PaymentException("Coupon code already exists", "COUPON_EXISTS");
        }

        Product product = null;
        if (request.getProductId() != null) {
            product = productRepository.findById(request.getProductId())
                    .orElseThrow(() -> new PaymentException("Product not found", "PRODUCT_NOT_FOUND"));
        }

        Coupon coupon = Coupon.builder()
                .code(request.getCode().trim().toUpperCase())
                .description(request.getDescription())
                .couponType(request.getCouponType())
                .discountValue(request.getDiscountValue())
                .minPurchaseAmount(request.getMinPurchaseAmount())
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .usageLimit(request.getUsageLimit())
                .perUserLimit(request.getPerUserLimit())
                .validFrom(request.getValidFrom())
                .validUntil(request.getValidUntil())
                .product(product)
                .isActive(true)
                .usageCount(0)
                .build();
        
        coupon.setVendor(vendor);
        
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

    public CouponDto toDto(Coupon coupon) {
        return CouponDto.builder()
                .id(coupon.getId())
                .code(coupon.getCode())
                .description(coupon.getDescription())
                .couponType(coupon.getCouponType())
                .discountValue(coupon.getDiscountValue())
                .minPurchaseAmount(coupon.getMinPurchaseAmount())
                .maxDiscountAmount(coupon.getMaxDiscountAmount())
                .usageLimit(coupon.getUsageLimit())
                .usageCount(coupon.getUsageCount())
                .isActive(coupon.getIsActive())
                .vendorId(coupon.getVendor() != null ? coupon.getVendor().getId() : null)
                .productId(coupon.getProduct() != null ? coupon.getProduct().getId() : null)
                .validFrom(coupon.getValidFrom() != null ? coupon.getValidFrom().toString() : null)
                .validUntil(coupon.getValidUntil() != null ? coupon.getValidUntil().toString() : null)
                .build();
    }
}

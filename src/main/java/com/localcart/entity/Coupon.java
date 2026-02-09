package com.localcart.entity;

import com.localcart.entity.base.AuditableEntity;
import com.localcart.entity.enums.CouponType;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupons", indexes = {
    @Index(name = "idx_coupon_code", columnList = "code"),
    @Index(name = "idx_coupon_vendor", columnList = "vendor_id"),
    @Index(name = "idx_coupon_product", columnList = "product_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon extends AuditableEntity {

    @NotBlank
    @Size(max = 50)
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Size(max = 255)
    @Column(length = 255)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "coupon_type", nullable = false, length = 20)
    private CouponType couponType; // PERCENTAGE, FIXED_AMOUNT

    @DecimalMin(value = "0.00")
    @Column(name = "discount_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal discountValue; // 10.00 for 10% or $10

    @DecimalMin(value = "0.00")
    @Column(name = "min_purchase_amount", precision = 10, scale = 2)
    private BigDecimal minPurchaseAmount;

    @DecimalMin(value = "0.00")
    @Column(name = "max_discount_amount", precision = 10, scale = 2)
    private BigDecimal maxDiscountAmount; // For percentage coupons

    @Column(name = "usage_limit")
    private Integer usageLimit; // Total times this coupon can be used

    @Column(name = "usage_count")
    @Builder.Default
    private Integer usageCount = 0;

    @Column(name = "per_user_limit")
    private Integer perUserLimit; // Times each user can use

    @Column(name = "valid_from")
    private LocalDateTime validFrom;

    @Column(name = "valid_until")
    private LocalDateTime validUntil;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    // Vendor who created this coupon
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    // Optional: Coupon for specific product only
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    public boolean isValid() {
        if (!isActive) return false;
        if (usageLimit != null && usageCount >= usageLimit) return false;
        
        LocalDateTime now = LocalDateTime.now();
        if (validFrom != null && now.isBefore(validFrom)) return false;
        if (validUntil != null && now.isAfter(validUntil)) return false;
        
        return true;
    }

    public BigDecimal calculateDiscount(BigDecimal orderAmount) {
        if (!isValid()) return BigDecimal.ZERO;
        if (minPurchaseAmount != null && orderAmount.compareTo(minPurchaseAmount) < 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal discount;
        if (couponType == CouponType.PERCENTAGE) {
            discount = orderAmount.multiply(discountValue).divide(new BigDecimal("100"));
            if (maxDiscountAmount != null && discount.compareTo(maxDiscountAmount) > 0) {
                discount = maxDiscountAmount;
            }
        } else {
            discount = discountValue;
        }

        return discount.compareTo(orderAmount) > 0 ? orderAmount : discount;
    }
}

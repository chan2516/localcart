package com.localcart.repository;

import com.localcart.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {
    
    Optional<Coupon> findByCode(String code);
    
    List<Coupon> findByVendorId(Long vendorId);
    
    @Query("SELECT c FROM Coupon c WHERE c.vendor.id = :vendorId AND c.isActive = true")
    List<Coupon> findActiveByVendorId(Long vendorId);
    
    boolean existsByCode(String code);
}

package com.localcart.repository;

import com.localcart.entity.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, Long> {
    List<Promotion> findByVendorIdOrderByCreatedAtDesc(Long vendorId);
    List<Promotion> findByVendorIdAndIsActiveTrueOrderByCreatedAtDesc(Long vendorId);
}

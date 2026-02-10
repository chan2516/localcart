package com.localcart.repository;

import com.localcart.entity.Vendor;
import com.localcart.entity.enums.VendorStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VendorRepository extends JpaRepository<Vendor, Long> {
    
    Optional<Vendor> findByUserId(Long userId);
    
    Optional<Vendor> findByBusinessName(String businessName);
    
    boolean existsByBusinessName(String businessName);
    
    List<Vendor> findByStatus(VendorStatus status);
    
    Page<Vendor> findByStatus(VendorStatus status, Pageable pageable);
    
    @Query("SELECT v FROM Vendor v WHERE v.status = 'APPROVED' AND v.isDeleted = false")
    List<Vendor> findAllApprovedVendors();
    
    @Query("SELECT v FROM Vendor v WHERE v.status = 'PENDING' ORDER BY v.createdAt ASC")
    List<Vendor> findPendingVendorApplications();

    Long countByStatus(VendorStatus status);
}

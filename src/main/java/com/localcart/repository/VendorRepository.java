package com.localcart.repository;

import com.localcart.entity.Vendor;
import com.localcart.entity.enums.VendorStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    /**
     * Find vendors by exact pincode
     */
    List<Vendor> findByShopPincodeAndStatusOrderByCreatedAtDesc(String shopPincode, VendorStatus status);

    /**
     * Find verified vendors by pincode
     */
    @Query("SELECT v FROM Vendor v WHERE v.shopPincode = :pincode AND v.status = 'APPROVED' AND v.isDeleted = false ORDER BY v.createdAt DESC")
    List<Vendor> findApprovedVendorsByPincode(@Param("pincode") String pincode);

    /**
     * Find vendors with custom search by pincode and keyword
     */
    @Query("SELECT v FROM Vendor v WHERE v.shopPincode = :pincode AND v.status = 'APPROVED' AND v.isDeleted = false AND (LOWER(v.businessName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(v.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) ORDER BY v.createdAt DESC")
    List<Vendor> searchByPincodeAndKeyword(@Param("pincode") String pincode, @Param("keyword") String keyword);

    /**
     * Find approved vendors ordered by name
     */
    @Query("SELECT v FROM Vendor v WHERE v.status = 'APPROVED' AND v.isDeleted = false ORDER BY v.businessName ASC")
    List<Vendor> findAllApprovedVendorsOrderByName();

    /**
     * Find vendors awaiting document verification
     */
    @Query("SELECT DISTINCT v FROM Vendor v JOIN v.documents d WHERE d.verificationStatus = 'PENDING' OR (v.status = 'PENDING' AND v.documents IS EMPTY) ORDER BY v.createdAt ASC")
    Page<Vendor> findVendorsAwaitingDocumentVerification(Pageable pageable);
}

package com.localcart.repository;

import com.localcart.entity.VendorDocument;
import com.localcart.entity.enums.VendorDocumentType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VendorDocumentRepository extends JpaRepository<VendorDocument, Long> {

    /**
     * Find all documents for a vendor
     */
    List<VendorDocument> findByVendorId(Long vendorId);

    /**
     * Find all documents of a specific type for a vendor
     */
    List<VendorDocument> findByVendorIdAndDocumentType(Long vendorId, VendorDocumentType documentType);

    /**
     * Find a specific document by vendor and type
     */
    Optional<VendorDocument> findByVendorIdAndDocumentTypeOrderByCreatedAtDesc(Long vendorId, VendorDocumentType documentType);

    /**
     * Find all documents awaiting verification
     */
    @Query("SELECT vd FROM VendorDocument vd WHERE vd.verificationStatus = 'PENDING' ORDER BY vd.createdAt ASC")
    Page<VendorDocument> findPendingDocuments(Pageable pageable);

    /**
     * Find all documents for a vendor awaiting verification
     */
    List<VendorDocument> findByVendorIdAndVerificationStatus(Long vendorId, String verificationStatus);

    /**
     * Find all verified documents for a vendor
     */
    List<VendorDocument> findByVendorIdAndVerificationStatusAndDocumentType(Long vendorId, String verificationStatus, VendorDocumentType documentType);

    /**
     * Count unverified documents for a vendor
     */
    long countByVendorIdAndVerificationStatus(Long vendorId, String verificationStatus);
}

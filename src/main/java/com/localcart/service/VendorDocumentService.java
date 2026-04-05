package com.localcart.service;

import com.localcart.dto.admin.VendorDocumentVerificationRequest;
import com.localcart.dto.vendor.VendorDocumentDto;
import com.localcart.dto.vendor.VendorDocumentUploadRequest;
import com.localcart.entity.User;
import com.localcart.entity.Vendor;
import com.localcart.entity.VendorDocument;
import com.localcart.entity.enums.VendorDocumentType;
import com.localcart.exception.PaymentException;
import com.localcart.repository.VendorDocumentRepository;
import com.localcart.repository.VendorRepository;
import com.localcart.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Vendor Document Service
 * 
 * Responsibilities:
 * - Document upload management
 * - Document verification (admin)
 * - Document tracking
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VendorDocumentService {

    private final VendorDocumentRepository vendorDocumentRepository;
    private final VendorRepository vendorRepository;
    private final UserRepository userRepository;

    /**
     * Upload a vendor document
     */
    @Transactional
    public VendorDocumentDto uploadDocument(Long vendorId, VendorDocumentUploadRequest request) {
        Vendor vendor = vendorRepository.findById(vendorId)
            .orElseThrow(() -> new PaymentException("Vendor not found", "VENDOR_NOT_FOUND"));

        VendorDocument document = VendorDocument.builder()
            .vendor(vendor)
            .documentType(request.getDocumentType())
            .documentUrl(request.getDocumentUrl())
            .fileName(request.getFileName())
            .mimeType(request.getMimeType())
            .documentNumber(request.getDocumentNumber())
            .expiryDate(request.getExpiryDate())
            .uploadNotes(request.getUploadNotes())
            .verificationStatus("PENDING")
            .build();

        document = vendorDocumentRepository.save(document);

        vendor.getDocuments().add(document);
        vendorRepository.save(vendor);

        log.info("Document uploaded successfully. Document ID: {}, Type: {}, Vendor ID: {}", 
            document.getId(), request.getDocumentType(), vendorId);

        return convertToDto(document);
    }

    /**
     * Get all documents for a vendor
     */
    @Transactional(readOnly = true)
    public List<VendorDocumentDto> getVendorDocuments(Long vendorId) {
        Vendor vendor = vendorRepository.findById(vendorId)
            .orElseThrow(() -> new PaymentException("Vendor not found", "VENDOR_NOT_FOUND"));

        List<VendorDocument> documents = vendorDocumentRepository.findByVendorId(vendorId);
        return documents.stream()
            .map(this::convertToDto)
            .toList();
    }

    /**
     * Get document by ID
     */
    @Transactional(readOnly = true)
    public VendorDocumentDto getDocument(Long documentId) {
        VendorDocument document = vendorDocumentRepository.findById(documentId)
            .orElseThrow(() -> new PaymentException("Document not found", "DOCUMENT_NOT_FOUND"));
        return convertToDto(document);
    }

    /**
     * Get documents of a specific type for a vendor
     */
    @Transactional(readOnly = true)
    public List<VendorDocumentDto> getDocumentsByType(Long vendorId, VendorDocumentType documentType) {
        List<VendorDocument> documents = vendorDocumentRepository.findByVendorIdAndDocumentType(vendorId, documentType);
        return documents.stream()
            .map(this::convertToDto)
            .toList();
    }

    /**
     * Get pending documents for verification (Admin)
     */
    @Transactional(readOnly = true)
    public Page<VendorDocumentDto> getPendingDocuments(Pageable pageable) {
        Page<VendorDocument> documents = vendorDocumentRepository.findPendingDocuments(pageable);
        return documents.map(this::convertToDto);
    }

    /**
     * Verify or reject a document (Admin only)
     */
    @Transactional
    public VendorDocumentDto verifyDocument(Long documentId, VendorDocumentVerificationRequest request, Long adminUserId) {
        VendorDocument document = vendorDocumentRepository.findById(documentId)
            .orElseThrow(() -> new PaymentException("Document not found", "DOCUMENT_NOT_FOUND"));

        User admin = userRepository.findById(adminUserId)
            .orElseThrow(() -> new PaymentException("Admin user not found", "USER_NOT_FOUND"));

        // Validate status
        if (!request.getVerificationStatus().equals("VERIFIED") && !request.getVerificationStatus().equals("REJECTED")) {
           throw new PaymentException("Invalid verification status", "INVALID_STATUS");
        }

        document.setVerificationStatus(request.getVerificationStatus());
        document.setVerificationComments(request.getVerificationComments());
        document.setVerifiedAt(LocalDateTime.now());
        document.setVerifiedBy(admin);

        document = vendorDocumentRepository.save(document);

        log.info("Document verification completed. Document ID: {}, Status: {}", 
            documentId, request.getVerificationStatus());

        return convertToDto(document);
    }

    /**
     * Delete a document
     */
    @Transactional
    public void deleteDocument(Long documentId, Long vendorId) {
        VendorDocument document = vendorDocumentRepository.findById(documentId)
            .orElseThrow(() -> new PaymentException("Document not found", "DOCUMENT_NOT_FOUND"));

        // Verify ownership
        if (!document.getVendor().getId().equals(vendorId)) {
            throw new PaymentException("Unauthorized to delete this document", "UNAUTHORIZED");
        }

        // Only allow deletion of PENDING documents
        if (!document.getVerificationStatus().equals("PENDING")) {
            throw new PaymentException("Cannot delete verified or rejected documents", "CANNOT_DELETE");
        }

        vendorDocumentRepository.deleteById(documentId);
        log.info("Document deleted. Document ID: {}", documentId);
    }

    /**
     * Check if vendor has all required documents verified
     */
    @Transactional(readOnly = true)
    public boolean hasAllDocumentsVerified(Long vendorId) {
        // Required documents for vendor verification
        VendorDocumentType[] requiredDocuments = {
            VendorDocumentType.GSTIN_CERTIFICATE,
            VendorDocumentType.FASSAI_CERTIFICATE,
            VendorDocumentType.SHOP_OWNERSHIP_CERTIFICATE,
            VendorDocumentType.VENDOR_PHOTO,
            VendorDocumentType.VENDOR_SIGNATURE
        };

        for (VendorDocumentType docType : requiredDocuments) {
            List<VendorDocument> docs = vendorDocumentRepository.findByVendorIdAndVerificationStatusAndDocumentType(
                vendorId, "VERIFIED", docType);
            if (docs.isEmpty()) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get unverified document count for a vendor
     */
    @Transactional(readOnly = true)
    public long getUnverifiedDocumentCount(Long vendorId) {
        return vendorDocumentRepository.countByVendorIdAndVerificationStatus(vendorId, "PENDING");
    }

    /**
     * Convert VendorDocument entity to DTO
     */
    private VendorDocumentDto convertToDto(VendorDocument document) {
        return VendorDocumentDto.builder()
            .id(document.getId())
            .documentType(document.getDocumentType())
            .documentUrl(document.getDocumentUrl())
            .fileName(document.getFileName())
            .fileSize(document.getFileSize())
            .mimeType(document.getMimeType())
            .verificationStatus(document.getVerificationStatus())
            .verifiedAt(document.getVerifiedAt())
            .verificationComments(document.getVerificationComments())
            .documentNumber(document.getDocumentNumber())
            .expiryDate(document.getExpiryDate())
            .uploadNotes(document.getUploadNotes())
            .createdAt(document.getCreatedAt())
            .updatedAt(document.getUpdatedAt())
            .build();
    }
}

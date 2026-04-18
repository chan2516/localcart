package com.localcart.service;

import com.localcart.entity.enums.VendorDocumentType;
import com.localcart.exception.PaymentException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class VendorOnboardingStorageService {

    @Value("${storage.local.directory:uploads}")
    private String uploadDirectory;

    @Value("${storage.local.public-base-url:http://127.0.0.1:8080}")
    private String publicBaseUrl;

    public StoredFile uploadOnboardingDocument(Long userId, VendorDocumentType documentType, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new PaymentException("Document file is empty", "INVALID_DOCUMENT_FILE");
        }

        String contentType = file.getContentType();
        if (!isSupportedContentType(documentType, contentType)) {
            throw new PaymentException("Unsupported document type", "INVALID_DOCUMENT_TYPE");
        }

        try {
            String safeDirectory = uploadDirectory == null || uploadDirectory.isBlank() ? "uploads" : uploadDirectory.trim();
            Path targetDirectory = Paths.get(safeDirectory, "vendor-onboarding", String.valueOf(userId), documentType.name().toLowerCase(Locale.ROOT))
                    .toAbsolutePath()
                    .normalize();
            Files.createDirectories(targetDirectory);

            String extension = resolveFileExtension(file);
            String fileName = System.currentTimeMillis() + "-" + UUID.randomUUID().toString().replace("-", "") + extension;
            Path targetFile = targetDirectory.resolve(fileName).normalize();

            if (!targetFile.startsWith(targetDirectory)) {
                throw new PaymentException("Invalid document file path", "INVALID_DOCUMENT_FILE");
            }

            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);

            String relativePath = "/uploads/vendor-onboarding/" + userId + "/" + documentType.name().toLowerCase(Locale.ROOT) + "/" + fileName;
            String url = normalizeBaseUrl(publicBaseUrl) + relativePath;
            return new StoredFile(url, fileName, contentType);
        } catch (IOException e) {
            log.error("Failed to store onboarding document for user {}", userId, e);
            throw new PaymentException("Document upload failed", "DOCUMENT_UPLOAD_FAILED");
        }
    }

    private boolean isSupportedContentType(VendorDocumentType documentType, String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return false;
        }

        String normalized = contentType.toLowerCase(Locale.ROOT);
        boolean imageOnly = documentType == VendorDocumentType.VENDOR_PHOTO || documentType == VendorDocumentType.VENDOR_SIGNATURE;
        if (imageOnly) {
            return normalized.startsWith("image/");
        }

        return normalized.startsWith("image/") || normalized.equals("application/pdf");
    }

    private String resolveFileExtension(MultipartFile file) {
        String originalName = file.getOriginalFilename();
        if (originalName != null) {
            int lastDot = originalName.lastIndexOf('.');
            if (lastDot >= 0 && lastDot < originalName.length() - 1) {
                return originalName.substring(lastDot).toLowerCase(Locale.ROOT);
            }
        }

        String contentType = file.getContentType();
        if (contentType == null) {
            return ".bin";
        }

        return switch (contentType.toLowerCase(Locale.ROOT)) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            case "application/pdf" -> ".pdf";
            default -> ".bin";
        };
    }

    private String normalizeBaseUrl(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }

        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    public record StoredFile(String url, String fileName, String mimeType) {}
}
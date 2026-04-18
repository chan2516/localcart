package com.localcart.service;

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
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductImageStorageService {

    @Value("${storage.local.directory:uploads}")
    private String uploadDirectory;

    @Value("${storage.local.public-base-url:http://127.0.0.1:8080}")
    private String publicBaseUrl;

    public List<String> uploadProductImages(Long vendorId, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return List.of();
        }

        List<String> uploadedUrls = new ArrayList<>();
        for (MultipartFile file : files) {
            uploadedUrls.add(uploadSingleImage(vendorId, file));
        }

        return uploadedUrls;
    }

    private String uploadSingleImage(Long vendorId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new PaymentException("Image file is empty", "INVALID_IMAGE_FILE");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase().startsWith("image/")) {
            throw new PaymentException("Only image files are supported", "INVALID_IMAGE_TYPE");
        }

        try {
            String safeDirectory = uploadDirectory == null || uploadDirectory.isBlank() ? "uploads" : uploadDirectory.trim();
            Path vendorDirectory = Paths.get(safeDirectory, "vendors", String.valueOf(vendorId)).toAbsolutePath().normalize();
            Files.createDirectories(vendorDirectory);

            String extension = resolveFileExtension(file);
            String fileName = System.currentTimeMillis() + "-" + UUID.randomUUID().toString().replace("-", "") + extension;
            Path targetFile = vendorDirectory.resolve(fileName).normalize();

            if (!targetFile.startsWith(vendorDirectory)) {
                throw new PaymentException("Invalid image file path", "INVALID_IMAGE_FILE");
            }

            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);

            String relativePath = "/uploads/vendors/" + vendorId + "/" + fileName;
            return normalizeBaseUrl(publicBaseUrl) + relativePath;
        } catch (IOException e) {
            log.error("Image upload failed for vendor {}", vendorId, e);
            throw new PaymentException("Image upload failed", "IMAGE_UPLOAD_FAILED");
        }
    }

    private String resolveFileExtension(MultipartFile file) {
        String originalName = file.getOriginalFilename();
        if (originalName != null) {
            int lastDot = originalName.lastIndexOf('.');
            if (lastDot >= 0 && lastDot < originalName.length() - 1) {
                return originalName.substring(lastDot).toLowerCase();
            }
        }

        String contentType = file.getContentType();
        if (contentType == null) {
            return ".bin";
        }

        return switch (contentType.toLowerCase()) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> ".bin";
        };
    }

    private String normalizeBaseUrl(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}

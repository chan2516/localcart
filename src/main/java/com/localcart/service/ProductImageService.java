package com.localcart.service;

import com.localcart.entity.Product;
import com.localcart.entity.ProductImage;
import com.localcart.repository.ProductImageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Product Image Service
 * Handles product image management operations
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ProductImageService {
    
    private final ProductImageRepository productImageRepository;
    
    /**
     * Add images to a product from list of URLs
     * First image is marked as primary by default
     */
    public List<ProductImage> addImagesToProduct(Product product, List<String> imageUrls) {
        if (imageUrls == null || imageUrls.isEmpty()) {
            return new ArrayList<>();
        }
        
        log.info("Adding {} images to product {}", imageUrls.size(), product.getId());
        
        List<ProductImage> images = new ArrayList<>();
        
        for (int i = 0; i < imageUrls.size(); i++) {
            ProductImage image = ProductImage.builder()
                    .product(product)
                    .imageUrl(imageUrls.get(i))
                    .isPrimary(i == 0) // First image is primary
                    .displayOrder(i + 1)
                    .build();
            
            images.add(productImageRepository.save(image));
        }
        
        return images;
    }
    
    /**
     * Update product images (replaces all existing images)
     */
    public List<ProductImage> updateProductImages(Product product, List<String> imageUrls) {
        log.info("Updating images for product {}", product.getId());
        
        // Delete existing images
        List<ProductImage> existingImages = productImageRepository.findByProductId(product.getId());
        if (!existingImages.isEmpty()) {
            productImageRepository.deleteAll(existingImages);
        }
        
        // Add new images
        return addImagesToProduct(product, imageUrls);
    }
    
    /**
     * Get all images for a product (ordered by display order)
     */
    @Transactional(readOnly = true)
    public List<ProductImage> getProductImages(Long productId) {
        return productImageRepository.findByProductIdOrderByDisplayOrderAsc(productId);
    }
    
    /**
     * Get primary image for a product
     */
    @Transactional(readOnly = true)
    public Optional<ProductImage> getPrimaryImage(Long productId) {
        return productImageRepository.findByProductIdAndIsPrimaryTrue(productId);
    }
    
    /**
     * Get primary image URL or null
     */
    @Transactional(readOnly = true)
    public String getPrimaryImageUrl(Long productId) {
        return getPrimaryImage(productId)
                .map(ProductImage::getImageUrl)
                .orElse(null);
    }
    
    /**
     * Get all image URLs for a product
     */
    @Transactional(readOnly = true)
    public List<String> getProductImageUrls(Long productId) {
        return getProductImages(productId).stream()
                .map(ProductImage::getImageUrl)
                .toList();
    }
    
    /**
     * Set a specific image as primary
     */
    public void setPrimaryImage(Long productId, Long imageId) {
        log.info("Setting image {} as primary for product {}", imageId, productId);
        
        // Clear existing primary
        productImageRepository.findByProductIdAndIsPrimaryTrue(productId)
                .ifPresent(img -> {
                    img.setIsPrimary(false);
                    productImageRepository.save(img);
                });
        
        // Set new primary
        ProductImage newPrimary = productImageRepository.findById(imageId)
                .orElseThrow(() -> new IllegalArgumentException("Image not found"));
        
        newPrimary.setIsPrimary(true);
        productImageRepository.save(newPrimary);
    }
    
    /**
     * Delete a specific image
     */
    public void deleteImage(Long imageId) {
        log.info("Deleting image {}", imageId);
        productImageRepository.deleteById(imageId);
    }
}

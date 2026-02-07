package com.localcart.dto.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Product Data Transfer Object
 * Used for displaying product details to clients
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductDto {
    
    private Long id;
    private String name;
    private String slug;
    private String description;
    
    private BigDecimal price;
    private BigDecimal discountPrice;
    private Integer stock;
    private String sku;
    
    private Boolean isActive;
    private Boolean isFeatured;
    
    private Double rating;
    private Integer totalReviews;
    private Integer totalSales;
    
    // Vendor info
    private Long vendorId;
    private String vendorName;
    
    // Category info
    private Long categoryId;
    private String categoryName;
    
    // Images
    private List<String> imageUrls;
    
    // Metadata
    private String createdAt;
    private String updatedAt;
}

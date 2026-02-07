package com.localcart.dto.category;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Category Data Transfer Object
 * Used for displaying category information
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryDto {
    
    private Long id;
    private String name;
    private String slug;
    private String description;
    private String imageUrl;
    
    // Parent category for hierarchical categories
    private Long parentCategoryId;
    private String parentCategoryName;
    
    private Integer productCount;
    private Boolean isActive;
    
    private String createdAt;
    private String updatedAt;
}

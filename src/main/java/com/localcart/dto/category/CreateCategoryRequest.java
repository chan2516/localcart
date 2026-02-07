package com.localcart.dto.category;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request object for creating/updating categories
 * Requires admin authentication
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateCategoryRequest {
    
    @NotBlank(message = "Category name is required")
    @Size(min = 2, max = 100, message = "Category name must be between 2 and 100 characters")
    private String name;
    
    @NotBlank(message = "Category slug is required")
    @Size(min = 2, max = 100, message = "Category slug must be between 2 and 100 characters")
    @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "Slug must be lowercase with hyphens only")
    private String slug;
    
    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;
    
    private String imageUrl;
    
    // For hierarchical categories
    private Long parentCategoryId;
    
    @Builder.Default
    private Boolean isActive = true;
}

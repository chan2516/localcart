package com.localcart.dto.product;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request object for creating/updating products
 * Requires vendor authentication
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateProductRequest {
    
    @NotBlank(message = "Product name is required")
    @Size(min = 3, max = 255, message = "Product name must be between 3 and 255 characters")
    private String name;
    
    @NotBlank(message = "Product slug is required")
    @Size(min = 3, max = 255, message = "Product slug must be between 3 and 255 characters")
    @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "Slug must be lowercase with hyphens only")
    private String slug;
    
    @Size(max = 5000, message = "Description cannot exceed 5000 characters")
    private String description;
    
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private BigDecimal price;
    
    @DecimalMin(value = "0.00", message = "Discount price must be 0 or greater")
    private BigDecimal discountPrice;
    
    @NotNull(message = "Stock is required")
    @Min(value = 0, message = "Stock cannot be negative")
    private Integer stock;
    
    @Size(max = 50, message = "SKU cannot exceed 50 characters")
    private String sku;
    
    @NotNull(message = "Category ID is required")
    private Long categoryId;
    
    @Builder.Default
    private Boolean isActive = true;
    
    @Builder.Default
    private Boolean isFeatured = false;
}

package com.localcart.dto.review;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request object for creating product reviews
 * Only verified purchasers can review
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateReviewRequest {
    
    @NotNull(message = "Product ID is required")
    private Long productId;
    
    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be between 1 and 5 stars")
    @Max(value = 5, message = "Rating must be between 1 and 5 stars")
    private Integer rating;
    
    @NotBlank(message = "Review title is required")
    @Size(min = 10, max = 200, message = "Title must be between 10 and 200 characters")
    private String title;
    
    @NotBlank(message = "Review comment is required")
    @Size(min = 20, max = 2000, message = "Comment must be between 20 and 2000 characters")
    private String comment;
}

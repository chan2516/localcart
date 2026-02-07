package com.localcart.dto.review;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Review Data Transfer Object
 * Used for displaying product reviews
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewDto {
    
    private Long id;
    
    // Product info
    private Long productId;
    private String productName;
    
    // User info
    private Long userId;
    private String userName;
    private String userProfileImage;
    
    // Review content
    private Integer rating; // 1-5 stars
    private String title;
    private String comment;
    
    // Helpful count
    private Integer helpfulCount;
    private Boolean isVerifiedPurchase;
    
    // Status
    private Boolean isApproved;
    
    // Timestamps
    private String createdAt;
    private String updatedAt;
}

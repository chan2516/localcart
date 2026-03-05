package com.localcart.service;

import com.localcart.dto.review.CreateReviewRequest;
import com.localcart.dto.review.ReviewDto;
import com.localcart.entity.Order;
import com.localcart.entity.OrderItem;
import com.localcart.entity.Product;
import com.localcart.entity.Review;
import com.localcart.entity.User;
import com.localcart.entity.enums.OrderStatus;
import com.localcart.exception.PaymentException;
import com.localcart.repository.OrderRepository;
import com.localcart.repository.ProductRepository;
import com.localcart.repository.ReviewRepository;
import com.localcart.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    public ReviewDto createReview(Long userId, CreateReviewRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new PaymentException("Product not found", "PRODUCT_NOT_FOUND"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new PaymentException("User not found", "USER_NOT_FOUND"));

        if (reviewRepository.existsByUserIdAndProductId(userId, request.getProductId())) {
            throw new PaymentException("You have already reviewed this product", "REVIEW_EXISTS");
        }

        boolean verifiedPurchase = hasDeliveredPurchaseForProduct(userId, product.getId());
        if (!verifiedPurchase) {
            throw new PaymentException("Only verified purchasers can review this product", "NOT_VERIFIED_PURCHASER");
        }

        Review review = Review.builder()
                .product(product)
                .vendor(product.getVendor())
                .user(user)
                .rating(request.getRating())
                .title(request.getTitle())
                .comment(request.getComment())
                .isVerifiedPurchase(true)
                .build();

        Review saved = reviewRepository.save(review);
        refreshProductRating(product);

        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<ReviewDto> getProductReviews(Long productId, Pageable pageable) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId, pageable)
                .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public Page<ReviewDto> getMyReviews(Long userId, Pageable pageable) {
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toDto);
    }

    public void deleteReview(Long reviewId, Long userId, boolean isAdmin) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new PaymentException("Review not found", "REVIEW_NOT_FOUND"));

        if (!isAdmin && !review.getUser().getId().equals(userId)) {
            throw new PaymentException("Not authorized to delete this review", "UNAUTHORIZED");
        }

        Product product = review.getProduct();
        reviewRepository.delete(review);
        refreshProductRating(product);
    }

    public ReviewDto toDto(Review review) {
        String userName = ((review.getUser().getFirstName() != null ? review.getUser().getFirstName() : "") + " " +
                (review.getUser().getLastName() != null ? review.getUser().getLastName() : "")).trim();

        return ReviewDto.builder()
                .id(review.getId())
                .productId(review.getProduct().getId())
                .productName(review.getProduct().getName())
                .userId(review.getUser().getId())
                .userName(userName)
                .userProfileImage(review.getUser().getProfileImageUrl())
                .rating(review.getRating())
                .title(review.getTitle())
                .comment(review.getComment())
                .helpfulCount(0)
                .isVerifiedPurchase(review.getIsVerifiedPurchase())
                .isApproved(true)
                .createdAt(review.getCreatedAt() != null ? review.getCreatedAt().toString() : null)
                .updatedAt(review.getUpdatedAt() != null ? review.getUpdatedAt().toString() : null)
                .build();
    }

    private boolean hasDeliveredPurchaseForProduct(Long userId, Long productId) {
        List<Order> userOrders = orderRepository.findByUserId(userId);

        return userOrders.stream()
                .filter(order -> order.getStatus() == OrderStatus.DELIVERED)
                .flatMap(order -> order.getItems().stream())
                .map(OrderItem::getProduct)
                .anyMatch(product -> product.getId().equals(productId));
    }

    private void refreshProductRating(Product product) {
        Double average = reviewRepository.getAverageRatingForProduct(product.getId());
        Long total = reviewRepository.countByProductId(product.getId());

        product.setRating(average != null ? average : 0.0);
        product.setTotalReviews(total != null ? total.intValue() : 0);
        productRepository.save(product);
    }
}

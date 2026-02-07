package com.localcart.service;

import com.localcart.entity.Cart;
import com.localcart.entity.CartItem;
import com.localcart.entity.Product;
import com.localcart.entity.User;
import com.localcart.repository.CartRepository;
import com.localcart.repository.ProductRepository;
import com.localcart.repository.UserRepository;
import com.localcart.exception.PaymentException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Cart Service
 * Handles shopping cart operations: add, remove, update, checkout
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CartService {
    
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    
    /**
     * Get or create cart for user
     */
    public Cart getOrCreateCart(Long userId) {
        log.info("Getting or creating cart for user: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new PaymentException("User not found", "USER_NOT_FOUND"));
        
        return cartRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Cart newCart = new Cart();
                    newCart.setUser(user);
                    return cartRepository.save(newCart);
                });
    }
    
    /**
     * Add product to cart
     */
    public Cart addToCart(Long userId, Long productId, Integer quantity) {
        log.info("Adding product {} to cart for user {}: quantity {}", 
                productId, userId, quantity);
        
        Cart cart = getOrCreateCart(userId);
        
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new PaymentException("Product not found", "PRODUCT_NOT_FOUND"));
        
        // Check stock availability
        if (product.getStock() < quantity) {
            throw new PaymentException("Insufficient stock available", "STOCK_ERROR");
        }
        
        // TODO: Implement add to cart logic
        return cart;
    }
    
    /**
     * Remove item from cart
     */
    public Cart removeFromCart(Long userId, Long cartItemId) {
        log.info("Removing cart item {} from user {}'s cart", cartItemId, userId);
        
        Cart cart = getOrCreateCart(userId);
        // TODO: Implement remove logic
        return cart;
    }
    
    /**
     * Update item quantity
     */
    public Cart updateCartItemQuantity(Long userId, Long cartItemId, Integer quantity) {
        log.info("Updating cart item {} quantity to {} for user {}", 
                cartItemId, quantity, userId);
        
        Cart cart = getOrCreateCart(userId);
        // TODO: Implement update quantity logic
        return cart;
    }
    
    /**
     * Clear entire cart
     */
    public void clearCart(Long userId) {
        log.info("Clearing cart for user: {}", userId);
        Cart cart = getOrCreateCart(userId);
        cart.getItems().clear();
        cartRepository.save(cart);
    }
    
    /**
     * Get cart total
     */
    public java.math.BigDecimal getCartTotal(Long userId) {
        log.info("Calculating cart total for user: {}", userId);
        Cart cart = getOrCreateCart(userId);
        // TODO: Implement total calculation
        return java.math.BigDecimal.ZERO;
    }
}

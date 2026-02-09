package com.localcart.service;

import com.localcart.dto.cart.CartDto;
import com.localcart.dto.cart.CartItemDto;
import com.localcart.dto.cart.AddToCartRequest;
import com.localcart.entity.Cart;
import com.localcart.entity.CartItem;
import com.localcart.entity.Product;
import com.localcart.entity.User;
import com.localcart.repository.CartRepository;
import com.localcart.repository.CartItemRepository;
import com.localcart.repository.ProductRepository;
import com.localcart.repository.UserRepository;
import com.localcart.exception.PaymentException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

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
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    
    /**
     * Get or create cart for user
     */
    public Cart getOrCreateCart(Long userId) {
        log.info("Getting or creating cart for user: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new PaymentException("User not found", "USER_NOT_FOUND"));
        
        return cartRepository.findByUserIdWithItems(userId)
                .orElseGet(() -> {
                    Cart newCart = new Cart();
                    newCart.setUser(user);
                    return cartRepository.save(newCart);
                });
    }
    
    /**
     * Add product to cart or update quantity if exists
     */
    public Cart addToCart(Long userId, AddToCartRequest request) {
        log.info("Adding product {} to cart for user {}: quantity {}", 
                request.getProductId(), userId, request.getQuantity());
        
        Cart cart = getOrCreateCart(userId);
        
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new PaymentException("Product not found", "PRODUCT_NOT_FOUND"));
        
        // Check product is active
        if (!product.getIsActive() || product.isDeleted()) {
            throw new PaymentException("Product is not available", "PRODUCT_UNAVAILABLE");
        }
        
        // Check stock availability
        if (product.getStock() < request.getQuantity()) {
            throw new PaymentException("Insufficient stock available. Only " + product.getStock() + " items left", "INSUFFICIENT_STOCK");
        }
        
        // Check if item already in cart
        Optional<CartItem> existingItem = cartItemRepository.findByCartIdAndProductId(cart.getId(), request.getProductId());
        
        if (existingItem.isPresent()) {
            // Update quantity
            CartItem item = existingItem.get();
            int newQuantity = item.getQuantity() + request.getQuantity();
            
            if (product.getStock() < newQuantity) {
                throw new PaymentException("Cannot add more items. Only " + product.getStock() + " items available", "INSUFFICIENT_STOCK");
            }
            
            item.setQuantity(newQuantity);
            cartItemRepository.save(item);
        } else {
            // Create new cart item
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.getQuantity())
                    .build();
            
            cart.getItems().add(newItem);
            cartItemRepository.save(newItem);
        }
        
        return cartRepository.save(cart);
    }
    
    /**
     * Remove item from cart
     */
    public Cart removeFromCart(Long userId, Long cartItemId) {
        log.info("Removing cart item {} from user {}'s cart", cartItemId, userId);
        
        Cart cart = getOrCreateCart(userId);
        
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new PaymentException("Cart item not found", "CART_ITEM_NOT_FOUND"));
        
        // Verify ownership
        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new PaymentException("Cart item does not belong to this user", "UNAUTHORIZED");
        }
        
        cart.getItems().remove(cartItem);
        cartItemRepository.delete(cartItem);
        
        return cartRepository.save(cart);
    }
    
    /**
     * Update item quantity
     */
    public Cart updateCartItemQuantity(Long userId, Long cartItemId, Integer quantity) {
        log.info("Updating cart item {} quantity to {} for user {}", 
                cartItemId, quantity, userId);
        
        if (quantity < 1) {
            throw new PaymentException("Quantity must be at least 1", "INVALID_QUANTITY");
        }
        
        Cart cart = getOrCreateCart(userId);
        
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new PaymentException("Cart item not found", "CART_ITEM_NOT_FOUND"));
        
        // Verify ownership
        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new PaymentException("Cart item does not belong to this user", "UNAUTHORIZED");
        }
        
        // Check stock
        if (cartItem.getProduct().getStock() < quantity) {
            throw new PaymentException("Insufficient stock. Only " + cartItem.getProduct().getStock() + " items available", "INSUFFICIENT_STOCK");
        }
        
        cartItem.setQuantity(quantity);
        cartItemRepository.save(cartItem);
        
        return cartRepository.save(cart);
    }
    
    /**
     * Clear entire cart
     */
    public void clearCart(Long userId) {
        log.info("Clearing cart for user: {}", userId);
        Cart cart = getOrCreateCart(userId);
        cartItemRepository.deleteByCartId(cart.getId());
        cart.getItems().clear();
        cartRepository.save(cart);
    }
    
    /**
     * Get cart total
     */
    @Transactional(readOnly = true)
    public BigDecimal getCartTotal(Long userId) {
        log.info("Calculating cart total for user: {}", userId);
        Cart cart = getOrCreateCart(userId);
        
        return cart.getItems().stream()
                .map(item -> {
                    BigDecimal price = item.getProduct().getDiscountPrice() != null 
                            ? item.getProduct().getDiscountPrice() 
                            : item.getProduct().getPrice();
                    return price.multiply(BigDecimal.valueOf(item.getQuantity()));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    
    /**
     * Get cart with items count
     */
    @Transactional(readOnly = true)
    public CartDto getCartDto(Long userId) {
        log.info("Fetching cart DTO for user: {}", userId);
        Cart cart = getOrCreateCart(userId);
        
        List<CartItemDto> itemDtos = cart.getItems().stream()
                .map(this::convertToCartItemDto)
                .collect(Collectors.toList());
        
        BigDecimal subtotal = getCartTotal(userId);
        
        return CartDto.builder()
                .cartId(cart.getId())
                .userId(userId)
                .items(itemDtos)
                .itemCount(cart.getItems().size())
                .subtotal(subtotal)
                .tax(BigDecimal.ZERO) // Calculated at checkout
                .shippingFee(BigDecimal.ZERO) // Calculated at checkout
                .discount(BigDecimal.ZERO)
                .total(subtotal)
                .isEmptyCart(cart.getItems().isEmpty())
                .build();
    }
    
    /**
     * Convert CartItem to CartItemDto
     */
    private CartItemDto convertToCartItemDto(CartItem item) {
        Product product = item.getProduct();
        BigDecimal price = product.getDiscountPrice() != null ? product.getDiscountPrice() : product.getPrice();
        
        return CartItemDto.builder()
                .id(item.getId())
                .productId(product.getId())
                .productName(product.getName())
                .productSlug(product.getSlug())
                .price(product.getPrice())
                .discountPrice(product.getDiscountPrice())
                .quantity(item.getQuantity())
                .subtotal(price.multiply(BigDecimal.valueOf(item.getQuantity())))
                .availableStock(product.getStock())
                .inStock(product.getStock() > 0)
                .build();
    }
}

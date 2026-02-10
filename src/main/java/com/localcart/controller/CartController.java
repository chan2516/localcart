package com.localcart.controller;

import com.localcart.dto.cart.AddToCartRequest;
import com.localcart.dto.cart.CartDto;
import com.localcart.dto.order.CreateOrderRequest;
import com.localcart.exception.PaymentException;
import com.localcart.security.CustomUserDetails;
import com.localcart.service.CartService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;

/**
 * Shopping Cart Management REST Controller
 * 
 * Endpoints:
 * - GET    /api/v1/cart                 - Get current user's cart
 * - POST   /api/v1/cart/add-item        - Add product to cart
 * - PUT    /api/v1/cart/items/{id}      - Update cart item quantity
 * - DELETE /api/v1/cart/items/{id}      - Remove item from cart
 * - DELETE /api/v1/cart                 - Clear entire cart
 * - POST   /api/v1/cart/checkout        - Convert cart to order
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
@Validated
@PreAuthorize("isAuthenticated()")
public class CartController {
    
    private final CartService cartService;
    
    /**
     * GET /api/v1/cart
     * 
     * Retrieve current user's shopping cart with all items and totals
     */
    @GetMapping
    public ResponseEntity<?> getCart(@AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            log.info("Fetching shopping cart for user: {}", userDetails.getUserId());
            
            CartDto cart = cartService.getCartDto(userDetails.getUserId());
            return ResponseEntity.ok(cart);
            
        } catch (Exception e) {
            log.error("Error fetching cart", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("ERROR", "Failed to fetch cart"));
        }
    }
    
    /**
     * POST /api/v1/cart/add-item
     * 
     * Add a product to cart (or increase quantity if already in cart)
     * 
     * Request Body:
     * {
     *   "productId": 123,
     *   "quantity": 2
     * }
     */
    @PostMapping("/add-item")
    public ResponseEntity<?> addToCart(
            @Valid @RequestBody AddToCartRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            log.info("Adding product {} to cart for user {} with quantity {}", 
                    request.getProductId(), userDetails.getUserId(), request.getQuantity());
            
            cartService.addToCart(userDetails.getUserId(), request);
            CartDto cart = cartService.getCartDto(userDetails.getUserId());
            
            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(cart);
            
        } catch (PaymentException e) {
            log.error("Error adding to cart: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getErrorCode(), e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error adding to cart", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("ERROR", "Failed to add item to cart"));
        }
    }
    
    /**
     * PUT /api/v1/cart/items/{id}
     * 
     * Update quantity of item in cart
     * 
     * Request Body:
     * {
     *   "quantity": 5
     * }
     */
    @PutMapping("/items/{id}")
    public ResponseEntity<?> updateCartItem(
            @PathVariable Long id,
            @RequestParam Integer quantity,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            log.info("Updating cart item {} to quantity {} for user {}", 
                    id, quantity, userDetails.getUserId());
            
            cartService.updateCartItemQuantity(userDetails.getUserId(), id, quantity);
            CartDto cart = cartService.getCartDto(userDetails.getUserId());
            
            return ResponseEntity.ok(cart);
            
        } catch (PaymentException e) {
            log.error("Error updating cart item: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getErrorCode(), e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error updating cart item", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("ERROR", "Failed to update cart item"));
        }
    }
    
    /**
     * DELETE /api/v1/cart/items/{id}
     * 
     * Remove a single item from cart
     */
    @DeleteMapping("/items/{id}")
    public ResponseEntity<?> removeFromCart(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            log.info("Removing cart item {} for user {}", id, userDetails.getUserId());
            
            cartService.removeFromCart(userDetails.getUserId(), id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Item removed from cart");
            response.put("cartItemId", id);
            
            return ResponseEntity.ok(response);
            
        } catch (PaymentException e) {
            log.error("Error removing cart item: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getErrorCode(), e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error removing cart item", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("ERROR", "Failed to remove item from cart"));
        }
    }
    
    /**
     * DELETE /api/v1/cart
     * 
     * Clear entire shopping cart
     */
    @DeleteMapping
    public ResponseEntity<?> clearCart(@AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            log.info("Clearing shopping cart for user: {}", userDetails.getUserId());
            
            cartService.clearCart(userDetails.getUserId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Shopping cart cleared");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error clearing cart", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("ERROR", "Failed to clear cart"));
        }
    }
    
    /**
     * POST /api/v1/cart/checkout
     * 
     * Convert cart items to an order and initiate payment
     * 
     * Request Body:
     * {
     *   "shippingAddressId": 1,
     *   "billingAddressId": 1,
     *   "paymentMethod": "CREDIT_CARD",
     *   "couponCode": "SAVE10",  // optional
     *   "notes": "Please deliver before 5pm"  // optional
     * }
     */
    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@Valid @RequestBody CreateOrderRequest request) {
        try {
            log.info("Processing checkout for current user");
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Checkout coming soon");
            response.put("shippingAddressId", request.getShippingAddressId());
            response.put("paymentMethod", request.getPaymentMethod());
            
            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(response);
            
        } catch (PaymentException e) {
            log.error("Checkout error: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getErrorCode(), e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error during checkout", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("ERROR", "Checkout failed"));
        }
    }
    
    /**
     * Error response class for consistent error formatting
     */
    record ErrorResponse(String errorCode, String message) {}
}

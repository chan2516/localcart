package com.localcart.controller;

import com.localcart.dto.product.CreateProductRequest;
import com.localcart.dto.product.ProductDto;
import com.localcart.entity.Product;
import com.localcart.exception.PaymentException;
import com.localcart.security.CustomUserDetails;
import com.localcart.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.HashMap;
import java.util.Map;

/**
 * Product Management REST Controller
 * 
 * Endpoints:
 * - GET    /api/v1/products              - List all products (paginated)
 * - GET    /api/v1/products/{id}         - Get product details
 * - GET    /api/v1/products/slug/{slug}  - Get product by slug
 * - GET    /api/v1/products/search       - Search products
 * - POST   /api/v1/products              - Create product (vendor only)
 * - PUT    /api/v1/products/{id}         - Update product (vendor only)
 * - DELETE /api/v1/products/{id}         - Delete product (vendor only)
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
@Validated
public class ProductController {
    
    private final ProductService productService;
    
    /**
     * GET /api/v1/products
     * 
     * List all active products with pagination
     * 
     * Query Parameters:
     * - page: 0 (default), pagination page number
     * - size: 20 (default), items per page
     * - sort: "id,desc" (default), sorting criteria
     */
    @GetMapping
    public ResponseEntity<?> listProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            log.info("Fetching products: page={}, size={}", page, size);
            
            Pageable pageable = Pageable.ofSize(size).withPage(page);
            Page<ProductDto> products = productService.getAllActiveProducts(pageable)
                    .map(productService::convertToDto);
            
            Map<String, Object> response = new HashMap<>();
            response.put("products", products.getContent());
            response.put("currentPage", products.getNumber());
            response.put("totalItems", products.getTotalElements());
            response.put("totalPages", products.getTotalPages());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error fetching products", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("ERROR", "Failed to fetch products"));
        }
    }
    
    /**
     * GET /api/v1/products/{id}
     * 
     * Get product details by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getProduct(@PathVariable Long id) {
        try {
            log.info("Fetching product: {}", id);
            
            ProductDto product = productService.convertToDto(productService.getProductById(id));
            return ResponseEntity.ok(product);
            
        } catch (PaymentException e) {
            log.error("Product not found: {}", id);
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getErrorCode(), e.getMessage()));
        } catch (Exception e) {
            log.error("Error fetching product", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("ERROR", "Failed to fetch product"));
        }
    }
    
    /**
     * GET /api/v1/products/slug/{slug}
     * 
     * Get product details by slug (SEO friendly)
     */
    @GetMapping("/slug/{slug:.+}")
    public ResponseEntity<?> getProductBySlug(@PathVariable String slug) {
        try {
            log.info("Fetching product by slug: {}", slug);
            
            ProductDto product = productService.convertToDto(productService.getProductBySlug(slug));
            return ResponseEntity.ok(product);
            
        } catch (PaymentException e) {
            log.error("Product not found with slug: {}", slug);
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getErrorCode(), e.getMessage()));
        } catch (Exception e) {
            log.error("Error fetching product by slug", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("ERROR", "Failed to fetch product"));
        }
    }
    
    /**
     * GET /api/v1/products/search
     * 
     * Search products by keyword, category, price range
     * 
     * Query Parameters:
     * - q: search keyword
     * - category: category ID
     * - minPrice: minimum price
     * - maxPrice: maximum price
     * - vendor: vendor ID
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchProducts(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long category,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            log.info("Searching products: q={}, category={}, minPrice={}, maxPrice={}", 
                    q, category, minPrice, maxPrice);
            
            Pageable pageable = Pageable.ofSize(size).withPage(page);
            Page<ProductDto> products;
            
            if (category != null) {
                products = productService.getProductsByCategory(category, pageable)
                        .map(productService::convertToDto);
            } else if (q != null && !q.isBlank()) {
                products = productService.searchProducts(q, pageable)
                        .map(productService::convertToDto);
            } else {
                products = productService.getAllActiveProducts(pageable)
                        .map(productService::convertToDto);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("products", products.getContent());
            response.put("currentPage", products.getNumber());
            response.put("totalItems", products.getTotalElements());
            response.put("totalPages", products.getTotalPages());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error searching products", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("ERROR", "Search failed"));
        }
    }
    
    /**
     * POST /api/v1/products
     * 
     * Create a new product (VENDOR only)
     */
    @PostMapping
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<?> createProduct(
            @Valid @RequestBody CreateProductRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            log.info("Creating product: {} by vendor: {}", request.getName(), userDetails.getVendorId());
            
            if (userDetails.getVendorId() == null) {
                throw new PaymentException("User is not registered as a vendor", "NOT_A_VENDOR");
            }
            
            Product product = productService.createProduct(userDetails.getVendorId(), request);
            ProductDto productDto = productService.convertToDto(product);
            
            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(productDto);
            
        } catch (PaymentException e) {
            log.error("Product creation error: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getErrorCode(), e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error creating product", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("ERROR", "Product creation failed"));
        }
    }
    
    /**
     * PUT /api/v1/products/{id}
     * 
     * Update product details (VENDOR only)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<?> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody CreateProductRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            log.info("Updating product: {} by vendor: {}", id, userDetails.getVendorId());
            
            if (userDetails.getVendorId() == null) {
                throw new PaymentException("User is not registered as a vendor", "NOT_A_VENDOR");
            }
            
            Product product = productService.updateProduct(id, userDetails.getVendorId(), request);
            ProductDto productDto = productService.convertToDto(product);
            
            return ResponseEntity.ok(productDto);
            
        } catch (PaymentException e) {
            log.error("Product update error: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getErrorCode(), e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error updating product", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("ERROR", "Product update failed"));
        }
    }
    
    /**
     * DELETE /api/v1/products/{id}
     * 
     * Delete/deactivate product (VENDOR only)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<?> deleteProduct(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            log.info("Deleting product: {} by vendor: {}", id, userDetails.getVendorId());
            
            if (userDetails.getVendorId() == null) {
                throw new PaymentException("User is not registered as a vendor", "NOT_A_VENDOR");
            }
            
            productService.deleteProduct(id, userDetails.getVendorId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Product deleted successfully");
            response.put("productId", id);
            
            return ResponseEntity.ok(response);
            
        } catch (PaymentException e) {
            log.error("Product deletion error: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getErrorCode(), e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error deleting product", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("ERROR", "Product deletion failed"));
        }
    }
    
    /**
     * Error response class for consistent error formatting
     */
    record ErrorResponse(String errorCode, String message) {}
}

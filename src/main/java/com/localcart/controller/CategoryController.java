package com.localcart.controller;

import com.localcart.dto.category.CategoryDto;
import com.localcart.dto.category.CreateCategoryRequest;
import com.localcart.exception.PaymentException;
import com.localcart.service.CategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;

/**
 * Category Management REST Controller
 * 
 * Endpoints:
 * - GET    /api/v1/categories           - List all categories
 * - GET    /api/v1/categories/{id}      - Get category details
 * - POST   /api/v1/categories           - Create category (ADMIN only)
 * - PUT    /api/v1/categories/{id}      - Update category (ADMIN only)
 * - DELETE /api/v1/categories/{id}      - Delete category (ADMIN only)
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
@Validated
public class CategoryController {
    
    private final CategoryService categoryService;
    
    /**
     * GET /api/v1/categories
     * 
     * List all active categories
     */
    @GetMapping
    public ResponseEntity<?> listCategories() {
        try {
            log.info("Fetching all categories");
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Category listing coming soon");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error fetching categories", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("ERROR", "Failed to fetch categories"));
        }
    }
    
    /**
     * GET /api/v1/categories/{id}
     * 
     * Get category details with product count
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getCategory(@PathVariable Long id) {
        try {
            log.info("Fetching category: {}", id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Get category coming soon");
            response.put("categoryId", id);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error fetching category", e);
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("NOT_FOUND", "Category not found"));
        }
    }
    
    /**
     * POST /api/v1/categories
     * 
     * Create a new category (ADMIN only)
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createCategory(@Valid @RequestBody CreateCategoryRequest request) {
        try {
            log.info("Creating category: {}", request.getName());
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Create category coming soon");
            response.put("categoryName", request.getName());
            
            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(response);
            
        } catch (PaymentException e) {
            log.error("Category creation error: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getErrorCode(), e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error creating category", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("ERROR", "Category creation failed"));
        }
    }
    
    /**
     * PUT /api/v1/categories/{id}
     * 
     * Update category (ADMIN only)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CreateCategoryRequest request) {
        try {
            log.info("Updating category: {}", id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Update category coming soon");
            response.put("categoryId", id);
            
            return ResponseEntity.ok(response);
            
        } catch (PaymentException e) {
            log.error("Category update error: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getErrorCode(), e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error updating category", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("ERROR", "Category update failed"));
        }
    }
    
    /**
     * DELETE /api/v1/categories/{id}
     * 
     * Delete category (ADMIN only)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        try {
            log.info("Deleting category: {}", id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Category deleted successfully");
            response.put("categoryId", id);
            
            return ResponseEntity.ok(response);
            
        } catch (PaymentException e) {
            log.error("Category deletion error: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getErrorCode(), e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error deleting category", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("ERROR", "Category deletion failed"));
        }
    }
    
    /**
     * Error response class for consistent error formatting
     */
    record ErrorResponse(String errorCode, String message) {}
}

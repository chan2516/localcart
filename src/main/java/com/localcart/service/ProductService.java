package com.localcart.service;

import com.localcart.dto.product.ProductDto;
import com.localcart.dto.product.CreateProductRequest;
import com.localcart.entity.Product;
import com.localcart.entity.Category;
import com.localcart.entity.Vendor;
import com.localcart.exception.PaymentException;
import com.localcart.repository.ProductRepository;
import com.localcart.repository.CategoryRepository;
import com.localcart.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Product Service
 * Handles product catalog operations: CRUD, search, filtering
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ProductService {
    
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final VendorRepository vendorRepository;
    
    /**
     * Get all active products (paginated)
     */
    @Transactional(readOnly = true)
    public Page<Product> getAllActiveProducts(Pageable pageable) {
        log.info("Fetching active products");
        return productRepository.findAllActiveProducts(pageable);
    }
    
    /**
     * Get product by ID
     */
    @Transactional(readOnly = true)
    public Product getProductById(Long id) {
        log.info("Fetching product: {}", id);
        return productRepository.findById(id)
                .orElseThrow(() -> new PaymentException("Product not found", "PRODUCT_NOT_FOUND"));
    }
    
    /**
     * Get product by slug
     */
    @Transactional(readOnly = true)
    public Product getProductBySlug(String slug) {
        log.info("Fetching product by slug: {}", slug);
        return productRepository.findBySlug(slug)
                .orElseThrow(() -> new PaymentException("Product not found", "PRODUCT_NOT_FOUND"));
    }
    
    /**
     * Search products by keyword
     */
    @Transactional(readOnly = true)
    public Page<Product> searchProducts(String query, Pageable pageable) {
        log.info("Searching products: {}", query);
        return productRepository.searchProducts(query, pageable);
    }
    
    /**
     * Get products by category
     */
    @Transactional(readOnly = true)
    public Page<Product> getProductsByCategory(Long categoryId, Pageable pageable) {
        log.info("Fetching products for category: {}", categoryId);
        return productRepository.findByCategoryIdAndActive(categoryId, pageable);
    }
    
    /**
     * Get products by vendor
     */
    @Transactional(readOnly = true)
    public Page<Product> getProductsByVendor(Long vendorId, Pageable pageable) {
        log.info("Fetching products for vendor: {}", vendorId);
        return productRepository.findByVendorIdWithPagination(vendorId, pageable);
    }
    
    /**
     * Create new product (Vendor only)
     */
    public Product createProduct(Long vendorId, CreateProductRequest request) {
        log.info("Creating product: {}", request.getName());
        
        // Verify vendor exists
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new PaymentException("Vendor not found", "VENDOR_NOT_FOUND"));
        
        // Verify category exists
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new PaymentException("Category not found", "CATEGORY_NOT_FOUND"));
        
        // Check slug uniqueness
        if (productRepository.existsBySlug(request.getSlug())) {
            throw new PaymentException("Product slug already exists", "SLUG_EXISTS");
        }
        
        Product product = Product.builder()
                .vendor(vendor)
                .category(category)
                .name(request.getName())
                .slug(request.getSlug())
                .description(request.getDescription())
                .price(request.getPrice())
                .discountPrice(request.getDiscountPrice())
                .stock(request.getStock())
                .sku(request.getSku())
                .isActive(request.getIsActive())
                .isFeatured(request.getIsFeatured())
                .build();
        
        return productRepository.save(product);
    }
    
    /**
     * Update product (Vendor only)
     */
    public Product updateProduct(Long productId, Long vendorId, CreateProductRequest request) {
        log.info("Updating product: {}", productId);
        
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new PaymentException("Product not found", "PRODUCT_NOT_FOUND"));
        
        // Verify ownership
        if (!product.getVendor().getId().equals(vendorId)) {
            throw new PaymentException("Unauthorized to update this product", "UNAUTHORIZED");
        }
        
        // Check slug uniqueness if changed
        if (!product.getSlug().equals(request.getSlug()) && productRepository.existsBySlug(request.getSlug())) {
            throw new PaymentException("Product slug already exists", "SLUG_EXISTS");
        }
        
        // Update category if changed
        if (!product.getCategory().getId().equals(request.getCategoryId())) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new PaymentException("Category not found", "CATEGORY_NOT_FOUND"));
            product.setCategory(category);
        }
        
        product.setName(request.getName());
        product.setSlug(request.getSlug());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setDiscountPrice(request.getDiscountPrice());
        product.setStock(request.getStock());
        product.setSku(request.getSku());
        product.setIsActive(request.getIsActive());
        product.setIsFeatured(request.getIsFeatured());
        
        return productRepository.save(product);
    }
    
    /**
     * Delete/deactivate product (Vendor only)
     */
    public void deleteProduct(Long productId, Long vendorId) {
        log.info("Deleting product: {}", productId);
        
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new PaymentException("Product not found", "PRODUCT_NOT_FOUND"));
        
        // Verify ownership
        if (!product.getVendor().getId().equals(vendorId)) {
            throw new PaymentException("Unauthorized to delete this product", "UNAUTHORIZED");
        }
        
        // Soft delete
        product.softDelete();
        productRepository.save(product);
    }
    
    /**
     * Get featured products
     */
    @Transactional(readOnly = true)
    public List<Product> getFeaturedProducts(int limit) {
        log.info("Fetching featured products, limit: {}", limit);
        return productRepository.findFeaturedProducts(Pageable.ofSize(limit));
    }
}

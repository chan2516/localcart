package com.localcart.service;

import com.localcart.entity.Product;
import com.localcart.repository.ProductRepository;
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
    
    /**
     * Get all active products (paginated)
     */
    public Page<Product> getAllActiveProducts(Pageable pageable) {
        log.info("Fetching active products");
        return productRepository.findAll(pageable);
    }
    
    /**
     * Get product by ID
     */
    public Optional<Product> getProductById(Long id) {
        log.info("Fetching product: {}", id);
        return productRepository.findById(id);
    }
    
    /**
     * Get product by slug
     */
    public Optional<Product> getProductBySlug(String slug) {
        log.info("Fetching product by slug: {}", slug);
        // TODO: Implement when ProductRepository methods are added
        return Optional.empty();
    }
    
    /**
     * Search products by keyword
     */
    public List<Product> searchProducts(String query) {
        log.info("Searching products: {}", query);
        // TODO: Implement search with Elasticsearch or like queries
        return List.of();
    }
    
    /**
     * Create new product (Vendor only)
     */
    public Product createProduct(Product product) {
        log.info("Creating product: {}", product.getName());
        return productRepository.save(product);
    }
    
    /**
     * Update product (Vendor only)
     */
    public Product updateProduct(Long id, Product productDetails) {
        log.info("Updating product: {}", id);
        return productRepository.findById(id)
                .map(product -> {
                    product.setName(productDetails.getName());
                    product.setDescription(productDetails.getDescription());
                    product.setPrice(productDetails.getPrice());
                    product.setStock(productDetails.getStock());
                    return productRepository.save(product);
                })
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }
    
    /**
     * Delete/deactivate product (Vendor only)
     */
    public void deleteProduct(Long id) {
        log.info("Deleting product: {}", id);
        productRepository.deleteById(id);
    }
}

package com.localcart.service;

import com.localcart.dto.category.CategoryDto;
import com.localcart.dto.category.CreateCategoryRequest;
import com.localcart.entity.Category;
import com.localcart.exception.PaymentException;
import com.localcart.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Category Service
 * Handles category operations: CRUD, organization
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CategoryService {
    
    private final CategoryRepository categoryRepository;
    
    /**
     * Get all active categories
     */
    @Transactional(readOnly = true)
    public List<Category> getAllActiveCategories() {
        log.info("Fetching all active categories");
        return categoryRepository.findAll();
    }
    
    /**
     * Get root categories (no parent)
     */
    @Transactional(readOnly = true)
    public List<Category> getRootCategories() {
        log.info("Fetching root categories");
        return categoryRepository.findAllRootCategoriesOrdered();
    }
    
    /**
     * Get subcategories of a parent
     */
    @Transactional(readOnly = true)
    public List<Category> getSubcategories(Long parentId) {
        log.info("Fetching subcategories for parent: {}", parentId);
        return categoryRepository.findByParentId(parentId);
    }
    
    /**
     * Get category by ID
     */
    @Transactional(readOnly = true)
    public Category getCategoryById(Long id) {
        log.info("Fetching category: {}", id);
        return categoryRepository.findById(id)
                .orElseThrow(() -> new PaymentException("Category not found", "CATEGORY_NOT_FOUND"));
    }
    
    /**
     * Get category by slug
     */
    @Transactional(readOnly = true)
    public Category getCategoryBySlug(String slug) {
        log.info("Fetching category by slug: {}", slug);
        return categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new PaymentException("Category not found", "CATEGORY_NOT_FOUND"));
    }
    
    /**
     * Create new category (Admin only)
     */
    public Category createCategory(CreateCategoryRequest request) {
        log.info("Creating category: {}", request.getName());
        
        // Check slug uniqueness
        if (categoryRepository.existsBySlug(request.getSlug())) {
            throw new PaymentException("Category slug already exists", "SLUG_EXISTS");
        }
        
        // Check name uniqueness
        if (categoryRepository.findByName(request.getName()).isPresent()) {
            throw new PaymentException("Category name already exists", "NAME_EXISTS");
        }
        
        Category category = Category.builder()
                .name(request.getName())
                .slug(request.getSlug())
                .description(request.getDescription())
                .build();
        
        // Set parent if provided
        if (request.getParentCategoryId() != null) {
            Category parent = categoryRepository.findById(request.getParentCategoryId())
                    .orElseThrow(() -> new PaymentException("Parent category not found", "PARENT_NOT_FOUND"));
            category.setParent(parent);
        }
        
        return categoryRepository.save(category);
    }
    
    /**
     * Update category (Admin only)
     */
    public Category updateCategory(Long id, CreateCategoryRequest request) {
        log.info("Updating category: {}", id);
        
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new PaymentException("Category not found", "CATEGORY_NOT_FOUND"));
        
        // Check slug uniqueness if changed
        if (!category.getSlug().equals(request.getSlug()) && categoryRepository.existsBySlug(request.getSlug())) {
            throw new PaymentException("Category slug already exists", "SLUG_EXISTS");
        }
        
        // Check name uniqueness if changed
        if (!category.getName().equals(request.getName())) {
            Optional<Category> existingByName = categoryRepository.findByName(request.getName());
            if (existingByName.isPresent() && !existingByName.get().getId().equals(id)) {
                throw new PaymentException("Category name already exists", "NAME_EXISTS");
            }
        }
        
        category.setName(request.getName());
        category.setSlug(request.getSlug());
        category.setDescription(request.getDescription());
        
        // Update parent if provided
        if (request.getParentCategoryId() != null) {
            if (request.getParentCategoryId().equals(id)) {
                throw new PaymentException("Category cannot be its own parent", "INVALID_PARENT");
            }
            
            Category parent = categoryRepository.findById(request.getParentCategoryId())
                    .orElseThrow(() -> new PaymentException("Parent category not found", "PARENT_NOT_FOUND"));
            category.setParent(parent);
        } else {
            category.setParent(null);
        }
        
        return categoryRepository.save(category);
    }
    
    /**
     * Delete category (Admin only)
     */
    public void deleteCategory(Long id) {
        log.info("Deleting category: {}", id);
        
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new PaymentException("Category not found", "CATEGORY_NOT_FOUND"));
        
        // Check if category has products
        if (!category.getProducts().isEmpty()) {
            throw new PaymentException("Cannot delete category with products. Move products first.", "CATEGORY_HAS_PRODUCTS");
        }
        
        // Check if category has subcategories
        if (!category.getSubcategories().isEmpty()) {
            throw new PaymentException("Cannot delete category with subcategories", "HAS_SUBCATEGORIES");
        }
        
        categoryRepository.delete(category);
    }
}

package com.localcart.service;

import com.localcart.entity.Category;
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
    public List<Category> getAllActiveCategories() {
        log.info("Fetching all active categories");
        return categoryRepository.findAll();
    }
    
    /**
     * Get category by ID
     */
    public Optional<Category> getCategoryById(Long id) {
        log.info("Fetching category: {}", id);
        return categoryRepository.findById(id);
    }
    
    /**
     * Create new category (Admin only)
     */
    public Category createCategory(Category category) {
        log.info("Creating category: {}", category.getName());
        return categoryRepository.save(category);
    }
    
    /**
     * Update category (Admin only)
     */
    public Category updateCategory(Long id, Category categoryDetails) {
        log.info("Updating category: {}", id);
        return categoryRepository.findById(id)
                .map(category -> {
                    category.setName(categoryDetails.getName());
                    category.setDescription(categoryDetails.getDescription());
                    return categoryRepository.save(category);
                })
                .orElseThrow(() -> new RuntimeException("Category not found"));
    }
    
    /**
     * Delete category (Admin only)
     */
    public void deleteCategory(Long id) {
        log.info("Deleting category: {}", id);
        categoryRepository.deleteById(id);
    }
}

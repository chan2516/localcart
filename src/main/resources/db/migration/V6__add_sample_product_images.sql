-- V6__add_sample_product_images.sql
-- Add sample product images for demonstration

-- Note: In production, these would be actual image URLs
-- Using placeholder image service for demo purposes

-- Sample product images (assuming we have products with IDs 1-5 from seed data)
-- We'll add multiple images per product to demonstrate the feature

-- Product 1 images
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, display_order, is_deleted, created_at, updated_at)
VALUES 
    (1, 'https://placehold.co/600x400/0066cc/ffffff?text=Product+1+Main', 'Product 1 main image', TRUE, 1, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (1, 'https://placehold.co/600x400/0099ff/ffffff?text=Product+1+View+2', 'Product 1 second view', FALSE, 2, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (1, 'https://placehold.co/600x400/00ccff/ffffff?text=Product+1+View+3', 'Product 1 third view', FALSE, 3, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Product 2 images
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, display_order, is_deleted, created_at, updated_at)
VALUES 
    (2, 'https://placehold.co/600x400/cc6600/ffffff?text=Product+2+Main', 'Product 2 main image', TRUE, 1, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (2, 'https://placehold.co/600x400/ff9900/ffffff?text=Product+2+View+2', 'Product 2 second view', FALSE, 2, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Product 3 images
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, display_order, is_deleted, created_at, updated_at)
VALUES 
    (3, 'https://placehold.co/600x400/009966/ffffff?text=Product+3+Main', 'Product 3 main image', TRUE, 1, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (3, 'https://placehold.co/600x400/00cc99/ffffff?text=Product+3+View+2', 'Product 3 second view', FALSE, 2, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (3, 'https://placehold.co/600x400/00ff99/ffffff?text=Product+3+View+3', 'Product 3 third view', FALSE, 3, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (3, 'https://placehold.co/600x400/66ffcc/ffffff?text=Product+3+View+4', 'Product 3 fourth view', FALSE, 4, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Product 4 images
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, display_order, is_deleted, created_at, updated_at)
VALUES 
    (4, 'https://placehold.co/600x400/cc0066/ffffff?text=Product+4+Main', 'Product 4 main image', TRUE, 1, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Product 5 images
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, display_order, is_deleted, created_at, updated_at)
VALUES 
    (5, 'https://placehold.co/600x400/6600cc/ffffff?text=Product+5+Main', 'Product 5 main image', TRUE, 1, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (5, 'https://placehold.co/600x400/9900ff/ffffff?text=Product+5+View+2', 'Product 5 second view', FALSE, 2, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Note: Replace these placeholder URLs with actual product images in production
-- You can use image hosting services like:
-- - Amazon S3
-- - Cloudinary
-- - Your own CDN
-- - Or store base64 encoded images in the database (not recommended for large images)

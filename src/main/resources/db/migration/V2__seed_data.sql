-- V2__seed_data.sql
-- Seed initial data for LocalCart platform

-- Insert default roles
INSERT INTO roles (name, description) VALUES
    ('CUSTOMER', 'Regular customer who can browse and purchase products'),
    ('VENDOR', 'Vendor who can list and sell products'),
    ('ADMIN', 'Platform administrator with full access');

-- Insert root categories
INSERT INTO categories (name, slug, description, parent_id, display_order) VALUES
    ('Electronics', 'electronics', 'Electronic devices and accessories', NULL, 1),
    ('Fashion', 'fashion', 'Clothing, shoes, and accessories', NULL, 2),
    ('Home & Kitchen', 'home-kitchen', 'Home appliances and kitchen essentials', NULL, 3),
    ('Beauty & Personal Care', 'beauty-personal-care', 'Beauty products and personal care items', NULL, 4),
    ('Sports & Outdoors', 'sports-outdoors', 'Sports equipment and outdoor gear', NULL, 5),
    ('Books & Media', 'books-media', 'Books, music, movies, and more', NULL, 6),
    ('Toys & Games', 'toys-games', 'Toys, games, and hobby items', NULL, 7),
    ('Food & Beverages', 'food-beverages', 'Food items and beverages', NULL, 8),
    ('Health & Wellness', 'health-wellness', 'Health and wellness products', NULL, 9),
    ('Automotive', 'automotive', 'Auto parts and accessories', NULL, 10);

-- Insert subcategories for Electronics
INSERT INTO categories (name, slug, description, parent_id, display_order) VALUES
    ('Mobile Phones', 'mobile-phones', 'Smartphones and accessories', (SELECT id FROM categories WHERE slug = 'electronics'), 1),
    ('Laptops & Computers', 'laptops-computers', 'Laptops, desktops, and computer accessories', (SELECT id FROM categories WHERE slug = 'electronics'), 2),
    ('Audio & Headphones', 'audio-headphones', 'Headphones, speakers, and audio equipment', (SELECT id FROM categories WHERE slug = 'electronics'), 3),
    ('Cameras & Photography', 'cameras-photography', 'Cameras and photography equipment', (SELECT id FROM categories WHERE slug = 'electronics'), 4);

-- Insert subcategories for Fashion
INSERT INTO categories (name, slug, description, parent_id, display_order) VALUES
    ('Men''s Clothing', 'mens-clothing', 'Clothing for men', (SELECT id FROM categories WHERE slug = 'fashion'), 1),
    ('Women''s Clothing', 'womens-clothing', 'Clothing for women', (SELECT id FROM categories WHERE slug = 'fashion'), 2),
    ('Shoes', 'shoes', 'Footwear for all', (SELECT id FROM categories WHERE slug = 'fashion'), 3),
    ('Accessories', 'accessories', 'Fashion accessories', (SELECT id FROM categories WHERE slug = 'fashion'), 4);

-- Insert subcategories for Home & Kitchen
INSERT INTO categories (name, slug, description, parent_id, display_order) VALUES
    ('Kitchen Appliances', 'kitchen-appliances', 'Appliances for the kitchen', (SELECT id FROM categories WHERE slug = 'home-kitchen'), 1),
    ('Home Decor', 'home-decor', 'Decorative items for home', (SELECT id FROM categories WHERE slug = 'home-kitchen'), 2),
    ('Furniture', 'furniture', 'Furniture for home and office', (SELECT id FROM categories WHERE slug = 'home-kitchen'), 3),
    ('Bedding & Bath', 'bedding-bath', 'Bedding and bathroom essentials', (SELECT id FROM categories WHERE slug = 'home-kitchen'), 4);

-- Insert an admin user (password: Admin@123 - should be changed in production)
-- Note: This is a bcrypt hash for 'Admin@123'
INSERT INTO users (email, password, first_name, last_name, phone_number, is_active, is_email_verified)
VALUES ('admin@localcart.com', '$2a$10$7Xz7eVhX.3YG8rB1YxQ5Qe3fKZR5vV8vG5F9YQ5zG5N8wV5xQ5G5K', 
        'Admin', 'User', '+1234567890', TRUE, TRUE);

-- Assign admin role to admin user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'admin@localcart.com' AND r.name = 'ADMIN';

-- Insert a demo customer (password: Customer@123)
INSERT INTO users (email, password, first_name, last_name, phone_number, is_active, is_email_verified)
VALUES ('customer@demo.com', '$2a$10$7Xz7eVhX.3YG8rB1YxQ5Qe3fKZR5vV8vG5F9YQ5zG5N8wV5xQ5G5K',
        'Demo', 'Customer', '+1234567891', TRUE, TRUE);

-- Assign customer role
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'customer@demo.com' AND r.name = 'CUSTOMER';

-- Create a cart for the demo customer
INSERT INTO carts (user_id)
SELECT id FROM users WHERE email = 'customer@demo.com';

-- Insert demo customer address
INSERT INTO addresses (user_id, type, street, apartment, city, state, zip_code, country, is_default)
SELECT id, 'SHIPPING', '123 Main Street', 'Apt 4B', 'New York', 'NY', '10001', 'USA', TRUE
FROM users WHERE email = 'customer@demo.com';

-- Insert a demo vendor user (password: Vendor@123)
INSERT INTO users (email, password, first_name, last_name, phone_number, is_active, is_email_verified)
VALUES ('vendor@demo.com', '$2a$10$7Xz7eVhX.3YG8rB1YxQ5Qe3fKZR5vV8vG5F9YQ5zG5N8wV5xQ5G5K',
        'Demo', 'Vendor', '+1234567892', TRUE, TRUE);

-- Assign vendor and customer roles to vendor user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'vendor@demo.com' AND r.name IN ('VENDOR', 'CUSTOMER');

-- Create vendor profile
INSERT INTO vendors (user_id, business_name, description, business_phone, business_address, status, approved_at, approved_by)
SELECT 
    u.id, 
    'Demo Electronics Store', 
    'Your trusted source for quality electronics and gadgets',
    '+1234567892',
    '456 Commerce Ave, New York, NY 10002',
    'APPROVED',
    CURRENT_DATE,
    (SELECT id FROM users WHERE email = 'admin@localcart.com')
FROM users u
WHERE u.email = 'vendor@demo.com';

-- Note: Demo passwords (Admin@123, Customer@123, Vendor@123) should be changed in production
-- These are bcrypt-hashed versions for development/testing purposes only

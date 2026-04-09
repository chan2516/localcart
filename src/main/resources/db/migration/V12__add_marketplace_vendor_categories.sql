-- V12__add_marketplace_vendor_categories.sql
-- Add common vendor-facing marketplace categories used by the product form.

INSERT INTO categories (name, slug, description, parent_id, display_order)
VALUES
    ('Dairy & Staples', 'dairy-staples', 'Milk, curd, staples, and daily essentials', NULL, 11),
    ('Kirana & Groceries', 'kirana-groceries', 'Daily grocery and neighborhood store items', NULL, 12)
ON CONFLICT (slug) DO NOTHING;
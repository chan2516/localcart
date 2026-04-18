-- Ensure vendor catalog categories required by current vendor product flow
-- These are the only categories exposed in vendor add-product UI.

INSERT INTO categories (name, slug, description, parent_id, display_order, is_deleted, deleted_at)
VALUES
    ('Electronics', 'electronics', 'Electronics products', NULL, 1, FALSE, NULL),
    ('Toys', 'toys', 'Toys products', NULL, 2, FALSE, NULL),
    ('Hardware', 'hardware', 'Hardware products', NULL, 3, FALSE, NULL),
    ('Clothes', 'clothes', 'Clothes products', NULL, 4, FALSE, NULL),
    ('Kirana Items', 'kirana-items', 'Kirana items products', NULL, 5, FALSE, NULL)
ON CONFLICT (slug) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    parent_id = NULL,
    display_order = EXCLUDED.display_order,
    is_deleted = FALSE,
    deleted_at = NULL;

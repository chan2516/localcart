-- V8__admin_levels_and_contact_info.sql
-- Add level-based admin roles and editable contact information storage

INSERT INTO roles (name, description)
SELECT 'ADMIN_L1', 'Level-1 administrator with full platform and developer access'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ADMIN_L1');

INSERT INTO roles (name, description)
SELECT 'ADMIN_L2', 'Level-2 administrator with dashboard user/vendor management access'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ADMIN_L2');

CREATE TABLE IF NOT EXISTS site_contact_info (
    id BIGINT PRIMARY KEY,
    support_email VARCHAR(100) NOT NULL,
    support_phone VARCHAR(30) NOT NULL,
    support_address VARCHAR(255) NOT NULL,
    support_hours VARCHAR(120) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

INSERT INTO site_contact_info (id, support_email, support_phone, support_address, support_hours)
SELECT 1, 'support@localcart.com', '+1-800-LOCALCART', 'LocalCart Support Center', 'Mon-Sat, 9:00 AM - 6:00 PM'
WHERE NOT EXISTS (SELECT 1 FROM site_contact_info WHERE id = 1);

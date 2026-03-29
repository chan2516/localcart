-- V10__fix_roles_constraint_for_admin_levels.sql
-- Ensure roles check constraint allows admin hierarchy values.

DO $$
DECLARE existing_constraint TEXT;
BEGIN
    SELECT conname
    INTO existing_constraint
    FROM pg_constraint
    WHERE conrelid = 'roles'::regclass
      AND contype = 'c'
      AND conname = 'roles_name_check'
    LIMIT 1;

    IF existing_constraint IS NOT NULL THEN
        EXECUTE format('ALTER TABLE roles DROP CONSTRAINT %I', existing_constraint);
    END IF;
END $$;

ALTER TABLE roles
    ADD CONSTRAINT roles_name_check
    CHECK (name IN ('CUSTOMER', 'VENDOR', 'ADMIN', 'ADMIN_L1', 'ADMIN_L2'));

INSERT INTO roles (name, description)
SELECT 'ADMIN_L1', 'Level-1 administrator with full platform and developer access'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ADMIN_L1');

INSERT INTO roles (name, description)
SELECT 'ADMIN_L2', 'Level-2 administrator with dashboard user/vendor management access'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ADMIN_L2');

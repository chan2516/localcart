package com.localcart.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class RoleConstraintInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            updateRoleNameConstraint();
            seedAdminLevelRoles();
            log.info("Role constraint and admin level role initialization completed");
        } catch (Exception ex) {
            log.error("Failed to initialize role constraints/seed data", ex);
        }
    }

    private void updateRoleNameConstraint() {
        jdbcTemplate.execute("""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conrelid = 'roles'::regclass
                      AND conname = 'roles_name_check'
                ) THEN
                    ALTER TABLE roles DROP CONSTRAINT roles_name_check;
                END IF;
            END $$;
            """);

        jdbcTemplate.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conrelid = 'roles'::regclass
                      AND conname = 'roles_name_check'
                ) THEN
                    ALTER TABLE roles
                        ADD CONSTRAINT roles_name_check
                        CHECK (name IN ('CUSTOMER', 'VENDOR', 'ADMIN', 'ADMIN_L1', 'ADMIN_L2'));
                END IF;
            END $$;
            """);
    }

    private void seedAdminLevelRoles() {
        jdbcTemplate.execute("""
            INSERT INTO roles (name, description, is_deleted, created_at, updated_at, created_by, updated_by)
            SELECT 'ADMIN_L1',
                   'Level-1 administrator with full platform and developer access',
                   FALSE,
                   NOW(),
                   NOW(),
                   'SYSTEM',
                   'SYSTEM'
            WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ADMIN_L1');
            """);

        jdbcTemplate.execute("""
            INSERT INTO roles (name, description, is_deleted, created_at, updated_at, created_by, updated_by)
            SELECT 'ADMIN_L2',
                   'Second-level administrator with dashboard management access',
                   FALSE,
                   NOW(),
                   NOW(),
                   'SYSTEM',
                   'SYSTEM'
            WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ADMIN_L2');
            """);
    }
}

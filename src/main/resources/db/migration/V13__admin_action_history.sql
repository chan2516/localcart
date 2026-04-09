-- V13__admin_action_history.sql
-- Persist admin approve/reject/delete activity for users and vendors.

CREATE TABLE IF NOT EXISTS admin_action_history (
    id BIGSERIAL PRIMARY KEY,
    deleted_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    target_type VARCHAR(20) NOT NULL,
    target_id BIGINT NOT NULL,
    target_label VARCHAR(200),
    action_type VARCHAR(20) NOT NULL,
    reason VARCHAR(500),
    admin_user_id BIGINT NOT NULL,
    admin_name VARCHAR(150),
    admin_email VARCHAR(150)
);

CREATE INDEX IF NOT EXISTS idx_admin_action_history_target
    ON admin_action_history(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_admin_action_history_action
    ON admin_action_history(action_type);

CREATE INDEX IF NOT EXISTS idx_admin_action_history_created_at
    ON admin_action_history(created_at DESC);

ALTER TABLE admin_action_history
    ADD CONSTRAINT fk_admin_action_history_admin_user
    FOREIGN KEY (admin_user_id) REFERENCES users(id);
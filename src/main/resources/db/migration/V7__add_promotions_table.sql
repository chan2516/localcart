CREATE TABLE promotions (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    vendor_id BIGINT NOT NULL,
    promotion_type VARCHAR(20) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(1000),
    code VARCHAR(50),
    value_text VARCHAR(100),
    starts_at TIMESTAMP,
    ends_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    CONSTRAINT fk_promotions_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id)
);

CREATE INDEX idx_promotion_vendor ON promotions(vendor_id);
CREATE INDEX idx_promotion_type ON promotions(promotion_type);
CREATE INDEX idx_promotion_active ON promotions(is_active);
CREATE INDEX idx_promotion_code ON promotions(code);

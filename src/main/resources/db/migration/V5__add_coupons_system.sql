-- Migration V5: Add Coupons System
-- Date: 2026-02-09
-- Description: Add coupon/discount code system for vendors

CREATE TABLE IF NOT EXISTS coupons (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    coupon_type VARCHAR(20) NOT NULL CHECK (coupon_type IN ('PERCENTAGE', 'FIXED_AMOUNT')),
    discount_value DECIMAL(10,2) NOT NULL,
    min_purchase_amount DECIMAL(10,2),
    max_discount_amount DECIMAL(10,2),
    usage_limit INTEGER,
    usage_count INTEGER NOT NULL DEFAULT 0,
    per_user_limit INTEGER,
    valid_from TIMESTAMP,
    valid_until TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT true,
    vendor_id BIGINT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_coupon_code ON coupons(code);
CREATE INDEX idx_coupon_vendor ON coupons(vendor_id);
CREATE INDEX idx_coupon_product ON coupons(product_id);
CREATE INDEX idx_coupon_active ON coupons(is_active);

COMMENT ON TABLE coupons IS 'Vendor-created discount coupons for products';
COMMENT ON COLUMN coupons.code IS 'Unique coupon code (e.g., SAVE10, SUMMER2026)';
COMMENT ON COLUMN coupons.coupon_type IS 'PERCENTAGE (e.g., 10%) or FIXED_AMOUNT (e.g., $10)';
COMMENT ON COLUMN coupons.discount_value IS 'Discount value (10.00 for 10% or $10)';
COMMENT ON COLUMN coupons.vendor_id IS 'Vendor who created this coupon';
COMMENT ON COLUMN coupons.product_id IS 'Optional: If set, coupon applies only to this product';

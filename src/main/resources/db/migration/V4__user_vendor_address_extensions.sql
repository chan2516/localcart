-- V4: User, Vendor, and Address Extensions
-- Date: 2026-02-07

-- ===========================
-- USER TABLE EXTENSIONS
-- ===========================
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token_expiry TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token_expiry TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en';
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_currency VARCHAR(5) DEFAULT 'USD';
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(100);

-- ===========================
-- VENDOR TABLE EXTENSIONS
-- ===========================
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS business_email VARCHAR(100);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS logo_url VARCHAR(255);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS business_registration_number VARCHAR(100);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS business_license VARCHAR(100);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS kyc_document_url VARCHAR(500);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMP;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS kyc_verified_by BIGINT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS business_hours_json TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS return_address VARCHAR(255);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS return_policy TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS shipping_policy TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS minimum_order_value DECIMAL(10,2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS free_shipping_threshold DECIMAL(10,2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 15.00;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(100);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS bank_branch VARCHAR(100);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(50);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS account_holder_name VARCHAR(100);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS total_sales DECIMAL(15,2) DEFAULT 0.00;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS total_orders BIGINT DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS pending_payout DECIMAL(15,2) DEFAULT 0.00;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS last_payout_at TIMESTAMP;

-- Add foreign key for kyc_verified_by
ALTER TABLE vendors 
    ADD CONSTRAINT fk_vendor_kyc_verified_by 
    FOREIGN KEY (kyc_verified_by) REFERENCES users(id);

-- ===========================
-- ADDRESS TABLE EXTENSIONS
-- ===========================
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS contact_name VARCHAR(100);
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS address_label VARCHAR(50);
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS delivery_instructions VARCHAR(500);
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS landmark VARCHAR(200);
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8);
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8);

-- ===========================
-- INDEXES FOR PERFORMANCE
-- ===========================
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(is_email_verified);
CREATE INDEX IF NOT EXISTS idx_vendors_business_email ON vendors(business_email);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_addresses_contact_phone ON addresses(contact_phone);

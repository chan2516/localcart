-- V11__vendor_verification_schema_fix.sql
-- Align the live schema with the updated Vendor/User entities and vendor verification flow.

-- ===========================
-- USER TABLE EXTENSIONS
-- ===========================
ALTER TABLE users ADD COLUMN IF NOT EXISTS pincode VARCHAR(20);
CREATE INDEX IF NOT EXISTS idx_user_pincode ON users(pincode);

-- ===========================
-- VENDOR TABLE EXTENSIONS
-- ===========================
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS shop_pincode VARCHAR(20);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS gstin_number VARCHAR(100);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS fassai_number VARCHAR(100);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS shop_certificate_number VARCHAR(100);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS vendor_photo_url VARCHAR(500);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS vendor_signature_url VARCHAR(500);

-- Backfill existing vendors so the NOT NULL constraint can be applied safely.
UPDATE vendors
SET shop_pincode = COALESCE(NULLIF(shop_pincode, ''), NULLIF(business_zip_code, ''), '000000')
WHERE shop_pincode IS NULL OR shop_pincode = '';

ALTER TABLE vendors
    ALTER COLUMN shop_pincode SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vendor_shop_pincode ON vendors(shop_pincode);
CREATE INDEX IF NOT EXISTS idx_vendor_gstin_number ON vendors(gstin_number);
CREATE INDEX IF NOT EXISTS idx_vendor_fassai_number ON vendors(fassai_number);

-- ===========================
-- VENDOR DOCUMENTS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS vendor_documents (
    id BIGSERIAL PRIMARY KEY,
    deleted_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    vendor_id BIGINT NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    document_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    verified_at TIMESTAMP,
    verified_by BIGINT,
    verification_comments VARCHAR(1000),
    document_number VARCHAR(100),
    expiry_date DATE,
    upload_notes VARCHAR(500)
);

CREATE INDEX IF NOT EXISTS idx_vendor_documents_vendor_id ON vendor_documents(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_documents_type ON vendor_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_vendor_documents_status ON vendor_documents(verification_status);

ALTER TABLE vendor_documents
    ADD CONSTRAINT fk_vendor_documents_vendor
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;

ALTER TABLE vendor_documents
    ADD CONSTRAINT fk_vendor_documents_verified_by
    FOREIGN KEY (verified_by) REFERENCES users(id);

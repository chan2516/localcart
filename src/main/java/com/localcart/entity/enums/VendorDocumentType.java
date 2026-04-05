package com.localcart.entity.enums;

/**
 * Types of documents required for vendor verification
 */
public enum VendorDocumentType {
    GSTIN_CERTIFICATE("GSTIN Certificate"),
    FASSAI_CERTIFICATE("FASSAI Certificate"),
    SHOP_OWNERSHIP_CERTIFICATE("Shop Ownership Certificate"),
    VENDOR_PHOTO("Vendor Photo"),
    VENDOR_SIGNATURE("Vendor Signature"),
    BANK_PASSBOOK("Bank Passbook"),
    SHOP_REGISTRATION("Shop Registration Document");

    private final String displayName;

    VendorDocumentType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}

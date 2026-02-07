package com.localcart.entity.enums;

public enum PaymentProvider {
    STRIPE("stripe"),
    PAYPAL("paypal"),
    RAZORPAY("razorpay"),
    SQUARE("square"),
    CHECKOUT("checkout"),
    WALLET("wallet"),
    BANK_TRANSFER("bank_transfer"),
    MOCK("mock");  // For development/testing

    private final String value;

    PaymentProvider(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static PaymentProvider fromValue(String value) {
        for (PaymentProvider provider : PaymentProvider.values()) {
            if (provider.value.equalsIgnoreCase(value)) {
                return provider;
            }
        }
        throw new IllegalArgumentException("Invalid payment provider: " + value);
    }
}

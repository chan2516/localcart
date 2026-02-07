package com.localcart.entity.enums;

public enum PaymentMethod {
    CREDIT_CARD("credit_card"),
    DEBIT_CARD("debit_card"),
    NET_BANKING("net_banking"),
    WALLET("wallet"),
    UPI("upi"),
    BANK_TRANSFER("bank_transfer"),
    CRYPTO("crypto"),
    BUY_NOW_PAY_LATER("bnpl");

    private final String value;

    PaymentMethod(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static PaymentMethod fromValue(String value) {
        for (PaymentMethod method : PaymentMethod.values()) {
            if (method.value.equalsIgnoreCase(value)) {
                return method;
            }
        }
        throw new IllegalArgumentException("Invalid payment method: " + value);
    }
}

package com.localcart.entity.enums;

public enum PaymentStatus {
    PENDING,              // Payment initiated
    PROCESSING,           // Payment being processed
    COMPLETED,            // Payment successful
    FAILED,               // Payment failed
    REFUNDED,             // Payment fully refunded
    PARTIALLY_REFUNDED,   // Payment partially refunded
    CANCELLED             // Payment cancelled
}

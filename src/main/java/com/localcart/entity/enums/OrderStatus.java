package com.localcart.entity.enums;

public enum OrderStatus {
    PENDING,           // Order created, waiting for payment
    PAYMENT_CONFIRMED, // Payment confirmed
    PROCESSING,        // Order being prepared
    SHIPPED,           // Order shipped
    DELIVERED,         // Order delivered to customer
    CANCELLED,         // Order cancelled
    REFUNDED          // Order refunded
}

package com.localcart.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(PaymentException.class)
    public ResponseEntity<Map<String, Object>> handlePaymentException(PaymentException ex) {
        HttpStatus status = mapStatus(ex.getErrorCode());
        return ResponseEntity.status(status).body(Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status", status.value(),
                "error", status.getReasonPhrase(),
                "code", ex.getErrorCode() != null ? ex.getErrorCode() : "BUSINESS_ERROR",
                "message", ex.getMessage()
        ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        return ResponseEntity.status(status).body(Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status", status.value(),
                "error", status.getReasonPhrase(),
                "code", "INTERNAL_ERROR",
                "message", "An unexpected server error occurred"
        ));
    }

    private HttpStatus mapStatus(String errorCode) {
        if (errorCode == null || errorCode.isBlank()) {
            return HttpStatus.BAD_REQUEST;
        }

        return switch (errorCode) {
            case "AUTH_FAILED", "TOKEN_EXPIRED", "INVALID_AUTH_HEADER" -> HttpStatus.UNAUTHORIZED;
            case "UNAUTHORIZED" -> HttpStatus.FORBIDDEN;
            case "USER_NOT_FOUND", "VENDOR_NOT_FOUND", "ROLE_NOT_FOUND", "PRODUCT_NOT_FOUND", "CART_ITEM_NOT_FOUND" -> HttpStatus.NOT_FOUND;
            case "EMAIL_EXISTS", "VENDOR_ALREADY_EXISTS", "BUSINESS_NAME_EXISTS" -> HttpStatus.CONFLICT;
            case "REG_ERROR", "LOGIN_ERROR", "PROFILE_ERROR", "PASSWORD_ERROR", "REFRESH_FAILED" -> HttpStatus.INTERNAL_SERVER_ERROR;
            default -> HttpStatus.BAD_REQUEST;
        };
    }
}

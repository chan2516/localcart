package com.localcart.exception;

public class PaymentException extends RuntimeException {
    
    private String errorCode;
    private String errorMessage;
    private Throwable cause;

    public PaymentException(String message) {
        super(message);
        this.errorMessage = message;
    }

    public PaymentException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
        this.errorMessage = message;
    }

    public PaymentException(String message, String errorCode, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
        this.errorMessage = message;
        this.cause = cause;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public String getErrorMessage() {
        return errorMessage;
    }
}

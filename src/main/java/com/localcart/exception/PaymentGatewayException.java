package com.localcart.exception;

public class PaymentGatewayException extends PaymentException {
    
    private String gatewayErrorCode;
    private String gatewayErrorMessage;

    public PaymentGatewayException(String message, String gatewayErrorCode) {
        super(message, "GATEWAY_ERROR");
        this.gatewayErrorCode = gatewayErrorCode;
    }

    public PaymentGatewayException(String message, String gatewayErrorCode, Throwable cause) {
        super(message, "GATEWAY_ERROR", cause);
        this.gatewayErrorCode = gatewayErrorCode;
    }

    public String getGatewayErrorCode() {
        return gatewayErrorCode;
    }

    public void setGatewayErrorCode(String gatewayErrorCode) {
        this.gatewayErrorCode = gatewayErrorCode;
    }

    public String getGatewayErrorMessage() {
        return gatewayErrorMessage;
    }

    public void setGatewayErrorMessage(String gatewayErrorMessage) {
        this.gatewayErrorMessage = gatewayErrorMessage;
    }
}

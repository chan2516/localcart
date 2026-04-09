package com.localcart.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.validation.method.ParameterErrors;
import org.springframework.validation.method.ParameterValidationResult;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {

        Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        error -> error.getDefaultMessage() != null ? error.getDefaultMessage() : "Invalid value",
                        (existing, replacement) -> existing,
                        HashMap::new));

        log.warn("Validation error at {} {} | fieldErrors={} | message={}",
                request.getMethod(), request.getRequestURI(), fieldErrors, ex.getMessage());

        return validationResponse(fieldErrors);
    }

    @ExceptionHandler(BindException.class)
    public ResponseEntity<Map<String, Object>> handleBindException(BindException ex, HttpServletRequest request) {
        Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        error -> error.getDefaultMessage() != null ? error.getDefaultMessage() : "Invalid value",
                        (existing, replacement) -> existing,
                        HashMap::new));

        log.warn("Bind validation error at {} {} | fieldErrors={} | message={}",
                request.getMethod(), request.getRequestURI(), fieldErrors, ex.getMessage());

        return validationResponse(fieldErrors);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolationException(
            ConstraintViolationException ex,
            HttpServletRequest request) {

        Map<String, String> fieldErrors = ex.getConstraintViolations().stream()
                .collect(Collectors.toMap(
                        violation -> violation.getPropertyPath().toString(),
                        violation -> violation.getMessage() != null ? violation.getMessage() : "Invalid value",
                        (existing, replacement) -> existing,
                        HashMap::new));

        log.warn("Constraint violation at {} {} | violations={} | message={}",
                request.getMethod(), request.getRequestURI(), fieldErrors, ex.getMessage());

        return validationResponse(fieldErrors);
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<Map<String, Object>> handleHandlerMethodValidationException(
            HandlerMethodValidationException ex,
            HttpServletRequest request) {

        Map<String, String> fieldErrors = ex.getParameterValidationResults().stream()
                .flatMap(result -> toFieldErrors(result).entrySet().stream())
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (existing, replacement) -> existing,
                        HashMap::new));

        if (fieldErrors.isEmpty()) {
            fieldErrors.put("request", "Validation failed");
        }

        log.warn("Handler method validation error at {} {} | fieldErrors={} | message={}",
                request.getMethod(), request.getRequestURI(), fieldErrors, ex.getMessage());

        return validationResponse(fieldErrors);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityViolationException(
            DataIntegrityViolationException ex,
            HttpServletRequest request) {

        String message = ex.getMostSpecificCause() != null && ex.getMostSpecificCause().getMessage() != null
                ? ex.getMostSpecificCause().getMessage()
                : "Invalid request data";

        log.warn("Data integrity violation at {} {} | message={} | rootCause={}",
                request.getMethod(), request.getRequestURI(), ex.getMessage(), message);

        return validationResponse(message);
    }

    @ExceptionHandler(PaymentException.class)
    public ResponseEntity<Map<String, Object>> handlePaymentException(PaymentException ex, HttpServletRequest request) {
        HttpStatus status = mapStatus(ex.getErrorCode());

        log.warn("Business/service error at {} {} | code={} | message={}",
                request.getMethod(), request.getRequestURI(), ex.getErrorCode(), ex.getMessage());

        return ResponseEntity.status(status).body(Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status", status.value(),
                "error", status.getReasonPhrase(),
                "code", ex.getErrorCode() != null ? ex.getErrorCode() : "BUSINESS_ERROR",
                "message", ex.getMessage()
        ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex, HttpServletRequest request) {
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;

        log.error("Unhandled server error at {} {} | message={}",
                request.getMethod(), request.getRequestURI(), ex.getMessage(), ex);

        return ResponseEntity.status(status).body(Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status", status.value(),
                "error", status.getReasonPhrase(),
                "code", "INTERNAL_ERROR",
                "message", "An unexpected server error occurred"
        ));
    }

    private ResponseEntity<Map<String, Object>> validationResponse(Map<String, String> fieldErrors) {
        HttpStatus status = HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status).body(Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status", status.value(),
                "error", status.getReasonPhrase(),
                "code", "VALIDATION_ERROR",
                "message", "Validation failed",
                "fieldErrors", fieldErrors
        ));
    }

    private ResponseEntity<Map<String, Object>> validationResponse(String message) {
        HttpStatus status = HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status).body(Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status", status.value(),
                "error", status.getReasonPhrase(),
                "code", "VALIDATION_ERROR",
                "message", message
        ));
    }

    private HttpStatus mapStatus(String errorCode) {
        if (errorCode == null || errorCode.isBlank()) {
            return HttpStatus.BAD_REQUEST;
        }

        return switch (errorCode) {
            case "AUTH_FAILED", "TOKEN_EXPIRED", "INVALID_AUTH_HEADER" -> HttpStatus.UNAUTHORIZED;
            case "UNAUTHORIZED", "BANNED_USER" -> HttpStatus.FORBIDDEN;
            case "USER_NOT_FOUND", "VENDOR_NOT_FOUND", "ROLE_NOT_FOUND", "PRODUCT_NOT_FOUND", "CART_ITEM_NOT_FOUND" -> HttpStatus.NOT_FOUND;
            case "EMAIL_EXISTS", "VENDOR_ALREADY_EXISTS", "BUSINESS_NAME_EXISTS" -> HttpStatus.CONFLICT;
            case "REG_ERROR", "LOGIN_ERROR", "PROFILE_ERROR", "PASSWORD_ERROR", "REFRESH_FAILED" -> HttpStatus.INTERNAL_SERVER_ERROR;
            default -> HttpStatus.BAD_REQUEST;
        };
    }

    private Map<String, String> toFieldErrors(ParameterValidationResult result) {
        Map<String, String> mappedErrors = new HashMap<>();

        if (result instanceof ParameterErrors parameterErrors) {
            List<FieldError> errors = parameterErrors.getFieldErrors();
            for (FieldError fieldError : errors) {
                String message = fieldError.getDefaultMessage() != null ? fieldError.getDefaultMessage() : "Invalid value";
                mappedErrors.put(fieldError.getField(), message);
            }
            return mappedErrors;
        }

        String parameterName = result.getMethodParameter().getParameterName();
        String key = parameterName != null ? parameterName : "request";
        String message = result.getResolvableErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage() != null ? error.getDefaultMessage() : "Invalid value")
                .orElse("Invalid value");

        mappedErrors.put(key, message);
        return mappedErrors;
    }
}

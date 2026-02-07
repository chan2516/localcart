package com.localcart.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Forgot Password Request DTO
 * 
 * Used to initiate password reset flow.
 * Sends reset token to user's email.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForgotPasswordRequest {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Valid email is required")
    private String email;
}

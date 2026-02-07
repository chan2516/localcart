package com.localcart.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Update User Profile Request DTO
 * 
 * Used when a user updates their profile information.
 * All fields are optional (partial update supported).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    
    @Size(min = 2, max = 50)
    private String firstName;
    
    @Size(min = 2, max = 50)
    private String lastName;
    
    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Invalid phone number format")
    @Size(min = 10, max = 20)
    private String phoneNumber;
    
    @Size(max = 255)
    private String profileImageUrl;
    
    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;
    
    @Pattern(regexp = "^(MALE|FEMALE|OTHER|PREFER_NOT_TO_SAY)$", message = "Invalid gender")
    private String gender;
    
    @Pattern(regexp = "^[a-z]{2}$", message = "Language code must be 2 lowercase letters (e.g., 'en', 'es')")
    private String preferredLanguage;
    
    @Pattern(regexp = "^[A-Z]{3}$", message = "Currency code must be 3 uppercase letters (e.g., 'USD', 'EUR')")
    private String preferredCurrency;
    
    @Size(max = 50)
    private String timezone;
}

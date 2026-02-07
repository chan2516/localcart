package com.localcart.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    @Builder.Default
    private String tokenType = "Bearer";
    private Long expiresIn; // in seconds
    private String message;
    
    // Simple fields (in addition to UserInfo for backwards compatibility)
    private Long userId;
    private String email;
    private String firstName;
    private String lastName;
    private List<String> roles;
    
    // Nested structure (for compatibility with existing code)
    private UserInfo user;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private Long id;
        private String email;
        private String firstName;
        private String lastName;
        private Set<String> roles;
        private boolean isVendor;
        private Long vendorId;
    }
}


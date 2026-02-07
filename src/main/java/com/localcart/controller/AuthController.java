package com.localcart.controller;

import com.localcart.dto.auth.LoginRequest;
import com.localcart.dto.auth.RegisterRequest;
import com.localcart.dto.auth.AuthResponse;
import com.localcart.dto.auth.RefreshTokenRequest;
import com.localcart.entity.User;
import com.localcart.exception.PaymentException;
import com.localcart.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;

/**
 * Authentication Controller
 * 
 * Endpoints for:
 * - User registration
 * - User login (with JWT token generation)
 * - Token refresh
 * - Logout (token revocation)
 * - Current user info
 * 
 * All responses include JWT tokens for frontend to store and use
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Validated
public class AuthController {

    private final UserService userService;

    /**
     * POST /api/v1/auth/register
     * 
     * Register a new user
     * 
     * Request:
     * {
     *   "email": "user@example.com",
     *   "password": "SecurePass123",
     *   "firstName": "John",
     *   "lastName": "Doe",
     *   "phoneNumber": "+1234567890"
     * }
     * 
     * Response:
     * {
     *   "accessToken": "eyJhbGc...",
     *   "refreshToken": "eyJhbGc...",
     *   "userId": 1,
     *   "email": "user@example.com",
     *   "firstName": "John",
     *   "lastName": "Doe",
     *   "roles": ["CUSTOMER"],
     *   "message": "Registration successful"
     * }
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        try {
            log.info("Registration request for email: {}", request.getEmail());
            
            // Register user
            User user = userService.registerUser(request);
            
            // For registration, auto-login: generate tokens
            // Convert to UserDetails for token generation
            org.springframework.security.core.userdetails.UserDetails userDetails = 
                    userService.loadUserByUsername(user.getEmail());
            
            String accessToken = new com.localcart.security.JwtUtils(
                    new com.localcart.config.JwtConfig()
            ).generateAccessToken(userDetails);
            
            String refreshToken = new com.localcart.security.JwtUtils(
                    new com.localcart.config.JwtConfig()
            ).generateRefreshToken(userDetails);
            
            AuthResponse response = AuthResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .userId(user.getId())
                    .email(user.getEmail())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .roles(user.getRoles().stream()
                            .map(r -> r.getName().toString())
                            .toList())
                    .message("Registration successful, you are now logged in")
                    .build();
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (PaymentException e) {
            log.warn("Registration failed: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during registration", e);
            throw new PaymentException("Registration failed", "REG_ERROR");
        }
    }

    /**
     * POST /api/v1/auth/login
     * 
     * Login user and generate JWT tokens
     * 
     * Request:
     * {
     *   "email": "user@example.com",
     *   "password": "SecurePass123"
     * }
     * 
     * Response:
     * {
     *   "accessToken": "eyJhbGc...",
     *   "refreshToken": "eyJhbGc...",
     *   "userId": 1,
     *   "email": "user@example.com",
     *   "firstName": "John",
     *   "lastName": "Doe",
     *   "roles": ["CUSTOMER"],
     *   "message": "Login successful"
     * }
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        try {
            log.info("Login request for email: {}", request.getEmail());
            
            AuthResponse response = userService.login(request);
            
            return ResponseEntity.ok(response);
            
        } catch (PaymentException e) {
            log.warn("Login failed: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during login", e);
            throw new PaymentException("Login failed", "LOGIN_ERROR");
        }
    }

    /**
     * POST /api/v1/auth/refresh
     * 
     * Refresh access token using refresh token
     * Called when access token expires but refresh token is still valid
     * 
     * Request:
     * {
     *   "refreshToken": "eyJhbGc..."
     * }
     * 
     * Response:
     * {
     *   "accessToken": "eyJhbGc...",  (new)
     *   "refreshToken": "eyJhbGc...",  (same or rotated)
     *   "userId": 1,
     *   "email": "user@example.com",
     *   "firstName": "John",
     *   "lastName": "Doe",
     *   "message": "Token refreshed successfully"
     * }
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        try {
            log.info("Token refresh request");
            
            AuthResponse response = userService.refreshToken(request.getRefreshToken());
            
            return ResponseEntity.ok(response);
            
        } catch (PaymentException e) {
            log.warn("Token refresh failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (Exception e) {
            log.error("Unexpected error during token refresh", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * POST /api/v1/auth/logout
     * 
     * Logout user (invalidate refresh token)
     * Client should also remove tokens from localStorage
     * 
     * Request:
     * {
     *   "refreshToken": "eyJhbGc..."
     * }
     * 
     * Response:
     * {
     *   "message": "Logout successful"
     * }
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(@Valid @RequestBody RefreshTokenRequest request) {
        try {
            log.info("Logout request");
            
            // Invalidate refresh token
            userService.logout(request.getRefreshToken());
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Logout successful");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error during logout: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/v1/auth/profile
     * 
     * Get current user profile (based on JWT token)
     * Requires valid JWT token in Authorization header
     * 
     * Response:
     * {
     *   "userId": 1,
     *   "email": "user@example.com",
     *   "firstName": "John",
     *   "lastName": "Doe",
     *   "phoneNumber": "+1234567890",
     *   "isActive": true,
     *   "isEmailVerified": false,
     *   "roles": ["CUSTOMER"]
     * }
     */
    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getProfile(
            @RequestHeader("Authorization") String authHeader) {
        try {
            log.info("Profile request");
            
            // Extract token from Authorization header
            String token = authHeader.substring(7);  // Remove "Bearer "
            
            // Extract username from token
            com.localcart.security.JwtUtils jwtUtils = new com.localcart.security.JwtUtils(
                    new com.localcart.config.JwtConfig()
            );
            String email = jwtUtils.extractUsername(token);
            
            // Get user
            User user = userService.findByEmail(email)
                    .orElseThrow(() -> new PaymentException("User not found", "USER_NOT_FOUND"));
            
            // Build response
            Map<String, Object> profile = new HashMap<>();
            profile.put("userId", user.getId());
            profile.put("email", user.getEmail());
            profile.put("firstName", user.getFirstName());
            profile.put("lastName", user.getLastName());
            profile.put("phoneNumber", user.getPhoneNumber());
            profile.put("isActive", user.getIsActive());
            profile.put("isEmailVerified", user.getIsEmailVerified());
            profile.put("roles", user.getRoles().stream()
                    .map(r -> r.getName().toString())
                    .toList());
            
            return ResponseEntity.ok(profile);
            
        } catch (PaymentException e) {
            log.warn("Profile request failed: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error getting profile: {}", e.getMessage());
            throw new PaymentException("Failed to get profile", "PROFILE_ERROR");
        }
    }

    /**
     * POST /api/v1/auth/change-password
     * 
     * Change user password
     * Requires valid JWT token and old password verification
     */
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody Map<String, String> request) {
        try {
            // Extract user from token
            String token = authHeader.substring(7);
            com.localcart.security.JwtUtils jwtUtils = new com.localcart.security.JwtUtils(
                    new com.localcart.config.JwtConfig()
            );
            String email = jwtUtils.extractUsername(token);
            User user = userService.findByEmail(email)
                    .orElseThrow(() -> new PaymentException("User not found", "USER_NOT_FOUND"));
            
            // Change password
            userService.changePassword(
                    user.getId(),
                    request.get("oldPassword"),
                    request.get("newPassword")
            );
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Password changed successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (PaymentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error changing password: {}", e.getMessage());
            throw new PaymentException("Failed to change password", "PASSWORD_ERROR");
        }
    }
}

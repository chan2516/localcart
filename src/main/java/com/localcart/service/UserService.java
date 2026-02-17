package com.localcart.service;

import com.localcart.config.PasswordResetProperties;
import com.localcart.dto.auth.RegisterRequest;
import com.localcart.service.EmailService;
import com.localcart.dto.auth.LoginRequest;
import com.localcart.dto.auth.AuthResponse;
import com.localcart.entity.User;
import com.localcart.entity.Role;
import com.localcart.entity.enums.RoleType;
import com.localcart.exception.PaymentException;
import com.localcart.repository.UserRepository;
import com.localcart.repository.RoleRepository;
import com.localcart.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashSet;
import java.util.Optional;

/**
 * User Authentication Service
 * 
 * Responsibilities:
 * - User registration
 * - User login with JWT token generation
 * - Token refresh
 * - Logout and token invalidation
 * - Password management
 */
@Slf4j
@Service
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final EmailService emailService;
    private final PasswordResetProperties passwordResetProperties;
    @Lazy
    private final AuthenticationManager authenticationManager;

    public UserService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            JwtUtils jwtUtils,
            EmailService emailService,
            PasswordResetProperties passwordResetProperties,
            @Lazy AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
        this.emailService = emailService;
        this.passwordResetProperties = passwordResetProperties;
        this.authenticationManager = authenticationManager;
    }

    /**
     * Register a new user
     * 
     * Process:
     * 1. Validate email doesn't exist
     * 2. Encode password
     * 3. Assign CUSTOMER role by default
     * 4. Save user to database
     */
    @Transactional
    public User registerUser(RegisterRequest request) {
        log.info("Registering new user: {}", request.getEmail());

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new PaymentException("Email already registered", "EMAIL_EXISTS");
        }

        // Get CUSTOMER role (default for new users)
        Role customerRole = roleRepository.findByName(RoleType.CUSTOMER)
                .orElseThrow(() -> new PaymentException("CUSTOMER role not found", "ROLE_NOT_FOUND"));

        // Create new user
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getPhoneNumber())
                .isActive(true)
                .isEmailVerified(false)  // Email verification can be added later
                .roles(new HashSet<>(Collections.singletonList(customerRole)))
                .build();

        User savedUser = userRepository.save(user);
        log.info("User registered successfully: {}", savedUser.getId());

        return savedUser;
    }

    /**
     * Login user and generate JWT tokens
     * 
     * Process:
     * 1. Authenticate user with username and password
     * 2. Generate access token (short-lived: 15 mins)
     * 3. Generate refresh token (long-lived: 7 days)
     * 4. Return user with tokens
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        log.info("Authenticating user: {}", request.getEmail());

        try {
            // Authenticate user (throws BadCredentialsException if invalid)
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );

            // Get authenticated user details
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new PaymentException("User not found", "USER_NOT_FOUND"));

            // Generate tokens
            String accessToken = jwtUtils.generateAccessToken(userDetails);
            String refreshToken = jwtUtils.generateRefreshToken(userDetails);

            log.info("User logged in successfully: {}", user.getId());

            // Return response with tokens and user details
            return AuthResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .userId(user.getId())
                    .email(user.getEmail())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .roles(user.getRoles().stream()
                            .map(r -> r.getName().toString())
                            .toList())
                    .message("Login successful")
                    .build();

        } catch (org.springframework.security.core.AuthenticationException e) {
            log.warn("Authentication failed for user: {}", request.getEmail());
            throw new PaymentException("Invalid email or password", "AUTH_FAILED");
        }
    }

    /**
     * Refresh access token using refresh token
     * 
     * Process:
     * 1. Validate refresh token is still valid
     * 2. Extract username from refresh token
     * 3. Load user and generate new access token
     * 4. Optionally rotate refresh token
     */
    @Transactional
    public AuthResponse refreshToken(String refreshToken) {
        log.info("Refreshing token");

        try {
            // Validate refresh token
            if (!jwtUtils.isTokenValid(refreshToken)) {
                throw new PaymentException("Refresh token expired", "TOKEN_EXPIRED");
            }

            // Extract username from refresh token
            String username = jwtUtils.extractUsername(refreshToken);
            
            // Load user details
            User user = userRepository.findByEmail(username)
                    .orElseThrow(() -> new PaymentException("User not found", "USER_NOT_FOUND"));

            // Generate new access token
            UserDetails userDetails = loadUserByUsername(username);
            String newAccessToken = jwtUtils.generateAccessToken(userDetails);

            log.info("Token refreshed successfully for user: {}", user.getId());

            return AuthResponse.builder()
                    .accessToken(newAccessToken)
                    .refreshToken(refreshToken)  // Keep same refresh token
                    .userId(user.getId())
                    .email(user.getEmail())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .message("Token refreshed successfully")
                    .build();

        } catch (Exception e) {
            log.error("Token refresh failed: {}", e.getMessage());
            throw new PaymentException("Failed to refresh token", "REFRESH_FAILED");
        }
    }

    /**
     * Logout user (invalidate refresh token)
     * In a production system, add refreshToken to Redis blacklist
     */
    @Transactional
    public void logout(String refreshToken) {
        log.info("User logout requested");
        
        // In production: Add refreshToken to Redis blacklist with TTL
        // redis.setex("token_blacklist:" + hashToken(refreshToken), expiryTime, "revoked");
        
        // For now, just log the logout
        log.info("User logged out successfully");
    }

    /**
     * Change user password
     */
    @Transactional
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        log.info("Changing password for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new PaymentException("User not found", "USER_NOT_FOUND"));

        // Verify old password
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new PaymentException("Old password is incorrect", "INVALID_PASSWORD");
        }

        // Set new password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        log.info("Password changed successfully for user: {}", userId);
    }

    /**
     * Request a password reset link by email
     */
    @Transactional
    public void requestPasswordReset(String email) {
        log.info("Password reset requested for: {}", email);

        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            log.info("Password reset requested for unknown email: {}", email);
            return;
        }

        UserDetails userDetails = loadUserByUsername(email);
        String token = jwtUtils.generatePasswordResetToken(userDetails, passwordResetProperties.getTokenExpiration());
        String resetLink = passwordResetProperties.getBaseUrl() + token;

        emailService.sendPasswordResetEmail(email, resetLink);
    }

    /**
     * Reset password using a valid reset token
     */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        log.info("Resetting password using token");

        if (!jwtUtils.isTokenValid(token)) {
            throw new PaymentException("Reset token is invalid or expired", "RESET_TOKEN_INVALID");
        }

        String tokenType = jwtUtils.getTokenType(token);
        if (tokenType == null || !"password_reset".equals(tokenType)) {
            throw new PaymentException("Reset token is invalid", "RESET_TOKEN_INVALID");
        }

        String email = jwtUtils.extractUsername(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new PaymentException("User not found", "USER_NOT_FOUND"));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        log.info("Password reset successful for user: {}", user.getId());
    }

    /**
     * Find user by email
     */
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * Find user by ID
     */
    public Optional<User> findById(Long userId) {
        return userRepository.findById(userId);
    }

    /**
     * Load user by username (required by UserDetailsService)
     * Used by authentication manager
     */
    @Override
    public UserDetails loadUserByUsername(String username) {
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new org.springframework.security.core.userdetails.UsernameNotFoundException(
                        "User not found with email: " + username
                ));

        return new com.localcart.security.CustomUserDetails(user);
    }

    /**
     * Build AuthResponse from User entity
     * Helper method for response building
     */
    protected AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .roles(user.getRoles().stream()
                        .map(r -> r.getName().toString())
                        .toList())
                .message("Authentication successful")
                .build();
    }
}

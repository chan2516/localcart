package com.localcart.entity;

import com.localcart.entity.base.AuditableEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_email", columnList = "email"),
    @Index(name = "idx_user_active", columnList = "is_active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends AuditableEntity {

    @NotBlank
    @Email
    @Size(max = 100)
    @Column(unique = true, nullable = false, length = 100)
    private String email;

    @NotBlank
    @Size(min = 8, max = 255)
    @Column(nullable = false)
    private String password;

    @NotBlank
    @Size(max = 50)
    @Column(name = "first_name", nullable = false, length = 50)
    private String firstName;

    @NotBlank
    @Size(max = 50)
    @Column(name = "last_name", nullable = false, length = 50)
    private String lastName;

    @Size(max = 20)
    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_email_verified")
    @Builder.Default
    private Boolean isEmailVerified = false;

    // Security & Recovery Fields
    @Size(max = 255)
    @Column(name = "profile_image_url")
    private String profileImageUrl;

    @Size(max = 100)
    @Column(name = "password_reset_token", length = 100)
    private String passwordResetToken;

    @Column(name = "password_reset_token_expiry")
    private java.time.LocalDateTime passwordResetTokenExpiry;

    @Size(max = 100)
    @Column(name = "email_verification_token", length = 100)
    private String emailVerificationToken;

    @Column(name = "email_verification_token_expiry")
    private java.time.LocalDateTime emailVerificationTokenExpiry;

    @Column(name = "last_login_at")
    private java.time.LocalDateTime lastLoginAt;

    @Column(name = "failed_login_attempts")
    @Builder.Default
    private Integer failedLoginAttempts = 0;

    @Column(name = "account_locked_until")
    private java.time.LocalDateTime accountLockedUntil;

    // Profile Fields
    @Column(name = "date_of_birth")
    private java.time.LocalDate dateOfBirth;

    @Size(max = 20)
    @Column(name = "gender", length = 20)
    private String gender;

    @Size(max = 10)
    @Column(name = "preferred_language", length = 10)
    @Builder.Default
    private String preferredLanguage = "en";

    @Size(max = 5)
    @Column(name = "preferred_currency", length = 5)
    @Builder.Default
    private String preferredCurrency = "USD";

    @Size(max = 50)
    @Column(name = "timezone", length = 50)
    @Builder.Default
    private String timezone = "UTC";

    @Size(max = 500)
    @Column(name = "suspension_reason", length = 500)
    private String suspensionReason;

    // Two-Factor Authentication
    @Column(name = "two_factor_enabled")
    @Builder.Default
    private Boolean twoFactorEnabled = false;

    @Size(max = 100)
    @Column(name = "two_factor_secret", length = 100)
    private String twoFactorSecret;

    // Relationships
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Address> addresses = new ArrayList<>();

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Vendor vendor;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Cart cart;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Order> orders = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Review> reviews = new ArrayList<>();
}

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

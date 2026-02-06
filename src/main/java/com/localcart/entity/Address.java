package com.localcart.entity;

import com.localcart.entity.base.AuditableEntity;
import com.localcart.entity.enums.AddressType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Entity
@Table(name = "addresses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Address extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AddressType type;

    @NotBlank
    @Size(max = 255)
    @Column(nullable = false)
    private String street;

    @Size(max = 100)
    private String apartment;

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false)
    private String city;

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false)
    private String state;

    @NotBlank
    @Size(max = 20)
    @Column(name = "zip_code", nullable = false)
    private String zipCode;

    @NotBlank
    @Size(max = 100)
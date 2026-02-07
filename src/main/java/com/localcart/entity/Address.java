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

    // Delivery Contact Information
    @Size(max = 100)
    @Column(name = "contact_name", length = 100)
    private String contactName;

    @Size(max = 20)
    @Column(name = "contact_phone", length = 20)
    private String contactPhone;

    @Size(max = 50)
    @Column(name = "address_label", length = 50)
    private String addressLabel; // "Home", "Office", "Parents' House", etc.

    // Address Details
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
    @Column(nullable = false, length = 100)
    private String country;

    // Delivery Instructions & Location
    @Size(max = 500)
    @Column(name = "delivery_instructions", length = 500)
    private String deliveryInstructions;

    @Size(max = 200)
    @Column(name = "landmark", length = 200)
    private String landmark;

    @Column(name = "latitude", precision = 10, scale = 8)
    private java.math.BigDecimal latitude;

    @Column(name = "longitude", precision = 11, scale = 8)
    private java.math.BigDecimal longitude;

    @Column(name = "is_default")
    @Builder.Default
    private Boolean isDefault = false;
}
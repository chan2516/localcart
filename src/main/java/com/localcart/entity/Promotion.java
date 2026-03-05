package com.localcart.entity;

import com.localcart.entity.base.AuditableEntity;
import com.localcart.entity.enums.PromotionType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "promotions", indexes = {
    @Index(name = "idx_promotion_vendor", columnList = "vendor_id"),
    @Index(name = "idx_promotion_type", columnList = "promotion_type"),
    @Index(name = "idx_promotion_active", columnList = "is_active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Promotion extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @Enumerated(EnumType.STRING)
    @Column(name = "promotion_type", nullable = false, length = 20)
    private PromotionType promotionType;

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String title;

    @Size(max = 1000)
    @Column(length = 1000)
    private String description;

    @Size(max = 50)
    @Column(length = 50)
    private String code;

    @Size(max = 100)
    @Column(name = "value_text", length = 100)
    private String valueText;

    @Column(name = "starts_at")
    private LocalDateTime startsAt;

    @Column(name = "ends_at")
    private LocalDateTime endsAt;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
}

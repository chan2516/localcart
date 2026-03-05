package com.localcart.dto.promotion;

import com.localcart.entity.enums.PromotionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromotionDto {
    private Long id;
    private Long vendorId;
    private PromotionType promotionType;
    private String title;
    private String description;
    private String code;
    private String valueText;
    private String startsAt;
    private String endsAt;
    private Boolean isActive;
    private String createdAt;
}

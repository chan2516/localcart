package com.localcart.dto.promotion;

import com.localcart.entity.enums.PromotionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePromotionRequest {

    @NotNull(message = "Promotion type is required")
    private PromotionType promotionType;

    @NotBlank(message = "Title is required")
    @Size(max = 100)
    private String title;

    @Size(max = 1000)
    private String description;

    @Size(max = 50)
    private String code;

    @Size(max = 100)
    private String valueText;

    private LocalDateTime startsAt;
    private LocalDateTime endsAt;
}

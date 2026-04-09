package com.localcart.dto.admin;

import com.localcart.entity.enums.AdminActionTargetType;
import com.localcart.entity.enums.AdminActionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminActionHistoryDto {

    private Long id;
    private AdminActionTargetType targetType;
    private Long targetId;
    private String targetLabel;
    private AdminActionType actionType;
    private String reason;
    private Long adminUserId;
    private String adminName;
    private String adminEmail;
    private LocalDateTime createdAt;
}
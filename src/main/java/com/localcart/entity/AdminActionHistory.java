package com.localcart.entity;

import com.localcart.entity.base.AuditableEntity;
import com.localcart.entity.enums.AdminActionTargetType;
import com.localcart.entity.enums.AdminActionType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "admin_action_history", indexes = {
        @Index(name = "idx_admin_action_history_target", columnList = "target_type,target_id"),
        @Index(name = "idx_admin_action_history_action", columnList = "action_type"),
        @Index(name = "idx_admin_action_history_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminActionHistory extends AuditableEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 20)
    private AdminActionTargetType targetType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Size(max = 200)
    @Column(name = "target_label", length = 200)
    private String targetLabel;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false, length = 20)
    private AdminActionType actionType;

    @Size(max = 500)
    @Column(name = "reason", length = 500)
    private String reason;

    @Column(name = "admin_user_id", nullable = false)
    private Long adminUserId;

    @Size(max = 150)
    @Column(name = "admin_name", length = 150)
    private String adminName;

    @Size(max = 150)
    @Column(name = "admin_email", length = 150)
    private String adminEmail;
}
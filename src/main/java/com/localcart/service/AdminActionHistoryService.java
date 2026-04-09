package com.localcart.service;

import com.localcart.dto.admin.AdminActionHistoryDto;
import com.localcart.entity.AdminActionHistory;
import com.localcart.entity.User;
import com.localcart.entity.enums.AdminActionTargetType;
import com.localcart.entity.enums.AdminActionType;
import com.localcart.exception.PaymentException;
import com.localcart.repository.AdminActionHistoryRepository;
import com.localcart.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminActionHistoryService {

    private final AdminActionHistoryRepository adminActionHistoryRepository;
    private final UserRepository userRepository;

    @Transactional
    public void recordAction(
            AdminActionTargetType targetType,
            Long targetId,
            String targetLabel,
            AdminActionType actionType,
            String reason,
            Long adminUserId) {

        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new PaymentException("Admin user not found", "USER_NOT_FOUND"));

        AdminActionHistory history = AdminActionHistory.builder()
                .targetType(targetType)
                .targetId(targetId)
                .targetLabel(targetLabel)
                .actionType(actionType)
                .reason(reason)
                .adminUserId(admin.getId())
                .adminName(buildDisplayName(admin))
                .adminEmail(admin.getEmail())
                .build();

        adminActionHistoryRepository.save(history);
    }

    @Transactional(readOnly = true)
    public Page<AdminActionHistoryDto> getHistory(AdminActionTargetType targetType, Long targetId, Pageable pageable) {
        Page<AdminActionHistory> historyPage;
        if (targetType != null && targetId != null) {
            historyPage = adminActionHistoryRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(targetType, targetId, pageable);
        } else if (targetType != null) {
            historyPage = adminActionHistoryRepository.findByTargetTypeOrderByCreatedAtDesc(targetType, pageable);
        } else {
            historyPage = adminActionHistoryRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        return historyPage.map(this::toDto);
    }

    private AdminActionHistoryDto toDto(AdminActionHistory history) {
        return AdminActionHistoryDto.builder()
                .id(history.getId())
                .targetType(history.getTargetType())
                .targetId(history.getTargetId())
                .targetLabel(history.getTargetLabel())
                .actionType(history.getActionType())
                .reason(history.getReason())
                .adminUserId(history.getAdminUserId())
                .adminName(history.getAdminName())
                .adminEmail(history.getAdminEmail())
                .createdAt(history.getCreatedAt())
                .build();
    }

    private String buildDisplayName(User user) {
        String firstName = user.getFirstName() != null ? user.getFirstName().trim() : "";
        String lastName = user.getLastName() != null ? user.getLastName().trim() : "";
        String displayName = (firstName + " " + lastName).trim();
        return displayName.isBlank() ? user.getEmail() : displayName;
    }
}
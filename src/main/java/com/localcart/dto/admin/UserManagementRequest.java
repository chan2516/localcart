package com.localcart.dto.admin;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * User Management Request DTO
 * 
 * Used by admin to suspend, activate, ban, or delete users.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserManagementRequest {
    
    @NotNull(message = "User ID is required")
    private Long userId;
    
    @NotNull(message = "Action is required (ACTIVATE, SUSPEND, BAN, DELETE)")
    private UserAction action; // ACTIVATE, SUSPEND, BAN, DELETE
    
    @Size(max = 500, message = "Reason cannot exceed 500 characters")
    private String reason; // Required for SUSPEND and BAN
    
    // For temporary suspension (in days)
    private Integer suspensionDurationDays;
    
    // Admin notes (internal only)
    @Size(max = 1000)
    private String adminNotes;
    
    public enum UserAction {
        ACTIVATE,
        SUSPEND,
        BAN,
        DELETE
    }
}

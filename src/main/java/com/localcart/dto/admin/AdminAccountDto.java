package com.localcart.dto.admin;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AdminAccountDto {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private Boolean isActive;
    private String level;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

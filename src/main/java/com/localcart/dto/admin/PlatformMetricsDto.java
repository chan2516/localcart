package com.localcart.dto.admin;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformMetricsDto {

    private String period;
    private BigDecimal totalRevenue;
    private Long totalOrders;
    private Long totalUsers;
    private BigDecimal averageOrderValue;
    private BigDecimal platformCommissionEarned;
}

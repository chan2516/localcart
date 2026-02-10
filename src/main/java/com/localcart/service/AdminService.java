package com.localcart.service;

import com.localcart.dto.admin.DashboardStatsDto;
import com.localcart.dto.admin.PlatformMetricsDto;
import com.localcart.dto.admin.UserManagementRequest;
import com.localcart.dto.admin.UserSummaryDto;
import com.localcart.entity.User;
import com.localcart.entity.enums.OrderStatus;
import com.localcart.entity.enums.PaymentStatus;
import com.localcart.entity.enums.VendorStatus;
import com.localcart.exception.PaymentException;
import com.localcart.repository.OrderRepository;
import com.localcart.repository.PaymentRepository;
import com.localcart.repository.ProductRepository;
import com.localcart.repository.ReviewRepository;
import com.localcart.repository.UserRepository;
import com.localcart.repository.VendorRepository;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AdminService {

    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final ReviewRepository reviewRepository;

    @Transactional(readOnly = true)
    public Page<UserSummaryDto> getAllUsers(Boolean active, Pageable pageable) {
        Page<User> users = active == null
                ? userRepository.findAll(pageable)
                : userRepository.findByIsActive(active, pageable);
        return users.map(this::convertToSummary);
    }

    @Transactional(readOnly = true)
    public UserSummaryDto getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new PaymentException("User not found", "USER_NOT_FOUND"));
        return convertToSummary(user);
    }

    public UserSummaryDto manageUser(UserManagementRequest request, Long adminUserId) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new PaymentException("User not found", "USER_NOT_FOUND"));

        if (request.getAction() == UserManagementRequest.UserAction.SUSPEND
                || request.getAction() == UserManagementRequest.UserAction.BAN) {
            if (request.getReason() == null || request.getReason().isBlank()) {
                throw new PaymentException("Reason is required", "REASON_REQUIRED");
            }
        }

        switch (request.getAction()) {
            case ACTIVATE -> {
                user.setIsActive(true);
                user.setSuspensionReason(null);
                user.setAccountLockedUntil(null);
            }
            case SUSPEND -> {
                user.setIsActive(false);
                user.setSuspensionReason(request.getReason());
                if (request.getSuspensionDurationDays() != null && request.getSuspensionDurationDays() > 0) {
                    user.setAccountLockedUntil(LocalDateTime.now().plusDays(request.getSuspensionDurationDays()));
                } else {
                    user.setAccountLockedUntil(null);
                }
            }
            case BAN -> {
                user.setIsActive(false);
                user.setSuspensionReason(request.getReason());
                user.setAccountLockedUntil(null);
            }
        }

        user = userRepository.save(user);
        log.info("Admin {} performed {} for user {}", adminUserId, request.getAction(), user.getId());

        return convertToSummary(user);
    }

    @Transactional(readOnly = true)
    public DashboardStatsDto getDashboardStats() {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfToday = today.atStartOfDay();
        LocalDateTime startOfTomorrow = today.plusDays(1).atStartOfDay();
        LocalDateTime startOfWeek = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).atStartOfDay();
        LocalDateTime startOfMonth = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime startOfLastMonth = today.withDayOfMonth(1).minusMonths(1).atStartOfDay();
        LocalDateTime endOfLastMonth = startOfMonth.minusNanos(1);

        Long totalUsers = userRepository.count();
        Long activeUsers = userRepository.countByIsActiveTrue();
        Long newUsersToday = userRepository.countByCreatedAtBetween(startOfToday, startOfTomorrow);
        Long newUsersThisWeek = userRepository.countByCreatedAtBetween(startOfWeek, startOfTomorrow);
        Long newUsersThisMonth = userRepository.countByCreatedAtBetween(startOfMonth, startOfTomorrow);
        Long newUsersLastMonth = userRepository.countByCreatedAtBetween(startOfLastMonth, endOfLastMonth);

        Long totalVendors = vendorRepository.count();
        Long activeVendors = vendorRepository.countByStatus(VendorStatus.APPROVED);
        Long pendingVendorApplications = vendorRepository.countByStatus(VendorStatus.PENDING);
        Long rejectedVendors = vendorRepository.countByStatus(VendorStatus.REJECTED);
        Long suspendedVendors = vendorRepository.countByStatus(VendorStatus.SUSPENDED);

        Long totalProducts = productRepository.count();
        Long activeProducts = productRepository.countByIsActiveTrue();
        Long outOfStockProducts = productRepository.countByStockLessThanEqual(0);

        Long totalOrders = orderRepository.count();
        Long todayOrders = orderRepository.countByCreatedAtBetween(startOfToday, startOfTomorrow);
        Long thisWeekOrders = orderRepository.countByCreatedAtBetween(startOfWeek, startOfTomorrow);
        Long thisMonthOrders = orderRepository.countByCreatedAtBetween(startOfMonth, startOfTomorrow);
        Long lastMonthOrders = orderRepository.countByCreatedAtBetween(startOfLastMonth, endOfLastMonth);

        Long pendingOrders = orderRepository.countByStatus(OrderStatus.PENDING);
        Long processingOrders = orderRepository.countByStatus(OrderStatus.PROCESSING);
        Long shippedOrders = orderRepository.countByStatus(OrderStatus.SHIPPED);
        Long deliveredOrders = orderRepository.countByStatus(OrderStatus.DELIVERED);
        Long cancelledOrders = orderRepository.countByStatus(OrderStatus.CANCELLED);

        BigDecimal totalRevenue = orderRepository.sumTotal();
        BigDecimal todayRevenue = orderRepository.sumTotalBetween(startOfToday, startOfTomorrow);
        BigDecimal thisWeekRevenue = orderRepository.sumTotalBetween(startOfWeek, startOfTomorrow);
        BigDecimal thisMonthRevenue = orderRepository.sumTotalBetween(startOfMonth, startOfTomorrow);
        BigDecimal lastMonthRevenue = orderRepository.sumTotalBetween(startOfLastMonth, endOfLastMonth);

        BigDecimal totalPayments = paymentRepository.sumAmount();
        BigDecimal pendingPayments = paymentRepository.sumAmountByStatus(PaymentStatus.PENDING)
                .add(paymentRepository.sumAmountByStatus(PaymentStatus.PROCESSING));
        BigDecimal completedPayments = paymentRepository.sumAmountByStatus(PaymentStatus.COMPLETED);
        BigDecimal failedPayments = paymentRepository.sumAmountByStatus(PaymentStatus.FAILED);
        BigDecimal refundedPayments = paymentRepository.sumAmountByStatus(PaymentStatus.REFUNDED)
                .add(paymentRepository.sumAmountByStatus(PaymentStatus.PARTIALLY_REFUNDED));

        BigDecimal averageOrderValue = orderRepository.averageOrderValue();
        Double averageRating = reviewRepository.getAverageRating();
        Integer totalReviews = Math.toIntExact(reviewRepository.count());

        return DashboardStatsDto.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .newUsersToday(newUsersToday)
                .newUsersThisWeek(newUsersThisWeek)
                .newUsersThisMonth(newUsersThisMonth)
                .totalVendors(totalVendors)
                .activeVendors(activeVendors)
                .pendingVendorApplications(pendingVendorApplications)
                .rejectedVendors(rejectedVendors)
                .suspendedVendors(suspendedVendors)
                .totalProducts(totalProducts)
                .activeProducts(activeProducts)
                .outOfStockProducts(outOfStockProducts)
                .pendingProductApprovals(0L)
                .totalOrders(totalOrders)
                .todayOrders(todayOrders)
                .thisWeekOrders(thisWeekOrders)
                .thisMonthOrders(thisMonthOrders)
                .pendingOrders(pendingOrders)
                .processingOrders(processingOrders)
                .shippedOrders(shippedOrders)
                .deliveredOrders(deliveredOrders)
                .cancelledOrders(cancelledOrders)
                .totalRevenue(totalRevenue)
                .todayRevenue(todayRevenue)
                .thisWeekRevenue(thisWeekRevenue)
                .thisMonthRevenue(thisMonthRevenue)
                .platformCommissionEarned(BigDecimal.ZERO)
                .totalPayments(totalPayments)
                .pendingPayments(pendingPayments)
                .completedPayments(completedPayments)
                .failedPayments(failedPayments)
                .refundedPayments(refundedPayments)
                .userGrowthPercentage(percentChange(newUsersThisMonth.doubleValue(), newUsersLastMonth.doubleValue()))
                .revenueGrowthPercentage(percentChange(thisMonthRevenue.doubleValue(), lastMonthRevenue.doubleValue()))
                .orderGrowthPercentage(percentChange(thisMonthOrders.doubleValue(), lastMonthOrders.doubleValue()))
                .averageOrderValue(averageOrderValue)
                .averageRating(averageRating != null ? averageRating : 0.0)
                .totalReviews(totalReviews)
                .build();
    }

    @Transactional(readOnly = true)
    public PlatformMetricsDto getPlatformMetrics(String period) {
        LocalDate today = LocalDate.now();
        LocalDateTime start;
        LocalDateTime end = today.plusDays(1).atStartOfDay();

        switch (period.toUpperCase()) {
            case "DAY" -> start = today.atStartOfDay();
            case "WEEK" -> start = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).atStartOfDay();
            case "YEAR" -> start = today.withDayOfYear(1).atStartOfDay();
            case "MONTH" -> start = today.withDayOfMonth(1).atStartOfDay();
            default -> throw new PaymentException("Invalid period", "INVALID_PERIOD");
        }

        BigDecimal totalRevenue = orderRepository.sumTotalBetween(start, end);
        Long totalOrders = orderRepository.countByCreatedAtBetween(start, end);
        Long totalUsers = userRepository.countByCreatedAtBetween(start, end);
        BigDecimal averageOrderValue = orderRepository.averageOrderValue();

        return PlatformMetricsDto.builder()
                .period(period.toUpperCase())
                .totalRevenue(totalRevenue)
                .totalOrders(totalOrders)
                .totalUsers(totalUsers)
                .averageOrderValue(averageOrderValue)
                .platformCommissionEarned(BigDecimal.ZERO)
                .build();
    }

    private UserSummaryDto convertToSummary(User user) {
        Set<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toSet());

        Long totalOrders = orderRepository.countOrdersByUserId(user.getId());
        Integer totalReviews = Math.toIntExact(reviewRepository.countByUserId(user.getId()));

        return UserSummaryDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phoneNumber(user.getPhoneNumber())
                .isActive(user.getIsActive())
                .isEmailVerified(user.getIsEmailVerified())
                .lastLoginAt(user.getLastLoginAt())
                .roles(roles)
                .isVendor(user.getVendor() != null)
                .vendorBusinessName(user.getVendor() != null ? user.getVendor().getBusinessName() : null)
                .vendorStatus(user.getVendor() != null ? user.getVendor().getStatus().name() : null)
                .totalOrders(totalOrders)
                .totalReviews(totalReviews)
                .failedLoginAttempts(user.getFailedLoginAttempts())
                .accountLockedUntil(user.getAccountLockedUntil())
                .suspensionReason(user.getSuspensionReason())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private double percentChange(double current, double previous) {
        if (previous == 0.0) {
            return current == 0.0 ? 0.0 : 100.0;
        }
        return ((current - previous) / previous) * 100.0;
    }
}

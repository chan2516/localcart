package com.localcart.service;

import com.localcart.dto.admin.DashboardStatsDto;
import com.localcart.dto.admin.AdminAccountDto;
import com.localcart.dto.admin.AdminCreateRequest;
import com.localcart.dto.admin.ContactInfoDto;
import com.localcart.dto.admin.ContactInfoRequest;
import com.localcart.dto.admin.PlatformMetricsDto;
import com.localcart.dto.admin.UserManagementRequest;
import com.localcart.dto.admin.UserSummaryDto;
import com.localcart.entity.Role;
import com.localcart.entity.SiteContactInfo;
import com.localcart.entity.User;
import com.localcart.entity.enums.OrderStatus;
import com.localcart.entity.enums.PaymentStatus;
import com.localcart.entity.enums.RoleType;
import com.localcart.entity.enums.VendorStatus;
import com.localcart.exception.PaymentException;
import com.localcart.repository.OrderRepository;
import com.localcart.repository.PaymentRepository;
import com.localcart.repository.ProductRepository;
import com.localcart.repository.RoleRepository;
import com.localcart.repository.ReviewRepository;
import com.localcart.repository.SiteContactInfoRepository;
import com.localcart.repository.UserRepository;
import com.localcart.repository.VendorRepository;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.Set;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final SiteContactInfoRepository siteContactInfoRepository;

    private static final List<RoleType> ADMIN_ROLES = List.of(RoleType.ADMIN, RoleType.ADMIN_L1, RoleType.ADMIN_L2);

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
        ensureAdminRole(adminUserId);

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
                user.setIsDeleted(false);
                user.setDeletedAt(null);
                user.setSuspensionReason(null);
                user.setAccountLockedUntil(null);
                if (user.getVendor() != null) {
                    user.getVendor().setIsDeleted(false);
                    user.getVendor().setDeletedAt(null);
                    if (user.getVendor().getStatus() == VendorStatus.SUSPENDED) {
                        user.getVendor().setStatus(VendorStatus.APPROVED);
                    }
                }
            }
            case SUSPEND -> {
                user.setIsActive(false);
                user.setIsDeleted(false);
                user.setDeletedAt(null);
                user.setSuspensionReason(request.getReason());
                if (request.getSuspensionDurationDays() != null && request.getSuspensionDurationDays() > 0) {
                    user.setAccountLockedUntil(LocalDateTime.now().plusDays(request.getSuspensionDurationDays()));
                } else {
                    user.setAccountLockedUntil(null);
                }
                if (user.getVendor() != null) {
                    user.getVendor().setStatus(VendorStatus.SUSPENDED);
                    user.getVendor().setRejectionReason(request.getReason());
                }
            }
            case BAN -> {
                user.setIsActive(false);
                user.setIsDeleted(true);
                user.setDeletedAt(LocalDateTime.now());
                user.setSuspensionReason(
                        request.getReason() != null && !request.getReason().isBlank()
                                ? request.getReason()
                                : "You are banned. Please connect helpdesk for verification."
                );
                user.setAccountLockedUntil(null);
                if (user.getVendor() != null) {
                    user.getVendor().setStatus(VendorStatus.SUSPENDED);
                    user.getVendor().setIsDeleted(true);
                    user.getVendor().setDeletedAt(LocalDateTime.now());
                    user.getVendor().setRejectionReason(user.getSuspensionReason());
                }
            }
        }

        user = userRepository.save(user);
        log.info("Admin {} performed {} for user {}", adminUserId, request.getAction(), user.getId());

        return convertToSummary(user);
    }

    @Transactional(readOnly = true)
    public Page<AdminAccountDto> getAllAdminAccounts(Pageable pageable) {
        return userRepository.findByRoleNames(ADMIN_ROLES, pageable).map(this::convertToAdminAccountDto);
    }

    public AdminAccountDto createSecondLevelAdmin(AdminCreateRequest request, Long creatorAdminId) {
        ensureLevelOneAdmin(creatorAdminId);

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new PaymentException("Email already registered", "EMAIL_EXISTS");
        }

        Role l2Role = roleRepository.findByName(RoleType.ADMIN_L2)
            .orElseThrow(() -> new PaymentException(
                "ADMIN_L2 role is not configured. Please apply the latest database migrations.",
                "ROLE_NOT_FOUND"
            ));

        User user = User.builder()
                .email(request.getEmail().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .isActive(true)
                .isEmailVerified(true)
                .roles(Set.of(l2Role))
                .build();

        User saved = userRepository.save(user);
        log.info("Level-1 admin {} created level-2 admin {}", creatorAdminId, saved.getId());

        return convertToAdminAccountDto(saved);
    }

    public AdminAccountDto setAdminAccountStatus(Long targetAdminId, boolean active, Long actingAdminId) {
        ensureLevelOneAdmin(actingAdminId);

        if (targetAdminId.equals(actingAdminId)) {
            throw new PaymentException("You cannot modify your own admin account state", "INVALID_OPERATION");
        }

        User adminUser = userRepository.findByIdAndRoleNames(targetAdminId, ADMIN_ROLES)
                .orElseThrow(() -> new PaymentException("Admin user not found", "USER_NOT_FOUND"));

        boolean targetIsLevelOne = hasRole(adminUser, RoleType.ADMIN) || hasRole(adminUser, RoleType.ADMIN_L1);
        if (targetIsLevelOne) {
            throw new PaymentException("Level-1 admins cannot be modified by this operation", "INVALID_OPERATION");
        }

        adminUser.setIsActive(active);
        if (!active) {
            adminUser.setSuspensionReason("Restricted by level-1 admin");
        } else if ("Restricted by level-1 admin".equals(adminUser.getSuspensionReason())) {
            adminUser.setSuspensionReason(null);
        }

        User updated = userRepository.save(adminUser);
        log.info("Level-1 admin {} set admin {} active={}", actingAdminId, targetAdminId, active);
        return convertToAdminAccountDto(updated);
    }

    public ContactInfoDto getContactInfo() {
        SiteContactInfo info = siteContactInfoRepository.findTopByOrderByIdAsc()
                .orElseGet(this::createDefaultContactInfo);
        if (applyMissingContactDefaults(info)) {
            info = siteContactInfoRepository.save(info);
        }
        return mapToContactInfo(info);
    }

    public ContactInfoDto updateContactInfo(ContactInfoRequest request, Long actingAdminId) {
        ensureLevelOneAdmin(actingAdminId);

        SiteContactInfo info = siteContactInfoRepository.findTopByOrderByIdAsc()
                .orElseGet(this::createDefaultContactInfo);

        info.setPageTitle(request.getPageTitle().trim());
        info.setPageSubtitle(request.getPageSubtitle().trim());
        info.setAnnouncementTitle(request.getAnnouncementTitle().trim());
        info.setAnnouncementBody(request.getAnnouncementBody().trim());
        info.setSupportEmail(request.getSupportEmail().trim());
        info.setSupportPhone(request.getSupportPhone().trim());
        info.setSupportAddress(request.getSupportAddress().trim());
        info.setSupportHours(request.getSupportHours().trim());
        info.setFaqTitle(request.getFaqTitle().trim());
        info.setFaqBody(request.getFaqBody().trim());

        SiteContactInfo saved = siteContactInfoRepository.save(info);
        log.info("Level-1 admin {} updated contact info", actingAdminId);
        return mapToContactInfo(saved);
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
                .isDeleted(user.getIsDeleted())
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

    private AdminAccountDto convertToAdminAccountDto(User user) {
        String level = hasRole(user, RoleType.ADMIN_L2)
                ? "LEVEL_2"
                : "LEVEL_1";

        return AdminAccountDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .isActive(user.getIsActive())
                .level(level)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private ContactInfoDto mapToContactInfo(SiteContactInfo info) {
        return ContactInfoDto.builder()
                .pageTitle(info.getPageTitle())
                .pageSubtitle(info.getPageSubtitle())
                .announcementTitle(info.getAnnouncementTitle())
                .announcementBody(info.getAnnouncementBody())
                .supportEmail(info.getSupportEmail())
                .supportPhone(info.getSupportPhone())
                .supportAddress(info.getSupportAddress())
                .supportHours(info.getSupportHours())
                .faqTitle(info.getFaqTitle())
                .faqBody(info.getFaqBody())
                .build();
    }

    private SiteContactInfo createDefaultContactInfo() {
        SiteContactInfo defaultInfo = SiteContactInfo.builder()
            .pageTitle("Contact LocalCart")
            .pageSubtitle("We are here to help customers and vendors with fast, friendly support.")
            .announcementTitle("Need quick assistance?")
            .announcementBody("Share your issue with account details, order number, or vendor name so our support team can resolve it quickly. For admin escalations, include screenshots and a short timeline of events.")
                .supportEmail("support@localcart.com")
                .supportPhone("+1-800-LOCALCART")
                .supportAddress("LocalCart Support Center")
                .supportHours("Mon-Sat, 9:00 AM - 6:00 PM")
            .faqTitle("Before you contact us")
            .faqBody("Most order updates are available in your dashboard under Orders. Vendors can track approvals and policy updates in Vendor Dashboard. If your issue remains unresolved, contact support and mention your registered email for faster verification.")
                .build();
        return siteContactInfoRepository.save(defaultInfo);
    }

    private boolean applyMissingContactDefaults(SiteContactInfo info) {
        boolean changed = false;

        if (isBlank(info.getPageTitle())) {
            info.setPageTitle("Contact LocalCart");
            changed = true;
        }
        if (isBlank(info.getPageSubtitle())) {
            info.setPageSubtitle("We are here to help customers and vendors with fast, friendly support.");
            changed = true;
        }
        if (isBlank(info.getAnnouncementTitle())) {
            info.setAnnouncementTitle("Need quick assistance?");
            changed = true;
        }
        if (isBlank(info.getAnnouncementBody())) {
            info.setAnnouncementBody("Share your issue with account details, order number, or vendor name so our support team can resolve it quickly. For admin escalations, include screenshots and a short timeline of events.");
            changed = true;
        }
        if (isBlank(info.getFaqTitle())) {
            info.setFaqTitle("Before you contact us");
            changed = true;
        }
        if (isBlank(info.getFaqBody())) {
            info.setFaqBody("Most order updates are available in your dashboard under Orders. Vendors can track approvals and policy updates in Vendor Dashboard. If your issue remains unresolved, contact support and mention your registered email for faster verification.");
            changed = true;
        }

        return changed;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private void ensureAdminRole(Long adminUserId) {
        User admin = userRepository.findByIdAndRoleNames(adminUserId, ADMIN_ROLES)
                .orElseThrow(() -> new PaymentException("Admin role is required", "UNAUTHORIZED"));
        if (!Boolean.TRUE.equals(admin.getIsActive())) {
            throw new PaymentException("Admin account is inactive", "UNAUTHORIZED");
        }
    }

    private void ensureLevelOneAdmin(Long adminUserId) {
        User admin = userRepository.findByIdAndRoleNames(adminUserId, ADMIN_ROLES)
                .orElseThrow(() -> new PaymentException("Admin role is required", "UNAUTHORIZED"));

        boolean levelOne = hasRole(admin, RoleType.ADMIN) || hasRole(admin, RoleType.ADMIN_L1);
        if (!levelOne) {
            throw new PaymentException("Level-1 admin permission is required", "UNAUTHORIZED");
        }
        if (!Boolean.TRUE.equals(admin.getIsActive())) {
            throw new PaymentException("Admin account is inactive", "UNAUTHORIZED");
        }
    }

    private boolean hasRole(User user, RoleType roleType) {
        return user.getRoles().stream().anyMatch(role -> role.getName() == roleType);
    }

    private double percentChange(double current, double previous) {
        if (previous == 0.0) {
            return current == 0.0 ? 0.0 : 100.0;
        }
        return ((current - previous) / previous) * 100.0;
    }
}

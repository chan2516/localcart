package com.localcart.controller;

import com.localcart.dto.coupon.CouponDto;
import com.localcart.dto.coupon.CreateCouponRequest;
import com.localcart.entity.Coupon;
import com.localcart.security.CustomUserDetails;
import com.localcart.service.CouponService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    @GetMapping("/me")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<List<CouponDto>> getMyCoupons(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(couponService.getVendorCoupons(userDetails.getVendorId()).stream().map(couponService::toDto).toList());
    }

    @PostMapping
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<CouponDto> createCoupon(
            @Valid @RequestBody CreateCouponRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Coupon coupon = couponService.createCoupon(userDetails.getVendorId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(couponService.toDto(coupon));
    }

    @PostMapping("/apply")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, BigDecimal>> applyCoupon(
            @RequestParam String code,
            @RequestParam BigDecimal amount) {
        BigDecimal discount = couponService.applyCoupon(code, amount);
        return ResponseEntity.ok(Map.of("discount", discount));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<Map<String, String>> deactivateCoupon(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        couponService.deactivateCoupon(id, userDetails.getVendorId());
        return ResponseEntity.ok(Map.of("message", "Coupon deactivated successfully"));
    }
}

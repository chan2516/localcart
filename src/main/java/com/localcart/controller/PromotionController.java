package com.localcart.controller;

import com.localcart.dto.promotion.CreatePromotionRequest;
import com.localcart.dto.promotion.PromotionDto;
import com.localcart.security.CustomUserDetails;
import com.localcart.service.PromotionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/promotions")
@RequiredArgsConstructor
public class PromotionController {

    private final PromotionService promotionService;

    @GetMapping("/me")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<List<PromotionDto>> getMyPromotions(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(promotionService.getVendorPromotions(userDetails.getVendorId()));
    }

    @PostMapping
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<PromotionDto> createPromotion(
            @Valid @RequestBody CreatePromotionRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        PromotionDto dto = promotionService.createPromotion(userDetails.getVendorId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<PromotionDto> updatePromotion(
            @PathVariable Long id,
            @Valid @RequestBody CreatePromotionRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(promotionService.updatePromotion(id, userDetails.getVendorId(), request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<Map<String, String>> deletePromotion(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        promotionService.deletePromotion(id, userDetails.getVendorId());
        return ResponseEntity.ok(Map.of("message", "Promotion deleted successfully"));
    }
}

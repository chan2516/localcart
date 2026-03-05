package com.localcart.service;

import com.localcart.dto.promotion.CreatePromotionRequest;
import com.localcart.dto.promotion.PromotionDto;
import com.localcart.entity.Promotion;
import com.localcart.entity.Vendor;
import com.localcart.exception.PaymentException;
import com.localcart.repository.PromotionRepository;
import com.localcart.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PromotionService {

    private final PromotionRepository promotionRepository;
    private final VendorRepository vendorRepository;

    public PromotionDto createPromotion(Long vendorId, CreatePromotionRequest request) {
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new PaymentException("Vendor not found", "VENDOR_NOT_FOUND"));

        Promotion promotion = Promotion.builder()
                .vendor(vendor)
                .promotionType(request.getPromotionType())
                .title(request.getTitle())
                .description(request.getDescription())
                .code(request.getCode())
                .valueText(request.getValueText())
                .startsAt(request.getStartsAt())
                .endsAt(request.getEndsAt())
                .isActive(true)
                .build();

        return toDto(promotionRepository.save(promotion));
    }

    @Transactional(readOnly = true)
    public List<PromotionDto> getVendorPromotions(Long vendorId) {
        return promotionRepository.findByVendorIdOrderByCreatedAtDesc(vendorId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public PromotionDto updatePromotion(Long promotionId, Long vendorId, CreatePromotionRequest request) {
        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new PaymentException("Promotion not found", "PROMOTION_NOT_FOUND"));

        if (!promotion.getVendor().getId().equals(vendorId)) {
            throw new PaymentException("Unauthorized", "UNAUTHORIZED");
        }

        promotion.setPromotionType(request.getPromotionType());
        promotion.setTitle(request.getTitle());
        promotion.setDescription(request.getDescription());
        promotion.setCode(request.getCode());
        promotion.setValueText(request.getValueText());
        promotion.setStartsAt(request.getStartsAt());
        promotion.setEndsAt(request.getEndsAt());

        return toDto(promotionRepository.save(promotion));
    }

    public void deletePromotion(Long promotionId, Long vendorId) {
        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new PaymentException("Promotion not found", "PROMOTION_NOT_FOUND"));

        if (!promotion.getVendor().getId().equals(vendorId)) {
            throw new PaymentException("Unauthorized", "UNAUTHORIZED");
        }

        promotionRepository.delete(promotion);
    }

    public PromotionDto toDto(Promotion promotion) {
        return PromotionDto.builder()
                .id(promotion.getId())
                .vendorId(promotion.getVendor().getId())
                .promotionType(promotion.getPromotionType())
                .title(promotion.getTitle())
                .description(promotion.getDescription())
                .code(promotion.getCode())
                .valueText(promotion.getValueText())
                .startsAt(promotion.getStartsAt() != null ? promotion.getStartsAt().toString() : null)
                .endsAt(promotion.getEndsAt() != null ? promotion.getEndsAt().toString() : null)
                .isActive(promotion.getIsActive())
                .createdAt(promotion.getCreatedAt() != null ? promotion.getCreatedAt().toString() : null)
                .build();
    }
}

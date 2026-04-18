package com.localcart.dto.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductImageUploadResponse {
    private List<String> urls;
    private Integer uploadedCount;
    private String provider;
}

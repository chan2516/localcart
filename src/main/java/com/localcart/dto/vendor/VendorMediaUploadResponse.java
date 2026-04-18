package com.localcart.dto.vendor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorMediaUploadResponse {
    private String url;
    private String fileName;
    private String mimeType;
    private String provider;
}
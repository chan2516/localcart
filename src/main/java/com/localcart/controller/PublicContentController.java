package com.localcart.controller;

import com.localcart.dto.admin.ContactInfoDto;
import com.localcart.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
public class PublicContentController {

    private final AdminService adminService;

    @GetMapping("/contact-info")
    public ResponseEntity<ContactInfoDto> getPublicContactInfo() {
        return ResponseEntity.ok(adminService.getContactInfo());
    }
}

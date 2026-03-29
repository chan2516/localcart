package com.localcart.dto.admin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ContactInfoRequest {

    @NotBlank(message = "Page title is required")
    @Size(max = 120)
    private String pageTitle;

    @NotBlank(message = "Page subtitle is required")
    @Size(max = 300)
    private String pageSubtitle;

    @NotBlank(message = "Announcement title is required")
    @Size(max = 140)
    private String announcementTitle;

    @NotBlank(message = "Announcement content is required")
    @Size(max = 2000)
    private String announcementBody;

    @NotBlank(message = "Support email is required")
    @Email(message = "Invalid support email")
    @Size(max = 100)
    private String supportEmail;

    @NotBlank(message = "Support phone is required")
    @Size(max = 30)
    private String supportPhone;

    @NotBlank(message = "Support address is required")
    @Size(max = 255)
    private String supportAddress;

    @NotBlank(message = "Support hours are required")
    @Size(max = 120)
    private String supportHours;

    @NotBlank(message = "FAQ title is required")
    @Size(max = 120)
    private String faqTitle;

    @NotBlank(message = "FAQ body is required")
    @Size(max = 2000)
    private String faqBody;
}

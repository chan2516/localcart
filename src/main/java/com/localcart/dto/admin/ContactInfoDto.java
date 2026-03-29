package com.localcart.dto.admin;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ContactInfoDto {
    private String pageTitle;
    private String pageSubtitle;
    private String announcementTitle;
    private String announcementBody;
    private String supportEmail;
    private String supportPhone;
    private String supportAddress;
    private String supportHours;
    private String faqTitle;
    private String faqBody;
}

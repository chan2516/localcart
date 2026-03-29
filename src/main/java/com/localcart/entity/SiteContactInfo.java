package com.localcart.entity;

import com.localcart.entity.base.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "site_contact_info")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SiteContactInfo extends AuditableEntity {

    @Column(name = "page_title", length = 120)
    private String pageTitle;

    @Column(name = "page_subtitle", length = 300)
    private String pageSubtitle;

    @Column(name = "announcement_title", length = 140)
    private String announcementTitle;

    @Column(name = "announcement_body", length = 2000)
    private String announcementBody;

    @Column(name = "support_email", nullable = false, length = 100)
    private String supportEmail;

    @Column(name = "support_phone", nullable = false, length = 30)
    private String supportPhone;

    @Column(name = "support_address", nullable = false, length = 255)
    private String supportAddress;

    @Column(name = "support_hours", nullable = false, length = 120)
    private String supportHours;

    @Column(name = "faq_title", length = 120)
    private String faqTitle;

    @Column(name = "faq_body", length = 2000)
    private String faqBody;
}

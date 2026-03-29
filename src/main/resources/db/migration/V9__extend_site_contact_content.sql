-- V9__extend_site_contact_content.sql
-- Extend Contact Us content to support admin-edited page sections and live preview.

ALTER TABLE site_contact_info
    ADD COLUMN IF NOT EXISTS page_title VARCHAR(120),
    ADD COLUMN IF NOT EXISTS page_subtitle VARCHAR(300),
    ADD COLUMN IF NOT EXISTS announcement_title VARCHAR(140),
    ADD COLUMN IF NOT EXISTS announcement_body VARCHAR(2000),
    ADD COLUMN IF NOT EXISTS faq_title VARCHAR(120),
    ADD COLUMN IF NOT EXISTS faq_body VARCHAR(2000);

UPDATE site_contact_info
SET
    page_title = COALESCE(page_title, 'Contact LocalCart'),
    page_subtitle = COALESCE(page_subtitle, 'We are here to help customers and vendors with fast, friendly support.'),
    announcement_title = COALESCE(announcement_title, 'Need quick assistance?'),
    announcement_body = COALESCE(announcement_body, 'Share your issue with account details, order number, or vendor name so our support team can resolve it quickly. For admin escalations, include screenshots and a short timeline of events.'),
    faq_title = COALESCE(faq_title, 'Before you contact us'),
    faq_body = COALESCE(faq_body, 'Most order updates are available in your dashboard under Orders. Vendors can track approvals and policy updates in Vendor Dashboard. If your issue remains unresolved, contact support and mention your registered email for faster verification.')
WHERE id = 1;

ALTER TABLE site_contact_info
    ALTER COLUMN page_title SET NOT NULL,
    ALTER COLUMN page_subtitle SET NOT NULL,
    ALTER COLUMN announcement_title SET NOT NULL,
    ALTER COLUMN announcement_body SET NOT NULL,
    ALTER COLUMN faq_title SET NOT NULL,
    ALTER COLUMN faq_body SET NOT NULL;

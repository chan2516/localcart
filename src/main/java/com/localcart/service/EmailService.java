package com.localcart.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from:no-reply@localcart.com}")
    private String fromAddress;

    public void sendPasswordResetEmail(String to, String resetLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setFrom(fromAddress);
        message.setSubject("Reset your LocalCart password");
        message.setText("We received a request to reset your LocalCart password.\n\n" +
                "Use the link below to set a new password:\n" + resetLink + "\n\n" +
                "If you did not request this, you can ignore this email.");

        mailSender.send(message);
        log.info("Password reset email sent to {}", to);
    }

    public void sendVendorApprovedEmail(String to, String businessName) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setFrom(fromAddress);
        message.setSubject("Your LocalCart Vendor Account is Approved!");
        message.setText("Congratulations " + businessName + "!\n\n" +
                "Your vendor account has been approved by our admin team.\n" +
                "You can now start adding products to your store.\n\n" +
                "Login to your dashboard: https://app.localcart.com/vendor/dashboard\n\n" +
                "Thank you for joining LocalCart!");

        mailSender.send(message);
        log.info("Vendor approval email sent to {}", to);
    }
}

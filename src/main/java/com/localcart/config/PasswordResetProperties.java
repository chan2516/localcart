package com.localcart.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.password-reset")
@Getter
@Setter
public class PasswordResetProperties {

    private String baseUrl;
    private long tokenExpiration;
}

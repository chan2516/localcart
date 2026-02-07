package com.localcart.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "jwt")
@Getter
@Setter
public class JwtConfig {
    
    private String secret;
    private long accessTokenExpiration;  // in milliseconds
    private long refreshTokenExpiration; // in milliseconds
    private String issuer;
    
}

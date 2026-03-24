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
    
    private String secret = "dev-secret-key-change-in-production-with-32-byte-base64";
    private long accessTokenExpiration = 900000L;  // in milliseconds
    private long refreshTokenExpiration = 604800000L; // in milliseconds
    private String issuer = "LocalCart";
    
}

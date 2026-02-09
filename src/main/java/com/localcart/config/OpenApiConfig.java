package com.localcart.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Swagger/OpenAPI Configuration
 * 
 * Provides interactive API documentation at:
 * - Swagger UI: http://localhost:8080/swagger-ui.html
 * - OpenAPI JSON: http://localhost:8080/v3/api-docs
 * 
 * Why do we need this?
 * 1. **Frontend Development**: Developers can see all available endpoints, request/response formats
 * 2. **Testing**: Interactive testing of APIs without writing code
 * 3. **Documentation**: Auto-generated, always up-to-date API docs
 * 4. **Client Generation**: Can generate client SDKs in multiple languages
 * 5. **Collaboration**: Share API contracts with team members
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI localCartOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("LocalCart E-Commerce API")
                        .description("Complete REST API for LocalCart multi-vendor marketplace platform. " +
                                "Supports user authentication, product catalog, shopping cart, orders, payments, and vendor management.")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("LocalCart Team")
                                .email("support@localcart.com")
                                .url("https://localcart.com"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8080")
                                .description("Development Server"),
                        new Server()
                                .url("https://api.localcart.com")
                                .description("Production Server")))
                .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
                .components(new io.swagger.v3.oas.models.Components()
                        .addSecuritySchemes("Bearer Authentication",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Enter JWT token from /auth/login or /auth/register")));
    }
}

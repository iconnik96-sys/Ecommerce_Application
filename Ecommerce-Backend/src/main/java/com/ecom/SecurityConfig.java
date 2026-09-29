package com.ecom;

import com.ecom.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.ArrayList;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> allowedOriginPatterns = new ArrayList<>(List.of(
                "http://localhost:*",
                "https://*.vercel.app",
                "https://*.netlify.app",
                "https://*.onrender.com"
        ));

        // Read all possible environment variable names for frontend URL(s)
        String envOrigins = System.getenv("FRONTEND_URL");
        if (envOrigins == null || envOrigins.isBlank()) {
            envOrigins = System.getenv("FRONTEND_URL_TEST");
        }
        if (envOrigins == null || envOrigins.isBlank()) {
            envOrigins = System.getenv("CORS_ALLOWED_ORIGINS");
        }
        if (envOrigins != null && !envOrigins.isBlank()) {
            for (String o : envOrigins.split(",")) {
                String trimmed = o.trim();
                if (!trimmed.isEmpty() && !allowedOriginPatterns.contains(trimmed)) {
                    allowedOriginPatterns.add(trimmed);
                }
            }
        }

        configuration.setAllowedOriginPatterns(allowedOriginPatterns);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization", "Content-Disposition"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth

                        // Public APIs
                        .requestMatchers(
                                "/health",
                                "/api/health",
                                "/auth/**",
                                "/ecom/users/register",
                                "/ecom/products/getAllProducts",
                                "/ecom/products/getByName/**",
                                "/api/ai/recommendations/**",
                                "/api/ai/review-summary/**"
                        ).permitAll()

                        // Admin-only APIs
                        .requestMatchers(
                                "/ecom/products/addProduct",
                                "/ecom/products/deleteproduct/**",
                                "/ecom/users/getall",
                                "/ecom/users/deleteuser/**",
                                "/api/ai/admin/**"
                        ).hasRole("ADMIN")

                        // Logged-in users (AI chat, search, and all other endpoints)
                        .requestMatchers(
                                "/ecom/users/getbyemail/**",
                                "/ecom/users/editinfo/**",
                                "/api/ai/chat",
                                "/api/ai/search"
                        ).authenticated()

                        .anyRequest()
                        .authenticated()
                )
                .addFilterBefore(
                        jwtAuthFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    AuthenticationManager authenticationManager(
            AuthenticationConfiguration config
    ) throws Exception {
        return config.getAuthenticationManager();
    }
}
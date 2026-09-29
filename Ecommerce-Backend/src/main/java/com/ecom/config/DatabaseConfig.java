package com.ecom.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    @Value("${spring.datasource.url:}")
    private String rawUrl;

    @Value("${spring.datasource.username:}")
    private String username;

    @Value("${spring.datasource.password:}")
    private String password;

    @Value("${spring.datasource.driver-class-name:org.postgresql.Driver}")
    private String driverClassName;

    @Bean
    @Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();

        String url = rawUrl;
        // Check system environment directly as fallback for cloud environments
        if (url == null || url.isBlank()) {
            url = System.getenv("DATABASE_URL");
        }
        if (url == null || url.isBlank()) {
            url = System.getenv("DB_URL");
        }
        if (url == null || url.isBlank()) {
            url = "jdbc:postgresql://localhost:5432/ecommerce_db";
        }

        String user = username;
        String pass = password;

        // Auto-convert standard cloud postgres:// or postgresql:// URLs into valid JDBC format
        if (url.startsWith("postgres://") || (url.startsWith("postgresql://") && !url.startsWith("jdbc:"))) {
            try {
                String uriString = url.startsWith("postgres://")
                        ? "postgresql://" + url.substring("postgres://".length())
                        : url;
                URI uri = URI.create(uriString);

                String host = uri.getHost();
                int port = uri.getPort() == -1 ? 5432 : uri.getPort();
                String path = uri.getPath() != null && !uri.getPath().isEmpty() ? uri.getPath() : "/postgres";

                url = "jdbc:postgresql://" + host + ":" + port + path;
                if (uri.getQuery() != null && !uri.getQuery().isBlank()) {
                    url += "?" + uri.getQuery();
                }

                // Extract credentials if provided in URL (e.g. postgres://user:password@host/db)
                if (uri.getUserInfo() != null) {
                    String[] userInfoParts = uri.getUserInfo().split(":", 2);
                    if ((user == null || user.isBlank()) && userInfoParts.length > 0) {
                        user = userInfoParts[0];
                    }
                    if ((pass == null || pass.isBlank()) && userInfoParts.length > 1) {
                        pass = userInfoParts[1];
                    }
                }
            } catch (Exception e) {
                if (!url.startsWith("jdbc:")) {
                    url = "jdbc:" + url;
                }
            }
        }

        // Ensure sslmode=require for Supabase and cloud PostgreSQL
        if (url != null && (url.contains("supabase.co") || url.contains("supabase.com") || url.contains("neon.tech") || url.contains("render.com"))) {
            if (!url.contains("sslmode=")) {
                url += (url.contains("?") ? "&" : "?") + "sslmode=require";
            }
        }

        config.setJdbcUrl(url);
        if (user != null && !user.isBlank()) {
            config.setUsername(user);
        }
        if (pass != null && !pass.isBlank()) {
            config.setPassword(pass);
        }
        config.setDriverClassName(driverClassName);

        // Connection pool defaults optimized for Supabase pooler & Render free tier
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setConnectionTimeout(30000);
        config.setIdleTimeout(600000);
        config.setMaxLifetime(1800000);

        return new HikariDataSource(config);
    }
}

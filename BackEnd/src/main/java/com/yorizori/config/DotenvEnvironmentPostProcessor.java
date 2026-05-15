package com.yorizori.config;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final String PROPERTY_SOURCE_NAME = "dotenv";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Map<String, Object> properties = new LinkedHashMap<>();
        loadDotenv(".", environment, properties);
        loadDotenv("BackEnd", environment, properties);
        normalizeDatabaseConnection(environment, properties);

        if (!properties.isEmpty()) {
            environment.getPropertySources().addLast(new MapPropertySource(PROPERTY_SOURCE_NAME, properties));
        }
    }

    private void loadDotenv(
            String directory,
            ConfigurableEnvironment environment,
            Map<String, Object> properties
    ) {
        Path dotenvPath = Path.of(directory, ".env");
        if (!Files.exists(dotenvPath)) {
            return;
        }

        try {
            for (String line : Files.readAllLines(dotenvPath, StandardCharsets.UTF_8)) {
                DotenvEntry entry = parseDotenvLine(line);
                if (entry != null
                        && environment.getProperty(entry.key()) == null
                        && !properties.containsKey(entry.key())) {
                    properties.put(entry.key(), entry.value());
                }
            }
        } catch (Exception ignored) {
            // Missing or malformed local .env files should not prevent non-local profiles from starting.
        }
    }

    private DotenvEntry parseDotenvLine(String line) {
        if (line == null) {
            return null;
        }
        String trimmed = line.trim();
        if (trimmed.isEmpty() || trimmed.startsWith("#")) {
            return null;
        }
        int separator = trimmed.indexOf('=');
        if (separator <= 0) {
            return null;
        }
        String key = trimmed.substring(0, separator).trim();
        String value = trimmed.substring(separator + 1);
        if (!isEnvKey(key)) {
            return null;
        }
        return new DotenvEntry(key, stripWrappingQuotes(value));
    }

    private boolean isEnvKey(String key) {
        return key != null && key.matches("[A-Za-z_][A-Za-z0-9_]*");
    }

    private String stripWrappingQuotes(String value) {
        if (value == null || value.length() < 2) {
            return value;
        }
        char first = value.charAt(0);
        char last = value.charAt(value.length() - 1);
        if ((first == '"' && last == '"') || (first == '\'' && last == '\'')) {
            return value.substring(1, value.length() - 1);
        }
        return value;
    }

    private void normalizeDatabaseConnection(
            ConfigurableEnvironment environment,
            Map<String, Object> properties
    ) {
        if (hasText(valueOf(environment, properties, "DB_URL"))) {
            return;
        }

        String connection = valueOf(environment, properties, "DB_CONNECTION");
        if (!hasText(connection)) {
            return;
        }

        DatabaseConnection normalized = normalizeConnection(connection.trim());
        if (normalized == null) {
            return;
        }

        properties.put("DB_URL", normalized.jdbcUrl());
        if (hasText(normalized.username())) {
            properties.put("DB_CONNECTION_USERNAME", normalized.username());
        }
        if (hasText(normalized.password())) {
            properties.put("DB_CONNECTION_PASSWORD", normalized.password());
        }
    }

    private DatabaseConnection normalizeConnection(String connection) {
        if (connection.startsWith("jdbc:mysql://")) {
            return new DatabaseConnection(connection, null, null);
        }
        if (!connection.startsWith("mysql://")) {
            return null;
        }

        URI uri = URI.create(connection);
        if (!hasText(uri.getHost())) {
            return null;
        }

        StringBuilder jdbcUrl = new StringBuilder("jdbc:mysql://").append(uri.getHost());
        if (uri.getPort() > 0) {
            jdbcUrl.append(":").append(uri.getPort());
        }
        if (hasText(uri.getPath())) {
            jdbcUrl.append(uri.getPath());
        }
        if (hasText(uri.getRawQuery())) {
            jdbcUrl.append("?").append(uri.getRawQuery());
        }

        String username = null;
        String password = null;
        if (hasText(uri.getRawUserInfo())) {
            String[] parts = uri.getRawUserInfo().split(":", 2);
            username = decode(parts[0]);
            if (parts.length > 1) {
                password = decode(parts[1]);
            }
        }
        return new DatabaseConnection(jdbcUrl.toString(), username, password);
    }

    private String valueOf(ConfigurableEnvironment environment, Map<String, Object> properties, String key) {
        Object value = properties.get(key);
        return value == null ? environment.getProperty(key) : String.valueOf(value);
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }

    private record DatabaseConnection(String jdbcUrl, String username, String password) {
    }

    private record DotenvEntry(String key, String value) {
    }
}

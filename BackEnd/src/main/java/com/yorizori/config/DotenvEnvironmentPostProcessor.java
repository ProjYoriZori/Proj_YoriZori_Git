package com.yorizori.config;

import io.github.cdimascio.dotenv.Dotenv;
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

        if (!properties.isEmpty()) {
            environment.getPropertySources().addLast(new MapPropertySource(PROPERTY_SOURCE_NAME, properties));
        }
    }

    private void loadDotenv(
            String directory,
            ConfigurableEnvironment environment,
            Map<String, Object> properties
    ) {
        if (!Files.exists(Path.of(directory, ".env"))) {
            return;
        }

        Dotenv dotenv = Dotenv.configure()
                .directory(directory)
                .ignoreIfMalformed()
                .ignoreIfMissing()
                .load();

        dotenv.entries().forEach(entry -> {
            if (environment.getProperty(entry.getKey()) == null && !properties.containsKey(entry.getKey())) {
                properties.put(entry.getKey(), entry.getValue());
            }
        });
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }
}

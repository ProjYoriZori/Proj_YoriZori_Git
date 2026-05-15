package com.yorizori.config;

import java.util.List;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class SchemaMigrationRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public SchemaMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        createFeatureTables();
        normalizeColumn("ingest_jobs", "source", "VARCHAR(50) NOT NULL DEFAULT 'COOKRCP01'");
        normalizeColumn("ingest_jobs", "job_type", "VARCHAR(50) NOT NULL DEFAULT 'RECIPE_INGEST'");
        relaxStrictColumns("ingest_jobs");
        relaxStrictColumns("api_raw_responses");
    }

    private void createFeatureTables() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    user_id BIGINT NOT NULL AUTO_INCREMENT,
                    email VARCHAR(255) NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    nickname VARCHAR(100) NULL,
                    gender VARCHAR(20) NULL,
                    age INT NULL,
                    height_cm DECIMAL(6,2) NULL,
                    weight_kg DECIMAL(6,2) NULL,
                    goal VARCHAR(30) NOT NULL DEFAULT 'MAINTAIN',
                    activity_level VARCHAR(30) NOT NULL DEFAULT 'NORMAL',
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (user_id),
                    UNIQUE KEY uk_users_email (email)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS pantry_items (
                    pantry_item_id BIGINT NOT NULL AUTO_INCREMENT,
                    user_id BIGINT NOT NULL,
                    name VARCHAR(120) NOT NULL,
                    normalized_name VARCHAR(120) NOT NULL,
                    quantity_text VARCHAR(120) NULL,
                    expires_at DATE NULL,
                    memo VARCHAR(500) NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (pantry_item_id),
                    UNIQUE KEY uk_pantry_user_name (user_id, normalized_name),
                    INDEX idx_pantry_user (user_id),
                    CONSTRAINT fk_pantry_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS avoid_ingredients (
                    avoid_ingredient_id BIGINT NOT NULL AUTO_INCREMENT,
                    user_id BIGINT NOT NULL,
                    name VARCHAR(120) NOT NULL,
                    normalized_name VARCHAR(120) NOT NULL,
                    reason VARCHAR(50) NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (avoid_ingredient_id),
                    UNIQUE KEY uk_avoid_user_name (user_id, normalized_name),
                    CONSTRAINT fk_avoid_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS shopping_items (
                    shopping_item_id BIGINT NOT NULL AUTO_INCREMENT,
                    user_id BIGINT NOT NULL,
                    recipe_id BIGINT NULL,
                    name VARCHAR(120) NOT NULL,
                    normalized_name VARCHAR(120) NOT NULL,
                    checked BOOLEAN NOT NULL DEFAULT FALSE,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (shopping_item_id),
                    UNIQUE KEY uk_shopping_user_recipe_name (user_id, recipe_id, normalized_name),
                    INDEX idx_shopping_user (user_id),
                    CONSTRAINT fk_shopping_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS nutrition_logs (
                    nutrition_log_id BIGINT NOT NULL AUTO_INCREMENT,
                    user_id BIGINT NOT NULL,
                    recipe_id BIGINT NULL,
                    custom_food_name VARCHAR(255) NULL,
                    meal_date DATE NOT NULL,
                    meal_time VARCHAR(30) NOT NULL,
                    multiplier DECIMAL(8,2) NOT NULL DEFAULT 1,
                    kcal DECIMAL(10,2) NOT NULL DEFAULT 0,
                    carbohydrate_g DECIMAL(10,2) NOT NULL DEFAULT 0,
                    protein_g DECIMAL(10,2) NOT NULL DEFAULT 0,
                    fat_g DECIMAL(10,2) NOT NULL DEFAULT 0,
                    sodium_mg DECIMAL(10,2) NOT NULL DEFAULT 0,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (nutrition_log_id),
                    INDEX idx_nutrition_logs_user_date (user_id, meal_date),
                    CONSTRAINT fk_nutrition_logs_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS favorites (
                    favorite_id BIGINT NOT NULL AUTO_INCREMENT,
                    user_id BIGINT NOT NULL,
                    recipe_id BIGINT NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (favorite_id),
                    UNIQUE KEY uk_favorite_user_recipe (user_id, recipe_id),
                    CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS seasonal_ingredients (
                    seasonal_ingredient_id BIGINT NOT NULL AUTO_INCREMENT,
                    month_no INT NOT NULL,
                    name VARCHAR(120) NOT NULL,
                    normalized_name VARCHAR(120) NOT NULL,
                    category VARCHAR(60) NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (seasonal_ingredient_id),
                    UNIQUE KEY uk_seasonal_month_name (month_no, normalized_name)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS custom_foods (
                    custom_food_id BIGINT NOT NULL AUTO_INCREMENT,
                    user_id BIGINT NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    kcal DECIMAL(10,2) NOT NULL DEFAULT 0,
                    carbohydrate_g DECIMAL(10,2) NOT NULL DEFAULT 0,
                    protein_g DECIMAL(10,2) NOT NULL DEFAULT 0,
                    fat_g DECIMAL(10,2) NOT NULL DEFAULT 0,
                    sodium_mg DECIMAL(10,2) NOT NULL DEFAULT 0,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (custom_food_id),
                    INDEX idx_custom_foods_user (user_id),
                    CONSTRAINT fk_custom_foods_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
                """);
    }

    private boolean columnExists(String tableName, String columnName) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                  FROM information_schema.columns
                 WHERE table_schema = DATABASE()
                   AND table_name = ?
                   AND column_name = ?
                """,
                Integer.class,
                tableName,
                columnName
        );
        return count != null && count > 0;
    }

    private void normalizeColumn(String tableName, String columnName, String definition) {
        if (columnExists(tableName, columnName)) {
            jdbcTemplate.execute("ALTER TABLE " + tableName + " MODIFY COLUMN " + columnName + " " + definition);
        }
    }

    private void relaxStrictColumns(String tableName) {
        List<ExistingColumn> columns = jdbcTemplate.query(
                """
                SELECT column_name, column_type
                  FROM information_schema.columns
                 WHERE table_schema = DATABASE()
                   AND table_name = ?
                   AND is_nullable = 'NO'
                   AND column_default IS NULL
                   AND extra NOT LIKE '%auto_increment%'
                """,
                (rs, rowNum) -> new ExistingColumn(rs.getString("column_name"), rs.getString("column_type")),
                tableName
        );
        for (ExistingColumn column : columns) {
            if (isSafeIdentifier(column.name())) {
                jdbcTemplate.execute("ALTER TABLE " + tableName + " MODIFY COLUMN `" + column.name() + "` "
                        + column.type() + " NULL");
            }
        }
    }

    private boolean isSafeIdentifier(String identifier) {
        return identifier != null && identifier.matches("[A-Za-z0-9_]+");
    }

    private record ExistingColumn(String name, String type) {
    }
}

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
        ensureUsersColumns();
        ensurePantryItemColumns();
        ensureShoppingItemColumns();
        ensureNutritionLogColumns();
        ensureCustomFoodColumns();
        seedDefaultGuestUser();
        normalizeColumn("ingest_jobs", "source", "VARCHAR(50) NOT NULL DEFAULT 'COOKRCP01'");
        normalizeColumn("ingest_jobs", "job_type", "VARCHAR(50) NOT NULL DEFAULT 'RECIPE_INGEST'");
        relaxStrictColumns("ingest_jobs");
        relaxStrictColumns("api_raw_responses");
    }

    private void ensureUsersColumns() {
        ensureColumn("users", "password_hash", "VARCHAR(255) NOT NULL DEFAULT ''");
        ensureColumn("users", "nickname", "VARCHAR(100) NULL");
        ensureColumn("users", "gender", "VARCHAR(20) NULL");
        ensureColumn("users", "age", "INT NULL");
        ensureColumn("users", "height_cm", "DECIMAL(6,2) NULL");
        ensureColumn("users", "weight_kg", "DECIMAL(6,2) NULL");
        ensureColumn("users", "goal", "VARCHAR(30) NOT NULL DEFAULT 'MAINTAIN'");
        ensureColumn("users", "activity_level", "VARCHAR(30) NOT NULL DEFAULT 'NORMAL'");
        ensureColumn("users", "is_deleted", "BOOLEAN NOT NULL DEFAULT FALSE");
        ensureColumn("users", "deleted_at", "TIMESTAMP NULL");
        ensureColumn("users", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP");
        ensureColumn("users", "updated_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
    }

    private void ensurePantryItemColumns() {
        renameColumnIfNeeded("pantry_items", "ingredient_name", "name", "VARCHAR(120) NOT NULL");
        ensureColumn("pantry_items", "name", "VARCHAR(120) NOT NULL");
        ensureColumn("pantry_items", "normalized_name", "VARCHAR(120) NOT NULL");
        ensureColumn("pantry_items", "quantity_text", "VARCHAR(120) NULL");
        ensureColumn("pantry_items", "expires_at", "DATE NULL");
        ensureColumn("pantry_items", "category", "VARCHAR(60) NULL");
        ensureColumn("pantry_items", "memo", "VARCHAR(500) NULL");
        ensureColumn("pantry_items", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP");
        ensureColumn("pantry_items", "updated_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
    }

    private void ensureShoppingItemColumns() {
        renameColumnIfNeeded("shopping_items", "item_name", "name", "VARCHAR(120) NOT NULL");
        renameColumnIfNeeded("shopping_items", "is_checked", "checked", "BOOLEAN NOT NULL DEFAULT FALSE");
        ensureColumn("shopping_items", "name", "VARCHAR(120) NOT NULL");
        ensureColumn("shopping_items", "normalized_name", "VARCHAR(120) NOT NULL");
        ensureColumn("shopping_items", "checked", "BOOLEAN NOT NULL DEFAULT FALSE");
        ensureColumn("shopping_items", "recipe_id", "BIGINT NULL");
        ensureColumn("shopping_items", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP");
        ensureColumn("shopping_items", "updated_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
    }

    private void ensureNutritionLogColumns() {
        renameColumnIfNeeded("nutrition_logs", "food_name", "custom_food_name", "VARCHAR(255) NULL");
        renameColumnIfNeeded("nutrition_logs", "log_date", "meal_date", "DATE NOT NULL");
        renameColumnIfNeeded("nutrition_logs", "meal_type", "meal_time", "VARCHAR(30) NOT NULL");
        renameColumnIfNeeded("nutrition_logs", "serving_count", "multiplier", "DECIMAL(8,2) NOT NULL DEFAULT 1");
        ensureColumn("nutrition_logs", "custom_food_name", "VARCHAR(255) NULL");
        ensureColumn("nutrition_logs", "meal_date", "DATE NOT NULL");
        ensureColumn("nutrition_logs", "meal_time", "VARCHAR(30) NOT NULL");
        ensureColumn("nutrition_logs", "multiplier", "DECIMAL(8,2) NOT NULL DEFAULT 1");
        ensureColumn("nutrition_logs", "kcal", "DECIMAL(10,2) NOT NULL DEFAULT 0");
        ensureColumn("nutrition_logs", "carbohydrate_g", "DECIMAL(10,2) NOT NULL DEFAULT 0");
        ensureColumn("nutrition_logs", "protein_g", "DECIMAL(10,2) NOT NULL DEFAULT 0");
        ensureColumn("nutrition_logs", "fat_g", "DECIMAL(10,2) NOT NULL DEFAULT 0");
        ensureColumn("nutrition_logs", "sodium_mg", "DECIMAL(10,2) NOT NULL DEFAULT 0");
        ensureColumn("nutrition_logs", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP");
        ensureColumn("nutrition_logs", "updated_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
    }

    private void ensureCustomFoodColumns() {
        renameColumnIfNeeded("custom_foods", "food_name", "name", "VARCHAR(255) NOT NULL");
        renameColumnIfNeeded("custom_foods", "calorie_kcal", "kcal", "DECIMAL(10,2) NOT NULL DEFAULT 0");
        ensureColumn("custom_foods", "name", "VARCHAR(255) NOT NULL");
        ensureColumn("custom_foods", "serving_size", "VARCHAR(60) NULL");
        ensureColumn("custom_foods", "kcal", "DECIMAL(10,2) NOT NULL DEFAULT 0");
        ensureColumn("custom_foods", "carbohydrate_g", "DECIMAL(10,2) NOT NULL DEFAULT 0");
        ensureColumn("custom_foods", "protein_g", "DECIMAL(10,2) NOT NULL DEFAULT 0");
        ensureColumn("custom_foods", "fat_g", "DECIMAL(10,2) NOT NULL DEFAULT 0");
        ensureColumn("custom_foods", "sodium_mg", "DECIMAL(10,2) NOT NULL DEFAULT 0");
        ensureColumn("custom_foods", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP");
        ensureColumn("custom_foods", "updated_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
    }

    private void seedDefaultGuestUser() {
        jdbcTemplate.update("""
                INSERT IGNORE INTO users (
                    user_id, email, password_hash, nickname, gender, age, height_cm, weight_kg, goal, activity_level
                )
                VALUES (1, 'guest@yorizori.local', 'guest', '게스트', NULL, NULL, NULL, NULL, 'MAINTAIN', 'NORMAL')
                """);
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
                    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
                    deleted_at TIMESTAMP NULL,
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
                    category VARCHAR(60) NULL,
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
                    serving_size VARCHAR(60) NULL,
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

    private void ensureColumn(String tableName, String columnName, String definition) {
        if (!columnExists(tableName, columnName)) {
            jdbcTemplate.execute("ALTER TABLE " + tableName + " ADD COLUMN " + columnName + " " + definition);
        }
    }

    private void renameColumnIfNeeded(String tableName, String oldName, String newName, String definition) {
        if (columnExists(tableName, oldName) && !columnExists(tableName, newName)) {
            jdbcTemplate.execute("ALTER TABLE " + tableName + " CHANGE COLUMN " + oldName + " " + newName + " " + definition);
        }
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

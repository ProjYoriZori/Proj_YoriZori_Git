CREATE TABLE IF NOT EXISTS ingest_jobs (
    ingest_job_id BIGINT NOT NULL AUTO_INCREMENT,
    source VARCHAR(50) NOT NULL DEFAULT 'COOKRCP01',
    job_type VARCHAR(50) NOT NULL DEFAULT 'RECIPE_INGEST',
    job_status VARCHAR(20) NOT NULL,
    request_endpoint VARCHAR(500) NULL,
    total_count INT NOT NULL DEFAULT 0,
    success_count INT NOT NULL DEFAULT 0,
    fail_count INT NOT NULL DEFAULT 0,
    error_message VARCHAR(2000) NULL,
    started_at TIMESTAMP NULL,
    finished_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (ingest_job_id),
    INDEX idx_ingest_jobs_created_at (created_at),
    INDEX idx_ingest_jobs_status (job_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS api_raw_responses (
    raw_response_id BIGINT NOT NULL AUTO_INCREMENT,
    ingest_job_id BIGINT NOT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'COOKRCP01',
    source_item_id VARCHAR(100) NULL,
    content_type VARCHAR(50) NOT NULL,
    response_body MEDIUMTEXT NOT NULL,
    response_hash CHAR(64) NOT NULL,
    fetched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (raw_response_id),
    INDEX idx_api_raw_responses_ingest_job_id (ingest_job_id),
    INDEX idx_api_raw_responses_hash (response_hash),
    CONSTRAINT fk_api_raw_responses_ingest_job
        FOREIGN KEY (ingest_job_id) REFERENCES ingest_jobs (ingest_job_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS recipes (
    recipe_id BIGINT NOT NULL AUTO_INCREMENT,
    source VARCHAR(50) NOT NULL DEFAULT 'COOKRCP01',
    source_recipe_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    category VARCHAR(100) NULL,
    cooking_method VARCHAR(100) NULL,
    calorie_kcal DECIMAL(10,2) NULL,
    carbohydrate_g DECIMAL(10,2) NULL,
    protein_g DECIMAL(10,2) NULL,
    fat_g DECIMAL(10,2) NULL,
    sodium_mg DECIMAL(10,2) NULL,
    source_url VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (recipe_id),
    UNIQUE KEY uk_recipes_source_recipe (source, source_recipe_id),
    INDEX idx_recipes_name (name),
    INDEX idx_recipes_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS ingredients (
    ingredient_id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    normalized_name VARCHAR(100) NOT NULL,
    category VARCHAR(60) NULL,
    default_unit VARCHAR(30) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (ingredient_id),
    UNIQUE KEY uk_ingredients_normalized_name (normalized_name),
    INDEX idx_ingredients_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS recipe_ingredients (
    recipe_ingredient_id BIGINT NOT NULL AUTO_INCREMENT,
    recipe_id BIGINT NOT NULL,
    ingredient_id BIGINT NOT NULL,
    original_name VARCHAR(150) NOT NULL,
    quantity DECIMAL(12,2) NULL,
    unit VARCHAR(30) NULL,
    amount_text VARCHAR(100) NULL,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (recipe_ingredient_id),
    UNIQUE KEY uk_recipe_ingredients_order (recipe_id, sort_order),
    INDEX idx_recipe_ingredients_ingredient_id (ingredient_id),
    CONSTRAINT fk_recipe_ingredients_recipe
        FOREIGN KEY (recipe_id) REFERENCES recipes (recipe_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_recipe_ingredients_ingredient
        FOREIGN KEY (ingredient_id) REFERENCES ingredients (ingredient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS recipe_steps (
    step_id BIGINT NOT NULL AUTO_INCREMENT,
    recipe_id BIGINT NOT NULL,
    step_no INT NOT NULL,
    instruction TEXT NOT NULL,
    duration_min INT NULL,
    image_url VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (step_id),
    UNIQUE KEY uk_recipe_steps_step_no (recipe_id, step_no),
    CONSTRAINT fk_recipe_steps_recipe
        FOREIGN KEY (recipe_id) REFERENCES recipes (recipe_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS images (
    image_id BIGINT NOT NULL AUTO_INCREMENT,
    recipe_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    image_type VARCHAR(30) NOT NULL,
    sort_order INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (image_id),
    UNIQUE KEY uk_images_recipe_type_order (recipe_id, image_type, sort_order),
    CONSTRAINT fk_images_recipe
        FOREIGN KEY (recipe_id) REFERENCES recipes (recipe_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
    CONSTRAINT fk_pantry_user
        FOREIGN KEY (user_id) REFERENCES users (user_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS avoid_ingredients (
    avoid_ingredient_id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    name VARCHAR(120) NOT NULL,
    normalized_name VARCHAR(120) NOT NULL,
    reason VARCHAR(50) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (avoid_ingredient_id),
    UNIQUE KEY uk_avoid_user_name (user_id, normalized_name),
    CONSTRAINT fk_avoid_user
        FOREIGN KEY (user_id) REFERENCES users (user_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
    CONSTRAINT fk_shopping_user
        FOREIGN KEY (user_id) REFERENCES users (user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_shopping_recipe
        FOREIGN KEY (recipe_id) REFERENCES recipes (recipe_id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
    CONSTRAINT fk_nutrition_logs_user
        FOREIGN KEY (user_id) REFERENCES users (user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_nutrition_logs_recipe
        FOREIGN KEY (recipe_id) REFERENCES recipes (recipe_id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS favorites (
    favorite_id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    recipe_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (favorite_id),
    UNIQUE KEY uk_favorite_user_recipe (user_id, recipe_id),
    CONSTRAINT fk_favorites_user
        FOREIGN KEY (user_id) REFERENCES users (user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_favorites_recipe
        FOREIGN KEY (recipe_id) REFERENCES recipes (recipe_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS seasonal_ingredients (
    seasonal_ingredient_id BIGINT NOT NULL AUTO_INCREMENT,
    month_no INT NOT NULL,
    name VARCHAR(120) NOT NULL,
    normalized_name VARCHAR(120) NOT NULL,
    category VARCHAR(60) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (seasonal_ingredient_id),
    UNIQUE KEY uk_seasonal_month_name (month_no, normalized_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
    CONSTRAINT fk_custom_foods_user
        FOREIGN KEY (user_id) REFERENCES users (user_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

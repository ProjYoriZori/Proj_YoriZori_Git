CREATE TABLE IF NOT EXISTS ingest_jobs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    service_id VARCHAR(50) NOT NULL,
    start_idx INT NOT NULL,
    end_idx INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    total_count INT NULL,
    saved_count INT NULL,
    error_message VARCHAR(2000) NULL,
    PRIMARY KEY (id),
    INDEX idx_ingest_jobs_requested_at (requested_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE IF NOT EXISTS api_raw_responses (
    id BIGINT NOT NULL AUTO_INCREMENT,
    ingest_job_id BIGINT NOT NULL,
    request_url TEXT NOT NULL,
    response_body MEDIUMTEXT NOT NULL,
    status_code INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_api_raw_responses_ingest_job_id (ingest_job_id),
    CONSTRAINT fk_api_raw_responses_ingest_job
        FOREIGN KEY (ingest_job_id) REFERENCES ingest_jobs (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE IF NOT EXISTS recipes (
    id BIGINT NOT NULL AUTO_INCREMENT,
    external_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NULL,
    cooking_method VARCHAR(100) NULL,
    weight VARCHAR(100) NULL,
    calorie VARCHAR(100) NULL,
    carbohydrate VARCHAR(100) NULL,
    protein VARCHAR(100) NULL,
    fat VARCHAR(100) NULL,
    sodium VARCHAR(100) NULL,
    hash_tag VARCHAR(255) NULL,
    sodium_tip TEXT NULL,
    ingredient_text TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_recipes_external_id (external_id),
    INDEX idx_recipes_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS ingredients (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_ingredients_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id BIGINT NOT NULL AUTO_INCREMENT,
    recipe_id BIGINT NOT NULL,
    ingredient_id BIGINT NOT NULL,
    raw_text VARCHAR(1000) NOT NULL,
    quantity DECIMAL(12, 3) NULL,
    unit VARCHAR(50) NULL,
    display_order INT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_recipe_ingredients_order (recipe_id, display_order),
    INDEX idx_recipe_ingredients_ingredient_id (ingredient_id),
    CONSTRAINT fk_recipe_ingredients_recipe
        FOREIGN KEY (recipe_id) REFERENCES recipes (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_recipe_ingredients_ingredient
        FOREIGN KEY (ingredient_id) REFERENCES ingredients (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS recipe_steps (
    id BIGINT NOT NULL AUTO_INCREMENT,
    recipe_id BIGINT NOT NULL,
    step_no INT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_recipe_steps_step_no (recipe_id, step_no),
    CONSTRAINT fk_recipe_steps_recipe
        FOREIGN KEY (recipe_id) REFERENCES recipes (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS images (
    id BIGINT NOT NULL AUTO_INCREMENT,
    recipe_id BIGINT NOT NULL,
    image_type VARCHAR(30) NOT NULL,
    image_url TEXT NOT NULL,
    display_order INT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_images_recipe_type_order (recipe_id, image_type, display_order),
    CONSTRAINT fk_images_recipe
        FOREIGN KEY (recipe_id) REFERENCES recipes (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

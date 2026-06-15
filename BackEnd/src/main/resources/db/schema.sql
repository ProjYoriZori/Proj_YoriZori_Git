-- YoriZori Database Schema
-- Synced with MySQL yorizori_db on 2026-06-15

CREATE TABLE IF NOT EXISTS `ingest_jobs` (
  `ingest_job_id` bigint NOT NULL AUTO_INCREMENT,
  `source` varchar(50) NOT NULL DEFAULT 'COOKRCP01',
  `job_type` varchar(50) NOT NULL DEFAULT 'RECIPE_INGEST',
  `job_status` varchar(30) DEFAULT NULL,
  `request_endpoint` varchar(500) DEFAULT NULL,
  `total_count` int NOT NULL DEFAULT '0',
  `success_count` int NOT NULL DEFAULT '0',
  `fail_count` int NOT NULL DEFAULT '0',
  `started_at` datetime DEFAULT NULL,
  `finished_at` datetime DEFAULT NULL,
  `error_message` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `service_id` varchar(50) NOT NULL DEFAULT 'COOKRCP01',
  `start_idx` int NOT NULL DEFAULT '1',
  `end_idx` int NOT NULL DEFAULT '1',
  `status` varchar(20) NOT NULL DEFAULT 'RUNNING',
  `requested_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  `saved_count` int DEFAULT NULL,
  PRIMARY KEY (`ingest_job_id`),
  KEY `idx_ingest_jobs_source` (`source`),
  KEY `idx_ingest_jobs_status` (`job_status`),
  KEY `idx_ingest_jobs_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `api_raw_responses` (
  `raw_response_id` bigint NOT NULL AUTO_INCREMENT,
  `ingest_job_id` bigint DEFAULT NULL,
  `source` varchar(100) DEFAULT NULL,
  `source_item_id` varchar(100) DEFAULT NULL,
  `content_type` varchar(30) DEFAULT NULL,
  `response_body` longtext,
  `response_hash` varchar(64) DEFAULT NULL,
  `fetched_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `request_url` text,
  `status_code` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`raw_response_id`),
  KEY `idx_api_raw_responses_job` (`ingest_job_id`),
  KEY `idx_api_raw_responses_source_item` (`source`, `source_item_id`),
  CONSTRAINT `fk_api_raw_responses_ingest_job`
    FOREIGN KEY (`ingest_job_id`) REFERENCES `ingest_jobs` (`ingest_job_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `recipes` (
  `recipe_id` bigint NOT NULL AUTO_INCREMENT,
  `source` varchar(50) NOT NULL,
  `source_recipe_id` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `category` varchar(100) DEFAULT NULL,
  `cooking_time_min` int DEFAULT NULL,
  `serving_size` int DEFAULT NULL,
  `calorie_kcal` decimal(10,2) DEFAULT NULL,
  `carbohydrate_g` decimal(10,2) DEFAULT NULL,
  `protein_g` decimal(10,2) DEFAULT NULL,
  `fat_g` decimal(10,2) DEFAULT NULL,
  `sodium_mg` decimal(10,2) DEFAULT NULL,
  `source_url` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`recipe_id`),
  UNIQUE KEY `uk_recipes_source_id` (`source`, `source_recipe_id`),
  KEY `idx_recipes_name` (`name`),
  KEY `idx_recipes_category` (`category`),
  KEY `idx_recipes_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `ingredients` (
  `ingredient_id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `normalized_name` varchar(100) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `default_unit` varchar(30) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ingredient_id`),
  UNIQUE KEY `uk_ingredients_normalized_name` (`normalized_name`),
  KEY `idx_ingredients_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `recipe_ingredient_groups` (
  `group_id` bigint NOT NULL AUTO_INCREMENT,
  `recipe_id` bigint NOT NULL,
  `group_name` varchar(100) NOT NULL,
  `sort_order` int NOT NULL,
  PRIMARY KEY (`group_id`),
  KEY `fk_rig_recipe` (`recipe_id`),
  CONSTRAINT `fk_rig_recipe`
    FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`recipe_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `recipe_ingredients` (
  `recipe_ingredient_id` bigint NOT NULL AUTO_INCREMENT,
  `recipe_id` bigint NOT NULL,
  `ingredient_id` bigint NOT NULL,
  `original_name` varchar(150) NOT NULL,
  `quantity` decimal(10,2) DEFAULT NULL,
  `unit` varchar(30) DEFAULT NULL,
  `amount_text` varchar(100) DEFAULT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `section` varchar(100) DEFAULT NULL,
  `group_id` bigint DEFAULT NULL,
  PRIMARY KEY (`recipe_ingredient_id`),
  UNIQUE KEY `uk_recipe_ingredients_recipe_ingredient` (`recipe_id`, `ingredient_id`),
  KEY `idx_recipe_ingredients_recipe` (`recipe_id`),
  KEY `idx_recipe_ingredients_ingredient` (`ingredient_id`),
  KEY `fk_ri_group` (`group_id`),
  CONSTRAINT `fk_recipe_ingredients_recipe`
    FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`recipe_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_recipe_ingredients_ingredient`
    FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`ingredient_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_ri_group`
    FOREIGN KEY (`group_id`) REFERENCES `recipe_ingredient_groups` (`group_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `recipe_steps` (
  `step_id` bigint NOT NULL AUTO_INCREMENT,
  `recipe_id` bigint NOT NULL,
  `step_no` int NOT NULL,
  `instruction` text NOT NULL,
  `duration_min` int DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`step_id`),
  UNIQUE KEY `uk_recipe_steps_recipe_step` (`recipe_id`, `step_no`),
  KEY `idx_recipe_steps_recipe` (`recipe_id`),
  CONSTRAINT `fk_recipe_steps_recipe`
    FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`recipe_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `images` (
  `image_id` bigint NOT NULL AUTO_INCREMENT,
  `recipe_id` bigint NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `image_type` varchar(30) DEFAULT NULL,
  `sort_order` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`image_id`),
  KEY `idx_images_recipe` (`recipe_id`),
  CONSTRAINT `fk_images_recipe`
    FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`recipe_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `user_id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(255) DEFAULT NULL,
  `nickname` varchar(50) DEFAULT NULL,
  `provider` varchar(30) DEFAULT NULL,
  `provider_user_id` varchar(100) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `age` int DEFAULT NULL,
  `height_cm` decimal(6,2) DEFAULT NULL,
  `weight_kg` decimal(6,2) DEFAULT NULL,
  `goal` varchar(30) NOT NULL DEFAULT 'MAINTAIN',
  `activity_level` varchar(30) NOT NULL DEFAULT 'NORMAL',
  `password_hash` varchar(255) NOT NULL DEFAULT '',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uk_users_email` (`email`),
  UNIQUE KEY `uk_users_provider_user` (`provider`, `provider_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `user_profiles` (
  `profile_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `age` int DEFAULT NULL,
  `height_cm` decimal(5,2) DEFAULT NULL,
  `weight_kg` decimal(5,2) DEFAULT NULL,
  `goal_type` varchar(30) DEFAULT NULL,
  `activity_level` varchar(20) DEFAULT NULL,
  `target_calorie_kcal` decimal(8,2) DEFAULT NULL,
  `target_carbohydrate_g` decimal(8,2) DEFAULT NULL,
  `target_protein_g` decimal(8,2) DEFAULT NULL,
  `target_fat_g` decimal(8,2) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`profile_id`),
  UNIQUE KEY `uk_user_profiles_user` (`user_id`),
  CONSTRAINT `fk_user_profiles_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `pantry_items` (
  `pantry_item_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `ingredient_id` bigint DEFAULT NULL,
  `name` varchar(120) NOT NULL,
  `normalized_name` varchar(100) NOT NULL,
  `quantity` decimal(10,2) DEFAULT NULL,
  `unit` varchar(30) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `storage_location` varchar(100) DEFAULT NULL,
  `memo` varchar(255) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  `quantity_text` varchar(120) DEFAULT NULL,
  `expires_at` date DEFAULT NULL,
  `category` varchar(60) DEFAULT NULL,
  `purchased_at` timestamp NULL DEFAULT NULL,
  `purchase_group_id` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`pantry_item_id`),
  KEY `fk_pantry_items_ingredient` (`ingredient_id`),
  KEY `idx_pantry_items_user` (`user_id`),
  KEY `idx_pantry_items_user_ingredient` (`user_id`, `ingredient_id`),
  KEY `idx_pantry_items_normalized_name` (`normalized_name`),
  KEY `idx_pantry_items_expiry_date` (`expiry_date`),
  KEY `idx_pantry_items_status` (`status`),
  KEY `idx_pantry_user_name` (`user_id`, `normalized_name`),
  CONSTRAINT `fk_pantry_items_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pantry_items_ingredient`
    FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`ingredient_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `avoid_ingredients` (
  `avoid_ingredient_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `ingredient_id` bigint DEFAULT NULL,
  `ingredient_name` varchar(100) NOT NULL,
  `normalized_name` varchar(100) NOT NULL,
  `reason_type` varchar(30) DEFAULT NULL,
  `memo` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`avoid_ingredient_id`),
  UNIQUE KEY `uk_avoid_ingredients_user_name` (`user_id`, `normalized_name`),
  KEY `idx_avoid_ingredients_user` (`user_id`),
  KEY `idx_avoid_ingredients_ingredient` (`ingredient_id`),
  CONSTRAINT `fk_avoid_ingredients_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_avoid_ingredients_ingredient`
    FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`ingredient_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `shopping_items` (
  `shopping_item_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `recipe_id` bigint DEFAULT NULL,
  `ingredient_id` bigint DEFAULT NULL,
  `name` varchar(120) NOT NULL,
  `normalized_name` varchar(100) DEFAULT NULL,
  `quantity` decimal(10,2) DEFAULT NULL,
  `unit` varchar(30) DEFAULT NULL,
  `checked` tinyint(1) NOT NULL DEFAULT '0',
  `source_type` varchar(30) NOT NULL DEFAULT 'RECIPE_MISSING',
  `memo` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`shopping_item_id`),
  KEY `idx_shopping_items_user` (`user_id`),
  KEY `idx_shopping_items_recipe` (`recipe_id`),
  KEY `idx_shopping_items_ingredient` (`ingredient_id`),
  KEY `idx_shopping_items_checked` (`checked`),
  CONSTRAINT `fk_shopping_items_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_shopping_items_recipe`
    FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`recipe_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_shopping_items_ingredient`
    FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`ingredient_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `nutrition_logs` (
  `nutrition_log_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `recipe_id` bigint DEFAULT NULL,
  `meal_date` date NOT NULL,
  `meal_time` varchar(30) NOT NULL,
  `multiplier` decimal(8,2) NOT NULL DEFAULT '1.00',
  `custom_food_name` varchar(255) DEFAULT NULL,
  `calorie_kcal` decimal(10,2) DEFAULT NULL,
  `carbohydrate_g` decimal(10,2) DEFAULT NULL,
  `protein_g` decimal(10,2) DEFAULT NULL,
  `fat_g` decimal(10,2) DEFAULT NULL,
  `sodium_mg` decimal(10,2) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `kcal` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`nutrition_log_id`),
  KEY `idx_nutrition_logs_user_date` (`user_id`, `meal_date`),
  KEY `idx_nutrition_logs_recipe` (`recipe_id`),
  CONSTRAINT `fk_nutrition_logs_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_nutrition_logs_recipe`
    FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`recipe_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `nutrition_standards` (
  `standard_id` bigint NOT NULL AUTO_INCREMENT,
  `source` varchar(100) NOT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `age_min` int DEFAULT NULL,
  `age_max` int DEFAULT NULL,
  `goal_type` varchar(30) DEFAULT NULL,
  `activity_level` varchar(20) DEFAULT NULL,
  `calorie_kcal` decimal(10,2) DEFAULT NULL,
  `carbohydrate_g` decimal(10,2) DEFAULT NULL,
  `protein_g` decimal(10,2) DEFAULT NULL,
  `fat_g` decimal(10,2) DEFAULT NULL,
  `sodium_mg` decimal(10,2) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`standard_id`),
  KEY `idx_nutrition_standards_gender_age` (`gender`, `age_min`, `age_max`),
  KEY `idx_nutrition_standards_goal` (`goal_type`),
  KEY `idx_nutrition_standards_activity` (`activity_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `favorites` (
  `favorite_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `recipe_id` bigint NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`favorite_id`),
  UNIQUE KEY `uk_favorite_user_recipe` (`user_id`, `recipe_id`),
  CONSTRAINT `fk_favorites_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `feedback` (
  `feedback_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `recipe_id` bigint NOT NULL,
  `rating` int DEFAULT NULL,
  `is_liked` tinyint(1) NOT NULL DEFAULT '0',
  `comment` text,
  `memo` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`feedback_id`),
  UNIQUE KEY `uk_feedback_user_recipe` (`user_id`, `recipe_id`),
  KEY `idx_feedback_recipe` (`recipe_id`),
  KEY `idx_feedback_liked` (`is_liked`),
  CONSTRAINT `fk_feedback_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_feedback_recipe`
    FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`recipe_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `custom_foods` (
  `custom_food_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `name` varchar(255) NOT NULL,
  `kcal` decimal(10,2) NOT NULL DEFAULT '0.00',
  `carbohydrate_g` decimal(10,2) NOT NULL DEFAULT '0.00',
  `protein_g` decimal(10,2) NOT NULL DEFAULT '0.00',
  `fat_g` decimal(10,2) NOT NULL DEFAULT '0.00',
  `sodium_mg` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `serving_size` varchar(120) DEFAULT NULL,
  PRIMARY KEY (`custom_food_id`),
  KEY `idx_custom_foods_user` (`user_id`),
  CONSTRAINT `fk_custom_foods_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `frequent_products` (
  `product_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `serving_size` varchar(120) DEFAULT NULL,
  `kcal` int DEFAULT NULL,
  `protein_g` decimal(6,2) DEFAULT NULL,
  `fat_g` decimal(6,2) DEFAULT NULL,
  `carbohydrate_g` decimal(6,2) DEFAULT NULL,
  `sodium_mg` decimal(10,2) DEFAULT NULL,
  `raw_text` mediumtext,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_id`),
  KEY `idx_frequent_products_user` (`user_id`),
  CONSTRAINT `fk_frequent_products_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `seasonal_ingredients` (
  `seasonal_ingredient_id` bigint NOT NULL AUTO_INCREMENT,
  `ingredient_id` bigint DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `normalized_name` varchar(100) NOT NULL,
  `season_name` varchar(20) DEFAULT NULL,
  `month` int NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `source` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`seasonal_ingredient_id`),
  UNIQUE KEY `uk_seasonal_ingredients_name_month` (`normalized_name`, `month`),
  KEY `fk_seasonal_ingredients_ingredient` (`ingredient_id`),
  KEY `idx_seasonal_ingredients_month` (`month`),
  KEY `idx_seasonal_ingredients_name` (`normalized_name`),
  KEY `idx_seasonal_ingredients_active` (`is_active`),
  CONSTRAINT `fk_seasonal_ingredients_ingredient`
    FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`ingredient_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `events` (
  `event_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `event_type` varchar(100) NOT NULL,
  `target_type` varchar(100) DEFAULT NULL,
  `target_id` bigint DEFAULT NULL,
  `http_method` varchar(10) DEFAULT NULL,
  `endpoint` varchar(500) DEFAULT NULL,
  `status_code` int DEFAULT NULL,
  `duration_ms` int DEFAULT NULL,
  `message` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`event_id`),
  KEY `idx_events_user` (`user_id`),
  KEY `idx_events_type` (`event_type`),
  KEY `idx_events_created_at` (`created_at`),
  KEY `idx_events_endpoint` (`endpoint`),
  CONSTRAINT `fk_events_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

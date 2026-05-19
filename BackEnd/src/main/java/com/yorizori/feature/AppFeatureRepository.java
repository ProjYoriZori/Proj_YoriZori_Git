package com.yorizori.feature;

import com.yorizori.auth.AuthDtos.UserProfileResponse;
import com.yorizori.feature.FeatureDtos.AvoidIngredientResponse;
import com.yorizori.feature.FeatureDtos.CustomFoodResponse;
import com.yorizori.feature.FeatureDtos.NutritionLogResponse;
import com.yorizori.feature.FeatureDtos.PantryItemResponse;
import com.yorizori.feature.FeatureDtos.ShoppingItemResponse;
import com.yorizori.recipe.dto.NutritionResponse;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AppFeatureRepository {

    private final JdbcTemplate jdbcTemplate;

    public AppFeatureRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public UserProfileResponse updateProfile(long userId, FeatureDtos.ProfileUpdateRequest request) {
        if (request.age() != null && (request.age() < 1 || request.age() > 120)) {
            throw new IllegalArgumentException("올바른 나이를 입력해 주세요(1~120).");
        }
        jdbcTemplate.update("""
                UPDATE users
                   SET nickname = COALESCE(?, nickname),
                       gender = COALESCE(?, gender),
                       age = COALESCE(?, age),
                       height_cm = COALESCE(?, height_cm),
                       weight_kg = COALESCE(?, weight_kg),
                       goal = COALESCE(?, goal),
                       activity_level = COALESCE(?, activity_level)
                 WHERE user_id = ?
                """,
                blankToNull(request.nickname()),
                upperOrNull(request.gender()),
                request.age(),
                request.heightCm(),
                request.weightKg(),
                upperOrNull(request.goal()),
                upperOrNull(request.activityLevel()),
                userId
        );
        return jdbcTemplate.queryForObject("""
                SELECT user_id, email, nickname, gender, age, height_cm, weight_kg, goal, activity_level
                  FROM users
                 WHERE user_id = ?
                """,
                (rs, rowNum) -> new UserProfileResponse(
                        rs.getLong("user_id"),
                        rs.getString("email"),
                        rs.getString("nickname"),
                        rs.getString("gender"),
                        (Integer) rs.getObject("age"),
                        rs.getBigDecimal("height_cm"),
                        rs.getBigDecimal("weight_kg"),
                        rs.getString("goal"),
                        rs.getString("activity_level")
                ),
                userId
        );
    }

    public List<PantryItemResponse> findPantryItems(long userId) {
        return jdbcTemplate.query("""
                SELECT pantry_item_id, name, quantity_text, expires_at, memo
                  FROM pantry_items
                 WHERE user_id = ?
                 ORDER BY expires_at IS NULL, expires_at ASC, pantry_item_id DESC
                """, (rs, rowNum) -> toPantryItem(rs.getLong("pantry_item_id"),
                rs.getString("name"),
                rs.getString("quantity_text"),
                rs.getObject("expires_at", LocalDate.class),
                rs.getString("memo")), userId);
    }

    public PantryItemResponse addPantryItem(long userId, FeatureDtos.PantryItemRequest request) {
        String name = required(request.name(), "Ingredient name");
        jdbcTemplate.update("""
                INSERT INTO pantry_items (user_id, name, normalized_name, quantity_text, expires_at, memo)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    quantity_text = COALESCE(VALUES(quantity_text), quantity_text),
                    expires_at = COALESCE(VALUES(expires_at), expires_at),
                    memo = COALESCE(VALUES(memo), memo)
                """, userId, name, normalize(name), blankToNull(request.quantityText()), request.expiresAt(),
                blankToNull(request.memo()));
        return findPantryItemByName(userId, name);
    }

    public PantryItemResponse updatePantryItem(long userId, long itemId, FeatureDtos.PantryItemRequest request) {
        jdbcTemplate.update("""
                UPDATE pantry_items
                   SET name = COALESCE(?, name),
                       normalized_name = COALESCE(?, normalized_name),
                       quantity_text = COALESCE(?, quantity_text),
                       expires_at = COALESCE(?, expires_at),
                       memo = COALESCE(?, memo)
                 WHERE user_id = ? AND pantry_item_id = ?
                """,
                blankToNull(request.name()),
                request.name() == null ? null : normalize(request.name()),
                blankToNull(request.quantityText()),
                request.expiresAt(),
                blankToNull(request.memo()),
                userId,
                itemId
        );
        return findPantryItem(userId, itemId);
    }

    public void deletePantryItem(long userId, long itemId) {
        jdbcTemplate.update("DELETE FROM pantry_items WHERE user_id = ? AND pantry_item_id = ?", userId, itemId);
    }

    public List<String> findPantryNames(long userId) {
        return jdbcTemplate.query("SELECT name FROM pantry_items WHERE user_id = ? ORDER BY pantry_item_id DESC",
                (rs, rowNum) -> rs.getString("name"), userId);
    }

    public List<AvoidIngredientResponse> findAvoidIngredients(long userId) {
        return jdbcTemplate.query("""
                SELECT avoid_ingredient_id, ingredient_name, reason_type
                  FROM avoid_ingredients
                 WHERE user_id = ?
                 ORDER BY ingredient_name
                """,
                (rs, rowNum) -> new AvoidIngredientResponse(
                        rs.getLong("avoid_ingredient_id"),
                        rs.getString("ingredient_name"),
                        rs.getString("reason_type")
                ),
                userId
        );
    }

    public AvoidIngredientResponse addAvoidIngredient(long userId, FeatureDtos.AvoidIngredientRequest request) {
        String name = required(request.name(), "Avoid ingredient name");
        jdbcTemplate.update("""
                INSERT INTO avoid_ingredients (user_id, ingredient_name, normalized_name, reason_type)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE reason_type = VALUES(reason_type), ingredient_name = VALUES(ingredient_name)
                """, userId, name, normalize(name), blankToNull(request.reason()));
        return jdbcTemplate.queryForObject("""
                SELECT avoid_ingredient_id, ingredient_name, reason_type
                  FROM avoid_ingredients
                 WHERE user_id = ? AND normalized_name = ?
                """,
                (rs, rowNum) -> new AvoidIngredientResponse(
                        rs.getLong("avoid_ingredient_id"),
                        rs.getString("ingredient_name"),
                        rs.getString("reason_type")
                ),
                userId,
                normalize(name)
        );
    }

    public void deleteAvoidIngredient(long userId, long avoidIngredientId) {
        jdbcTemplate.update("DELETE FROM avoid_ingredients WHERE user_id = ? AND avoid_ingredient_id = ?",
                userId, avoidIngredientId);
    }

    public List<String> findAvoidNames(long userId) {
        return jdbcTemplate.query("SELECT ingredient_name FROM avoid_ingredients WHERE user_id = ?",
                (rs, rowNum) -> rs.getString("ingredient_name"), userId);
    }

    public List<ShoppingItemResponse> findShoppingItems(long userId) {
        return jdbcTemplate.query("""
                SELECT shopping_item_id, recipe_id, name, checked
                  FROM shopping_items
                 WHERE user_id = ?
                 ORDER BY checked ASC, shopping_item_id DESC
                """,
                (rs, rowNum) -> new ShoppingItemResponse(
                        rs.getLong("shopping_item_id"),
                        (Long) rs.getObject("recipe_id"),
                        rs.getString("name"),
                        rs.getBoolean("checked")
                ),
                userId
        );
    }

    public void addShoppingItem(long userId, Long recipeId, String name) {
        String normalizedName = normalize(name);
        if (recipeId == null) {
            Integer existing = jdbcTemplate.queryForObject("""
                    SELECT COUNT(*)
                      FROM shopping_items
                     WHERE user_id = ? AND recipe_id IS NULL AND normalized_name = ?
                    """, Integer.class, userId, normalizedName);
            if (existing != null && existing > 0) {
                jdbcTemplate.update("""
                        UPDATE shopping_items
                           SET checked = FALSE,
                               updated_at = CURRENT_TIMESTAMP
                         WHERE user_id = ? AND recipe_id IS NULL AND normalized_name = ?
                        """, userId, normalizedName);
                return;
            }
        }
        jdbcTemplate.update("""
                INSERT INTO shopping_items (user_id, recipe_id, name, normalized_name, checked)
                VALUES (?, ?, ?, ?, FALSE)
                ON DUPLICATE KEY UPDATE checked = FALSE, updated_at = CURRENT_TIMESTAMP
                """, userId, recipeId, required(name, "Shopping item name"), normalizedName);
    }

    public void deleteShoppingItem(long userId, long shoppingItemId) {
        jdbcTemplate.update("DELETE FROM shopping_items WHERE user_id = ? AND shopping_item_id = ?",
                userId, shoppingItemId);
    }

    public ShoppingItemResponse patchShoppingItem(long userId, long shoppingItemId, Boolean checked) {
        if (checked != null) {
            jdbcTemplate.update("""
                    UPDATE shopping_items
                       SET checked = ?
                     WHERE user_id = ? AND shopping_item_id = ?
                    """, checked, userId, shoppingItemId);
            if (checked) {
                String name = jdbcTemplate.queryForObject("""
                        SELECT name
                          FROM shopping_items
                         WHERE user_id = ? AND shopping_item_id = ?
                        """, String.class, userId, shoppingItemId);
                addPantryItem(userId, new FeatureDtos.PantryItemRequest(name, null, null, "shopping-complete"));
            }
        }
        return jdbcTemplate.queryForObject("""
                SELECT shopping_item_id, recipe_id, name, checked
                  FROM shopping_items
                 WHERE user_id = ? AND shopping_item_id = ?
                """,
                (rs, rowNum) -> new ShoppingItemResponse(
                        rs.getLong("shopping_item_id"),
                        (Long) rs.getObject("recipe_id"),
                        rs.getString("name"),
                        rs.getBoolean("checked")
                ),
                userId,
                shoppingItemId
        );
    }

    public NutritionLogResponse addNutritionLog(long userId, FeatureDtos.NutritionLogRequest request,
                                                String title, NutritionResponse nutrition) {
        BigDecimal multiplier = request.multiplier() == null ? BigDecimal.ONE : request.multiplier();
        LocalDate mealDate = request.mealDate() == null ? LocalDate.now() : request.mealDate();
        String mealTime = request.mealTime() == null || request.mealTime().isBlank()
                ? "SNACK"
                : request.mealTime().trim().toUpperCase(Locale.ROOT);
        jdbcTemplate.update("""
                INSERT INTO nutrition_logs (
                    user_id, recipe_id, custom_food_name, meal_date, meal_time, multiplier,
                    kcal, carbohydrate_g, protein_g, fat_g, sodium_mg
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                userId,
                request.recipeId(),
                title,
                mealDate,
                mealTime,
                multiplier,
                multiply(nutrition.kcal(), multiplier),
                multiply(nutrition.carbs(), multiplier),
                multiply(nutrition.protein(), multiplier),
                multiply(nutrition.fat(), multiplier),
                multiply(nutrition.sodium(), multiplier)
        );
        Long id = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return findNutritionLog(userId, id == null ? 0 : id);
    }

    public void deleteNutritionLog(long userId, long nutritionLogId) {
        jdbcTemplate.update("DELETE FROM nutrition_logs WHERE user_id = ? AND nutrition_log_id = ?",
                userId, nutritionLogId);
    }

    public List<NutritionLogResponse> findNutritionLogs(long userId, LocalDate date) {
        return jdbcTemplate.query("""
                SELECT nutrition_log_id, recipe_id, custom_food_name, meal_date, meal_time, multiplier,
                       kcal, carbohydrate_g, protein_g, fat_g, sodium_mg, created_at
                  FROM nutrition_logs
                 WHERE user_id = ? AND meal_date = ?
                 ORDER BY created_at ASC
                """, (rs, rowNum) -> new NutritionLogResponse(
                rs.getLong("nutrition_log_id"),
                (Long) rs.getObject("recipe_id"),
                rs.getString("custom_food_name"),
                rs.getObject("meal_date", LocalDate.class),
                rs.getString("meal_time"),
                rs.getBigDecimal("multiplier"),
                new NutritionResponse(
                        toInt(rs.getBigDecimal("kcal")),
                        toDouble(rs.getBigDecimal("carbohydrate_g")),
                        toDouble(rs.getBigDecimal("protein_g")),
                        toDouble(rs.getBigDecimal("fat_g")),
                        toDouble(rs.getBigDecimal("sodium_mg"))
                ),
                rs.getObject("created_at", LocalDateTime.class)
        ), userId, date);
    }

    public void addFavorite(long userId, long recipeId) {
        jdbcTemplate.update("""
                INSERT INTO favorites (user_id, recipe_id)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE recipe_id = recipe_id
                """, userId, recipeId);
    }

    public void deleteFavorite(long userId, long recipeId) {
        jdbcTemplate.update("DELETE FROM favorites WHERE user_id = ? AND recipe_id = ?", userId, recipeId);
    }

    public List<CustomFoodResponse> findCustomFoods(long userId) {
        return jdbcTemplate.query("""
                SELECT custom_food_id, name, kcal, carbohydrate_g, protein_g, fat_g, sodium_mg
                  FROM custom_foods
                 WHERE user_id = ?
                 ORDER BY custom_food_id DESC
                """, (rs, rowNum) -> new CustomFoodResponse(
                rs.getLong("custom_food_id"),
                rs.getString("name"),
                new NutritionResponse(
                        toInt(rs.getBigDecimal("kcal")),
                        toDouble(rs.getBigDecimal("carbohydrate_g")),
                        toDouble(rs.getBigDecimal("protein_g")),
                        toDouble(rs.getBigDecimal("fat_g")),
                        toDouble(rs.getBigDecimal("sodium_mg"))
                )
        ), userId);
    }

    public CustomFoodResponse addCustomFood(long userId, FeatureDtos.CustomFoodRequest request) {
        NutritionResponse nutrition = request.nutrition() == null ? new NutritionResponse(0, 0, 0, 0, 0)
                : request.nutrition();
        jdbcTemplate.update("""
                INSERT INTO custom_foods (user_id, name, kcal, carbohydrate_g, protein_g, fat_g, sodium_mg)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, userId, required(request.name(), "Custom food name"), nutrition.kcal(), nutrition.carbs(),
                nutrition.protein(), nutrition.fat(), nutrition.sodium());
        Long id = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return new CustomFoodResponse(id == null ? 0 : id, request.name(), nutrition);
    }

    public void deleteCustomFood(long userId, long customFoodId) {
        jdbcTemplate.update("DELETE FROM custom_foods WHERE user_id = ? AND custom_food_id = ?",
                userId, customFoodId);
    }

    private NutritionLogResponse findNutritionLog(long userId, long logId) {
        return jdbcTemplate.queryForObject("""
                SELECT nutrition_log_id, recipe_id, custom_food_name, meal_date, meal_time, multiplier,
                       kcal, carbohydrate_g, protein_g, fat_g, sodium_mg, created_at
                  FROM nutrition_logs
                 WHERE user_id = ? AND nutrition_log_id = ?
                """, (rs, rowNum) -> new NutritionLogResponse(
                rs.getLong("nutrition_log_id"),
                (Long) rs.getObject("recipe_id"),
                rs.getString("custom_food_name"),
                rs.getObject("meal_date", LocalDate.class),
                rs.getString("meal_time"),
                rs.getBigDecimal("multiplier"),
                new NutritionResponse(
                        toInt(rs.getBigDecimal("kcal")),
                        toDouble(rs.getBigDecimal("carbohydrate_g")),
                        toDouble(rs.getBigDecimal("protein_g")),
                        toDouble(rs.getBigDecimal("fat_g")),
                        toDouble(rs.getBigDecimal("sodium_mg"))
                ),
                rs.getObject("created_at", LocalDateTime.class)
        ), userId, logId);
    }

    private PantryItemResponse findPantryItem(long userId, long itemId) {
        return jdbcTemplate.queryForObject("""
                SELECT pantry_item_id, name, quantity_text, expires_at, memo
                  FROM pantry_items
                 WHERE user_id = ? AND pantry_item_id = ?
                """, (rs, rowNum) -> toPantryItem(
                rs.getLong("pantry_item_id"),
                rs.getString("name"),
                rs.getString("quantity_text"),
                rs.getObject("expires_at", LocalDate.class),
                rs.getString("memo")), userId, itemId);
    }

    private PantryItemResponse findPantryItemByName(long userId, String name) {
        return jdbcTemplate.queryForObject("""
                SELECT pantry_item_id, name, quantity_text, expires_at, memo
                  FROM pantry_items
                 WHERE user_id = ? AND normalized_name = ?
                """, (rs, rowNum) -> toPantryItem(
                rs.getLong("pantry_item_id"),
                rs.getString("name"),
                rs.getString("quantity_text"),
                rs.getObject("expires_at", LocalDate.class),
                rs.getString("memo")), userId, normalize(name));
    }

    private PantryItemResponse toPantryItem(long id, String name, String quantityText, LocalDate expiresAt, String memo) {
        long expiresInDays = expiresAt == null ? Long.MAX_VALUE : ChronoUnit.DAYS.between(LocalDate.now(), expiresAt);
        return new PantryItemResponse(id, name, quantityText, expiresAt, memo, expiresInDays, expiresInDays <= 3);
    }

    private static BigDecimal multiply(double value, BigDecimal multiplier) {
        return BigDecimal.valueOf(value).multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
    }

    private static String required(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(fieldName + " is required.");
        }
        return value.trim();
    }

    private static String normalize(String value) {
        return required(value, "Name").replaceAll("\\s+", "").toLowerCase(Locale.ROOT);
    }

    private static String blankToNull(String value) {
        return value == null || value.trim().isEmpty() ? null : value.trim();
    }

    private static String upperOrNull(String value) {
        return value == null || value.trim().isEmpty() ? null : value.trim().toUpperCase(Locale.ROOT);
    }

    private static int toInt(BigDecimal value) {
        return value == null ? 0 : value.setScale(0, RoundingMode.HALF_UP).intValue();
    }

    private static double toDouble(BigDecimal value) {
        return value == null ? 0 : value.setScale(1, RoundingMode.HALF_UP).doubleValue();
    }
}

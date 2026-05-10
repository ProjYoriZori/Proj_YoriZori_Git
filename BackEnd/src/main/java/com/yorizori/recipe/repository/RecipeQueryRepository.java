package com.yorizori.recipe.repository;

import com.yorizori.recipe.dto.NutritionResponse;
import com.yorizori.recipe.dto.RecipeIngredientResponse;
import com.yorizori.recipe.dto.RecipeResponse;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class RecipeQueryRepository {

    private final JdbcTemplate jdbcTemplate;

    public RecipeQueryRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<RecipeResponse> findRecipes(String query, int limit) {
        StringBuilder sql = new StringBuilder(baseRecipeSelect())
                .append(" WHERE r.is_active = TRUE");
        List<Object> args = new ArrayList<>();

        if (hasText(query)) {
            sql.append("""
                     AND (
                         r.name LIKE ?
                         OR EXISTS (
                             SELECT 1
                               FROM recipe_ingredients ri
                               JOIN ingredients ing ON ing.ingredient_id = ri.ingredient_id
                              WHERE ri.recipe_id = r.recipe_id
                                AND (ing.name LIKE ? OR ri.original_name LIKE ?)
                         )
                     )
                    """);
            String keyword = "%" + query.trim() + "%";
            args.add(keyword);
            args.add(keyword);
            args.add(keyword);
        }

        sql.append(" ORDER BY r.recipe_id DESC LIMIT ?");
        args.add(Math.max(1, Math.min(limit, 100)));

        return jdbcTemplate.query(sql.toString(), this::mapRecipeRow, args.toArray()).stream()
                .map(row -> toRecipeResponse(row, findIngredients(row.id()), List.of()))
                .toList();
    }

    public Optional<RecipeResponse> findRecipe(long recipeId) {
        try {
            RecipeRow row = jdbcTemplate.queryForObject(
                    baseRecipeSelect() + " WHERE r.recipe_id = ? AND r.is_active = TRUE",
                    this::mapRecipeRow,
                    recipeId
            );
            if (row == null) {
                return Optional.empty();
            }
            return Optional.of(toRecipeResponse(row, findIngredients(row.id()), findSteps(row.id())));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    private String baseRecipeSelect() {
        return """
                SELECT r.recipe_id,
                       r.name,
                       r.description,
                       r.category,
                       r.calorie_kcal,
                       r.carbohydrate_g,
                       r.protein_g,
                       r.fat_g,
                       r.sodium_mg,
                       COALESCE(
                           (SELECT i.image_url
                              FROM images i
                             WHERE i.recipe_id = r.recipe_id
                               AND i.image_type = 'MAIN'
                             ORDER BY i.sort_order
                             LIMIT 1),
                           (SELECT i.image_url
                              FROM images i
                             WHERE i.recipe_id = r.recipe_id
                             ORDER BY i.sort_order
                             LIMIT 1),
                           r.source_url
                       ) AS image_url
                  FROM recipes r
                """;
    }

    private List<RecipeIngredientResponse> findIngredients(long recipeId) {
        String sql = """
                SELECT ing.name,
                       COALESCE(ri.amount_text, ri.original_name, ing.name) AS amount
                  FROM recipe_ingredients ri
                  JOIN ingredients ing ON ing.ingredient_id = ri.ingredient_id
                 WHERE ri.recipe_id = ?
                 ORDER BY ri.sort_order, ri.recipe_ingredient_id
                """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> new RecipeIngredientResponse(
                rs.getString("name"),
                nullToEmpty(rs.getString("amount"))
        ), recipeId);
    }

    private List<String> findSteps(long recipeId) {
        String sql = """
                SELECT instruction
                  FROM recipe_steps
                 WHERE recipe_id = ?
                 ORDER BY step_no
                """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> rs.getString("instruction"), recipeId);
    }

    private RecipeRow mapRecipeRow(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        return new RecipeRow(
                rs.getLong("recipe_id"),
                rs.getString("name"),
                rs.getString("description"),
                rs.getString("category"),
                rs.getBigDecimal("calorie_kcal"),
                rs.getBigDecimal("carbohydrate_g"),
                rs.getBigDecimal("protein_g"),
                rs.getBigDecimal("fat_g"),
                rs.getBigDecimal("sodium_mg"),
                rs.getString("image_url")
        );
    }

    private RecipeResponse toRecipeResponse(
            RecipeRow row,
            List<RecipeIngredientResponse> ingredients,
            List<String> steps
    ) {
        NutritionResponse nutrition = new NutritionResponse(
                toInt(row.calorieKcal()),
                toDouble(row.carbohydrateG()),
                toDouble(row.proteinG()),
                toDouble(row.fatG()),
                toDouble(row.sodiumMg())
        );
        return new RecipeResponse(
                String.valueOf(row.id()),
                row.name(),
                nullToEmpty(row.imageUrl()),
                "Cook",
                nullToDefault(row.category(), "Other"),
                nutrition.kcal(),
                List.of(),
                ingredients,
                steps,
                nutrition
        );
    }

    private static boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private static String nullToDefault(String value, String fallback) {
        return hasText(value) ? value : fallback;
    }

    private static int toInt(BigDecimal value) {
        if (value == null) {
            return 0;
        }
        return value.setScale(0, RoundingMode.HALF_UP).intValue();
    }

    private static double toDouble(BigDecimal value) {
        if (value == null) {
            return 0;
        }
        return value.setScale(1, RoundingMode.HALF_UP).doubleValue();
    }

    private record RecipeRow(
            long id,
            String name,
            String description,
            String category,
            BigDecimal calorieKcal,
            BigDecimal carbohydrateG,
            BigDecimal proteinG,
            BigDecimal fatG,
            BigDecimal sodiumMg,
            String imageUrl
    ) {
    }
}

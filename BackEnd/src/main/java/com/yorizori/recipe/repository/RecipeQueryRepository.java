package com.yorizori.recipe.repository;

import com.yorizori.recipe.dto.NutritionResponse;
import com.yorizori.recipe.dto.RecipeIngredientGroupResponse;
import com.yorizori.recipe.dto.RecipeIngredientItemResponse;
import com.yorizori.recipe.dto.RecipeIngredientResponse;
import com.yorizori.recipe.dto.RecipeResponse;
import com.yorizori.recipe.dto.RecipeStepResponse;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class RecipeQueryRepository {

    private final JdbcTemplate jdbcTemplate;

    public RecipeQueryRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<RecipeResponse> findRecipes(String query, List<String> ingredientKeywords, int page, int size, String sort) {
        StringBuilder sql = new StringBuilder(baseRecipeSelect())
                .append(" WHERE r.is_active = TRUE");
        List<Object> args = new ArrayList<>();

        if (hasText(query)) {
            sql.append("""
                     AND (
                         r.name LIKE ? OR REPLACE(r.name, ' ', '') LIKE ?
                         OR EXISTS (
                             SELECT 1
                               FROM recipe_ingredients ri
                               JOIN ingredients ing ON ing.ingredient_id = ri.ingredient_id
                              WHERE ri.recipe_id = r.recipe_id
                                AND (
                                    ing.name LIKE ? OR REPLACE(ing.name, ' ', '') LIKE ?
                                    OR ri.original_name LIKE ? OR REPLACE(ri.original_name, ' ', '') LIKE ?
                                )
                         )
                     )
                    """);
            String raw = query.trim();
            String keyword = "%" + raw + "%";
            String normalizedKeyword = "%" + raw.replaceAll("\\s+", "") + "%";
            args.add(keyword);
            args.add(normalizedKeyword);
            args.add(keyword);
            args.add(normalizedKeyword);
            args.add(keyword);
            args.add(normalizedKeyword);
        }

        if (ingredientKeywords != null && !ingredientKeywords.isEmpty()) {
            sql.append("""
                     AND EXISTS (
                         SELECT 1
                           FROM recipe_ingredients ri
                           JOIN ingredients ing ON ing.ingredient_id = ri.ingredient_id
                          WHERE ri.recipe_id = r.recipe_id
                    """);
            sql.append(" AND (");
            for (int i = 0; i < ingredientKeywords.size(); i++) {
                if (i > 0) {
                    sql.append(" OR ");
                }
                sql.append("(ing.name LIKE ? OR REPLACE(ing.name, ' ', '') LIKE ? OR ri.original_name LIKE ? OR REPLACE(ri.original_name, ' ', '') LIKE ?)");
                String rawIng = ingredientKeywords.get(i).trim();
                String keyword = "%" + rawIng + "%";
                String normalizedKeyword = "%" + rawIng.replaceAll("\\s+", "") + "%";
                args.add(keyword);
                args.add(normalizedKeyword);
                args.add(keyword);
                args.add(normalizedKeyword);
            }
            sql.append("))");
        }

        sql.append(orderBy(sort));
        int safeSize = Math.max(1, Math.min(size, 1200));
        int safePage = Math.max(0, page);
        sql.append(" LIMIT ? OFFSET ?");
        args.add(safeSize);
        args.add(safePage * safeSize);

        return jdbcTemplate.query(sql.toString(), this::mapRecipeRow, args.toArray()).stream()
            .map(row -> toRecipeResponse(row, findIngredients(row.id()), List.of(), List.of(), List.of()))
                .toList();
    }

    public List<RecipeResponse> recommendRecipes(List<String> ownedIngredients, List<String> avoidIngredients, int limit) {
        List<RecipeResponse> candidates = findRecipes(null, List.of(), 0, Math.max(limit * 5, 50), "latest");
        Set<String> owned = normalizeSet(ownedIngredients);
        Set<String> avoided = normalizeSet(avoidIngredients);
        return candidates.stream()
                .filter(recipe -> recipe.ingredients().stream()
                        .noneMatch(ingredient -> containsAny(ingredient.name(), avoided)))
                .map(recipe -> withMatch(recipe, owned))
                .filter(recipe -> recipe.matchRate() > 0 || owned.isEmpty())
                .sorted((left, right) -> {
                    int matchCompare = Double.compare(right.matchRate(), left.matchRate());
                    if (matchCompare != 0) {
                        return matchCompare;
                    }
                    return Integer.compare(left.missingCount(), right.missingCount());
                })
                .limit(Math.max(1, Math.min(limit, 100)))
                .toList();
    }

    public List<String> findIngredientNames(long recipeId) {
        return findIngredients(recipeId).stream()
                .map(RecipeIngredientResponse::name)
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
            return Optional.of(toRecipeResponse(row, findIngredients(row.id()), findIngredientGroups(row.id()), findSteps(row.id()), findStepDetails(row.id())));
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

    private List<RecipeIngredientGroupResponse> findIngredientGroups(long recipeId) {
        String sql = """
                SELECT rig.group_id,
                       rig.group_name,
                       COALESCE(rig.sort_order, 0) AS group_sort,
                       ri.ingredient_id,
                       ri.original_name,
                       ri.amount_text
                  FROM recipe_ingredients ri
                  LEFT JOIN recipe_ingredient_groups rig ON rig.group_id = ri.group_id
                 WHERE ri.recipe_id = ?
                 ORDER BY COALESCE(rig.sort_order, 0), ri.sort_order, ri.recipe_ingredient_id
                """;

        Map<String, List<RecipeIngredientItemResponse>> itemsMap = new LinkedHashMap<>();
        Map<String, Long> groupIdMap = new LinkedHashMap<>();
        Map<String, String> groupNameMap = new LinkedHashMap<>();
        Map<String, Integer> groupSortMap = new LinkedHashMap<>();

        jdbcTemplate.query(sql, rs -> {
            long rawGroupId = rs.getLong("group_id");
            Long groupId = rs.wasNull() ? null : rawGroupId;
            String groupName = rs.getString("group_name");
            int groupSort = rs.getInt("group_sort");
            long ingredientId = rs.getLong("ingredient_id");
            String originalName = nullToEmpty(rs.getString("original_name"));
            String amountText = nullToEmpty(rs.getString("amount_text"));

            String key = groupId != null ? String.valueOf(groupId) : "__null__";
            itemsMap.computeIfAbsent(key, k -> new ArrayList<>())
                    .add(new RecipeIngredientItemResponse(ingredientId, originalName, amountText));
            groupIdMap.putIfAbsent(key, groupId);
            groupNameMap.putIfAbsent(key, groupName);
            groupSortMap.putIfAbsent(key, groupSort);
        }, recipeId);

        return itemsMap.entrySet().stream()
                .map(e -> new RecipeIngredientGroupResponse(
                        groupIdMap.get(e.getKey()),
                        groupNameMap.get(e.getKey()),
                        groupSortMap.getOrDefault(e.getKey(), 0),
                        e.getValue()
                ))
                .toList();
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

        private List<RecipeStepResponse> findStepDetails(long recipeId) {
        String sql = """
            SELECT step_no,
                   instruction,
                   image_url
              FROM recipe_steps
             WHERE recipe_id = ?
             ORDER BY step_no
            """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> new RecipeStepResponse(
            rs.getInt("step_no"),
            nullToEmpty(rs.getString("instruction")),
            nullToEmpty(rs.getString("image_url"))
        ), recipeId);
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
            List<RecipeIngredientGroupResponse> groups,
            List<String> steps,
            List<RecipeStepResponse> stepDetails
    ) {
        NutritionResponse nutrition = new NutritionResponse(
                toInt(row.calorieKcal()),
                toDouble(row.carbohydrateG()),
                toDouble(row.proteinG()),
                toDouble(row.fatG()),
                toDouble(row.sodiumMg())
        );
        int totalIngredientCount = groups.isEmpty()
                ? ingredients.size()
                : groups.stream().mapToInt(g -> g.items().size()).sum();
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
                stepDetails,
                nutrition,
                0,
                List.of(),
                ingredients.stream().map(RecipeIngredientResponse::name).toList(),
                ingredients.size(),
                groups,
                totalIngredientCount
        );
    }

    private RecipeResponse withMatch(RecipeResponse recipe, Set<String> ownedIngredients) {
        List<String> matched = new ArrayList<>();
        List<String> missing = new ArrayList<>();
        for (RecipeIngredientResponse ingredient : recipe.ingredients()) {
            if (containsAny(ingredient.name(), ownedIngredients)) {
                matched.add(ingredient.name());
            } else {
                missing.add(ingredient.name());
            }
        }
        double matchRate = recipe.ingredients().isEmpty()
                ? 0
                : BigDecimal.valueOf((matched.size() * 100.0) / recipe.ingredients().size())
                        .setScale(1, RoundingMode.HALF_UP)
                        .doubleValue();
        return new RecipeResponse(
                recipe.id(),
                recipe.title(),
                recipe.image(),
                recipe.method(),
                recipe.category(),
                recipe.calories(),
                recipe.tags(),
                recipe.ingredients(),
                recipe.steps(),
                recipe.stepDetails(),
                recipe.nutrition(),
                matchRate,
                matched,
                missing,
                missing.size(),
                recipe.groups(),
                recipe.totalIngredientCount()
        );
    }

    private String orderBy(String sort) {
        if ("calorieAsc".equalsIgnoreCase(sort)) {
            return " ORDER BY r.calorie_kcal IS NULL, r.calorie_kcal ASC, r.recipe_id DESC";
        }
        if ("calorieDesc".equalsIgnoreCase(sort)) {
            return " ORDER BY r.calorie_kcal DESC, r.recipe_id DESC";
        }
        if ("name".equalsIgnoreCase(sort)) {
            return " ORDER BY r.name ASC, r.recipe_id DESC";
        }
        return " ORDER BY r.recipe_id DESC";
    }

    private static Set<String> normalizeSet(List<String> values) {
        Set<String> normalized = new HashSet<>();
        if (values == null) {
            return normalized;
        }
        for (String value : values) {
            if (hasText(value)) {
                normalized.add(normalize(value));
            }
        }
        return normalized;
    }

    private static boolean containsAny(String value, Set<String> candidates) {
        if (candidates.isEmpty() || !hasText(value)) {
            return false;
        }
        String normalizedValue = normalize(value);
        return candidates.stream().anyMatch(candidate -> {
                String normCandidate = normalize(candidate);
                // If either side is very short, require exact match to avoid spurious partial matches
                if (normCandidate.length() < 2 || normalizedValue.length() < 2) {
                    return normalizedValue.equals(normCandidate);
                }
                return normalizedValue.contains(normCandidate) || normCandidate.contains(normalizedValue);
        });
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

    private static String normalize(String value) {
        if (value == null) return "";
        String base = value.replaceAll("\\s+", "").toLowerCase();
        // basic synonym mapping for common ingredients
        return applySynonyms(base);
    }

    private static String applySynonyms(String normalized) {
        if (normalized == null) return "";
        switch (normalized) {
            case "계란":
            case "egg":
                return "달걀";
            case "달걀":
                return "달걀";
            case "대파":
                return "파";
            case "방울토마토":
            case "방울토마토소박이":
                return "방울토마토";
            default:
                return normalized;
        }
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

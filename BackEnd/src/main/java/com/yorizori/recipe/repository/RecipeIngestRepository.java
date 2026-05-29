package com.yorizori.recipe.repository;

import com.yorizori.recipe.dto.FoodRecipeRow;
import com.yorizori.recipe.dto.RecipeStepPayload;
import com.yorizori.recipe.service.ParsedIngredient;
import com.yorizori.recipe.service.RecipeImagePayload;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.List;
import java.util.Set;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class RecipeIngestRepository {

    private static final String SOURCE = "COOKRCP01";
    private static final String JOB_TYPE = "RECIPE_INGEST";
    private static final String REPARSE_JOB_TYPE = "RECIPE_REPARSE";

    private final JdbcTemplate jdbcTemplate;

    public RecipeIngestRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public long createIngestJob(String serviceId, int startIdx, int endIdx) {
        long ingestJobId = nextId("ingest_jobs", "ingest_job_id");
        String endpoint = "/api/" + serviceId + "/xml/" + startIdx + "/" + endIdx;
        String sql = """
                INSERT INTO ingest_jobs (
                    ingest_job_id, source, job_type, job_status, request_endpoint,
                    total_count, success_count, fail_count, started_at, created_at
                )
                VALUES (?, ?, ?, 'RUNNING', ?, 0, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """;
        jdbcTemplate.update(sql, ingestJobId, SOURCE, JOB_TYPE, truncate(endpoint, 500));
        return ingestJobId;
    }

    public long createReparseJob() {
        long ingestJobId = nextId("ingest_jobs", "ingest_job_id");
        String sql = """
                INSERT INTO ingest_jobs (
                    ingest_job_id, source, job_type, job_status, request_endpoint,
                    total_count, success_count, fail_count, started_at, created_at
                )
                VALUES (?, ?, ?, 'RUNNING', 'local://api_raw_responses', 0, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """;
        jdbcTemplate.update(sql, ingestJobId, SOURCE, REPARSE_JOB_TYPE);
        return ingestJobId;
    }

    public java.util.Map<String, Object> getJobStatus(long jobId) {
        return jdbcTemplate.queryForMap(
                "SELECT ingest_job_id, job_status, total_count, success_count, fail_count, error_message, started_at, finished_at FROM ingest_jobs WHERE ingest_job_id = ?",
                jobId
        );
    }

    public List<String> findAllRawResponseBodies() {
        // response_hash 기준 중복 제거 — 동일 배치를 여러 번 수집했어도 한 번만 처리
        return jdbcTemplate.queryForList(
                "SELECT response_body FROM api_raw_responses WHERE source = ? AND raw_response_id IN (" +
                "  SELECT MIN(raw_response_id) FROM api_raw_responses WHERE source = ? GROUP BY response_hash" +
                ") ORDER BY raw_response_id",
                String.class,
                SOURCE, SOURCE
        );
    }

    public void saveRawResponse(long ingestJobId, String requestUrl, String responseBody, int statusCode) {
        long rawResponseId = nextId("api_raw_responses", "raw_response_id");
        String sql = """
                INSERT INTO api_raw_responses (
                    raw_response_id, ingest_job_id, source, source_item_id, content_type,
                    response_body, response_hash, fetched_at
                )
                VALUES (?, ?, ?, ?, 'xml', ?, ?, CURRENT_TIMESTAMP)
                """;
        jdbcTemplate.update(
                sql,
                rawResponseId,
                ingestJobId,
                SOURCE,
                truncate(requestUrl, 100),
                responseBody,
                sha256(responseBody)
        );
    }

    public void updateJobProgress(long ingestJobId, int totalCount, int savedCount) {
        String sql = """
                UPDATE ingest_jobs
                   SET total_count = ?,
                       success_count = ?
                 WHERE ingest_job_id = ?
                """;
        jdbcTemplate.update(sql, totalCount, savedCount, ingestJobId);
    }

    public void markJobSuccess(long ingestJobId, Integer totalCount, int savedCount) {
        String sql = """
                UPDATE ingest_jobs
                   SET job_status = 'SUCCESS',
                       finished_at = CURRENT_TIMESTAMP,
                       total_count = ?,
                       success_count = ?,
                       fail_count = 0,
                       error_message = NULL
                 WHERE ingest_job_id = ?
                """;
        jdbcTemplate.update(sql, nullToZero(totalCount), savedCount, ingestJobId);
    }

    public void markJobFailed(long ingestJobId, String errorMessage) {
        String sql = """
                UPDATE ingest_jobs
                   SET job_status = 'FAILED',
                       finished_at = CURRENT_TIMESTAMP,
                       fail_count = 1,
                       error_message = ?
                 WHERE ingest_job_id = ?
                """;
        jdbcTemplate.update(sql, truncate(errorMessage, 2000), ingestJobId);
    }

    public long upsertRecipe(FoodRecipeRow row) {
        Long existingId = findRecipeId(row.getRecipeSeq());
        if (existingId != null) {
            updateRecipe(existingId, row);
            return existingId;
        }

        long recipeId = nextId("recipes", "recipe_id");
        String sql = """
                INSERT INTO recipes (
                    recipe_id, source, source_recipe_id, name, description, category,
                    calorie_kcal, carbohydrate_g, protein_g, fat_g, sodium_mg,
                    source_url, is_active, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """;
        jdbcTemplate.update(
                sql,
                recipeId,
                SOURCE,
                truncate(row.getRecipeSeq(), 100),
                truncate(required(row.getName(), "recipe name"), 255),
                trimToNull(row.getSodiumTip()),
                truncate(row.getCategory(), 100),
                parseDecimal(row.getCalorie()),
                parseDecimal(row.getCarbohydrate()),
                parseDecimal(row.getProtein()),
                parseDecimal(row.getFat()),
                parseDecimal(row.getSodium()),
                truncate(row.getMainImageUrl(), 500)
        );
        return recipeId;
    }

    public void replaceRecipeIngredients(long recipeId, List<ParsedIngredient> ingredients) {
        jdbcTemplate.update("DELETE FROM recipe_ingredients WHERE recipe_id = ?", recipeId);
        Set<Long> linkedIngredientIds = new HashSet<>();
        for (ParsedIngredient ingredient : ingredients) {
            long ingredientId = upsertIngredient(ingredient.name());
            if (!linkedIngredientIds.add(ingredientId)) {
                continue;
            }
            long recipeIngredientId = nextId("recipe_ingredients", "recipe_ingredient_id");
            String sql = """
                    INSERT INTO recipe_ingredients (
                        recipe_ingredient_id, recipe_id, ingredient_id, original_name,
                        quantity, unit, amount_text, section, is_required, sort_order, created_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?, CURRENT_TIMESTAMP)
                    """;
            jdbcTemplate.update(
                    sql,
                    recipeIngredientId,
                    recipeId,
                    ingredientId,
                    truncate(ingredient.rawText(), 150),
                    scaleQuantity(ingredient.quantity()),
                    truncate(ingredient.unit(), 30),
                    truncate(ingredient.ingredientText(), 100),
                    truncate(ingredient.section(), 100),
                    ingredient.displayOrder()
            );
        }
    }

    public void replaceRecipeSteps(long recipeId, List<RecipeStepPayload> steps) {
        jdbcTemplate.update("DELETE FROM recipe_steps WHERE recipe_id = ?", recipeId);
        String sql = """
                INSERT INTO recipe_steps (
                    step_id, recipe_id, step_no, instruction, duration_min, image_url, created_at
                )
                VALUES (?, ?, ?, ?, NULL, ?, CURRENT_TIMESTAMP)
                """;
        for (RecipeStepPayload step : steps) {
            jdbcTemplate.update(
                    sql,
                    nextId("recipe_steps", "step_id"),
                    recipeId,
                    step.stepNo(),
                    step.description(),
                    truncate(step.imageUrl(), 500)
            );
        }
    }

    public void replaceRecipeImages(long recipeId, List<RecipeImagePayload> images) {
        jdbcTemplate.update("DELETE FROM images WHERE recipe_id = ?", recipeId);
        String sql = """
                INSERT INTO images (image_id, recipe_id, image_url, image_type, sort_order, created_at)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                """;
        for (RecipeImagePayload image : images) {
            jdbcTemplate.update(
                    sql,
                    nextId("images", "image_id"),
                    recipeId,
                    truncate(image.imageUrl(), 500),
                    truncate(image.imageType(), 30),
                    image.displayOrder()
            );
        }
    }

    private void updateRecipe(long recipeId, FoodRecipeRow row) {
        String sql = """
                UPDATE recipes
                   SET name = ?,
                       description = ?,
                       category = ?,
                       calorie_kcal = ?,
                       carbohydrate_g = ?,
                       protein_g = ?,
                       fat_g = ?,
                       sodium_mg = ?,
                       source_url = ?,
                       is_active = TRUE,
                       updated_at = CURRENT_TIMESTAMP
                 WHERE recipe_id = ?
                """;
        jdbcTemplate.update(
                sql,
                truncate(required(row.getName(), "recipe name"), 255),
                trimToNull(row.getSodiumTip()),
                truncate(row.getCategory(), 100),
                parseDecimal(row.getCalorie()),
                parseDecimal(row.getCarbohydrate()),
                parseDecimal(row.getProtein()),
                parseDecimal(row.getFat()),
                parseDecimal(row.getSodium()),
                truncate(row.getMainImageUrl(), 500),
                recipeId
        );
    }

    private long upsertIngredient(String name) {
        String normalizedName = normalize(name);
        Long existingId = findIngredientId(normalizedName);
        if (existingId != null) {
            return existingId;
        }

        long ingredientId = nextId("ingredients", "ingredient_id");
        String sql = """
                INSERT INTO ingredients (
                    ingredient_id, name, normalized_name, category, default_unit, created_at, updated_at
                )
                VALUES (?, ?, ?, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """;
        jdbcTemplate.update(sql, ingredientId, truncate(name, 100), truncate(normalizedName, 100));
        return ingredientId;
    }

    private Long findRecipeId(String sourceRecipeId) {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT recipe_id FROM recipes WHERE source = ? AND source_recipe_id = ? ORDER BY recipe_id LIMIT 1",
                    Long.class,
                    SOURCE,
                    sourceRecipeId
            );
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    private Long findIngredientId(String normalizedName) {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT ingredient_id FROM ingredients WHERE normalized_name = ? ORDER BY ingredient_id LIMIT 1",
                    Long.class,
                    normalizedName
            );
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    private long nextId(String tableName, String idColumn) {
        Long nextId = jdbcTemplate.queryForObject(
                "SELECT COALESCE(MAX(" + idColumn + "), 0) + 1 FROM " + tableName,
                Long.class
        );
        if (nextId == null) {
            throw new IllegalStateException("Failed to allocate id for " + tableName);
        }
        return nextId;
    }

    private static BigDecimal parseDecimal(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        String normalized = value.trim().replaceAll("[^0-9.\\-]", "");
        if (normalized.isEmpty()) {
            return null;
        }
        return new BigDecimal(normalized);
    }

    private static BigDecimal scaleQuantity(BigDecimal quantity) {
        if (quantity == null) {
            return null;
        }
        return quantity.setScale(2, java.math.RoundingMode.HALF_UP);
    }

    private static String normalize(String value) {
        return required(value, "ingredient name").replaceAll("\\s+", "").toLowerCase();
    }

    private static String required(String value, String fieldName) {
        String trimmed = trimToNull(value);
        if (trimmed == null) {
            throw new IllegalArgumentException(fieldName + " is required.");
        }
        return trimmed;
    }

    private static String trimToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }

    private static String truncate(String value, int maxLength) {
        String trimmed = trimToNull(value);
        if (trimmed == null || trimmed.length() <= maxLength) {
            return trimmed;
        }
        return trimmed.substring(0, maxLength);
    }

    private static int nullToZero(Integer value) {
        return value == null ? 0 : value;
    }

    private static String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available.", e);
        }
    }
}

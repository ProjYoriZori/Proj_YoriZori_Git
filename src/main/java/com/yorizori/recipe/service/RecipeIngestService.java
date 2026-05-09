package com.yorizori.recipe.service;

import com.yorizori.foodapi.FoodApiClient;
import com.yorizori.foodapi.FoodApiFetchResult;
import com.yorizori.foodapi.FoodApiProperties;
import com.yorizori.recipe.dto.FoodApiResponse;
import com.yorizori.recipe.dto.FoodRecipeRow;
import com.yorizori.recipe.dto.RecipeStepPayload;
import com.yorizori.recipe.repository.RecipeIngestRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class RecipeIngestService {

    private static final Pattern INGREDIENT_AMOUNT_PATTERN =
            Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(g|kg|ml|l|L|\\uAC1C|\\uB300|\\uCABD|\\uC54C|\\uC7A5|\\uCEF5|\\uD070\\uC220|\\uC791\\uC740\\uC220|\\uB9C8\\uB9AC|\\uC90C|Ts|ts|T|t)?");

    private final FoodApiClient foodApiClient;
    private final FoodApiProperties foodApiProperties;
    private final RecipeIngestRepository repository;
    private final TransactionTemplate transactionTemplate;

    public RecipeIngestService(
            FoodApiClient foodApiClient,
            FoodApiProperties foodApiProperties,
            RecipeIngestRepository repository,
            TransactionTemplate transactionTemplate
    ) {
        this.foodApiClient = foodApiClient;
        this.foodApiProperties = foodApiProperties;
        this.repository = repository;
        this.transactionTemplate = transactionTemplate;
    }

    public RecipeIngestResult ingestRecipes(int startIdx, int endIdx) {
        validateRange(startIdx, endIdx);
        long jobId = repository.createIngestJob(foodApiProperties.getServiceId(), startIdx, endIdx);

        try {
            FoodApiFetchResult fetchResult = foodApiClient.fetchRecipes(startIdx, endIdx);
            repository.saveRawResponse(jobId, fetchResult.requestUrl(), fetchResult.rawBody(), 200);

            FoodApiResponse response = fetchResult.response();
            validateApiResult(response);
            int savedCount = 0;
            for (FoodRecipeRow row : response.getRows()) {
                if (!hasText(row.getRecipeSeq()) || !hasText(row.getName())) {
                    continue;
                }
                transactionTemplate.executeWithoutResult(status -> saveRecipeRow(row));
                savedCount++;
            }

            repository.markJobSuccess(jobId, response.getTotalCount(), savedCount);
            return new RecipeIngestResult(
                    jobId,
                    startIdx,
                    endIdx,
                    response.getTotalCount(),
                    response.getRows().size(),
                    savedCount
            );
        } catch (RuntimeException e) {
            repository.markJobFailed(jobId, e.getMessage());
            throw e;
        }
    }

    private void saveRecipeRow(FoodRecipeRow row) {
        long recipeId = repository.upsertRecipe(row);
        repository.replaceRecipeIngredients(recipeId, parseIngredients(row.getIngredientText()));
        List<RecipeStepPayload> steps = row.toStepPayloads();
        repository.replaceRecipeSteps(recipeId, steps);
        repository.replaceRecipeImages(recipeId, collectImages(row, steps));
    }

    private static void validateApiResult(FoodApiResponse response) {
        if (response.getResult() == null || !hasText(response.getResult().getCode())) {
            return;
        }
        String code = response.getResult().getCode().trim();
        if (!"INFO-000".equals(code)) {
            throw new IllegalStateException("Food API returned " + code + ": " + response.getResult().getMessage());
        }
    }

    private static void validateRange(int startIdx, int endIdx) {
        if (startIdx < 1) {
            throw new IllegalArgumentException("startIdx must be greater than or equal to 1.");
        }
        if (endIdx < startIdx) {
            throw new IllegalArgumentException("endIdx must be greater than or equal to startIdx.");
        }
    }

    private static List<ParsedIngredient> parseIngredients(String ingredientText) {
        if (!hasText(ingredientText)) {
            return List.of();
        }

        String normalized = ingredientText
                .replace("\r\n", "\n")
                .replace('\r', '\n')
                .replace('\uFF0C', ',')
                .replace('\u318D', ',')
                .replace('\u00B7', ',');
        String[] parts = normalized.split("[,\\n;]+");
        List<ParsedIngredient> ingredients = new ArrayList<>();
        int order = 1;
        for (String part : parts) {
            String raw = removeSectionLabel(part.trim());
            if (!hasText(raw)) {
                continue;
            }
            Matcher matcher = INGREDIENT_AMOUNT_PATTERN.matcher(raw);
            BigDecimal quantity = null;
            String unit = null;
            if (matcher.find()) {
                quantity = new BigDecimal(matcher.group(1));
                unit = trimToNull(matcher.group(2));
            }
            String name = raw.replaceAll("\\([^)]*\\)", " ")
                    .replaceAll(INGREDIENT_AMOUNT_PATTERN.pattern(), " ")
                    .replaceAll("\\s+", " ")
                    .trim();
            if (!hasText(name)) {
                name = raw;
            }
            ingredients.add(new ParsedIngredient(name, raw, quantity, unit, order++));
        }
        return ingredients;
    }

    private static String removeSectionLabel(String value) {
        return value.replaceFirst("^\\[[^]]+]", "")
                .replaceFirst("^[\\uAC00-\\uD7A3A-Za-z\\s]+\\s*:", "")
                .trim();
    }

    private static List<RecipeImagePayload> collectImages(FoodRecipeRow row, List<RecipeStepPayload> steps) {
        List<RecipeImagePayload> images = new ArrayList<>();
        if (hasText(row.getMainImageUrl())) {
            images.add(new RecipeImagePayload("MAIN", row.getMainImageUrl().trim(), 1));
        }
        if (hasText(row.getThumbnailImageUrl())) {
            images.add(new RecipeImagePayload("THUMBNAIL", row.getThumbnailImageUrl().trim(), 2));
        }
        for (RecipeStepPayload step : steps) {
            if (hasText(step.imageUrl())) {
                images.add(new RecipeImagePayload("STEP", step.imageUrl().trim(), step.stepNo()));
            }
        }
        return images;
    }

    private static boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private static String trimToNull(String value) {
        return hasText(value) ? value.trim() : null;
    }
}

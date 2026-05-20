package com.yorizori.feature;

import com.yorizori.auth.AuthDtos.UserProfileResponse;
import com.yorizori.recipe.dto.NutritionResponse;
import com.yorizori.recipe.dto.RecipeResponse;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class FeatureDtos {

    private FeatureDtos() {
    }

    public record ProfileUpdateRequest(
            String nickname,
            String gender,
            Integer age,
            BigDecimal heightCm,
            BigDecimal weightKg,
            String goal,
            String activityLevel
    ) {
    }

    public record PantryItemRequest(String name, String category, String quantityText, LocalDate expiresAt, String memo) {
    }

    public record PantryItemResponse(
            long id,
            String name,
            String category,
            String quantityText,
            LocalDate expiresAt,
            String memo,
            long expiresInDays,
            boolean expiringSoon
    ) {
    }

    public record AvoidIngredientRequest(String name, String reason) {
    }

    public record AvoidIngredientResponse(long id, String name, String reason) {
    }

    public record RecommendRequest(List<String> ingredients, List<String> avoidIngredients, Integer limit) {
    }

    public record GenerateShoppingItemsRequest(long recipeId) {
    }

    public record ShoppingItemRequest(String name) {
    }

    public record ShoppingItemPatchRequest(Boolean checked) {
    }

    public record ShoppingItemResponse(long id, Long recipeId, String name, boolean checked) {
    }

    public record NutritionLogRequest(
            Long recipeId,
            String customFoodName,
            LocalDate mealDate,
            String mealTime,
            BigDecimal multiplier,
            NutritionResponse nutrition
    ) {
    }

    public record NutritionLogResponse(
            long id,
            Long recipeId,
            String title,
            LocalDate mealDate,
            String mealTime,
            BigDecimal multiplier,
            NutritionResponse nutrition,
            LocalDateTime createdAt
    ) {
    }

    public record DailyNutritionSummaryResponse(
            LocalDate date,
            NutritionResponse consumed,
            NutritionResponse recommended,
            NutritionResponse ratioPercent,
            List<NutritionLogResponse> meals
    ) {
    }

    public record FavoriteRequest(long recipeId) {
    }

    public record SeasonalIngredientResponse(int month, String name, String category, List<RecipeResponse> recipes) {
    }

    public record OcrIngredientRequest(String text, String imageBase64) {
    }

    public record OcrIngredientResponse(List<String> ingredients, String rawText, String message) {
    }

    public record OcrNutritionRequest(String imageBase64, String mediaType) {
    }

    public record OcrNutritionResponse(
            String name,
            String servingSize,
            Double calories,
            Double carbs,
            Double protein,
            Double fat,
            Double sodium,
            String rawText,
            String message
    ) {
    }

    public record BarcodeLookupRequest(String barcode) {
    }

    public record BarcodeLookupResponse(String barcode, String productName, NutritionResponse nutrition, String message) {
    }

    public record CustomFoodRequest(String name, String servingSize, NutritionResponse nutrition) {
    }

    public record CustomFoodResponse(long id, String name, String servingSize, NutritionResponse nutrition) {
    }

    public record MeResponse(UserProfileResponse profile) {
    }
}

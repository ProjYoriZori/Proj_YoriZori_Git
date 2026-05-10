package com.yorizori.recipe.dto;

public record NutritionResponse(
        int kcal,
        double carbs,
        double protein,
        double fat,
        double sodium
) {
}

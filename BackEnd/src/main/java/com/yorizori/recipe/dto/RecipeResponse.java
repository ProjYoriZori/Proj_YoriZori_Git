package com.yorizori.recipe.dto;

import java.util.List;

public record RecipeResponse(
        String id,
        String title,
        String image,
        String method,
        String category,
        int calories,
        List<String> tags,
        List<RecipeIngredientResponse> ingredients,
        List<String> steps,
        NutritionResponse nutrition
) {
}

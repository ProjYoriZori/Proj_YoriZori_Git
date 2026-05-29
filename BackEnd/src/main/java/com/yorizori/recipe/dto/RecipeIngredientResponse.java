package com.yorizori.recipe.dto;

public record RecipeIngredientResponse(
        String name,
        String amount,
        String section
) {
}

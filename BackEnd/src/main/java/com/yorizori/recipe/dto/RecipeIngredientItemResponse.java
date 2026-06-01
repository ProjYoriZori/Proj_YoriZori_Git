package com.yorizori.recipe.dto;

public record RecipeIngredientItemResponse(
        long ingredientId,
        String originalName,
        String amountText
) {
}

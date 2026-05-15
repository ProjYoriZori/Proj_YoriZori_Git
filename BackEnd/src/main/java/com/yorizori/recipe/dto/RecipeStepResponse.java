package com.yorizori.recipe.dto;

public record RecipeStepResponse(
        int stepNo,
        String instruction,
        String imageUrl
) {
}
package com.yorizori.recipe.dto;

public record RecipeStepPayload(
        int stepNo,
        String description,
        String imageUrl
) {
}

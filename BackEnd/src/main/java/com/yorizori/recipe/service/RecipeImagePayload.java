package com.yorizori.recipe.service;

public record RecipeImagePayload(
        String imageType,
        String imageUrl,
        int displayOrder
) {
}

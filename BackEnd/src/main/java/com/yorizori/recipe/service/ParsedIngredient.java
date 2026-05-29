package com.yorizori.recipe.service;

import java.math.BigDecimal;

public record ParsedIngredient(
        String name,
        String rawText,
        String ingredientText,
        BigDecimal quantity,
        String unit,
        int displayOrder,
        String section
) {
}

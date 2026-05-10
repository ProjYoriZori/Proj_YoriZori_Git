package com.yorizori.recipe.service;

import java.math.BigDecimal;

public record ParsedIngredient(
        String name,
        String rawText,
        BigDecimal quantity,
        String unit,
        int displayOrder
) {
}

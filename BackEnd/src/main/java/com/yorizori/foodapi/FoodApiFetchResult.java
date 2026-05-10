package com.yorizori.foodapi;

import com.yorizori.recipe.dto.FoodApiResponse;

public record FoodApiFetchResult(
        String requestUrl,
        String rawBody,
        FoodApiResponse response
) {
}

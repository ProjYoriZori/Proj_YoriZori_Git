package com.yorizori.recipe.dto;

import java.util.List;

public record RecipeIngredientGroupResponse(
        Long groupId,
        String groupName,
        int sortOrder,
        List<RecipeIngredientItemResponse> items
) {
}

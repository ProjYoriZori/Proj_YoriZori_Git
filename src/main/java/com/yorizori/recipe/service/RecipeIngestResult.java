package com.yorizori.recipe.service;

public record RecipeIngestResult(
        long ingestJobId,
        int startIdx,
        int endIdx,
        Integer totalCount,
        int fetchedCount,
        int savedCount
) {
}

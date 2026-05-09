package com.yorizori.recipe.web;

import com.yorizori.recipe.service.RecipeIngestResult;
import com.yorizori.recipe.service.RecipeIngestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/ingest")
public class RecipeIngestController {

    private final RecipeIngestService recipeIngestService;

    public RecipeIngestController(RecipeIngestService recipeIngestService) {
        this.recipeIngestService = recipeIngestService;
    }

    @PostMapping("/recipes")
    public ResponseEntity<RecipeIngestResult> ingestRecipes(
            @RequestParam(defaultValue = "1") int startIdx,
            @RequestParam(defaultValue = "100") int endIdx
    ) {
        return ResponseEntity.ok(recipeIngestService.ingestRecipes(startIdx, endIdx));
    }
}

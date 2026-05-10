package com.yorizori.recipe.web;

import com.yorizori.recipe.dto.RecipeResponse;
import com.yorizori.recipe.service.RecipeQueryService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/recipes")
public class RecipeController {

    private final RecipeQueryService recipeQueryService;

    public RecipeController(RecipeQueryService recipeQueryService) {
        this.recipeQueryService = recipeQueryService;
    }

    @GetMapping
    public ResponseEntity<List<RecipeResponse>> findRecipes(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "50") int limit
    ) {
        return ResponseEntity.ok(recipeQueryService.findRecipes(query, limit));
    }

    @GetMapping("/{recipeId}")
    public ResponseEntity<RecipeResponse> findRecipe(@PathVariable long recipeId) {
        return ResponseEntity.ok(recipeQueryService.findRecipe(recipeId));
    }
}

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
            @RequestParam(required = false) List<String> ingredients,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) Integer limit,
            @RequestParam(defaultValue = "latest") String sort
    ) {
        int resolvedSize = size != null ? size : (limit != null ? limit : 50);
        return ResponseEntity.ok(recipeQueryService.findRecipes(query, ingredients, page, resolvedSize, sort));
    }

    @GetMapping("/{recipeId}")
    public ResponseEntity<RecipeResponse> findRecipe(@PathVariable long recipeId) {
        return ResponseEntity.ok(recipeQueryService.findRecipe(recipeId));
    }
}

package com.yorizori.recipe.service;

import com.yorizori.recipe.dto.RecipeResponse;
import com.yorizori.recipe.repository.RecipeQueryRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class RecipeQueryService {

    private final RecipeQueryRepository repository;

    public RecipeQueryService(RecipeQueryRepository repository) {
        this.repository = repository;
    }

    public List<RecipeResponse> findRecipes(String query, List<String> ingredients, int page, int size, String sort) {
        return repository.findRecipes(query, ingredients, page, size, sort);
    }

    public RecipeResponse findRecipe(long recipeId) {
        return repository.findRecipe(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found: " + recipeId));
    }
}

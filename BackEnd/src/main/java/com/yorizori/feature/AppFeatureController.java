package com.yorizori.feature;

import com.yorizori.auth.AuthDtos.UserProfileResponse;
import com.yorizori.auth.AuthSupport;
import com.yorizori.feature.FeatureDtos.AvoidIngredientRequest;
import com.yorizori.feature.FeatureDtos.AvoidIngredientResponse;
import com.yorizori.feature.FeatureDtos.BarcodeLookupRequest;
import com.yorizori.feature.FeatureDtos.BarcodeLookupResponse;
import com.yorizori.feature.FeatureDtos.CustomFoodRequest;
import com.yorizori.feature.FeatureDtos.CustomFoodResponse;
import com.yorizori.feature.FeatureDtos.DailyNutritionSummaryResponse;
import com.yorizori.feature.FeatureDtos.FavoriteRequest;
import com.yorizori.feature.FeatureDtos.GenerateShoppingItemsRequest;
import com.yorizori.feature.FeatureDtos.NutritionLogRequest;
import com.yorizori.feature.FeatureDtos.NutritionLogResponse;
import com.yorizori.feature.FeatureDtos.OcrIngredientRequest;
import com.yorizori.feature.FeatureDtos.OcrIngredientResponse;
import com.yorizori.feature.FeatureDtos.PantryItemRequest;
import com.yorizori.feature.FeatureDtos.PantryItemResponse;
import com.yorizori.feature.FeatureDtos.ProfileUpdateRequest;
import com.yorizori.feature.FeatureDtos.RecommendRequest;
import com.yorizori.feature.FeatureDtos.SeasonalIngredientResponse;
import com.yorizori.feature.FeatureDtos.ShoppingItemPatchRequest;
import com.yorizori.feature.FeatureDtos.ShoppingItemRequest;
import com.yorizori.feature.FeatureDtos.ShoppingItemResponse;
import com.yorizori.recipe.dto.RecipeResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class AppFeatureController {

    private final AppFeatureService service;
    private final AuthSupport authSupport;

    public AppFeatureController(AppFeatureService service, AuthSupport authSupport) {
        this.service = service;
        this.authSupport = authSupport;
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> me(HttpServletRequest request) {
        return ResponseEntity.ok(service.findMe(authSupport.currentUserId(request)));
    }

    @PatchMapping("/me")
    public ResponseEntity<UserProfileResponse> updateMe(
            HttpServletRequest request,
            @RequestBody ProfileUpdateRequest updateRequest
    ) {
        return ResponseEntity.ok(service.updateMe(authSupport.currentUserId(request), updateRequest));
    }

    @GetMapping("/pantry-items")
    public ResponseEntity<List<PantryItemResponse>> pantryItems(HttpServletRequest request) {
        return ResponseEntity.ok(service.findPantryItems(authSupport.currentUserId(request)));
    }

    @PostMapping("/pantry-items")
    public ResponseEntity<PantryItemResponse> addPantryItem(
            HttpServletRequest request,
            @RequestBody PantryItemRequest pantryRequest
    ) {
        return ResponseEntity.ok(service.addPantryItem(authSupport.currentUserId(request), pantryRequest));
    }

    @PatchMapping("/pantry-items/{itemId}")
    public ResponseEntity<PantryItemResponse> updatePantryItem(
            HttpServletRequest request,
            @PathVariable long itemId,
            @RequestBody PantryItemRequest pantryRequest
    ) {
        return ResponseEntity.ok(service.updatePantryItem(authSupport.currentUserId(request), itemId, pantryRequest));
    }

    @DeleteMapping("/pantry-items/{itemId}")
    public ResponseEntity<Map<String, Boolean>> deletePantryItem(HttpServletRequest request, @PathVariable long itemId) {
        service.deletePantryItem(authSupport.currentUserId(request), itemId);
        return ResponseEntity.ok(Map.of("deleted", true));
    }

    @GetMapping("/avoid-ingredients")
    public ResponseEntity<List<AvoidIngredientResponse>> avoidIngredients(HttpServletRequest request) {
        return ResponseEntity.ok(service.findAvoidIngredients(authSupport.currentUserId(request)));
    }

    @PostMapping("/avoid-ingredients")
    public ResponseEntity<AvoidIngredientResponse> addAvoidIngredient(
            HttpServletRequest request,
            @RequestBody AvoidIngredientRequest avoidRequest
    ) {
        return ResponseEntity.ok(service.addAvoidIngredient(authSupport.currentUserId(request), avoidRequest));
    }

    @DeleteMapping("/avoid-ingredients/{avoidIngredientId}")
    public ResponseEntity<Map<String, Boolean>> deleteAvoidIngredient(
            HttpServletRequest request,
            @PathVariable long avoidIngredientId
    ) {
        service.deleteAvoidIngredient(authSupport.currentUserId(request), avoidIngredientId);
        return ResponseEntity.ok(Map.of("deleted", true));
    }

    @PostMapping("/recommend")
    public ResponseEntity<List<RecipeResponse>> recommend(
            HttpServletRequest request,
            @RequestBody RecommendRequest recommendRequest
    ) {
        return ResponseEntity.ok(service.recommend(authSupport.currentUserId(request), recommendRequest));
    }

    @PostMapping("/shopping-items/generate")
    public ResponseEntity<List<ShoppingItemResponse>> generateShoppingItems(
            HttpServletRequest request,
            @RequestBody GenerateShoppingItemsRequest generateRequest
    ) {
        return ResponseEntity.ok(service.generateShoppingItems(authSupport.currentUserId(request),
                generateRequest.recipeId()));
    }

    @GetMapping("/shopping-items")
    public ResponseEntity<List<ShoppingItemResponse>> shoppingItems(HttpServletRequest request) {
        return ResponseEntity.ok(service.findShoppingItems(authSupport.currentUserId(request)));
    }

    @PostMapping("/shopping-items")
    public ResponseEntity<List<ShoppingItemResponse>> addShoppingItem(
            HttpServletRequest request,
            @RequestBody ShoppingItemRequest shoppingRequest
    ) {
        return ResponseEntity.ok(service.addShoppingItem(authSupport.currentUserId(request), shoppingRequest));
    }

    @DeleteMapping("/shopping-items/{shoppingItemId}")
    public ResponseEntity<Map<String, Boolean>> deleteShoppingItem(
            HttpServletRequest request,
            @PathVariable long shoppingItemId
    ) {
        service.deleteShoppingItem(authSupport.currentUserId(request), shoppingItemId);
        return ResponseEntity.ok(Map.of("deleted", true));
    }

    @PatchMapping("/shopping-items/{shoppingItemId}")
    public ResponseEntity<ShoppingItemResponse> patchShoppingItem(
            HttpServletRequest request,
            @PathVariable long shoppingItemId,
            @RequestBody ShoppingItemPatchRequest patchRequest
    ) {
        return ResponseEntity.ok(service.patchShoppingItem(authSupport.currentUserId(request), shoppingItemId,
                patchRequest));
    }

    @PostMapping("/nutrition-logs")
    public ResponseEntity<NutritionLogResponse> addNutritionLog(
            HttpServletRequest request,
            @RequestBody NutritionLogRequest nutritionRequest
    ) {
        return ResponseEntity.ok(service.addNutritionLog(authSupport.currentUserId(request), nutritionRequest));
    }

    @DeleteMapping("/nutrition-logs/{nutritionLogId}")
    public ResponseEntity<Map<String, Boolean>> deleteNutritionLog(
            HttpServletRequest request,
            @PathVariable long nutritionLogId
    ) {
        service.deleteNutritionLog(authSupport.currentUserId(request), nutritionLogId);
        return ResponseEntity.ok(Map.of("deleted", true));
    }

    @GetMapping("/nutrition/daily-summary")
    public ResponseEntity<DailyNutritionSummaryResponse> dailySummary(
            HttpServletRequest request,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return ResponseEntity.ok(service.dailySummary(authSupport.currentUserId(request), date));
    }

    @PostMapping("/favorites")
    public ResponseEntity<Map<String, Boolean>> addFavorite(
            HttpServletRequest request,
            @RequestBody FavoriteRequest favoriteRequest
    ) {
        service.addFavorite(authSupport.currentUserId(request), favoriteRequest.recipeId());
        return ResponseEntity.ok(Map.of("favorited", true));
    }

    @DeleteMapping("/favorites")
    public ResponseEntity<Map<String, Boolean>> deleteFavorite(
            HttpServletRequest request,
            @RequestBody FavoriteRequest favoriteRequest
    ) {
        service.deleteFavorite(authSupport.currentUserId(request), favoriteRequest.recipeId());
        return ResponseEntity.ok(Map.of("favorited", false));
    }

    @GetMapping("/seasonal-ingredients")
    public ResponseEntity<List<SeasonalIngredientResponse>> seasonalIngredients(
            @RequestParam(required = false) Integer month
    ) {
        return ResponseEntity.ok(service.seasonalIngredients(month));
    }

    @PostMapping("/ocr/ingredients")
    public ResponseEntity<OcrIngredientResponse> ocrIngredients(@RequestBody OcrIngredientRequest ocrRequest) {
        return ResponseEntity.ok(service.extractIngredients(ocrRequest));
    }

    @PostMapping("/barcode/lookup")
    public ResponseEntity<BarcodeLookupResponse> barcodeLookup(@RequestBody BarcodeLookupRequest barcodeRequest) {
        return ResponseEntity.ok(service.lookupBarcode(barcodeRequest));
    }

    @GetMapping("/custom-foods")
    public ResponseEntity<List<CustomFoodResponse>> customFoods(HttpServletRequest request) {
        return ResponseEntity.ok(service.findCustomFoods(authSupport.currentUserId(request)));
    }

    @PostMapping("/custom-foods")
    public ResponseEntity<CustomFoodResponse> addCustomFood(
            HttpServletRequest request,
            @RequestBody CustomFoodRequest customFoodRequest
    ) {
        return ResponseEntity.ok(service.addCustomFood(authSupport.currentUserId(request), customFoodRequest));
    }

    @DeleteMapping("/custom-foods/{customFoodId}")
    public ResponseEntity<Map<String, Boolean>> deleteCustomFood(
            HttpServletRequest request,
            @PathVariable long customFoodId
    ) {
        service.deleteCustomFood(authSupport.currentUserId(request), customFoodId);
        return ResponseEntity.ok(Map.of("deleted", true));
    }
}

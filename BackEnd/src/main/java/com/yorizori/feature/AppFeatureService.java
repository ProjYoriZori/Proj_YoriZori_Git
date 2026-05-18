package com.yorizori.feature;

import com.yorizori.auth.AuthDtos.UserProfileResponse;
import com.yorizori.auth.AuthService;
import com.yorizori.feature.FeatureDtos.AvoidIngredientResponse;
import com.yorizori.feature.FeatureDtos.CustomFoodResponse;
import com.yorizori.feature.FeatureDtos.DailyNutritionSummaryResponse;
import com.yorizori.feature.FeatureDtos.NutritionLogResponse;
import com.yorizori.feature.FeatureDtos.PantryItemResponse;
import com.yorizori.feature.FeatureDtos.SeasonalIngredientResponse;
import com.yorizori.feature.FeatureDtos.ShoppingItemResponse;
import com.yorizori.recipe.dto.NutritionResponse;
import com.yorizori.recipe.dto.RecipeResponse;
import com.yorizori.recipe.repository.RecipeQueryRepository;
import com.yorizori.recipe.service.RecipeQueryService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.MatchResult;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AppFeatureService {

    private static final Pattern KOREAN_WORD = Pattern.compile("[가-힣A-Za-z0-9]{2,}");

    private final AppFeatureRepository repository;
    private final RecipeQueryRepository recipeQueryRepository;
    private final RecipeQueryService recipeQueryService;
    private final AuthService authService;

    public AppFeatureService(
            AppFeatureRepository repository,
            RecipeQueryRepository recipeQueryRepository,
            RecipeQueryService recipeQueryService,
            AuthService authService
    ) {
        this.repository = repository;
        this.recipeQueryRepository = recipeQueryRepository;
        this.recipeQueryService = recipeQueryService;
        this.authService = authService;
    }

    public UserProfileResponse findMe(long userId) {
        return authService.findUser(userId).orElseThrow(() -> new IllegalArgumentException("User not found."));
    }

    @Transactional
    public UserProfileResponse updateMe(long userId, FeatureDtos.ProfileUpdateRequest request) {
        return repository.updateProfile(userId, request);
    }

    public List<PantryItemResponse> findPantryItems(long userId) {
        return repository.findPantryItems(userId);
    }

    @Transactional
    public PantryItemResponse addPantryItem(long userId, FeatureDtos.PantryItemRequest request) {
        return repository.addPantryItem(userId, request);
    }

    @Transactional
    public PantryItemResponse updatePantryItem(long userId, long itemId, FeatureDtos.PantryItemRequest request) {
        return repository.updatePantryItem(userId, itemId, request);
    }

    @Transactional
    public void deletePantryItem(long userId, long itemId) {
        repository.deletePantryItem(userId, itemId);
    }

    public List<AvoidIngredientResponse> findAvoidIngredients(long userId) {
        return repository.findAvoidIngredients(userId);
    }

    @Transactional
    public AvoidIngredientResponse addAvoidIngredient(long userId, FeatureDtos.AvoidIngredientRequest request) {
        return repository.addAvoidIngredient(userId, request);
    }

    @Transactional
    public void deleteAvoidIngredient(long userId, long avoidIngredientId) {
        repository.deleteAvoidIngredient(userId, avoidIngredientId);
    }

    public List<RecipeResponse> recommend(long userId, FeatureDtos.RecommendRequest request) {
        List<String> ingredients = request.ingredients() == null || request.ingredients().isEmpty()
                ? repository.findPantryNames(userId)
                : request.ingredients();
        List<String> avoids = new ArrayList<>(repository.findAvoidNames(userId));
        if (request.avoidIngredients() != null) {
            avoids.addAll(request.avoidIngredients());
        }
        return recipeQueryRepository.recommendRecipes(ingredients, avoids, request.limit() == null ? 30 : request.limit());
    }

    @Transactional
    public List<ShoppingItemResponse> generateShoppingItems(long userId, long recipeId) {
        Set<String> owned = normalizeSet(repository.findPantryNames(userId));
        for (String ingredientName : recipeQueryRepository.findIngredientNames(recipeId)) {
            if (!containsAny(ingredientName, owned)) {
                repository.addShoppingItem(userId, recipeId, ingredientName);
            }
        }
        return repository.findShoppingItems(userId);
    }

    public List<ShoppingItemResponse> findShoppingItems(long userId) {
        return repository.findShoppingItems(userId);
    }

    @Transactional
    public List<ShoppingItemResponse> addShoppingItem(long userId, FeatureDtos.ShoppingItemRequest request) {
        repository.addShoppingItem(userId, null, request.name());
        return repository.findShoppingItems(userId);
    }

    @Transactional
    public ShoppingItemResponse patchShoppingItem(long userId, long shoppingItemId,
                                                 FeatureDtos.ShoppingItemPatchRequest request) {
        return repository.patchShoppingItem(userId, shoppingItemId, request.checked());
    }

    @Transactional
    public void deleteShoppingItem(long userId, long shoppingItemId) {
        repository.deleteShoppingItem(userId, shoppingItemId);
    }

    @Transactional
    public NutritionLogResponse addNutritionLog(long userId, FeatureDtos.NutritionLogRequest request) {
        if (request.recipeId() != null) {
            RecipeResponse recipe = recipeQueryService.findRecipe(request.recipeId());
            return repository.addNutritionLog(userId, request, recipe.title(), recipe.nutrition());
        }
        NutritionResponse nutrition = request.nutrition();
        if (nutrition == null) {
            throw new IllegalArgumentException("Nutrition is required for custom food logs.");
        }
        String title = request.customFoodName() == null || request.customFoodName().isBlank()
                ? "Custom food"
                : request.customFoodName().trim();
        return repository.addNutritionLog(userId, request, title, nutrition);
    }

    public DailyNutritionSummaryResponse dailySummary(long userId, LocalDate date) {
        LocalDate targetDate = date == null ? LocalDate.now() : date;
        List<NutritionLogResponse> logs = repository.findNutritionLogs(userId, targetDate);
        NutritionResponse consumed = sum(logs);
        NutritionResponse recommended = recommended(findMe(userId));
        return new DailyNutritionSummaryResponse(targetDate, consumed, recommended, ratio(consumed, recommended), logs);
    }

    @Transactional
    public void deleteNutritionLog(long userId, long nutritionLogId) {
        repository.deleteNutritionLog(userId, nutritionLogId);
    }

    @Transactional
    public void addFavorite(long userId, long recipeId) {
        repository.addFavorite(userId, recipeId);
    }

    @Transactional
    public void deleteFavorite(long userId, long recipeId) {
        repository.deleteFavorite(userId, recipeId);
    }

    public List<SeasonalIngredientResponse> seasonalIngredients(Integer month) {
        int resolvedMonth = month == null ? LocalDate.now().getMonthValue() : month;
        return seasonalNames(resolvedMonth).stream()
                .map(name -> new SeasonalIngredientResponse(
                        resolvedMonth,
                        name,
                        "ingredient",
                        recipeQueryRepository.findRecipes(null, List.of(name), 0, 5, "latest")
                ))
                .toList();
    }

    public FeatureDtos.OcrIngredientResponse extractIngredients(FeatureDtos.OcrIngredientRequest request) {
        String rawText = request.text() == null ? "" : request.text();
        List<String> ingredients = KOREAN_WORD.matcher(rawText)
                .results()
                .map(MatchResult::group)
                .filter(value -> !isLikelyReceiptNoise(value))
                .distinct()
                .limit(30)
                .toList();
        String message = rawText.isBlank()
                ? "OCR engine integration is pending. Send recognized text to parse ingredients."
                : "Parsed candidate ingredients from recognized text.";
        return new FeatureDtos.OcrIngredientResponse(ingredients, rawText, message);
    }

    public FeatureDtos.BarcodeLookupResponse lookupBarcode(FeatureDtos.BarcodeLookupRequest request) {
        String barcode = request.barcode() == null ? "" : request.barcode().trim();
        if (barcode.isEmpty()) {
            throw new IllegalArgumentException("Barcode is required.");
        }
        return new FeatureDtos.BarcodeLookupResponse(
                barcode,
                null,
                new NutritionResponse(0, 0, 0, 0, 0),
                "Product database integration is pending. Use this response for manual edit flow."
        );
    }

    public List<CustomFoodResponse> findCustomFoods(long userId) {
        return repository.findCustomFoods(userId);
    }

    @Transactional
    public CustomFoodResponse addCustomFood(long userId, FeatureDtos.CustomFoodRequest request) {
        return repository.addCustomFood(userId, request);
    }

    @Transactional
    public void deleteCustomFood(long userId, long customFoodId) {
        repository.deleteCustomFood(userId, customFoodId);
    }

    private NutritionResponse sum(List<NutritionLogResponse> logs) {
        int kcal = 0;
        double carbs = 0;
        double protein = 0;
        double fat = 0;
        double sodium = 0;
        for (NutritionLogResponse log : logs) {
            kcal += log.nutrition().kcal();
            carbs += log.nutrition().carbs();
            protein += log.nutrition().protein();
            fat += log.nutrition().fat();
            sodium += log.nutrition().sodium();
        }
        return new NutritionResponse(kcal, round(carbs), round(protein), round(fat), round(sodium));
    }

    private NutritionResponse recommended(UserProfileResponse user) {
        double weight = user.weightKg() == null ? 65 : user.weightKg().doubleValue();
        double height = user.heightCm() == null ? 170 : user.heightCm().doubleValue();
        int age = user.age() == null ? 25 : user.age();
        boolean female = "FEMALE".equalsIgnoreCase(user.gender()) || "WOMAN".equalsIgnoreCase(user.gender());
        double bmr = female
                ? 10 * weight + 6.25 * height - 5 * age - 161
                : 10 * weight + 6.25 * height - 5 * age + 5;
        double activity = switch (safeUpper(user.activityLevel())) {
            case "HIGH" -> 1.725;
            case "LOW" -> 1.2;
            default -> 1.45;
        };
        double goalOffset = switch (safeUpper(user.goal())) {
            case "DIET", "CUT", "WEIGHT_LOSS" -> -400;
            case "BULK", "BULKUP", "MUSCLE_GAIN" -> 300;
            default -> 0;
        };
        int kcal = (int) Math.max(1200, Math.round(bmr * activity + goalOffset));
        double protein = round(weight * ("BULK".equals(safeUpper(user.goal())) ? 1.8 : 1.4));
        double fat = round((kcal * 0.25) / 9);
        double carbs = round((kcal - protein * 4 - fat * 9) / 4);
        return new NutritionResponse(kcal, carbs, protein, fat, 2000);
    }

    private NutritionResponse ratio(NutritionResponse consumed, NutritionResponse recommended) {
        return new NutritionResponse(
                percent(consumed.kcal(), recommended.kcal()),
                percent(consumed.carbs(), recommended.carbs()),
                percent(consumed.protein(), recommended.protein()),
                percent(consumed.fat(), recommended.fat()),
                percent(consumed.sodium(), recommended.sodium())
        );
    }

    private int percent(double consumed, double recommended) {
        if (recommended <= 0) {
            return 0;
        }
        return (int) Math.round(consumed * 100 / recommended);
    }

    private List<String> seasonalNames(int month) {
        return switch (month) {
            case 3, 4, 5 -> List.of("달래", "냉이", "두릅", "주꾸미", "딸기");
            case 6, 7, 8 -> List.of("감자", "옥수수", "가지", "오이", "토마토");
            case 9, 10, 11 -> List.of("버섯", "고구마", "무", "배추", "전어");
            default -> List.of("무", "배추", "시금치", "굴", "고등어");
        };
    }

    private boolean isLikelyReceiptNoise(String value) {
        String normalized = value.toLowerCase(Locale.ROOT);
        return normalized.matches("[0-9]+")
                || normalized.contains("합계")
                || normalized.contains("카드")
                || normalized.contains("승인")
                || normalized.contains("부가세")
                || normalized.contains("영수증");
    }

    private Set<String> normalizeSet(List<String> values) {
        return values.stream().map(this::normalize).collect(java.util.stream.Collectors.toSet());
    }

    private boolean containsAny(String value, Set<String> candidates) {
        String normalizedValue = normalize(value);
        return candidates.stream().anyMatch(candidate ->
                normalizedValue.contains(candidate) || candidate.contains(normalizedValue));
    }

    private String normalize(String value) {
        return value == null ? "" : value.replaceAll("\\s+", "").toLowerCase(Locale.ROOT);
    }

    private String safeUpper(String value) {
        return value == null ? "" : value.toUpperCase(Locale.ROOT);
    }

    private double round(double value) {
        return BigDecimal.valueOf(value).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }
}

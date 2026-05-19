import { dateKey } from "../utils/nutrition";

function defaultBaseUrl() {
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:8080`;
  }
  return "http://localhost:8080";
}

const RAW_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL || defaultBaseUrl()
).replace(/\/$/, "");
const API_BASE_URL = RAW_BASE_URL.endsWith("/api/v1")
  ? RAW_BASE_URL
  : `${RAW_BASE_URL}/api/v1`;

const ENDPOINTS = {
  authSignup: "/auth/signup",
  authLogin: "/auth/login",
  authRefresh: "/auth/refresh",
  recipes: "/recipes",
  pantryItems: "/pantry-items",
  avoidIngredients: "/avoid-ingredients",
  recommend: "/recommend",
  shoppingItems: "/shopping-items",
  shoppingGenerate: "/shopping-items/generate",
  nutritionLogs: "/nutrition-logs",
  nutritionDailySummary: "/nutrition/daily-summary",
  me: "/me",
  favorites: "/favorites",
  seasonalIngredients: "/seasonal-ingredients",
  ocrIngredients: "/ocr/ingredients",
  barcodeLookup: "/barcode/lookup",
  customFoods: "/custom-foods",
};

let authToken = null;

export function setAuthToken(token) {
  authToken = token || null;
}

const AUTH_REQUIRED_PREFIXES = [
  ENDPOINTS.me,
  ENDPOINTS.pantryItems,
  ENDPOINTS.avoidIngredients,
  ENDPOINTS.recommend,
  ENDPOINTS.shoppingItems,
  ENDPOINTS.shoppingGenerate,
  ENDPOINTS.nutritionLogs,
  ENDPOINTS.nutritionDailySummary,
  ENDPOINTS.favorites,
  ENDPOINTS.customFoods,
];

function requiresAuth(path) {
  const pathOnly = String(path || "").split("?")[0];
  return AUTH_REQUIRED_PREFIXES.some(
    (prefix) => pathOnly === prefix || pathOnly.startsWith(`${prefix}/`),
  );
}

async function request(path, options = {}) {
  if (!authToken && requiresAuth(path)) {
    throw new Error("Authentication required.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${message}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

function unwrapList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
}

function parsePublicRecipeIngredients(value = "") {
  if (!value) return [];
  return value
    .replace(/\[.*?\]/g, "")
    .split(/[,;\n]/)
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ name, amount: "" }));
}

function parsePublicRecipeSteps(recipe) {
  const steps = [];
  for (let i = 1; i <= 20; i += 1) {
    const key = String(i).padStart(2, "0");
    const instruction = recipe[`MANUAL${key}`];
    if (instruction) {
      steps.push({
        stepNo: i,
        instruction: String(instruction).trim(),
        imageUrl: recipe[`MANUAL_IMG${key}`] || "",
      });
    }
  }
  return steps;
}

function normalizeStep(raw, index = 0) {
  if (typeof raw === "string") {
    return {
      id: index + 1,
      stepNo: index + 1,
      instruction: raw,
      imageUrl: "",
    };
  }

  return {
    id: raw?.id || raw?.stepId || raw?.step_id || index + 1,
    stepNo: raw?.stepNo || raw?.step_no || index + 1,
    instruction: raw?.instruction || raw?.description || raw?.text || "",
    durationMin: raw?.durationMin || raw?.duration_min,
    imageUrl: raw?.imageUrl || raw?.image_url || "",
  };
}

function normalizeSeasonalIngredient(raw) {
  return {
    month: Number(raw.month || 0),
    name: raw.name || "",
    category: raw.category || "",
    recipes: Array.isArray(raw.recipes) ? raw.recipes.map(normalizeRecipe) : [],
  };
}

export function normalizeRecipe(raw) {
  if (!raw) return null;
  const nutrition = raw.nutrition || {};
  const ingredients = Array.isArray(raw.ingredients)
    ? raw.ingredients.map((item) => ({
        id: item.ingredient_id || item.ingredientId || item.id,
        name:
          item.name ||
          item.ingredient_name ||
          item.original_name ||
          item.originalName ||
          "",
        amount:
          item.amount ||
          item.amount_text ||
          item.amountText ||
          [item.quantity, item.unit].filter(Boolean).join(" "),
      }))
    : parsePublicRecipeIngredients(raw.RCP_PARTS_DTLS);

  const stepSource = Array.isArray(raw.stepDetails)
    ? raw.stepDetails
    : Array.isArray(raw.steps)
      ? raw.steps
      : [];
  const steps = stepSource.length
    ? stepSource.map(normalizeStep)
    : parsePublicRecipeSteps(raw);

  return {
    id: String(raw.recipe_id || raw.recipeId || raw.RCP_SEQ || raw.id),
    sourceRecipeId:
      raw.source_recipe_id || raw.sourceRecipeId || raw.RCP_SEQ || raw.id,
    name: raw.name || raw.title || raw.RCP_NM || "",
    description: raw.description || raw.HASH_TAG || "",
    method:
      raw.method ||
      raw.cooking_method ||
      raw.cookingMethod ||
      raw.RCP_WAY2 ||
      "",
    category: raw.category || raw.RCP_PAT2 || "",
    cookingTime: Number(
      raw.cooking_time_min || raw.cookingTime || raw.cooking_time || 0,
    ),
    servingSize: Number(
      raw.serving_size || raw.servingSize || raw.INFO_WGT || 1,
    ),
    calories: Number(
      raw.calorie_kcal || raw.calories || nutrition.kcal || raw.INFO_ENG || 0,
    ),
    carbs: Number(
      raw.carbohydrate_g || raw.carbs || nutrition.carbs || raw.INFO_CAR || 0,
    ),
    protein: Number(
      raw.protein_g || raw.protein || nutrition.protein || raw.INFO_PRO || 0,
    ),
    fat: Number(raw.fat_g || raw.fat || nutrition.fat || raw.INFO_FAT || 0),
    sodium: Number(
      raw.sodium_mg || raw.sodium || nutrition.sodium || raw.INFO_NA || 0,
    ),
    imageUrl:
      raw.image_url ||
      raw.imageUrl ||
      raw.image ||
      raw.main_image_url ||
      raw.ATT_FILE_NO_MAIN ||
      raw.ATT_FILE_NO_MK ||
      "",
    ingredients,
    steps,
    tags:
      raw.tags ||
      String(raw.HASH_TAG || "")
        .split(/[,\s]+/)
        .filter(Boolean),
    matchRate: Number(raw.matchRate || raw.match_rate || 0),
    matchedIngredients: raw.matchedIngredients || raw.matched_ingredients || [],
    missingIngredients: raw.missingIngredients || raw.missing_ingredients || [],
    missingCount: Number(raw.missingCount || raw.missing_count || 0),
  };
}

export function normalizePantryItem(raw) {
  return {
    id: String(raw.pantry_item_id || raw.pantryItemId || raw.id),
    ingredientId: raw.ingredient_id || raw.ingredientId,
    name: raw.ingredient_name || raw.ingredientName || raw.name || "",
    normalizedName:
      raw.normalized_name ||
      raw.normalizedName ||
      raw.ingredient_name ||
      raw.name ||
      "",
    category:
      raw.category || raw.storage_location || raw.storageLocation || "기타",
    quantity: raw.quantity ? String(raw.quantity) : "",
    unit: raw.unit || "",
    expiryDate: raw.expiry_date || raw.expiryDate || raw.expiresAt || "",
    memo: raw.memo || "",
    isSelected: Boolean(raw.is_selected || raw.isSelected),
    expiresInDays: raw.expiresInDays,
    expiringSoon: Boolean(raw.expiringSoon),
  };
}

export function normalizeShoppingItem(raw) {
  return {
    id: String(raw.shopping_item_id || raw.shoppingItemId || raw.id),
    recipeId: raw.recipe_id || raw.recipeId,
    ingredientId: raw.ingredient_id || raw.ingredientId,
    name: raw.item_name || raw.itemName || raw.name || "",
    normalizedName:
      raw.normalized_name ||
      raw.normalizedName ||
      raw.item_name ||
      raw.name ||
      "",
    quantity: raw.quantity ? String(raw.quantity) : "",
    unit: raw.unit || "",
    recipeName: raw.recipe_name || raw.recipeName || "",
    isChecked: Boolean(raw.is_checked || raw.isChecked || raw.checked),
    sourceType: raw.source_type || raw.sourceType || "MANUAL",
  };
}

export function normalizeNutritionLog(raw) {
  const nutrition = raw.nutrition || {};
  return {
    id: String(raw.nutrition_log_id || raw.nutritionLogId || raw.id),
    recipeId: raw.recipe_id || raw.recipeId,
    date:
      raw.log_date ||
      raw.logDate ||
      raw.mealDate ||
      raw.date ||
      dateKey(new Date()),
    mealType: raw.meal_type || raw.mealType || raw.mealTime || "SNACK",
    servingCount: Number(
      raw.serving_count || raw.servingCount || raw.multiplier || 1,
    ),
    foodName: raw.food_name || raw.foodName || raw.title || raw.name || "",
    calories: Number(raw.calorie_kcal || raw.calories || nutrition.kcal || 0),
    carbs: Number(raw.carbohydrate_g || raw.carbs || nutrition.carbs || 0),
    protein: Number(raw.protein_g || raw.protein || nutrition.protein || 0),
    fat: Number(raw.fat_g || raw.fat || nutrition.fat || 0),
    sodium: Number(raw.sodium_mg || raw.sodium || nutrition.sodium || 0),
  };
}

export function normalizeProfile(raw) {
  if (!raw) return null;
  return {
    id: String(raw.profile_id || raw.profileId || raw.id || "profile"),
    nickname: raw.nickname || raw.name || "사용자",
    email: raw.email || "",
    gender: raw.gender || "MALE",
    age: raw.age ? Number(raw.age) : "",
    height: raw.height_cm
      ? Number(raw.height_cm)
      : raw.heightCm
        ? Number(raw.heightCm)
        : Number(raw.height || 0) || "",
    weight: raw.weight_kg
      ? Number(raw.weight_kg)
      : raw.weightKg
        ? Number(raw.weightKg)
        : Number(raw.weight || 0) || "",
    goal: raw.goal_type || raw.goalType || raw.goal || "MAINTAIN",
    activityLevel: raw.activity_level || raw.activityLevel || "NORMAL",
  };
}

export function normalizeCustomFood(raw) {
  const nutrition = raw.nutrition || {};
  return {
    id: String(raw.custom_food_id || raw.customFoodId || raw.id),
    name: raw.name || raw.food_name || raw.foodName || "",
    servingSize: raw.serving_size || raw.servingSize || "",
    calories: Number(raw.calorie_kcal || raw.calories || nutrition.kcal || 0),
    carbs: Number(raw.carbohydrate_g || raw.carbs || nutrition.carbs || 0),
    protein: Number(raw.protein_g || raw.protein || nutrition.protein || 0),
    fat: Number(raw.fat_g || raw.fat || nutrition.fat || 0),
    sodium: Number(raw.sodium_mg || raw.sodium || nutrition.sodium || 0),
  };
}

function toPantryRequest(body = {}) {
  return {
    name: body.name || body.ingredient_name || body.ingredientName,
    quantityText:
      [body.quantity, body.unit].filter(Boolean).join(" ") ||
      body.quantityText ||
      null,
    expiresAt: body.expiresAt || body.expiry_date || body.expiryDate || null,
    memo: body.memo || null,
  };
}

function toShoppingPatchRequest(body = {}) {
  return {
    checked: Boolean(body.checked ?? body.is_checked ?? body.isChecked),
  };
}

function toNutritionLogRequest(body = {}) {
  return {
    recipeId: body.recipeId || body.recipe_id || null,
    customFoodName:
      body.customFoodName || body.food_name || body.foodName || null,
    mealDate:
      body.mealDate ||
      body.log_date ||
      body.logDate ||
      body.date ||
      dateKey(new Date()),
    mealTime: body.mealTime || body.meal_type || body.mealType || "SNACK",
    multiplier: Number(
      body.multiplier || body.serving_count || body.servingCount || 1,
    ),
    nutrition: {
      kcal: Number(body.calorie_kcal || body.calories || 0),
      carbs: Number(body.carbohydrate_g || body.carbs || 0),
      protein: Number(body.protein_g || body.protein || 0),
      fat: Number(body.fat_g || body.fat || 0),
      sodium: Number(body.sodium_mg || body.sodium || 0),
    },
  };
}

function toProfileRequest(profile = {}) {
  return {
    nickname: profile.nickname,
    gender: profile.gender,
    age: profile.age ? Number(profile.age) : null,
    heightCm: profile.heightCm ?? profile.height_cm ?? profile.height ?? null,
    weightKg: profile.weightKg ?? profile.weight_kg ?? profile.weight ?? null,
    goal: profile.goal || profile.goalType || profile.goal_type,
    activityLevel: profile.activityLevel || profile.activity_level,
  };
}

function toFavoriteRequest(body = {}) {
  return {
    recipeId: body.recipeId || body.recipe_id,
  };
}

function toCustomFoodRequest(food = {}) {
  return {
    name: food.name || food.food_name || food.foodName,
    nutrition: {
      kcal: Number(food.calorie_kcal || food.calories || 0),
      carbs: Number(food.carbohydrate_g || food.carbs || 0),
      protein: Number(food.protein_g || food.protein || 0),
      fat: Number(food.fat_g || food.fat || 0),
      sodium: Number(food.sodium_mg || food.sodium || 0),
    },
  };
}

async function readList(path, normalizer, fallback = () => []) {
  try {
    const payload = await request(path);
    return { data: unwrapList(payload).map(normalizer), online: true };
  } catch (error) {
    return { data: fallback(), online: false, error };
  }
}

async function readRequiredList(path, normalizer) {
  try {
    const payload = await request(path);
    return {
      data: unwrapList(payload).map(normalizer),
      online: true,
      error: null,
    };
  } catch (error) {
    return { data: [], online: false, error };
  }
}

async function readOne(path, normalizer, fallback = () => null) {
  try {
    const payload = await request(path);
    return { data: normalizer(payload?.data || payload), online: true };
  } catch (error) {
    return { data: fallback(), online: false, error };
  }
}

export async function loadInitialData() {
  const currentMonth = new Date().getMonth() + 1;
  const [
    recipeResult,
    pantryResult,
    shoppingResult,
    profileResult,
    logsResult,
    customFoodsResult,
    seasonalResult,
  ] = await Promise.all([
    readRequiredList(`${ENDPOINTS.recipes}?limit=1200`, normalizeRecipe),
    readList(ENDPOINTS.pantryItems, normalizePantryItem),
    readList(ENDPOINTS.shoppingItems, normalizeShoppingItem),
    readOne(ENDPOINTS.me, normalizeProfile),
    readOne(
      `${ENDPOINTS.nutritionDailySummary}?date=${dateKey(new Date())}`,
      (payload) => unwrapList(payload.meals).map(normalizeNutritionLog),
      () => [],
    ),
    readList(ENDPOINTS.customFoods, normalizeCustomFood),
    readList(
      `${ENDPOINTS.seasonalIngredients}?month=${currentMonth}`,
      normalizeSeasonalIngredient,
    ),
  ]);

  return {
    recipes: recipeResult.data,
    pantryItems: pantryResult.data,
    shoppingItems: shoppingResult.data,
    nutritionLogs: logsResult.data,
    profile: profileResult.data,
    customFoods: customFoodsResult.data,
    seasonalIngredients: seasonalResult.data,
    recipeError: recipeResult.error?.message || null,
    backendOnline: [
      recipeResult,
      pantryResult,
      shoppingResult,
      profileResult,
      logsResult,
      customFoodsResult,
      seasonalResult,
    ].some((result) => result.online),
  };
}

export const api = {
  signup: (body) => request(ENDPOINTS.authSignup, { method: "POST", body }),
  login: (body) => request(ENDPOINTS.authLogin, { method: "POST", body }),
  refreshToken: (body) =>
    request(ENDPOINTS.authRefresh, { method: "POST", body }),
  getRecipes: ({
    query = "",
    ingredient = "",
    limit = 1200,
    page = 0,
    sort = "latest",
  } = {}) => {
    const params = new URLSearchParams({
      limit: String(limit),
      page: String(page),
      sort,
    });
    if (query.trim()) params.set("query", query.trim());
    if (ingredient.trim()) params.append("ingredients", ingredient.trim());
    return request(`${ENDPOINTS.recipes}?${params.toString()}`).then(
      (payload) => unwrapList(payload).map(normalizeRecipe),
    );
  },
  getRecipe: (id) =>
    request(`${ENDPOINTS.recipes}/${id}`).then(normalizeRecipe),
  getSeasonalIngredients: (month) => {
    const query = month ? `?month=${month}` : "";
    return request(`${ENDPOINTS.seasonalIngredients}${query}`);
  },
  getDailyNutritionSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const path = query
      ? `${ENDPOINTS.nutritionDailySummary}?${query}`
      : ENDPOINTS.nutritionDailySummary;
    return request(path);
  },
  recommendRecipes: (body) =>
    request(ENDPOINTS.recommend, { method: "POST", body }),
  createPantryItem: (body) =>
    request(ENDPOINTS.pantryItems, {
      method: "POST",
      body: toPantryRequest(body),
    }).then(normalizePantryItem),
  updatePantryItem: (id, body) =>
    request(`${ENDPOINTS.pantryItems}/${id}`, {
      method: "PATCH",
      body: toPantryRequest(body),
    }).then(normalizePantryItem),
  deletePantryItem: (id) =>
    request(`${ENDPOINTS.pantryItems}/${id}`, { method: "DELETE" }),
  createShoppingItem: (body) =>
    request(ENDPOINTS.shoppingItems, {
      method: "POST",
      body: { name: body.name || body.item_name || body.itemName },
    }).then((payload) => unwrapList(payload).map(normalizeShoppingItem)),
  updateShoppingItem: (id, body) =>
    request(`${ENDPOINTS.shoppingItems}/${id}`, {
      method: "PATCH",
      body: toShoppingPatchRequest(body),
    }).then(normalizeShoppingItem),
  generateShoppingItems: (body) =>
    request(ENDPOINTS.shoppingGenerate, {
      method: "POST",
      body: { recipeId: body.recipeId || body.recipe_id },
    }).then((payload) => unwrapList(payload).map(normalizeShoppingItem)),
  createNutritionLog: (body) =>
    request(ENDPOINTS.nutritionLogs, {
      method: "POST",
      body: toNutritionLogRequest(body),
    }).then(normalizeNutritionLog),
  saveProfile: (profile) =>
    request(ENDPOINTS.me, {
      method: "PATCH",
      body: toProfileRequest(profile),
    }).then(normalizeProfile),
  addAvoidIngredient: (body) =>
    request(ENDPOINTS.avoidIngredients, { method: "POST", body }),
  removeAvoidIngredient: (id) =>
    request(`${ENDPOINTS.avoidIngredients}/${id}`, { method: "DELETE" }),
  addFavorite: (body) =>
    request(ENDPOINTS.favorites, {
      method: "POST",
      body: toFavoriteRequest(body),
    }),
  removeFavorite: (body) =>
    request(ENDPOINTS.favorites, {
      method: "DELETE",
      body: toFavoriteRequest(body),
    }),
  extractIngredientsFromImage: (body) =>
    request(ENDPOINTS.ocrIngredients, { method: "POST", body }),
  lookupBarcode: (body) =>
    request(ENDPOINTS.barcodeLookup, { method: "POST", body }),
  createCustomFood: (body) =>
    request(ENDPOINTS.customFoods, {
      method: "POST",
      body: toCustomFoodRequest(body),
    }).then(normalizeCustomFood),
};

import * as mock from '../data/mockData';
import { dateKey } from '../utils/nutrition';

const RAW_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
const API_BASE_URL = RAW_BASE_URL
  ? RAW_BASE_URL.endsWith('/api/v1')
    ? RAW_BASE_URL
    : `${RAW_BASE_URL}/api/v1`
  : '';

const ENDPOINTS = {
  authSignup: '/auth/signup',
  authLogin: '/auth/login',
  authRefresh: '/auth/refresh',
  recipes: '/recipes',
  pantryItems: '/pantry-items',
  avoidIngredients: '/avoid-ingredients',
  recommend: '/recommend',
  shoppingItems: '/shopping-items',
  shoppingGenerate: '/shopping-items/generate',
  nutritionLogs: '/nutrition-logs',
  nutritionDailySummary: '/nutrition/daily-summary',
  me: '/me',
  favorites: '/favorites',
  seasonalIngredients: '/seasonal-ingredients',
  ocrIngredients: '/ocr/ingredients',
  barcodeLookup: '/barcode/lookup',
};

let authToken = null;

export function setAuthToken(token) {
  authToken = token || null;
}

function hasBackend() {
  return API_BASE_URL.length > 0;
}

async function request(path, options = {}) {
  if (!hasBackend()) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL is not configured.');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
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

function parsePublicRecipeIngredients(value = '') {
  if (!value) return [];
  return value
    .replace(/\[.*?\]/g, '')
    .split(/[,;\n]/)
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ name, amount: '' }));
}

function parsePublicRecipeSteps(recipe) {
  const steps = [];
  for (let i = 1; i <= 20; i += 1) {
    const key = String(i).padStart(2, '0');
    const instruction = recipe[`MANUAL${key}`];
    if (instruction) {
      steps.push({
        stepNo: i,
        instruction: String(instruction).trim(),
        imageUrl: recipe[`MANUAL_IMG${key}`] || '',
      });
    }
  }
  return steps;
}

export function normalizeRecipe(raw) {
  if (!raw) return null;
  const ingredients = Array.isArray(raw.ingredients)
    ? raw.ingredients.map((item) => ({
      id: item.ingredient_id || item.ingredientId || item.id,
      name: item.name || item.ingredient_name || item.original_name || item.originalName || '',
      amount: item.amount_text || item.amountText || [item.quantity, item.unit].filter(Boolean).join(' '),
    }))
    : parsePublicRecipeIngredients(raw.RCP_PARTS_DTLS);

  const steps = Array.isArray(raw.steps)
    ? raw.steps.map((step, index) => ({
      id: step.step_id || step.stepId || step.id,
      stepNo: step.step_no || step.stepNo || index + 1,
      instruction: step.instruction || step.text || '',
      durationMin: step.duration_min || step.durationMin,
      imageUrl: step.image_url || step.imageUrl || '',
    }))
    : parsePublicRecipeSteps(raw);

  return {
    id: String(raw.recipe_id || raw.recipeId || raw.RCP_SEQ || raw.id),
    sourceRecipeId: raw.source_recipe_id || raw.sourceRecipeId || raw.RCP_SEQ || raw.id,
    name: raw.name || raw.RCP_NM || '',
    description: raw.description || raw.HASH_TAG || '',
    method: raw.method || raw.cooking_method || raw.RCP_WAY2 || '',
    category: raw.category || raw.RCP_PAT2 || '',
    cookingTime: Number(raw.cooking_time_min || raw.cookingTime || raw.cooking_time || 0),
    servingSize: Number(raw.serving_size || raw.servingSize || raw.INFO_WGT || 1),
    calories: Number(raw.calorie_kcal || raw.calories || raw.INFO_ENG || 0),
    carbs: Number(raw.carbohydrate_g || raw.carbs || raw.INFO_CAR || 0),
    protein: Number(raw.protein_g || raw.protein || raw.INFO_PRO || 0),
    fat: Number(raw.fat_g || raw.fat || raw.INFO_FAT || 0),
    sodium: Number(raw.sodium_mg || raw.sodium || raw.INFO_NA || 0),
    imageUrl: raw.image_url || raw.imageUrl || raw.main_image_url || raw.ATT_FILE_NO_MAIN || raw.ATT_FILE_NO_MK || '',
    ingredients,
    steps,
    tags: raw.tags || String(raw.HASH_TAG || '').split(/[,\s]+/).filter(Boolean),
  };
}

export function normalizePantryItem(raw) {
  return {
    id: String(raw.pantry_item_id || raw.pantryItemId || raw.id),
    ingredientId: raw.ingredient_id || raw.ingredientId,
    name: raw.ingredient_name || raw.ingredientName || raw.name || '',
    normalizedName: raw.normalized_name || raw.normalizedName || raw.ingredient_name || raw.name || '',
    category: raw.category || raw.storage_location || raw.storageLocation || '기타',
    quantity: raw.quantity ? String(raw.quantity) : '',
    unit: raw.unit || '',
    expiryDate: raw.expiry_date || raw.expiryDate || '',
    memo: raw.memo || '',
    isSelected: Boolean(raw.is_selected || raw.isSelected),
  };
}

export function normalizeShoppingItem(raw) {
  return {
    id: String(raw.shopping_item_id || raw.shoppingItemId || raw.id),
    recipeId: raw.recipe_id || raw.recipeId,
    ingredientId: raw.ingredient_id || raw.ingredientId,
    name: raw.item_name || raw.itemName || raw.name || '',
    normalizedName: raw.normalized_name || raw.normalizedName || raw.item_name || raw.name || '',
    quantity: raw.quantity ? String(raw.quantity) : '',
    unit: raw.unit || '',
    recipeName: raw.recipe_name || raw.recipeName || '',
    isChecked: Boolean(raw.is_checked || raw.isChecked),
    sourceType: raw.source_type || raw.sourceType || 'MANUAL',
  };
}

export function normalizeNutritionLog(raw) {
  return {
    id: String(raw.nutrition_log_id || raw.nutritionLogId || raw.id),
    recipeId: raw.recipe_id || raw.recipeId,
    date: raw.log_date || raw.logDate || raw.date || dateKey(new Date()),
    mealType: raw.meal_type || raw.mealType || '기타',
    servingCount: Number(raw.serving_count || raw.servingCount || 1),
    foodName: raw.food_name || raw.foodName || raw.name || '',
    calories: Number(raw.calorie_kcal || raw.calories || 0),
    carbs: Number(raw.carbohydrate_g || raw.carbs || 0),
    protein: Number(raw.protein_g || raw.protein || 0),
    fat: Number(raw.fat_g || raw.fat || 0),
    sodium: Number(raw.sodium_mg || raw.sodium || 0),
  };
}

export function normalizeProfile(raw) {
  if (!raw) return null;
  return {
    id: String(raw.profile_id || raw.profileId || raw.id || 'profile'),
    nickname: raw.nickname || raw.name || '사용자',
    email: raw.email || '',
    gender: raw.gender || '남성',
    age: raw.age ? Number(raw.age) : '',
    height: raw.height_cm ? Number(raw.height_cm) : Number(raw.height || 0) || '',
    weight: raw.weight_kg ? Number(raw.weight_kg) : Number(raw.weight || 0) || '',
    goal: raw.goal_type || raw.goalType || raw.goal || '유지',
    activityLevel: raw.activity_level || raw.activityLevel || '보통',
  };
}

export function normalizeCustomFood(raw) {
  return {
    id: String(raw.custom_food_id || raw.customFoodId || raw.id),
    name: raw.name || raw.food_name || raw.foodName || '',
    servingSize: raw.serving_size || raw.servingSize || '',
    calories: Number(raw.calorie_kcal || raw.calories || 0),
    carbs: Number(raw.carbohydrate_g || raw.carbs || 0),
    protein: Number(raw.protein_g || raw.protein || 0),
    fat: Number(raw.fat_g || raw.fat || 0),
    sodium: Number(raw.sodium_mg || raw.sodium || 0),
  };
}

async function readList(path, normalizer, fallback) {
  try {
    const payload = await request(path);
    return { data: unwrapList(payload).map(normalizer), online: true };
  } catch (error) {
    return { data: fallback(), online: false, error };
  }
}

async function readOne(path, normalizer, fallback) {
  try {
    const payload = await request(path);
    return { data: normalizer(payload?.data || payload), online: true };
  } catch (error) {
    return { data: fallback(), online: false, error };
  }
}

export async function loadInitialData() {
  const [recipeResult, pantryResult, shoppingResult, profileResult] = await Promise.all([
    readList(ENDPOINTS.recipes, normalizeRecipe, () => mock.recipes),
    readList(ENDPOINTS.pantryItems, normalizePantryItem, () => mock.pantryItems),
    readList(ENDPOINTS.shoppingItems, normalizeShoppingItem, () => mock.shoppingItems),
    readOne(ENDPOINTS.me, normalizeProfile, () => mock.profile),
  ]);

  const logsResult = { data: mock.nutritionLogs, online: false };
  const customFoodsResult = { data: mock.customFoods, online: false };

  return {
    recipes: recipeResult.data,
    pantryItems: pantryResult.data,
    shoppingItems: shoppingResult.data,
    nutritionLogs: logsResult.data,
    profile: profileResult.data,
    customFoods: customFoodsResult.data,
    backendOnline: [recipeResult, pantryResult, shoppingResult, profileResult].some((result) => result.online),
  };
}

export const api = {
  signup: (body) => request(ENDPOINTS.authSignup, { method: 'POST', body }),
  login: (body) => request(ENDPOINTS.authLogin, { method: 'POST', body }),
  refreshToken: (body) => request(ENDPOINTS.authRefresh, { method: 'POST', body }),
  getRecipe: (id) => request(`${ENDPOINTS.recipes}/${id}`).then(normalizeRecipe),
  getSeasonalIngredients: () => request(ENDPOINTS.seasonalIngredients),
  getDailyNutritionSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const path = query ? `${ENDPOINTS.nutritionDailySummary}?${query}` : ENDPOINTS.nutritionDailySummary;
    return request(path);
  },
  recommendRecipes: (body) => request(ENDPOINTS.recommend, { method: 'POST', body }),
  createPantryItem: (body) => request(ENDPOINTS.pantryItems, { method: 'POST', body }).then(normalizePantryItem),
  updatePantryItem: (id, body) => request(`${ENDPOINTS.pantryItems}/${id}`, { method: 'PATCH', body }).then(normalizePantryItem),
  deletePantryItem: (id) => request(`${ENDPOINTS.pantryItems}/${id}`, { method: 'DELETE' }),
  updateShoppingItem: (id, body) => request(ENDPOINTS.shoppingItems, { method: 'PATCH', body: { shopping_item_id: id, ...body } }).then(normalizeShoppingItem),
  generateShoppingItems: (body) => request(ENDPOINTS.shoppingGenerate, { method: 'POST', body }).then((payload) => unwrapList(payload).map(normalizeShoppingItem)),
  createNutritionLog: (body) => request(ENDPOINTS.nutritionLogs, { method: 'POST', body }).then(normalizeNutritionLog),
  saveProfile: (profile) => request(ENDPOINTS.me, { method: 'PATCH', body: profile }).then(normalizeProfile),
  addAvoidIngredient: (body) => request(ENDPOINTS.avoidIngredients, { method: 'POST', body }),
  removeAvoidIngredient: (id) => request(ENDPOINTS.avoidIngredients, { method: 'DELETE', body: { avoid_ingredient_id: id } }),
  addFavorite: (body) => request(ENDPOINTS.favorites, { method: 'POST', body }),
  removeFavorite: (body) => request(ENDPOINTS.favorites, { method: 'DELETE', body }),
  extractIngredientsFromImage: (body) => request(ENDPOINTS.ocrIngredients, { method: 'POST', body }),
  lookupBarcode: (body) => request(ENDPOINTS.barcodeLookup, { method: 'POST', body }),
};

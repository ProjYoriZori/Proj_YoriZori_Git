export function normalizeName(value = '') {
  return String(value).trim().replace(/\s+/g, '').toLowerCase();
}

export function ingredientName(item) {
  if (typeof item === 'string') return item;
  return item?.name || item?.ingredientName || item?.originalName || '';
}

export function recipeIngredientNames(recipe) {
  return (recipe?.ingredients || []).map(ingredientName).filter(Boolean);
}

function namesOverlap(a, b) {
  return a.includes(b) || b.includes(a);
}

export function getMatchInfo(recipe, pantryItems) {
  const pantryNames = pantryItems.map((item) => normalizeName(item.name));
  const ingredients = recipeIngredientNames(recipe);
  const matched = ingredients.filter((name) => {
    const normalized = normalizeName(name);
    return pantryNames.some((pantryName) => namesOverlap(normalized, pantryName));
  });
  const missing = ingredients.filter((name) => !matched.includes(name));
  return { matched, missing };
}

// 기피 재료(avoid_ingredients) DB 테이블 기반: 레시피 재료 중 하나라도 기피 목록과 겹치면 true
export function isRecipeAvoided(recipe, avoidIngredients = []) {
  if (!avoidIngredients.length) return false;
  const avoidNames = avoidIngredients.map((item) => normalizeName(item.name)).filter(Boolean);
  if (!avoidNames.length) return false;
  return recipeIngredientNames(recipe).some((name) => {
    const normalized = normalizeName(name);
    return avoidNames.some((avoidName) => namesOverlap(normalized, avoidName));
  });
}

// 선호(좋아하는) 식재료 추정: 사용자가 실제로 먹은(영양 기록한) 레시피의 재료를 빈도수로 집계
// → 자주 먹어온 재료일수록 가중치(weight)가 커짐
export function buildPreferredIngredientWeights(nutritionLogs = [], recipes = []) {
  const recipeById = new Map(recipes.map((recipe) => [String(recipe.id), recipe]));
  const weights = new Map();
  nutritionLogs.forEach((log) => {
    if (!log.recipeId) return;
    const recipe = recipeById.get(String(log.recipeId));
    if (!recipe) return;
    recipeIngredientNames(recipe).forEach((name) => {
      const normalized = normalizeName(name);
      if (!normalized) return;
      weights.set(normalized, (weights.get(normalized) || 0) + 1);
    });
  });
  return weights;
}

// 레시피 재료 중 선호 재료와 겹치는 항목들의 가중치 합 (겹치는 재료가 없으면 0)
export function preferenceScore(recipe, preferredWeights) {
  if (!preferredWeights || !preferredWeights.size) return 0;
  const ingredientNames = recipeIngredientNames(recipe).map(normalizeName);
  let score = 0;
  preferredWeights.forEach((weight, preferredName) => {
    if (ingredientNames.some((name) => namesOverlap(name, preferredName))) {
      score += weight;
    }
  });
  return score;
}

export function filterRecipes(recipes, {
  keyword = '',
  ingredient = '',
  pantryItems = [],
  sortByPantry = false,
  avoidIngredients = [],
  preferredWeights = null,
} = {}) {
  const normalizedKeyword = normalizeName(keyword);
  const normalizedIngredient = normalizeName(ingredient);
  const filtered = recipes.filter((recipe) => {
    if (isRecipeAvoided(recipe, avoidIngredients)) return false;
    const recipeText = normalizeName([recipe.name, recipe.category, recipe.method, ...(recipe.tags || [])].join(' '));
    const ingredientsText = normalizeName(recipeIngredientNames(recipe).join(' '));
    const keywordOk = !normalizedKeyword || recipeText.includes(normalizedKeyword) || ingredientsText.includes(normalizedKeyword);
    const ingredientOk = !normalizedIngredient || ingredientsText.includes(normalizedIngredient);
    return keywordOk && ingredientOk;
  });

  if (!sortByPantry) return filtered;

  return [...filtered].sort((a, b) => {
    const aInfo = getMatchInfo(a, pantryItems);
    const bInfo = getMatchInfo(b, pantryItems);
    // 보유 재료 매칭 개수를 기본 축으로 하되, 선호 재료가 포함된 레시피에 추가 가중치를 더해 정렬
    const aScore = aInfo.matched.length * 2 + preferenceScore(a, preferredWeights);
    const bScore = bInfo.matched.length * 2 + preferenceScore(b, preferredWeights);
    if (bScore !== aScore) return bScore - aScore;
    return bInfo.matched.length - aInfo.matched.length;
  });
}

export function recommendedRecipes(recipes, pantryItems, limit = 4, { avoidIngredients = [], preferredWeights = null } = {}) {
  const selected = pantryItems.filter((item) => item.isSelected);
  const base = selected.length ? selected : pantryItems;
  return filterRecipes(recipes, { pantryItems: base, sortByPantry: true, avoidIngredients, preferredWeights }).slice(0, limit);
}

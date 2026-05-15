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

export function getMatchInfo(recipe, pantryItems) {
  const pantryNames = pantryItems.map((item) => normalizeName(item.name));
  const ingredients = recipeIngredientNames(recipe);
  const matched = ingredients.filter((name) => {
    const normalized = normalizeName(name);
    return pantryNames.some((pantryName) => normalized.includes(pantryName) || pantryName.includes(normalized));
  });
  const missing = ingredients.filter((name) => !matched.includes(name));
  return { matched, missing };
}

export function filterRecipes(recipes, { keyword = '', ingredient = '', pantryItems = [], sortByPantry = false } = {}) {
  const normalizedKeyword = normalizeName(keyword);
  const normalizedIngredient = normalizeName(ingredient);
  const filtered = recipes.filter((recipe) => {
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
    return bInfo.matched.length - aInfo.matched.length;
  });
}

export function recommendedRecipes(recipes, pantryItems, limit = 4) {
  const selected = pantryItems.filter((item) => item.isSelected);
  const base = selected.length ? selected : pantryItems;
  return filterRecipes(recipes, { pantryItems: base, sortByPantry: true }).slice(0, limit);
}

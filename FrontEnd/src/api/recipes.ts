import { Platform } from 'react-native';
import type { Recipe } from '@/src/types';

const defaultBaseUrl = Platform.select({
  android: 'http://10.0.2.2:8080',
  default: 'http://localhost:8080',
});

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || defaultBaseUrl || 'http://localhost:8080';

function normalizeRecipe(recipe: Recipe): Recipe {
  return {
    ...recipe,
    image: recipe.image || '',
    method: recipe.method || 'Cook',
    category: recipe.category || 'Other',
    tags: recipe.tags ?? [],
    ingredients: recipe.ingredients ?? [],
    steps: recipe.steps ?? [],
    calories: recipe.calories ?? recipe.nutrition?.kcal ?? 0,
    nutrition: {
      kcal: recipe.nutrition?.kcal ?? recipe.calories ?? 0,
      carbs: recipe.nutrition?.carbs ?? 0,
      protein: recipe.nutrition?.protein ?? 0,
      fat: recipe.nutrition?.fat ?? 0,
      sodium: recipe.nutrition?.sodium ?? 0,
    },
  };
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchRecipes(query?: string): Promise<Recipe[]> {
  const params = new URLSearchParams({ limit: '50' });
  if (query?.trim()) {
    params.set('query', query.trim());
  }
  const recipes = await request<Recipe[]>(`/api/v1/recipes?${params.toString()}`);
  return recipes.map(normalizeRecipe);
}

export async function fetchRecipe(id: string): Promise<Recipe> {
  const recipe = await request<Recipe>(`/api/v1/recipes/${encodeURIComponent(id)}`);
  return normalizeRecipe(recipe);
}

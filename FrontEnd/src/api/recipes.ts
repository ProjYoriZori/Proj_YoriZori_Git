import { Platform } from 'react-native';
import type { Recipe } from '@/src/types';

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function getDefaultBaseUrls(): string[] {
  if (Platform.OS === 'android') {
    return ['http://10.0.2.2:8080'];
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    return unique([
      `${protocol}//${hostname}:8080`,
      'http://localhost:8080',
      'http://127.0.0.1:8080',
    ]);
  }

  return ['http://localhost:8080'];
}

function getApiBaseUrls(): string[] {
  const configuredUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
  return configuredUrl ? [configuredUrl] : getDefaultBaseUrls();
}

export const API_BASE_URL =
  getApiBaseUrls()[0] || 'http://localhost:8080';

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
  const attemptedUrls: string[] = [];
  let lastError: Error | null = null;

  for (const baseUrl of getApiBaseUrls()) {
    const url = `${baseUrl}${path}`;
    attemptedUrls.push(url);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      return response.json() as Promise<T>;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw new Error(`${lastError?.message || 'API request failed'} (${attemptedUrls.join(', ')})`);
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

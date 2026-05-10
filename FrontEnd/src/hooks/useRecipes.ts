import { useEffect, useState } from 'react';
import type { Recipe } from '@/src/types';
import { fetchRecipe, fetchRecipes } from '@/src/api/recipes';

type RecipeListState = {
  recipes: Recipe[];
  isLoading: boolean;
  error: string | null;
};

type RecipeState = {
  recipe: Recipe | null;
  isLoading: boolean;
  error: string | null;
};

export function useRecipes(query?: string): RecipeListState {
  const [state, setState] = useState<RecipeListState>({
    recipes: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let alive = true;
    setState((current) => ({ ...current, isLoading: true, error: null }));

    fetchRecipes(query)
      .then((recipes) => {
        if (alive) {
          setState({ recipes, isLoading: false, error: null });
        }
      })
      .catch((error: Error) => {
        if (alive) {
          setState({ recipes: [], isLoading: false, error: error.message });
        }
      });

    return () => {
      alive = false;
    };
  }, [query]);

  return state;
}

export function useRecipe(id?: string): RecipeState {
  const [state, setState] = useState<RecipeState>({
    recipe: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!id) {
      setState({ recipe: null, isLoading: false, error: null });
      return;
    }

    let alive = true;
    setState((current) => ({ ...current, isLoading: true, error: null }));

    fetchRecipe(id)
      .then((recipe) => {
        if (alive) {
          setState({ recipe, isLoading: false, error: null });
        }
      })
      .catch((error: Error) => {
        if (alive) {
          setState({ recipe: null, isLoading: false, error: error.message });
        }
      });

    return () => {
      alive = false;
    };
  }, [id]);

  return state;
}

import { create } from 'zustand';
import type { Meal, Nutrition, Recipe } from '../types';
import { INITIAL_MEALS } from '../mocks/meals';
import { getTodayKey } from '../utils/date';

type MealState = {
  meals: Meal[];
  addMeal: (recipe: Recipe, date?: string) => void;
  getMealsByDate: (date: string) => Meal[];
  getSummaryByDate: (date: string) => Nutrition;
};

const emptyNutrition = (): Nutrition => ({ kcal: 0, carbs: 0, protein: 0, fat: 0, sodium: 0 });

export const useMealStore = create<MealState>((set, get) => ({
  meals: INITIAL_MEALS,
  addMeal: (recipe, date = getTodayKey()) =>
    set((state) => ({
      meals: [
        {
          id: Date.now().toString(),
          recipeId: recipe.id,
          title: recipe.title,
          date,
          nutrition: recipe.nutrition,
        },
        ...state.meals,
      ],
    })),
  getMealsByDate: (date) => get().meals.filter((m) => m.date === date),
  getSummaryByDate: (date) => {
    const meals = get().meals.filter((m) => m.date === date);
    return meals.reduce((acc, m) => {
      acc.kcal += m.nutrition.kcal;
      acc.carbs += m.nutrition.carbs;
      acc.protein += m.nutrition.protein;
      acc.fat += m.nutrition.fat;
      acc.sodium += m.nutrition.sodium;
      return acc;
    }, emptyNutrition());
  },
}));

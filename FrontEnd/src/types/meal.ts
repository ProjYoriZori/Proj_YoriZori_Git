import type { Nutrition } from './recipe';

export type Meal = {
  id: string;
  recipeId: string;
  title: string;
  date: string;
  nutrition: Nutrition;
};

import type { Meal } from '../types';
import { RECIPES } from './recipes';

const today = new Date();
const todayKey = today.toISOString().slice(0, 10);
const yesterdayKey = new Date(today.getTime() - 86400000).toISOString().slice(0, 10);

export const INITIAL_MEALS: Meal[] = [
  {
    id: 'm1',
    recipeId: 'r1',
    title: RECIPES[0].title,
    date: todayKey,
    nutrition: RECIPES[0].nutrition,
  },
  {
    id: 'm2',
    recipeId: 'r5',
    title: RECIPES[4].title,
    date: todayKey,
    nutrition: RECIPES[4].nutrition,
  },
  {
    id: 'm3',
    recipeId: 'r3',
    title: RECIPES[2].title,
    date: yesterdayKey,
    nutrition: RECIPES[2].nutrition,
  },
];

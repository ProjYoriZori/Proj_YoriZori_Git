import type { Recipe } from '../types';

export const RECIPES: Recipe[] = [
  {
    id: 'r1',
    title: 'Rolled Omelet',
    image: '',
    method: 'Pan fry',
    category: 'Side dish',
    calories: 220,
    tags: ['Quick', 'Protein'],
    ingredients: [
      { name: 'Egg', amount: '2' },
      { name: 'Green onion', amount: '1/4 stalk' },
      { name: 'Salt', amount: 'pinch' },
    ],
    steps: ['Beat the eggs with green onion and salt.', 'Pour into a pan and roll gently.', 'Slice into bite-sized pieces.'],
    nutrition: { kcal: 220, carbs: 5, protein: 12, fat: 16, sodium: 200 },
  },
  {
    id: 'r2',
    title: 'Mushroom Soybean Soup',
    image: '',
    method: 'Boil',
    category: 'Soup',
    calories: 180,
    tags: ['Warm', 'Light'],
    ingredients: [
      { name: 'Mushroom', amount: '1 handful' },
      { name: 'Soybean paste', amount: '1.5T' },
      { name: 'Tofu', amount: '1/3 block' },
    ],
    steps: ['Bring stock to a boil.', 'Dissolve soybean paste and add tofu.', 'Add mushrooms and simmer briefly.'],
    nutrition: { kcal: 180, carbs: 16, protein: 12, fat: 6, sodium: 620 },
  },
  {
    id: 'r3',
    title: 'Strawberry Yogurt Bowl',
    image: '',
    method: 'Mix',
    category: 'Dessert',
    calories: 260,
    tags: ['Fresh', 'Snack'],
    ingredients: [
      { name: 'Strawberry', amount: '5' },
      { name: 'Greek yogurt', amount: '1 cup' },
      { name: 'Honey', amount: '1T' },
    ],
    steps: ['Wash and slice strawberries.', 'Put yogurt in a bowl.', 'Top with strawberries and honey.'],
    nutrition: { kcal: 260, carbs: 30, protein: 12, fat: 8, sodium: 90 },
  },
];

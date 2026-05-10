export type Nutrition = {
  kcal: number;
  carbs: number;
  protein: number;
  fat: number;
  sodium: number;
};

export type RecipeIngredient = {
  name: string;
  amount: string;
};

export type Recipe = {
  id: string;
  title: string;
  image: string;
  method: string;
  category: string;
  calories: number;
  tags?: string[];
  ingredients: RecipeIngredient[];
  steps: string[];
  nutrition: Nutrition;
};

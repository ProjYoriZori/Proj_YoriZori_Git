// Recipes intentionally have no mock fallback.
// They must come from BackEnd /api/v1/recipes.
export const recipes = [];

// Pantry and shopping fallbacks are local-only placeholders for unauthenticated screens.
// Recipe and nutrition data must always be loaded from the backend API.
export const pantryItems = [
  { id: 'p1', name: '계란', normalizedName: '계란', category: '단백질', quantity: '6', unit: '개', isSelected: true },
  { id: 'p2', name: '두부', normalizedName: '두부', category: '단백질', quantity: '1', unit: '모', isSelected: true },
  { id: 'p3', name: '대파', normalizedName: '대파', category: '채소', quantity: '2', unit: '대', isSelected: false },
  { id: 'p4', name: '김치', normalizedName: '김치', category: '기타', quantity: '300', unit: 'g', isSelected: true },
];

export const shoppingItems = [
  { id: 's1', name: '애호박', normalizedName: '애호박', quantity: '1', unit: '개', recipeName: '', isChecked: false, sourceType: 'MANUAL' },
];

// Nutrition logs intentionally have no mock fallback.
// They must come from BackEnd /api/v1/nutrition/daily-summary.
export const nutritionLogs = [];

export const profile = {
  id: 'profile-1',
  nickname: '요리조리',
  email: '',
  gender: 'MALE',
  age: 28,
  height: 175,
  weight: 72,
  goal: 'MAINTAIN',
  activityLevel: 'NORMAL',
};

// Custom foods intentionally have no mock fallback.
// They must come from BackEnd /api/v1/custom-foods.
export const customFoods = [];

export const seasonalIngredientsByMonth = {
  1: ['굴', '꼬막', '시금치', '배추', '무'],
  2: ['딸기', '봄동', '미나리', '냉이', '바지락'],
  3: ['딸기', '미나리', '냉이', '주꾸미', '도래'],
  4: ['두릅', '도래', '쑥', '주꾸미', '조개'],
  5: ['참나물', '취나물', '멍게', '아스파라거스', '마늘종'],
  6: ['감자', '오이', '가지', '토마토', '복숭아'],
  7: ['수박', '참외', '옥수수', '가지', '깻잎'],
  8: ['수박', '포도', '옥수수', '전복', '고구마순'],
  9: ['포도', '사과', '고등어', '전어', '표고버섯'],
  10: ['사과', '배', '감', '고등어', '무', '배추'],
  11: ['사과', '배', '굴', '꼬막', '시금치', '무'],
  12: ['굴', '꼬막', '배추', '무', '시금치'],
};

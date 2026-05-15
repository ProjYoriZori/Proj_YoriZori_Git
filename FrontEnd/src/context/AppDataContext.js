import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, loadInitialData } from '../api/client';
import { dateKey } from '../utils/nutrition';
import { normalizeName } from '../utils/recipes';

const AppDataContext = createContext(null);

const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function pantryPayload(item) {
  return {
    ingredient_name: item.name,
    normalized_name: normalizeName(item.name),
    category: item.category || '기타',
    quantity: item.quantity || null,
    unit: item.unit || null,
    expiry_date: item.expiryDate || null,
    memo: item.memo || null,
    is_selected: Boolean(item.isSelected),
  };
}

function shoppingPayload(item) {
  return {
    item_name: item.name,
    normalized_name: normalizeName(item.name),
    quantity: item.quantity || null,
    unit: item.unit || null,
    recipe_id: item.recipeId || null,
    recipe_name: item.recipeName || null,
    is_checked: Boolean(item.isChecked),
    source_type: item.sourceType || 'MANUAL',
  };
}

function nutritionPayload(log) {
  return {
    recipe_id: log.recipeId || null,
    log_date: log.date,
    meal_type: log.mealType,
    serving_count: log.servingCount || 1,
    food_name: log.foodName,
    calorie_kcal: Number(log.calories || 0),
    carbohydrate_g: Number(log.carbs || 0),
    protein_g: Number(log.protein || 0),
    fat_g: Number(log.fat || 0),
    sodium_mg: Number(log.sodium || 0),
  };
}

function profilePayload(profile) {
  return {
    gender: profile.gender,
    age: Number(profile.age) || null,
    height_cm: Number(profile.height) || null,
    weight_kg: Number(profile.weight) || null,
    goal_type: profile.goal,
    activity_level: profile.activityLevel,
    nickname: profile.nickname,
    email: profile.email,
  };
}

function customFoodPayload(food) {
  return {
    name: food.name,
    serving_size: food.servingSize || null,
    calorie_kcal: Number(food.calories || 0),
    carbohydrate_g: Number(food.carbs || 0),
    protein_g: Number(food.protein || 0),
    fat_g: Number(food.fat || 0),
    sodium_mg: Number(food.sodium || 0),
  };
}

export function AppDataProvider({ children }) {
  const [recipes, setRecipes] = useState([]);
  const [pantryItems, setPantryItems] = useState([]);
  const [shoppingItems, setShoppingItems] = useState([]);
  const [nutritionLogs, setNutritionLogs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [customFoods, setCustomFoods] = useState([]);
  const [backendOnline, setBackendOnline] = useState(false);
  const [recipeError, setRecipeError] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const snapshot = await loadInitialData();
    setRecipes(snapshot.recipes);
    setPantryItems(snapshot.pantryItems);
    setShoppingItems(snapshot.shoppingItems);
    setNutritionLogs(snapshot.nutritionLogs);
    setProfile(snapshot.profile);
    setCustomFoods(snapshot.customFoods);
    setRecipeError(snapshot.recipeError);
    setBackendOnline(snapshot.backendOnline);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const actions = useMemo(() => ({
    refresh,
    loadRecipes: async (filters = {}) => {
      try {
        const loadedRecipes = await api.getRecipes(filters);
        setRecipes(loadedRecipes);
        setRecipeError(null);
        setBackendOnline(true);
        return loadedRecipes;
      } catch (error) {
        setRecipes([]);
        setRecipeError(error instanceof Error ? error.message : String(error));
        setBackendOnline(false);
        return [];
      }
    },
    addPantryItem: async (input) => {
      const optimistic = {
        id: makeId('pantry'),
        normalizedName: normalizeName(input.name),
        category: input.category || '기타',
        quantity: input.quantity || '',
        unit: input.unit || '',
        expiryDate: input.expiryDate || '',
        memo: input.memo || '',
        isSelected: Boolean(input.isSelected),
        ...input,
      };
      setPantryItems((items) => [optimistic, ...items]);
      try {
        const created = await api.createPantryItem(pantryPayload(optimistic));
        setPantryItems((items) => items.map((item) => (item.id === optimistic.id ? created : item)));
      } catch {
        setBackendOnline(false);
      }
    },
    togglePantrySelection: async (id) => {
      let nextValue = false;
      setPantryItems((items) => items.map((item) => {
        if (item.id !== id) return item;
        nextValue = !item.isSelected;
        return { ...item, isSelected: nextValue };
      }));
      try {
        await api.updatePantryItem(id, { is_selected: nextValue });
      } catch {
        setBackendOnline(false);
      }
    },
    deletePantryItem: async (id) => {
      setPantryItems((items) => items.filter((item) => item.id !== id));
      try {
        await api.deletePantryItem(id);
      } catch {
        setBackendOnline(false);
      }
    },
    addShoppingItem: async (input) => {
      const optimistic = {
        id: makeId('shopping'),
        name: input.name,
        normalizedName: normalizeName(input.name),
        quantity: input.quantity || '',
        unit: input.unit || '',
        recipeId: input.recipeId || null,
        recipeName: input.recipeName || '',
        isChecked: false,
        sourceType: input.sourceType || 'MANUAL',
      };
      setShoppingItems((items) => [optimistic, ...items]);
      try {
        const created = await api.createShoppingItem(shoppingPayload(optimistic));
        if (created.length) {
          setShoppingItems((items) => items.map((item) => (item.id === optimistic.id ? created[0] : item)));
        }
      } catch {
        setBackendOnline(false);
      }
    },
    addMissingIngredientsToShopping: async (recipe, missingIngredients) => {
      const existing = new Set(shoppingItems.filter((item) => !item.isChecked).map((item) => normalizeName(item.name)));
      const itemsToAdd = missingIngredients.filter((name) => !existing.has(normalizeName(name)));
      if (!itemsToAdd.length) return;
      try {
        const created = await api.generateShoppingItems({
          recipe_id: recipe.id,
          recipe_name: recipe.name,
          missing_ingredients: itemsToAdd,
        });
        if (created.length) {
          setShoppingItems((items) => {
            const next = [...items];
            const seen = new Set(items.map((item) => normalizeName(item.name)));
            created.forEach((item) => {
              const key = normalizeName(item.name);
              if (!seen.has(key)) {
                seen.add(key);
                next.push(item);
              }
            });
            return next;
          });
          return;
        }
        await refresh();
      } catch {
        setBackendOnline(false);
        await Promise.all(itemsToAdd.map((name) => actions.addShoppingItem({
          name,
          recipeId: recipe.id,
          recipeName: recipe.name,
          sourceType: 'RECIPE_MISSING',
        })));
      }
    },
    toggleShoppingItem: async (id) => {
      const target = shoppingItems.find((item) => item.id === id);
      if (!target) return;
      const nextChecked = !target.isChecked;
      setShoppingItems((items) => items.map((item) => (item.id === id ? { ...item, isChecked: nextChecked } : item)));
      if (nextChecked) {
        const exists = pantryItems.some((item) => normalizeName(item.name) === normalizeName(target.name));
        if (!exists) {
          actions.addPantryItem({
            name: target.name,
            quantity: target.quantity,
            unit: target.unit,
            category: '기타',
            isSelected: false,
          });
        }
      }
      try {
        await api.updateShoppingItem(id, { is_checked: nextChecked });
      } catch {
        setBackendOnline(false);
      }
    },
    deleteShoppingItem: async (id) => {
      setShoppingItems((items) => items.filter((item) => item.id !== id));
    },
    clearCheckedShoppingItems: async () => {
      const checkedIds = shoppingItems.filter((item) => item.isChecked).map((item) => item.id);
      setShoppingItems((items) => items.filter((item) => !item.isChecked));
      if (!checkedIds.length) return;
    },
    addNutritionLogFromRecipe: async (recipe, mealType = '점심') => {
      const log = {
        id: makeId('log'),
        recipeId: recipe.id,
        date: dateKey(new Date()),
        mealType,
        servingCount: 1,
        foodName: recipe.name,
        calories: recipe.calories,
        carbs: recipe.carbs,
        protein: recipe.protein,
        fat: recipe.fat,
        sodium: recipe.sodium,
      };
      setNutritionLogs((logs) => [log, ...logs]);
      try {
        const created = await api.createNutritionLog(nutritionPayload(log));
        setNutritionLogs((logs) => logs.map((item) => (item.id === log.id ? created : item)));
      } catch {
        setBackendOnline(false);
      }
    },
    addNutritionLogFromCustomFood: async (food, mealType = '간식') => {
      const log = {
        id: makeId('log'),
        date: dateKey(new Date()),
        mealType,
        servingCount: 1,
        foodName: food.name,
        calories: food.calories,
        carbs: food.carbs,
        protein: food.protein,
        fat: food.fat,
        sodium: food.sodium,
      };
      setNutritionLogs((logs) => [log, ...logs]);
      try {
        const created = await api.createNutritionLog(nutritionPayload(log));
        setNutritionLogs((logs) => logs.map((item) => (item.id === log.id ? created : item)));
      } catch {
        setBackendOnline(false);
      }
    },
    deleteNutritionLog: async (id) => {
      setNutritionLogs((logs) => logs.filter((log) => log.id !== id));
    },
    saveProfile: async (nextProfile) => {
      const optimistic = { ...(profile || { id: makeId('profile') }), ...nextProfile };
      setProfile(optimistic);
      try {
        const saved = await api.saveProfile(profilePayload(optimistic));
        setProfile(saved);
      } catch {
        setBackendOnline(false);
      }
    },
    addCustomFood: async (input) => {
      const food = {
        id: makeId('food'),
        name: input.name,
        servingSize: input.servingSize || '',
        calories: Number(input.calories || 0),
        carbs: Number(input.carbs || 0),
        protein: Number(input.protein || 0),
        fat: Number(input.fat || 0),
        sodium: Number(input.sodium || 0),
      };
      setCustomFoods((foods) => [food, ...foods]);
      try {
        const created = await api.createCustomFood(customFoodPayload(food));
        setCustomFoods((foods) => foods.map((item) => (item.id === food.id ? created : item)));
      } catch {
        setBackendOnline(false);
      }
    },
    deleteCustomFood: async (id) => {
      setCustomFoods((foods) => foods.filter((food) => food.id !== id));
    },
  }), [customFoods, nutritionLogs, pantryItems, profile, shoppingItems]);

  const value = useMemo(() => ({
    recipes,
    pantryItems,
    shoppingItems,
    nutritionLogs,
    profile,
    customFoods,
    backendOnline,
    recipeError,
    loading,
    ...actions,
  }), [actions, backendOnline, customFoods, loading, nutritionLogs, pantryItems, profile, recipeError, recipes, shoppingItems]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider');
  }
  return context;
}

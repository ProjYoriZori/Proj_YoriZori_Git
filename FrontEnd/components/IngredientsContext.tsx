import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Ingredient = { id: string; name: string; expiresInDays?: number };

type ContextType = {
  ingredients: Ingredient[];
  addIngredient: (i: Ingredient) => void;
  removeIngredient: (id: string) => void;
  hasIngredient: (name: string) => boolean;
  addToShopping: (name: string) => void;
  shoppingList: string[];
  toggleShoppingItem: (name: string) => void;
};

const IngredientsContext = createContext<ContextType | undefined>(undefined);

export default function IngredientsProvider({ children }: { children: ReactNode }) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: '1', name: '계란', expiresInDays: 4 },
    { id: '2', name: '양파', expiresInDays: 7 },
    { id: '3', name: '우유', expiresInDays: 2 },
    { id: '4', name: '대파', expiresInDays: 5 },
  ]);
  const [shoppingList, setShoppingList] = useState<string[]>(['두부', '토마토']);

  const addIngredient = (i: Ingredient) => setIngredients((s) => [i, ...s]);
  const removeIngredient = (id: string) => setIngredients((s) => s.filter((x) => x.id !== id));
  const hasIngredient = (name: string) => ingredients.some((i) => i.name === name);
  const addToShopping = (name: string) => setShoppingList((s) => (s.includes(name) ? s : [...s, name]));
  const toggleShoppingItem = (name: string) =>
    setShoppingList((s) => (s.includes(name) ? s.filter((x) => x !== name) : [...s, name]));

  return (
    <IngredientsContext.Provider
      value={{ ingredients, addIngredient, removeIngredient, hasIngredient, addToShopping, shoppingList, toggleShoppingItem }}>
      {children}
    </IngredientsContext.Provider>
  );
}

export function useIngredients() {
  const ctx = useContext(IngredientsContext);
  if (!ctx) throw new Error('useIngredients must be used within IngredientsProvider');
  return ctx;
}

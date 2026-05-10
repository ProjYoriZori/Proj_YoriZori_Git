import { create } from 'zustand';
import { INITIAL_FRIDGE } from '../mocks/fridge';

export type FridgeItem = { id: string; name: string; expiresInDays: number };

type FridgeState = {
  items: FridgeItem[];
  addItem: (name: string, expiresInDays?: number) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, name: string) => void;
  hasItem: (name: string) => boolean;
};

export const useFridgeStore = create<FridgeState>((set, get) => ({
  items: INITIAL_FRIDGE,
  addItem: (name, expiresInDays = 5) => {
    if (get().items.some((i) => i.name === name)) return;
    set((state) => ({
      items: [{ id: Date.now().toString(), name, expiresInDays }, ...state.items],
    }));
  },
  removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  updateItem: (id, name) =>
    set((state) => ({ items: state.items.map((i) => (i.id === id ? { ...i, name } : i)) })),
  hasItem: (name) => get().items.some((i) => i.name === name),
}));

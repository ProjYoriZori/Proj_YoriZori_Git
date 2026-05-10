import { create } from 'zustand';

export type CartItem = { id: string; name: string; checked: boolean };

const INITIAL_CART: CartItem[] = [
  { id: 'c1', name: 'Tofu', checked: false },
  { id: 'c2', name: 'Sesame oil', checked: false },
];

type CartState = {
  items: CartItem[];
  addItem: (name: string) => void;
  toggleItem: (id: string) => void;
  removeChecked: () => void;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: INITIAL_CART,
  addItem: (name) => {
    if (get().items.some((item) => item.name === name)) return;
    set((state) => ({ items: [...state.items, { id: Date.now().toString(), name, checked: false }] }));
  },
  toggleItem: (id) =>
    set((state) => ({ items: state.items.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)) })),
  removeChecked: () => set((state) => ({ items: state.items.filter((item) => !item.checked) })),
}));

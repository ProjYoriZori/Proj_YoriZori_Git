import { create } from 'zustand';

export type CartItem = { id: string; name: string; checked: boolean };

const INITIAL_CART: CartItem[] = [
  { id: 'c1', name: '두부', checked: false },
  { id: 'c2', name: '참기름', checked: false },
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
    if (get().items.some((i) => i.name === name)) return;
    set((state) => ({ items: [...state.items, { id: Date.now().toString(), name, checked: false }] }));
  },
  toggleItem: (id) =>
    set((state) => ({ items: state.items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)) })),
  removeChecked: () => set((state) => ({ items: state.items.filter((i) => !i.checked) })),
}));

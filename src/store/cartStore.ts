import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product } from '@/types';

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, size?: string, color?: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      // Ensure no duplicate ids exist in the cart
      _dedupeItems: (items: CartItem[]) => {
        const map = new Map<string, CartItem>();
        for (const it of items) {
          const key = it.id;
          if (map.has(key)) {
            const existing = map.get(key)!;
            map.set(key, { ...existing, quantity: existing.quantity + it.quantity });
          } else {
            map.set(key, it);
          }
        }
        return Array.from(map.values());
      },

      addItem: (product: Product, quantity = 1, size, color) => {
        const items = get().items;
        const normalize = (v?: string) => (v && v.trim() !== '' ? v : 'default');
        const nSize = normalize(size);
        const nColor = normalize(color);
        const existingItemIndex = items.findIndex(
          item => 
            (item.product._id || item.product.id) === (product._id || product.id) && 
            normalize(item.size) === nSize && 
            normalize(item.color) === nColor
        );

        if (existingItemIndex > -1) {
          // Update existing item quantity
          const updatedItems = [...items];
          updatedItems[existingItemIndex].quantity += quantity;
          set({ items: updatedItems });
        } else {
          // Add new item
          const newItem: CartItem = {
            id: `${product._id || product.id}-${nSize}-${nColor}`,
            product,
            quantity,
            size: size,
            color: color,
          };
          // Append then dedupe to guard against any legacy duplicates
          const next = [...items, newItem];
          // @ts-ignore - internal helper
          const deduped = (get() as any)._dedupeItems(next);
          set({ items: deduped });
        }
      },

      removeItem: (itemId: string) => {
        set({ items: get().items.filter(item => item.id !== itemId) });
      },

      updateQuantity: (itemId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        
        const items = get().items.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        );
        set({ items });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + (item.product.price * item.quantity),
          0
        );
      },
    }),
    {
      name: 'cart-storage',
      // Clean up any legacy duplicates on hydration
      onRehydrateStorage: () => (state) => {
        try {
          if (!state || !(state as any).items) return;
          // @ts-ignore - internal helper
          const deduped = (state as any)._dedupeItems((state as any).items);
          (state as any).items = deduped;
        } catch {}
      },
    }
  )
);

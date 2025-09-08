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
      
      addItem: (product: Product, quantity = 1, size, color) => {
        const items = get().items;
        const existingItemIndex = items.findIndex(
          item => 
            (item.product._id || item.product.id) === (product._id || product.id) && 
            item.size === size && 
            item.color === color
        );

        if (existingItemIndex > -1) {
          // Update existing item quantity
          const updatedItems = [...items];
          updatedItems[existingItemIndex].quantity += quantity;
          set({ items: updatedItems });
        } else {
          // Add new item
          const newItem: CartItem = {
            id: `${product._id || product.id}-${size || 'default'}-${color || 'default'}`,
            product,
            quantity,
            size,
            color,
          };
          set({ items: [...items, newItem] });
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
    }
  )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types';

interface ComparisonStore {
  products: Product[];
  addProduct: (product: Product) => void;
  removeProduct: (productId: string) => void;
  clearComparison: () => void;
  isInComparison: (productId: string) => boolean;
  getComparisonCount: () => number;
}

const MAX_COMPARISON_ITEMS = 4; // Limit to 4 products for optimal comparison view

export const useComparisonStore = create<ComparisonStore>()(
  persist(
    (set, get) => ({
      products: [],

      addProduct: (product) => {
        const { products } = get();
        const productId = (product as any)._id || (product as any).id;
        
        // Check if already in comparison
        if (products.some(p => ((p as any)._id || (p as any).id) === productId)) {
          return;
        }

        // Limit to MAX_COMPARISON_ITEMS
        if (products.length >= MAX_COMPARISON_ITEMS) {
          // Remove oldest product
          const newProducts = products.slice(1);
          set({ products: [...newProducts, product] });
        } else {
          set({ products: [...products, product] });
        }
      },

      removeProduct: (productId) => {
        set({
          products: get().products.filter(
            p => ((p as any)._id || (p as any).id) !== productId
          )
        });
      },

      clearComparison: () => {
        set({ products: [] });
      },

      isInComparison: (productId) => {
        return get().products.some(
          p => ((p as any)._id || (p as any).id) === productId
        );
      },

      getComparisonCount: () => {
        return get().products.length;
      },
    }),
    {
      name: 'comparison-storage',
    }
  )
);


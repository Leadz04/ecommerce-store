import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types';

interface RecentlyViewedStore {
  products: Array<{ product: Product; viewedAt: number }>;
  addProduct: (product: Product) => void;
  getRecentProducts: (limit?: number) => Product[];
  clearHistory: () => void;
}

const MAX_RECENT_ITEMS = 20; // Store up to 20 recently viewed products

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      products: [],

      addProduct: (product) => {
        const { products } = get();
        const productId = (product as any)._id || (product as any).id;
        
        // Remove if already exists
        const filtered = products.filter(
          p => (((p.product as any)._id || (p.product as any).id) !== productId)
        );

        // Add to beginning with current timestamp
        const updated = [
          { product, viewedAt: Date.now() },
          ...filtered
        ].slice(0, MAX_RECENT_ITEMS); // Keep only recent items

        set({ products: updated });
      },

      getRecentProducts: (limit = 10) => {
        return get().products
          .slice(0, limit)
          .map(item => item.product);
      },

      clearHistory: () => {
        set({ products: [] });
      },
    }),
    {
      name: 'recently-viewed-storage',
    }
  )
);


'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

export interface EtsyShop {
  shopId: string;
  shopName: string;
  userId: string;
  isActive: boolean;
  lastSyncAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EtsyShopStore {
  shops: EtsyShop[];
  selectedShopId: string | null;
  isLoading: boolean;
  error: string | null;
  fetchShops: () => Promise<void>;
  setSelectedShop: (shopId: string | null) => void;
  getSelectedShop: () => EtsyShop | null;
  getShopById: (shopId: string) => EtsyShop | null;
  clearError: () => void;
}

export const useEtsyShopStore = create<EtsyShopStore>()(
  persist(
    (set, get) => ({
      shops: [],
      selectedShopId: null,
      isLoading: false,
      error: null,

      fetchShops: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            set({ shops: [], isLoading: false });
            return;
          }

          const response = await fetch('/api/etsy/shops', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            if (response.status === 401) {
              set({ shops: [], isLoading: false });
              return;
            }
            throw new Error('Failed to fetch shops');
          }

          const data = await response.json();
          if (data.success) {
            const shops = data.shops || [];
            set({ shops, isLoading: false });
            
            // Auto-select first shop if none selected and shops exist
            const { selectedShopId } = get();
            if (!selectedShopId && shops.length > 0) {
              set({ selectedShopId: shops[0].shopId });
            }
            
            // Clear selection if selected shop no longer exists
            if (selectedShopId && !shops.find((s: EtsyShop) => s.shopId === selectedShopId)) {
              set({ selectedShopId: shops.length > 0 ? shops[0].shopId : null });
            }
          } else {
            throw new Error(data.error || 'Failed to fetch shops');
          }
        } catch (error: any) {
          console.error('[EtsyShopStore] Error fetching shops:', error);
          set({ error: error.message || 'Failed to load shops', isLoading: false });
          // Don't show toast here - let components handle it if needed
        }
      },

      setSelectedShop: (shopId: string | null) => {
        set({ selectedShopId: shopId });
      },

      getSelectedShop: () => {
        const { shops, selectedShopId } = get();
        if (!selectedShopId) return null;
        return shops.find(shop => shop.shopId === selectedShopId) || null;
      },

      getShopById: (shopId: string) => {
        const { shops } = get();
        return shops.find(shop => shop.shopId === shopId) || null;
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'etsy-shop-store',
      partialize: (state) => ({
        shops: state.shops,
        selectedShopId: state.selectedShopId,
      }),
    }
  )
);


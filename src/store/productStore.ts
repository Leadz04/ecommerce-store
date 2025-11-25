'use client';

import { create } from 'zustand';
import { Product } from '@/types';

const normalizeProductStock = (product: Product | null): Product | null => {
  if (!product) return product;
  const rawStock =
    typeof product.stockCount === 'number' && !Number.isNaN(product.stockCount)
      ? product.stockCount
      : 0;
  const normalizedStock = product.inStock ? Math.max(0, rawStock) : 0;

  if (normalizedStock === product.stockCount) {
    return product;
  }

  return {
    ...product,
    stockCount: normalizedStock,
  };
};

interface ProductStore {
  products: Product[];
  currentProduct: Product | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    search: string;
    category: string;
    sortBy: string;
    priceRange: [number, number];
    inStock: boolean | null;
    brand?: string;
    minRating?: number;
    collection?: string;
  };
  fetchProducts: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    sortBy?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    brand?: string;
    minRating?: number;
    collection?: string;
  }) => Promise<void>;
  fetchProduct: (id: string) => Promise<void>;
  setFilters: (filters: Partial<ProductStore['filters']>) => void;
  setPagination: (pagination: Partial<ProductStore['pagination']>) => void;
  clearError: () => void;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  currentProduct: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  },
  filters: {
    search: '',
    category: 'all',
    sortBy: 'name',
    priceRange: [0, 1000],
    inStock: null,
    brand: undefined,
    minRating: undefined,
    collection: undefined,
  },

  fetchProducts: async (params = {}) => {
    set({ isLoading: true, error: null });
    
    try {
      const { filters } = get();
      const searchParams = new URLSearchParams();
      
      // Use provided params or fall back to store pagination
      searchParams.set('page', (params.page || get().pagination.page).toString());
      searchParams.set('limit', (params.limit || get().pagination.limit).toString());
      
      if (params.category || filters.category !== 'all') {
        searchParams.set('category', params.category || filters.category);
      }
      
      if (params.search || filters.search) {
        searchParams.set('search', params.search || filters.search);
      }
      
      if (params.sortBy || filters.sortBy !== 'name') {
        searchParams.set('sortBy', params.sortBy || filters.sortBy);
      }
      
      if (params.minPrice || filters.priceRange[0] > 0) {
        searchParams.set('minPrice', (params.minPrice || filters.priceRange[0]).toString());
      }
      
      if (params.maxPrice || filters.priceRange[1] < 1000) {
        searchParams.set('maxPrice', (params.maxPrice || filters.priceRange[1]).toString());
      }
      
      // Only send inStock when true to avoid filtering out items by default
      const effectiveInStock = (params.inStock !== undefined ? params.inStock : filters.inStock);
      if (effectiveInStock === true) {
        searchParams.set('inStock', 'true');
      }

      const effectiveBrand = params.brand ?? filters.brand;
      if (effectiveBrand) {
        searchParams.set('brand', effectiveBrand);
      }

      const effectiveMinRating = params.minRating ?? filters.minRating;
      if (typeof effectiveMinRating === 'number') {
        searchParams.set('minRating', String(effectiveMinRating));
      }

      const effectiveCollection = (params.collection ?? filters.collection)?.toLowerCase();
      if (effectiveCollection) {
        searchParams.set('collection', effectiveCollection);
      }

      console.log('[ProductStore] Fetching products:', searchParams.toString());
      const response = await fetch(`/api/products?${searchParams.toString()}`);
      
      console.log('[ProductStore] Response status:', response.status);
      const data = await response.json();

      if (!response.ok) {
        console.error('[ProductStore] Error fetching products:', data.error);
        throw new Error(data.error || 'Failed to fetch products');
      }
      
      console.log('[ProductStore] Successfully fetched', data.products?.length, 'products');

      set({
        products: Array.isArray(data.products)
          ? data.products.map((product: Product) => normalizeProductStock(product) as Product)
          : [],
        pagination: data.pagination,
        isLoading: false,
        error: null
      });
    } catch (error) {
      set({
        products: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch products'
      });
    }
  },

  fetchProduct: async (id: string) => {
    set({ isLoading: true, error: null, currentProduct: null });
    
    try {
      console.log('[ProductStore] Fetching product:', id);
      const response = await fetch(`/api/products/${id}`);
      const data = await response.json();

      if (!response.ok) {
        console.error('[ProductStore] Error fetching product:', data.error);
        throw new Error(data.error || 'Failed to fetch product');
      }
      
      console.log('[ProductStore] Successfully fetched product:', data.product?.name);

      set({
        currentProduct: normalizeProductStock(data.product) as Product,
        isLoading: false,
        error: null
      });
    } catch (error) {
      set({
        currentProduct: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch product'
      });
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }));
  },

  setPagination: (newPagination) => {
    set((state) => ({
      pagination: { ...state.pagination, ...newPagination }
    }));
  },

  clearError: () => {
    set({ error: null });
  }
}));

'use client';

import { create } from 'zustand';
import { Product } from '@/types';

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
  }) => Promise<void>;
  fetchProduct: (id: string) => Promise<void>;
  setFilters: (filters: Partial<ProductStore['filters']>) => void;
  setPagination: (pagination: Partial<ProductStore['pagination']>) => void;
  clearError: () => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

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
    inStock: null
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
      
      if (params.inStock !== undefined || filters.inStock !== null) {
        const inStockValue = (params.inStock !== undefined ? params.inStock : filters.inStock) ?? false;
        searchParams.set('inStock', String(inStockValue));
      }

      const response = await fetch(`${API_BASE_URL}/api/products?${searchParams.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch products');
      }

      set({
        products: data.products,
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
      const response = await fetch(`${API_BASE_URL}/api/products/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch product');
      }

      set({
        currentProduct: data.product,
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

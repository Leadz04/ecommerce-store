'use client';

import { create } from 'zustand';
import { Product } from '@/types';
import { requestDeduplicator } from '@/lib/requestDeduplication';

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
    style?: string;
    color?: string;
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
    style?: string;
    color?: string;
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
    limit: 20,
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
    style: undefined,
    color: undefined,
  },

  fetchProducts: async (params = {}) => {
    set({ isLoading: true, error: null });

    // Determine if this request intends to append (so we can preserve items on failure)
    const intendedPage = parseInt((params as any).page || get().pagination.page || 1, 10);
    const isAppendRequest = intendedPage > 1;

    try {
      const { filters } = get();
      const searchParams = new URLSearchParams();

      // ALWAYS send pagination parameters - even with filters
      // Backend now handles pagination consistently
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

      const effectiveStyle = params.style ?? filters.style;
      if (effectiveStyle) {
        searchParams.set('style', effectiveStyle);
      }

      const effectiveColor = params.color ?? filters.color;
      if (effectiveColor) {
        searchParams.set('color', effectiveColor);
      }

      // Create a unique key for deduplication (after all params are set)
      const dedupeKey = `products-${searchParams.toString()}`;

      console.log('[ProductStore] Fetching products:', searchParams.toString());

      // Use request deduplication to prevent duplicate calls
      const response = await requestDeduplicator.deduplicate(
        dedupeKey,
        async () => {
          const res = await fetch(`/api/products?${searchParams.toString()}`);
          return res.clone(); // Clone to allow multiple reads
        }
      );

      console.log('[ProductStore] Response status:', response.status);

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[ProductStore] Non-JSON response:', text.substring(0, 200));
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!response.ok) {
        console.error('[ProductStore] Error fetching products:', data.error);
        throw new Error(data.error || 'Failed to fetch products');
      }

      console.log('[ProductStore] Successfully fetched', data.products?.length, 'products');

      const normalizedIncoming = Array.isArray(data.products)
        ? data.products.map((product: Product) => normalizeProductStock(product) as Product)
        : [];

      const incomingPage = parseInt(searchParams.get('page') || '1', 10);
      // Append products when loading page > 1 (for "Load More" functionality)
      const shouldAppend = incomingPage > 1;

      set((state) => {
        if (shouldAppend) {
          // Append while keeping existing items visible
          // Deduplicate by _id, sourceUrl, and name to catch all duplicates
          const existingIds = new Set(state.products.map((p) => (p as any)._id || (p as any).id));
          const existingUrls = new Set(
            state.products
              .map((p) => {
                const url = (p as any).sourceUrl || (p as any).url || '';
                return url ? url.toLowerCase().trim() : '';
              })
              .filter(Boolean)
          );
          const existingNames = new Set(
            state.products
              .map((p) => {
                const name = (p as any).name || '';
                return name ? name.toLowerCase().trim() : '';
              })
              .filter(Boolean)
          );
          
          const newOnes = normalizedIncoming.filter((p) => {
            const id = (p as any)._id || (p as any).id;
            const url = ((p as any).sourceUrl || (p as any).url || '').toLowerCase().trim();
            const name = ((p as any).name || '').toLowerCase().trim();
            
            // Skip if duplicate by ID, URL, or name
            if (id && existingIds.has(id)) return false;
            if (url && existingUrls.has(url)) return false;
            if (name && existingNames.has(name)) return false;
            
            return true;
          });
          
          return {
            products: [...state.products, ...newOnes],
            pagination: data.pagination,
            isLoading: false,
            error: null,
          };
        }

        // Replace for first page or when filters are active
        // Also deduplicate the incoming products
        const seen = new Map<string, any>();
        const uniqueProducts = normalizedIncoming.filter((p) => {
          const url = ((p as any).sourceUrl || (p as any).url || '').toLowerCase().trim();
          const name = ((p as any).name || '').toLowerCase().trim();
          const key = url || name || (p as any)._id || (p as any).id;
          
          if (key && seen.has(key)) {
            return false;
          }
          if (key) {
            seen.set(key, p);
          }
          return true;
        });
        
        return {
          products: uniqueProducts,
          pagination: data.pagination,
          isLoading: false,
          error: null,
        };
      });
    } catch (error) {
      // Preserve already-loaded items when a "load more" request fails
      const { products: existingProducts } = get();
      set({
        products: isAppendRequest ? existingProducts : [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch products'
      });
    }
  },

  fetchProduct: async (id: string) => {
    // Skip if already fetching the same product
    const state = get();
    if (state.isLoading && state.currentProduct?._id === id) {
      console.log('[ProductStore] Already fetching product:', id);
      return;
    }

    set({ isLoading: true, error: null, currentProduct: null });

    try {
      console.log('[ProductStore] Fetching product:', id);

      // Use request deduplication to prevent duplicate calls
      const response = await requestDeduplicator.deduplicate(
        `product-${id}`,
        async () => {
          const res = await fetch(`/api/products/${id}`);
          return res.clone(); // Clone to allow multiple reads
        }
      );

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[ProductStore] Non-JSON response:', text.substring(0, 200));
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

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

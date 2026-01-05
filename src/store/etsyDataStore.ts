'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

const EMPTY_ARRAY: any[] = [];

export interface EtsyListing {
  listing_id: number;
  title: string;
  description?: string;
  price?: number | { amount: number; divisor: number; currency_code: string };
  state?: string;
  quantity?: number;
  tags?: string[];
  materials?: string[];
  images?: Array<{ url: string; rank: number; listingImageId: string }>;
  views?: number;
  num_favorers?: number;
  url?: string;
  lastSyncedAt?: Date;
  [key: string]: any;
}

export interface EtsyShopDetails {
  shopId: string;
  shopName: string;
  userId: string;
  isActive: boolean;
  currency?: string;
  vacationMode?: boolean;
  announcement?: string;
  numFavorers?: number;
  lastSyncedAt?: Date;
  [key: string]: any;
}

interface EtsyDataStore {
  // Shops
  shops: Array<{
    shopId: string;
    shopName: string;
    userId: string;
    isActive: boolean;
    lastSyncAt?: Date;
  }>;
  selectedShopId: string | null;

  // Shop Details (cached per shop)
  shopDetails: Record<string, EtsyShopDetails | null>;

  // Listings (cached per shop)
  listings: Record<string, {
    data: EtsyListing[];
    lastFetched: number;
    isLoading: boolean;
  }>;

  // Listing Details (cached per listing)
  listingDetails: Record<string, {
    data: EtsyListing | null;
    lastFetched: number;
    isLoading: boolean;
  }>;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchShops: () => Promise<void>;
  setSelectedShop: (shopId: string | null) => void;
  getSelectedShop: () => any | null;

  fetchShopDetails: (shopId: string, forceRefresh?: boolean) => Promise<EtsyShopDetails | null>;

  fetchListings: (shopId: string, forceRefresh?: boolean) => Promise<EtsyListing[]>;
  getListings: (shopId: string) => EtsyListing[];
  updateListing: (shopId: string, listingId: number, updates: Partial<EtsyListing>) => void;
  removeListing: (shopId: string, listingId: number) => void;

  fetchListingDetails: (shopId: string, listingId: number, forceRefresh?: boolean) => Promise<EtsyListing | null>;
  getListingDetails: (listingId: number) => EtsyListing | null;
  updateListingDetails: (listingId: number, updates: Partial<EtsyListing>) => void;

  // Taxonomy
  fetchTaxonomyNodes: (type: 'buyer' | 'seller', shopId?: string) => Promise<any[]>;
  fetchTaxonomyProperties: (taxonomyId: number, type: 'buyer' | 'seller', shopId?: string) => Promise<any[]>;

  clearError: () => void;
  clearCache: (shopId?: string) => void;
}

// Cache TTL in milliseconds
const CACHE_TTL = {
  SHOPS: 24 * 60 * 60 * 1000, // 24 hours
  SHOP_DETAILS: 6 * 60 * 60 * 1000, // 6 hours
  LISTINGS: 1 * 60 * 60 * 1000, // 1 hour
  LISTING_DETAILS: 30 * 60 * 1000, // 30 minutes
};

export const useEtsyDataStore = create<EtsyDataStore>()(
  persist(
    (set, get) => ({
      shops: [],
      selectedShopId: null,
      shopDetails: {},
      listings: {},
      listingDetails: {},
      isLoading: false,
      error: null,

      fetchShops: async () => {
        set({ isLoading: true, error: null });

        try {
          // Use localStorage token directly as this is App Auth, not Etsy Auth
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
              // Token expired - clear it to force user to re-login next time they try an action
              localStorage.removeItem('token');
              // Optionally trigger a global logout event or redirect, but for now just clear state
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
            if (selectedShopId && !shops.find((s: any) => s.shopId === selectedShopId)) {
              set({ selectedShopId: shops.length > 0 ? shops[0].shopId : null });
            }
          } else {
            throw new Error(data.error || 'Failed to fetch shops');
          }
        } catch (error: any) {
          console.error('[EtsyDataStore] Error fetching shops:', error);
          set({ error: error.message || 'Failed to load shops', isLoading: false });
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

      fetchShopDetails: async (shopId: string, forceRefresh = false) => {
        const state = get();
        const cached = state.shopDetails[shopId];
        const now = Date.now();

        // Return cached data if still valid and not forcing refresh
        if (!forceRefresh && cached && (now - new Date(cached.lastSyncedAt).getTime()) < CACHE_TTL.SHOP_DETAILS) {
          return cached;
        }

        try {
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('No authentication token');
          }

          const response = await fetch(`/api/etsy/status?shopId=${shopId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch shop details');
          }

          const data = await response.json();
          if (data.success && data.shop) {
            const shopDetails: EtsyShopDetails = {
              shopId: data.shop.shopId,
              shopName: data.shop.shopName || data.shop.title || '',
              userId: data.shop.userId || '',
              isActive: data.shop.isActive !== false,
              currency: data.shop.currency_code,
              vacationMode: data.shop.vacation_mode,
              announcement: data.shop.announcement,
              numFavorers: data.shop.num_favorers,
              lastSyncedAt: new Date(),
              ...data.shop,
            };

            set((state) => ({
              shopDetails: {
                ...state.shopDetails,
                [shopId]: shopDetails,
              },
            }));

            return shopDetails;
          }
          return null;
        } catch (error: any) {
          console.error('[EtsyDataStore] Error fetching shop details:', error);
          set({ error: error.message || 'Failed to load shop details' });
          return null;
        }
      },

      fetchListings: async (shopId: string, forceRefresh = false) => {
        const state = get();
        const cached = state.listings[shopId];
        const now = Date.now();

        // Return cached data if still valid and not forcing refresh
        if (!forceRefresh && cached && (now - cached.lastFetched) < CACHE_TTL.LISTINGS && !cached.isLoading) {
          return cached.data;
        }

        // Set loading state
        set((state) => ({
          listings: {
            ...state.listings,
            [shopId]: {
              ...state.listings[shopId],
              isLoading: true,
            },
          },
        }));

        try {
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('No authentication token');
          }

          const response = await fetch(
            `/api/etsy/listings?shopId=${encodeURIComponent(shopId)}${forceRefresh ? '&forceRefresh=true' : ''}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error('Failed to fetch listings');
          }

          const data = await response.json();
          if (data.success && data.listings) {
            const listings = data.listings || [];

            set((state) => ({
              listings: {
                ...state.listings,
                [shopId]: {
                  data: listings,
                  lastFetched: now,
                  isLoading: false,
                },
              },
              error: null,
            }));

            return listings;
          }
          throw new Error(data.error || 'Failed to fetch listings');
        } catch (error: any) {
          console.error('[EtsyDataStore] Error fetching listings:', error);
          set((state) => ({
            listings: {
              ...state.listings,
              [shopId]: {
                ...state.listings[shopId],
                isLoading: false,
              },
            },
            error: error.message || 'Failed to load listings',
          }));
          return EMPTY_ARRAY;
        }
      },

      getListings: (shopId: string) => {
        const state = get();
        return state.listings[shopId]?.data || EMPTY_ARRAY;
      },

      updateListing: (shopId: string, listingId: number, updates: Partial<EtsyListing>) => {
        set((state) => {
          const shopListings = state.listings[shopId];
          if (!shopListings) return state;

          const updatedListings = shopListings.data.map((listing) =>
            listing.listing_id === listingId
              ? { ...listing, ...updates }
              : listing
          );

          return {
            listings: {
              ...state.listings,
              [shopId]: {
                ...shopListings,
                data: updatedListings,
              },
            },
          };
        });
      },

      removeListing: (shopId: string, listingId: number) => {
        set((state) => {
          const shopListings = state.listings[shopId];
          if (!shopListings) return state;

          const updatedListings = shopListings.data.filter(
            (listing) => listing.listing_id !== listingId
          );

          return {
            listings: {
              ...state.listings,
              [shopId]: {
                ...shopListings,
                data: updatedListings,
              },
            },
            listingDetails: {
              ...state.listingDetails,
              [listingId.toString()]: undefined,
            },
          };
        });
      },

      fetchListingDetails: async (shopId: string, listingId: number, forceRefresh = false) => {
        const state = get();
        const cacheKey = listingId.toString();
        const cached = state.listingDetails[cacheKey];
        const now = Date.now();

        // Return cached data if still valid and not forcing refresh
        if (!forceRefresh && cached && (now - cached.lastFetched) < CACHE_TTL.LISTING_DETAILS && !cached.isLoading) {
          return cached.data;
        }

        // Set loading state
        set((state) => ({
          listingDetails: {
            ...state.listingDetails,
            [cacheKey]: {
              ...state.listingDetails[cacheKey],
              isLoading: true,
            },
          },
        }));

        try {
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('No authentication token');
          }

          const response = await fetch(
            `/api/etsy/listings/${listingId}/details?shopId=${shopId}${forceRefresh ? '&forceRefresh=true' : ''}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error('Failed to fetch listing details');
          }

          const data = await response.json();
          if (data.success && data.listing) {
            set((state) => ({
              listingDetails: {
                ...state.listingDetails,
                [cacheKey]: {
                  data: data.listing,
                  lastFetched: now,
                  isLoading: false,
                },
              },
              error: null,
            }));

            // Also update in listings array if it exists
            const shopListings = state.listings[shopId];
            if (shopListings) {
              get().updateListing(shopId, listingId, data.listing);
            }

            return data.listing;
          }
          return null;
        } catch (error: any) {
          console.error('[EtsyDataStore] Error fetching listing details:', error);
          set((state) => ({
            listingDetails: {
              ...state.listingDetails,
              [cacheKey]: {
                ...state.listingDetails[cacheKey],
                isLoading: false,
              },
            },
            error: error.message || 'Failed to load listing details',
          }));
          return null;
        }
      },

      getListingDetails: (listingId: number) => {
        const state = get();
        return state.listingDetails[listingId.toString()]?.data || null;
      },

      updateListingDetails: (listingId: number, updates: Partial<EtsyListing>) => {
        set((state) => {
          const cacheKey = listingId.toString();
          const cached = state.listingDetails[cacheKey];

          if (!cached) return state;

          return {
            listingDetails: {
              ...state.listingDetails,
              [cacheKey]: {
                ...cached,
                data: cached.data ? { ...cached.data, ...updates } : null,
              },
            },
          };
        });
      },

      fetchTaxonomyNodes: async (type: 'buyer' | 'seller', shopId?: string) => {
        try {
          let url = `/api/etsy/taxonomy/nodes?type=${type}`;
          if (shopId && type === 'seller') {
            url += `&shopId=${shopId}`;
          }

          const token = localStorage.getItem('token');
          const headers: HeadersInit = {};
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const response = await fetch(url, { headers });
          const data = await response.json();

          if (data.success) {
            return Array.isArray(data.results) ? data.results : (data.results?.results || []);
          }
          return [];
        } catch (error) {
          console.error('[EtsyDataStore] Error fetching taxonomy nodes:', error);
          return [];
        }
      },

      fetchTaxonomyProperties: async (taxonomyId: number, type: 'buyer' | 'seller', shopId?: string) => {
        try {
          let url = `/api/etsy/taxonomy/nodes/${taxonomyId}/properties?type=${type}`;
          if (shopId && type === 'seller') {
            url += `&shopId=${shopId}`;
          }

          const token = localStorage.getItem('token');
          const headers: HeadersInit = {};
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const response = await fetch(url, { headers });
          const data = await response.json();

          if (data.success) {
            return data.results || [];
          }
          return [];
        } catch (error) {
          console.error('[EtsyDataStore] Error fetching taxonomy properties:', error);
          return [];
        }
      },

      clearError: () => {
        set({ error: null });
      },

      clearCache: (shopId?: string) => {
        if (shopId) {
          set((state) => {
            const newListings = { ...state.listings };
            const newShopDetails = { ...state.shopDetails };
            delete newListings[shopId];
            delete newShopDetails[shopId];
            return {
              listings: newListings,
              shopDetails: newShopDetails,
            };
          });
        } else {
          set({
            listings: {},
            shopDetails: {},
            listingDetails: {},
          });
        }
      },
    }),
    {
      name: 'etsy-data-store',
      partialize: (state) => ({
        shops: state.shops,
        selectedShopId: state.selectedShopId,
        // Don't persist listings/details - they should be fetched fresh
        // But persist shop details for faster initial load
        shopDetails: state.shopDetails,
      }),
    }
  )
);


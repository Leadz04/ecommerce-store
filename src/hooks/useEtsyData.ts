'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useEtsyDataStore } from '@/store/etsyDataStore';

const EMPTY_ARRAY: any[] = [];

/**
 * Hook to get and manage Etsy shops
 */
export function useEtsyShops() {
  const shops = useEtsyDataStore((state) => state.shops);
  const selectedShopId = useEtsyDataStore((state) => state.selectedShopId);
  const isLoading = useEtsyDataStore((state) => state.isLoading);
  const error = useEtsyDataStore((state) => state.error);
  const fetchShops = useEtsyDataStore((state) => state.fetchShops);
  const setSelectedShop = useEtsyDataStore((state) => state.setSelectedShop);
  const getSelectedShop = useEtsyDataStore((state) => state.getSelectedShop);

  useEffect(() => {
    if (shops.length === 0 && !isLoading) {
      fetchShops();
    }
  }, []);

  return {
    shops,
    selectedShopId,
    selectedShop: getSelectedShop(),
    isLoading,
    error,
    fetchShops,
    setSelectedShop,
  };
}

/**
 * Hook to get and manage shop details for a specific shop
 */
export function useEtsyShopDetails(shopId: string | null, options?: { autoFetch?: boolean; forceRefresh?: boolean }) {
  const { autoFetch = true, forceRefresh = false } = options || {};
  const shopDetails = useEtsyDataStore((state) =>
    shopId ? state.shopDetails[shopId] : null
  );
  const fetchShopDetails = useEtsyDataStore((state) => state.fetchShopDetails);
  const error = useEtsyDataStore((state) => state.error);

  // Use ref to track if we've already fetched to prevent infinite loops
  const hasFetchedRef = useRef(false);
  const forceRefreshRef = useRef(forceRefresh);

  useEffect(() => {
    forceRefreshRef.current = forceRefresh;
  }, [forceRefresh]);

  useEffect(() => {
    if (shopId && autoFetch && (!hasFetchedRef.current || forceRefreshRef.current)) {
      hasFetchedRef.current = true;
      fetchShopDetails(shopId, forceRefreshRef.current);
    }
  }, [shopId, autoFetch, fetchShopDetails]);

  const refetch = useCallback((force?: boolean) => {
    if (shopId) {
      return fetchShopDetails(shopId, force);
    }
    return Promise.resolve(null);
  }, [shopId, fetchShopDetails]);

  return {
    shopDetails,
    isLoading: shopId ? !shopDetails : false,
    error,
    refetch,
  };
}

/**
 * Hook to get and manage listings for a specific shop
 */
export function useEtsyListings(shopId: string | null, options?: { autoFetch?: boolean; forceRefresh?: boolean }) {
  const { autoFetch = true, forceRefresh = false } = options || {};
  const listings = useEtsyDataStore((state) =>
    shopId ? state.getListings(shopId) : EMPTY_ARRAY
  );
  const listingsState = useEtsyDataStore((state) =>
    shopId ? state.listings[shopId] : undefined
  );
  const fetchListings = useEtsyDataStore((state) => state.fetchListings);
  const updateListing = useEtsyDataStore((state) => state.updateListing);
  const removeListing = useEtsyDataStore((state) => state.removeListing);
  const error = useEtsyDataStore((state) => state.error);

  useEffect(() => {
    if (shopId && autoFetch) {
      fetchListings(shopId, forceRefresh);
    }
  }, [shopId, autoFetch, forceRefresh]);

  return {
    listings,
    isLoading: listingsState?.isLoading || false,
    lastFetched: listingsState?.lastFetched,
    error,
    refetch: (force?: boolean) => shopId ? fetchListings(shopId, force) : Promise.resolve([]),
    updateListing: (listingId: number, updates: any) => shopId ? updateListing(shopId, listingId, updates) : undefined,
    removeListing: (listingId: number) => shopId ? removeListing(shopId, listingId) : undefined,
  };
}

/**
 * Hook to get and manage details for a specific listing
 */
export function useEtsyListingDetails(
  shopId: string | null,
  listingId: number | null,
  options?: { autoFetch?: boolean; forceRefresh?: boolean }
) {
  const { autoFetch = true, forceRefresh = false } = options || {};
  const listingDetails = useEtsyDataStore((state) =>
    listingId ? state.getListingDetails(listingId) : null
  );
  const listingDetailsState = useEtsyDataStore((state) =>
    listingId ? state.listingDetails[listingId.toString()] : undefined
  );
  const fetchListingDetails = useEtsyDataStore((state) => state.fetchListingDetails);
  const updateListingDetails = useEtsyDataStore((state) => state.updateListingDetails);
  const error = useEtsyDataStore((state) => state.error);

  useEffect(() => {
    if (shopId && listingId && autoFetch) {
      fetchListingDetails(shopId, listingId, forceRefresh);
    }
  }, [shopId, listingId, autoFetch, forceRefresh]);

  return {
    listingDetails,
    isLoading: listingDetailsState?.isLoading || false,
    lastFetched: listingDetailsState?.lastFetched,
    error,
    refetch: (force?: boolean) =>
      shopId && listingId
        ? fetchListingDetails(shopId, listingId, force)
        : Promise.resolve(null),
    updateListingDetails: (updates: any) =>
      listingId ? updateListingDetails(listingId, updates) : undefined,
  };
}

/**
 * Hook to get selected shop and its data
 */
export function useSelectedEtsyShop(options?: { autoFetchDetails?: boolean; autoFetchListings?: boolean }) {
  const { autoFetchDetails = true, autoFetchListings = true } = options || {};
  const { selectedShopId, selectedShop } = useEtsyShops();
  const shopDetails = useEtsyShopDetails(selectedShopId, { autoFetch: autoFetchDetails });
  const listings = useEtsyListings(selectedShopId, { autoFetch: autoFetchListings });

  return {
    shopId: selectedShopId,
    shop: selectedShop,
    shopDetails: shopDetails.shopDetails,
    listings: listings.listings,
    isLoading: shopDetails.isLoading || listings.isLoading,
    error: shopDetails.error || listings.error,
    refetchAll: async (force?: boolean) => {
      await Promise.all([
        shopDetails.refetch(force),
        listings.refetch(force),
      ]);
    },
  };
}


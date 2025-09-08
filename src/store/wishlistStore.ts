'use client';

import { create } from 'zustand';
import toast from 'react-hot-toast';
import { Product } from '@/types';

interface WishlistStore {
  items: Product[];
  isLoading: boolean;
  error: string | null;
  fetchWishlist: () => Promise<void>;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<'added' | 'removed'>;
  isInWishlist: (productId: string) => boolean;
  clearError: () => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchWishlist: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) throw new Error('No authentication token');
      const response = await fetch(`${API_BASE_URL}/api/users/wishlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch wishlist');
      set({ items: data.wishlist, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : 'Failed to fetch wishlist' });
    }
  },

  addToWishlist: async (productId: string) => {
    set({ isLoading: true, error: null });
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) throw new Error('No authentication token');
      const response = await fetch(`${API_BASE_URL}/api/users/wishlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ productId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to add to wishlist');
      set({ items: data.wishlist, isLoading: false });
      toast.success('Added to wishlist');
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : 'Failed to add to wishlist' });
      toast.error(error instanceof Error ? error.message : 'Failed to add to wishlist');
    }
  },

  removeFromWishlist: async (productId: string) => {
    set({ isLoading: true, error: null });
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) throw new Error('No authentication token');
      const response = await fetch(`${API_BASE_URL}/api/users/wishlist?productId=${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to remove from wishlist');
      set({ items: data.wishlist, isLoading: false });
      toast.success('Removed from wishlist');
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : 'Failed to remove from wishlist' });
      toast.error(error instanceof Error ? error.message : 'Failed to remove from wishlist');
    }
  },

  toggleWishlist: async (productId: string) => {
    const exists = get().isInWishlist(productId);
    if (exists) {
      await get().removeFromWishlist(productId);
      return 'removed';
    } else {
      await get().addToWishlist(productId);
      return 'added';
    }
  },

  isInWishlist: (productId: string) => {
    return get().items.some((p: any) => (p as any)._id === productId || (p as any).id === productId);
  },

  clearError: () => set({ error: null })
}));



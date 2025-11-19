'use client';

import { useEffect } from 'react';
import ClientWrapper from '@/components/ClientWrapper';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';

export default function ClientBridge({ children }: { children: React.ReactNode }) {
  const { fetchWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Only fetch wishlist if user is authenticated
    if (isAuthenticated) {
      fetchWishlist().catch(() => {});
    }
  }, [fetchWishlist, isAuthenticated]);

  return <ClientWrapper>{children}</ClientWrapper>;
}



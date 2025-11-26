'use client';

import { useEffect } from 'react';
import ClientWrapper from '@/components/ClientWrapper';
import LiveChatWidget from '@/components/LiveChatWidget';
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

  return (
    <ClientWrapper>
      {children}
      <LiveChatWidget />
    </ClientWrapper>
  );
}



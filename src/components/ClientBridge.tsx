'use client';

import { useEffect } from 'react';
import ClientWrapper from '@/components/ClientWrapper';
import { useWishlistStore } from '@/store/wishlistStore';

export default function ClientBridge({ children }: { children: React.ReactNode }) {
  const { fetchWishlist } = useWishlistStore();

  useEffect(() => {
    fetchWishlist().catch(() => {});
  }, [fetchWishlist]);

  return <ClientWrapper>{children}</ClientWrapper>;
}



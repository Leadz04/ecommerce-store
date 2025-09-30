'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWishlistStore } from '@/store/wishlistStore';
import ProductCard from '@/components/ProductCard';

export default function WishlistPage() {
  const { items, isLoading, error, fetchWishlist, removeFromWishlist } = useWishlistStore();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const copyShareLink = async () => {
    try {
      const url = typeof window !== 'undefined' ? window.location.href : '';
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Your Wishlist</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={copyShareLink}
            className="px-4 py-2 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
          >
            {copied ? 'Link Copied' : 'Copy Share Link'}
          </button>
          <Link href="/products" className="px-4 py-2 rounded-md bg-black text-white text-sm hover:bg-gray-800">
            Continue Shopping
          </Link>
        </div>
      </div>

      <div className="mt-6">
        {isLoading && (
          <p className="text-gray-500">Loading your wishlist...</p>
        )}
        {!isLoading && error && (
          <p className="text-red-600">{error}</p>
        )}
        {!isLoading && !error && items.length === 0 && (
          <div className="text-center py-16 border rounded-lg">
            <p className="text-gray-600 mb-4">Your wishlist is empty.</p>
            <Link href="/products" className="text-blue-600 hover:text-blue-700">Browse products</Link>
          </div>
        )}
        {!isLoading && !error && items.length > 0 && (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((product: any) => (
              <div key={product._id || product.id} className="relative">
                <ProductCard product={product} />
                <button
                  onClick={() => removeFromWishlist(product._id || product.id)}
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white text-xs px-2 py-1 rounded shadow"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

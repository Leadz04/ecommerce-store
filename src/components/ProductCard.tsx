'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingCart, Heart, CheckCircle2, Circle } from 'lucide-react';
import { Product } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import { getProductUrl } from '@/lib/productUrl';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [etsyExported, setEtsyExported] = useState<boolean>(!!product.etsyExported);
  const [etsyExportedAt, setEtsyExportedAt] = useState<string | Date | null>(product.etsyExportedAt || null);
  const [etsyPending, setEtsyPending] = useState(false);
  const { addItem } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { user } = useAuthStore();

  const isSuperAdmin = user?.role?.name?.toUpperCase?.() === 'SUPER_ADMIN';

  useEffect(() => {
    setEtsyExported(!!product.etsyExported);
    setEtsyExportedAt(product.etsyExportedAt || null);
  }, [product.etsyExported, product.etsyExportedAt]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const id = (product as any)._id || (product as any).id;
    try {
      const result = await toggleWishlist(id);
      setIsLiked(result === 'added');
    } catch {}
  };

  const handleToggleExport = async (e: React.MouseEvent) => {
    if (!isSuperAdmin) return;
    e.preventDefault();
    e.stopPropagation();
    const productId = (product as any)._id || (product as any).id;
    if (!productId) return;
    try {
      setEtsyPending(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ etsyExported: !etsyExported }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update Etsy export state');
      }
      setEtsyExported(!!data.product?.etsyExported);
      setEtsyExportedAt(data.product?.etsyExportedAt || null);
      toast.success(data.product?.etsyExported ? 'Marked as exported to Etsy' : 'Marked as not exported');
    } catch (error) {
      console.error('Toggle export error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update Etsy export state');
    } finally {
      setEtsyPending(false);
    }
  };

  // Calculate discount percentage only when originalPrice exists and is greater than current price
  const discountPercentage = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <Link href={getProductUrl(product as any)} className="group">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 h-full flex flex-col">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
          {!imageError ? (
            <Image
              src={product.image}
              alt={
                (product as any).imageAltTexts && (product as any).imageAltTexts[0]
                  ? (product as any).imageAltTexts[0]
                  : product.name
              }
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-600">
              <span className="text-gray-400 dark:text-gray-500 text-sm">No Image</span>
            </div>
          )}
          
          {/* Discount Badge - Top Right (only shows when discount is applied) */}
          {discountPercentage > 0 && (
            <div className="absolute top-3 right-3 bg-black text-white text-xs font-bold px-2.5 py-1 rounded shadow-lg z-20">
              {discountPercentage}% OFF
            </div>
          )}
          
          {/* Action Buttons - Positioned to avoid conflict with discount badge */}
          <div className={`absolute ${discountPercentage > 0 ? 'top-3 left-3' : 'top-3 right-3'} flex flex-col space-y-2 z-10`}>
            <button
              onClick={handleLike}
              className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              aria-label="Add to wishlist"
            >
              <Heart 
                className={`h-4 w-4 ${(isLiked || isInWishlist((product as any)._id || (product as any).id)) ? 'fill-red-500 text-red-500' : 'text-gray-400 dark:text-gray-500'}`} 
              />
            </button>
          </div>

          {/* Super Admin Etsy Export Badge */}
          {isSuperAdmin && (
            <button
              onClick={handleToggleExport}
              disabled={etsyPending}
              className={`absolute bottom-3 left-3 inline-flex items-center space-x-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm ${
                etsyExported
                  ? 'bg-green-50/90 border-green-200 text-green-700'
                  : 'bg-white/90 border-gray-200 text-gray-600'
              } ${etsyPending ? 'opacity-70 cursor-wait' : 'hover:bg-white'}`}
            >
              {etsyPending ? (
                <span className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : etsyExported ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-gray-400" />
              )}
              <span>{etsyExported ? 'Etsy Exported' : 'Mark Exported'}</span>
            </button>
          )}
          
          {/* Stock Status Badge */}
          {!product.inStock && (
            <div className="absolute bottom-3 right-3 bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg z-10">
              Out of Stock
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Cyber Week Deal Banner - Red ribbon-style banner (only when discount exists) */}
          {discountPercentage > 0 && (
            <div className="mb-2">
              <div 
                className="bg-red-600 text-white text-xs font-semibold px-4 py-1.5 inline-block relative"
                style={{
                  clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)'
                }}
              >
                Cyber Week Deal
              </div>
            </div>
          )}
          
          {/* Product Name */}
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-base leading-tight">
            {product.name}
          </h3>
          
          {/* Price, Rating, and Review Count - All on same line */}
          <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
            <div className="flex items-baseline space-x-2">
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                  ${product.originalPrice.toFixed(2)}
                </span>
              )}
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                ${product.price.toFixed(2)}
              </span>
            </div>
            
            {/* Rating and Review Count */}
            <div className="flex items-center space-x-1">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => {
                  const rating = product.rating || 0;
                  const fullStars = Math.floor(rating);
                  return (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < fullStars
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300 dark:text-gray-600 fill-none'
                      }`}
                    />
                  );
                })}
              </div>
              <span className="text-sm text-gray-900 dark:text-white">
                ({product.reviewCount || 0})
              </span>
            </div>
          </div>
          
          {/* After Discount Price (if applicable) - Dark grey/black text */}
          {discountPercentage > 0 && product.originalPrice && (
            <p className="text-sm text-gray-900 dark:text-white mb-3">
              After Discount ${(product.emailPromo?.discountedPrice || product.price).toFixed(0)}
            </p>
          )}
          
          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 text-white py-3 px-4 rounded-xl disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2 text-sm font-semibold mt-auto shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>{product.inStock ? 'Add to Cart' : 'Out of Stock'}</span>
          </button>
        </div>
      </div>
    </Link>
  );
}

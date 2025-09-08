'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { Product } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const { addItem } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();

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

  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <Link href={`/products/${product._id || product.id}`} className="group">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Discount Badge */}
          {discountPercentage > 0 && (
            <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
              -{discountPercentage}%
            </div>
          )}
          
          {/* Like Button */}
          <button
            onClick={handleLike}
            className="absolute top-3 right-3 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Heart 
              className={`h-4 w-4 ${(isLiked || isInWishlist((product as any)._id || (product as any).id)) ? 'fill-red-500 text-red-500' : 'text-gray-400 dark:text-gray-500'}`} 
            />
          </button>
          
          {/* Stock Status */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Brand */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium uppercase tracking-wide">{product.brand}</p>
          
          {/* Product Name */}
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-sm leading-tight">
            {product.name}
          </h3>
          
          {/* Rating */}
          <div className="flex items-center mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${
                    i < Math.floor(product.rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              ({product.reviewCount})
            </span>
          </div>
          
          {/* Price */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                ${product.price}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                  ${product.originalPrice}
                </span>
              )}
            </div>
          </div>
          
          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white py-2.5 px-4 rounded-lg disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 text-sm font-medium mt-auto"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>{product.inStock ? 'Add to Cart' : 'Out of Stock'}</span>
          </button>
        </div>
      </div>
    </Link>
  );
}

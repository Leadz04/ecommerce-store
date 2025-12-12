'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ShoppingCart, Tag, ImageIcon } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';

interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  brand?: string;
  category?: string;
  productType?: string;
  inStock: boolean;
  tags?: string[];
  rating?: number;
  reviewCount?: number;
}

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

const PLACEHOLDER_IMAGE = '/placeholder-product.svg';

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const { addItem } = useCartStore();
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(product.image || PLACEHOLDER_IMAGE);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem(product as any, 1);
    toast.success('Added to cart');
  };

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      setImageSrc(PLACEHOLDER_IMAGE);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Don't trigger modal if clicking on button
    if (target.closest('button')) {
      return;
    }
    onClick?.();
  };

  const isOnSale = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = isOnSale
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col h-full"
    >
      {/* Image Container */}
      <div className="aspect-[3/4] relative bg-gray-100 overflow-hidden">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            onError={handleImageError}
            unoptimized={imageError || imageSrc.includes('cdn.shopify.com')}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100">
            <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
            <span className="text-xs">No Image</span>
          </div>
        )}

        {/* Sale Badge */}
        {isOnSale && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded pointer-events-none">
            -{discountPercent}%
          </div>
        )}

        {/* Brand Badge */}
        {product.brand && (
          <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none">
            {product.brand}
          </div>
        )}

        {/* Stock Badge */}
        {!product.inStock && (
          <div className="absolute bottom-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded pointer-events-none">
            Out of Stock
          </div>
        )}

        {/* Quick Add to Cart - Show on Hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="bg-black text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 pointer-events-auto"
          >
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-1">
        {/* Category/Product Type */}
        {(product.category || product.productType) && (
          <div className="flex items-center gap-2 mb-1">
            {product.productType && (
              <span className="text-xs text-gray-500 uppercase tracking-wide">
                {product.productType}
              </span>
            )}
            {product.category && !product.productType && (
              <span className="text-xs text-gray-500 uppercase tracking-wide">
                {product.category}
              </span>
            )}
          </div>
        )}

        {/* Product Name */}
        <h3
          className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[2.5em] mb-2"
          title={product.name}
        >
          {product.name}
        </h3>

        {/* Rating */}
        {product.rating && product.rating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <span className="text-xs text-yellow-500">★</span>
            <span className="text-xs text-gray-600">
              {product.rating.toFixed(1)}
              {product.reviewCount && product.reviewCount > 0 && (
                <span className="text-gray-400"> ({product.reviewCount})</span>
              )}
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-auto">
          <span className="text-lg font-bold text-gray-900">
            Rs. {product.price.toLocaleString()}
          </span>
          {isOnSale && (
            <span className="text-sm text-gray-500 line-through">
              Rs. {product.originalPrice!.toLocaleString()}
            </span>
          )}
        </div>

        {/* Tags Preview */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {product.tags.slice(0, 2).map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
            {product.tags.length > 2 && (
              <span className="text-xs text-gray-400">+{product.tags.length - 2} more</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


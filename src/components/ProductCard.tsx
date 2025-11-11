'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Heart, Eye, Star, Flame } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import toast from 'react-hot-toast';

interface Product {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  price: number;
  salePrice?: number;
  images?: string[];
  imageUrl?: string;
  stock?: number;
  category?: string;
  rating?: number;
  reviewCount?: number;
  isNew?: boolean;
  isFeatured?: boolean;
  flashSale?: {
    discountPercentage: number;
    endDate: Date;
  };
}

interface ProductCardProps {
  product: Product;
  compact?: boolean;
  showQuickAdd?: boolean;
  animate?: boolean;
}

function ProductCard({ product, compact = false, showQuickAdd = true, animate = true }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const addToCart = useCartStore(state => state.addItem);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  
  const inWishlist = isInWishlist(product._id);
  
  const currentPrice = product.flashSale?.discountPercentage 
    ? product.price * (1 - product.flashSale.discountPercentage / 100)
    : product.salePrice || product.price;
  
  const discount = product.flashSale?.discountPercentage || 
    (product.salePrice ? Math.round(((product.price - product.salePrice) / product.price) * 100) : 0);
  
  const isLowStock = product.stock !== undefined && product.stock < 10 && product.stock > 0;
  const isOutOfStock = product.stock === 0;
  
  const imageUrl = product.images?.[0] || product.imageUrl || '/placeholder-product.svg';
  
  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isOutOfStock) {
      toast.error('Product is out of stock');
      return;
    }
    
    addToCart({
      productId: product._id,
      productName: product.name,
      productImage: imageUrl,
      quantity: 1,
      price: currentPrice
    });
    
    toast.success('Added to cart!');
  };
  
  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (inWishlist) {
      await removeFromWishlist(product._id);
      toast.success('Removed from wishlist');
    } else {
      await addToWishlist(product._id);
      toast.success('Added to wishlist!');
    }
  };
  
  const CardWrapper = animate ? motion.div : 'div';
  const animationProps = animate ? {
    whileHover: { y: -8 },
    transition: { duration: 0.3 }
  } : {};
  
  return (
    <CardWrapper
      {...animationProps}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative bg-white dark:bg-gray-900 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
    >
      <Link href={`/products/${product.slug || product._id}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className={`object-cover transition-all duration-500 ${
              isHovered ? 'scale-110' : 'scale-100'
            } ${!imageLoaded ? 'blur-sm' : 'blur-0'}`}
            onLoad={() => setImageLoaded(true)}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-2">
            {product.isNew && (
              <Badge variant="success">New</Badge>
            )}
            {discount > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                {product.flashSale && <Flame className="w-3 h-3" />}
                -{discount}%
              </Badge>
            )}
            {isLowStock && !isOutOfStock && (
              <Badge variant="warning">Low Stock</Badge>
            )}
            {isOutOfStock && (
              <Badge variant="secondary">Out of Stock</Badge>
            )}
          </div>
          
          {/* Wishlist Button */}
          <motion.button
            onClick={handleWishlist}
            className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Heart 
              className={`w-5 h-5 ${inWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-400'}`} 
            />
          </motion.button>
          
          {/* Quick Actions (shown on hover) */}
          <AnimatePresence>
            {isHovered && showQuickAdd && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-2 left-2 right-2 flex gap-2"
              >
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={handleQuickAdd}
                  disabled={isOutOfStock}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {isOutOfStock ? 'Out of Stock' : 'Quick Add'}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Quick view modal would open here
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Product Info */}
        <div className="p-4">
          {/* Category */}
          {product.category && !compact && (
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              {product.category}
            </p>
          )}
          
          {/* Product Name */}
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
            {product.name}
          </h3>
          
          {/* Rating */}
          {product.rating && product.reviewCount && !compact && (
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {product.rating.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({product.reviewCount})
              </span>
            </div>
          )}
          
          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              ${currentPrice.toFixed(2)}
            </span>
            {(product.salePrice || product.flashSale) && (
              <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>
          
          {/* Flash Sale Timer */}
          {product.flashSale && (
            <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">
              Sale ends soon!
            </div>
          )}
        </div>
      </Link>
    </CardWrapper>
  );
}

export default ProductCard;

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, ShoppingCart, ExternalLink, Star, Tag, Package, Truck, Shield, ImageIcon, Minus, Plus } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';

const PLACEHOLDER_IMAGE = '/placeholder-product.svg';

interface Product {
  _id: string;
  name: string;
  description: string;
  descriptionHtml?: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  brand?: string;
  category?: string;
  subCategory?: string;
  productType?: string;
  inStock: boolean;
  stockCount?: number;
  tags?: string[];
  rating?: number;
  reviewCount?: number;
  specifications?: Record<string, string>;
  sourceUrl?: string;
  variants?: Array<{
    title?: string;
    sku?: string;
    price?: number;
    originalPrice?: number;
    available?: boolean;
    inventory?: number | null;
  }>;
}

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductDetailModal({ product, isOpen, onClose }: ProductDetailModalProps) {
  const { addItem } = useCartStore();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      setSelectedImageIndex(0);
      setSelectedVariant(null);
      setQuantity(1);
      setImageErrors(new Set());
    }
  }, [product?._id]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const images = (product.images && product.images.length > 0) ? product.images : [product.image];
  const currentImage = images[selectedImageIndex] || product.image;
  const isOnSale = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = isOnSale
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  const displayPrice = selectedVariant !== null && product.variants?.[selectedVariant]?.price
    ? product.variants[selectedVariant].price
    : product.price;

  const displayOriginalPrice = selectedVariant !== null && product.variants?.[selectedVariant]?.originalPrice
    ? product.variants[selectedVariant].originalPrice
    : product.originalPrice;

  const handleImageError = (index: number) => {
    setImageErrors(prev => new Set(prev).add(index));
  };

  const getImageSrc = (img: string, index: number) => {
    if (imageErrors.has(index)) {
      return PLACEHOLDER_IMAGE;
    }
    return img || PLACEHOLDER_IMAGE;
  };

  const isShopifyImage = (src: string) => src.includes('cdn.shopify.com');

  const handleAddToCart = () => {
    const productToAdd = selectedVariant !== null && product.variants?.[selectedVariant]
      ? {
          ...product,
          price: product.variants[selectedVariant].price || product.price,
          originalPrice: product.variants[selectedVariant].originalPrice || product.originalPrice,
        }
      : product;

    addItem(productToAdd as any, quantity);
    toast.success(`Added ${quantity} item${quantity > 1 ? 's' : ''} to cart`);
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => Math.max(1, Math.min(prev + delta, product.stockCount || 99)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/90 rounded-full hover:bg-gray-100 transition-colors shadow-lg"
        >
          <X className="w-5 h-5 text-blue-600" />
        </button>

        {/* Image Section */}
        <div className="w-full md:w-1/2 bg-gray-50 flex flex-col relative min-h-[300px] md:min-h-full">
          {/* Main Image */}
          <div className="relative flex-1 min-h-[300px] md:min-h-0">
            {currentImage ? (
              <Image
                src={getImageSrc(currentImage, selectedImageIndex)}
                alt={product.name}
                fill
                className="object-contain p-4"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                onError={() => handleImageError(selectedImageIndex)}
                unoptimized={isShopifyImage(currentImage) || imageErrors.has(selectedImageIndex)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100">
                <ImageIcon className="w-16 h-16 mb-2 text-blue-600 opacity-50" />
                <span className="text-sm">No Image Available</span>
              </div>
            )}

            {/* Sale Badge */}
            {isOnSale && (
              <div className="absolute top-4 right-4 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded">
                -{discountPercent}% OFF
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="h-24 border-t border-gray-200 p-2 overflow-x-auto flex gap-2 no-scrollbar bg-white z-10">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${
                    selectedImageIndex === idx
                      ? 'border-blue-600 ring-1 ring-blue-600'
                      : 'border-transparent hover:border-blue-300'
                  }`}
                >
                  <Image
                    src={getImageSrc(img, idx)}
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                    onError={() => handleImageError(idx)}
                    unoptimized={isShopifyImage(img) || imageErrors.has(idx)}
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto custom-scrollbar">
          {/* Brand & Category */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            {product.brand && (
              <>
                <span className="font-medium text-black uppercase tracking-wider">{product.brand}</span>
                <span>•</span>
              </>
            )}
            {product.productType && (
              <>
                <span>{product.productType}</span>
                {product.category && <span>•</span>}
              </>
            )}
            {product.category && <span>{product.category}</span>}
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">{product.name}</h2>

          {/* Rating */}
          {product.rating && product.rating > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(product.rating!)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {product.rating.toFixed(1)}
                {product.reviewCount && product.reviewCount > 0 && (
                  <span className="text-gray-400"> ({product.reviewCount} reviews)</span>
                )}
              </span>
            </div>
          )}

          {/* Pricing */}
          <div className="flex items-baseline gap-4 mb-6">
            <span className="text-3xl font-bold text-gray-900">
              Rs. {displayPrice.toLocaleString()}
            </span>
            {displayOriginalPrice && displayOriginalPrice > displayPrice && (
              <span className="text-lg text-gray-500 line-through">
                Rs. {displayOriginalPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-4 mb-6">
            {product.inStock ? (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <Package className="w-4 h-4 text-green-700" />
                In Stock
                {product.stockCount !== undefined && product.stockCount > 0 && (
                  <span>({product.stockCount} available)</span>
                )}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
                <Package className="w-4 h-4 text-red-700" />
                Out of Stock
              </span>
            )}
          </div>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Variant</label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedVariant(idx)}
                    disabled={variant.available === false}
                    className={`px-4 py-2 border rounded-lg text-sm transition-colors ${
                      selectedVariant === idx
                        ? 'bg-blue-600 text-white border-blue-600'
                        : variant.available === false
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    {variant.title || `Variant ${idx + 1}`}
                    {variant.price && variant.price !== product.price && (
                      <span className="ml-2">(Rs. {variant.price.toLocaleString()})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                className="p-2 border-2 border-blue-600 rounded-lg bg-white hover:bg-blue-50 hover:border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:hover:bg-white transition-colors"
              >
                <Minus className="w-4 h-4 text-blue-600 disabled:text-gray-400" />
              </button>
              <span className="text-lg font-semibold w-12 text-center text-blue-600">{quantity}</span>
              <button
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= (product.stockCount || 99)}
                className="p-2 border-2 border-blue-600 rounded-lg bg-white hover:bg-blue-50 hover:border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:hover:bg-white transition-colors"
              >
                <Plus className="w-4 h-4 text-blue-600 disabled:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-5 h-5" />
              Add to Cart
            </button>
            {product.sourceUrl && (
              <a
                href={product.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
              >
                <ExternalLink className="w-5 h-5 text-blue-600" />
                View Source
              </a>
            )}
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    <Tag className="w-3 h-3 text-blue-600" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Truck className="w-5 h-5 text-blue-600" />
              <span>Free Shipping</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="w-5 h-5 text-blue-600" />
              <span>Secure Payment</span>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">Description</h3>
              <div
                className="prose prose-sm max-w-none text-gray-600"
                dangerouslySetInnerHTML={{
                  __html: product.descriptionHtml || product.description
                }}
              />
            </div>
          )}

          {/* Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Specifications</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        {key}
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {Array.isArray(value) ? value.join(', ') : String(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


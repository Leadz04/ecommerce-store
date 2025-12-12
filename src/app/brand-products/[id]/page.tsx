'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, ExternalLink, Star, Tag, Package, Truck, Shield, ImageIcon } from 'lucide-react';
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

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCartStore();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${productId}`);
        if (!res.ok) {
          throw new Error('Product not found');
        }
        const data = await res.json();
        setProduct(data.product || data);
      } catch (error) {
        console.error('Failed to fetch product', error);
        toast.error('Product not found');
        router.push('/brand-products');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, router]);

  const handleAddToCart = () => {
    if (!product) return;

    const productToAdd = selectedVariant !== null && product.variants?.[selectedVariant]
      ? {
          ...product,
          price: product.variants[selectedVariant].price || product.price,
          originalPrice: product.variants[selectedVariant].originalPrice || product.originalPrice,
        }
      : product;

    addItem(productToAdd as any, 1);
    toast.success('Added to cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-black rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <Link
            href="/brand-products"
            className="text-blue-600 hover:underline"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link
            href="/brand-products"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Products</span>
          </Link>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-12">
            {/* Image Section */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
                {currentImage ? (
                  <Image
                    src={getImageSrc(currentImage, selectedImageIndex)}
                    alt={product.name}
                    fill
                    className="object-contain p-4"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                    onError={() => handleImageError(selectedImageIndex)}
                    unoptimized={isShopifyImage(currentImage) || imageErrors.has(selectedImageIndex)}
                    loading={selectedImageIndex === 0 ? 'eager' : 'lazy'}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100">
                    <ImageIcon className="w-16 h-16 mb-2 opacity-50" />
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
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${
                        selectedImageIndex === idx
                          ? 'border-black ring-2 ring-black'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Image
                        src={getImageSrc(img, idx)}
                        alt={`Thumbnail ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
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
            <div className="space-y-6">
              {/* Brand & Category */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
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

              {/* Product Name */}
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                {product.name}
              </h1>

              {/* Rating */}
              {product.rating && product.rating > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
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
              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-bold text-gray-900">
                  Rs. {displayPrice.toLocaleString()}
                </span>
                {displayOriginalPrice && displayOriginalPrice > displayPrice && (
                  <span className="text-xl text-gray-500 line-through">
                    Rs. {displayOriginalPrice.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-4">
                {product.inStock ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <Package className="w-4 h-4" />
                    In Stock
                    {product.stockCount !== undefined && product.stockCount > 0 && (
                      <span>({product.stockCount} available)</span>
                    )}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    <Package className="w-4 h-4" />
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Variants */}
              {product.variants && product.variants.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Variant</label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((variant, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedVariant(idx)}
                        disabled={variant.available === false}
                        className={`px-4 py-2 border rounded-lg text-sm transition-colors ${
                          selectedVariant === idx
                            ? 'bg-black text-white border-black'
                            : variant.available === false
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
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

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className="flex-1 flex items-center justify-center gap-2 bg-black text-white px-6 py-3.5 rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </button>
                {product.sourceUrl && (
                  <a
                    href={product.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-3.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                    View Source
                  </a>
                )}
              </div>

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Features */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Truck className="w-5 h-5 text-gray-400" />
                  <span>Free Shipping</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <span>Secure Payment</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description & Specifications */}
          <div className="border-t p-6 lg:p-12 space-y-8">
            {/* Description */}
            {product.description && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
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
                <h2 className="text-xl font-bold text-gray-900 mb-4">Specifications</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                          {key}
                        </dt>
                        <dd className="text-base text-gray-900">
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
      </main>
    </div>
  );
}


'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { X, ShoppingCart, Trash2, ArrowLeft, AlertCircle } from 'lucide-react';
import { useComparisonStore } from '@/store/comparisonStore';
import { useCartStore } from '@/store/cartStore';
import { Product } from '@/types';
import BackButton from '@/components/BackButton';
import toast from 'react-hot-toast';

export default function ComparePage() {
  const router = useRouter();
  const { products, removeProduct, clearComparison } = useComparisonStore();
  const { addItem } = useCartStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <BackButton href="/products" />
          <div className="text-center py-16">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">No Products to Compare</h1>
            <p className="text-gray-600 mb-6">Add products to comparison to see them side by side</p>
            <Link
              href="/products"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show message if only one product
  if (products.length === 1) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <BackButton href="/products" />
          <div className="text-center py-16">
            <AlertCircle className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Add More Products to Compare</h1>
            <p className="text-gray-600 mb-6">You need at least 2 products to compare. Add more products to see them side by side.</p>
            <Link
              href="/products"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get all unique specification keys across all products
  const getAllSpecs = () => {
    const specKeys = new Set<string>();
    products.forEach(product => {
      if (product.specifications) {
        Object.keys(product.specifications).forEach(key => specKeys.add(key));
      }
    });
    return Array.from(specKeys);
  };

  const specKeys = getAllSpecs();

  const handleAddToCart = (product: Product) => {
    addItem(product, 1);
    toast.success(`${product.name} added to cart`);
  };

  const handleRemove = (productId: string) => {
    removeProduct(productId);
    toast.success('Product removed from comparison');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Product Comparison</h1>
              <p className="text-gray-600 mt-1">Compare {products.length} product{products.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={clearComparison}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear All</span>
              </button>
              <BackButton href="/products" />
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10 min-w-[200px]">
                    Features
                  </th>
                  {products.map((product) => (
                    <th key={(product as any)._id || (product as any).id} className="px-6 py-4 text-center align-top relative min-w-[250px]">
                      <button
                        onClick={() => handleRemove((product as any)._id || (product as any).id)}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                        aria-label="Remove from comparison"
                      >
                        <X className="h-5 w-5" />
                      </button>
                      <Link
                        href={`/products/${(product as any)._id || (product as any).id}`}
                        className="block hover:opacity-80 transition-opacity"
                      >
                        <div className="relative w-full h-48 mb-4">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                        <div className="space-y-2 mb-4">
                          <div className="text-2xl font-bold text-blue-600">
                            ${product.price.toFixed(2)}
                          </div>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <div className="text-sm text-gray-500 line-through">
                              ${product.originalPrice.toFixed(2)}
                            </div>
                          )}
                          <div className="flex items-center justify-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={`text-sm ${
                                  i < Math.floor(product.rating || 0)
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              >
                                ★
                              </span>
                            ))}
                            <span className="text-sm text-gray-600 ml-1">
                              ({product.reviewCount || 0})
                            </span>
                          </div>
                          <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            product.inStock
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.inStock ? 'In Stock' : 'Out of Stock'}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          disabled={!product.inStock}
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          <span>Add to Cart</span>
                        </button>
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* Description */}
                <tr>
                  <td className="px-6 py-4 font-medium text-gray-900 sticky left-0 bg-white z-10">
                    Description
                  </td>
                  {products.map((product) => (
                    <td key={(product as any)._id || (product as any).id} className="px-6 py-4 text-sm text-gray-600">
                      {product.description?.substring(0, 150)}
                      {product.description && product.description.length > 150 && '...'}
                    </td>
                  ))}
                </tr>

                {/* Category */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 sticky left-0 bg-gray-50 z-10">
                    Category
                  </td>
                  {products.map((product) => (
                    <td key={(product as any)._id || (product as any).id} className="px-6 py-4 text-sm text-gray-600">
                      {product.category || 'N/A'}
                    </td>
                  ))}
                </tr>

                {/* Brand */}
                {(products.some(p => (p as any).brand)) && (
                  <tr>
                    <td className="px-6 py-4 font-medium text-gray-900 sticky left-0 bg-white z-10">
                      Brand
                    </td>
                    {products.map((product) => (
                      <td key={(product as any)._id || (product as any).id} className="px-6 py-4 text-sm text-gray-600">
                        {(product as any).brand || 'N/A'}
                      </td>
                    ))}
                  </tr>
                )}

                {/* Rating */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 sticky left-0 bg-gray-50 z-10">
                    Rating
                  </td>
                  {products.map((product) => (
                    <td key={(product as any)._id || (product as any).id} className="px-6 py-4 text-sm text-gray-600">
                      {product.rating?.toFixed(1) || 'N/A'} / 5.0 ({product.reviewCount || 0} reviews)
                    </td>
                  ))}
                </tr>

                {/* Stock Status */}
                <tr>
                  <td className="px-6 py-4 font-medium text-gray-900 sticky left-0 bg-white z-10">
                    Stock Status
                  </td>
                  {products.map((product) => (
                    <td key={(product as any)._id || (product as any).id} className="px-6 py-4 text-sm">
                      <span className={`inline-block px-3 py-1 rounded-full font-medium ${
                        product.inStock
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.inStock ? `In Stock${(product as any).stockCount ? ` (${(product as any).stockCount} available)` : ''}` : 'Out of Stock'}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Specifications */}
                {specKeys.length > 0 && specKeys.map((key, index) => (
                  <tr key={key} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4 font-medium text-gray-900 sticky left-0 z-10" style={{ backgroundColor: index % 2 === 0 ? '#f9fafb' : '#ffffff' }}>
                      {key}
                    </td>
                    {products.map((product) => (
                      <td key={(product as any)._id || (product as any).id} className="px-6 py-4 text-sm text-gray-600">
                        {product.specifications?.[key] || 'N/A'}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Tags */}
                {products.some(p => p.tags && p.tags.length > 0) && (
                  <tr className={specKeys.length % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4 font-medium text-gray-900 sticky left-0 z-10" style={{ backgroundColor: specKeys.length % 2 === 0 ? '#f9fafb' : '#ffffff' }}>
                      Tags
                    </td>
                    {products.map((product) => (
                      <td key={(product as any)._id || (product as any).id} className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {product.tags && product.tags.length > 0 ? (
                            product.tags.slice(0, 5).map((tag, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">N/A</span>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


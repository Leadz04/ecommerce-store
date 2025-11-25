'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Trash2, Edit, Plus, Minus } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import BackButton from '@/components/BackButton';
import { useStockValidation } from '@/hooks/useStockValidation';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotalPrice, getTotalItems } = useCartStore();
  const enforceStockLimits = useCartStore((state) => state.enforceStockLimits);
  const { validateStock, isValidating } = useStockValidation();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const adjustments = enforceStockLimits();
    adjustments.forEach((adj) => {
      if (adj.removed) {
        toast.error(`${adj.name} was removed from your cart because it is out of stock.`);
      } else {
        toast.error(
          `${adj.name}: Only ${adj.availableStock} left. Quantity updated to ${adj.newQuantity}.`
        );
      }
    });
  }, [enforceStockLimits]);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId);
      toast.success('Item removed from cart');
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleRemove = (itemId: string, productName: string) => {
    removeItem(itemId);
    toast.success(`${productName} removed from cart`);
  };

  const calculateTotals = () => {
    const subtotal = getTotalPrice();
    const shipping = subtotal > 100 ? 0 : 9.99; // Free shipping over $100
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + shipping + tax;

    return { subtotal, shipping, tax, total };
  };

  const { subtotal, shipping, tax, total } = calculateTotals();

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 sm:py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <BackButton
              href="/products"
              variant="icon-only"
              className="text-white/80 hover:text-white hover:bg-white/20 shrink-0 border-white/20"
            />
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-1 sm:mb-2">Shopping Cart</h1>
              <p className="text-sm sm:text-base text-blue-100">
                {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cart Content */}
      <section className="py-6 sm:py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {items.length === 0 ? (
            <div className="text-center py-12 sm:py-16 md:py-20 bg-white rounded-lg shadow-sm px-4">
              <ShoppingCart className="h-16 w-16 sm:h-20 sm:w-20 text-gray-300 mx-auto mb-4 sm:mb-6" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-4">Your cart is empty</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 px-4">Looks like you haven't added anything to your cart yet.</p>
              <Link
                href="/products"
                className="inline-block px-6 sm:px-8 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                {items.map((item) => {
                  const pid = (item.product as any)._id || (item.product as any).id;
                  const hasDiscount = item.product.originalPrice && item.product.originalPrice > item.product.price;

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        {/* Product Image */}
                        <Link
                          href={`/products/${pid}`}
                          className="shrink-0 relative group self-center sm:self-start"
                        >
                          <div className="w-24 h-24 sm:w-32 sm:h-32 relative overflow-hidden rounded-lg border border-gray-200">
                            <Image
                              src={item.product.image}
                              alt={item.product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        </Link>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 sm:gap-4 mb-3">
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/products/${pid}`}
                                className="text-lg sm:text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors block mb-2 line-clamp-2"
                              >
                                {item.product.name}
                              </Link>
                              <div className="flex flex-wrap gap-x-3 gap-y-1">
                                {(item as any).size && (
                                  <p className="text-xs sm:text-sm text-gray-600">
                                    Size: <span className="font-medium">{(item as any).size}</span>
                                  </p>
                                )}
                                {(item as any).color && (
                                  <p className="text-xs sm:text-sm text-gray-600">
                                    Color: <span className="font-medium">{(item as any).color}</span>
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Action Icons */}
                            <div className="flex gap-1 sm:gap-2 shrink-0">
                              <Link
                                href={`/products/${pid}`}
                                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded transition-colors"
                                aria-label="Edit item"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                              </Link>
                              <button
                                onClick={() => handleRemove(item.id, item.product.name)}
                                className="p-1.5 sm:p-2 hover:bg-red-50 rounded transition-colors"
                                aria-label={`Remove ${item.product.name}`}
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                              </button>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="mb-3 sm:mb-4">
                            {hasDiscount ? (
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                <span className="text-red-600 font-bold text-lg sm:text-xl">
                                  ${item.product.price.toFixed(2)}
                                </span>
                                <span className="text-gray-400 line-through text-xs sm:text-sm">
                                  ${item.product.originalPrice?.toFixed(2)}
                                </span>
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                  Save ${((item.product.originalPrice! - item.product.price) * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-900 font-bold text-lg sm:text-xl">
                                ${item.product.price.toFixed(2)}
                              </span>
                            )}
                          </div>

                          {/* Quantity Selector */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <span className="text-xs sm:text-sm text-gray-600 font-medium">Quantity:</span>
                              <div className="flex items-center border border-gray-300 rounded-lg">
                                <button
                                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                  className="p-1.5 sm:p-2 hover:bg-gray-100 transition-colors"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-700" />
                                </button>
                                <span className="w-10 sm:w-12 text-center font-semibold text-gray-900 text-sm sm:text-base">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                  className="p-1.5 sm:p-2 hover:bg-gray-100 transition-colors"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-700" />
                                </button>
                              </div>
                            </div>
                            <div className="text-left sm:text-right">
                              <p className="text-xs sm:text-sm text-gray-600">Item Total</p>
                              <p className="text-lg sm:text-xl font-bold text-gray-900">
                                ${(item.product.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 sticky top-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Order Summary</h2>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span className="font-semibold text-gray-900">
                        {shipping === 0 ? (
                          <span className="text-green-600">Free</span>
                        ) : (
                          `$${shipping.toFixed(2)}`
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Tax</span>
                      <span className="font-semibold text-gray-900">${tax.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-4 flex justify-between">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-lg font-bold text-gray-900">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  {subtotal < 100 && (
                    <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Add ${(100 - subtotal).toFixed(2)} more to get <strong>free shipping</strong>!
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <button
                      onClick={async () => {
                        const isValid = await validateStock();
                        if (isValid) {
                          window.location.href = '/checkout';
                        }
                      }}
                      disabled={isValidating}
                      className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-semibold text-center hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isValidating ? 'Checking Stock...' : 'Proceed to Checkout'}
                    </button>
                    <Link
                      href="/products"
                      className="w-full border-2 border-gray-900 text-gray-900 py-3 px-4 rounded-lg font-semibold text-center block hover:bg-gray-50 transition-colors"
                    >
                      Continue Shopping
                    </Link>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Secure checkout with SSL encryption</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}


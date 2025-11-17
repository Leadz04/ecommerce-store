'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ShoppingCart, Search, Menu, X, User, LogOut, Settings, Trash2, Shield, ChevronRight, Edit } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { items, getTotalItems, getTotalPrice, removeItem, updateQuantity } = useCartStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Set mounted state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Products', href: '/products' },
    { name: 'Categories', href: '/categories' },
    { name: 'Collections', href: '/collections/new' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const previousOverflow = document.body.style.overflow;
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-300">
              ShopEase
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-gray-900 px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all duration-200 hover:scale-105 relative group"
              >
                {item.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
          </nav>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search products..."
                className="block w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 rounded-xl leading-5 bg-white/80 backdrop-blur-sm placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
              />
            </div>
          </div>

          {/* Right side icons */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* User Account */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="hidden md:block text-sm font-medium">{user?.name}</span>
                </button>
                
                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User className="h-4 w-4 mr-3" />
                      My Profile
                    </Link>
                    <Link
                      href="/orders"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Orders
                    </Link>
                    {user?.permissions?.includes('system:settings') ? (
                      <Link
                        href="/admin"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Shield className="h-4 w-4 mr-3" />
                        Admin Panel
                      </Link>
                    ) : (
                      <Link
                        href="/customer"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4 mr-3" />
                        My Dashboard
                      </Link>
                    )}
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Shopping Cart */}
            <button
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="relative p-2 text-gray-700 hover:text-gray-900"
            >
              <ShoppingCart className="h-6 w-6" />
              {isMounted && getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-gray-900"
              aria-label="Open menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex items-start justify-center bg-black/40 backdrop-blur-sm px-4 py-8" role="dialog" aria-modal="true">
            <div
              className="absolute inset-0"
              aria-hidden="true"
              onClick={() => setIsMenuOpen(false)}
            />
            <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
              <div className="bg-red-600 text-white px-5 py-4 flex items-center justify-between">
                <span className="font-semibold tracking-wide">Menu</span>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1 rounded-full hover:bg-white/20 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto">
                <ul className="divide-y divide-gray-100">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="flex items-center justify-between px-5 py-4 text-gray-900 hover:bg-gray-50"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name}</span>
                          {item.name === 'Men' && (
                            <span className="text-[10px] uppercase font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
                              Hot
                            </span>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="px-5 py-4 border-t border-gray-200 space-y-3">
                <div className="flex items-center text-gray-700 gap-3">
                  <User className="h-5 w-5" />
                  {isAuthenticated ? (
                    <button
                      onClick={() => {
                        
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="text-sm font-medium text-red-600 hover:text-red-500"
                    >
                      Sign Out
                    </button>
                  ) : (
                    <Link href="/login" onClick={() => setIsMenuOpen(false)} className="text-sm font-medium hover:text-blue-600">
                      Login / Register
                    </Link>
                  )}
                </div>
                <div className="text-xs text-gray-500 border-t border-gray-100 pt-3">
                  <p className="font-medium text-gray-700">Need help?</p>
                  <p>Email: support@shopease.com</p>
                  <p>Phone: +1 (555) 123-4567</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setIsCartOpen(false)}
            aria-hidden="true"
          />
          <div className="relative h-screen w-1/4 bg-white shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <h2 className="text-lg font-bold text-gray-900">
                Shopping Cart ({getTotalItems()})
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                aria-label="Close cart"
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="h-5 w-5 text-gray-700" />
              </button>
            </div>
            
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
                {!isMounted ? (
                  <p className="text-gray-500 text-center py-8">Loading...</p>
                ) : items.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Your cart is empty</p>
                    <Link
                      href="/products"
                      onClick={() => setIsCartOpen(false)}
                      className="inline-block px-6 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {items.map((item) => {
                      const pid = (item.product as any)._id || (item.product as any).id;
                      const totalPrice = item.product.price * item.quantity;
                      const hasDiscount = item.product.originalPrice && item.product.originalPrice > item.product.price;
                      return (
                        <div key={item.id} className="flex gap-3 pb-6 border-b border-gray-200 last:border-b-0">
                          {/* Product Image */}
                          <Link href={`/products/${pid}`} onClick={() => setIsCartOpen(false)} className="shrink-0">
                            <img 
                              src={item.product.image} 
                              alt={item.product.name} 
                              className="w-20 h-20 object-cover rounded border border-gray-200" 
                            />
                          </Link>
                          
                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <Link 
                              href={`/products/${pid}`} 
                              onClick={() => setIsCartOpen(false)}
                              className="block font-bold text-gray-900 hover:text-blue-600 mb-1"
                            >
                              {item.product.name}
                            </Link>
                            
                            {/* Size (if available) */}
                            {(item as any).size && (
                              <p className="text-sm text-gray-600 mb-2">Size: {(item as any).size}</p>
                            )}
                            
                            {/* Price */}
                            <div className="mb-3">
                              {hasDiscount ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-red-600 font-bold text-lg">
                                    ${item.product.price.toFixed(2)}
                                  </span>
                                  <span className="text-gray-400 line-through text-sm">
                                    ${item.product.originalPrice?.toFixed(2)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-900 font-bold text-lg">
                                  ${item.product.price.toFixed(2)}
                                </span>
                              )}
                            </div>
                            
                            {/* Quantity Selector */}
                            <div className="flex items-center gap-2 mb-3">
                              <button
                                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-semibold transition-colors"
                                aria-label="Decrease quantity"
                              >
                                −
                              </button>
                              <span className="w-8 text-center font-semibold text-gray-900">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-semibold transition-colors"
                                aria-label="Increase quantity"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          
                          {/* Action Icons */}
                          <div className="flex flex-col gap-3 shrink-0">
                            <Link
                              href={`/products/${pid}`}
                              onClick={() => setIsCartOpen(false)}
                              className="p-2 hover:bg-gray-100 rounded transition-colors inline-block"
                              aria-label="Edit item"
                              title="Edit"
                            >
                              <Edit className="h-5 w-5 text-gray-600" />
                            </Link>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-2 hover:bg-red-50 rounded transition-colors"
                              aria-label={`Remove ${item.product.name}`}
                              title="Delete"
                            >
                              <Trash2 className="h-5 w-5 text-red-600" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
            {/* Footer */}
            {isMounted && items.length > 0 && (
              <div className="border-t px-6 py-5 bg-white shrink-0">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-gray-900">Subtotal</span>
                  <span className="font-bold text-gray-900">${getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="space-y-3">
                  <Link
                    href="/cart"
                    className="w-full py-3 px-4 border-2 border-gray-900 text-gray-900 font-semibold rounded text-center block hover:bg-gray-50 transition-colors"
                    onClick={() => setIsCartOpen(false)}
                  >
                    View Cart
                  </Link>
                  <Link
                    href="/checkout"
                    className="w-full py-3 px-4 bg-gray-900 text-white font-semibold rounded text-center block hover:bg-gray-800 transition-colors"
                    onClick={() => setIsCartOpen(false)}
                  >
                    Checkout
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

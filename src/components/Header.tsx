'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ShoppingCart, Search, Menu, X, User, LogOut, Settings, Trash2, Shield, ChevronRight } from 'lucide-react';
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
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setIsCartOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Shopping Cart</h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  aria-label="Close cart"
                  title="Close"
                  className="p-2 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-700" />
                </button>
              </div>
              
              <div className="flex-1 p-4">
                {!isMounted ? (
                  <p className="text-gray-500 text-center py-8">Loading...</p>
                ) : items.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Your cart is empty</p>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => {
                      const pid = (item.product as any)._id || (item.product as any).id;
                      return (
                        <div key={item.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:border-gray-300 transition-colors">
                          <Link href={`/products/${pid}`} onClick={() => setIsCartOpen(false)} className="shrink-0">
                            <img src={item.product.image} alt={item.product.name} className="w-14 h-14 object-cover rounded" />
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link href={`/products/${pid}`} onClick={() => setIsCartOpen(false)} className="block font-medium text-sm text-gray-900 hover:text-blue-600 truncate">
                              {item.product.name}
                            </Link>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-gray-700 text-sm font-medium">${item.product.price}</span>
                              <div className="flex items-center space-x-2">
                                <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} className="px-2 py-1 border rounded text-sm hover:bg-gray-50">-</button>
                                <span className="text-sm w-6 text-center">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2 py-1 border rounded text-sm hover:bg-gray-50">+</button>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="inline-flex items-center space-x-1 text-red-600 hover:text-red-700 text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50"
                            aria-label={`Remove ${item.product.name}`}
                            title="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {isMounted && items.length > 0 && (
                <div className="border-t p-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Total: ${getTotalPrice().toFixed(2)}</span>
                  </div>
                  <Link
                    href="/checkout"
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-center block"
                    onClick={() => setIsCartOpen(false)}
                  >
                    Checkout
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

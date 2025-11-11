'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ShoppingCart, Search, Menu, X, User, LogOut, Settings, Trash2, Shield } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { items, getTotalItems, getTotalPrice, removeItem, updateQuantity, clearCart } = useCartStore();
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
    { name: 'Occasions', href: '/occasions' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo */}
          <div className="flex-shrink-0 mr-2 lg:mr-4">
            <Link href="/" className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-300 whitespace-nowrap">
              ShopEase
            </Link>
          </div>

          {/* Desktop Navigation - Hidden on smaller screens, compact on large */}
          <nav className="hidden xl:flex space-x-1 mr-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-gray-900 px-2 py-2 text-xs xl:text-sm font-medium rounded-lg hover:bg-gray-50 transition-all duration-200 hover:scale-105 relative group whitespace-nowrap"
              >
                {item.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
          </nav>

          {/* Search Bar - More compact, hidden on small screens */}
          <div className="hidden lg:flex flex-1 max-w-xs xl:max-w-md mx-2">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                className="block w-full pl-8 pr-2 py-2 text-sm border-2 border-gray-200 rounded-lg leading-5 bg-white/80 backdrop-blur-sm placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
          </div>

          {/* Right side icons */}
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {/* User Account */}
            {isAuthenticated ? (
              <div className="relative flex-shrink-0" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-1 sm:space-x-2 p-1.5 sm:p-2 text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                  title={user?.name}
                >
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <span className="hidden lg:block text-xs xl:text-sm font-medium max-w-[100px] truncate">{user?.name}</span>
                </button>
                
                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[9997] animate-fadeIn">
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
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                <Link
                  href="/login"
                  className="px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors whitespace-nowrap"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors whitespace-nowrap"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Shopping Cart */}
            <button
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="relative p-1.5 sm:p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 flex-shrink-0"
              aria-label="Shopping cart"
              title="Shopping cart"
            >
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
              {isMounted && getTotalItems() > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold shadow-lg px-1">
                  {getTotalItems()}
                </span>
              )}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="xl:hidden p-1.5 sm:p-2 text-gray-700 hover:text-gray-900 flex-shrink-0"
              aria-label="Menu"
            >
              {isMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[9998] bg-white overflow-y-auto animate-slideInLeft">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <Link href="/" className="text-xl font-semibold text-gray-900" onClick={() => setIsMenuOpen(false)}>
                ShopEase
              </Link>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 text-gray-700 hover:text-gray-900">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-gray-900 block px-3 py-3 text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile Auth Links */}
              <div className="border-t pt-3 mt-3">
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/profile"
                      className="text-gray-700 hover:text-gray-900 block px-3 py-3 text-base font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Profile
                    </Link>
                    <Link
                      href="/orders"
                      className="text-gray-700 hover:text-gray-900 block px-3 py-3 text-base font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Orders
                    </Link>
                    {user?.permissions?.includes('system:settings') ? (
                      <Link
                        href="/admin"
                        className="text-gray-700 hover:text-gray-900 block px-3 py-3 text-base font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Admin Panel
                      </Link>
                    ) : (
                      <Link
                        href="/customer"
                        className="text-gray-700 hover:text-gray-900 block px-3 py-3 text-base font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        My Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="text-red-600 hover:text-red-700 block px-3 py-3 text-base font-medium w-full text-left"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-gray-700 hover:text-gray-900 block px-3 py-3 text-base font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      className="text-blue-600 hover:text-blue-700 block px-3 py-3 text-base font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
            {/* Mobile Search */}
            <div className="px-4 py-3 border-t">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search products..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[9999] w-full h-full">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsCartOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-out animate-slideInRight z-[10000]">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Shopping Cart ({getTotalItems()})
                </h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  aria-label="Close cart"
                  title="Close"
                  className="p-2 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-white hover:shadow-md transition-all duration-200 hover:rotate-90"
                >
                  <X className="h-5 w-5 text-gray-700" />
                </button>
              </div>
              
              <div className="flex-1 p-4 bg-gray-50">
                {!isMounted ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                    <p className="text-gray-500 text-sm">Loading cart...</p>
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
                    <p className="text-gray-900 font-semibold text-lg mb-1">Your cart is empty</p>
                    <p className="text-gray-500 text-sm mb-6">Add some products to get started!</p>
                    <Link
                      href="/products"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      onClick={() => setIsCartOpen(false)}
                    >
                      Browse Products
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Debug Info - Remove after fixing */}
                    {items.some(item => !item || !item.product) && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800 mb-2">⚠️ Cart has corrupted items</p>
                        <button
                          onClick={() => {
                            if (confirm('Clear all cart items? This cannot be undone.')) {
                              clearCart();
                              setIsCartOpen(false);
                            }
                          }}
                          className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                        >
                          Clear Cart
                        </button>
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      {items.map((item, index) => {
                        // Safely handle item data
                        if (!item || !item.product) {
                          console.warn('Invalid cart item:', item);
                          return (
                            <div key={`invalid-${index}`} className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                              Invalid item - please clear cart
                            </div>
                          );
                        }
                        
                        // Extract product ID - try multiple sources
                        let pid = (item.product as any)._id || (item.product as any).id;
                        
                        // Fallback: extract from item.id (format: "productId-size-color")
                        if (!pid && item.id) {
                          const parts = item.id.split('-');
                          pid = parts[0];
                        }
                        
                        // Debug log if still no ID
                        if (!pid) {
                          console.error('Could not extract product ID from cart item:', item);
                        }
                        
                        const itemTotal = (item.product.price * item.quantity).toFixed(2);
                        return (
                        <div key={item.id} className="relative group bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-400 hover:shadow-lg transition-all duration-200">
                          {/* Product Image & Info */}
                          <div className="flex gap-3">
                            {pid ? (
                              <Link href={`/products/${pid}`} onClick={() => setIsCartOpen(false)} className="shrink-0">
                                <img 
                                  src={item.product.image || '/placeholder-product.png'} 
                                  alt={item.product.name} 
                                  className="w-20 h-20 object-cover rounded-lg border border-gray-100" 
                                />
                              </Link>
                            ) : (
                              <div className="shrink-0">
                                <img 
                                  src={item.product.image || '/placeholder-product.png'} 
                                  alt={item.product.name} 
                                  className="w-20 h-20 object-cover rounded-lg border border-gray-100" 
                                />
                              </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                              {/* Product Name */}
                              {pid ? (
                                <Link 
                                  href={`/products/${pid}`} 
                                  onClick={() => setIsCartOpen(false)} 
                                  className="block font-semibold text-sm text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 mb-2"
                                >
                                  {item.product.name}
                                </Link>
                              ) : (
                                <div className="block font-semibold text-sm text-gray-900 line-clamp-2 mb-2">
                                  {item.product.name}
                                </div>
                              )}
                              
                              {/* Price */}
                              <div className="text-sm text-gray-600 mb-2">
                                ${item.product.price} each
                              </div>
                              
                              {/* Quantity Controls */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} 
                                    className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-100 hover:border-gray-400 transition-all text-gray-600 font-semibold"
                                    aria-label="Decrease quantity"
                                  >
                                    -
                                  </button>
                                  <span className="text-sm font-semibold w-8 text-center">{item.quantity}</span>
                                  <button 
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                                    className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-100 hover:border-gray-400 transition-all text-gray-600 font-semibold"
                                    aria-label="Increase quantity"
                                  >
                                    +
                                  </button>
                                </div>
                                
                                {/* Item Total */}
                                <div className="text-sm font-bold text-gray-900">
                                  ${itemTotal}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Remove Button - Top Right */}
                          <button
                            onClick={() => removeItem(item.id)}
                            className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200 group-hover:opacity-100 opacity-0"
                            aria-label={`Remove ${item.product.name}`}
                            title="Remove item"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
              
              {isMounted && items.length > 0 && (
                <div className="border-t border-gray-200 p-4 bg-white">
                  {/* Subtotal & Item Count */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Items ({getTotalItems()})</span>
                      <span className="font-medium">${getTotalPrice().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Shipping</span>
                      <span className="text-green-600 font-medium">FREE</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-base font-semibold text-gray-900">Total</span>
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          ${getTotalPrice().toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Checkout Button */}
                  <Link
                    href="/checkout"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-center block font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transform flex items-center justify-center gap-2"
                    onClick={() => setIsCartOpen(false)}
                  >
                    <span>Proceed to Checkout</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  
                  {/* Continue Shopping Link */}
                  <Link
                    href="/products"
                    className="w-full mt-2 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-200 transition-all duration-200 text-center block text-sm font-medium"
                    onClick={() => setIsCartOpen(false)}
                  >
                    Continue Shopping
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

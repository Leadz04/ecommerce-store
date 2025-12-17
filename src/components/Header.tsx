"use client";

import { useState, useEffect, useRef, FormEvent } from 'react';
import Link from 'next/link';
import { ShoppingCart, Search, Menu, X, User, LogOut, Settings, Trash2, Shield, ChevronRight, Edit, ChevronDown, ChevronUp } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { companyInfo } from '@/data/companyInfo';
import { getProductUrl } from '@/lib/productUrl';

// Mobile Category Item Component
const MobileCategoryItem = ({ 
  title, 
  categories, 
  onSelect 
}: { 
  title: string; 
  categories: Record<string, string[]>; 
  onSelect: (subCat?: string, productType?: string) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  return (
    <>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-4 text-gray-900 hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium">{title}</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {isExpanded && (
        <div className="bg-gray-50">
          {Object.entries(categories).map(([subCat, items]) => (
            <div key={subCat}>
              <button
                onClick={() => {
                  if (items.length > 0) {
                    setExpandedSub(expandedSub === subCat ? null : subCat);
                  } else {
                    onSelect(subCat);
                  }
                }}
                className="w-full flex items-center justify-between px-8 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium">{subCat}</span>
                {items.length > 0 && (
                  expandedSub === subCat ? (
                    <ChevronUp className="h-3 w-3 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-gray-400" />
                  )
                )}
              </button>
              {expandedSub === subCat && items.length > 0 && (
                <div className="bg-white pl-12 pr-4 pb-2">
                  {items.map((item) => (
                    <button
                      key={item}
                      onClick={() => onSelect(subCat, item)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded"
                    >
                      {item}
                    </button>
                  ))}
                  <button
                    onClick={() => onSelect(subCat)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 font-medium hover:bg-gray-50 rounded"
                  >
                    View All
                  </button>
                </div>
              )}
            </div>
          ))}
          <button
            onClick={() => onSelect()}
            className="w-full text-left px-8 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-100 transition-colors border-t border-gray-200"
          >
            View All {title}
          </button>
        </div>
      )}
    </>
  );
};

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [hoveredNavItem, setHoveredNavItem] = useState<string | null>(null);
  const [expandedSubs, setExpandedSubs] = useState<Record<string, boolean>>({});
  const { items, getTotalItems, getTotalPrice, removeItem, updateQuantity } = useCartStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isProductsPage = pathname?.startsWith('/products');

  const categories = [
    { name: 'All', value: '', slug: '' },
    { name: 'Men', value: 'Men', slug: 'men' },
    { name: 'Women', value: 'Women', slug: 'women' },
    { name: 'Children', value: 'Children', slug: 'children' },
    { name: 'Wool', value: 'Wool', slug: 'wool' },
    { name: 'Office & Travel', value: 'Office & Travel', slug: 'office-travel' },
    { name: 'Accessories', value: 'Accessories', slug: 'accessories' },
    { name: 'Gifting', value: 'Gifting', slug: 'gifting' },
    { name: 'Footwear', value: 'Footwear', slug: 'footwear' },
  ];

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
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
        setHoveredNavItem(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Category structures matching brand-products page
  const menCategories = {
    'Tops': ['Sweatshirts', 'Polo Shirts', 'Casual Shirts', 'T-Shirts', 'Henleys', 'Button Down Shirts'],
    'Bottoms': ['Jeans', 'Shorts', 'Pants', 'Trousers'],
    'Sets': [],
    'Activewear': [],
    'Outerwear': ['Sweaters', 'Hoodies/Uppers', 'Jackets', 'Blazers/Coats'],
    'Accessories': ['Footwear', 'Bags', 'Belts', 'Socks']
  };

  const womenCategories = {
    'Tops': ['Sweatshirts', 'Polo Shirts', 'Casual Shirts', 'T-Shirts', 'Blouses', 'Button Down Shirts'],
    'Bottoms': ['Jeans', 'Shorts', 'Pants', 'Trousers', 'Skirts'],
    'Sets': [],
    'Activewear': [],
    'Outerwear': ['Sweaters', 'Hoodies/Uppers', 'Jackets', 'Blazers/Coats'],
    'Accessories': ['Footwear', 'Bags', 'Belts', 'Socks']
  };

  const kidsCategories = {
    'Boys': ['Sweatshirts', 'Sweaters', 'Uppers', 'Jackets', 'T-Shirts', 'Shirts', 'Jeans', 'Pants', 'Shorts', 'Trousers', 'Tracksuits', 'Shoes', 'Socks'],
    'Girls': ['Sweaters', 'Sweatshirts', 'Uppers', 'Jackets', 'Tops', 'Dresses', 'Suits', 'Denims', 'Pants', 'Tights', 'Shoes'],
    'Baby Boys': ['Sweatshirts', 'Sweaters', 'Jackets', 'Uppers', 'T-Shirts', 'Shirts', 'Jeans', 'Pants', 'Trousers', 'Shorts', 'Suits', 'Kurtas'],
    'Baby Girls': ['Sweatshirts', 'Jackets', 'Uppers', 'Sweaters', 'Tops', 'Dresses', 'Suits', 'Pants', 'Jeans', 'Tights', 'Shorts']
  };

  const toggleSub = (category: string, sub: string) => {
    const key = `${category}-${sub}`;
    setExpandedSubs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCategoryClick = (category: string, subCategory?: string, productType?: string) => {
    if (category === 'Sale') {
      router.push('/brand-products?onSale=true');
    } else if (category === 'New In') {
      router.push('/brand-products');
    } else {
      const params = new URLSearchParams();
      params.set('mainCategory', category);
      if (subCategory) {
        params.set('subCategory', subCategory);
      }
      if (productType) {
        params.set('productType', productType);
      }
      router.push(`/brand-products?${params.toString()}`);
    }
    setHoveredNavItem(null);
  };

  // Hover Dropdown Component for Categories
  const HoverDropdown = ({ 
    category, 
    categories 
  }: { 
    category: string; 
    categories: Record<string, string[]> 
  }) => {
    return (
      <div
        ref={megaMenuRef}
        className="absolute top-full left-0 mt-0 bg-white border border-gray-200 shadow-xl z-50 w-80"
        onMouseEnter={() => setHoveredNavItem(category)}
        onMouseLeave={() => setHoveredNavItem(null)}
      >
        <div className="py-4">
          {/* Category Header */}
          <div className="px-6 mb-4">
            <h3 className="font-bold text-lg text-gray-900">{category}</h3>
          </div>
          
          {/* Category List */}
          <div className="space-y-0">
            {Object.entries(categories).map(([subCat, items]) => {
              const key = `${category}-${subCat}`;
              const isExpanded = expandedSubs[key] || false;
              const hasItems = items.length > 0;
              
              return (
                <div key={subCat} className="border-b border-gray-100 last:border-0">
                  <div className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors">
                    <button
                      onClick={() => handleCategoryClick(category, subCat)}
                      className="flex-1 text-left"
                    >
                      <span className="font-semibold text-gray-900">{subCat}</span>
                    </button>
                    {hasItems && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSub(category, subCat);
                        }}
                        className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        )}
                      </button>
                    )}
                  </div>
                  
                  {isExpanded && hasItems && (
                    <div className="bg-gray-50 pl-6 pr-6 pb-2">
                      <div className="space-y-1 pt-1">
                        {items.map((item) => (
                          <button
                            key={item}
                            onClick={() => handleCategoryClick(category, subCat, item)}
                            className="w-full text-left px-3 py-2 hover:bg-white rounded text-sm text-gray-700 transition-colors"
                          >
                            {item}
                          </button>
                        ))}
                        <button
                          onClick={() => handleCategoryClick(category, subCat)}
                          className="w-full text-left px-3 py-2 hover:bg-white rounded text-sm text-gray-700 font-medium transition-colors"
                        >
                          View All
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* View All for entire category */}
            <div className="px-6 pt-2">
              <button
                onClick={() => handleCategoryClick(category)}
                className="w-full text-left py-2 text-sm font-semibold text-gray-900 hover:text-gray-700 transition-colors"
              >
                View All
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const previousOverflow = document.body.style.overflow;
    if (isMenuOpen || isCartOpen || isSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen, isCartOpen, isSearchOpen]);

  // Focus search input when search overlay opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isProductsPage) return;
    const currentSearch = searchParams?.get('search') || '';
    setHeaderSearch((prev) => (prev === currentSearch ? prev : currentSearch));
  }, [isProductsPage, searchParams]);

  const buildProductSearchURL = (term: string) => {
    const params = isProductsPage
      ? new URLSearchParams(searchParams?.toString())
      : new URLSearchParams();

    const trimmed = term.trim();

    if (trimmed) {
      params.set('search', trimmed);
      params.set('page', '1');
    } else {
      params.delete('search');
      params.delete('page');
    }

    const queryString = params.toString();
    return queryString ? `/products?${queryString}` : '/products';
  };

  const handleHeaderSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let targetUrl = buildProductSearchURL(headerSearch);
    
    // Add category filter if selected
    if (selectedCategory) {
      const categorySlug = categories.find(c => c.value === selectedCategory)?.slug;
      if (categorySlug) {
        targetUrl = `/categories/${categorySlug}?search=${encodeURIComponent(headerSearch)}`;
      } else {
        const params = new URLSearchParams();
        if (headerSearch) params.set('search', headerSearch);
        if (selectedCategory) params.set('category', selectedCategory);
        targetUrl = `/products?${params.toString()}`;
      }
    }
    
    setIsSearchOpen(false);
    router.push(targetUrl);
  };

  const handleSearchCategoryClick = (categoryValue: string) => {
    setSelectedCategory(categoryValue);
    const categorySlug = categories.find(c => c.value === categoryValue)?.slug;
    
    if (categoryValue && categorySlug) {
      // Navigate to category page with search if provided
      const url = `/categories/${categorySlug}${headerSearch ? `?search=${encodeURIComponent(headerSearch)}` : ''}`;
      setIsSearchOpen(false);
      router.push(url);
    } else if (headerSearch) {
      // Navigate to products page with search
      const url = `/products?search=${encodeURIComponent(headerSearch)}`;
      setIsSearchOpen(false);
      router.push(url);
    } else {
      // Just navigate to products page
      setIsSearchOpen(false);
      router.push('/products');
    }
  };

  const handleHeaderSearchClear = () => {
    if (!headerSearch) return;
    setHeaderSearch('');
    setSelectedCategory('');

    if (isProductsPage) {
      const targetUrl = buildProductSearchURL('');
      router.push(targetUrl, { scroll: false });
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo + Navigation */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link href="/" className="text-lg font-medium text-gray-900 hover:text-gray-700 transition-colors">
              {companyInfo.name}
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8 relative">
              {/* Sale Button */}
              <button
                onClick={() => handleCategoryClick('Sale')}
                className="text-red-600 font-semibold hover:text-red-700 transition-colors text-sm"
              >
                Sale
              </button>
              
              {/* New In Button */}
              <button
                onClick={() => handleCategoryClick('New In')}
                className="text-gray-900 font-medium hover:text-gray-700 transition-colors text-sm"
              >
                New In
              </button>
              
              {/* Men with Hover Dropdown */}
              <div 
                className="relative h-full flex items-center"
                onMouseEnter={() => setHoveredNavItem('Men')}
                onMouseLeave={() => setHoveredNavItem(null)}
              >
                <button className="text-gray-900 font-medium hover:text-gray-700 transition-colors text-sm py-2">
                  Men
                </button>
                {hoveredNavItem === 'Men' && (
                  <HoverDropdown category="Men" categories={menCategories} />
                )}
              </div>

              {/* Women with Hover Dropdown */}
              <div 
                className="relative h-full flex items-center"
                onMouseEnter={() => setHoveredNavItem('Women')}
                onMouseLeave={() => setHoveredNavItem(null)}
              >
                <button className="text-gray-900 font-medium hover:text-gray-700 transition-colors text-sm py-2">
                  Women
                </button>
                {hoveredNavItem === 'Women' && (
                  <HoverDropdown category="Women" categories={womenCategories} />
                )}
              </div>

              {/* Kids with Hover Dropdown */}
              <div 
                className="relative h-full flex items-center"
                onMouseEnter={() => setHoveredNavItem('Kids')}
                onMouseLeave={() => setHoveredNavItem(null)}
              >
                <button className="text-gray-900 font-medium hover:text-gray-700 transition-colors text-sm py-2">
                  Kids
                </button>
                {hoveredNavItem === 'Kids' && (
                  <HoverDropdown category="Kids" categories={kidsCategories} />
                )}
              </div>
            </nav>
          </div>

          {/* Right side icons */}
          <div className="flex items-center gap-4">
            {/* Search Icon */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* User Account */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <User className="h-5 w-5" />
                </button>
                
                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 py-1 z-50">
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
              <Link
                href="/login"
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Sign in"
              >
                <User className="h-5 w-5" />
              </Link>
            )}

            {/* Shopping Cart */}
            <button
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {isMounted && getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Open menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Search Overlay */}
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 bg-white" role="dialog" aria-modal="true">
            <div className="h-full flex flex-col">
              {/* Header with search input */}
              <div className="border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-medium text-gray-900">Search Products</h2>
                    <button
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSelectedCategory('');
                        setHeaderSearch('');
                      }}
                      className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
                      aria-label="Close search"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <form
                    onSubmit={handleHeaderSearchSubmit}
                    className="relative"
                    role="search"
                    aria-label="Product search"
                  >
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search products..."
                      value={headerSearch}
                      onChange={(e) => setHeaderSearch(e.target.value)}
                      className="block w-full pl-12 pr-12 py-3.5 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all bg-gray-50 focus:bg-white"
                    />
                    {headerSearch && (
                      <button
                        type="button"
                        onClick={handleHeaderSearchClear}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-700 transition-colors"
                        aria-label="Clear search"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </form>
                </div>
              </div>

              {/* Content area with filters */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="max-w-4xl mx-auto">
                  {/* Category Filters */}
                  <div className="mb-8">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                      Filter by Category
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {categories.map((category) => (
                        <button
                          key={category.value}
                          onClick={() => handleSearchCategoryClick(category.value)}
                          className={`px-4 py-3 text-sm font-medium rounded-lg border-2 transition-all ${
                            selectedCategory === category.value
                              ? 'border-gray-900 bg-gray-900 text-white'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Links */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                      Quick Links
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {categories.slice(1).map((category) => (
                        <Link
                          key={category.slug}
                          href={`/categories/${category.slug}`}
                          onClick={() => setIsSearchOpen(false)}
                          className="px-4 py-3 text-sm text-gray-700 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all"
                        >
                          Browse {category.name}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Search Tips */}
                  {!headerSearch && (
                    <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                      Search Tips
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start">
                        <span className="text-gray-400 mr-2">•</span>
                        <span>Use keywords like product name, material, or style</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-gray-400 mr-2">•</span>
                        <span>Select a category to filter your search results</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-gray-400 mr-2">•</span>
                        <span>Press Enter or click a category to search</span>
                      </li>
                    </ul>
                  </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-white" role="dialog" aria-modal="true">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
                <span className="font-medium text-gray-900">Menu</span>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto">
                <ul className="divide-y divide-gray-200">
                  {/* Sale */}
                  <li>
                    <button
                      onClick={() => {
                        handleCategoryClick('Sale');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-4 text-red-600 font-semibold hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm">Sale</span>
                    </button>
                  </li>
                  
                  {/* New In */}
                  <li>
                    <button
                      onClick={() => {
                        handleCategoryClick('New In');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-4 text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm font-medium">New In</span>
                    </button>
                  </li>
                  
                  {/* Men */}
                  <li>
                    <MobileCategoryItem
                      title="Men"
                      categories={menCategories}
                      onSelect={(subCat, productType) => {
                        handleCategoryClick('Men', subCat, productType);
                        setIsMenuOpen(false);
                      }}
                    />
                  </li>
                  
                  {/* Women */}
                  <li>
                    <MobileCategoryItem
                      title="Women"
                      categories={womenCategories}
                      onSelect={(subCat, productType) => {
                        handleCategoryClick('Women', subCat, productType);
                        setIsMenuOpen(false);
                      }}
                    />
                  </li>
                  
                  {/* Kids */}
                  <li>
                    <MobileCategoryItem
                      title="Kids"
                      categories={kidsCategories}
                      onSelect={(subCat, productType) => {
                        handleCategoryClick('Kids', subCat, productType);
                        setIsMenuOpen(false);
                      }}
                    />
                  </li>
                </ul>
              </nav>
              <div className="px-4 py-4 border-t border-gray-200">
                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Sign Out
                  </button>
                ) : (
                  <Link 
                    href="/login" 
                    onClick={() => setIsMenuOpen(false)} 
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      {isCartOpen && (
        <>
          {/* Mobile Cart */}
          <div className="md:hidden fixed inset-0 z-50 bg-white flex flex-col" role="dialog" aria-modal="true">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 shrink-0">
              <span className="font-medium text-gray-900">
                Cart ({getTotalItems()})
              </span>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Close cart"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
              
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
                  {!isMounted ? (
                    <p className="text-gray-500 text-center py-8">Loading...</p>
                  ) : items.length === 0 ? (
                    <div className="text-center py-16">
                      <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2 font-medium">Your cart is empty</p>
                      <p className="text-gray-500 text-sm mb-6">Looks like you haven't added anything to your cart yet.</p>
                      <Link
                        href="/products"
                        onClick={() => setIsCartOpen(false)}
                        className="inline-block px-6 py-2.5 bg-gray-900 text-white hover:bg-gray-800 transition-colors text-sm font-medium"
                      >
                        Continue Shopping
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {items.map((item) => {
                        const productUrl = getProductUrl(item.product as any);
                        const totalPrice = item.product.price * item.quantity;
                        const hasDiscount = item.product.originalPrice && item.product.originalPrice > item.product.price;
                        return (
                          <div key={item.id} className="flex gap-3 pb-4 border-b border-gray-200 last:border-b-0">
                            {/* Product Image */}
                            <Link href={productUrl} onClick={() => setIsCartOpen(false)} className="shrink-0">
                              <img 
                                src={item.product.image} 
                                alt={item.product.name} 
                                className="w-20 h-20 object-cover rounded-lg border border-gray-200" 
                              />
                            </Link>
                            
                            {/* Product Details */}
                            <div className="flex-1 min-w-0">
                              <Link 
                                href={productUrl} 
                                onClick={() => setIsCartOpen(false)}
                                className="block font-semibold text-gray-900 hover:text-blue-600 mb-1 text-sm line-clamp-2"
                              >
                                {item.product.name}
                              </Link>
                              
                              {/* Size and Color (if available) */}
                              <div className="flex flex-wrap gap-2 mb-2">
                                {(item as any).size && (
                                  <p className="text-xs text-gray-600">Size: <span className="font-medium">{(item as any).size}</span></p>
                                )}
                                {(item as any).color && (
                                  <p className="text-xs text-gray-600">Color: <span className="font-medium">{(item as any).color}</span></p>
                                )}
                              </div>
                              
                              {/* Price */}
                              <div className="mb-3">
                                {hasDiscount ? (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-red-600 font-bold text-base">
                                      ${item.product.price.toFixed(2)}
                                    </span>
                                    <span className="text-gray-400 line-through text-sm">
                                      ${item.product.originalPrice?.toFixed(2)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-gray-900 font-bold text-base">
                                    ${item.product.price.toFixed(2)}
                                  </span>
                                )}
                              </div>
                              
                              {/* Quantity Selector */}
                              <div className="flex items-center gap-2 mb-2">
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
                              
                              {/* Item Total */}
                              <p className="text-sm text-gray-600">
                                Total: <span className="font-semibold text-gray-900">${totalPrice.toFixed(2)}</span>
                              </p>
                            </div>
                            
                            {/* Action Icons */}
                            <div className="flex flex-col gap-2 shrink-0">
                              <Link
                                href={`/products/${pid}`}
                                onClick={() => setIsCartOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded transition-colors inline-block"
                                aria-label="Edit item"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4 text-gray-600" />
                              </Link>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="p-2 hover:bg-red-50 rounded transition-colors"
                                aria-label={`Remove ${item.product.name}`}
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
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
              <div className="border-t border-gray-200 px-4 py-4 bg-white shrink-0 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">Subtotal</span>
                  <span className="text-lg font-medium text-gray-900">${getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="space-y-2">
                  <Link
                    href="/cart"
                    className="w-full py-3 px-4 border border-gray-900 text-gray-900 text-sm font-medium text-center block hover:bg-gray-50 transition-colors"
                    onClick={() => setIsCartOpen(false)}
                  >
                    View Cart
                  </Link>
                  <Link
                    href="/checkout"
                    className="w-full py-3 px-4 bg-gray-900 text-white text-sm font-medium text-center block hover:bg-gray-800 transition-colors"
                    onClick={() => setIsCartOpen(false)}
                  >
                    Checkout
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Cart - right sidebar */}
          <div className="hidden md:flex fixed inset-0 z-50 justify-end" role="dialog" aria-modal="true">
            <div
              className="absolute inset-0 bg-black/20"
              onClick={() => setIsCartOpen(false)}
              aria-hidden="true"
            />
            <div className="relative h-screen w-96 bg-white border-l border-gray-200 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
                <h2 className="text-sm font-medium text-gray-900">
                  Cart ({getTotalItems()})
                </h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  aria-label="Close cart"
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                  {!isMounted ? (
                    <p className="text-gray-500 text-center py-8">Loading...</p>
                  ) : items.length === 0 ? (
                    <div className="text-center py-16">
                      <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-sm text-gray-500 mb-4">Your cart is empty</p>
                      <Link
                        href="/products"
                        onClick={() => setIsCartOpen(false)}
                        className="inline-block px-6 py-2 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
                      >
                        Continue Shopping
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {items.map((item) => {
                        const productUrl = getProductUrl(item.product as any);
                        const totalPrice = item.product.price * item.quantity;
                        const hasDiscount = item.product.originalPrice && item.product.originalPrice > item.product.price;
                        return (
                          <div key={item.id} className="flex gap-3 pb-6 border-b border-gray-200 last:border-b-0">
                            {/* Product Image */}
                            <Link href={productUrl} onClick={() => setIsCartOpen(false)} className="shrink-0">
                              <img 
                                src={item.product.image} 
                                alt={item.product.name} 
                                className="w-20 h-20 object-cover rounded border border-gray-200" 
                              />
                            </Link>
                            
                            {/* Product Details */}
                            <div className="flex-1 min-w-0">
                              <Link 
                                href={productUrl} 
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
                                href={productUrl}
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
                <div className="border-t border-gray-200 px-6 py-5 bg-white shrink-0">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium text-gray-900">Subtotal</span>
                    <span className="text-lg font-medium text-gray-900">${getTotalPrice().toFixed(2)}</span>
                  </div>
                  <div className="space-y-3">
                    <Link
                      href="/cart"
                      className="w-full py-3 px-4 border border-gray-900 text-gray-900 text-sm font-medium text-center block hover:bg-gray-50 transition-colors"
                      onClick={() => setIsCartOpen(false)}
                    >
                      View Cart
                    </Link>
                    <Link
                      href="/checkout"
                      className="w-full py-3 px-4 bg-gray-900 text-white text-sm font-medium text-center block hover:bg-gray-800 transition-colors"
                      onClick={() => setIsCartOpen(false)}
                    >
                      Checkout
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}

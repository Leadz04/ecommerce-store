"use client";

import { useState, useEffect, useRef, FormEvent } from 'react';
import Link from 'next/link';
import { ShoppingCart, Search, Menu, X, User, LogOut, Settings, Trash2, Shield, ChevronRight, Edit } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { companyInfo } from '@/data/companyInfo';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [hoveredNavItem, setHoveredNavItem] = useState<string | null>(null);
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

  const navigation = [
    { name: 'Products', href: '/products', hasMegaMenu: false },
    { name: 'Men', href: '/categories/men', hasMegaMenu: true },
    { name: 'Women', href: '/categories/women', hasMegaMenu: true },
    { name: 'Children', href: '/categories/children', hasMegaMenu: true },
    { name: 'Wool', href: '/categories/wool', hasMegaMenu: true },
    { name: 'Footwear', href: '/categories/footwear', hasMegaMenu: true },
    { name: 'Gifts', href: '/categories/gifting', hasMegaMenu: true },
    { name: 'Accessories', href: '/categories/accessories', hasMegaMenu: true },
    { name: 'Help', href: '/help', hasMegaMenu: true },
  ];

  // Mega-menu data structure
  const megaMenuData: Record<string, { columns: { title: string; items: { name: string; href: string }[] }[] }> = {
    'Men': {
      columns: [
        {
          title: 'Jackets & Coats',
          items: [
            { name: 'View All', href: '/categories/men' },
            { name: 'Leather Jackets', href: '/categories/men?search=leather+jacket' },
            { name: 'Bomber Jackets', href: '/categories/men?search=bomber+jacket' },
            { name: 'Wool Coats', href: '/categories/men?search=wool+coat' },
            { name: 'Trucker Jackets', href: '/categories/men?search=trucker+jacket' },
            { name: 'Blazers', href: '/categories/men?search=blazer' },
          ]
        },
        {
          title: 'Colors',
          items: [
            { name: 'Black', href: '/categories/men?search=black' },
            { name: 'Brown', href: '/categories/men?search=brown' },
            { name: 'Blue', href: '/categories/men?search=blue' },
            { name: 'Beige', href: '/categories/men?search=beige' },
            { name: 'Green', href: '/categories/men?search=green' },
            { name: 'Red', href: '/categories/men?search=red' },
          ]
        },
        {
          title: 'Clothing & Accessories',
          items: [
            { name: 'T-Shirts', href: '/categories/men?search=t-shirt' },
            { name: 'Gloves', href: '/categories/men?search=gloves' },
            { name: 'Belts', href: '/categories/men?search=belt' },
            { name: 'Wallets', href: '/categories/men?search=wallet' },
            { name: 'Bags', href: '/categories/men?search=bag' },
          ]
        }
      ]
    },
    'Women': {
      columns: [
        {
          title: 'Jackets & Coat',
          items: [
            { name: 'All Collection', href: '/categories/women' },
            { name: 'Leather Jackets', href: '/categories/women?search=leather+jacket' },
            { name: 'Black Jackets', href: '/categories/women?search=black+jacket' },
            { name: 'Brown Jackets', href: '/categories/women?search=brown+jacket' },
            { name: 'Biker Style Jacket', href: '/categories/women?search=biker+jacket' },
            { name: 'Red Jackets', href: '/categories/women?search=red+jacket' },
            { name: 'Hooded Jackets', href: '/categories/women?search=hooded+jacket' },
            { name: 'Leather Blazer', href: '/categories/women?search=leather+blazer' },
            { name: 'Leather Coats', href: '/categories/women?search=leather+coat' },
            { name: 'Shearling Fur Jackets', href: '/categories/women?search=shearling+jacket' },
            { name: 'Wool Coats', href: '/categories/women?search=wool+coat' },
            { name: 'Quilted Jackets', href: '/categories/women?search=quilted+jacket' },
          ]
        },
        {
          title: 'Styles & Fit',
          items: [
            { name: 'Cropped Jackets', href: '/categories/women?search=cropped+jacket' },
            { name: 'Petite Jackets', href: '/categories/women?search=petite+jacket' },
            { name: 'Tall Leather Jackets', href: '/categories/women?search=tall+leather+jacket' },
            { name: 'Motorcycle', href: '/categories/women?search=motorcycle+jacket' },
            { name: 'Bomber', href: '/categories/women?search=bomber+jacket' },
            { name: 'Blazer', href: '/categories/women?search=blazer' },
            { name: 'Peplum', href: '/categories/women?search=peplum' },
            { name: 'Hooded', href: '/categories/women?search=hooded' },
          ]
        },
        {
          title: 'Color',
          items: [
            { name: 'Black', href: '/categories/women?search=black' },
            { name: 'Brown', href: '/categories/women?search=brown' },
            { name: 'Red', href: '/categories/women?search=red' },
            { name: 'Green', href: '/categories/women?search=green' },
            { name: 'Beige', href: '/categories/women?search=beige' },
            { name: 'Blue', href: '/categories/women?search=blue' },
            { name: 'Pink', href: '/categories/women?search=pink' },
            { name: 'Purple', href: '/categories/women?search=purple' },
          ]
        },
        {
          title: 'Clothing',
          items: [
            { name: 'Varsity Jacket', href: '/categories/women?search=varsity+jacket' },
            { name: 'Puffer Jacket', href: '/categories/women?search=puffer+jacket' },
            { name: "Women's T-Shirts", href: '/categories/women?search=t-shirt' },
          ]
        }
      ]
    },
    'Children': {
      columns: [
        {
          title: 'Clothing',
          items: [
            { name: 'View All', href: '/categories/children' },
            { name: 'Jackets', href: '/categories/children?search=jacket' },
            { name: 'Coats', href: '/categories/children?search=coat' },
            { name: 'T-Shirts', href: '/categories/children?search=t-shirt' },
          ]
        },
        {
          title: 'Accessories',
          items: [
            { name: 'Bags', href: '/categories/children?search=bag' },
            { name: 'Gloves', href: '/categories/children?search=gloves' },
            { name: 'Hats', href: '/categories/children?search=hat' },
          ]
        },
        {
          title: 'By Age',
          items: [
            { name: 'Toddler', href: '/categories/children?search=toddler' },
            { name: 'Kids', href: '/categories/children?search=kids' },
            { name: 'Teens', href: '/categories/children?search=teens' },
          ]
        }
      ]
    },
    'Gifts': {
      columns: [
        {
          title: 'Gift Categories',
          items: [
            { name: 'View All', href: '/categories/gifting' },
            { name: 'Gift Sets', href: '/categories/gifting?search=gift+set' },
            { name: 'Personalized', href: '/categories/gifting?search=personalized' },
            { name: 'Luxury Gifts', href: '/categories/gifting?search=luxury' },
          ]
        },
        {
          title: 'Occasions',
          items: [
            { name: 'Birthday', href: '/categories/gifting?search=birthday' },
            { name: 'Anniversary', href: '/categories/gifting?search=anniversary' },
            { name: 'Wedding', href: '/categories/gifting?search=wedding' },
            { name: 'Holiday', href: '/categories/gifting?search=holiday' },
          ]
        },
        {
          title: 'Price Range',
          items: [
            { name: 'Under $50', href: '/categories/gifting?maxPrice=50' },
            { name: '$50 - $100', href: '/categories/gifting?minPrice=50&maxPrice=100' },
            { name: '$100 - $200', href: '/categories/gifting?minPrice=100&maxPrice=200' },
            { name: 'Over $200', href: '/categories/gifting?minPrice=200' },
          ]
        }
      ]
    },
    'Accessories': {
      columns: [
        {
          title: 'Bags & Luggage',
          items: [
            { name: 'View All', href: '/categories/accessories' },
            { name: 'Handbags', href: '/categories/accessories?search=handbag' },
            { name: 'Backpacks', href: '/categories/accessories?search=backpack' },
            { name: 'Briefcases', href: '/categories/accessories?search=briefcase' },
            { name: 'Travel Bags', href: '/categories/accessories?search=travel' },
          ]
        },
        {
          title: 'Leather Goods',
          items: [
            { name: 'Wallets', href: '/categories/accessories?search=wallet' },
            { name: 'Belts', href: '/categories/accessories?search=belt' },
            { name: 'Gloves', href: '/categories/accessories?search=gloves' },
            { name: 'Phone Cases', href: '/categories/accessories?search=phone+case' },
          ]
        },
        {
          title: 'Other',
          items: [
            { name: 'Watches', href: '/categories/accessories?search=watch' },
            { name: 'Jewelry', href: '/categories/accessories?search=jewelry' },
            { name: 'Sunglasses', href: '/categories/accessories?search=sunglasses' },
          ]
        }
      ]
    },
    'Wool': {
      columns: [
        {
          title: 'Wool Coats',
          items: [
            { name: 'View All', href: '/categories/wool' },
            { name: 'Men Wool Coats', href: '/categories/wool?subcategory=men' },
            { name: 'Women Wool Coats', href: '/categories/wool?subcategory=women' },
          ]
        },
        {
          title: 'By Category',
          items: [
            { name: 'All Wool Products', href: '/categories/wool?search=wool' },
            { name: 'Wool Jackets', href: '/categories/wool?search=wool+jacket' },
            { name: 'Wool Coats', href: '/categories/wool?search=wool+coat' },
            { name: 'Wool Blazers', href: '/categories/wool?search=wool+blazer' },
          ]
        },
        {
          title: 'Shop By Gender',
          items: [
            { name: 'Men\'s Collection', href: '/categories/men?search=wool' },
            { name: 'Women\'s Collection', href: '/categories/women?search=wool' },
          ]
        }
      ]
    },
    'Help': {
      columns: [
        {
          title: 'Support & Policies',
          items: [
            { name: 'Customer Care Station', href: '/support' },
            { name: 'Shipping Policy', href: '/shipping' },
            { name: 'Return and Exchange', href: '/refund' },
            { name: 'Sizing Guide', href: '/size-guide' },
            { name: 'Track Your Order', href: '/orders' },
            { name: 'Start a Return', href: '/refund' },
            { name: 'Contact Us', href: '/contact' },
          ]
        },
        {
          title: 'Buying Guides',
          items: [
            { name: 'Celebrities & Leather Jacket', href: '/support/knowledge-base/celebrities-leather-jacket' },
            { name: 'What is Italian Leather?', href: '/support/knowledge-base/italian-leather' },
            { name: 'Myths about Leather Jackets', href: '/support/knowledge-base/leather-jacket-myths' },
            { name: 'Shopping Online vs Offline', href: '/support/knowledge-base/online-vs-offline' },
            { name: 'Lambskin vs Cowhide Leather', href: '/support/knowledge-base/lambskin-vs-cowhide' },
            { name: 'Why a $200 Leather Jacket?', href: '/support/knowledge-base/200-dollar-jacket' },
            { name: 'Keanu Reeves Leather Jacket', href: '/support/knowledge-base/keanu-reeves-jacket' },
            { name: 'Nvidia CEO & Leather Jacket', href: '/support/knowledge-base/nvidia-ceo-jacket' },
            { name: 'Sustainable Leather Jacket', href: '/support/knowledge-base/sustainable-leather' },
            { name: 'Wilsons vs Angel Jackets', href: '/support/knowledge-base/wilsons-vs-angel' },
            { name: 'Faux Leather vs Real Leather', href: '/support/knowledge-base/faux-vs-real-leather' },
            { name: "Beckham's Leather Story", href: '/support/knowledge-base/beckham-leather' },
            { name: 'Angel Jackets vs Ralph Lauren', href: '/support/knowledge-base/angel-vs-ralph-lauren' },
            { name: 'Angel Jackets vs Banana Republic', href: '/support/knowledge-base/angel-vs-banana-republic' },
            { name: 'Angel Jackets vs Mango', href: '/support/knowledge-base/angel-vs-mango' },
          ]
        },
        {
          title: "How To's",
          items: [
            { name: 'How to Care Leather Jacket', href: '/support/knowledge-base/care-leather-jacket' },
            { name: 'Remove Wrinkles from Leather', href: '/support/knowledge-base/remove-wrinkles-leather' },
            { name: 'How to Care Letterman', href: '/support/knowledge-base/care-letterman' },
            { name: 'How to Care Suede Leather', href: '/support/knowledge-base/care-suede-leather' },
            { name: 'How to Identify Real Leather', href: '/support/knowledge-base/identify-real-leather' },
            { name: 'How to Care Faux Leather', href: '/support/knowledge-base/care-faux-leather' },
            { name: 'Remove Smell from Leather', href: '/support/knowledge-base/remove-smell-leather' },
            { name: 'How To Care Leather Skirt', href: '/support/knowledge-base/care-leather-skirt' },
          ]
        }
      ]
    }
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

  const handleCategoryClick = (categoryValue: string) => {
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
            <nav className="hidden md:flex items-center gap-6 relative">
              {navigation.map((item) => (
                <div
                  key={item.name}
                  className="relative"
                  onMouseEnter={() => item.hasMegaMenu && setHoveredNavItem(item.name)}
                  onMouseLeave={() => setHoveredNavItem(null)}
                >
                  <Link
                    href={item.href}
                    className={`text-sm text-gray-600 hover:text-gray-900 transition-colors ${
                      hoveredNavItem === item.name ? 'text-gray-900' : ''
                    }`}
                  >
                    {item.name}
                  </Link>
                  
                  {/* Mega Menu */}
                  {item.hasMegaMenu && hoveredNavItem === item.name && megaMenuData[item.name] && (
                    <div
                      ref={megaMenuRef}
                      className="absolute left-1/2 top-full mt-0 w-screen max-w-5xl bg-white border-t border-gray-200 shadow-lg z-50"
                      style={{ transform: 'translateX(-50%)' }}
                      onMouseEnter={() => setHoveredNavItem(item.name)}
                      onMouseLeave={() => setHoveredNavItem(null)}
                    >
                      <div className="max-w-7xl mx-auto px-6 py-8">
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 uppercase">{item.name}</h3>
                        <div className={`grid gap-8 ${megaMenuData[item.name].columns.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
                          {megaMenuData[item.name].columns.map((column, colIndex) => (
                            <div key={colIndex}>
                              <h4 className="text-sm font-bold text-gray-900 uppercase mb-4 border-b border-gray-300 pb-2">
                                {column.title}
                              </h4>
                              <ul className="space-y-2">
                                {column.items.map((subItem, itemIndex) => (
                                  <li key={itemIndex}>
                                    <Link
                                      href={subItem.href}
                                      className="text-sm text-gray-700 hover:text-gray-900 transition-colors flex items-center group"
                                      onClick={() => setHoveredNavItem(null)}
                                    >
                                      <span className="mr-2 text-gray-400 group-hover:text-gray-600">›</span>
                                      {subItem.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
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
                          onClick={() => handleCategoryClick(category.value)}
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
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="flex items-center justify-between px-4 py-4 text-gray-900 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span className="text-sm">{item.name}</span>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </Link>
                    </li>
                  ))}
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
                        const pid = (item.product as any)._id || (item.product as any).id;
                        const totalPrice = item.product.price * item.quantity;
                        const hasDiscount = item.product.originalPrice && item.product.originalPrice > item.product.price;
                        return (
                          <div key={item.id} className="flex gap-3 pb-4 border-b border-gray-200 last:border-b-0">
                            {/* Product Image */}
                            <Link href={`/products/${pid}`} onClick={() => setIsCartOpen(false)} className="shrink-0">
                              <img 
                                src={item.product.image} 
                                alt={item.product.name} 
                                className="w-20 h-20 object-cover rounded-lg border border-gray-200" 
                              />
                            </Link>
                            
                            {/* Product Details */}
                            <div className="flex-1 min-w-0">
                              <Link 
                                href={`/products/${pid}`} 
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

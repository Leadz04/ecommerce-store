'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CategoryNavigationProps {
  onCategorySelect?: (category: string, subCategory?: string) => void;
  onClose?: () => void;
}

export default function CategoryNavigation({ onCategorySelect, onClose }: CategoryNavigationProps) {
  const router = useRouter();
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleCategoryClick = (category: string, subCategory?: string) => {
    if (onCategorySelect) {
      onCategorySelect(category, subCategory);
    } else {
      // Default behavior: navigate to filtered page
      const params = new URLSearchParams();
      params.set('mainCategory', category);
      if (subCategory) {
        params.set('subCategory', subCategory);
      }
      router.push(`/brand-products?${params.toString()}`);
    }
    if (onClose) onClose();
  };

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

  const CategoryDropdown = ({ 
    title, 
    categories 
  }: { 
    title: string; 
    categories: Record<string, string[]> 
  }) => {
    const isExpanded = expandedCategories[title] || false;

    return (
      <div className="py-2">
        <button
          onClick={() => toggleCategory(title)}
          className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 rounded transition-colors"
        >
          <span className="font-semibold text-gray-900">{title}</span>
          {Object.keys(categories).length > 0 && (
            isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )
          )}
        </button>

        {isExpanded && Object.keys(categories).length > 0 && (
          <div className="pl-4 mt-1 space-y-1">
            {Object.entries(categories).map(([subCat, items]) => (
              <div key={subCat} className="py-1">
                <button
                  onClick={() => handleCategoryClick(title, subCat)}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 rounded text-sm text-gray-700"
                >
                  <span className="font-medium">{subCat}</span>
                  {items.length > 0 && (
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  )}
                </button>
                {items.length > 0 && (
                  <div className="pl-4 mt-1 space-y-0.5">
                    {items.map((item) => (
                      <button
                        key={item}
                        onClick={() => handleCategoryClick(title, item)}
                        className="w-full text-left px-3 py-1 hover:bg-gray-50 rounded text-sm text-gray-600"
                      >
                        {item}
                      </button>
                    ))}
                    <button
                      onClick={() => handleCategoryClick(title, subCat)}
                      className="w-full text-left px-3 py-1 hover:bg-gray-50 rounded text-sm text-gray-600 font-medium"
                    >
                      View All
                    </button>
                  </div>
                )}
              </div>
            ))}
            <button
              onClick={() => handleCategoryClick(title)}
              className="w-full text-left px-3 py-1.5 hover:bg-gray-50 rounded text-sm text-gray-700 font-medium mt-2"
            >
              View All
            </button>
          </div>
        )}
      </div>
    );
  };

  const HoverDropdown = ({ 
    category, 
    categories 
  }: { 
    category: string; 
    categories: Record<string, string[]> 
  }) => {
    // All sections collapsed by default
    const [expandedSubs, setExpandedSubs] = useState<Record<string, boolean>>({});

    const toggleSub = (sub: string) => {
      setExpandedSubs(prev => ({ ...prev, [sub]: !prev[sub] }));
    };

    return (
      <div
        className="absolute top-full left-0 mt-0 bg-white border border-gray-200 shadow-xl z-50 w-80"
        onMouseEnter={() => setHoveredCategory(category)}
        onMouseLeave={() => setHoveredCategory(null)}
      >
        <div className="py-4">
          {/* Category Header */}
          <div className="px-6 mb-4">
            <h3 className="font-bold text-lg text-gray-900">{category}</h3>
          </div>
          
          {/* Category List */}
          <div className="space-y-0">
            {Object.entries(categories).map(([subCat, items]) => {
              const isExpanded = expandedSubs[subCat] || false;
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
                          toggleSub(subCat);
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
                            onClick={() => handleCategoryClick(category, item)}
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

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Main Navigation */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => handleCategoryClick('Sale')}
              className="text-red-600 font-semibold hover:text-red-700 transition-colors text-sm"
            >
              Sale
            </button>
            <button
              onClick={() => handleCategoryClick('New In')}
              className="text-gray-900 font-medium hover:text-gray-700 transition-colors text-sm"
            >
              New In
            </button>
            
            {/* Men with Hover Dropdown */}
            <div 
              className="relative h-full flex items-center"
              onMouseEnter={() => setHoveredCategory('Men')}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <button className="text-gray-900 font-medium hover:text-gray-700 transition-colors text-sm py-2">
                Men
              </button>
              {hoveredCategory === 'Men' && (
                <HoverDropdown category="Men" categories={menCategories} />
              )}
            </div>

            {/* Women with Hover Dropdown */}
            <div 
              className="relative h-full flex items-center"
              onMouseEnter={() => setHoveredCategory('Women')}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <button className="text-gray-900 font-medium hover:text-gray-700 transition-colors text-sm py-2">
                Women
              </button>
              {hoveredCategory === 'Women' && (
                <HoverDropdown category="Women" categories={womenCategories} />
              )}
            </div>

            {/* Kids with Hover Dropdown */}
            <div 
              className="relative h-full flex items-center"
              onMouseEnter={() => setHoveredCategory('Kids')}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <button className="text-gray-900 font-medium hover:text-gray-700 transition-colors text-sm py-2">
                Kids
              </button>
              {hoveredCategory === 'Kids' && (
                <HoverDropdown category="Kids" categories={kidsCategories} />
              )}
            </div>
          </div>

          {/* Close Button (if in modal) */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}


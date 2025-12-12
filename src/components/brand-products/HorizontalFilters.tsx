'use client';

import { useState } from 'react';
import { ChevronDown, X, Filter } from 'lucide-react';

interface Facets {
  categories: Record<string, number>;
  subCategories: Record<string, number>;
  productTypes: Record<string, number>;
  brands: Record<string, number>;
  vendors: Record<string, number>;
  tags: Record<string, number>;
  priceRange: {
    min: number;
    max: number;
    avg: number;
  };
}

interface HorizontalFiltersProps {
  facets: Facets;
  filters: {
    mainCategory?: string;
    category?: string;
    subCategory?: string;
    productType?: string;
    brand?: string;
    vendor?: string;
    minPrice?: string;
    maxPrice?: string;
    tags?: string[];
    inStock?: boolean;
    onSale?: boolean;
  };
  onFilterChange: (key: string, value: string | string[] | boolean) => void;
  loading: boolean;
}

export default function HorizontalFilters({ facets, filters, onFilterChange, loading }: HorizontalFiltersProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const hasActiveFilters = !!(
    filters.mainCategory ||
    filters.category ||
    filters.subCategory ||
    filters.productType ||
    filters.brand ||
    filters.vendor ||
    filters.minPrice ||
    filters.maxPrice ||
    (filters.tags && filters.tags.length > 0) ||
    filters.inStock ||
    filters.onSale
  );

  const clearAllFilters = () => {
    onFilterChange('mainCategory', '');
    onFilterChange('category', '');
    onFilterChange('subCategory', '');
    onFilterChange('productType', '');
    onFilterChange('brand', '');
    onFilterChange('vendor', '');
    onFilterChange('minPrice', '');
    onFilterChange('maxPrice', '');
    onFilterChange('tags', []);
    onFilterChange('inStock', false);
    onFilterChange('onSale', false);
  };

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const SimpleDropdown = ({ 
    label, 
    value, 
    options, 
    filterKey,
    placeholder = "All"
  }: { 
    label: string; 
    value: string; 
    options: Array<{ label: string; count: number }>; 
    filterKey: string;
    placeholder?: string;
  }) => {
    const isOpen = openDropdown === filterKey;
    const selectedOption = options.find(opt => opt.label === value);

    return (
      <div className="relative">
        <button
          onClick={() => toggleDropdown(filterKey)}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm transition-colors whitespace-nowrap ${
            value
              ? 'bg-black text-white border-black'
              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className="font-medium">{label}:</span>
          <span className="truncate max-w-[120px]">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setOpenDropdown(null)}
            />
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 min-w-[200px] max-h-60 overflow-y-auto">
              <div className="p-2">
                <button
                  onClick={() => {
                    onFilterChange(filterKey, '');
                    setOpenDropdown(null);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                >
                  {placeholder}
                </button>
                {options.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => {
                      onFilterChange(filterKey, option.label);
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded flex items-center justify-between ${
                      value === option.label
                        ? 'bg-black text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    <span className={`text-xs ml-2 ${value === option.label ? 'text-gray-300' : 'text-gray-400'}`}>
                      ({option.count.toLocaleString()})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // Prepare options
  const mainCategoryOptions = [
    { label: 'Men', count: Object.entries(facets.categories).filter(([k]) => k.toLowerCase().includes('men')).reduce((sum, [, v]) => sum + v, 0) },
    { label: 'Women', count: Object.entries(facets.categories).filter(([k]) => k.toLowerCase().includes('women')).reduce((sum, [, v]) => sum + v, 0) },
    { label: 'Kids', count: Object.entries(facets.categories).filter(([k]) => k.toLowerCase().includes('kid') || k.toLowerCase().includes('boy') || k.toLowerCase().includes('girl')).reduce((sum, [, v]) => sum + v, 0) },
    { label: 'Accessories', count: facets.categories['Accessories'] || 0 },
  ].filter(opt => opt.count > 0);

  const productTypeOptions = Object.entries(facets.productTypes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 30)
    .map(([label, count]) => ({ label, count }));

  const brandOptions = Object.entries(facets.brands)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([label, count]) => ({ label, count }));

  return (
    <div className="bg-white border-b border-gray-200 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Filter Icon */}
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Filter className="w-4 h-4" />
            <span>Filters:</span>
          </div>

          {/* Category Dropdown */}
          {mainCategoryOptions.length > 0 && (
            <SimpleDropdown
              label="Category"
              value={filters.mainCategory || ''}
              options={mainCategoryOptions}
              filterKey="mainCategory"
              placeholder="All"
            />
          )}

          {/* Product Type Dropdown */}
          {productTypeOptions.length > 0 && (
            <SimpleDropdown
              label="Type"
              value={filters.productType || ''}
              options={productTypeOptions}
              filterKey="productType"
              placeholder="All Types"
            />
          )}

          {/* Brand Dropdown */}
          {brandOptions.length > 0 && (
            <SimpleDropdown
              label="Brand"
              value={filters.brand || ''}
              options={brandOptions}
              filterKey="brand"
              placeholder="All Brands"
            />
          )}

          {/* Price Range - Compact */}
          <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Price:</span>
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice || ''}
              onChange={(e) => onFilterChange('minPrice', e.target.value)}
              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice || ''}
              onChange={(e) => onFilterChange('maxPrice', e.target.value)}
              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black"
            />
          </div>

          {/* Clear All Button */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useProductStore } from '@/store/productStore';

interface FilterPanelProps {
  filters: any;
  setFilters: (filters: any) => void;
  setPagination: (pagination: any) => void;
  categoryName: string;
  fetchProducts: (params: any) => void;
  clearAllFilters: () => void;
  priceDebounceRef: React.MutableRefObject<number | null>;
  updateURL: (newParams: Record<string, string>) => void;
  setSearchInput?: (value: string) => void;
}

// Color options with hex codes
const colorOptions = [
  { name: 'Brown', hex: '#8B4513' },
  { name: 'Black', hex: '#000000' },
  { name: 'Grey', hex: '#808080' },
  { name: 'Cognac', hex: '#9F4636' },
  { name: 'Tan', hex: '#D2B48C' },
  { name: 'Maroon', hex: '#800000' },
  { name: 'Off white', hex: '#FAF0E6' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Pink', hex: '#FFC0CB' },
  { name: 'Green', hex: '#008000' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Purple', hex: '#800080' },
  { name: 'Red', hex: '#FF0000' },
];

// Style options based on common product styles
const styleOptions = [
  'Asymmetrical',
  'Hood',
  'Hooded',
  'Jacket',
  'Leather',
  'Cafe racer',
  'Edinburgh',
  'Cognac',
  'Biker',
  'Fur',
  'Shearling',
  'Bomber',
];

// Price ranges
const priceRanges = [
  { label: '$189 - $239', min: 189, max: 239 },
  { label: '$239 - $249', min: 239, max: 249 },
  { label: '$249 - $299', min: 249, max: 299 },
  { label: '$299 - $399', min: 299, max: 399 },
  { label: 'Over $399', min: 399, max: 1000 },
];

export default function FilterPanel({
  filters,
  setFilters,
  setPagination,
  categoryName,
  fetchProducts,
  clearAllFilters,
  priceDebounceRef,
  updateURL,
  setSearchInput,
}: FilterPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    style: true,
    color: true,
  });

  const toggleSection = (section: 'price' | 'style' | 'color') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handlePriceRangeClick = (min: number, max: number) => {
    setFilters({ priceRange: [min, max] });
    setPagination({ page: 1 });
    
    if (priceDebounceRef.current) {
      window.clearTimeout(priceDebounceRef.current);
    }
    
    priceDebounceRef.current = window.setTimeout(() => {
      updateURL({ minPrice: min.toString(), maxPrice: max.toString(), page: '' });
      fetchProducts({
        category: categoryName,
        minPrice: min,
        maxPrice: max,
      });
    }, 250);
  };

  const handleStyleClick = (style: string) => {
    // Clear search if it matches the style being selected
    const shouldClearSearch = filters.search && 
      filters.search.toLowerCase().includes(style.toLowerCase());
    
    if (shouldClearSearch && setSearchInput) {
      setSearchInput('');
    }
    
    setFilters({ 
      style, 
      ...(shouldClearSearch ? { search: '' } : {})
    });
    setPagination({ page: 1 });
    
    // Update URL - remove search if it conflicts with style
    const urlParams: Record<string, string> = { style, page: '' };
    if (shouldClearSearch) {
      urlParams.search = '';
    }
    updateURL(urlParams);
    
    fetchProducts({
      category: categoryName,
      style,
      ...(shouldClearSearch ? { search: '' } : {})
    });
  };

  const handleColorClick = (color: string) => {
    // Clear search if it matches the color being selected
    const shouldClearSearch = filters.search && 
      filters.search.toLowerCase().includes(color.toLowerCase());
    
    if (shouldClearSearch && setSearchInput) {
      setSearchInput('');
    }
    
    setFilters({ 
      color,
      ...(shouldClearSearch ? { search: '' } : {})
    });
    setPagination({ page: 1 });
    
    // Update URL - remove search if it conflicts with color
    const urlParams: Record<string, string> = { color, page: '' };
    if (shouldClearSearch) {
      urlParams.search = '';
    }
    updateURL(urlParams);
    
    fetchProducts({
      category: categoryName,
      color,
      ...(shouldClearSearch ? { search: '' } : {})
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Filter Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-4 pb-4">
        {/* SHOP BY PRICE */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection('price')}
            className="w-full flex items-center justify-between text-gray-900 font-semibold uppercase text-sm mb-3"
          >
            <span>SHOP BY PRICE</span>
            {expandedSections.price ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
          {expandedSections.price && (
            <div className="space-y-2">
              {priceRanges.map((range, index) => (
                <button
                  key={index}
                  onClick={() => handlePriceRangeClick(range.min, range.max)}
                  className="block w-full text-left text-sm text-gray-700 hover:text-gray-900 underline transition-colors"
                >
                  {range.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* STYLE */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection('style')}
            className="w-full flex items-center justify-between text-gray-900 font-semibold uppercase text-sm mb-3"
          >
            <span>STYLE</span>
            {expandedSections.style ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
          {expandedSections.style && (
            <div className="space-y-2">
              {styleOptions.map((style, index) => (
                <button
                  key={index}
                  onClick={() => handleStyleClick(style)}
                  className={`block w-full text-left text-sm transition-colors ${
                    filters.style === style
                      ? 'text-gray-900 font-semibold underline'
                      : 'text-gray-700 hover:text-gray-900 underline'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* COLOR */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection('color')}
            className="w-full flex items-center justify-between text-gray-900 font-semibold uppercase text-sm mb-3"
          >
            <span>COLOR</span>
            {expandedSections.color ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
          {expandedSections.color && (
            <div className="grid grid-cols-3 gap-3">
              {colorOptions.map((color, index) => (
                <button
                  key={index}
                  onClick={() => handleColorClick(color.name)}
                  className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <div
                    className={`w-4 h-4 rounded-full border ${
                      color.name === 'White' || color.name === 'Off white'
                        ? 'border-gray-300'
                        : 'border-transparent'
                    } ${
                      filters.color === color.name ? 'ring-2 ring-blue-600 ring-offset-1' : ''
                    }`}
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className={filters.color === color.name ? 'font-semibold' : ''}>
                    {color.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Clear Filter Button - Fixed at bottom */}
      <div className="border-t border-gray-200 px-6 py-4 bg-white sticky bottom-0">
        <button
          onClick={clearAllFilters}
          className="w-full px-4 py-3 border border-gray-300 rounded text-gray-900 font-medium hover:bg-gray-50 transition-colors"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
}

'use client';

import { X } from 'lucide-react';

interface ActiveFiltersProps {
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
  onRemoveFilter: (key: string, value?: string) => void;
  onClearAll: () => void;
}

export default function ActiveFilters({ filters, onRemoveFilter, onClearAll }: ActiveFiltersProps) {
  const activeFilters: Array<{ key: string; label: string; value: string }> = [];

  if (filters.mainCategory && filters.mainCategory !== 'all') {
    activeFilters.push({ key: 'mainCategory', label: 'Category', value: filters.mainCategory });
  }
  if (filters.category) {
    activeFilters.push({ key: 'category', label: 'Category', value: filters.category });
  }
  if (filters.subCategory) {
    activeFilters.push({ key: 'subCategory', label: 'Sub Category', value: filters.subCategory });
  }
  if (filters.productType) {
    activeFilters.push({ key: 'productType', label: 'Type', value: filters.productType });
  }
  if (filters.brand) {
    activeFilters.push({ key: 'brand', label: 'Brand', value: filters.brand });
  }
  if (filters.vendor) {
    activeFilters.push({ key: 'vendor', label: 'Vendor', value: filters.vendor });
  }
  if (filters.minPrice || filters.maxPrice) {
    const priceLabel = filters.minPrice && filters.maxPrice
      ? `Price: ${filters.minPrice} - ${filters.maxPrice}`
      : filters.minPrice
      ? `Price: ${filters.minPrice}+`
      : `Price: Up to ${filters.maxPrice}`;
    activeFilters.push({ key: 'price', label: priceLabel, value: '' });
  }
  if (filters.tags && filters.tags.length > 0) {
    filters.tags.forEach(tag => {
      activeFilters.push({ key: 'tags', label: 'Tag', value: tag });
    });
  }
  if (filters.inStock) {
    activeFilters.push({ key: 'inStock', label: 'In Stock', value: '' });
  }
  if (filters.onSale) {
    activeFilters.push({ key: 'onSale', label: 'On Sale', value: '' });
  }

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <span className="text-sm font-medium text-gray-700">Active Filters:</span>
      {activeFilters.map((filter, idx) => (
        <button
          key={`${filter.key}-${filter.value}-${idx}`}
          onClick={() => {
            if (filter.key === 'price') {
              onRemoveFilter('minPrice');
              onRemoveFilter('maxPrice');
            } else if (filter.key === 'tags') {
              onRemoveFilter('tags', filter.value);
            } else {
              onRemoveFilter(filter.key);
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-100 transition-colors group"
        >
          <span>
            {filter.label}: <span className="font-medium">{filter.value || filter.label}</span>
          </span>
          <X className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-700" />
        </button>
      ))}
      {activeFilters.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-sm text-red-600 hover:text-red-800 underline font-medium ml-2"
        >
          Clear All
        </button>
      )}
    </div>
  );
}


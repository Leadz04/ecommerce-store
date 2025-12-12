'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

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

interface FilterSidebarProps {
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

export default function FilterSidebar({ facets, filters, onFilterChange, loading }: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    mainCategory: false,
    category: false,
    subCategory: false,
    productType: false,
    brand: false,
    vendor: false,
    price: false,
    tags: false,
    availability: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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

  const handleTagToggle = (tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    onFilterChange('tags', newTags);
  };

  const FilterSection = ({ 
    title, 
    sectionId, 
    children, 
    count 
  }: { 
    title: string; 
    sectionId: string; 
    children: React.ReactNode; 
    count?: number; 
  }) => {
    const isExpanded = expandedSections[sectionId] ?? false;
    return (
      <div className="border-b border-gray-200 pb-4 last:border-0">
        <button
          onClick={() => toggleSection(sectionId)}
          className="w-full flex items-center justify-between mb-3 font-semibold text-gray-900 hover:text-gray-700"
        >
          <span>{title} {count !== undefined && <span className="text-gray-500 font-normal">({count})</span>}</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
        {isExpanded && (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {children}
          </div>
        )}
      </div>
    );
  };

  const RadioOption = ({ 
    name, 
    value, 
    label, 
    count, 
    checked 
  }: { 
    name: string; 
    value: string; 
    label: string; 
    count: number; 
    checked: boolean;
  }) => (
    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={() => onFilterChange(name, value)}
        className="rounded border-gray-300 text-black focus:ring-black"
      />
      <span className="text-sm text-gray-700 flex-1 truncate">{label}</span>
      <span className="text-xs text-gray-400">({count.toLocaleString()})</span>
    </label>
  );

  const CheckboxOption = ({ 
    name, 
    value, 
    label, 
    count, 
    checked 
  }: { 
    name: string; 
    value: string; 
    label: string; 
    count: number; 
    checked: boolean;
  }) => (
    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => handleTagToggle(value)}
        className="rounded border-gray-300 text-black focus:ring-black"
      />
      <span className="text-sm text-gray-700 flex-1 truncate">{label}</span>
      <span className="text-xs text-gray-400">({count.toLocaleString()})</span>
    </label>
  );

  return (
    <div className={`space-y-6 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="w-full text-sm text-red-600 hover:text-red-800 underline mb-2 font-medium"
        >
          Clear All Filters
        </button>
      )}

      {/* Main Category */}
      <FilterSection title="Main Category" sectionId="mainCategory" count={Object.keys(facets.categories).length}>
        <RadioOption
          name="mainCategory"
          value=""
          label="All"
          count={Object.values(facets.categories).reduce((a, b) => a + b, 0)}
          checked={!filters.mainCategory || filters.mainCategory === 'all'}
        />
        {['Men', 'Women', 'Kids', 'Accessories'].map(cat => {
          const count = Object.entries(facets.categories)
            .filter(([key]) => key.toLowerCase().includes(cat.toLowerCase()))
            .reduce((sum, [, val]) => sum + val, 0);
          if (count === 0) return null;
          return (
            <RadioOption
              key={cat}
              name="mainCategory"
              value={cat}
              label={cat}
              count={count}
              checked={filters.mainCategory === cat}
            />
          );
        })}
      </FilterSection>

      {/* Category */}
      {Object.keys(facets.categories).length > 0 && (
        <FilterSection title="Category" sectionId="category" count={Object.keys(facets.categories).length}>
          {Object.entries(facets.categories)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 20)
            .map(([label, count]) => (
              <RadioOption
                key={label}
                name="category"
                value={label}
                label={label}
                count={count}
                checked={filters.category === label}
              />
            ))}
        </FilterSection>
      )}

      {/* Product Type - Most Important */}
      {Object.keys(facets.productTypes).length > 0 && (
        <FilterSection title="Product Type" sectionId="productType" count={Object.keys(facets.productTypes).length}>
          {Object.entries(facets.productTypes)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 30)
            .map(([label, count]) => (
              <RadioOption
                key={label}
                name="productType"
                value={label}
                label={label}
                count={count}
                checked={filters.productType === label}
              />
            ))}
        </FilterSection>
      )}

      {/* Sub Category */}
      {Object.keys(facets.subCategories).length > 0 && (
        <FilterSection title="Sub Category" sectionId="subCategory" count={Object.keys(facets.subCategories).length}>
          {Object.entries(facets.subCategories)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 20)
            .map(([label, count]) => (
              <RadioOption
                key={label}
                name="subCategory"
                value={label}
                label={label}
                count={count}
                checked={filters.subCategory === label}
              />
            ))}
        </FilterSection>
      )}

      {/* Brand */}
      {Object.keys(facets.brands).length > 0 && (
        <FilterSection title="Brand" sectionId="brand" count={Object.keys(facets.brands).length}>
          {Object.entries(facets.brands)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 20)
            .map(([label, count]) => (
              <RadioOption
                key={label}
                name="brand"
                value={label}
                label={label}
                count={count}
                checked={filters.brand === label}
              />
            ))}
        </FilterSection>
      )}

      {/* Vendor */}
      {Object.keys(facets.vendors).length > 0 && (
        <FilterSection title="Vendor" sectionId="vendor" count={Object.keys(facets.vendors).length}>
          {Object.entries(facets.vendors)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 15)
            .map(([label, count]) => (
              <RadioOption
                key={label}
                name="vendor"
                value={label}
                label={label}
                count={count}
                checked={filters.vendor === label}
              />
            ))}
        </FilterSection>
      )}

      {/* Price Range */}
      <FilterSection title="Price Range" sectionId="price">
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice || ''}
              onChange={(e) => onFilterChange('minPrice', e.target.value)}
              className="w-1/2 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-black"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice || ''}
              onChange={(e) => onFilterChange('maxPrice', e.target.value)}
              className="w-1/2 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-black"
            />
          </div>
          <div className="text-xs text-gray-500">
            Range: PKR {facets.priceRange.min.toLocaleString()} - {facets.priceRange.max.toLocaleString()}
          </div>
          {/* Quick Price Filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Under 1K', max: 1000 },
              { label: '1K-5K', min: 1000, max: 5000 },
              { label: '5K-10K', min: 5000, max: 10000 },
              { label: '10K+', min: 10000 }
            ].map(range => (
              <button
                key={range.label}
                onClick={() => {
                  onFilterChange('minPrice', range.min?.toString() || '');
                  onFilterChange('maxPrice', range.max?.toString() || '');
                }}
                className={`px-3 py-1 text-xs rounded border transition-colors ${
                  filters.minPrice === (range.min?.toString() || '') && 
                  filters.maxPrice === (range.max?.toString() || '')
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </FilterSection>

      {/* Tags */}
      {Object.keys(facets.tags).length > 0 && (
        <FilterSection title="Tags" sectionId="tags" count={Object.keys(facets.tags).length}>
          {Object.entries(facets.tags)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 20)
            .map(([label, count]) => (
              <CheckboxOption
                key={label}
                name="tags"
                value={label}
                label={label}
                count={count}
                checked={(filters.tags || []).includes(label)}
              />
            ))}
        </FilterSection>
      )}

      {/* Stock & Sale Filters */}
      <FilterSection title="Availability" sectionId="availability">
        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
          <input
            type="checkbox"
            checked={filters.inStock || false}
            onChange={(e) => onFilterChange('inStock', e.target.checked)}
            className="rounded border-gray-300 text-black focus:ring-black"
          />
          <span className="text-sm text-gray-700">In Stock Only</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
          <input
            type="checkbox"
            checked={filters.onSale || false}
            onChange={(e) => onFilterChange('onSale', e.target.checked)}
            className="rounded border-gray-300 text-black focus:ring-black"
          />
          <span className="text-sm text-gray-700">On Sale</span>
        </label>
      </FilterSection>
    </div>
  );
}


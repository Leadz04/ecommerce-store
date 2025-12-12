'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

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

interface FilterDropdownsProps {
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

export default function FilterDropdowns({ facets, filters, onFilterChange, loading }: FilterDropdownsProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    mainCategory: false,
    category: false,
    productType: false,
    brand: false,
    vendor: false,
    price: false,
    tags: false,
    availability: false
  });

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

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const Dropdown = ({ 
    label, 
    value, 
    options, 
    filterKey,
    placeholder = "Select..."
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
          className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-lg text-sm transition-colors ${
            value
              ? 'bg-black text-white border-black'
              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className="truncate">
            {selectedOption ? `${label}: ${selectedOption.label}` : `${label}: ${placeholder}`}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setOpenDropdown(null)}
            />
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
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

  const TagDropdown = () => {
    const isOpen = openDropdown === 'tags';
    const selectedTags = filters.tags || [];

    return (
      <div className="relative">
        <button
          onClick={() => toggleDropdown('tags')}
          disabled={loading}
          className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-lg text-sm transition-colors ${
            selectedTags.length > 0
              ? 'bg-black text-white border-black'
              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className="truncate">
            Tags: {selectedTags.length > 0 ? `${selectedTags.length} selected` : 'Select tags...'}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setOpenDropdown(null)}
            />
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
              <div className="p-2">
                {Object.entries(facets.tags)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 20)
                  .map(([tag, count]) => (
                    <label
                      key={tag}
                      className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 rounded cursor-pointer"
                    >
                      <span className="text-sm text-gray-700">{tag}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">({count.toLocaleString()})</span>
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag)}
                          onChange={() => handleTagToggle(tag)}
                          className="rounded border-gray-300 text-black focus:ring-black"
                        />
                      </div>
                    </label>
                  ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const PriceRangeInput = () => {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice || ''}
            onChange={(e) => onFilterChange('minPrice', e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice || ''}
            onChange={(e) => onFilterChange('maxPrice', e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>
        <div className="text-xs text-gray-500">
          Range: PKR {facets.priceRange.min.toLocaleString()} - {facets.priceRange.max.toLocaleString()}
        </div>
      </div>
    );
  };

  // Prepare options for dropdowns
  const mainCategoryOptions = [
    { label: 'Men', count: Object.entries(facets.categories).filter(([k]) => k.toLowerCase().includes('men')).reduce((sum, [, v]) => sum + v, 0) },
    { label: 'Women', count: Object.entries(facets.categories).filter(([k]) => k.toLowerCase().includes('women')).reduce((sum, [, v]) => sum + v, 0) },
    { label: 'Kids', count: Object.entries(facets.categories).filter(([k]) => k.toLowerCase().includes('kid') || k.toLowerCase().includes('boy') || k.toLowerCase().includes('girl')).reduce((sum, [, v]) => sum + v, 0) },
    { label: 'Accessories', count: facets.categories['Accessories'] || 0 },
  ].filter(opt => opt.count > 0);

  const categoryOptions = Object.entries(facets.categories)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([label, count]) => ({ label, count }));

  const productTypeOptions = Object.entries(facets.productTypes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 30)
    .map(([label, count]) => ({ label, count }));

  const brandOptions = Object.entries(facets.brands)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([label, count]) => ({ label, count }));

  const vendorOptions = Object.entries(facets.vendors)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([label, count]) => ({ label, count }));

  const FilterSection = ({ 
    title, 
    sectionId, 
    children 
  }: { 
    title: string; 
    sectionId: string; 
    children: React.ReactNode;
  }) => {
    const isExpanded = expandedSections[sectionId] ?? false;
    return (
      <div className="border-b border-gray-200 pb-3 last:border-0">
        <button
          onClick={() => toggleSection(sectionId)}
          className="w-full flex items-center justify-between mb-3 font-semibold text-gray-900 hover:text-gray-700"
        >
          <span>{title}</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
        {isExpanded && (
          <div className="space-y-2">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-3 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Clear All Button */}
      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="w-full text-sm text-red-600 hover:text-red-800 underline font-medium mb-2"
        >
          Clear All Filters
        </button>
      )}

      {/* Main Category Dropdown */}
      {mainCategoryOptions.length > 0 && (
        <FilterSection title="Category" sectionId="mainCategory">
          <Dropdown
            label="Category"
            value={filters.mainCategory || ''}
            options={mainCategoryOptions}
            filterKey="mainCategory"
            placeholder="All Categories"
          />
        </FilterSection>
      )}

      {/* Category Dropdown */}
      {categoryOptions.length > 0 && (
        <FilterSection title="Sub Category" sectionId="category">
          <Dropdown
            label="Sub Category"
            value={filters.category || ''}
            options={categoryOptions}
            filterKey="category"
          />
        </FilterSection>
      )}

      {/* Product Type Dropdown */}
      {productTypeOptions.length > 0 && (
        <FilterSection title="Product Type" sectionId="productType">
          <Dropdown
            label="Product Type"
            value={filters.productType || ''}
            options={productTypeOptions}
            filterKey="productType"
          />
        </FilterSection>
      )}

      {/* Brand Dropdown */}
      {brandOptions.length > 0 && (
        <FilterSection title="Brand" sectionId="brand">
          <Dropdown
            label="Brand"
            value={filters.brand || ''}
            options={brandOptions}
            filterKey="brand"
          />
        </FilterSection>
      )}

      {/* Vendor Dropdown */}
      {vendorOptions.length > 0 && (
        <FilterSection title="Vendor" sectionId="vendor">
          <Dropdown
            label="Vendor"
            value={filters.vendor || ''}
            options={vendorOptions}
            filterKey="vendor"
          />
        </FilterSection>
      )}

      {/* Price Range */}
      <FilterSection title="Price Range" sectionId="price">
        <PriceRangeInput />
      </FilterSection>

      {/* Tags Dropdown */}
      {Object.keys(facets.tags).length > 0 && (
        <FilterSection title="Tags" sectionId="tags">
          <TagDropdown />
        </FilterSection>
      )}

      {/* Stock & Sale Checkboxes */}
      <FilterSection title="Availability" sectionId="availability">
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.inStock || false}
              onChange={(e) => onFilterChange('inStock', e.target.checked)}
              className="rounded border-gray-300 text-black focus:ring-black"
            />
            <span className="text-sm text-gray-700">In Stock Only</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.onSale || false}
              onChange={(e) => onFilterChange('onSale', e.target.checked)}
              className="rounded border-gray-300 text-black focus:ring-black"
            />
            <span className="text-sm text-gray-700">On Sale</span>
          </label>
        </div>
      </FilterSection>
    </div>
  );
}


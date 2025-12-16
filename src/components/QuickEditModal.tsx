'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Loader2 } from 'lucide-react';
import SelectField, { SelectOption } from './SelectField';
import toast from 'react-hot-toast';

interface QuickEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Array<{ _id: string; name: string; category?: string; subCategory?: string; brand?: string; price?: number; productType?: string }>;
  onSave: (updates: { category?: string; subCategory?: string; brand?: string; price?: number; productType?: string; type?: string }) => Promise<void>;
}

// Static Data Structure as per requirements
const CATEGORY_DATA: Record<string, {
  subCategories: string[];
  productTypes: Record<string, string[]>;
}> = {
  Men: {
    subCategories: ['Tops', 'Bottoms', 'Sets', 'Activewear', 'Outerwear', 'Accessories', 'View All'],
    productTypes: {
      'Tops': ['Sweatshirts', 'Polo Shirts', 'Casual Shirts', 'T-Shirts', 'Henleys', 'Button Down Shirts', 'View All'],
      'Bottoms': ['Jeans', 'Shorts', 'Pants', 'Trousers', 'View All'],
      'Outerwear': ['Sweaters', 'Hoodies/Uppers', 'Jackets', 'Blazers/Coats', 'View All'],
      'Accessories': ['Footwear', 'Bags', 'Belts', 'Socks', 'View All']
    }
  },
  Women: {
    subCategories: ['Tops', 'Bottoms', 'Sets', 'Activewear', 'Outerwear', 'Accessories', 'View All'],
    productTypes: {
      'Tops': ['Sweatshirts', 'Polo Shirts', 'Casual Shirts', 'T-Shirts', 'Henleys', 'Button Down Shirts', 'View All'],
      'Bottoms': ['Jeans', 'Shorts', 'Pants', 'Trousers', 'View All'],
      'Outerwear': ['Sweaters', 'Hoodies/Uppers', 'Jackets', 'Blazers/Coats', 'View All'],
      'Accessories': ['Footwear', 'Bags', 'Belts', 'Socks', 'View All']
    }
  },
  Kids: {
    subCategories: ['Boys', 'Girls', 'Baby Boys', 'Baby Girls', 'View All'],
    productTypes: {
      'Boys': ['Sweatshirts', 'Sweaters', 'Uppers', 'Jackets', 'T-Shirts', 'Shirts', 'Jeans', 'Pants', 'Shorts', 'Trousers', 'Tracksuits', 'Shoes', 'Socks', 'View All'],
      'Girls': ['Sweaters', 'Sweatshirts', 'Uppers', 'Jackets', 'Tops', 'Dresses', 'Suits', 'Denims', 'Pants', 'Tights', 'Shoes'],
      'Baby Boys': ['Sweatshirts', 'Sweaters', 'Uppers', 'Jackets', 'T-Shirts', 'Shirts', 'Jeans', 'Pants', 'Shorts', 'Trousers', 'Tracksuits', 'Shoes', 'Socks', 'View All'],
      'Baby Girls': ['Sweaters', 'Sweatshirts', 'Uppers', 'Jackets', 'Tops', 'Dresses', 'Suits', 'Denims', 'Pants', 'Tights', 'Shoes'],
      'View All': []
    }
  }
};

const MAIN_CATEGORIES = ['Men', 'Women', 'Kids'];

export default function QuickEditModal({ isOpen, onClose, products, onSave }: QuickEditModalProps) {
  // Database fetched options (fallback/legacy)
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [dbSubCategories, setDbSubCategories] = useState<string[]>([]);
  const [dbProductTypes, setDbProductTypes] = useState<string[]>([]);

  const [types, setTypes] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Form state
  const [category, setCategory] = useState<string>('');
  const [subCategory, setSubCategory] = useState<string>('');
  const [productType, setProductType] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [price, setPrice] = useState<string>('');

  // Select field open states
  const [openSelect, setOpenSelect] = useState<string | null>(null);

  // Fetch available options from database
  useEffect(() => {
    if (isOpen) {
      fetchOptions();
    }
  }, [isOpen]);

  const fetchOptions = async () => {
    try {
      setLoadingOptions(true);
      const token = localStorage.getItem('token');

      const [categoriesListRes, brandsRes] = await Promise.all([
        fetch('/api/admin/products/categories-list', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/admin/brands', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      let hasSavedList = false;
      if (categoriesListRes.ok) {
        const data = await categoriesListRes.json();
        if (data.lists && (
          (data.lists.categories && data.lists.categories.length > 0) ||
          (data.lists.subCategories && data.lists.subCategories.length > 0) ||
          (data.lists.productTypes && data.lists.productTypes.length > 0)
        )) {
          setDbCategories(data.lists.categories || []);
          setDbSubCategories(data.lists.subCategories || []);
          setDbProductTypes(data.lists.productTypes || []);
          setTypes(data.lists.types || []);
          hasSavedList = true;
        }
      }

      // Fallback: if no saved list or empty list, fetch from products
      if (!hasSavedList) {
        try {
          const categoriesRes = await fetch('/api/admin/products', {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (categoriesRes.ok) {
            const data = await categoriesRes.json();
            const uniqueCategories = Array.from(new Set(data.filters?.categories || []))
              .filter((c): c is string => Boolean(c) && typeof c === 'string')
              .sort();
            setDbCategories(uniqueCategories);
          }

          const subCatRes = await fetch('/api/admin/products?limit=1000', {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (subCatRes.ok) {
            const subCatData = await subCatRes.json();
            const products = subCatData.products || [];

            const uniqueSubCats = Array.from(
              new Set<string>(
                products
                  .map((p: any) => p.subCategory)
                  .filter((sc: any): sc is string => Boolean(sc) && typeof sc === 'string')
              )
            ).sort();
            setDbSubCategories(uniqueSubCats);

            const uniqueProductTypes = Array.from(
              new Set<string>(
                products
                  .map((p: any) => p.productType)
                  .filter((pt: any): pt is string => Boolean(pt) && typeof pt === 'string')
              )
            ).sort();
            setDbProductTypes(uniqueProductTypes);

            const uniqueTypes = Array.from(
              new Set<string>(
                products
                  .map((p: any) => p.type)
                  .filter((t: any): t is string => Boolean(t) && typeof t === 'string')
              )
            ).sort();
            setTypes(uniqueTypes);
          }
        } catch (err) {
          console.error('Error fetching fallback data:', err);
        }
      }

      if (brandsRes.ok) {
        const data = await brandsRes.json();
        const uniqueBrands = Array.from(new Set(data.brands || []))
          .filter((b): b is string => Boolean(b) && typeof b === 'string')
          .sort();
        setBrands(uniqueBrands);
      }
    } catch (error) {
      console.error('Error fetching options:', error);
      toast.error('Failed to load options');
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleSave = async () => {
    if (!category && !subCategory && !productType && !type && !brand && !price) {
      toast.error('Please select at least one field to update');
      return;
    }

    if (price && (isNaN(parseFloat(price)) || parseFloat(price) < 0)) {
      toast.error('Price must be a valid positive number');
      return;
    }

    try {
      setLoading(true);
      const updates: { category?: string; subCategory?: string; brand?: string; price?: number; productType?: string; type?: string } = {};

      if (category) updates.category = category;
      if (subCategory) updates.subCategory = subCategory;
      if (productType) updates.productType = productType;
      if (type) updates.type = type;
      if (brand) updates.brand = brand;
      if (price) updates.price = parseFloat(price);

      await onSave(updates);
      toast.success(`Updated ${products.length} product${products.length > 1 ? 's' : ''} successfully`);
      handleClose();
    } catch (error: any) {
      console.error('Error saving:', error);
      toast.error(error.message || 'Failed to update products');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCategory('');
    setSubCategory('');
    setProductType('');
    setType('');
    setBrand('');
    setPrice('');
    setOpenSelect(null);
    onClose();
  };

  // Dynamic Options Logic
  const categoryOptions: SelectOption[] = useMemo(() => {
    // Combine static main categories with any other unique categories from DB, ensuring no duplicates
    // Priority: Men, Women, Kids, then others
    const otherCategories = dbCategories.filter(c => !MAIN_CATEGORIES.includes(c));
    const allCategories = [...MAIN_CATEGORIES, ...otherCategories];

    return [
      { value: '', label: 'Keep current' },
      ...allCategories.map(cat => ({ value: cat, label: cat })),
    ];
  }, [dbCategories]);

  const subCategoryOptions: SelectOption[] = useMemo(() => {
    const staticData = CATEGORY_DATA[category];
    let options: string[] = [];

    if (staticData && staticData.subCategories.length > 0) {
      options = staticData.subCategories;
    } else {
      // Fallback to database fetched subcategories if selected category has no static mapping (e.g. Kids or others)
      options = dbSubCategories;
    }

    return [
      { value: '', label: 'Keep current' },
      ...options.map(sc => ({ value: sc, label: sc })),
    ];
  }, [category, dbSubCategories]);

  const productTypeOptions: SelectOption[] = useMemo(() => {
    const staticData = CATEGORY_DATA[category];
    let options: string[] = [];

    if (staticData) {
      // If we have static data for the category
      // Check if we have specific product types for the selected subcategory
      if (subCategory && staticData.productTypes[subCategory]) {
        options = staticData.productTypes[subCategory];
      } else if (subCategory) {
        // If subcategory selected but no specific list (e.g. Sets/Activewear), maybe show nothing or generic?
        // User requirements implies strict lists. If not listed, it's safer to show empty or allow free entry if input supported (SelectField supports selection).
        // Let's fallback to dbProductTypes if the list is strictly empty/undefined in static map, 
        // essentially treating unmapped subcategories as "free/legacy"
        options = [];
      } else {
        // If no subcategory selected, maybe show nothing or all possible? 
        // Safest is nothing until subcat is picked to force hierarchy
        options = [];
      }
    } else {
      // Fallback for non-static categories (Kids, etc)
      options = dbProductTypes;
    }

    // Edge case: if we want to allow legacy product types to appear if they match the search? 
    // The SelectField component handles options passed to it.

    return [
      { value: '', label: 'Keep current' },
      ...options.map(pt => ({ value: pt, label: pt })),
    ];
  }, [category, subCategory, dbProductTypes]);

  const typeOptions: SelectOption[] = [
    { value: '', label: 'Keep current' },
    ...types.map(t => ({ value: t, label: t })),
  ];

  const brandOptions: SelectOption[] = [
    { value: '', label: 'Keep current' },
    ...brands.map(b => ({ value: b, label: b })),
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Quick Edit Products</h2>
            <p className="text-sm text-gray-600 mt-1">
              Editing {products.length} product{products.length > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {loadingOptions ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading options...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <SelectField
                  options={categoryOptions}
                  value={category}
                  isOpen={openSelect === 'category'}
                  onOpenChange={(open) => setOpenSelect(open ? 'category' : null)}
                  onSelect={(value) => {
                    setCategory(value);
                    setSubCategory(''); // Reset sub on category change
                    setProductType(''); // Reset type on category change
                    setOpenSelect(null);
                  }}
                  className="w-full"
                />
              </div>

              {/* Sub Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sub Category
                </label>
                <SelectField
                  options={subCategoryOptions}
                  value={subCategory}
                  isOpen={openSelect === 'subCategory'}
                  onOpenChange={(open) => setOpenSelect(open ? 'subCategory' : null)}
                  onSelect={(value) => {
                    setSubCategory(value);
                    setProductType(''); // Reset product type on sub change
                    setOpenSelect(null);
                  }}
                  className="w-full"
                  disabled={!!category && CATEGORY_DATA[category] && !category} // Disable if category needed but not selected
                />
              </div>

              {/* Product Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Product Type
                </label>
                <SelectField
                  options={productTypeOptions}
                  value={productType}
                  isOpen={openSelect === 'productType'}
                  onOpenChange={(open) => setOpenSelect(open ? 'productType' : null)}
                  onSelect={(value) => {
                    setProductType(value);
                    setOpenSelect(null);
                  }}
                  className="w-full"
                  disabled={!!category && CATEGORY_DATA[category] && !subCategory}
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type
                </label>
                <SelectField
                  options={typeOptions}
                  value={type}
                  isOpen={openSelect === 'type'}
                  onOpenChange={(open) => setOpenSelect(open ? 'type' : null)}
                  onSelect={(value) => {
                    setType(value);
                    setOpenSelect(null);
                  }}
                  className="w-full"
                />
              </div>

              {/* Brand */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Brand
                </label>
                <SelectField
                  options={brandOptions}
                  value={brand}
                  isOpen={openSelect === 'brand'}
                  onOpenChange={(open) => setOpenSelect(open ? 'brand' : null)}
                  onSelect={(value) => {
                    setBrand(value);
                    setOpenSelect(null);
                  }}
                  className="w-full"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter new price (leave empty to keep current)"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to keep current price
                </p>
              </div>

              {/* Product List Preview */}
              {products.length <= 5 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Products to update:</p>
                  <ul className="space-y-1">
                    {products.map((product) => (
                      <li key={product._id} className="text-sm text-gray-600">
                        • {product.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || loadingOptions}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


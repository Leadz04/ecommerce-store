'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { cdnImageLoader } from '@/lib/imageLoader';
import Link from 'next/link';
import { Star, Heart, Truck, Shield, RotateCcw, Minus, Plus, ArrowRight, ArrowLeft, Edit, Save, X, Trash2, PlusCircle, Image as ImageIcon, MoveUp, MoveDown, Package, Ruler, Droplet, Sparkles, CheckCircle2, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useProductStore } from '@/store/productStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import { ProductDetailSkeleton } from '@/components/LoadingSkeleton';
import { sampleProducts } from '@/data/products';
import toast from 'react-hot-toast';
import ReviewList from '@/components/ReviewList';

// Brand Select Component
function BrandSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [customBrand, setCustomBrand] = useState('');

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/brands');
        const data = await res.json();
        if (res.ok && Array.isArray(data.brands)) {
          setBrands(data.brands);
        }
      } catch (error) {
        console.error('Failed to fetch brands:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();
  }, []);

  const isCustomBrand = value && !brands.includes(value);

  return (
    <div className="space-y-2">
      <select
        value={isCustomBrand ? '' : value}
        onChange={(e) => {
          if (e.target.value) {
            onChange(e.target.value);
            setCustomBrand('');
          }
        }}
        disabled={loading}
        className="w-full px-4 py-2.5 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white text-gray-900 disabled:opacity-50"
      >
        <option value="">{loading ? 'Loading brands...' : 'Select a brand'}</option>
        {brands.map(brand => (
          <option key={brand} value={brand}>{brand}</option>
        ))}
      </select>
      {isCustomBrand && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 px-4 py-2.5 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white text-gray-900"
            placeholder="Custom brand name"
          />
          <button
            type="button"
            onClick={() => {
              onChange('');
              setCustomBrand('');
            }}
            className="px-3 py-2.5 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {!isCustomBrand && value && (
        <button
          type="button"
          onClick={() => {
            setCustomBrand(value);
            onChange(value);
          }}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Or enter custom brand
        </button>
      )}
    </div>
  );
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [isGeneratingSpecs, setIsGeneratingSpecs] = useState(false);
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null);
  
  const { addItem } = useCartStore();
  const { currentProduct, isLoading, error, fetchProduct, fetchProducts, products } = useProductStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { user } = useAuthStore();
  
  const isSuperAdmin = user?.role?.name === 'SUPER_ADMIN';
  
  // Verify token and fetch user on mount
  useEffect(() => {
    const { verifyToken } = useAuthStore.getState();
    verifyToken();
  }, []);

  // Fetch product when component mounts
  useEffect(() => {
    if (productId) {
      setHasAttemptedFetch(true);
      fetchProduct(productId);
    }
  }, [productId, fetchProduct]);

  // Initialize edit form data when product loads or edit mode is enabled
  useEffect(() => {
    if (currentProduct && isEditMode) {
      // Convert specifications Map/Object to plain object if needed, filtering out questions
      let specs = {};
      if (currentProduct.specifications) {
        let rawSpecs = {};
        if (currentProduct.specifications instanceof Map) {
          rawSpecs = Object.fromEntries(currentProduct.specifications);
        } else if (typeof currentProduct.specifications === 'object') {
          rawSpecs = { ...currentProduct.specifications };
        }
        // Filter out questions from specifications in edit mode
        specs = Object.fromEntries(
          Object.entries(rawSpecs).filter(([_, value]) => {
            const valueStr = String(value);
            return !valueStr.trim().endsWith('?') && 
                   !/^(what|how|why|when|where|who|which|can|could|should|will|would|is|are|do|does|did|has|have|had)\s/i.test(valueStr.trim());
          })
        );
      }
      
      // Get images array
      const productImages = currentProduct.images && Array.isArray(currentProduct.images) && currentProduct.images.length > 0 
        ? currentProduct.images 
        : (currentProduct.image ? [currentProduct.image] : []);
      
      setEditFormData({
        name: currentProduct.name || '',
        description: currentProduct.description || '',
        descriptionHtml: currentProduct.descriptionHtml || '',
        price: currentProduct.price || 0,
        originalPrice: currentProduct.originalPrice || '',
        category: currentProduct.category || '',
        brand: currentProduct.brand || '',
        stockCount: currentProduct.stockCount || 0,
        inStock: currentProduct.inStock !== undefined ? currentProduct.inStock : true,
        status: currentProduct.status || 'published',
        productType: currentProduct.productType || '',
        tags: Array.isArray(currentProduct.tags) ? currentProduct.tags.join(', ') : '',
        specifications: specs,
        images: [...productImages],
        image: currentProduct.image || (productImages.length > 0 ? productImages[0] : '')
      });
    }
  }, [currentProduct, isEditMode]);

  const handleSave = async () => {
    if (!productId || !isSuperAdmin) return;
    
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      // Prepare update data
      const updateData: any = {
        name: editFormData.name,
        description: editFormData.description,
        descriptionHtml: editFormData.descriptionHtml,
        price: parseFloat(editFormData.price) || 0,
        category: editFormData.category,
        brand: editFormData.brand,
        stockCount: parseInt(editFormData.stockCount) || 0,
        inStock: editFormData.inStock,
        status: editFormData.status,
        productType: editFormData.productType
      };

      // Handle images - filter out empty URLs and set main image
      if (editFormData.images && Array.isArray(editFormData.images)) {
        const validImages = editFormData.images.filter((img: string) => img && img.trim());
        updateData.images = validImages;
        // Set main image to first image if available
        if (validImages.length > 0) {
          updateData.image = validImages[0];
        }
      }

      if (editFormData.originalPrice) {
        updateData.originalPrice = parseFloat(editFormData.originalPrice) || undefined;
      }

      if (editFormData.tags) {
        updateData.tags = editFormData.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
      }

      // Clean up specifications - remove empty keys and values
      if (editFormData.specifications) {
        const cleanedSpecs: Record<string, string> = {};
        Object.entries(editFormData.specifications).forEach(([key, value]) => {
          if (key && key.trim() && value && (value as string).trim()) {
            cleanedSpecs[key.trim()] = (value as string).trim();
          }
        });
        updateData.specifications = cleanedSpecs;
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          if (data.error?.includes('Invalid token') || data.error?.includes('No token')) {
            toast.error('Your session has expired. Please log in again.');
            // Optionally redirect to login
            setTimeout(() => {
              router.push('/login');
            }, 2000);
          } else {
            toast.error('Authentication failed. Please log in again.');
          }
        } else if (response.status === 403) {
          toast.error('You do not have permission to edit products. Super admin access required.');
        } else {
          toast.error(data.error || 'Failed to update product');
        }
        throw new Error(data.error || 'Failed to update product');
      }

      toast.success('Product updated successfully');
      setIsEditMode(false);
      // Refresh product data
      fetchProduct(productId);
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setEditFormData({});
  };

  const handleGenerateSpecs = async () => {
    if (!productId || !isSuperAdmin) return;
    
    setIsGeneratingSpecs(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`/api/products/${productId}/generate-specs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Your session has expired. Please log in again.');
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        } else if (response.status === 403) {
          toast.error('You do not have permission to generate specifications. Super admin access required.');
        } else {
          toast.error(data.error || 'Failed to generate specifications');
        }
        throw new Error(data.error || 'Failed to generate specifications');
      }

      const generatedCount = Object.keys(data.generated?.specifications || {}).length || 0;
      const faqsCount = data.generated?.faqs?.length || 0;
      const movedCount = data.generated?.movedToFAQs || 0;
      
      let message = `Generated ${generatedCount} specification${generatedCount !== 1 ? 's' : ''}`;
      if (faqsCount > 0) message += ` and ${faqsCount} FAQ${faqsCount !== 1 ? 's' : ''}`;
      if (movedCount > 0) message += ` (moved ${movedCount} question${movedCount !== 1 ? 's' : ''} to FAQs)`;
      toast.success(message);
      
      // Refresh product data
      fetchProduct(productId);
      
      // If in edit mode, update the form data
      if (isEditMode) {
        const existingSpecs = editFormData.specifications || {};
        const merged = { ...existingSpecs, ...data.specifications };
        setEditFormData({ ...editFormData, specifications: merged });
      }
    } catch (error) {
      console.error('Error generating specifications:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate specifications');
    } finally {
      setIsGeneratingSpecs(false);
    }
  };

  // Log product view
  useEffect(() => {
    if (!productId) return;
    try {
      fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'product_view', productId })
      });
    } catch {}
  }, [productId]);

  // Fetch all products for related products
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  
  if (isLoading || !currentProduct) {
    return <ProductDetailSkeleton />;
  }
  
  // Only show error if we've attempted to fetch and we're not loading and there's actually an error or no product
  if (hasAttemptedFetch && !isLoading && (error || !currentProduct)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900  mb-4">Product Not Found</h1>
          <p className="text-gray-600  mb-8">
            {error || "The product you're looking for doesn't exist."}
          </p>
          <Link 
            href="/products"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }
  
  const product = currentProduct as any;

  const handleAddToCart = () => {
    addItem(product, quantity, selectedSize, selectedColor);
    // Fire analytics event
    try {
      fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'add_to_cart', productId: product._id || product.id }),
      });
    } catch {}
  };

  const handleRelatedProductClick = (productId: string) => {
    router.push(`/products/${productId}`);
  };

  // Helper function to check if a value is a question
  const isQuestion = (text: string): boolean => {
    const trimmed = text.trim();
    if (trimmed.endsWith('?')) return true;
    const questionPattern = /^(what|how|why|when|where|who|which|can|could|should|will|would|is|are|do|does|did|has|have|had)\s/i;
    if (questionPattern.test(trimmed)) return true;
    const questionPhrases = [
      /what is/i, /how to/i, /how do/i, /how does/i, /how can/i, /what are/i, /what does/i,
      /why is/i, /why are/i, /when should/i, /where can/i, /can i/i, /can you/i,
      /should i/i, /will it/i, /does it/i, /is it/i, /are they/i
    ];
    return questionPhrases.some(pattern => pattern.test(trimmed));
  };

  // Generate a clear name from a specification value
  const generateSpecName = (value: string): string => {
    const valueStr = String(value).trim();
    
    if (/water\s+repellent|waterproof|water\s+resistant/i.test(valueStr)) return 'Water Resistance';
    if (/wind\s+proof|windproof|wind\s+resistant/i.test(valueStr)) return 'Wind Resistance';
    if (/nylon|polyester|cotton|leather|wool|suede|denim|silk|cashmere/i.test(valueStr)) {
      const match = valueStr.match(/(nylon|polyester|cotton|leather|wool|suede|denim|silk|cashmere)/i);
      if (match) return `Material: ${match[1].charAt(0).toUpperCase() + match[1].slice(1)}`;
    }
    if (/adjustable|adjust/i.test(valueStr)) return 'Adjustable Features';
    if (/pocket|pockets/i.test(valueStr)) return 'Pockets';
    if (/zipper|zip/i.test(valueStr)) return 'Closure Type';
    if (/strap|handle/i.test(valueStr)) return 'Strap/Handle';
    if (/lining|lined/i.test(valueStr)) return 'Lining';
    if (/padding|padded/i.test(valueStr)) return 'Padding';
    if (/breathable|breath/i.test(valueStr)) return 'Breathability';
    if (/inch|cm|mm|dimension|size|weight|length|width|height/i.test(valueStr)) return 'Dimensions';
    if (/premium|durable|quality|high\s+quality/i.test(valueStr)) return 'Quality';
    if (/color|colour|black|white|blue|red|brown|gray|grey/i.test(valueStr)) return 'Color';
    
    if (valueStr.length < 50 && valueStr.length > 3) {
      return valueStr.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
    
    return 'Feature';
  };

  // Helper function to check if content is informational/non-specification content
  const isInformationalContent = (key: string, value: string): boolean => {
    const keyLower = key.toLowerCase();
    const valueLower = value.toLowerCase();
    const combined = `${keyLower} ${valueLower}`;
    
    // Patterns for informational content that should be removed
    const informationalPatterns = [
      /customer\s+care|support\s+&?\s*policies|shipping\s+policy|return\s+and\s+exchange|sizing\s+guide|track\s+your\s+order|start\s+a\s+return|contact\s+us|help\s+help|station/i,
      /buying\s+guides?|celebrities?\s+&?\s*leather|what\s+is\s+italian\s+leather|myths?\s+about|shopping\s+online\s+vs\s+offline|lambskin\s+vs\s+cowhide|why\s+a\s+\$?\d+.*jacket|keanu\s+reeves|nvidia\s+ceo|sustainable|wilsons?\s+vs\s+angel|faux\s+leather\s+vs\s+real|beckham|celebrities?\s+&?\s*leather\s+jacket|myths?\s+about\s+leather|shopping\s+online|vs\s+offline|lambskin\s+vs\s+cowhide\s+leather|why\s+a\s+\$?\d+|keanu\s+reeves\s+leather|nvidia\s+ceo\s+&?\s*leather|sustainable\s+leather|wilsons?\s+vs\s+angel\s+jackets?|beckham'?s?\s+leather/i,
      /how\s+to'?s?|how\s+to\s+care|how\s+to\s+identify|how\s+to\s+remove|remove\s+wrinkles|remove\s+smell|how\s+to\s+care\s+letterman|how\s+to\s+care\s+suede|how\s+to\s+care\s+faux|how\s+to\s+care\s+leather\s+skirt|remove\s+wrinkles\s+from|remove\s+smell\s+from|how\s+to\s+care\s+leather\s+jacket|how\s+to\s+identify\s+real\s+leather/i,
      /guide|policy|policies|track|return|exchange|sizing|contact|help|support|station|care\s+instructions|instructions/i,
      /.{200,}/, // Very long values are likely informational
    ];
    
    for (const pattern of informationalPatterns) {
      if (pattern.test(combined)) return true;
    }
    
    const nonSpecKeys = [
      'help', 'support', 'policies', 'customer care', 'shipping', 'return', 'exchange',
      'sizing', 'guide', 'track', 'contact', 'buying guide', 'how to', 'care instructions',
      'celebrities', 'myths', 'sustainable', 'faux', 'real leather', 'italian leather',
      'buying guides', 'how to\'s', 'how tos', 'customer care station', 'support & policies',
      'shipping policy', 'return and exchange', 'sizing guide', 'track your order',
      'start a return', 'contact us', 'celebrities & leather', 'what is italian leather',
      'myths about', 'shopping online vs offline', 'lambskin vs cowhide', 'keanu reeves',
      'nvidia ceo', 'wilsons vs angel', 'faux leather vs real', 'beckham', 'remove wrinkles',
      'remove smell', 'how to care letterman', 'how to care suede', 'how to care faux',
      'how to care leather skirt', 'how to identify real leather'
    ];
    
    return nonSpecKeys.some(nonSpecKey => keyLower.includes(nonSpecKey) || valueLower.includes(nonSpecKey));
  };

  // Filter out questions and informational content from specifications, and rename bullet specs
  const cleanSpecs = product.specifications 
    ? (() => {
        const cleaned: Record<string, string> = {};
        const usedNames = new Set<string>();
        
        for (const [key, value] of Object.entries(product.specifications)) {
          const valueStr = String(value);
          
          // Skip questions and informational content
          if (isQuestion(valueStr) || isInformationalContent(key, valueStr)) {
            continue;
          }
          
          // Check if key contains __bullet__ pattern
          let finalKey = key;
          if (key.includes('__bullet__') || /^__\w+__\d*$/i.test(key)) {
            // Generate a clear name from the value
            let newName = generateSpecName(valueStr);
            
            // Ensure uniqueness
            let counter = 1;
            while (usedNames.has(newName) || cleaned[newName]) {
              newName = `${generateSpecName(valueStr)} ${counter}`;
              counter++;
            }
            
            finalKey = newName;
            usedNames.add(finalKey);
          }
          
          cleaned[finalKey] = valueStr;
        }
        
        return cleaned;
      })()
    : {};
  
  // Get FAQs from product, filtering out informational content
  const productFAQs = Array.isArray((product as any).faqs) 
    ? (product as any).faqs.filter((faq: string) => !isInformationalContent('', String(faq)))
    : [];
  
  // Also extract questions from specifications (but NOT informational content)
  const questionsFromSpecs = product.specifications
    ? Object.entries(product.specifications)
        .filter(([key, value]) => {
          const valueStr = String(value);
          // Only include genuine questions, NOT informational content
          return isQuestion(valueStr) && !isInformationalContent(key, valueStr);
        })
        .map(([_, value]) => {
          let q = String(value).trim();
          if (!q.endsWith('?')) q += '?';
          return q;
        })
    : [];
  
  // Filter out any informational content from FAQs
  const allFAQs = Array.from(new Set([...productFAQs, ...questionsFromSpecs]))
    .filter(faq => !isInformationalContent('', String(faq)));

  const images = product.images && product.images.length > 0 ? product.images : [product.image];
  const sizes = ['XS', 'S', 'M', 'L', 'XL'];
  const colors = ['Black', 'White', 'Blue', 'Red'];

  return (
    <div className="min-h-screen bg-gray-50 ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {isEditMode ? (
              <div className="p-5 bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl border border-rose-100">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">Product Images</h4>
                  <button
                    type="button"
                    onClick={() => {
                      const newImages = [...(editFormData.images || []), ''];
                      setEditFormData({ ...editFormData, images: newImages });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm font-medium"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Add Image
                  </button>
                </div>
                <div className="space-y-3">
                  {(editFormData.images || []).map((imageUrl: string, index: number) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={imageUrl}
                          onChange={(e) => {
                            const newImages = [...(editFormData.images || [])];
                            newImages[index] = e.target.value;
                            setEditFormData({ ...editFormData, images: newImages });
                          }}
                          placeholder="Image URL"
                          className="w-full px-4 py-2.5 border-2 border-rose-200 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all bg-white text-gray-900 placeholder-gray-400"
                        />
                        {imageUrl && (
                          <div className="mt-2 relative w-full h-32 rounded-lg overflow-hidden border-2 border-rose-200">
                            <Image
                              src={imageUrl}
                              alt={`Preview ${index + 1}`}
                              fill
                              className="object-cover"
                              loader={cdnImageLoader}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newImages = [...(editFormData.images || [])];
                              [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];
                              setEditFormData({ ...editFormData, images: newImages });
                            }}
                            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            title="Move up"
                          >
                            <MoveUp className="h-4 w-4" />
                          </button>
                        )}
                        {index < (editFormData.images || []).length - 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newImages = [...(editFormData.images || [])];
                              [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
                              setEditFormData({ ...editFormData, images: newImages });
                            }}
                            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            title="Move down"
                          >
                            <MoveDown className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = (editFormData.images || []).filter((_: string, i: number) => i !== index);
                            setEditFormData({ ...editFormData, images: newImages });
                          }}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          title="Remove image"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!editFormData.images || editFormData.images.length === 0) && (
                    <p className="text-sm text-gray-500 italic text-center py-4">No images added. Click "Add Image" to add one.</p>
                  )}
                  {editFormData.images && editFormData.images.length > 0 && (
                    <div className="mt-4 p-3 bg-rose-100 rounded-lg">
                      <p className="text-xs text-gray-600">
                        <strong>Note:</strong> The first image will be set as the main product image.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Main Image */}
                <div className="aspect-square overflow-hidden rounded-xl bg-white  shadow-lg border border-gray-200 ">
                  <Image
                    src={images[selectedImage]}
                    alt={product.name}
                    width={600}
                    height={600}
                    loader={cdnImageLoader}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                
                {/* Thumbnail Images */}
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-3">
                    {images.map((image: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`aspect-square overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                          selectedImage === index 
                            ? 'border-blue-500 ring-2 ring-blue-200 ' 
                            : 'border-gray-200  hover:border-gray-300 '
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          width={150}
                          height={150}
                          loader={cdnImageLoader}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

        {/* Product Info */}
        <div className="space-y-6 bg-white  p-6 rounded-xl shadow-lg border border-gray-200 ">
          {/* Edit Button for Super Admin */}
          {isSuperAdmin && (
            <div className="flex justify-end mb-6">
              {!isEditMode ? (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <Edit className="h-4 w-4" />
                  Edit Product
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Brand and Name */}
          <div>
            {isEditMode ? (
              <div className="space-y-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Brand</label>
                  <BrandSelect
                    value={editFormData.brand || ''}
                    onChange={(value) => setEditFormData({ ...editFormData, brand: value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Product Name</label>
                  <input
                    type="text"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white text-gray-900 placeholder-gray-400"
                    placeholder="Enter product name"
                  />
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500  mb-2 font-medium uppercase tracking-wide">{product.brand}</p>
                <h1 className="text-3xl font-bold text-gray-900  mb-4">{product.name}</h1>
              </>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.floor(product.rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300 '
                  }`}
                />
              ))}
            </div>
            <span className="text-gray-600  font-medium">
              {product.rating} ({product.reviewCount} reviews)
            </span>
          </div>

          {/* Price */}
          {isEditMode ? (
            <div className="space-y-4 p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.price || 0}
                  onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-emerald-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Original Price ($) - Optional</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.originalPrice || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, originalPrice: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-emerald-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all bg-white text-gray-900 placeholder-gray-400"
                  placeholder="Leave empty if no discount"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <span className="text-3xl font-bold text-gray-900 ">${product.price}</span>
              {product.originalPrice && (
                <span className="text-xl text-gray-500  line-through">${product.originalPrice}</span>
              )}
              {product.originalPrice && (
                <span className="bg-red-100  text-red-800  text-sm font-bold px-3 py-1 rounded-full">
                  Save ${(product.originalPrice - product.price).toFixed(2)}
                </span>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Description</h3>
            {isEditMode ? (
              <div className="space-y-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Description (Plain Text)</label>
                  <textarea
                    value={editFormData.description || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white text-gray-900 placeholder-gray-400 resize-y"
                    placeholder="Enter product description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Description (HTML) - Optional</label>
                  <textarea
                    value={editFormData.descriptionHtml || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, descriptionHtml: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white text-gray-900 placeholder-gray-400 font-mono text-sm resize-y"
                    placeholder="HTML content for rich formatting"
                  />
                </div>
              </div>
            ) : (
              <>
                {product.descriptionHtml && product.descriptionHtml.trim() !== "" ? (
                  <div
                    className="prose max-w-none mt-4 text-gray-600"
                    dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
                  />
                ) : (
                  <p className="text-gray-600 leading-relaxed">{product.description}</p>
                )}
              </>
            )}
          </div>

          {/* Additional Edit Fields for Super Admin */}
          {isEditMode && (
            <div className="space-y-6 pt-6 border-t-2 border-gray-200">
              <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Product Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Category</label>
                    <select
                      value={editFormData.category || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-amber-200 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all bg-white text-gray-900"
                    >
                      <option value="Men">Men</option>
                      <option value="Women">Women</option>
                      <option value="Office & Travel">Office & Travel</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Gifting">Gifting</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Product Type</label>
                    <input
                      type="text"
                      value={editFormData.productType || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, productType: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-amber-200 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all bg-white text-gray-900 placeholder-gray-400"
                      placeholder="e.g., Leather Jacket, Suede Jacket"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Stock Count</label>
                    <input
                      type="number"
                      value={editFormData.stockCount || 0}
                      onChange={(e) => setEditFormData({ ...editFormData, stockCount: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-amber-200 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Status</label>
                    <select
                      value={editFormData.status || 'published'}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-amber-200 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all bg-white text-gray-900"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">In Stock</label>
                    <select
                      value={editFormData.inStock ? 'true' : 'false'}
                      onChange={(e) => setEditFormData({ ...editFormData, inStock: e.target.value === 'true' })}
                      className="w-full px-4 py-2.5 border-2 border-amber-200 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all bg-white text-gray-900"
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={editFormData.tags || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-amber-200 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all bg-white text-gray-900 placeholder-gray-400"
                      placeholder="e.g., leather, jacket, men"
                    />
                  </div>
                </div>
              </div>

              {/* Specifications Editor */}
              <div className="p-5 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border border-cyan-100">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">Specifications</h4>
                  <div className="flex items-center gap-2">
                    {isSuperAdmin && (
                      <button
                        type="button"
                        onClick={handleGenerateSpecs}
                        disabled={isGeneratingSpecs}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Generate specifications from product title and description"
                      >
                        {isGeneratingSpecs ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Generate Specs
                          </>
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const newSpecs = { ...(editFormData.specifications || {}), '': '' };
                        setEditFormData({ ...editFormData, specifications: newSpecs });
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add Specification
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {Object.entries(editFormData.specifications || {}).map(([key, value], index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => {
                          const newSpecs = { ...editFormData.specifications };
                          const oldValue = newSpecs[key];
                          delete newSpecs[key];
                          newSpecs[e.target.value] = oldValue;
                          setEditFormData({ ...editFormData, specifications: newSpecs });
                        }}
                        placeholder="Specification name"
                        className="flex-1 px-4 py-2.5 border-2 border-cyan-200 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all bg-white text-gray-900 placeholder-gray-400"
                      />
                      <input
                        type="text"
                        value={value as string}
                        onChange={(e) => {
                          const newSpecs = { ...editFormData.specifications };
                          newSpecs[key] = e.target.value;
                          setEditFormData({ ...editFormData, specifications: newSpecs });
                        }}
                        placeholder="Specification value"
                        className="flex-1 px-4 py-2.5 border-2 border-cyan-200 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all bg-white text-gray-900 placeholder-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newSpecs = { ...editFormData.specifications };
                          delete newSpecs[key];
                          setEditFormData({ ...editFormData, specifications: newSpecs });
                        }}
                        className="px-3 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        title="Remove specification"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {(!editFormData.specifications || Object.keys(editFormData.specifications).length === 0) && (
                    <p className="text-sm text-gray-500 italic text-center py-4">No specifications added. Click "Add Specification" to add one.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Size Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900 ">Size</h3>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 border-2 rounded-lg font-medium transition-all duration-200 ${
                    selectedSize === size
                      ? 'border-blue-500 bg-blue-50  text-blue-700  ring-2 ring-blue-200 '
                      : 'border-gray-300  hover:border-gray-400  text-gray-700  hover:bg-gray-50 '
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900 ">Color</h3>
            <div className="flex flex-wrap gap-2">
              {['Black','White','Blue','Red'].map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-4 py-2 border-2 rounded-lg font-medium transition-all duration-200 ${
                    selectedColor === color
                      ? 'border-blue-500 bg-blue-50  text-blue-700  ring-2 ring-blue-200 '
                      : 'border-gray-300  hover:border-gray-400  text-gray-700  hover:bg-gray-50 '
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900 ">Quantity</h3>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 border-2 border-gray-300  rounded-lg hover:bg-gray-50  transition-colors"
              >
                <Minus className="h-4 w-4 text-gray-600 " />
              </button>
              <span className="text-lg font-medium w-12 text-center text-gray-900 ">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
                className="p-2 border-2 border-gray-300  rounded-lg hover:bg-gray-50  transition-colors"
              >
                <Plus className="h-4 w-4 text-gray-600 " />
              </button>
            </div>
            <p className="text-sm text-gray-500  mt-2 font-medium">
              {product.stockCount} items in stock
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className="flex-1 bg-blue-600 hover:bg-blue-700   text-white py-3 px-6 rounded-lg font-semibold disabled:bg-gray-300  disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              <span>{product.inStock ? 'Add to Cart' : 'Out of Stock'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={async () => {
                try {
                  const res = await toggleWishlist(product._id as any);
                  setIsLiked(res === 'added');
                } catch {}
              }}
              className="p-3 border-2 border-gray-300  rounded-lg hover:bg-gray-50  transition-colors"
            >
              <Heart className={`h-6 w-6 ${(isLiked || isInWishlist(product._id as any)) ? 'fill-red-500 text-red-500' : 'text-gray-400 '}`} />
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200 ">
            <div className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-blue-600 " />
              <span className="text-sm text-gray-600  font-medium">Free Shipping</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600 " />
              <span className="text-sm text-gray-600  font-medium">Secure Payment</span>
            </div>
            <div className="flex items-center space-x-2">
              <RotateCcw className="h-5 w-5 text-blue-600 " />
              <span className="text-sm text-gray-600  font-medium">Easy Returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Specifications */}
      {(!cleanSpecs || Object.keys(cleanSpecs).length === 0) && isSuperAdmin && (
        <div className="mt-24 mb-16">
          <div className="text-center mb-12 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 rounded-2xl mb-6 shadow-lg">
              <Package className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-4 tracking-tight">
              Product <span className="bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 bg-clip-text text-transparent">Specifications</span>
            </h2>
            <p className="text-gray-600 text-xl max-w-2xl mx-auto leading-relaxed mb-6">
              No specifications available yet. Generate them automatically from the product title and description.
            </p>
            <button
              onClick={handleGenerateSpecs}
              disabled={isGeneratingSpecs}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              title="Generate specifications from product title and description"
            >
              {isGeneratingSpecs ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Generating Specifications...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate Specifications
                </>
              )}
            </button>
          </div>
        </div>
      )}
      {cleanSpecs && Object.keys(cleanSpecs).length > 0 && (
        <div className="mt-24 mb-16">
          {/* Header Section */}
          <div className="text-center mb-12 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl mb-6 shadow-lg">
              <Package className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-4 tracking-tight">
              Product <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">Specifications</span>
            </h2>
            <p className="text-gray-600 text-xl max-w-2xl mx-auto leading-relaxed mb-4">
              Comprehensive details to help you make an informed decision
            </p>
            {isSuperAdmin && (
              <button
                onClick={handleGenerateSpecs}
                disabled={isGeneratingSpecs}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                title="Generate additional specifications from product title and description"
              >
                {isGeneratingSpecs ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate More Specs
                  </>
                )}
              </button>
            )}
          </div>
          
          {/* Specifications Grid */}
          <div className="max-w-7xl mx-auto px-4">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-2xl border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(cleanSpecs).map(([key, value]: any, index) => {
                  // Format key for better display
                  const formattedKey = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase())
                    .trim();
                  
                  // Check if it's a material-related specification
                  const isMaterial = key.toLowerCase().includes('material') || 
                                    key.toLowerCase().includes('fabric') ||
                                    key.toLowerCase().includes('leather') ||
                                    key.toLowerCase().includes('composition') ||
                                    key.toLowerCase().includes('fiber') ||
                                    key.toLowerCase().includes('textile') ||
                                    key.toLowerCase().includes('suede') ||
                                    key.toLowerCase().includes('wool') ||
                                    key.toLowerCase().includes('cotton') ||
                                    key.toLowerCase().includes('polyester');
                  
                  // Check if it's a dimension-related specification
                  const isDimension = key.toLowerCase().includes('dimension') ||
                                     key.toLowerCase().includes('size') ||
                                     key.toLowerCase().includes('weight') ||
                                     key.toLowerCase().includes('length') ||
                                     key.toLowerCase().includes('width') ||
                                     key.toLowerCase().includes('height') ||
                                     key.toLowerCase().includes('depth') ||
                                     key.toLowerCase().includes('thickness') ||
                                     key.toLowerCase().includes('measurement');
                  
                  // Check if it's a care instruction
                  const isCare = key.toLowerCase().includes('care') ||
                                key.toLowerCase().includes('washing') ||
                                key.toLowerCase().includes('maintenance') ||
                                key.toLowerCase().includes('cleaning') ||
                                key.toLowerCase().includes('dry') ||
                                key.toLowerCase().includes('iron');
                  
                  // Check if it's brand/model info
                  const isBrand = key.toLowerCase().includes('brand') ||
                                 key.toLowerCase().includes('manufacturer') ||
                                 key.toLowerCase().includes('model') ||
                                 key.toLowerCase().includes('sku');
                  
                  // Check if it's color-related
                  const isColor = key.toLowerCase().includes('color') ||
                                 key.toLowerCase().includes('colour');
                  
                  // Determine icon and colors based on type
                  let Icon, bgGradient, borderColor, badgeColor, badgeText, iconBg;
                  
                  if (isMaterial) {
                    Icon = Package;
                    bgGradient = 'from-amber-50 via-orange-50 to-yellow-50';
                    borderColor = 'border-amber-200 hover:border-amber-400';
                    badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
                    badgeText = 'Material';
                    iconBg = 'bg-gradient-to-br from-amber-400 to-orange-500';
                  } else if (isDimension) {
                    Icon = Ruler;
                    bgGradient = 'from-blue-50 via-indigo-50 to-purple-50';
                    borderColor = 'border-blue-200 hover:border-blue-400';
                    badgeColor = 'bg-blue-100 text-blue-800 border-blue-300';
                    badgeText = 'Dimension';
                    iconBg = 'bg-gradient-to-br from-blue-400 to-indigo-500';
                  } else if (isCare) {
                    Icon = Sparkles;
                    bgGradient = 'from-green-50 via-emerald-50 to-teal-50';
                    borderColor = 'border-green-200 hover:border-green-400';
                    badgeColor = 'bg-green-100 text-green-800 border-green-300';
                    badgeText = 'Care';
                    iconBg = 'bg-gradient-to-br from-green-400 to-emerald-500';
                  } else if (isColor) {
                    Icon = Droplet;
                    bgGradient = 'from-pink-50 via-rose-50 to-red-50';
                    borderColor = 'border-pink-200 hover:border-pink-400';
                    badgeColor = 'bg-pink-100 text-pink-800 border-pink-300';
                    badgeText = 'Color';
                    iconBg = 'bg-gradient-to-br from-pink-400 to-rose-500';
                  } else if (isBrand) {
                    Icon = CheckCircle2;
                    bgGradient = 'from-purple-50 via-pink-50 to-fuchsia-50';
                    borderColor = 'border-purple-200 hover:border-purple-400';
                    badgeColor = 'bg-purple-100 text-purple-800 border-purple-300';
                    badgeText = 'Brand';
                    iconBg = 'bg-gradient-to-br from-purple-400 to-pink-500';
                  } else {
                    Icon = Package;
                    bgGradient = 'from-gray-50 via-slate-50 to-zinc-50';
                    borderColor = 'border-gray-200 hover:border-emerald-300';
                    badgeColor = 'bg-gray-100 text-gray-800 border-gray-300';
                    badgeText = 'Detail';
                    iconBg = 'bg-gradient-to-br from-gray-400 to-slate-500';
                  }
                  
                  return (
                    <div 
                      key={key}
                      className={`group relative overflow-hidden bg-gradient-to-br ${bgGradient} rounded-2xl border-2 ${borderColor} p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Icon Badge */}
                      <div className="flex items-start justify-between mb-4">
                        <div className={`${iconBg} p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border-2 ${badgeColor} shadow-sm`}>
                          {badgeText}
                        </span>
                      </div>
                      
                      {/* Content */}
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-emerald-700 transition-colors">
                          {formattedKey}
                        </h3>
                        <p className="text-gray-700 text-sm leading-relaxed break-words line-clamp-3">
                          {typeof value === 'string' ? value : JSON.stringify(value)}
                        </p>
                      </div>
                      
                      {/* Decorative Elements */}
                      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                      <div className="absolute top-0 right-0 w-32 h-32 opacity-5 group-hover:opacity-10 transition-opacity">
                        <div className={`w-full h-full bg-gradient-to-br ${iconBg.replace('from-', 'from-').replace('to-', 'to-')} rounded-full blur-3xl`}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            
              {/* Quality Assurance Section */}
              <div className="mt-12 pt-10 border-t-2 border-gray-200">
                <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl p-8 border-2 border-emerald-200 shadow-lg relative overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-0 left-0 w-40 h-40 bg-emerald-400 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-0 w-60 h-60 bg-teal-400 rounded-full translate-x-1/2 translate-y-1/2"></div>
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-2xl shadow-lg">
                          <Shield className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                          Quality Assurance
                        </h3>
                        <p className="text-gray-700 text-base leading-relaxed">
                          All specifications are verified and accurate. Our team ensures every detail is carefully checked. For questions about specific details, please contact our customer service team.
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-emerald-700 font-semibold">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="text-sm">Verified Product Information</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product FAQs Section */}
      {allFAQs.length > 0 && (
        <div className="mt-24 mb-16">
          <div className="text-center mb-12 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl mb-6 shadow-lg">
              <HelpCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-4 tracking-tight">
              Frequently Asked <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Questions</span>
            </h2>
            <p className="text-gray-600 text-xl max-w-2xl mx-auto leading-relaxed">
              Find answers to common questions about this product
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-200">
              <div className="space-y-3">
                {allFAQs.map((faq, index) => {
                  // Generate a helpful answer based on the question and product info
                  const generateAnswer = (question: string): string => {
                    const qLower = question.toLowerCase();
                    
                    // Material-related questions
                    if (qLower.includes('material') || qLower.includes('leather') || qLower.includes('fabric')) {
                      const material = cleanSpecs.Material || cleanSpecs.material || product.brand || 'premium materials';
                      return `This product is crafted from ${material}. You can find detailed material information in the product specifications section above. The quality and composition ensure durability and comfort.`;
                    }
                    
                    // Size-related questions
                    if (qLower.includes('size') || qLower.includes('fit') || qLower.includes('dimension')) {
                      const size = cleanSpecs.Size || cleanSpecs.size;
                      return size 
                        ? `This product is available in ${size}. Please refer to the size guide in the specifications section for detailed measurements and fit information.`
                        : `Size information is available in the product specifications above. We recommend checking the detailed measurements to ensure the perfect fit.`;
                    }
                    
                    // Care/maintenance questions
                    if (qLower.includes('care') || qLower.includes('clean') || qLower.includes('maintain') || qLower.includes('wash')) {
                      return `Proper care instructions are essential for maintaining this product's quality. Please refer to the care instructions in the product specifications section. For best results, follow the recommended cleaning and maintenance guidelines.`;
                    }
                    
                    // Quality/durability questions
                    if (qLower.includes('quality') || qLower.includes('durable') || qLower.includes('last') || qLower.includes('premium')) {
                      const quality = cleanSpecs.Quality || cleanSpecs.quality || 'high-quality';
                      return `This product is made with ${quality} standards to ensure longevity and satisfaction. The quality details are outlined in the product specifications section above.`;
                    }
                    
                    // Color-related questions
                    if (qLower.includes('color') || qLower.includes('colour')) {
                      const color = cleanSpecs.Color || cleanSpecs.color;
                      return color 
                        ? `This product is available in ${color}. Color information and options can be found in the product specifications above.`
                        : `Color details are available in the product specifications section. Please refer to the product images for accurate color representation.`;
                    }
                    
                    // Feature-related questions
                    if (qLower.includes('feature') || qLower.includes('include') || qLower.includes('come with')) {
                      const features = cleanSpecs.Features || cleanSpecs.features;
                      return features 
                        ? `This product includes: ${features}. For a complete list of features and specifications, please see the detailed specifications section above.`
                        : `This product includes various features designed for your needs. Please refer to the product specifications section for a complete list of features and benefits.`;
                    }
                    
                    // General/default answer
                    return `Based on the product information, you can find relevant details in the product specifications section above. For additional assistance or specific inquiries, please don't hesitate to contact our customer service team.`;
                  };
                  
                  const answer = generateAnswer(faq);
                  
                  return (
                    <div
                      key={index}
                      className="border border-blue-200 rounded-xl overflow-hidden hover:border-blue-400 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/50"
                    >
                      <button
                        onClick={() => setOpenFAQIndex(openFAQIndex === index ? null : index)}
                        className="w-full px-6 py-5 flex items-center justify-between text-left group"
                        aria-expanded={openFAQIndex === index}
                      >
                        <span className="font-semibold text-gray-900 pr-4 text-base leading-snug group-hover:text-blue-700 transition-colors">
                          {faq}
                        </span>
                        <div className="flex-shrink-0">
                          {openFAQIndex === index ? (
                            <ChevronUp className="h-5 w-5 text-blue-600 transition-transform" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-blue-600 transition-transform" />
                          )}
                        </div>
                      </button>
                      {openFAQIndex === index && (
                        <div className="px-6 pb-5 pt-0 bg-white border-t border-blue-100 animate-in slide-in-from-top-2 duration-200">
                          <div className="pt-4">
                            <p className="text-gray-700 leading-relaxed text-[15px]">
                              {answer}
                            </p>
                            {Object.keys(cleanSpecs).length > 0 && (
                              <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium text-gray-900">Tip:</span> Check the Product Specifications section above for detailed technical information and complete product details.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Help Section */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      <span className="font-semibold text-gray-900">Need more help?</span> If you have additional questions or need personalized assistance, please contact our customer service team. We're here to help you find the perfect product.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Related Products */}
                  <div className="mt-16">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                Related <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Products</span>
              </h2>
              <p className="text-gray-600 mb-8">You might also like</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products
                  .filter(p => p._id !== product._id && p.category === product.category)
                  .slice(0, 4)
                  .map((relatedProduct: any) => (
              <div 
                key={(relatedProduct._id || relatedProduct.id) as string} 
                onClick={() => handleRelatedProductClick((relatedProduct._id || relatedProduct.id) as string)}
                className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-lg border-2 border-emerald-200 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer group"
              >
                <div className="aspect-square overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-100 relative">
                  <Image
                    src={relatedProduct.image}
                    alt={relatedProduct.name}
                    width={300}
                    height={300}
                    loader={cdnImageLoader}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                    {relatedProduct.name}
                  </h3>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">${relatedProduct.price}</p>
                    {relatedProduct.originalPrice && (
                      <p className="text-sm text-gray-500 line-through">
                        ${relatedProduct.originalPrice}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < Math.floor(relatedProduct.rating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-emerald-600 font-medium ml-2">
                      ({relatedProduct.reviewCount})
                    </span>
                  </div>
                </div>
              </div>
                   ))}
               </div>
             </div>
      </div>

      {/* Reviews Section */}
      <ReviewList productId={productId} />

      {/* Structured Data: Product JSON-LD */}
      <Script id="product-jsonld" type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description,
          image: images,
          sku: product.sku || product._id,
          brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
          offers: {
            "@type": "Offer",
            priceCurrency: "USD",
            price: product.price,
            availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
          }
        }) }} />
    </div>
  );
}

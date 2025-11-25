'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { cdnImageLoader } from '@/lib/imageLoader';
import Link from 'next/link';
import { Star, Heart, Truck, Shield, RotateCcw, Minus, Plus, ArrowRight, ArrowLeft, Edit, Save, X, Trash2, PlusCircle, Image as ImageIcon, MoveUp, MoveDown, Package, Ruler, Droplet, Sparkles, CheckCircle2, HelpCircle, ChevronDown, ChevronUp, ShieldCheck, AlertTriangle, Tag, Cloud, Loader2, ExternalLink, GripVertical } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useProductStore } from '@/store/productStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import { ProductDetailSkeleton } from '@/components/LoadingSkeleton';
import SelectField from '@/components/SelectField';
import BackButton from '@/components/BackButton';
import toast from 'react-hot-toast';
import type { EmailPromoDetails } from '@/types';

// Brand Select Component
function BrandSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [customBrand, setCustomBrand] = useState('');
  const [openSelect, setOpenSelect] = useState(false);

  useEffect(() => {
    // Skip if brands already loaded
    if (brands.length > 0) return;
    
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
  }, [brands.length]);

  const isCustomBrand = value && !brands.includes(value);

  return (
    <div className="space-y-2">
      <SelectField
        options={[
          { value: '', label: loading ? 'Loading brands...' : 'Select a brand' },
          ...brands.map(brand => ({ value: brand, label: brand })),
        ]}
        value={isCustomBrand ? '' : value}
        isOpen={openSelect}
        onOpenChange={setOpenSelect}
        onSelect={(val) => {
          if (val) {
            onChange(val);
            setCustomBrand('');
          }
        }}
        disabled={loading}
      />
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

const PROMO_STORAGE_KEY = 'email-promo-cache';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const searchParams = useSearchParams();
  
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
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null);
  const [isCheckingEtsyPolicies, setIsCheckingEtsyPolicies] = useState(false);
  const [openEditSelect, setOpenEditSelect] = useState<'category' | 'status' | 'inStock' | null>(null);
  const [etsyPolicyResults, setEtsyPolicyResults] = useState<any>(null);
  const [showEtsyResults, setShowEtsyResults] = useState(false);
  const [etsyExportLoading, setEtsyExportLoading] = useState(false);
  const [organizingImages, setOrganizingImages] = useState(false);
  const [promoDetails, setPromoDetails] = useState<EmailPromoDetails | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const aiReview = etsyPolicyResults?.aiReview;
  const getRiskBadgeClass = (riskLevel?: string) => {
    switch ((riskLevel || '').toLowerCase()) {
      case 'low':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'high':
        return 'border-red-200 bg-red-50 text-red-700';
      default:
        return 'border-amber-200 bg-amber-50 text-amber-700';
    }
  };
  const getIssueAccent = (severity?: string) => {
    const level = (severity || '').toLowerCase();
    if (level === 'critical') {
      return 'border-red-200 bg-red-50 text-red-900';
    }
    if (level === 'warning') {
      return 'border-amber-200 bg-amber-50 text-amber-900';
    }
    return 'border-blue-200 bg-blue-50 text-blue-900';
  };
  
  const promoToken = searchParams?.get('promo');

  const persistPromo = (productIdValue: string, promo: EmailPromoDetails) => {
    if (typeof window === 'undefined') return;
    try {
      const cache = window.localStorage.getItem(PROMO_STORAGE_KEY);
      const parsed = cache ? JSON.parse(cache) : {};
      parsed[productIdValue] = promo;
      window.localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(parsed));
    } catch (error) {
      console.warn('[PromoClient] Failed to persist promo cache', error);
    }
  };

  const loadPromoFromCache = (productIdValue: string): EmailPromoDetails | null => {
    if (typeof window === 'undefined') return null;
    try {
      const cache = window.localStorage.getItem(PROMO_STORAGE_KEY);
      if (!cache) return null;
      const parsed = JSON.parse(cache);
      const record = parsed?.[productIdValue];
      if (!record) return null;
      if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
        delete parsed[productIdValue];
        window.localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(parsed));
        return null;
      }
      return record;
    } catch (error) {
      console.warn('[PromoClient] Failed to read promo cache', error);
      return null;
    }
  };

  const { addItem } = useCartStore();
  const { currentProduct, isLoading, error, fetchProduct, fetchProducts, products } = useProductStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { user } = useAuthStore();
  
  const isSuperAdmin = user?.role?.name === 'SUPER_ADMIN';
  const product = currentProduct as any;
  const availableStock =
    product && product.inStock
      ? Math.max(0, typeof product.stockCount === 'number' ? product.stockCount : 0)
      : 0;
  
  useEffect(() => {
    setQuantity((prev) => {
      if (availableStock <= 0) {
        return 0;
      }
      const next = Math.min(Math.max(1, prev), availableStock);
      return next;
    });
  }, [availableStock]);
  
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

  useEffect(() => {
    if (!productId) return;
    const cachedPromo = loadPromoFromCache(productId);
    if (cachedPromo) {
      setPromoDetails(cachedPromo);
    }
  }, [productId]);

  const validatePromoToken = async (token: string) => {
    if (!productId) return;
    try {
      setPromoLoading(true);
      setPromoError(null);
      const response = await fetch(`/api/promotions/validate?token=${token}&productId=${productId}`);
      const data = await response.json();
      if (!response.ok || !data.success) {
        setPromoDetails(null);
        setPromoError(data.error || 'Promo code invalid');
        console.warn('[PromoClient] Promo validation failed', { token, productId, error: data.error });
        return;
      }
      setPromoDetails(data.promo);
      persistPromo(productId, data.promo);
      console.info('[PromoClient] Promo applied', {
        token: data.promo.token,
        productId,
        discountPercent: data.promo.discountPercent,
      });
    } catch (error) {
      console.error('[PromoClient] Promo validation error', error);
      setPromoError('Unable to validate promo at this time.');
    } finally {
      setPromoLoading(false);
    }
  };

  useEffect(() => {
    if (!promoToken || !productId) return;
    validatePromoToken(promoToken);
  }, [promoToken, productId]);

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

      // Validate input data before preparing update
      const price = parseFloat(editFormData.price) || 0;
      const stockCount = parseInt(editFormData.stockCount) || 0;
      
      if (price < 0) {
        toast.error('Price cannot be negative');
        setIsSaving(false);
        return;
      }
      
      if (stockCount < 0) {
        toast.error('Stock count cannot be negative');
        setIsSaving(false);
        return;
      }

      // Prepare update data
      const updateData: any = {
        name: editFormData.name,
        description: editFormData.description,
        descriptionHtml: editFormData.descriptionHtml,
        price: price,
        category: editFormData.category,
        brand: editFormData.brand,
        stockCount: stockCount,
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
        const originalPrice = parseFloat(editFormData.originalPrice);
        if (originalPrice < 0) {
          toast.error('Original price cannot be negative');
          setIsSaving(false);
          return;
        }
        updateData.originalPrice = originalPrice || undefined;
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

      // Handle non-JSON responses
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { error: text || 'Failed to update product' };
      }

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
        // Return early instead of throwing - we've already handled the error
        return;
      }

      toast.success('Product updated successfully');
      setIsEditMode(false);
      // Refresh product data
      fetchProduct(productId);
    } catch (error) {
      console.error('Error updating product:', error);
      // Handle network errors and other unexpected errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error('Network error. Please check your connection and try again.');
      } else if (error instanceof Error) {
        toast.error(error.message || 'Failed to update product');
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEtsyExportStatus = async () => {
    if (!isSuperAdmin || !productId || !currentProduct) {
      if (!isSuperAdmin) {
        toast.error('Super admin access required');
      }
      return;
    }
    try {
      setEtsyExportLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ etsyExported: !currentProduct.etsyExported }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update Etsy export status');
      }
      await fetchProduct(productId);
      toast.success(data.product?.etsyExported ? 'Marked as exported to Etsy' : 'Marked as not exported');
    } catch (error) {
      console.error('Toggle Etsy export status error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update Etsy export status');
    } finally {
      setEtsyExportLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setEditFormData({});
    setDraggedImageIndex(null);
    setDragOverIndex(null);
  };

  const handleImageDragStart = (index: number) => {
    setDraggedImageIndex(index);
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedImageIndex !== null && draggedImageIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleImageDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleImageDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedImageIndex === null || draggedImageIndex === dropIndex) {
      setDraggedImageIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newImages = [...(editFormData.images || [])];
    const draggedImage = newImages[draggedImageIndex];
    newImages.splice(draggedImageIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    setEditFormData({ ...editFormData, images: newImages });

    setDraggedImageIndex(null);
    setDragOverIndex(null);
  };

  const handleImageDragEnd = () => {
    setDraggedImageIndex(null);
    setDragOverIndex(null);
  };

  const handleCheckEtsyPolicies = async () => {
    if (!productId) return;
    
    setIsCheckingEtsyPolicies(true);
    setEtsyPolicyResults(null);
    setShowEtsyResults(false);
    
    try {
      const response = await fetch(`/api/products/${productId}/check-etsy-policies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to check Etsy policies');
        throw new Error(data.error || 'Failed to check Etsy policies');
      }

      setEtsyPolicyResults(data);
      setShowEtsyResults(true);
      
      if (data.summary.isCompliant) {
        toast.success(`✓ Product is Etsy compliant! Score: ${data.score}/100`);
      } else {
        toast.error(`Found ${data.summary.criticalIssues} critical issue(s) and ${data.summary.warnings} warning(s)`);
      }
    } catch (error) {
      console.error('Etsy policy check error:', error);
      toast.error('Failed to check Etsy policies');
    } finally {
      setIsCheckingEtsyPolicies(false);
    }
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

  const handleGenerateTags = async (replaceExisting: boolean = false) => {
    if (!productId || !isSuperAdmin) return;
    
    const currentTagCount = currentProduct.tags?.length || 0;
    
    // If tags are already at 13 and not replacing, show confirmation
    if (currentTagCount >= 13 && !replaceExisting) {
      const confirmed = window.confirm(
        `This product already has ${currentTagCount} tags (Etsy maximum is 13).\n\n` +
        `Would you like to replace all existing tags with newly generated ones?\n\n` +
        `Click OK to replace, or Cancel to keep existing tags.`
      );
      if (confirmed) {
        handleGenerateTags(true);
        return;
      }
      return;
    }
    
    setIsGeneratingTags(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`/api/products/${productId}/generate-tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          useSerpAPI: true,
          replaceExisting: replaceExisting || currentTagCount >= 13
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Your session has expired. Please log in again.');
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        } else if (response.status === 403) {
          toast.error('You do not have permission to generate tags. Super admin access required.');
        } else {
          toast.error(data.error || 'Failed to generate tags');
        }
        throw new Error(data.error || 'Failed to generate tags');
      }

      if (data.success === false && data.message) {
        // Handle case where tags are already at 13
        toast.error(data.message);
        return;
      }

      const addedCount = data.added?.length || 0;
      const totalTags = data.tags?.length || 0;
      
      if (replaceExisting || currentTagCount >= 13) {
        toast.success(`Regenerated ${totalTags} tags. Total: ${totalTags}/13 tags`);
      } else {
        toast.success(`Generated ${addedCount} new tag${addedCount !== 1 ? 's' : ''}. Total: ${totalTags}/13 tags`);
      }
      
      // Refresh product data
      fetchProduct(productId);
      
      // If in edit mode, update the form data
      if (isEditMode) {
        setEditFormData({ ...editFormData, tags: data.tags.join(', ') });
      }
    } catch (error) {
      console.error('Error generating tags:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate tags');
    } finally {
      setIsGeneratingTags(false);
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

  // Fetch related products only when current product is loaded and only fetch a limited set
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const lastProductIdRef = useRef<string | null>(null);
  const lastCategoryRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Only fetch if product ID or category actually changed
    const productId = currentProduct?._id;
    const category = currentProduct?.category;
    
    if (productId && category && 
        (productId !== lastProductIdRef.current || category !== lastCategoryRef.current)) {
      lastProductIdRef.current = productId;
      lastCategoryRef.current = category;
      
      // Only fetch related products from the same category, limit to 4
      fetchProducts({ 
        category: category, 
        limit: 4,
        page: 1 
      }).then(() => {
        // Get products from store after fetch completes
        const storeProducts = useProductStore.getState().products;
        // Filter out current product and limit to 4
        const related = storeProducts
          .filter(p => (p._id || p.id) !== productId)
          .slice(0, 4);
        setRelatedProducts(related);
      }).catch(() => {
        // Silently fail
      });
    }
  }, [currentProduct?._id, currentProduct?.category, fetchProducts]);
  
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
  
  const buildProductWithPromo = () => {
    if (!promoDetails) return product;
    const originalPrice =
      promoDetails.originalPrice ||
      product.originalPrice ||
      product.price;
    return {
      ...product,
      price: promoDetails.discountedPrice,
      originalPrice,
      emailPromo: promoDetails,
    };
  };

  const handleAddToCart = () => {
    if (availableStock <= 0) {
      toast.error('This product is currently out of stock.');
      return;
    }
    const productPayload = { ...buildProductWithPromo(), stockCount: availableStock };
    addItem(productPayload, quantity, selectedSize, selectedColor);
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

  const formatCurrency = (value: number) =>
    Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const displayPrice = promoDetails ? promoDetails.discountedPrice : product.price;
  const comparePrice = promoDetails
    ? promoDetails.originalPrice || product.originalPrice || product.price
    : product.originalPrice;
  const savings =
    comparePrice && displayPrice
      ? Number((comparePrice - displayPrice).toFixed(2))
      : null;

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

  // Combine main image with images array, ensuring main image is first and no duplicates
  const allImages = product.image 
    ? [product.image, ...(product.images || []).filter(img => img && img !== product.image)]
    : (product.images && product.images.length > 0 ? product.images : []);
  const images = allImages.filter(Boolean); // Remove any empty/null values
  const sizes = ['XS', 'S', 'M', 'L', 'XL'];
  const colors = ['Black', 'White', 'Blue', 'Red'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5">
        {/* Back Button */}
        <div className="mb-2 sm:mb-3">
          <BackButton href="/products" variant="with-label" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Product Images */}
          <div className="space-y-2 sm:space-y-3">
            {isEditMode ? (
              <div className="p-3 sm:p-4 bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg border border-rose-100">
                <div className="flex items-center justify-between mb-3">
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
                    <div
                      key={index}
                      draggable
                      onDragStart={() => handleImageDragStart(index)}
                      onDragOver={(e) => handleImageDragOver(e, index)}
                      onDragLeave={handleImageDragLeave}
                      onDrop={(e) => handleImageDrop(e, index)}
                      onDragEnd={handleImageDragEnd}
                      className={`flex gap-2 items-start p-2 rounded-lg border-2 transition-all ${
                        draggedImageIndex === index
                          ? 'opacity-50 border-blue-400 bg-blue-50'
                          : dragOverIndex === index
                          ? 'border-blue-500 bg-blue-100 scale-105'
                          : 'border-transparent hover:border-rose-300 hover:bg-rose-50'
                      }`}
                    >
                      <div
                        className="cursor-move p-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mt-1"
                        title="Drag to reorder"
                      >
                        <GripVertical className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-100 rounded">
                            #{index + 1}
                          </span>
                          {index === 0 && (
                            <span className="text-xs text-blue-600 font-medium px-2 py-1 bg-blue-100 rounded">
                              Main Image
                            </span>
                          )}
                        </div>
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
                          onClick={(e) => e.stopPropagation()}
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
                      <div className="flex flex-col gap-2 flex-shrink-0">
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
                        <strong>Note:</strong> The first image will be set as the main product image. Drag images by the grip icon to reorder them.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Main Image */}
                <div className="aspect-square overflow-hidden rounded-lg bg-white shadow-sm border border-gray-200">
                  <Image
                    src={images[selectedImage]}
                    alt={
                      (product as any).imageAltTexts && (product as any).imageAltTexts[selectedImage]
                        ? (product as any).imageAltTexts[selectedImage]
                        : product.name
                    }
                    width={600}
                    height={600}
                    loader={cdnImageLoader}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                
                {/* Thumbnail Images */}
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
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
                          alt={
                            (product as any).imageAltTexts && (product as any).imageAltTexts[index]
                              ? (product as any).imageAltTexts[index]
                              : `${product.name} ${index + 1}`
                          }
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
        <div className="space-y-3 sm:space-y-4 bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-200">
          {/* Edit Button for Super Admin */}
          {isSuperAdmin && (
            <div className="flex justify-end gap-2 mb-3 sm:mb-4">
              {!isEditMode ? (
                <>
                  <button
                    onClick={async () => {
                      if (!currentProduct?._id) return;
                      if (!confirm('Organize images for this product? This will upload images to Cloudinary.')) return;
                      
                      try {
                        setOrganizingImages(true);
                        const res = await fetch(`/api/admin/products/${currentProduct._id}/organize-images`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' }
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Failed to organize images');
                        toast.success(`Images organized! ${data.stats?.uploaded || 0} uploaded to Cloudinary`);
                        fetchProduct(currentProduct._id); // Refresh product
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : 'Failed to organize images');
                      } finally {
                        setOrganizingImages(false);
                      }
                    }}
                    disabled={organizingImages || !currentProduct?._id}
                    className={`flex items-center gap-2 px-5 py-2.5 text-white rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                      (() => {
                        if (!currentProduct) return 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700';
                        const allImages = [currentProduct.image, ...(currentProduct.images || [])].filter(Boolean);
                        const hasCloudinary = allImages.some((url: string) => 
                          url && (url.includes('cloudinary.com') || url.includes('res.cloudinary.com'))
                        );
                        return hasCloudinary
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                          : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700';
                      })()
                    }`}
                    title={(() => {
                      if (!currentProduct) return 'Organize images in Cloudinary';
                      const allImages = [currentProduct.image, ...(currentProduct.images || [])].filter(Boolean);
                      const hasCloudinary = allImages.some((url: string) => 
                        url && (url.includes('cloudinary.com') || url.includes('res.cloudinary.com'))
                      );
                      return hasCloudinary
                        ? 'Images already organized in Cloudinary'
                        : 'Organize images in Cloudinary';
                    })()}
                  >
                    {organizingImages ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Organizing...
                      </>
                    ) : (
                      <>
                        <Cloud className="h-4 w-4" />
                        {(() => {
                          if (!currentProduct) return 'Organize Images';
                          const allImages = [currentProduct.image, ...(currentProduct.images || [])].filter(Boolean);
                          const hasCloudinary = allImages.some((url: string) => 
                            url && (url.includes('cloudinary.com') || url.includes('res.cloudinary.com'))
                          );
                          return hasCloudinary ? 'Images Organized' : 'Organize Images';
                        })()}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Product
                  </button>
                </>
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
              <div className="space-y-3 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
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
            <div className="space-y-3 p-3 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border border-emerald-100">
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
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <span className="text-3xl font-bold text-gray-900 ">
                  {formatCurrency(displayPrice)}
                </span>
                {comparePrice && comparePrice > displayPrice && (
                  <span className="text-xl text-gray-500 line-through">
                    {formatCurrency(comparePrice)}
                  </span>
                )}
                {savings && savings > 0 && (
                  <span className="bg-red-100 text-red-800 text-sm font-bold px-3 py-1 rounded-full">
                    Save {formatCurrency(savings)}
                  </span>
                )}
              </div>
              {promoDetails && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                    {promoDetails.discountPercent}% email offer applied
                  </span>
                  {promoDetails.expiresAt && (
                    <span className="text-emerald-700">
                      Expires {new Date(promoDetails.expiresAt).toLocaleString()}
                    </span>
                  )}
                  {promoLoading && (
                    <span className="text-xs text-gray-500">Validating offer…</span>
                  )}
                </div>
              )}
              {promoError && (
                <p className="text-sm text-red-600 font-medium">{promoError}</p>
              )}
            </div>
          )}

          {isSuperAdmin && currentProduct && !isEditMode && (
            <div className="flex items-center justify-between rounded-lg border border-purple-200 bg-purple-50/60 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-purple-900">Etsy Export Status</p>
                <p className="text-xs text-purple-700">
                  {currentProduct.etsyExported
                    ? `Exported${currentProduct.etsyExportedAt ? ` on ${new Date(currentProduct.etsyExportedAt).toLocaleDateString()}` : ''}`
                    : 'Not exported yet'}
                </p>
              </div>
              <button
                onClick={handleToggleEtsyExportStatus}
                disabled={etsyExportLoading}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
                  currentProduct.etsyExported
                    ? 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-50'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                } ${etsyExportLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {etsyExportLoading ? (
                  <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                <span>{currentProduct.etsyExported ? 'Unmark Exported' : 'Mark Exported'}</span>
              </button>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Description</h3>
            {isEditMode ? (
              <div className="space-y-3 p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
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
            <div className="space-y-3 sm:space-y-4 pt-4 border-t border-gray-200">
              <div className="p-4 sm:p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Product Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <SelectField
                      label="Category"
                      options={[
                        { value: 'Men', label: 'Men' },
                        { value: 'Women', label: 'Women' },
                        { value: 'Office & Travel', label: 'Office & Travel' },
                        { value: 'Accessories', label: 'Accessories' },
                        { value: 'Gifting', label: 'Gifting' },
                      ]}
                      value={editFormData.category || ''}
                      isOpen={openEditSelect === 'category'}
                      onOpenChange={(open) => setOpenEditSelect(open ? 'category' : null)}
                      onSelect={(value) => setEditFormData({ ...editFormData, category: value })}
                    />
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
                    <SelectField
                      label="Status"
                      options={[
                        { value: 'draft', label: 'Draft' },
                        { value: 'published', label: 'Published' },
                        { value: 'archived', label: 'Archived' },
                      ]}
                      value={editFormData.status || 'published'}
                      isOpen={openEditSelect === 'status'}
                      onOpenChange={(open) => setOpenEditSelect(open ? 'status' : null)}
                      onSelect={(value) => setEditFormData({ ...editFormData, status: value })}
                    />
                  </div>
                  <div>
                    <SelectField
                      label="In Stock"
                      options={[
                        { value: 'true', label: 'Yes' },
                        { value: 'false', label: 'No' },
                      ]}
                      value={editFormData.inStock ? 'true' : 'false'}
                      isOpen={openEditSelect === 'inStock'}
                      onOpenChange={(open) => setOpenEditSelect(open ? 'inStock' : null)}
                      onSelect={(value) => setEditFormData({ ...editFormData, inStock: value === 'true' })}
                    />
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
              <div className="p-4 sm:p-5 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border border-cyan-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">Specifications</h4>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCheckEtsyPolicies}
                      disabled={isCheckingEtsyPolicies}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-colors text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      title="Check if product follows Etsy seller policies"
                    >
                      {isCheckingEtsyPolicies ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span className="hidden sm:inline">Checking...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          <span className="hidden sm:inline">Check Etsy Policies</span>
                          <span className="sm:hidden">Etsy</span>
                        </>
                      )}
                    </button>
                    {isSuperAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={handleGenerateSpecs}
                          disabled={isGeneratingSpecs}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                          title="Generate specifications from product title and description"
                        >
                          {isGeneratingSpecs ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              <span className="hidden sm:inline">Generating...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              <span className="hidden sm:inline">Generate Specs</span>
                              <span className="sm:hidden">Specs</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGenerateTags(false)}
                          disabled={isGeneratingTags}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                          title={
                            (currentProduct.tags?.length || 0) >= 13
                              ? `Product has maximum tags (13/13). Click to regenerate all tags.`
                              : `Generate tags using SerpAPI (Current: ${currentProduct.tags?.length || 0}/13)`
                          }
                        >
                          {isGeneratingTags ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              <span className="hidden sm:inline">Generating...</span>
                            </>
                          ) : (
                            <>
                              <Tag className="h-4 w-4" />
                              <span className="hidden sm:inline">{(currentProduct.tags?.length || 0) >= 13 ? 'Regenerate Tags' : `Generate Tags (${currentProduct.tags?.length || 0}/13)`}</span>
                              <span className="sm:hidden">Tags</span>
                            </>
                          )}
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const newSpecs = { ...(editFormData.specifications || {}), '': '' };
                        setEditFormData({ ...editFormData, specifications: newSpecs });
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">Add Specification</span>
                      <span className="sm:hidden">Add</span>
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {Object.entries(editFormData.specifications || {}).map(([key, value], index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-2 items-start">
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
                        className="flex-1 w-full sm:w-auto px-4 py-2.5 border-2 border-cyan-200 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all bg-white text-gray-900 placeholder-gray-400 text-sm"
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
                        className="flex-1 w-full sm:w-auto px-4 py-2.5 border-2 border-cyan-200 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all bg-white text-gray-900 placeholder-gray-400 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newSpecs = { ...editFormData.specifications };
                          delete newSpecs[key];
                          setEditFormData({ ...editFormData, specifications: newSpecs });
                        }}
                        className="px-3 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shrink-0 w-full sm:w-auto flex items-center justify-center sm:justify-start"
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
                onClick={() => setQuantity(Math.max(availableStock > 0 ? 1 : 0, quantity - 1))}
                className="p-2 border-2 border-gray-300  rounded-lg hover:bg-gray-50  transition-colors"
              >
                <Minus className="h-4 w-4 text-gray-600 " />
              </button>
              <span className="text-lg font-medium w-12 text-center text-gray-900 ">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                className="p-2 border-2 border-gray-300  rounded-lg hover:bg-gray-50  transition-colors"
              >
                <Plus className="h-4 w-4 text-gray-600 " />
              </button>
            </div>
            <p className="text-sm text-gray-500  mt-2 font-medium">
              {availableStock} items in stock
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock || availableStock <= 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700   text-white py-3 px-6 rounded-lg font-semibold disabled:bg-gray-300  disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              <span>{product.inStock && availableStock > 0 ? 'Add to Cart' : 'Out of Stock'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={async () => {
                if (!user) {
                  toast.error('Please sign in to save items to your wishlist');
                  router.push('/login');
                  return;
                }
                try {
                  const res = await toggleWishlist(product._id as any);
                  setIsLiked(res === 'added');
                } catch {
                  toast.error('Unable to update wishlist right now');
                }
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
          <div className="text-center mb-6 sm:mb-8 px-4">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 rounded-xl mb-3 sm:mb-4 shadow-md">
              <Package className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-4 tracking-tight">
              Product <span className="bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 bg-clip-text text-transparent">Specifications</span>
            </h2>
            <p className="text-gray-600 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-4">
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
          <div className="text-center mb-6 sm:mb-8 px-4">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-xl mb-3 sm:mb-4 shadow-md">
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
          
          {/* Specifications Section - Modern Compact Grid Design */}
          <div className="max-w-4xl mx-auto px-3 sm:px-4">
            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
              {/* Compact Grid Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {Object.entries(cleanSpecs).map(([key, value]) => {
                  // Format key for better display
                  const formattedKey = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase())
                    .trim();
                  
                  const keyLower = key.toLowerCase();
                  const specValue = typeof value === 'string' ? value : JSON.stringify(value);
                  
                  // Determine category and color scheme
                  let bgColor = 'bg-gray-50';
                  let borderColor = 'border-gray-200';
                  let keyColor = 'text-gray-700';
                  let valueColor = 'text-gray-900';
                  let dotColor = 'bg-gray-400';
                  
                  if (keyLower.includes('color') || keyLower.includes('colour')) {
                    bgColor = 'bg-pink-50';
                    borderColor = 'border-pink-200';
                    keyColor = 'text-pink-700';
                    valueColor = 'text-pink-900';
                    dotColor = 'bg-pink-400';
                  } else if (
                    keyLower.includes('material') || keyLower.includes('fabric') ||
                    keyLower.includes('leather') || keyLower.includes('composition') ||
                    keyLower.includes('fiber') || keyLower.includes('textile') ||
                    keyLower.includes('lining') || keyLower.includes('suede') ||
                    keyLower.includes('wool') || keyLower.includes('cotton') ||
                    keyLower.includes('polyester')
                  ) {
                    bgColor = 'bg-amber-50';
                    borderColor = 'border-amber-200';
                    keyColor = 'text-amber-700';
                    valueColor = 'text-amber-900';
                    dotColor = 'bg-amber-400';
                  } else if (
                    keyLower.includes('design') || keyLower.includes('style') ||
                    keyLower.includes('pattern') || keyLower.includes('cuffs') ||
                    keyLower.includes('closure') || keyLower.includes('pockets') ||
                    keyLower.includes('collar') || keyLower.includes('sleeve')
                  ) {
                    bgColor = 'bg-blue-50';
                    borderColor = 'border-blue-200';
                    keyColor = 'text-blue-700';
                    valueColor = 'text-blue-900';
                    dotColor = 'bg-blue-400';
                  } else if (
                    keyLower.includes('dimension') || keyLower.includes('size') ||
                    keyLower.includes('weight') || keyLower.includes('length') ||
                    keyLower.includes('width') || keyLower.includes('height') ||
                    keyLower.includes('depth') || keyLower.includes('thickness') ||
                    keyLower.includes('measurement')
                  ) {
                    bgColor = 'bg-indigo-50';
                    borderColor = 'border-indigo-200';
                    keyColor = 'text-indigo-700';
                    valueColor = 'text-indigo-900';
                    dotColor = 'bg-indigo-400';
                  } else if (
                    keyLower.includes('care') || keyLower.includes('washing') ||
                    keyLower.includes('maintenance') || keyLower.includes('cleaning') ||
                    keyLower.includes('dry') || keyLower.includes('iron')
                  ) {
                    bgColor = 'bg-emerald-50';
                    borderColor = 'border-emerald-200';
                    keyColor = 'text-emerald-700';
                    valueColor = 'text-emerald-900';
                    dotColor = 'bg-emerald-400';
                  } else if (
                    keyLower.includes('brand') || keyLower.includes('manufacturer') ||
                    keyLower.includes('model') || keyLower.includes('sku')
                  ) {
                    bgColor = 'bg-purple-50';
                    borderColor = 'border-purple-200';
                    keyColor = 'text-purple-700';
                    valueColor = 'text-purple-900';
                    dotColor = 'bg-purple-400';
                  }
                  
                  return (
                    <div
                      key={key}
                      className={`${bgColor} ${borderColor} border rounded-lg p-2.5 sm:p-3 hover:shadow-sm transition-all`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`${dotColor} w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-semibold ${keyColor} mb-1`}>
                            {formattedKey}
                          </div>
                          <div className={`text-xs sm:text-sm ${valueColor} line-clamp-2 break-words`}>
                            {specValue}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Quality Assurance - Compact Badge */}
              <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-center gap-2">
                <Shield className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-xs font-medium text-gray-700">Quality Assured</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Etsy Policy Check Results */}
      {showEtsyResults && etsyPolicyResults && (
        <div className="mt-24 mb-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-lg p-4 sm:p-5 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-3">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${
                    etsyPolicyResults.summary.isCompliant 
                      ? 'bg-green-100' 
                      : etsyPolicyResults.score >= 60 
                      ? 'bg-yellow-100' 
                      : 'bg-red-100'
                  }`}>
                    {etsyPolicyResults.summary.isCompliant ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Etsy Policy Compliance</h2>
                    <p className="text-sm text-gray-600">Compliance Score: {etsyPolicyResults.score}/100</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEtsyResults(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Compliance Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{etsyPolicyResults.complianceRate}%</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-600">Critical Issues</p>
                  <p className="text-2xl font-bold text-red-600">{etsyPolicyResults.summary.criticalIssues}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-600">Warnings</p>
                  <p className="text-2xl font-bold text-yellow-600">{etsyPolicyResults.summary.warnings}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600">Recommendations</p>
                  <p className="text-2xl font-bold text-blue-600">{etsyPolicyResults.summary.recommendations}</p>
                </div>
              </div>

              {/* Gemini AI Review */}
              {aiReview && (
                <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3 sm:p-4 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase font-semibold text-indigo-700 tracking-wider flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Gemini Etsy Policy Review
                      </p>
                      <h3 className="text-xl font-bold text-gray-900 mt-1">AI Compliance Insights</h3>
                      <p className="text-sm text-gray-600">
                        Powered by {aiReview.model || 'Gemini 2.5 Pro'}
                      </p>
                    </div>
                    {aiReview.handbookUrl && (
                      <Link
                        href={aiReview.handbookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
                      >
                        Open Seller Handbook
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    )}
                  </div>

                  {aiReview.status === 'complete' ? (
                    <div className="space-y-5">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="p-4 bg-white rounded-xl border border-indigo-100">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            AI Score
                          </p>
                          <p className="text-3xl font-black text-gray-900 mt-1">
                            {typeof aiReview.score === 'number' ? aiReview.score : '—'}
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            Gemini compliance estimate
                          </p>
                        </div>
                        <div className="p-4 bg-white rounded-xl border border-indigo-100 space-y-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Risk Level
                          </p>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getRiskBadgeClass(aiReview.riskLevel)}`}
                          >
                            {(aiReview.riskLevel || 'medium').toUpperCase()}
                          </span>
                          <p className="text-sm text-gray-600">
                            {aiReview.summary || 'Gemini did not return a summary.'}
                          </p>
                        </div>
                        <div className="p-4 bg-white rounded-xl border border-indigo-100">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            References
                          </p>
                          <p className="text-sm text-gray-600 mt-2">
                            Gemini cites sections from Etsy&apos;s Seller Handbook. Always double-check
                            before publishing.
                          </p>
                        </div>
                      </div>

                      {aiReview.strengths && aiReview.strengths.length > 0 && (
                        <div className="bg-white rounded-xl border border-emerald-100 p-4">
                          <p className="text-sm font-semibold text-emerald-800 mb-2">
                            What&apos;s already compliant
                          </p>
                          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                            {aiReview.strengths.map((strength: string, idx: number) => (
                              <li key={`ai-strength-${idx}`}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <Shield className="h-4 w-4 text-gray-600" />
                          Gemini Policy Callouts
                        </p>
                        {aiReview.issues && aiReview.issues.length > 0 ? (
                          aiReview.issues.map((issue: any, idx: number) => (
                            <div
                              key={`ai-issue-${idx}`}
                              className={`p-4 rounded-xl border ${getIssueAccent(issue.severity)}`}
                            >
                              <div className="flex flex-col gap-1">
                                <p className="text-sm font-semibold">
                                  [{(issue.policy || 'Unknown Policy').toUpperCase()}]{' '}
                                  {issue.description || 'Gemini did not include a description.'}
                                </p>
                                {issue.fix && (
                                  <p className="text-sm text-gray-700">
                                    <span className="font-medium text-gray-900">Fix:</span> {issue.fix}
                                  </p>
                                )}
                                {issue.handbookReference && (
                                  <p className="text-xs text-gray-600">
                                    Reference: {issue.handbookReference}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900">
                            Gemini did not flag any additional Etsy policy risks.
                          </div>
                        )}
                      </div>

                      {aiReview.nextSteps && aiReview.nextSteps.length > 0 && (
                        <div className="bg-white rounded-xl border border-indigo-100 p-4">
                          <p className="text-sm font-semibold text-gray-900 mb-2">Next steps</p>
                          <ul className="list-decimal pl-5 space-y-1 text-sm text-gray-700">
                            {aiReview.nextSteps.map((step: string, idx: number) => (
                              <li key={`ai-next-${idx}`}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`p-3 rounded-lg border ${
                        aiReview.status === 'skipped'
                          ? 'border-amber-200 bg-amber-50 text-amber-900'
                          : 'border-red-200 bg-red-50 text-red-900'
                      }`}
                    >
                      <p className="text-sm font-semibold">
                        Gemini review {aiReview.status === 'skipped' ? 'unavailable' : 'failed'}.
                      </p>
                      <p className="text-sm">
                        {aiReview.reason ||
                          (aiReview.status === 'skipped'
                            ? 'Add a Gemini API key to enable AI policy reviews.'
                            : 'Gemini could not process this request. Try again later.')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Compliance Status */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Compliance Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className={`p-3 rounded-lg border-2 ${
                    etsyPolicyResults.compliance.title 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex items-center gap-2">
                      {etsyPolicyResults.compliance.title ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <X className="h-5 w-5 text-red-600" />
                      )}
                      <span className="font-medium text-gray-900">Title</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg border-2 ${
                    etsyPolicyResults.compliance.description 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex items-center gap-2">
                      {etsyPolicyResults.compliance.description ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <X className="h-5 w-5 text-red-600" />
                      )}
                      <span className="font-medium text-gray-900">Description</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg border-2 ${
                    etsyPolicyResults.compliance.imageAltText 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-yellow-200 bg-yellow-50'
                  }`}>
                    <div className="flex items-center gap-2">
                      {etsyPolicyResults.compliance.imageAltText ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      )}
                      <span className="font-medium text-gray-900">Image Alt Text</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Violations */}
              {etsyPolicyResults.violations.all.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Issues Found</h3>
                  <div className="space-y-3">
                    {etsyPolicyResults.violations.all.map((violation: any, index: number) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-2 ${
                          violation.severity === 'error'
                            ? 'border-red-200 bg-red-50'
                            : violation.severity === 'warning'
                            ? 'border-yellow-200 bg-yellow-50'
                            : 'border-blue-200 bg-blue-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {violation.severity === 'error' ? (
                            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                          ) : violation.severity === 'warning' ? (
                            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                          ) : (
                            <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className={`font-semibold ${
                              violation.severity === 'error'
                                ? 'text-red-900'
                                : violation.severity === 'warning'
                                ? 'text-yellow-900'
                                : 'text-blue-900'
                            }`}>
                              [{violation.category}] {violation.message}
                            </p>
                            {violation.found && violation.found.length > 0 && (
                              <p className="text-sm text-gray-600 mt-1">
                                Found: {violation.found.slice(0, 3).join(', ')}
                                {violation.found.length > 3 && ` and ${violation.found.length - 3} more`}
                              </p>
                            )}
                            <p className="text-sm text-gray-700 mt-2 font-medium">
                              💡 {violation.recommendation}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {etsyPolicyResults.violations.all.length === 0 && (
                <div className="text-center py-4 sm:py-6">
                  <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <p className="text-xl font-semibold text-gray-900 mb-2">All Clear! ✓</p>
                  <p className="text-gray-600">Your product follows Etsy seller policies.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product FAQs Section */}
      {allFAQs.length > 0 && (
        <div className="mt-24 mb-16">
          <div className="text-center mb-6 sm:mb-8 px-4">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-xl mb-3 sm:mb-4 shadow-md">
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
            <div className="bg-white rounded-lg p-4 sm:p-5 shadow-sm border border-gray-200">
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
              <p className="text-gray-600 mb-4 sm:mb-5">You might also like</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {relatedProducts
                  .map((relatedProduct: any) => (
              <div 
                key={(relatedProduct._id || relatedProduct.id) as string} 
                onClick={() => handleRelatedProductClick((relatedProduct._id || relatedProduct.id) as string)}
                className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg shadow-sm border border-emerald-200 overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
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

      {/* Product Tags Section */}
      {currentProduct.tags && currentProduct.tags.length > 0 && (
        <div className="mt-16 mb-12">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-lg p-4 sm:p-6 shadow-sm border border-indigo-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                  <Tag className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                    Product <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Tags</span>
                  </h2>
                  <p className="text-gray-600 text-sm mt-1 font-medium">
                    {currentProduct.tags.length} tag{currentProduct.tags.length !== 1 ? 's' : ''} for better discoverability
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {currentProduct.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="group relative inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-white rounded-xl border-2 border-indigo-200 hover:border-indigo-400 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-default max-w-full"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    <span className="relative text-xs sm:text-sm font-bold text-gray-800 group-hover:text-indigo-700 transition-colors truncate">
                      #{tag}
                    </span>
                    <div className="relative w-1.5 h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-60 group-hover:opacity-100 transition-opacity shrink-0"></div>
                  </span>
                ))}
              </div>
              
              {isSuperAdmin && (
                <div className="mt-6 pt-6 border-t-2 border-indigo-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {currentProduct.tags.length < 13 ? (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-yellow-100 rounded-lg">
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              Missing {13 - currentProduct.tags.length} tag{13 - currentProduct.tags.length !== 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5">
                              Add more tags to improve search visibility (Etsy allows up to 13 tags)
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleGenerateTags(false)}
                          disabled={isGeneratingTags}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm hover:shadow-md text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isGeneratingTags ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <Tag className="h-4 w-4" />
                              Generate More Tags
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              Maximum tags reached (13/13)
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5">
                              You can regenerate all tags with new ones based on latest search data
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleGenerateTags(true)}
                          disabled={isGeneratingTags}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all shadow-sm hover:shadow-md text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isGeneratingTags ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              Regenerating...
                            </>
                          ) : (
                            <>
                              <Tag className="h-4 w-4" />
                              Regenerate All Tags
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

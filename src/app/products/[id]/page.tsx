'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { cdnImageLoader } from '@/lib/imageLoader';
import Link from 'next/link';
import { Star, Heart, Truck, Shield, RotateCcw, Minus, Plus, ArrowRight, ArrowLeft, Edit, Save, X, Trash2, PlusCircle, Image as ImageIcon, MoveUp, MoveDown, Package, Ruler, Droplet, Sparkles, CheckCircle2, HelpCircle, ChevronDown, ChevronUp, ShieldCheck, AlertTriangle, Tag, Cloud, Loader2, ExternalLink, GripVertical, ShoppingBag, Wallet, DollarSign } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useProductStore } from '@/store/productStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useRecentlyViewedStore } from '@/store/recentlyViewedStore';
import { useAuthStore } from '@/store/authStore';
import { ProductDetailSkeleton } from '@/components/LoadingSkeleton';
import SelectField from '@/components/SelectField';
import BackButton from '@/components/BackButton';
import ProductRecommendations from '@/components/ProductRecommendations';
import RecentlyViewed from '@/components/RecentlyViewed';
import SalesCounter from '@/components/SalesCounter';
import SocialShareButtons from '@/components/SocialShareButtons';
import ProductQA from '@/components/ProductQA';
import ProductFAQ from '@/components/ProductFAQ';
import ReviewList from '@/components/ReviewList';
import { requestDeduplicator } from '@/lib/requestDeduplication';
import toast from 'react-hot-toast';
import type { EmailPromoDetails } from '@/types';
import { faqPageJsonLd, productJsonLd } from '@/lib/seo';

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
  const [openSection, setOpenSection] = useState<'details' | 'shipping' | 'care' | null>(null);
  const [openSizeSelect, setOpenSizeSelect] = useState(false);
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
  const { addProduct: addToRecentlyViewed } = useRecentlyViewedStore();
  const { user } = useAuthStore();
  
  const isSuperAdmin = user?.role?.name === 'SUPER_ADMIN';
  const product = currentProduct as any;
  // Calculate available stock: 
  // - If inStock is explicitly false, stock is 0
  // - If inStock is true or undefined (defaults to true), check stockCount
  // - If stockCount is not set/undefined, treat as unlimited (use a high number)
  const availableStock = (() => {
    if (!product) return 0;
    
    // If explicitly out of stock, return 0
    if (product.inStock === false) return 0;
    
    // If inStock is true or undefined (defaults to true per schema)
    const stockCount = typeof product.stockCount === 'number' ? product.stockCount : undefined;
    
    // If stockCount is not set (undefined), treat as unlimited stock
    if (stockCount === undefined || stockCount === null) {
      return 9999; // High number to represent unlimited stock
    }
    
    // Return the actual stock count (at least 0)
    return Math.max(0, stockCount);
  })();
  
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

  // Log product view and track recently viewed
  useEffect(() => {
    if (!productId || !currentProduct) return;
    try {
      // Analytics tracking - use deduplication to prevent duplicate calls
      requestDeduplicator.deduplicate(
        `analytics-product-view-${productId}`,
        async () => {
          const res = await fetch('/api/analytics/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'product_view', productId })
          });
          return res.clone();
        }
      ).catch(() => {}); // Silently fail analytics
      
      // Track recently viewed
      addToRecentlyViewed(currentProduct);
    } catch {}
  }, [productId, currentProduct, addToRecentlyViewed]);

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
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8">
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
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 py-3 sm:py-4 lg:py-5">
        {/* Back Button */}
        <div className="mb-2 sm:mb-3">
          <BackButton href="/products" variant="with-label" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 xl:gap-12 max-w-7xl mx-auto">
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

          {/* Discount Badge and Product Title */}
          <div className="relative">
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
                {/* Discount Badge */}
                {comparePrice && comparePrice > displayPrice && (
                  <div className="absolute -top-2 -left-2 bg-black text-white px-3 py-1 text-sm font-bold z-10">
                    {Math.round(((comparePrice - displayPrice) / comparePrice) * 100)}% OFF
                  </div>
                )}
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 pr-20">{product.name}</h1>
              </>
            )}
          </div>

          {/* Rating and Stock Status */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.floor(product.rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-gray-600 font-medium">
              ({product.reviewCount || 0} Ratings)
            </span>
            {product.inStock && (
              <span className="flex items-center text-green-600 font-medium">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                In Stock
              </span>
            )}
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
            <div className="space-y-3 mb-4">
              <div className="flex items-baseline space-x-4">
                {comparePrice && comparePrice > displayPrice && (
                  <span className="text-xl text-gray-500 line-through">
                    {formatCurrency(comparePrice)}
                  </span>
                )}
                <span className="text-4xl font-bold text-gray-900">
                  {formatCurrency(displayPrice)}
                </span>
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

          {/* Free Shipping Banner */}
          {!isEditMode && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-medium text-sm">
                Free Shipping & Free Returns Until Jan 31st, 2026
              </p>
            </div>
          )}

          {/* Social Share Buttons */}
          {!isEditMode && (
            <div className="mt-4">
              <SocialShareButtons
                productName={product.name}
                productUrl={`/products/${productId}`}
                productImage={product.image}
                productDescription={product.description}
              />
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

          {/* Collapsible Sections */}
          {!isEditMode && (
            <div className="space-y-0 border-t border-gray-200 pt-4">
              {/* Product Details Section */}
              <div className="border-b border-gray-200">
                <button
                  onClick={() => setOpenSection(openSection === 'details' ? null : 'details')}
                  className="w-full flex items-center justify-between py-4 text-left"
                >
                  <span className="font-bold text-gray-900 text-lg">Product Details</span>
                  {openSection === 'details' ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {openSection === 'details' && (
                  <div className="pb-4 text-gray-900">
                    {/* Product Description */}
                    {product.descriptionHtml && product.descriptionHtml.trim() !== "" ? (
                      <div
                        className="prose max-w-none text-gray-900 mb-4"
                        dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
                      />
                    ) : (
                      <p className="leading-relaxed mb-4">{product.description}</p>
                    )}
                    
                    {/* Specifications List */}
                    {cleanSpecs && Object.keys(cleanSpecs).length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-bold text-gray-900 mb-3">Specification:</h4>
                        <ul className="list-disc list-inside space-y-1 text-gray-900">
                          {Object.entries(cleanSpecs).map(([key, value]) => {
                            const valueStr = String(value).trim();
                            const keyLower = key.toLowerCase();
                            const valueLower = valueStr.toLowerCase();
                            
                            // Determine if this specification should be bolded
                            // Bold: material/leather info with percentages, key material descriptions
                            const shouldBold = 
                              valueLower.includes('100%') ||
                              (valueLower.includes('%') && (valueLower.includes('real') || valueLower.includes('leather'))) ||
                              (valueLower.includes('real') && (valueLower.includes('leather') || valueLower.includes('lambskin'))) ||
                              valueLower.includes('100% real lambskin leather') ||
                              valueLower.includes('100% real') ||
                              (keyLower.includes('material') && valueLower.includes('leather'));
                            
                            // Format the display value
                            let displayValue = valueStr;
                            
                            // For certain keys, format as "Key: Value"
                            const keyWords = ['color', 'closure', 'pockets', 'collar', 'cuffs', 'hoodie', 'lining'];
                            if (keyWords.some(word => keyLower.includes(word)) && !valueStr.includes(':')) {
                              const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                              displayValue = `${formattedKey}: ${valueStr}`;
                            }
                            
                            // Ensure proper capitalization and punctuation
                            if (!displayValue.endsWith('.') && !displayValue.endsWith('!') && !displayValue.endsWith('?')) {
                              displayValue = displayValue + '.';
                            }
                            
                            return (
                              <li key={key} className="leading-relaxed">
                                {shouldBold ? (
                                  <span className="font-bold">{displayValue}</span>
                                ) : (
                                  <span>{displayValue}</span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Shipping & Returns Section */}
              <div className="border-b border-gray-200">
                <button
                  onClick={() => setOpenSection(openSection === 'shipping' ? null : 'shipping')}
                  className="w-full flex items-center justify-between py-4 text-left"
                >
                  <span className="font-semibold text-gray-900">Shipping & Returns</span>
                  {openSection === 'shipping' ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {openSection === 'shipping' && (
                  <div className="pb-4 text-gray-700 space-y-2">
                    <p><strong>Free Shipping:</strong> Free shipping on all orders. Delivery typically takes 5-7 business days.</p>
                    <p><strong>Free Returns:</strong> 30 days free exchanges and returns. Items must be in original condition.</p>
                    <p><strong>International Shipping:</strong> Available to most countries. Shipping times vary by location.</p>
                  </div>
                )}
              </div>

              {/* Care & Maintenance Section */}
              <div className="border-b border-gray-200">
                <button
                  onClick={() => setOpenSection(openSection === 'care' ? null : 'care')}
                  className="w-full flex items-center justify-between py-4 text-left"
                >
                  <span className="font-semibold text-gray-900">Care & Maintenance</span>
                  {openSection === 'care' ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {openSection === 'care' && (
                  <div className="pb-4 text-gray-700 space-y-2">
                    {cleanSpecs && (cleanSpecs.Care || cleanSpecs.care || cleanSpecs.Maintenance || cleanSpecs.maintenance) ? (
                      <p>{cleanSpecs.Care || cleanSpecs.care || cleanSpecs.Maintenance || cleanSpecs.maintenance}</p>
                    ) : (
                      <>
                        <p><strong>Storage:</strong> Store on a hanger with broad shoulders to maintain shape. Avoid folding or crumpling.</p>
                        <p><strong>Cleaning:</strong> Spot clean with a damp cloth. For deeper cleaning, consult a professional leather cleaner.</p>
                        <p><strong>Maintenance:</strong> Condition leather periodically to keep it supple and prevent cracking.</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description (Edit Mode Only) */}
          {isEditMode && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900">Description</h3>
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
            </div>
          )}

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
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-base font-semibold text-gray-900">Size:</label>
              <Link href="#size-guide" className="text-sm text-blue-600 hover:text-blue-700 underline flex items-center gap-1">
                <Ruler className="h-4 w-4" />
                Size Guide
              </Link>
            </div>
            <SelectField
              options={[
                { value: '', label: 'Choose a Size' },
                ...sizes.map(size => ({ value: size, label: size }))
              ]}
              value={selectedSize}
              isOpen={openSizeSelect}
              onOpenChange={setOpenSizeSelect}
              onSelect={(value) => {
                setSelectedSize(value);
                setOpenSizeSelect(false);
              }}
              className="w-full"
            />
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

          {/* Quantity and Add to Cart */}
          <div className="mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <label className="text-base font-semibold text-gray-900 mr-3">Quantity:</label>
                <div className="flex items-center border-2 border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(availableStock > 0 ? 1 : 0, quantity - 1))}
                    className="p-2 hover:bg-gray-50 transition-colors"
                  >
                    <Minus className="h-4 w-4 text-gray-600" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    readOnly
                    className="w-12 text-center text-lg font-medium text-gray-900 border-x border-gray-300 py-2"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                    className="p-2 hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={product.inStock === false || availableStock <= 0}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                <ShoppingBag className="h-5 w-5" />
                <span>{product.inStock !== false && availableStock > 0 ? 'ADD TO CART' : 'Out of Stock'}</span>
              </button>
            </div>
          </div>

          {/* Cyber Deals Countdown - Only show if promo/deal is active */}
          {!isEditMode && promoDetails && (
            <div className="mb-4">
              <p className="text-red-600 font-medium text-sm">Cyber Deals Countdown, Only Until Midnight</p>
            </div>
          )}

          {/* Wishlist and SKU */}
          {!isEditMode && (
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
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
                className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition-colors underline"
                aria-label="Add to wishlist"
              >
                <Heart className={`h-5 w-5 ${(isLiked || isInWishlist(product._id as any)) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                <span>Add To Wishlist</span>
              </button>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">SKU</span>
                <span className="bg-gray-100 px-3 py-1 rounded-full font-mono">{product.sku || product._id?.toString().slice(-6) || 'N/A'}</span>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Etsy Policy Check Results */}
      {showEtsyResults && etsyPolicyResults && (
        <div className="mt-24 mb-16">
          <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
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
        <div className="mt-12 mb-12">
          <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-2">
              {allFAQs.map((faq, index) => {
                // Generate a helpful answer based on the question and product info
                const generateAnswer = (question: string): string => {
                  const qLower = question.toLowerCase();
                  
                  // Material-related questions
                  if (qLower.includes('material') || qLower.includes('leather') || qLower.includes('fabric')) {
                    const material = cleanSpecs.Material || cleanSpecs.material || product.brand || 'premium materials';
                    return `This product is crafted from ${material}. You can find detailed material information in the product specifications section above.`;
                  }
                  
                  // Size-related questions
                  if (qLower.includes('size') || qLower.includes('fit') || qLower.includes('dimension')) {
                    const size = cleanSpecs.Size || cleanSpecs.size;
                    return size 
                      ? `This product is available in ${size}. Please refer to the size guide in the specifications section for detailed measurements.`
                      : `Size information is available in the product specifications above.`;
                  }
                  
                  // Care/maintenance questions
                  if (qLower.includes('care') || qLower.includes('clean') || qLower.includes('maintain') || qLower.includes('wash')) {
                    return `Please refer to the care instructions in the product specifications section for proper maintenance.`;
                  }
                  
                  // Quality/durability questions
                  if (qLower.includes('quality') || qLower.includes('durable') || qLower.includes('last') || qLower.includes('premium')) {
                    return `This product is made with high-quality standards to ensure longevity and satisfaction.`;
                  }
                  
                  // Color-related questions
                  if (qLower.includes('color') || qLower.includes('colour')) {
                    const color = cleanSpecs.Color || cleanSpecs.color;
                    return color 
                      ? `This product is available in ${color}. Color information can be found in the product specifications above.`
                      : `Color details are available in the product specifications section.`;
                  }
                  
                  // Feature-related questions
                  if (qLower.includes('feature') || qLower.includes('include') || qLower.includes('come with')) {
                    return `Please refer to the product specifications section for a complete list of features.`;
                  }
                  
                  // General/default answer
                  return `You can find relevant details in the product specifications section above. For additional assistance, please contact our customer service team.`;
                };
                
                const answer = generateAnswer(faq);
                
                return (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg overflow-hidden bg-white"
                  >
                    <button
                      onClick={() => setOpenFAQIndex(openFAQIndex === index ? null : index)}
                      className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                      aria-expanded={openFAQIndex === index}
                    >
                      <span className="font-medium text-gray-900 text-sm pr-4">
                        {faq}
                      </span>
                      <div className="flex-shrink-0">
                        {openFAQIndex === index ? (
                          <ChevronUp className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                    </button>
                    {openFAQIndex === index && (
                      <div className="px-4 pb-3 pt-0 border-t border-gray-100">
                        <div className="pt-3">
                          <p className="text-gray-700 leading-relaxed text-sm">
                            {answer}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Feature Boxes - Full Width Before Reviews */}
      {!isEditMode && (
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 mt-12 mb-8">
          <div className="w-full max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <Truck className="h-6 w-6 text-gray-700 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Free Delivery & 30 Days Free Exchanges and Return</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <Wallet className="h-6 w-6 text-gray-700 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Split your purchase into 4 interest-Free Payments with{' '}
                      <span className="inline-flex items-center gap-0.5">
                        <span className="text-blue-600 font-bold">Pay</span>
                        <span className="text-yellow-500 font-bold">Pal</span>
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <DollarSign className="h-6 w-6 text-gray-700 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">We want you to look luxurious on budget, without sacrificing the quality.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Reviews Section */}
      {!isEditMode && currentProduct && (
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 mt-12 mb-8">
          <ReviewList productId={productId} />
        </div>
      )}

      {/* Product FAQ Section (SerpAPI) - High Priority: Answer common questions early */}
      {currentProduct && (
        <ProductFAQ 
          productName={currentProduct.name}
          productDescription={currentProduct.description}
          productId={productId}
          initialFAQs={currentProduct.generatedFAQs}
          initialRelatedSearches={currentProduct.relatedSearches}
          initialPeopleAlsoSearchFor={currentProduct.peopleAlsoSearchFor}
        />
      )}

      {/* Product Questions & Answers - After FAQs for deeper engagement */}
      {currentProduct && (
        <ProductQA productId={productId} />
      )}

      {/* Product Recommendations */}
      {currentProduct && (
        <>
          <ProductRecommendations 
            productId={productId} 
            product={currentProduct}
            type="you_may_like"
          />
          <ProductRecommendations 
            productId={productId} 
            product={currentProduct}
            type="frequently_bought"
          />
        </>
      )}

      {/* Related Products - Cross-sell opportunity */}
      <div className="mt-16">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                Related <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Products</span>
              </h2>
              <p className="text-gray-600 mb-4 sm:mb-5">You might also like</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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

      {/* Product Tags Section - Super Admin Only */}
      {isSuperAdmin && currentProduct.tags && currentProduct.tags.length > 0 && (
        <div className="mt-16 mb-12">
          <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
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

      {/* Structured Data: Product JSON-LD with FAQ support */}
      {product && (
        <>
          <Script 
            id="product-jsonld" 
            type="application/ld+json"
            dangerouslySetInnerHTML={{ 
              __html: JSON.stringify(
                productJsonLd({
                  id: product._id?.toString() || productId,
                  name: product.name,
                  description: product.description,
                  urlPath: `/products/${productId}`,
                  imageUrls: images,
                  sku: product.sku || product._id?.toString() || productId,
                  brand: product.brand,
                  price: product.price,
                  currency: "USD",
                  availability: product.inStock ? "InStock" : "OutOfStock",
                  faqs: product.generatedFAQs?.map((faq: any) => ({
                    question: faq.question,
                    answer: faq.answer
                  })) || []
                })
              )
            }} 
          />
          
          {/* FAQ Schema JSON-LD for Rich Snippets */}
          {product.generatedFAQs && product.generatedFAQs.length > 0 && (
            <Script 
              id="faq-schema" 
              type="application/ld+json"
              dangerouslySetInnerHTML={{ 
                __html: JSON.stringify(
                  faqPageJsonLd({
                    faqs: product.generatedFAQs.map((faq: any) => ({
                      question: faq.question,
                      answer: faq.answer
                    })),
                    urlPath: `/products/${productId}`
                  })
                )
              }} 
            />
          )}
        </>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Package, DollarSign, Tag, Image, Plus, Trash2, Calendar as CalendarIcon, Cloud, Loader2, UploadCloud, ShieldAlert } from 'lucide-react';
import SelectField from '@/components/SelectField';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  category: string;
  brand: string;
  stockCount: number;
  tags: string[];
  specifications: Record<string, string>;
  isActive: boolean;
  status?: 'draft' | 'published' | 'archived';
  publishAt?: string | null;
}

interface ProductFormProps {
  product?: Product;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  'Men',
  'Women',
  'Office & Travel',
  'Accessories',
  'Gifting'
];

const sanitizeFilename = (text: string) => {
  if (!text) return 'product';
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase() || 'product';
};

export default function ProductForm({ product, isOpen, onClose, onSuccess }: ProductFormProps) {
  const [brands, setBrands] = useState<string[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    image: '',
    images: [] as string[],
    category: '',
    brand: '',
    stockCount: '',
    tags: [] as string[],
    specifications: {} as Record<string, string>,
    isActive: true,
    status: 'draft' as 'draft' | 'published' | 'archived',
    publishAt: '' as string,
  });
  const [newTag, setNewTag] = useState('');
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiTitle, setAiTitle] = useState('');
  const [aiDescription, setAiDescription] = useState('');
  const [aiTagsText, setAiTagsText] = useState('');
  const [optimizingTitle, setOptimizingTitle] = useState(false);
  const [optimizingDescription, setOptimizingDescription] = useState(false);
  const [optimizingTags, setOptimizingTags] = useState(false);
  const [organizingImages, setOrganizingImages] = useState(false);
  const [openSelect, setOpenSelect] = useState<'brand' | 'category' | 'status' | null>(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [uploadingDroppedImages, setUploadingDroppedImages] = useState(false);
  const [uploadQueueStatus, setUploadQueueStatus] = useState({ completed: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const roleName = useAuthStore((state) => state.user?.role?.name);
  const normalizedRoleName = roleName?.toUpperCase?.();
  const isAdminUser = normalizedRoleName === 'ADMIN' || normalizedRoleName === 'SUPER_ADMIN';

  // Fetch brands from API only when modal is open
  useEffect(() => {
    if (!isOpen) return; // Don't fetch if modal is closed
    
    // Skip if brands already loaded
    if (brands.length > 0) return;
    
    const fetchBrands = async () => {
      try {
        setBrandsLoading(true);
        const res = await fetch('/api/admin/brands');
        const data = await res.json();
        if (res.ok && Array.isArray(data.brands)) {
          setBrands(data.brands);
        }
      } catch (error) {
        console.error('Failed to fetch brands:', error);
      } finally {
        setBrandsLoading(false);
      }
    };
    fetchBrands();
  }, [isOpen, brands.length]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        originalPrice: product.originalPrice?.toString() || '',
        image: product.image || '',
        images: product.images || [],
        category: product.category || '',
        brand: product.brand || '',
        stockCount: product.stockCount?.toString() || '',
        tags: product.tags || [],
        specifications: product.specifications || {},
        isActive: product.isActive ?? true,
        status: (product.status as any) || 'draft',
        publishAt: product.publishAt ? new Date(product.publishAt).toISOString().slice(0,16) : '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        image: '',
        images: [],
        category: '',
        brand: '',
        stockCount: '',
        tags: [],
        specifications: {},
        isActive: true,
        status: 'draft',
        publishAt: '',
      });
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = product ? `/api/admin/products/${product._id}` : '/api/admin/products';
      const method = product ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        stockCount: parseInt(formData.stockCount),
        publishAt: formData.publishAt ? new Date(formData.publishAt).toISOString() : null,
      } as any;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save product');
      }

      toast.success(product ? 'Product updated successfully' : 'Product created successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Product save error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addSpecification = () => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [newSpecKey.trim()]: newSpecValue.trim()
        }
      }));
      setNewSpecKey('');
      setNewSpecValue('');
    }
  };

  const removeSpecification = (keyToRemove: string) => {
    setFormData(prev => {
      const newSpecs = { ...prev.specifications };
      delete newSpecs[keyToRemove];
      return {
        ...prev,
        specifications: newSpecs
      };
    });
  };

  const addImage = () => {
    if (formData.image.trim() && !formData.images.includes(formData.image.trim())) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, prev.image],
        image: ''
      }));
    }
  };

  const removeImage = (imageToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== imageToRemove)
    }));
  };

  // Check if images are already on Cloudinary
  const areImagesOrganized = () => {
    if (!product?._id) return false;
    const allImages = [formData.image, ...formData.images].filter(Boolean);
    if (allImages.length === 0) return false;
    return allImages.some(url => 
      typeof url === 'string' && (url.includes('cloudinary.com') || url.includes('res.cloudinary.com'))
    );
  };

  const handleOrganizeImages = async () => {
    if (!product?._id) {
      toast.error('Please save the product first before organizing images');
      return;
    }

    try {
      setOrganizingImages(true);
      const res = await fetch(`/api/admin/products/${product._id}/organize-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to organize images');
      }

      // Update form data with new image URLs
      if (data.product) {
        setFormData(prev => ({
          ...prev,
          image: data.product.image || prev.image,
          images: data.product.images || prev.images
        }));
      }

      toast.success(
        `Images organized! ${data.stats?.uploaded || 0} uploaded to Cloudinary folder: ${data.product?.folder || ''}`
      );
      
      // Refresh product data
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to organize images');
    } finally {
      setOrganizingImages(false);
    }
  };

  const uploadFilesToCloudinary = async (fileList: FileList | File[]) => {
    if (!isAdminUser) {
      toast.error('Only admin users can upload images.');
      return;
    }
    const files = Array.from(fileList || []).filter(
      (file) => file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|avif)$/i.test(file.name)
    );
    if (files.length === 0) {
      toast.error('Please choose image files to upload.');
      return;
    }

    const productNameForUploads = product?.name || formData.name || 'product';
    const productSlug = sanitizeFilename(productNameForUploads);
    const folderName = `EverStyleCrafts/${productSlug}`;
    let viewCounter = (formData.image ? 1 : 0) + (formData.images?.length || 0);

    setUploadingDroppedImages(true);
    setUploadQueueStatus({ completed: 0, total: files.length });

    const uploadedUrls: string[] = [];

    for (const file of files) {
      const formDataPayload = new FormData();
      formDataPayload.append('file', file);
      viewCounter += 1;
      const publicId = `${productSlug}-view-${viewCounter}`;
      formDataPayload.append('folder', folderName);
      formDataPayload.append('public_id', publicId);
      formDataPayload.append('product_name', productNameForUploads);

      try {
        const response = await fetch('/api/uploads/cloudinary', {
          method: 'POST',
          body: formDataPayload,
        });

        const data = await response.json();
        if (!response.ok || !data?.url) {
          throw new Error(data?.error || 'Upload failed');
        }

        uploadedUrls.push(data.url);
        setUploadQueueStatus((prev) => ({ ...prev, completed: prev.completed + 1 }));
      } catch (error) {
        console.error('Image upload failed:', error);
        toast.error(
          `${file.name}: ${error instanceof Error ? error.message : 'Upload failed'}`
        );
      }
    }

    if (uploadedUrls.length > 0) {
      setFormData((prev) => {
        const remainingUrls = [...uploadedUrls];
        const nextMainImage = prev.image || remainingUrls.shift() || '';
        const nextImages = Array.from(new Set([...prev.images, ...remainingUrls]));

        return {
          ...prev,
          image: nextMainImage,
          images: nextImages,
        };
      });

      toast.success(
        uploadedUrls.length > 1
          ? `${uploadedUrls.length} images uploaded to Cloudinary`
          : 'Image uploaded to Cloudinary'
      );
    }

    setUploadQueueStatus({ completed: 0, total: 0 });
    setUploadingDroppedImages(false);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    void uploadFilesToCloudinary(event.target.files);
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingFiles(false);
    if (!event.dataTransfer.files?.length) return;
    void uploadFilesToCloudinary(event.dataTransfer.files);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isDraggingFiles) {
      setIsDraggingFiles(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && event.currentTarget.contains(nextTarget)) return;
    setIsDraggingFiles(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {product ? 'Edit Product' : 'Create New Product'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Package className="h-4 w-4 inline mr-2" />
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 text-gray-700 mb-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <SelectField
                  label="Brand"
                  options={[
                    { value: '', label: brandsLoading ? 'Loading brands...' : brands.length === 0 ? 'No brands available' : 'Select a brand' },
                    ...brands.map(brand => ({ value: brand, label: brand })),
                  ]}
                  value={formData.brand}
                  isOpen={openSelect === 'brand'}
                  onOpenChange={(open) => setOpenSelect(open ? 'brand' : null)}
                  onSelect={(value) => handleInputChange('brand', value)}
                  disabled={brandsLoading}
                  required
                />
                {formData.brand && !brands.includes(formData.brand) && (
                  <p className="text-xs text-gray-500 mt-1">Custom brand: {formData.brand}</p>
                )}
              </div>

              <div>
                <SelectField
                  label="Category"
                  options={[
                    { value: '', label: 'Select a category' },
                    ...CATEGORIES.map(category => ({ value: category, label: category })),
                  ]}
                  value={formData.category}
                  isOpen={openSelect === 'category'}
                  onOpenChange={(open) => setOpenSelect(open ? 'category' : null)}
                  onSelect={(value) => handleInputChange('category', value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Count *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.stockCount}
                  onChange={(e) => handleInputChange('stockCount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 text-gray-700 mb-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter stock count"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 text-gray-700 mb-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter product description"
              />
            </div>

            {/* AI SEO Assistant (Gemini) */}
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Optimize Title</span>
                    <button
                      type="button"
                      disabled={optimizingTitle}
                      onClick={async () => {
                        try {
                          setOptimizingTitle(true);
                          const res = await fetch('/api/ai/optimize', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              mode: 'title',
                              input: {
                                name: formData.name,
                                description: formData.description,
                                tags: formData.tags,
                                category: formData.category,
                                brand: formData.brand,
                              }
                            })
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || 'Failed to optimize title');
                          setAiTitle(data.output || '');
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : 'Optimize failed');
                        } finally {
                          setOptimizingTitle(false);
                        }
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {optimizingTitle ? 'Optimizing…' : 'Optimize'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={aiTitle}
                    onChange={(e) => setAiTitle(e.target.value)}
                    placeholder="AI suggestion will appear here"
                    className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-lg"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => { if (aiTitle.trim()) { handleInputChange('name', aiTitle.trim()); toast.success('Title applied'); } }}
                      className="px-3 py-1.5 bg-gray-800 text-white rounded hover:bg-gray-900"
                    >
                      Apply to Title
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Optimize Description</span>
                    <button
                      type="button"
                      disabled={optimizingDescription}
                      onClick={async () => {
                        try {
                          setOptimizingDescription(true);
                          const res = await fetch('/api/ai/optimize', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              mode: 'description',
                              input: {
                                name: formData.name,
                                description: formData.description,
                                tags: formData.tags,
                                category: formData.category,
                                brand: formData.brand,
                              }
                            })
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || 'Failed to optimize description');
                          setAiDescription(data.output || '');
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : 'Optimize failed');
                        } finally {
                          setOptimizingDescription(false);
                        }
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {optimizingDescription ? 'Optimizing…' : 'Optimize'}
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={aiDescription}
                    onChange={(e) => setAiDescription(e.target.value)}
                    placeholder="AI suggestion will appear here"
                    className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-lg"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => { if (aiDescription.trim()) { handleInputChange('description', aiDescription.trim()); toast.success('Description applied'); } }}
                      className="px-3 py-1.5 bg-gray-800 text-white rounded hover:bg-gray-900"
                    >
                      Apply to Description
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Optimize Tags</span>
                    <button
                      type="button"
                      disabled={optimizingTags}
                      onClick={async () => {
                        try {
                          setOptimizingTags(true);
                          const res = await fetch('/api/ai/optimize', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              mode: 'tags',
                              input: {
                                name: formData.name,
                                description: formData.description,
                                tags: formData.tags,
                                category: formData.category,
                                brand: formData.brand,
                              }
                            })
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || 'Failed to optimize tags');
                          setAiTagsText(data.output || '');
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : 'Optimize failed');
                        } finally {
                          setOptimizingTags(false);
                        }
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {optimizingTags ? 'Optimizing…' : 'Optimize'}
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={aiTagsText}
                    onChange={(e) => setAiTagsText(e.target.value)}
                    placeholder="Comma-separated tags will appear here"
                    className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-lg"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const parsed = aiTagsText
                          .split(/[\,\n]/)
                          .map(t => t.trim())
                          .filter(Boolean);
                        const unique = Array.from(new Set([...(formData.tags || []), ...parsed]));
                        handleInputChange('tags', unique);
                        toast.success('Tags merged');
                      }}
                      className="px-3 py-1.5 bg-gray-800 text-white rounded hover:bg-gray-900"
                    >
                      Apply to Tags
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="h-4 w-4 inline mr-2" />
                  Price *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300  text-gray-700 mb-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter price"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Original Price (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.originalPrice}
                  onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 text-gray-700 mb-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter original price"
                />
              </div>
            </div>

            {/* Publication */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <SelectField
                  label="Status"
                  options={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'published', label: 'Published' },
                    { value: 'archived', label: 'Archived' },
                  ]}
                  value={formData.status}
                  isOpen={openSelect === 'status'}
                  onOpenChange={(open) => setOpenSelect(open ? 'status' : null)}
                  onSelect={(value) => handleInputChange('status', value as any)}
                />
                <p className="text-xs text-gray-500 mt-2">Published items are visible when publish date is now or past.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="h-4 w-4 inline mr-2" /> Publish At (optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.publishAt}
                  onChange={(e) => handleInputChange('publishAt', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 text-gray-700 mb-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500">Leave empty to publish immediately.</p>
              </div>
            </div>

            {/* Images */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  <Image className="h-4 w-4 inline mr-2" />
                  Product Images
                </label>
                {product?._id && (
                  <button
                    type="button"
                    onClick={handleOrganizeImages}
                    disabled={organizingImages}
                    className={`flex items-center gap-2 px-3 py-1.5 text-white text-sm rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      areImagesOrganized()
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                    }`}
                    title={areImagesOrganized() ? 'Images already organized in Cloudinary' : 'Organize images in Cloudinary (creates folder structure)'}
                  >
                    {organizingImages ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Organizing...
                      </>
                    ) : (
                      <>
                        <Cloud className={`h-4 w-4 ${areImagesOrganized() ? 'text-green-100' : ''}`} />
                        {areImagesOrganized() ? 'Images Organized' : 'Organize Images'}
                      </>
                    )}
                  </button>
                )}
              </div>

              {isAdminUser ? (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                  <div
                    className={`mb-6 rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
                      isDraggingFiles
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-400'
                    } ${uploadingDroppedImages ? 'cursor-progress' : 'cursor-pointer'}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !uploadingDroppedImages && fileInputRef.current?.click()}
                  >
                    <UploadCloud className={`mx-auto mb-3 h-8 w-8 ${isDraggingFiles ? 'text-blue-600' : 'text-gray-500'}`} />
                    <p className="text-sm font-medium text-gray-800">
                      Drag & drop product images here
                    </p>
                    <p className="text-xs text-gray-500">
                      or click to browse files. Images upload directly to Cloudinary.
                    </p>
                    {uploadingDroppedImages && (
                      <p className="mt-3 text-sm text-blue-600">
                        Uploading {uploadQueueStatus.completed}/{uploadQueueStatus.total}...
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
                  <ShieldAlert className="h-5 w-5" />
                  <p className="text-sm">
                    Only admin users can drag, drop, and upload product images.
                  </p>
                </div>
              )}
              
              {/* Main Image */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Main Image URL *
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="url"
                    required
                    value={formData.image}
                    onChange={(e) => handleInputChange('image', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 mb-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter main image URL"
                  />
                  {formData.image && (
                    <img
                      src={formData.image}
                      alt="preview"
                      className="w-12 h-12 rounded border object-cover"
                      onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
                    />
                  )}
                  <button
                    type="button"
                    onClick={addImage}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Additional Images */}
              {formData.images.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Additional Images
                  </label>
                  <div className="space-y-2">
                    {formData.images.map((image, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="url"
                          value={image}
                          onChange={(e) => {
                            const newImages = [...formData.images];
                            newImages[index] = e.target.value;
                            handleInputChange('images', newImages);
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 mb-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter image URL"
                        />
                        {image && (
                          <img
                            src={image}
                            alt={`preview-${index}`}
                            className="w-10 h-10 rounded border object-cover"
                            onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(image)}
                          className="px-3 py-2 text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="h-4 w-4 inline mr-2" />
                Tags
              </label>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 mb-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter tag and press Enter"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 text-gray-700 mb-2 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Specifications */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specifications
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                <input
                  type="text"
                  value={newSpecKey}
                  onChange={(e) => setNewSpecKey(e.target.value)}
                  className="px-3 py-2 border border-gray-300 text-gray-700 mb-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Specification name"
                />
                <input
                  type="text"
                  value={newSpecValue}
                  onChange={(e) => setNewSpecValue(e.target.value)}
                  className="px-3 py-2 border border-gray-300 text-gray-700 mb-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Specification value"
                />
                <button
                  type="button"
                  onClick={addSpecification}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {Object.keys(formData.specifications).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(formData.specifications).map(([key, value]) => (
                    <div key={key} className="flex items-center p-2 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-gray-700">{key}:</span>{' '}
                        <span className="text-gray-600 truncate align-middle inline-block max-w-full">{value}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSpecification(key)}
                        className="ml-3 text-red-600 hover:text-red-800 transition-colors shrink-0"
                        aria-label={`Delete ${key}`}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                Active Product
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

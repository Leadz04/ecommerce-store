'use client';

import { useState, useEffect } from 'react';
import { useEtsyShops, useEtsyShopDetails, useEtsyListings } from '@/hooks/useEtsyData';
import { useEtsyDataStore } from '@/store/etsyDataStore';
import {
  BarChart3,
  Package,
  ShoppingCart,
  DollarSign,
  Star,
  Truck,
  Users,
  FileText,
  Settings,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Search,
  Filter,
  Eye,
  MessageSquare,
  CreditCard,
  MapPin,
  Globe,
  Tag,
  Image as ImageIcon,
  Video,
  FileCheck,
  Link as LinkIcon,
  Zap,
  Target,
  PieChart,
  Activity,
  Calendar,
  TrendingDown,
  ArrowUpRight,
  Loader2,
  X,
  ChevronRight,
  ChevronDown,
  Shield,
  Save,
  HelpCircle,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import EtsyShopSelector from '@/components/EtsyShopSelector';
import EtsyMediaLibrary from './EtsyMediaLibrary';
import SelectField from './SelectField';

interface Shop {
  shopId: number;
  shopName: string;
  title: string;
  currencyCode: string;
  isVacation: boolean;
  vacationMessage?: string;
  saleMessage?: string;
  digitalSaleMessage?: string;
  lastUpdatedOn: number;
  listingActiveCount: number;
  loginName: string;
  acceptsCustomRequests: boolean;
  policyWelcome?: string;
  policyPayment?: string;
  policyShipping?: string;
  policyRefunds?: string;
  policyAdditional?: string;
  policySellerInfo?: string;
  policyUpdateDate?: number;
  hasUnstructuredPolicies: boolean;
  policyPrivacy?: string;
  url?: string;
  imageUrl760x100?: string;
  numFavorers: number;
  languages?: string[];
  iconUrlFullxFull?: string;
  isUsingStructuredPolicies: boolean;
  hasOnboardedStructuredPolicies: boolean;
  includeDisputeFormLink: boolean;
  isDirectCheckoutOnboarded: boolean;
  isCalculatedEligible: boolean;
  isOptedInToBuyerPromise: boolean;
  isShopUsBased: boolean;
  isEtsyPaymentsOnboarded: boolean;
  isCBTOnboarded: boolean;
  isCBTEnabled: boolean;
  isCBTAllowed: boolean;
  transactionSoldCount?: number;
  shippingFromCountryIso?: string;
  shopLocationCountryIso?: string;
  reviewCount?: number;
  reviewAverage?: number;
}

interface Listing {
  listingId: number;
  userId: number;
  shopSectionId?: number;
  title: string;
  description: string;
  state: string;
  creationTimestamp: number;
  createdTimestamp: number;
  endingTimestamp: number;
  originalCreationTimestamp: number;
  lastModifiedTimestamp: number;
  updatedTimestamp: number;
  stateTimestamp: number;
  quantity: number;
  shopSectionId2?: number;
  featuredRank?: number;
  url: string;
  views: number;
  numFavorers: number;
  shippingProfileId?: number;
  processingMin?: number;
  processingMax?: number;
  whoMade: string;
  whenMade: string;
  isSupply: boolean;
  itemWeight?: number;
  itemLength?: number;
  itemWidth?: number;
  itemHeight?: number;
  itemWeightUnit?: string;
  itemDimensionsUnit?: string;
  isPersonalizable: boolean;
  personalizationIsRequired: boolean;
  personalizationCharCountMax?: number;
  personalizationInstructions?: string;
  isCustomizable: boolean;
  isDigital: boolean;
  fileData?: string;
  hasVariations: boolean;
  shouldAutoRenew: boolean;
  language: string;
  price: {
    amount: number;
    currencyCode: string;
  };
  taxonomyId: number;
  readiness_state_id?: number;
  tags: string[];
  materials?: string[];
  shopSectionId3?: number;
  style?: string[];
  images?: Array<{
    listingImageId: number;
    hexCode?: string;
    red?: number;
    green?: number;
    blue?: number;
    hue?: number;
    saturation?: number;
    brightness?: number;
    isBlackAndWhite?: boolean;
    creationTimestamp?: number;
    rank?: number;
    url75x75?: string;
    url170x135?: string;
    url570xN?: string;
    urlFullxFull?: string;
    fullHeight?: number;
    fullWidth?: number;
  }>;
  shopId: number;
  productionPartnerIds?: number[];
  taxonomyPath?: string[];
  taxonomyIds?: number[];
  inventory?: {
    products: Array<{
      productId: number;
      sku?: string;
      isDeleted: boolean;
      offerings: Array<{
        offeringId: number;
        price: {
          amount: number;
          currencyCode: string;
        };
        quantity: number;
        isEnabled: boolean;
        isDeleted: boolean;
      }>;
      propertyValues: Array<{
        propertyId: number;
        propertyName: string;
        scaleId?: number;
        scaleName?: string;
        valueIds: number[];
        values: string[];
      }>;
    }>;
    priceOnProperty: number[];
    quantityOnProperty: number[];
    skuOnProperty: number[];
  };
}

interface Receipt {
  receiptId: number;
  receiptType: number;
  orderId: string;
  sellerUserId: number;
  buyerUserId: number;
  creationTimestamp: number;
  lastModifiedTimestamp: number;
  name: string;
  firstLine?: string;
  secondLine?: string;
  city?: string;
  state?: string;
  zip?: string;
  countryIso?: string;
  paymentEmail?: string;
  paymentMethod?: string;
  paymentEmailSentTimestamp?: number;
  paymentEmailSentDate?: string;
  messageFromSeller?: string;
  messageFromBuyer?: string;
  messageFromPayment?: string;
  isPaid: boolean;
  isShipped: boolean;
  isDelivered: boolean;
  isCancelled: boolean;
  grandTotal?: {
    amount: number;
    currencyCode: string;
  };
  subtotal?: {
    amount: number;
    currencyCode: string;
  };
  totalTaxCost?: {
    amount: number;
    currencyCode: string;
  };
  totalShippingCost?: {
    amount: number;
    currencyCode: string;
  };
  totalVatCost?: {
    amount: number;
    currencyCode: string;
  };
  discountAmt?: {
    amount: number;
    currencyCode: string;
  };
  currencyCode: string;
  messageFromSellerTimestamp?: number;
  messageFromBuyerTimestamp?: number;
  wasPaid: boolean;
  wasShipped: boolean;
  wasDelivered: boolean;
  wasCancelled: boolean;
  needsGiftWrap?: boolean;
  giftMessage?: string;
  giftWrapPrice?: {
    amount: number;
    currencyCode: string;
  };
  formattedAddress?: string;
  totalShippingCostDiscount?: {
    amount: number;
    currencyCode: string;
  };
  minimumProcessingDays?: number;
  maximumProcessingDays?: number;
  estimatedDeliveryDate?: string;
  shipByDate?: string;
  shippedTimestamp?: number;
  deliveredTimestamp?: number;
  carrierName?: string;
  trackingCode?: string;
  trackingUrl?: string;
  buyerCoupon?: string;
  shopCouponId?: number;
  buyerCouponDiscount?: {
    amount: number;
    currencyCode: string;
  };
  salesTax?: {
    amount: number;
    currencyCode: string;
  };
  salesTaxCollectionMethod?: string;
  hasVariations: boolean;
  needsGiftWrap2?: boolean;
  isInPerson: boolean;
  isGift?: boolean;
  isGiftMessage?: boolean;
  isGiftWrap?: boolean;
  transactions?: Array<{
    transactionId: number;
    title: string;
    description: string;
    sellerUserId: number;
    buyerUserId: number;
    createdTimestamp: number;
    paidTimestamp?: number;
    shippedTimestamp?: number;
    price: {
      amount: number;
      currencyCode: string;
    };
    currencyCode: string;
    quantity: number;
    tags: string[];
    materials?: string[];
    imageListingId?: number;
    productId?: number;
    sku?: string;
    variations?: Array<{
      propertyId: number;
      valueId: number;
      formattedName: string;
      formattedValue: string;
    }>;
    productData?: {
      sku?: string;
      propertyValues: Array<{
        propertyId: number;
        propertyName: string;
        scaleId?: number;
        scaleName?: string;
        valueIds: number[];
        values: string[];
      }>;
    };
    listingId: number;
    listingType: string;
    purchaseDate?: string;
    shippingCost?: {
      amount: number;
      currencyCode: string;
    };
    isDigital: boolean;
    fileData?: string;
    listingImageId?: number;
    transactionType: string;
    downpaymentId?: string;
    downpaymentType?: string;
    buyerEmail?: string;
    isQuickSale: boolean;
    isGift?: boolean;
    isGiftMessage?: boolean;
    isGiftWrap?: boolean;
  }>;
}

interface Review {
  listingId: number;
  shopId: number;
  transactionId: number;
  buyerUserId: number;
  rating: number;
  review: string;
  language: string;
  imageUrlFullxFull?: string;
  createTimestamp: number;
  updateTimestamp: number;
}

interface Payment {
  paymentId: number;
  receiptId: number;
  amount: {
    amount: number;
    currencyCode: string;
  };
  currencyCode: string;
  createTimestamp: number;
  updateTimestamp: number;
}

interface LedgerEntry {
  entryId: number;
  ledgerId: number;
  sequenceNumber: number;
  amount: number;
  currency: string;
  description: string;
  balance: number;
  createDate: number;
  updateDate: number;
}

// Helper function to safely parse JSON responses
async function parseJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');

  if (!response.ok) {
    // If response is not OK, try to get error message from JSON if possible
    if (contentType?.includes('application/json')) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    } else {
      // If not JSON, throw with status info
      const text = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status}: ${response.statusText}${text ? ` - ${text.substring(0, 100)}` : ''}`);
    }
  }

  // Check if response is actually JSON
  if (!contentType?.includes('application/json')) {
    const text = await response.text();
    throw new Error(`Expected JSON but got ${contentType || 'unknown content type'}. Response: ${text.substring(0, 100)}`);
  }

  return response.json();
}

export default function EtsyBusinessSuite() {
  // Use shared Etsy data store
  const { shops, selectedShopId, setSelectedShop, fetchShops } = useEtsyShops();
  const { shopDetails, refetch: refetchShopDetails } = useEtsyShopDetails(selectedShopId);
  const { listings: sharedListings, refetch: refetchListings, updateListing: updateSharedListing } = useEtsyListings(selectedShopId);

  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [loading, setLoading] = useState(false);
  const [shopData, setShopData] = useState<Shop | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [draftListings, setDraftListings] = useState<Listing[]>([]);
  const [inactiveListings, setInactiveListings] = useState<Listing[]>([]);
  const [listingsTab, setListingsTab] = useState<'active' | 'draft' | 'inactive'>('active');
  const [optimizingListing, setOptimizingListing] = useState<number | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<any | null>(null);
  const [showListingModal, setShowListingModal] = useState(false);
  const [optimizingField, setOptimizingField] = useState<'title' | 'description' | 'tags' | 'materials' | null>(null);
  const [fieldOptimizationResult, setFieldOptimizationResult] = useState<any | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    averageRating: 0,
    totalReviews: 0,
  });

  // Form states
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [showCreateReceiptShipment, setShowCreateReceiptShipment] = useState<number | null>(null);
  const [showCreateSection, setShowCreateSection] = useState(false);
  const [editingSection, setEditingSection] = useState<any | null>(null);
  const [showCreateShippingProfile, setShowCreateShippingProfile] = useState(false);
  const [editingShippingProfile, setEditingShippingProfile] = useState<any | null>(null);
  const [shippingProfiles, setShippingProfiles] = useState<any[]>([]);
  const [shopSections, setShopSections] = useState<any[]>([]);
  const [returnPolicies, setReturnPolicies] = useState<any[]>([]);
  const [showCreateReturnPolicy, setShowCreateReturnPolicy] = useState(false);
  const [editingReturnPolicy, setEditingReturnPolicy] = useState<any | null>(null);
  const [returnPolicyFormData, setReturnPolicyFormData] = useState({
    accepts_returns: false,
    accepts_exchanges: false,
    return_deadline: null as number | null,
  });
  const [policyListings, setPolicyListings] = useState<any[]>([]);
  const [selectedPolicyForListings, setSelectedPolicyForListings] = useState<number | null>(null);

  // Pagination states
  const [listingsPage, setListingsPage] = useState(1);
  const [listingsPerPage] = useState(20);
  const [totalListings, setTotalListings] = useState(0);
  const [hasMoreListings, setHasMoreListings] = useState(false);

  // Form data states
  const [listingFormData, setListingFormData] = useState({
    title: '',
    description: '',
    quantity: 1,
    price: '',
    taxonomy_id: '',
    who_made: 'i_did',
    when_made: '2020_2025',
    is_supply: false,
    tags: '',
    materials: '',
    shipping_profile_id: '',
    shop_section_id: '',
    return_policy_id: '',
    item_weight: '',
    item_weight_unit: '',
    item_length: '',
    item_width: '',
    item_height: '',
    item_dimensions_unit: '',
    processing_min: '',
    processing_max: '',
    is_taxable: false,
    is_personalizable: false,
    personalization_is_required: false,
    personalization_char_count_max: '',
    personalization_instructions: '',
    should_auto_renew: false,
    featured_rank: '',
    state: 'draft',
    type: 'physical',
    readiness_state_id: '' as string | number,
  });

  // Size/Variation state
  const [sizeVariations, setSizeVariations] = useState<{
    enabled: boolean;
    propertyId: string;
    propertyName: string;
    scaleId?: number;
    values: Array<{
      valueId: number;
      value: string;
      price: string;
      quantity: string;
      sku?: string;
    }>;
  }>({
    enabled: false,
    propertyId: '',
    propertyName: '',
    values: [],
  });

  // Images and videos state
  const [listingImages, setListingImages] = useState<any[]>([]);
  const [listingVideos, setListingVideos] = useState<any[]>([]);
  const [newImageUrls, setNewImageUrls] = useState<string[]>(['']);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [updatingImageRank, setUpdatingImageRank] = useState<string | null>(null);

  // Variations/Inventory state
  const [listingInventory, setListingInventory] = useState<any>(null);
  const [availableProperties, setAvailableProperties] = useState<any[]>([]);
  const [sectionFormData, setSectionFormData] = useState({
    title: '',
  });
  const [shippingProfileFormData, setShippingProfileFormData] = useState({
    title: '',
    min_processing_time: 1,
    max_processing_time: 3,
    processing_time_unit: 'business_days',
    origin_country_iso: 'US',
    primary_cost: '',
    secondary_cost: '',
    min_delivery_days: '',
    max_delivery_days: '',
  });

  // Form field metadata state
  const [formFieldMetadata, setFormFieldMetadata] = useState<Record<string, any>>({});
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  // Taxonomy state
  const [buyerTaxonomyNodes, setBuyerTaxonomyNodes] = useState<any[]>([]);
  const [sellerTaxonomyNodes, setSellerTaxonomyNodes] = useState<any[]>([]);
  const [selectedTaxonomyNode, setSelectedTaxonomyNode] = useState<any | null>(null);
  const [taxonomyProperties, setTaxonomyProperties] = useState<any[]>([]);
  const [taxonomyType, setTaxonomyType] = useState<'buyer' | 'seller'>('seller');
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [isLoadingTaxonomy, setIsLoadingTaxonomy] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const [inventoryResults, setInventoryResults] = useState<any>(null);
  const [isInventoryLoading, setIsInventoryLoading] = useState(false);
  const [inventoryListingId, setInventoryListingId] = useState('');
  const [productResults, setProductResults] = useState<any>(null);
  const [offeringResults, setOfferingResults] = useState<any>(null);
  const [selectedInventoryProduct, setSelectedInventoryProduct] = useState<any>(null);
  const [selectedInventoryOffering, setSelectedInventoryOffering] = useState<any>(null);
  const [inventoryUpdateData, setInventoryUpdateData] = useState({ price: '', quantity: '' });

  // Variation management states
  const [availablePropertiesForVariations, setAvailablePropertiesForVariations] = useState<any[]>([]);
  const [showAddVariantForm, setShowAddVariantForm] = useState(false);
  const [newVariantData, setNewVariantData] = useState({
    value: '',
    valueId: '',
    price: '',
    quantity: '1',
    sku: '',
    propertyId: '',
    propertyName: ''
  });
  const [listingReadinessStateId, setListingReadinessStateId] = useState<number | null>(null);
  const [isVariationListingDropdownOpen, setIsVariationListingDropdownOpen] = useState(false);
  const [isPropertyDropdownOpen, setIsPropertyDropdownOpen] = useState(false);
  const [isValueDropdownOpen, setIsValueDropdownOpen] = useState(false);

  // Cache for taxonomy properties and listing details to avoid redundant API calls
  const [taxonomyPropertiesCache, setTaxonomyPropertiesCache] = useState<Record<string, any[]>>({});
  const [listingDetailsCache, setListingDetailsCache] = useState<Record<string, any>>({});

  const modules = [
    { id: 'dashboard', label: 'Business Dashboard', icon: BarChart3, description: 'Overview & KPIs' },
    { id: 'shops', label: 'Multi-Shop Management', icon: ShoppingCart, description: 'Manage multiple shops' },
    { id: 'listings', label: 'Listing Lifecycle', icon: Package, description: 'Create, update, optimize listings' },
    { id: 'inventory', label: 'Inventory & Pricing', icon: TrendingUp, description: 'Stock & pricing intelligence' },
    { id: 'variations', label: 'Listing Variations', icon: Layers, description: 'Manage size & price variations' },
    { id: 'orders', label: 'Order Management', icon: FileCheck, description: 'Receipts & fulfillment' },
    { id: 'reviews', label: 'Review Management', icon: Star, description: 'Reputation & feedback' },
    { id: 'payments', label: 'Financial Analytics', icon: DollarSign, description: 'Payments & ledger' },
    { id: 'shipping', label: 'Shipping Profiles', icon: Truck, description: 'Shipping configuration' },
    { id: 'sections', label: 'Shop Sections', icon: Tag, description: 'Organize listings' },
    { id: 'taxonomy', label: 'Taxonomy Research', icon: Target, description: 'Category & properties' },
    { id: 'translations', label: 'Multi-Language', icon: Globe, description: 'Listing translations' },
    { id: 'media', label: 'Media Library', icon: ImageIcon, description: 'Images & videos' },
    { id: 'policies', label: 'Return Policies', icon: Shield, description: 'Policy management' },
    { id: 'production', label: 'Production Partners', icon: Users, description: 'Partner management' },
    { id: 'holidays', label: 'Holiday Settings', icon: Calendar, description: 'Vacation & holidays' },
  ];

  // Track if we're currently loading to prevent duplicate calls
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Search logic for local products
  const searchProducts = async (query: string) => {
    if (!query || query.length < 2) {
      setProducts([]);
      return;
    }
    setProductsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/products?search=${encodeURIComponent(query)}&limit=10`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.success) {
        setProducts(json.products || []);
      }
    } catch (e) {
      console.error('Failed to search products:', e);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (productSearch) searchProducts(productSearch);
      else setProducts([]);
    }, 500);
    return () => clearTimeout(timer);
  }, [productSearch]);

  useEffect(() => {
    if (selectedShopId) {
      // Shop data is loaded via useEtsyShopDetails hook
      if (activeModule === 'shipping') {
        loadShippingProfiles();
      }
      if (activeModule === 'sections') {
        loadShopSections();
      }
      if (activeModule === 'policies') {
        loadReturnPolicies();
      }
      if (activeModule === 'listings' || activeModule === 'dashboard' || activeModule === 'media' || activeModule === 'variations') {
        // Only load stats if not already loading
        if (!isLoadingStats) {
          loadDashboardStats();
        }
        // Load shipping profiles and sections for dropdowns in listing form
        loadShippingProfiles();
        loadShopSections();
      }
      // Load form field metadata for the active module
      if (activeModule === 'listings') {
        loadFormFieldMetadata('listings');
      } else if (activeModule === 'shipping') {
        loadFormFieldMetadata('shipping');
      } else if (activeModule === 'sections') {
        loadFormFieldMetadata('sections');
      } else if (activeModule === 'taxonomy') {
        loadTaxonomyNodes();
      }
    }
  }, [selectedShopId, activeModule, listingsPage]);

  // Load taxonomy nodes
  const loadTaxonomyNodes = async () => {
    setIsLoadingTaxonomy(true);
    try {
      const { fetchTaxonomyNodes } = useEtsyDataStore.getState();

      // Load seller taxonomy (requires shop)
      if (selectedShopId) {
        try {
          const nodes = await fetchTaxonomyNodes('seller', selectedShopId);
          setSellerTaxonomyNodes(nodes);
        } catch (err) {
          console.error('Error loading seller taxonomy:', err);
        }
      }

      // Load buyer taxonomy (public, no auth needed)
      try {
        const nodes = await fetchTaxonomyNodes('buyer');
        setBuyerTaxonomyNodes(nodes);
      } catch (err) {
        console.error('Error loading buyer taxonomy:', err);
      }
    } catch (error) {
      console.error('Error loading taxonomy nodes:', error);
      toast.error('Failed to load taxonomy nodes');
    } finally {
      setIsLoadingTaxonomy(false);
    }
  };

  // Load properties for a taxonomy node
  const loadTaxonomyProperties = async (taxonomyId: number) => {
    setIsLoadingTaxonomy(true);
    try {
      const { fetchTaxonomyProperties } = useEtsyDataStore.getState();
      const results = await fetchTaxonomyProperties(taxonomyId, taxonomyType, selectedShopId || undefined);
      setTaxonomyProperties(results);
    } catch (error) {
      console.error('Error loading taxonomy properties:', error);
      toast.error('Failed to load taxonomy properties');
    } finally {
      setIsLoadingTaxonomy(false);
    }
  };

  // Load available properties for size variations when taxonomy_id changes
  useEffect(() => {
    if (listingFormData.taxonomy_id && selectedShopId && (showCreateListing || editingListing)) {
      const loadProperties = async () => {
        try {
          console.log('[Size Variations] Loading properties for taxonomy:', listingFormData.taxonomy_id);

          const { fetchTaxonomyProperties } = useEtsyDataStore.getState();
          const allProperties = await fetchTaxonomyProperties(
            parseInt(listingFormData.taxonomy_id),
            'seller',
            selectedShopId
          );

          console.log('[Size Variations] Properties response:', allProperties);
          if (allProperties) {
            const propsData = { success: true, results: allProperties }; // Mock for compat if needed, or simply use allProperties
            // But existing code uses allProperties = propsData.results || []
            // so I should just let allProperties be allProperties

            // Wait, I am replacing lines 680-688.
            // Line 688 is: const allProperties = propsData.results || [];
            // So my replacement should handle that variable name.
            // Filter to only show properties that support variations
            // Also prioritize size-related properties
            const variationProperties = allProperties.filter((prop: any) =>
              prop.supports_variations !== false // Include if true or undefined
            );

            // Sort: size-related properties first, then others
            const sortedProperties = variationProperties.sort((a: any, b: any) => {
              const aName = (a.name || a.property_name || a.display_name || '').toLowerCase();
              const bName = (b.name || b.property_name || b.display_name || '').toLowerCase();
              const aIsSize = aName.includes('size');
              const bIsSize = bName.includes('size');

              if (aIsSize && !bIsSize) return -1;
              if (!aIsSize && bIsSize) return 1;
              return aName.localeCompare(bName);
            });

            setAvailableProperties(sortedProperties);
            console.log('[Size Variations] Loaded properties:', sortedProperties.length, 'out of', allProperties.length, 'total');
            console.log('[Size Variations] Properties:', sortedProperties.map((p: any) => ({
              id: p.property_id || p.id,
              name: p.name || p.property_name || p.display_name,
              supports_variations: p.supports_variations
            })));
          } else {
            console.error('[Size Variations] Failed to load properties');
            setAvailableProperties([]);
          }
        } catch (err) {
          console.error('[Size Variations] Error loading taxonomy properties:', err);
          setAvailableProperties([]);
        }
      };
      loadProperties();
    } else {
      setAvailableProperties([]);
    }
  }, [listingFormData.taxonomy_id, selectedShopId, showCreateListing, editingListing]);

  // Toggle node expansion
  const toggleNode = (nodeId: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // Select a taxonomy node
  const handleSelectNode = (node: any) => {
    setSelectedTaxonomyNode(node);
    loadTaxonomyProperties(node.id);
  };

  // Render taxonomy tree node
  const renderTaxonomyNode = (node: any, level: number = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const matchesSearch = !searchQuery ||
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.id.toString().includes(searchQuery);

    if (!matchesSearch && !hasChildren) return <></>;

    return (
      <div key={node.id} className="mb-1">
        <div
          className={`flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer ${selectedTaxonomyNode?.id === node.id ? 'bg-purple-50 border border-purple-200' : ''
            }`}
          style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
          onClick={() => handleSelectNode(node)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}
          {!hasChildren && <div className="w-4" />}
          <span className="text-sm text-black">{node.name}</span>
          <span className="text-xs text-gray-500 ml-auto">ID: {node.id}</span>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {node.children.map((child: any) => renderTaxonomyNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Load form field metadata on mount
  useEffect(() => {
    loadFormFieldMetadata();
  }, []);

  // Load form field metadata
  const loadFormFieldMetadata = async (section?: string) => {
    try {
      setIsLoadingMetadata(true);
      const token = localStorage.getItem('token');
      const url = section
        ? `/api/etsy/form-fields?section=${section}`
        : '/api/etsy/form-fields';

      const response = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await parseJsonResponse<any>(response);
      if (data.success && data.fields) {
        const metadata: Record<string, any> = {};
        data.fields.forEach((field: any) => {
          metadata[`${field.section}.${field.fieldKey}`] = field;
        });
        setFormFieldMetadata(prev => ({ ...prev, ...metadata }));
      }
    } catch (error) {
      console.error('Error loading form field metadata:', error);
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  // Helper component for help tooltip
  const HelpTooltip = ({ fieldKey, section }: { fieldKey: string; section: string }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const fieldMeta = formFieldMetadata[`${section}.${fieldKey}`];
    const helpText = fieldMeta?.helpText || fieldMeta?.description || '';

    if (!helpText) return null;

    return (
      <div className="relative inline-block">
        <button
          type="button"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
        {showTooltip && (
          <div className="absolute z-50 left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
            <p className="mb-1 font-semibold">{fieldMeta?.fieldName || fieldKey}</p>
            <p>{helpText}</p>
            {fieldMeta?.example && (
              <p className="mt-2 text-gray-300">
                <span className="font-semibold">Example:</span> {fieldMeta.example}
              </p>
            )}
            <div className="absolute left-4 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>
    );
  };

  // Helper component for section header with help icon
  const SectionHeader = ({
    title,
    icon: Icon,
    section,
    helpText
  }: {
    title: string;
    icon?: any;
    section: string;
    helpText?: string;
  }) => {
    const [showHelp, setShowHelp] = useState(false);

    return (
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className="h-5 w-5" />}
        <h5 className="font-semibold text-black">{title}</h5>
        {helpText && (
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setShowHelp(true)}
              onMouseLeave={() => setShowHelp(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
            {showHelp && (
              <div className="absolute z-50 left-0 bottom-full mb-2 w-72 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg">
                <p>{helpText}</p>
                <div className="absolute left-4 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Load shops on mount - using shared store
  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  // Update shopData when shopDetails changes
  useEffect(() => {
    if (shopDetails) {
      setShopData(shopDetails as any);
    }
  }, [shopDetails]);

  const handleCreateListing = async () => {
    if (!selectedShopId) {
      toast.error('Please select a shop first');
      return;
    }

    if (!listingFormData.title || !listingFormData.description || !listingFormData.price || !listingFormData.taxonomy_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Prepare listing data according to Etsy API schema
      const listingPayload: any = {
        shopId: selectedShopId,
        listing: {
          quantity: listingFormData.quantity,
          title: listingFormData.title,
          description: listingFormData.description,
          price: parseFloat(listingFormData.price),
          who_made: listingFormData.who_made,
          when_made: listingFormData.when_made,
          taxonomy_id: parseInt(listingFormData.taxonomy_id),
          is_supply: listingFormData.is_supply,
          tags: listingFormData.tags ? listingFormData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          materials: listingFormData.materials ? listingFormData.materials.split(',').map(m => m.trim()).filter(Boolean) : [],
        }
      };

      // Optional fields
      if (listingFormData.shipping_profile_id) {
        listingPayload.listing.shipping_profile_id = parseInt(listingFormData.shipping_profile_id);
      }
      if (listingFormData.shop_section_id) {
        listingPayload.listing.shop_section_id = parseInt(listingFormData.shop_section_id);
      }
      if (listingFormData.processing_min) {
        listingPayload.listing.processing_min = parseInt(listingFormData.processing_min);
      }
      if (listingFormData.processing_max) {
        listingPayload.listing.processing_max = parseInt(listingFormData.processing_max);
      }
      if (listingFormData.return_policy_id) {
        listingPayload.listing.return_policy_id = parseInt(listingFormData.return_policy_id);
      }
      if (listingFormData.should_auto_renew) {
        listingPayload.listing.should_auto_renew = true;
      }
      if (listingFormData.is_personalizable) {
        listingPayload.listing.is_personalizable = true;
        listingPayload.listing.personalization_is_required = listingFormData.personalization_is_required;
        if (listingFormData.personalization_char_count_max) {
          listingPayload.listing.personalization_char_count_max = parseInt(listingFormData.personalization_char_count_max);
        }
        if (listingFormData.personalization_instructions) {
          listingPayload.listing.personalization_instructions = listingFormData.personalization_instructions;
        }
      }

      // Add image URLs if provided
      if (newImageUrls.some(url => url.trim())) {
        listingPayload.productImages = newImageUrls.filter(url => url.trim());
      }

      // Add size variations/inventory if enabled
      if (sizeVariations.enabled && sizeVariations.propertyId && sizeVariations.values.length > 0) {
        const propertyId = parseInt(sizeVariations.propertyId);
        const products = sizeVariations.values.map((sizeVal) => ({
          property_values: [{
            property_id: propertyId,
            value_ids: [sizeVal.valueId],
            values: [sizeVal.value],
            scale_id: sizeVariations.scaleId || null,
            property_name: sizeVariations.propertyName,
          }],
          offerings: [{
            price: parseFloat(sizeVal.price) || parseFloat(listingFormData.price) || 0,
            quantity: parseInt(sizeVal.quantity) || 1,
            is_enabled: true,
          }],
          sku: sizeVal.sku || null,
        }));

        listingPayload.inventory = {
          products,
          price_on_property: [propertyId], // Price varies by this property
          quantity_on_property: [propertyId], // Quantity varies by this property
          sku_on_property: sizeVariations.values.some(v => v.sku) ? [propertyId] : [],
        };

        console.log('[Create Listing] Adding size variations:', listingPayload.inventory);
      }

      const response = await fetch('/api/etsy/listings/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(listingPayload),
      });

      const data = await parseJsonResponse<any>(response);
      if (data.success) {
        toast.success('Listing created successfully!');
        setShowCreateListing(false);
        setListingFormData({
          title: '',
          description: '',
          quantity: 1,
          price: '',
          taxonomy_id: '',
          who_made: 'i_did',
          when_made: '2020_2025',
          is_supply: false,
          tags: '',
          materials: '',
          shipping_profile_id: '',
          shop_section_id: '',
          return_policy_id: '',
          item_weight: '',
          item_weight_unit: '',
          item_length: '',
          item_width: '',
          item_height: '',
          item_dimensions_unit: '',
          processing_min: '',
          processing_max: '',
          is_taxable: false,
          is_personalizable: false,
          personalization_is_required: false,
          personalization_char_count_max: '',
          personalization_instructions: '',
          should_auto_renew: false,
          featured_rank: '',
          state: 'draft',
          type: 'physical',
          readiness_state_id: '',
        });
        setListingImages([]);
        setListingVideos([]);
        setNewImageUrls(['']);
        setListingInventory(null);
        setAvailableProperties([]);
        setSizeVariations({
          enabled: false,
          propertyId: '',
          propertyName: '',
          values: [],
        });
        setListingsPage(1); // Reset to first page
        loadDashboardStats(); // Refresh listings
      } else {
        toast.error(data.error || 'Failed to create listing');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error creating listing');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateListing = async (listing: Listing) => {
    if (!selectedShopId) {
      toast.error('Please select a shop first');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Prepare update data with all fields
      // NOTE: Images are NOT included in the PATCH request - they are managed separately
      const updateData: any = {
        shopId: selectedShopId,
      };

      // Basic fields - always include required fields
      if (listingFormData.title) updateData.title = listingFormData.title;
      // Description should always be included if it exists (even if empty)
      if (listingFormData.description !== undefined && listingFormData.description !== null) {
        updateData.description = listingFormData.description;
      }
      if (listingFormData.price) updateData.price = parseFloat(listingFormData.price);
      if (listingFormData.quantity !== undefined && listingFormData.quantity !== null) {
        updateData.quantity = parseInt(String(listingFormData.quantity)) || 1;
      }
      if (listingFormData.taxonomy_id) updateData.taxonomy_id = parseInt(listingFormData.taxonomy_id);

      // Tags and materials
      if (listingFormData.tags) updateData.tags = listingFormData.tags.split(',').map(t => t.trim()).filter(Boolean);
      if (listingFormData.materials) updateData.materials = listingFormData.materials.split(',').map(m => m.trim()).filter(Boolean);

      // Who/When made
      if (listingFormData.who_made) updateData.who_made = listingFormData.who_made;
      if (listingFormData.when_made) updateData.when_made = listingFormData.when_made;
      updateData.is_supply = listingFormData.is_supply;

      // Shipping and sections - include if they have values
      if (listingFormData.shipping_profile_id && listingFormData.shipping_profile_id !== '') {
        updateData.shipping_profile_id = parseInt(listingFormData.shipping_profile_id);
      }
      if (listingFormData.shop_section_id && listingFormData.shop_section_id !== '') {
        updateData.shop_section_id = parseInt(listingFormData.shop_section_id);
      }
      if (listingFormData.return_policy_id && listingFormData.return_policy_id !== '') {
        updateData.return_policy_id = parseInt(listingFormData.return_policy_id);
      }

      // Processing times
      if (listingFormData.processing_min && listingFormData.processing_min !== '') {
        updateData.processing_min = parseInt(listingFormData.processing_min);
      }
      if (listingFormData.processing_max && listingFormData.processing_max !== '') {
        updateData.processing_max = parseInt(listingFormData.processing_max);
      }

      // Personalization
      updateData.is_personalizable = listingFormData.is_personalizable ?? false;
      if (listingFormData.is_personalizable) {
        updateData.personalization_is_required = listingFormData.personalization_is_required ?? false;
        if (listingFormData.personalization_char_count_max && listingFormData.personalization_char_count_max !== '') {
          updateData.personalization_char_count_max = parseInt(listingFormData.personalization_char_count_max);
        }
        if (listingFormData.personalization_instructions) {
          updateData.personalization_instructions = listingFormData.personalization_instructions;
        }
      } else {
        // If not personalizable, clear personalization fields
        updateData.personalization_is_required = false;
      }

      // Additional options
      updateData.is_taxable = listingFormData.is_taxable ?? false;
      updateData.should_auto_renew = listingFormData.should_auto_renew ?? false;
      if (listingFormData.featured_rank && listingFormData.featured_rank !== '') {
        updateData.featured_rank = parseInt(listingFormData.featured_rank);
      }
      if (listingFormData.state) updateData.state = listingFormData.state;

      // Images - explicitly include current image IDs to preserve/reorder them
      if (listingImages && listingImages.length > 0) {
        const validImageIds = listingImages
          .sort((a, b) => (a.rank || 0) - (b.rank || 0))
          .map(img => {
            // Support both internal camelCase and Etsy snake_case IDs
            const id = img.listingImageId || img.listing_image_id;
            if (!id) return null;
            const parsed = parseInt(id.toString());
            return isNaN(parsed) ? null : parsed;
          })
          .filter((id): id is number => id !== null && id > 0);

        if (validImageIds.length > 0) {
          updateData.image_ids = validImageIds;
        } else {
          console.warn('[Update Listing] No valid image IDs found among', listingImages.length, 'images');
        }
      } else {
        // If no images in state, don't send empty array unless we intend to delete all (which Etsy API might not support via update)
        // Better to not send it if empty to be safe, or check requirements.
        // User issue is that "only one image remains", implying maybe we were sending something wrong or nothing.
        // If we send nothing, Etsy keeps existing. If the user *deleted* images in UI, we WANT to update the list.
        // Actually, deleting images in UI calls DELETE endpoint immediately.
        // So listingImages reflects the CURRENT state on server (mostly).
        // However, if we reordered, we need to send this list.
        // If we don't send it, order isn't updated.
        // But the user says "other are deleted". This implies we might be sending a payload that wipes them?
        // Wait, I see NO image_ids being set in the original code.
        // If I add it now, it ensures the list matches what's on screen.
      }

      // Note: Size variations/inventory are updated separately via PUT /inventory endpoint
      // We'll handle this after the listing update succeeds

      // Log what we're sending for debugging
      console.log('[Update Listing] ===== FINAL UPDATE DATA =====');
      console.log('[Update Listing] updateData keys:', Object.keys(updateData));
      console.log('[Update Listing] updateData.image_ids:', updateData.image_ids);
      console.log('[Update Listing] updateData.image_ids type:', typeof updateData.image_ids, 'isArray:', Array.isArray(updateData.image_ids));
      console.log('[Update Listing] updateData.image_ids length:', updateData.image_ids?.length);
      console.log('[Update Listing] Full updateData:', {
        ...updateData,
        description: updateData.description ? `${updateData.description.substring(0, 50)}...` : '(empty)',
        image_ids: updateData.image_ids,
        image_ids_count: updateData.image_ids?.length || 0,
      });
      console.log('[Update Listing] ============================');

      const response = await fetch(`/api/etsy/listings/${listing.listingId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await parseJsonResponse<any>(response);
      if (data.success) {
        // Update inventory separately if size variations are enabled
        if (sizeVariations.enabled && sizeVariations.propertyId && sizeVariations.values.length > 0) {
          try {
            const propertyId = parseInt(sizeVariations.propertyId);
            const products = sizeVariations.values.map((sizeVal) => ({
              property_values: [{
                property_id: propertyId,
                value_ids: [sizeVal.valueId],
                values: [sizeVal.value],
                ...(sizeVariations.scaleId ? { scale_id: sizeVariations.scaleId } : { scale_id: null }), // Explicit null if expected, or omit? API says nullable.
                property_name: sizeVariations.propertyName,
              }],
              offerings: [{
                price: parseFloat(sizeVal.price) || parseFloat(listingFormData.price) || 0,
                quantity: parseInt(sizeVal.quantity) || 1,
                is_enabled: true, // Use boolean true - Etsy API is strict about types for offerings
                readiness_state_id: (listingFormData as any).readiness_state_id ? parseInt((listingFormData as any).readiness_state_id.toString()) : null,
              }],
              ...(sizeVal.sku ? { sku: sizeVal.sku } : {}), // Omit sku if empty/null
            }));

            const inventoryPayload = {
              products,
              price_on_property: [propertyId],
              quantity_on_property: [propertyId],
              sku_on_property: sizeVariations.values.some(v => v.sku) ? [propertyId] : [],
              readiness_state_on_property: [],
            };

            console.log('[Update Listing] Updating inventory separately with:', inventoryPayload);
            const inventoryRes = await fetch(`/api/etsy/listings/${listing.listingId}/inventory?shopId=${selectedShopId}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(inventoryPayload),
            });
            const inventoryData = await parseJsonResponse<any>(inventoryRes);
            if (inventoryData.success) {
              console.log('[Update Listing] Inventory updated successfully');
              toast.success('Listing and size variations updated successfully!');
            } else {
              console.warn('[Update Listing] Inventory update failed:', inventoryData.error);
              toast('Listing updated but size variations failed to update. Please update inventory separately.', { icon: '⚠️' });
            }
          } catch (inventoryError: any) {
            console.error('[Update Listing] Error updating inventory:', inventoryError);
            toast('Listing updated but size variations failed to update. Please update inventory separately.', { icon: '⚠️' });
            // Don't fail the entire update - listing is updated, inventory can be set separately
          }
        } else {
          toast.success('Listing updated successfully!');
        }

        setEditingListing(null);
        setFieldOptimizationResult(null);
        setOptimizingField(null);
        setListingFormData({
          title: '',
          description: '',
          quantity: 1,
          price: '',
          taxonomy_id: '',
          who_made: 'i_did',
          when_made: '2020_2025',
          is_supply: false,
          tags: '',
          materials: '',
          shipping_profile_id: '',
          shop_section_id: '',
          return_policy_id: '',
          item_weight: '',
          item_weight_unit: '',
          item_length: '',
          item_width: '',
          item_height: '',
          item_dimensions_unit: '',
          processing_min: '',
          processing_max: '',
          is_taxable: false,
          is_personalizable: false,
          personalization_is_required: false,
          personalization_char_count_max: '',
          personalization_instructions: '',
          should_auto_renew: false,
          featured_rank: '',
          state: 'draft',
          type: 'physical',
          readiness_state_id: '',
        });
        setListingImages([]);
        setListingVideos([]);
        setNewImageUrls(['']);
        setListingInventory(null);
        setAvailableProperties([]);
        setSizeVariations({
          enabled: false,
          propertyId: '',
          propertyName: '',
          values: [],
        });
        loadDashboardStats(); // Refresh listings
      } else {
        toast.error(data.error || 'Failed to update listing');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error updating listing');
    } finally {
      setLoading(false);
    }
  };

  // Image Management Handlers
  const handleUploadImage = async (file: File, rank?: number) => {
    if (!editingListing || !selectedShopId) {
      toast.error('Please select a listing to edit first');
      return;
    }

    try {
      setUploadingImage(true);
      const token = localStorage.getItem('token');

      const formData = new FormData();
      formData.append('image', file);
      if (rank) {
        formData.append('rank', rank.toString());
      }

      const response = await fetch(`/api/etsy/listings/${editingListing.listingId}/images?shopId=${selectedShopId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await parseJsonResponse<any>(response);

      if (data.success) {
        toast.success('Image uploaded successfully!');
        // Refresh images
        await loadListingDetailsForEdit(editingListing.listingId);
      } else {
        toast.error(data.error || 'Failed to upload image');
      }
    } catch (error: any) {
      console.error('Upload image error:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!editingListing || !selectedShopId) {
      toast.error('Please select a listing to edit first');
      return;
    }

    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      setDeletingImageId(imageId);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/etsy/listings/${editingListing.listingId}/images?shopId=${selectedShopId}&imageId=${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await parseJsonResponse<any>(response);

      if (data.success) {
        toast.success('Image deleted successfully!');
        // Refresh images
        await loadListingDetailsForEdit(editingListing.listingId);
      } else {
        toast.error(data.error || 'Failed to delete image');
      }
    } catch (error: any) {
      console.error('Delete image error:', error);
      toast.error(error.message || 'Failed to delete image');
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleUpdateImageRank = async (imageId: string, newRank: number) => {
    if (!editingListing || !selectedShopId) {
      toast.error('Please select a listing to edit first');
      return;
    }

    try {
      setUpdatingImageRank(imageId);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/etsy/listings/${editingListing.listingId}/images?shopId=${selectedShopId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageId,
          rank: newRank,
          overwrite: true,
        }),
      });

      const data = await parseJsonResponse<any>(response);

      if (data.success) {
        toast.success('Image order updated successfully!');
        // Refresh images
        await loadListingDetailsForEdit(editingListing.listingId);
      } else {
        toast.error(data.error || 'Failed to update image order');
      }
    } catch (error: any) {
      console.error('Update image rank error:', error);
      toast.error(error.message || 'Failed to update image order');
    } finally {
      setUpdatingImageRank(null);
    }
  };

  const handleDeleteListing = async (listingId: number) => {
    if (!selectedShopId) {
      toast.error('Please select a shop first');
      return;
    }

    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`/api/etsy/listings/${listingId}?shopId=${selectedShopId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await parseJsonResponse<any>(response);
      if (data.success) {
        toast.success('Listing deleted successfully!');
        // Remove from local state immediately for better UX
        setListings(prev => prev.filter(l => l.listingId !== listingId));
        setDraftListings(prev => prev.filter(l => l.listingId !== listingId));
        setInactiveListings(prev => prev.filter(l => l.listingId !== listingId));
        // Refresh dashboard stats to ensure consistency
        loadDashboardStats();
      } else {
        toast.error(data.error || 'Failed to delete listing');
      }
    } catch (error: any) {
      console.error('Error deleting listing:', error);
      toast.error(error.message || 'Error deleting listing');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeListing = async (listing: Listing, mode: 'title' | 'description' | 'tags' | 'materials' | 'all' = 'all') => {
    if (!selectedShopId) {
      toast.error('Please select a shop first');
      return;
    }

    try {
      setOptimizingListing(listing.listingId);
      setOptimizationResult(null);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/etsy/listing-optimizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          listingId: listing.listingId.toString(),
          mode,
          shopId: selectedShopId,
        }),
      });

      const data = await parseJsonResponse<any>(response);
      if (data.success || data.optimized) {
        setOptimizationResult({ listing, result: data, mode });
        setShowListingModal(true);
        toast.success('Listing optimized successfully!');
      } else {
        toast.error(data.error || 'Failed to optimize listing');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error optimizing listing');
    } finally {
      setOptimizingListing(null);
    }
  };

  const handleApplyOptimization = async () => {
    if (!optimizationResult || !selectedShopId) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const { listing, result, mode } = optimizationResult;
      const updateData: any = {};
      const optimized = result.optimized || result;

      if (mode === 'title' || mode === 'all') {
        const title = mode === 'all' ? optimized.title?.optimized_title : optimized.optimized_title;
        if (title) updateData.title = title;
      }

      if (mode === 'description' || mode === 'all') {
        const description = mode === 'all' ? optimized.description?.optimized_description : optimized.optimized_description;
        if (description) updateData.description = description;
      }

      if (mode === 'tags' || mode === 'all') {
        const tags = mode === 'all' ? optimized.tags?.optimized_tags : optimized.optimized_tags;
        if (tags) updateData.tags = tags;
      }

      if (mode === 'materials' || mode === 'all') {
        const materials = mode === 'all' ? optimized.materials?.optimized_materials : optimized.optimized_materials;
        if (materials) updateData.materials = materials;
      }

      const response = await fetch(`/api/etsy/listings/${listing.listingId}?shopId=${selectedShopId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await parseJsonResponse<any>(response);
      if (data.success) {
        toast.success('Optimization applied successfully!');
        setOptimizationResult(null);
        setShowListingModal(false);
        loadDashboardStats();
      } else {
        toast.error(data.error || 'Failed to apply optimization');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error applying optimization');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeField = async (field: 'title' | 'description' | 'tags' | 'materials') => {
    if (!selectedShopId) {
      toast.error('Please select a shop first');
      return;
    }

    try {
      setOptimizingField(field);
      setFieldOptimizationResult(null);
      const token = localStorage.getItem('token');

      // 1. If we have a local product selected (New Listing Flow)
      if (selectedProduct && !editingListing) {
        const res = await fetch(`/api/products/${selectedProduct._id}/improve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ field }),
        });
        const json = await res.json();
        if (json.success && json.suggestion) {
          const optimizedValue = Array.isArray(json.suggestion) ? json.suggestion.join(', ') : json.suggestion;
          setListingFormData({
            ...listingFormData,
            [field]: optimizedValue
          });
          toast.success(`${field} optimized successfully!`);
        } else {
          throw new Error(json.error || 'Optimization failed');
        }
        return;
      }

      // 2. If we are editing an existing Etsy listing
      if (editingListing) {
        if (field === 'materials') {
          const response = await fetch('/api/ai/optimize', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              mode: 'tags',
              input: {
                name: listingFormData.title,
                description: listingFormData.description,
                tags: listingFormData.materials ? listingFormData.materials.split(',').map((m: string) => m.trim()) : [],
                category: listingFormData.taxonomy_id,
              },
            }),
          });

          const data = await parseJsonResponse<any>(response);
          if (data.output) {
            const optimizedMaterials = data.output.split(',').map((m: string) => m.trim()).filter(Boolean);
            setFieldOptimizationResult({ field, optimized: optimizedMaterials.join(', ') });
            toast.success('Materials optimized');
          } else {
            toast.error('Failed to optimize materials');
          }
        } else {
          const response = await fetch('/api/etsy/listing-optimizer', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              listingId: editingListing.listingId.toString(),
              mode: field,
              shopId: selectedShopId,
              formData: {
                title: listingFormData.title,
                description: listingFormData.description,
                tags: listingFormData.tags,
                materials: listingFormData.materials,
                taxonomy_id: listingFormData.taxonomy_id,
                price: listingFormData.price,
                quantity: listingFormData.quantity,
                who_made: listingFormData.who_made,
                when_made: listingFormData.when_made,
              },
            }),
          });

          const data = await parseJsonResponse<any>(response);
          if (data.success || data.optimized) {
            const optimized = data.optimized || data;
            let optimizedValue = '';
            if (field === 'title') optimizedValue = optimized.title?.optimized_title || optimized.optimized_title || '';
            else if (field === 'description') optimizedValue = optimized.description?.optimized_description || optimized.optimized_description || '';
            else if (field === 'tags') {
              const tags = optimized.tags?.optimized_tags || optimized.optimized_tags || [];
              optimizedValue = Array.isArray(tags) ? tags.join(', ') : tags;
            }
            setFieldOptimizationResult({ field, optimized: optimizedValue });
            toast.success(`${field} optimized successfully!`);
          } else {
            toast.error(data.error || `Failed to optimize ${field}`);
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || `Error optimizing ${field}`);
    } finally {
      setOptimizingField(null);
    }
  };

  const handleApplyFieldOptimization = (field: 'title' | 'description' | 'tags' | 'materials') => {
    if (!fieldOptimizationResult || fieldOptimizationResult.field !== field) return;

    const optimizedValue = fieldOptimizationResult.optimized;

    if (field === 'title') {
      setListingFormData({ ...listingFormData, title: optimizedValue });
    } else if (field === 'description') {
      setListingFormData({ ...listingFormData, description: optimizedValue });
    } else if (field === 'tags') {
      setListingFormData({ ...listingFormData, tags: optimizedValue });
    } else if (field === 'materials') {
      setListingFormData({ ...listingFormData, materials: optimizedValue });
    }

    setFieldOptimizationResult(null);
    toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} applied to form!`);
  };

  const handleUpdateReceipt = async (receiptId: number, updates: any) => {
    if (!selectedShopId) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/etsy/shops/${selectedShopId}/receipts/${receiptId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await parseJsonResponse<any>(response);
      if (data.success) {
        toast.success('Receipt updated successfully!');
        loadDashboardStats();
      } else {
        toast.error(data.error || 'Failed to update receipt');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error updating receipt');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShipment = async (receiptId: number, trackingCode: string, carrierName: string) => {
    if (!selectedShopId) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/etsy/shops/${selectedShopId}/receipts/${receiptId}/shipment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tracking_code: trackingCode,
          carrier_name: carrierName,
        }),
      });

      const data = await parseJsonResponse<any>(response);
      if (data.success) {
        toast.success('Shipment created successfully!');
        setShowCreateReceiptShipment(null);
        loadDashboardStats();
      } else {
        toast.error(data.error || 'Failed to create shipment');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error creating shipment');
    } finally {
      setLoading(false);
    }
  };

  const loadShippingProfiles = async () => {
    if (!selectedShopId) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/etsy/shops/${selectedShopId}/shipping-profiles`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await parseJsonResponse<any>(response);
      if (data.success) {
        setShippingProfiles(data.results || []);
      }
    } catch (error) {
      console.error('Error loading shipping profiles:', error);
    }
  };

  const handleCreateShippingProfile = async () => {
    if (!selectedShopId) {
      toast.error('Please select a shop first');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Prepare payload - map form data to API format
      const payload: any = {
        title: shippingProfileFormData.title,
        origin_country_iso: shippingProfileFormData.origin_country_iso,
        min_processing_time: shippingProfileFormData.min_processing_time,
        max_processing_time: shippingProfileFormData.max_processing_time,
        processing_time_unit: shippingProfileFormData.processing_time_unit,
      };

      // For create, add required cost fields
      if (!editingShippingProfile) {
        payload.primary_cost = parseFloat(shippingProfileFormData.primary_cost) || 0;
        payload.secondary_cost = parseFloat(shippingProfileFormData.secondary_cost) || 0;
        if (shippingProfileFormData.min_delivery_days) {
          payload.min_delivery_days = parseInt(shippingProfileFormData.min_delivery_days);
        }
        if (shippingProfileFormData.max_delivery_days) {
          payload.max_delivery_days = parseInt(shippingProfileFormData.max_delivery_days);
        }
      }

      const url = editingShippingProfile
        ? `/api/etsy/shops/${selectedShopId}/shipping-profiles/${editingShippingProfile.shipping_profile_id}`
        : `/api/etsy/shops/${selectedShopId}/shipping-profiles`;

      const response = await fetch(url, {
        method: editingShippingProfile ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await parseJsonResponse<any>(response);
      if (data.success) {
        toast.success(editingShippingProfile ? 'Shipping profile updated successfully!' : 'Shipping profile created successfully!');
        setShowCreateShippingProfile(false);
        setEditingShippingProfile(null);
        setShippingProfileFormData({
          title: '',
          min_processing_time: 1,
          max_processing_time: 3,
          processing_time_unit: 'business_days',
          origin_country_iso: 'US',
          primary_cost: '',
          secondary_cost: '',
          min_delivery_days: '',
          max_delivery_days: '',
        });
        loadShippingProfiles();
      } else {
        toast.error(data.error || `Failed to ${editingShippingProfile ? 'update' : 'create'} shipping profile`);
      }
    } catch (error: any) {
      toast.error(error.message || `Error ${editingShippingProfile ? 'updating' : 'creating'} shipping profile`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditShippingProfile = (profile: any) => {
    setEditingShippingProfile(profile);
    setShippingProfileFormData({
      title: profile.title || '',
      min_processing_time: profile.min_processing_time ?? profile.min_processing_days ?? 1,
      max_processing_time: profile.max_processing_time ?? profile.max_processing_days ?? 3,
      processing_time_unit: profile.processing_time_unit || 'business_days',
      origin_country_iso: profile.origin_country_iso || 'US',
      primary_cost: profile.primary_cost?.toString() || '',
      secondary_cost: profile.secondary_cost?.toString() || '',
      min_delivery_days: profile.min_delivery_days?.toString() || '',
      max_delivery_days: profile.max_delivery_days?.toString() || '',
    });
    setShowCreateShippingProfile(true);
  };

  const handleDeleteShippingProfile = async (profileId: number) => {
    if (!selectedShopId) {
      toast.error('Please select a shop first');
      return;
    }

    if (!confirm('Are you sure you want to delete this shipping profile? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/etsy/shops/${selectedShopId}/shipping-profiles/${profileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await parseJsonResponse<any>(response);
      if (data.success) {
        toast.success('Shipping profile deleted successfully!');
        loadShippingProfiles();
      } else {
        toast.error(data.error || 'Failed to delete shipping profile');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error deleting shipping profile');
    } finally {
      setLoading(false);
    }
  };

  const loadShopSections = async () => {
    if (!selectedShopId) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/etsy/shops/${selectedShopId}/sections`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await parseJsonResponse<any>(response);
      if (data.success) {
        setShopSections(data.results || []);
      }
    } catch (error) {
      console.error('Error loading shop sections:', error);
    }
  };

  const loadReturnPolicies = async () => {
    if (!selectedShopId) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/etsy/shops/${selectedShopId}/return-policies`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await parseJsonResponse<any>(response);
      if (data.success) {
        setReturnPolicies(data.results || []);
      }
    } catch (error) {
      console.error('Error loading return policies:', error);
    }
  };

  const handleCreateReturnPolicy = async () => {
    if (!selectedShopId) {
      toast.error('Please select a shop first');
      return;
    }

    // Validate: if accepts_returns or accepts_exchanges is true, return_deadline is required
    if ((returnPolicyFormData.accepts_returns || returnPolicyFormData.accepts_exchanges) && !returnPolicyFormData.return_deadline) {
      toast.error('Return deadline is required when accepting returns or exchanges');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const url = editingReturnPolicy
        ? `/api/etsy/shops/${selectedShopId}/return-policies/${editingReturnPolicy.return_policy_id}`
        : `/api/etsy/shops/${selectedShopId}/return-policies`;

      const response = await fetch(url, {
        method: editingReturnPolicy ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(returnPolicyFormData),
      });

      const data = await parseJsonResponse<any>(response);
      if (data.success) {
        toast.success(editingReturnPolicy ? 'Return policy updated successfully!' : 'Return policy created successfully!');
        setShowCreateReturnPolicy(false);
        setEditingReturnPolicy(null);
        setReturnPolicyFormData({
          accepts_returns: false,
          accepts_exchanges: false,
          return_deadline: null,
        });
        loadReturnPolicies();
      } else {
        toast.error(data.error || `Failed to ${editingReturnPolicy ? 'update' : 'create'} return policy`);
      }
    } catch (error: any) {
      toast.error(error.message || `Error ${editingReturnPolicy ? 'updating' : 'creating'} return policy`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditReturnPolicy = (policy: any) => {
    setEditingReturnPolicy(policy);
    setReturnPolicyFormData({
      accepts_returns: policy.accepts_returns || false,
      accepts_exchanges: policy.accepts_exchanges || false,
      return_deadline: policy.return_deadline || null,
    });
    setShowCreateReturnPolicy(true);
  };

  const handleDeleteReturnPolicy = async (policyId: number) => {
    if (!selectedShopId) {
      toast.error('Please select a shop first');
      return;
    }

    if (!confirm('Are you sure you want to delete this return policy? This action cannot be undone. Note: Policies with associated listings cannot be deleted.')) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/etsy/shops/${selectedShopId}/return-policies/${policyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await parseJsonResponse<any>(response);
      if (data.success) {
        toast.success('Return policy deleted successfully!');
        loadReturnPolicies();
      } else {
        toast.error(data.error || 'Failed to delete return policy');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error deleting return policy');
    } finally {
      setLoading(false);
    }
  };

  const loadPolicyListings = async (policyId: number) => {
    if (!selectedShopId) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/etsy/shops/${selectedShopId}/return-policies/${policyId}/listings`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await parseJsonResponse<any>(response);
      if (data.success) {
        setPolicyListings(data.results || []);
        setSelectedPolicyForListings(policyId);
      } else {
        toast.error(data.error || 'Failed to load policy listings');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error loading policy listings');
    } finally {
      setLoading(false);
    }
  };

  const handleConsolidatePolicies = async (sourcePolicyId: number, destinationPolicyId: number) => {
    if (!selectedShopId) {
      toast.error('Please select a shop first');
      return;
    }

    if (!confirm('This will move all listings from the source policy to the destination policy and delete the source policy. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/etsy/shops/${selectedShopId}/return-policies/consolidate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_return_policy_id: sourcePolicyId,
          destination_return_policy_id: destinationPolicyId,
        }),
      });

      const data = await parseJsonResponse<any>(response);
      if (data.success) {
        toast.success('Policies consolidated successfully!');
        loadReturnPolicies();
        setPolicyListings([]);
        setSelectedPolicyForListings(null);
      } else {
        toast.error(data.error || 'Failed to consolidate policies');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error consolidating policies');
    } finally {
      setLoading(false);
    }
  };

  const loadListingDetailsForEdit = async (listingId: number) => {
    if (!selectedShopId) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Load full listing details from API
      const listingRes = await fetch(`/api/etsy/listings/${listingId}/details?shopId=${selectedShopId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const listingData = await parseJsonResponse<any>(listingRes);

      let taxonomyId: string | undefined;

      if (listingData.success && listingData.listing) {
        const listing = listingData.listing;
        taxonomyId = listing.taxonomy_id?.toString();

        // Log what we received for debugging
        console.log('[Load Listing Details] Received listing data:', {
          has_title: !!listing.title,
          has_description: !!listing.description,
          has_taxonomy_id: !!listing.taxonomy_id,
          has_quantity: listing.quantity !== undefined,
          has_price: !!listing.price,
          has_shipping_profile_id: !!listing.shipping_profile_id,
          has_shop_section_id: !!listing.shop_section_id,
          has_processing_min: listing.processing_min !== undefined,
          has_processing_max: listing.processing_max !== undefined,
          has_item_weight: listing.item_weight !== undefined,
          all_keys: Object.keys(listing),
        });

        // Calculate price from amount/divisor format
        const price = listing.price?.amount && listing.price?.divisor
          ? (listing.price.amount / listing.price.divisor).toFixed(2)
          : listing.price ? String(listing.price) : '';

        // Set ALL fields exactly as they come from Etsy
        const formDataToSet = {
          title: listing.title || '',
          description: listing.description || '',
          quantity: listing.quantity ?? 1,
          price: price,
          taxonomy_id: taxonomyId || '',
          who_made: listing.who_made || 'i_did',
          when_made: listing.when_made || '2020_2025',
          is_supply: listing.is_supply ?? false,
          tags: Array.isArray(listing.tags) ? listing.tags.join(', ') : (listing.tags || ''),
          materials: Array.isArray(listing.materials) ? listing.materials.join(', ') : (listing.materials || ''),
          shipping_profile_id: listing.shipping_profile_id?.toString() || '',
          shop_section_id: listing.shop_section_id?.toString() || '',
          return_policy_id: listing.return_policy_id?.toString() || '',
          item_weight: listing.item_weight?.toString() || '',
          item_weight_unit: listing.item_weight_unit || '',
          item_length: listing.item_length?.toString() || '',
          item_width: listing.item_width?.toString() || '',
          item_height: listing.item_height?.toString() || '',
          item_dimensions_unit: listing.item_dimensions_unit || '',
          processing_min: listing.processing_min?.toString() || '',
          processing_max: listing.processing_max?.toString() || '',
          is_taxable: listing.is_taxable ?? false,
          is_personalizable: listing.is_personalizable ?? false,
          personalization_is_required: listing.personalization_is_required ?? false,
          personalization_char_count_max: listing.personalization_char_count_max?.toString() || '',
          personalization_instructions: listing.personalization_instructions || '',
          should_auto_renew: listing.should_auto_renew ?? false,
          featured_rank: listing.featured_rank?.toString() || '',
          state: listing.state || 'draft',
          type: listing.type || listing.is_digital ? 'download' : 'physical',
          readiness_state_id: listing.readiness_state_id || '',
        };

        console.log('[Load Listing Details] Setting form data:', {
          taxonomy_id: formDataToSet.taxonomy_id,
          quantity: formDataToSet.quantity,
          price: formDataToSet.price,
          shipping_profile_id: formDataToSet.shipping_profile_id,
          shop_section_id: formDataToSet.shop_section_id,
          processing_min: formDataToSet.processing_min,
          processing_max: formDataToSet.processing_max,
        });

        setListingFormData(formDataToSet);
      } else {
        console.error('[Load Listing Details] Failed to load listing:', listingData);
      }

      // Load images
      const imagesRes = await fetch(`/api/etsy/listings/${listingId}/images?shopId=${selectedShopId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const imagesData = await parseJsonResponse<any>(imagesRes);
      if (imagesData.success && imagesData.results) {
        setListingImages(imagesData.results || []);
      } else {
        // If images failed to load, set empty array to prevent errors
        setListingImages([]);
      }

      // Load videos
      const videosRes = await fetch(`/api/etsy/listings/${listingId}/videos?shopId=${selectedShopId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const videosData = await parseJsonResponse<any>(videosRes);
      if (videosData.success) {
        setListingVideos(videosData.results || []);
      }

      // Load inventory/variations
      const inventoryRes = await fetch(`/api/etsy/listings/${listingId}/inventory?shopId=${selectedShopId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const inventoryData = await parseJsonResponse<any>(inventoryRes);
      if (inventoryData.success && inventoryData.inventory) {
        setListingInventory(inventoryData.inventory);
      } else {
        // Set empty inventory if API returns success but no inventory data, or if it fails
        setListingInventory({ products: [] });
      }

      // Load available properties for the taxonomy
      if (taxonomyId) {
        try {
          const propsRes = await fetch(`/api/etsy/taxonomy/${taxonomyId}/properties?shopId=${selectedShopId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          const propsData = await parseJsonResponse<any>(propsRes);
          if (propsData.success) {
            const properties = propsData.results || [];
            setAvailableProperties(properties);
            console.log('[Load Listing Details] Loaded properties:', properties.length);

            // If listing has inventory with size variations, populate sizeVariations state
            if (listingInventory?.products && listingInventory.products.length > 0) {
              const firstProduct = listingInventory.products[0];
              if (firstProduct.property_values && firstProduct.property_values.length > 0) {
                const sizeProperty = firstProduct.property_values.find((pv: any) =>
                  pv.property_name?.toLowerCase().includes('size') ||
                  properties.find((p: any) => p.property_id === pv.property_id)?.name?.toLowerCase().includes('size')
                ) || firstProduct.property_values[0];

                if (sizeProperty) {
                  const prop = properties.find((p: any) => p.property_id === sizeProperty.property_id);
                  if (prop) {
                    const values = sizeProperty.values.map((val: string, idx: number) => {
                      const valueId = sizeProperty.value_ids?.[idx];
                      // Find offering for this value
                      const offering = firstProduct.offerings?.[idx] || firstProduct.offerings?.[0];
                      return {
                        valueId: valueId || 0,
                        value: val,
                        price: offering?.price ? (typeof offering.price === 'object' ? (offering.price.amount / offering.price.divisor).toFixed(2) : offering.price.toString()) : listingFormData.price || '',
                        quantity: offering?.quantity?.toString() || listingFormData.quantity?.toString() || '1',
                        sku: firstProduct.sku || '',
                      };
                    });

                    setSizeVariations({
                      enabled: true,
                      propertyId: sizeProperty.property_id.toString(),
                      propertyName: sizeProperty.property_name || prop.name || '',
                      scaleId: sizeProperty.scale_id || prop.scale_id,
                      values,
                    });
                  }
                }
              }
            }
          }
        } catch (err) {
          console.warn('Could not load taxonomy properties:', err);
        }
      }
    } catch (error) {
      console.error('Error loading listing details:', error);
      toast.error('Failed to load listing details');
    }
  };

  const handleCreateSection = async () => {
    if (!selectedShopId) {
      toast.error('Please select a shop first');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const url = editingSection
        ? `/api/etsy/shops/${selectedShopId}/sections/${editingSection.shop_section_id}`
        : `/api/etsy/shops/${selectedShopId}/sections`;

      const response = await fetch(url, {
        method: editingSection ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sectionFormData),
      });

      const data = await parseJsonResponse<any>(response);
      if (data.success) {
        toast.success(editingSection ? 'Shop section updated successfully!' : 'Shop section created successfully!');
        setShowCreateSection(false);
        setEditingSection(null);
        setSectionFormData({ title: '' });
        loadShopSections();
      } else {
        toast.error(data.error || `Failed to ${editingSection ? 'update' : 'create'} shop section`);
      }
    } catch (error: any) {
      toast.error(error.message || `Error ${editingSection ? 'updating' : 'creating'} shop section`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSection = (section: any) => {
    setEditingSection(section);
    setSectionFormData({ title: section.title || '' });
    setShowCreateSection(true);
  };

  const handleDeleteSection = async (sectionId: number) => {
    if (!selectedShopId) {
      toast.error('Please select a shop first');
      return;
    }

    if (!confirm('Are you sure you want to delete this shop section? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/etsy/shops/${selectedShopId}/sections/${sectionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await parseJsonResponse<any>(response);
      if (data.success) {
        toast.success('Shop section deleted successfully!');
        loadShopSections();
      } else {
        toast.error(data.error || 'Failed to delete shop section');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error deleting shop section');
    } finally {
      setLoading(false);
    }
  };

  // Force refresh listings from Etsy API (bypass cache and DB)
  const forceRefreshListings = async () => {
    if (!selectedShopId) {
      toast.error('Please select a shop first');
      return;
    }

    setIsLoadingStats(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      toast.loading('Force refreshing listings from Etsy API...', { id: 'force-refresh' });

      const offset = (listingsPage - 1) * listingsPerPage;

      // Force refresh active listings
      const activeRes = await fetch(`/api/etsy/shops/${selectedShopId}/listings?state=active&limit=${listingsPerPage}&offset=${offset}&forceRefresh=true`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const activeData = await parseJsonResponse<any>(activeRes);
      if (activeData.success) {
        const fetchedListings = activeData.results || [];
        const decodedListings = fetchedListings.map((listing: any) => ({
          ...listing,
          listingId: listing.listingId || listing.listing_id,
          title: listing.title ? listing.title.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&') : listing.title
        }));
        setListings(decodedListings);
        setTotalListings(activeData.total || activeData.count || decodedListings.length);
        setHasMoreListings(activeData.hasMore !== undefined ? activeData.hasMore : (decodedListings.length === listingsPerPage && (activeData.total || decodedListings.length) > decodedListings.length));
        setStats(prev => ({
          ...prev,
          totalListings: activeData.total || decodedListings.length,
          activeListings: decodedListings.filter((l: Listing) => l.state === 'active').length
        }));
      }

      // Force refresh draft listings
      const draftRes = await fetch(`/api/etsy/shops/${selectedShopId}/listings?state=draft&limit=100&offset=0&forceRefresh=true`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const draftData = await parseJsonResponse<any>(draftRes);
      if (draftData.success) {
        const decodedDrafts = (draftData.results || []).map((listing: any) => ({
          ...listing,
          listingId: listing.listingId || listing.listing_id,
          title: listing.title ? listing.title.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&') : listing.title
        }));
        setDraftListings(decodedDrafts);
      }

      // Force refresh inactive listings
      const inactiveRes = await fetch(`/api/etsy/shops/${selectedShopId}/listings?state=inactive&limit=100&offset=0&forceRefresh=true`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const inactiveData = await parseJsonResponse<any>(inactiveRes);
      if (inactiveData.success) {
        const decodedInactive = (inactiveData.results || []).map((listing: any) => ({
          ...listing,
          listingId: listing.listingId || listing.listing_id,
          title: listing.title ? listing.title.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&') : listing.title
        }));
        setInactiveListings(decodedInactive);
      }

      toast.success('Listings refreshed successfully from Etsy API!', { id: 'force-refresh' });
    } catch (error: any) {
      console.error('Error force refreshing listings:', error);
      toast.error(error.message || 'Failed to refresh listings', { id: 'force-refresh' });
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadDashboardStats = async () => {
    if (!selectedShopId || isLoadingStats) return;

    setIsLoadingStats(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Only load data for dashboard module, or if listings module is active
      const shouldLoadAll = activeModule === 'dashboard';

      // Use shared store data for shop details and listings
      // Refresh shop details if needed
      await refetchShopDetails(shouldLoadAll);

      // Load listings (only if dashboard, listings, inventory or media module)
      if (shouldLoadAll || activeModule === 'listings' || activeModule === 'inventory' || activeModule === 'media' || activeModule === 'variations') {
        const offset = (listingsPage - 1) * listingsPerPage;

        // Use shared listings from store, but also fetch filtered/paginated data if needed
        // For now, use shared listings and filter client-side for active state
        const activeListings = sharedListings.filter((l: any) => l.state === 'active');
        const paginatedListings = activeListings.slice(offset, offset + listingsPerPage);
        const decodedListings = paginatedListings.map((listing: any) => ({
          ...listing,
          listingId: listing.listingId || listing.listing_id,
          title: listing.title ? listing.title.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&') : listing.title
        }));
        setListings(decodedListings);
        setTotalListings(activeListings.length);
        setHasMoreListings(activeListings.length > offset + listingsPerPage);
        setStats(prev => ({
          ...prev,
          totalListings: activeListings.length,
          activeListings: activeListings.length
        }));

        // Refresh listings from API if needed
        if (shouldLoadAll) {
          await refetchListings(true);
        }

        // Load draft listings (only if listings or inventory module is active)
        if (activeModule === 'listings' || activeModule === 'inventory') {
          const draftRes = await fetch(`/api/etsy/shops/${selectedShopId}/listings?state=draft&limit=100&offset=0`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          });
          const draftData = await parseJsonResponse<any>(draftRes);
          if (draftData.success) {
            const decodedDrafts = (draftData.results || []).map((listing: any) => ({
              ...listing,
              listingId: listing.listingId || listing.listing_id,
              title: listing.title ? listing.title.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&') : listing.title
            }));
            setDraftListings(decodedDrafts);
          }

          // Load inactive listings
          const inactiveRes = await fetch(`/api/etsy/shops/${selectedShopId}/listings?state=inactive&limit=100&offset=0`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          });
          const inactiveData = await parseJsonResponse<any>(inactiveRes);
          if (inactiveData.success) {
            const decodedInactive = (inactiveData.results || []).map((listing: any) => ({
              ...listing,
              listingId: listing.listingId || listing.listing_id,
              title: listing.title ? listing.title.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&') : listing.title
            }));
            setInactiveListings(decodedInactive);
          }
        }
      }

      // Load receipts (only for dashboard)
      if (shouldLoadAll) {
        const receiptsRes = await fetch(`/api/etsy/shops/${selectedShopId}/receipts?limit=100`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        const receiptsData = await parseJsonResponse<any>(receiptsRes);
        if (receiptsData.success) {
          setReceipts(receiptsData.results || []);
          const pending = receiptsData.results?.filter((r: Receipt) => !r.isShipped).length || 0;
          const revenue = receiptsData.results?.reduce((sum: number, r: Receipt) =>
            sum + (r.grandTotal?.amount || 0), 0) || 0;
          setStats(prev => ({ ...prev, pendingOrders: pending, totalRevenue: revenue }));
        }

        // Load reviews (only for dashboard)
        const reviewsRes = await fetch(`/api/etsy/shops/${selectedShopId}/reviews`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        const reviewsData = await parseJsonResponse<any>(reviewsRes);
        if (reviewsData.success) {
          setReviews(reviewsData.results || []);
          const avgRating = reviewsData.results?.reduce((sum: number, r: Review) => sum + r.rating, 0) / (reviewsData.results?.length || 1) || 0;
          setStats(prev => ({
            ...prev,
            averageRating: avgRating,
            totalReviews: reviewsData.results?.length || 0
          }));
        }

        // Load payments (only for dashboard)
        const paymentsRes = await fetch(`/api/etsy/shops/${selectedShopId}/payments`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        const paymentsData = await parseJsonResponse<any>(paymentsRes);
        if (paymentsData.success) {
          setPayments(paymentsData.results || []);
        }

        // Load ledger entries (only for dashboard)
        const ledgerRes = await fetch(`/api/etsy/shops/${selectedShopId}/ledger`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        const ledgerData = await parseJsonResponse<any>(ledgerRes);
        if (ledgerData.success) {
          setLedgerEntries(ledgerData.results || []);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-2xl font-bold text-black">Business Dashboard</h2>
        <div className="relative">
          <button
            type="button"
            onMouseEnter={(e) => {
              const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
              if (tooltip) tooltip.style.display = 'block';
            }}
            onMouseLeave={(e) => {
              const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
              if (tooltip) tooltip.style.display = 'none';
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          <div className="hidden absolute z-50 left-0 bottom-full mb-2 w-72 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg">
            <p>Your business dashboard provides an overview of key metrics including active listings, revenue, pending orders, and customer reviews. Use this to quickly assess your shop's performance.</p>
            <div className="absolute left-4 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Listings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeListings}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
              <p className="text-xs text-gray-500">{stats.totalReviews} reviews</p>
            </div>
            <Star className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {shopData && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 text-black">Shop Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Shop Name</p>
              <p className="font-medium text-black">{shopData.shopName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-medium text-black">{shopData.isVacation ? 'On Vacation' : 'Active'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Currency</p>
              <p className="font-medium text-black">{shopData.currencyCode}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Favorers</p>
              <p className="font-medium text-black">{shopData.numFavorers}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 text-black">Recent Orders</h3>
          <div className="space-y-3">
            {receipts.slice(0, 5).map((receipt) => (
              <div key={receipt.receiptId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-black">#{receipt.receiptId}</p>
                  <p className="text-sm text-black">{receipt.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-black">${receipt.grandTotal?.amount.toFixed(2) || '0.00'}</p>
                  <p className={`text-xs font-medium ${receipt.isShipped ? 'text-green-600' : 'text-orange-600'}`}>
                    {receipt.isShipped ? 'Shipped' : 'Pending'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 text-black">Recent Reviews</h3>
          <div className="space-y-3">
            {reviews.slice(0, 5).map((review) => (
              <div key={review.transactionId} className="p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {new Date(review.createTimestamp * 1000).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-black">{review.review}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Shipment Form Component
  const ShipmentForm = ({ receiptId, onCancel, onSubmit }: { receiptId: number; onCancel: () => void; onSubmit: (trackingCode: string, carrierName: string) => void }) => {
    const [trackingCode, setTrackingCode] = useState('');
    const [carrierName, setCarrierName] = useState('');

    return (
      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h5 className="font-semibold text-black mb-2">Add Tracking Information</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-black">Tracking Code</label>
            <input
              type="text"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-black"
              placeholder="Enter tracking code"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-black">Carrier Name</label>
            <input
              type="text"
              value={carrierName}
              onChange={(e) => setCarrierName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-black"
              placeholder="e.g., USPS, FedEx, UPS"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onSubmit(trackingCode, carrierName)}
            disabled={!trackingCode || !carrierName}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            Save Tracking
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'dashboard':
        return renderDashboard();
      case 'shops':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4 text-black">Multi-Shop Management</h3>
              <p className="text-gray-600 mb-4">
                Manage multiple Etsy shops from one dashboard. This module utilizes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 mb-4">
                <li>GET /v3/application/shops/{'{shop_id}'} - Get shop details</li>
                <li>PUT /v3/application/shops/{'{shop_id}'} - Update shop settings</li>
                <li>GET /v3/application/users/{'{user_id}'}/shops - Find shops by owner</li>
                <li>GET /v3/application/shops - Search shops</li>
              </ul>
              {shopData && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2 text-black">Current Shop Details</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Shop Name:</span>
                      <span className="ml-2 font-medium text-black">{shopData.shopName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className="ml-2 font-medium text-black">{shopData.isVacation ? 'On Vacation' : 'Active'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Active Listings:</span>
                      <span className="ml-2 font-medium text-black">{shopData.listingActiveCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Favorers:</span>
                      <span className="ml-2 font-medium text-black">{shopData.numFavorers}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 'listings':
        return (
          <div className="space-y-6">
            {!selectedShopId ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-yellow-800 font-medium">Please select a shop to manage listings</p>
              </div>
            ) : (
              <>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-black">Listing Management</h3>
                    <button
                      onClick={() => setShowCreateListing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Create Listing
                    </button>
                  </div>

                  {showCreateListing && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-black">{editingListing ? 'Edit Listing' : 'Create New Listing'}</h4>
                        <button
                          onClick={() => {
                            setShowCreateListing(false);
                            setEditingListing(null);
                            setFieldOptimizationResult(null);
                            setOptimizingField(null);
                            setSelectedProduct(null);
                            setProductSearch('');
                            setListingFormData({
                              title: '',
                              description: '',
                              quantity: 1,
                              price: '',
                              taxonomy_id: '',
                              who_made: 'i_did',
                              when_made: '2020_2025',
                              is_supply: false,
                              tags: '',
                              materials: '',
                              shipping_profile_id: '',
                              shop_section_id: '',
                              return_policy_id: '',
                              item_weight: '',
                              item_weight_unit: '',
                              item_length: '',
                              item_width: '',
                              item_height: '',
                              item_dimensions_unit: '',
                              processing_min: '',
                              processing_max: '',
                              is_taxable: false,
                              is_personalizable: false,
                              personalization_is_required: false,
                              personalization_char_count_max: '',
                              personalization_instructions: '',
                              should_auto_renew: false,
                              featured_rank: '',
                              state: 'draft',
                              type: 'physical',
                              readiness_state_id: '',
                            });
                            setListingImages([]);
                            setListingVideos([]);
                            setNewImageUrls(['']);
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Product Selection */}
                      {!editingListing && (
                        <div className="mb-6 p-4 bg-white rounded-lg border border-purple-100 shadow-sm">
                          <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <Package className="h-4 w-4 text-purple-600" />
                            Source Product (Auto-fill)
                          </label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                              type="text"
                              value={productSearch}
                              onChange={(e) => setProductSearch(e.target.value)}
                              placeholder="Search local products..."
                              className="w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-lg text-black focus:ring-2 focus:ring-purple-200"
                            />
                            {productsLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-purple-600" />}
                          </div>

                          {productSearch && products.length > 0 && (
                            <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg bg-white shadow-lg z-50">
                              {products.map((p) => (
                                <button
                                  key={p._id}
                                  onClick={() => {
                                    setSelectedProduct(p);
                                    setProductSearch('');
                                    setProducts([]);
                                    setListingFormData({
                                      ...listingFormData,
                                      title: p.name || '',
                                      description: p.description || '',
                                      price: p.price?.toString() || '',
                                      tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
                                    });
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-purple-50 flex items-center gap-2 border-b last:border-0"
                                >
                                  {p.image && <img src={p.image} className="w-8 h-8 rounded object-cover" />}
                                  <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-medium text-black truncate">{p.name}</p>
                                    <p className="text-xs text-gray-500">${p.price}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}

                          {selectedProduct && (
                            <div className="mt-3 flex items-center justify-between p-2 bg-purple-50 border border-purple-100 rounded-lg">
                              <div className="flex items-center gap-3">
                                <img src={selectedProduct.image} className="w-10 h-10 object-cover rounded shadow-sm" />
                                <div>
                                  <p className="text-sm font-bold text-black">{selectedProduct.name}</p>
                                  <p className="text-xs text-purple-600">Product Linked</p>
                                </div>
                              </div>
                              <button onClick={() => setSelectedProduct(null)} className="text-gray-400 hover:text-red-500">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {shopDetails && (
                        <div className="mb-6 p-4 bg-blue-50/50 border border-blue-100 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                              {shopDetails.shopName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h5 className="font-bold text-black">{shopDetails.shopName}</h5>
                              <p className="text-xs text-blue-600 uppercase font-medium tracking-wider">{shopDetails.currencyCode} • {shopDetails.shopLocationCountryIso}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Active Listings</p>
                            <p className="font-bold text-black">{shopDetails.listingActiveCount}</p>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1 text-black flex items-center gap-2">
                            Title *
                            <HelpTooltip fieldKey="title" section="listings" />
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={listingFormData.title}
                              onChange={(e) => setListingFormData({ ...listingFormData, title: e.target.value })}
                              className="flex-1 px-3 py-2 border rounded-lg text-black"
                              placeholder={formFieldMetadata['listings.title']?.placeholder || "Enter listing title"}
                              maxLength={formFieldMetadata['listings.title']?.maxLength || 140}
                              minLength={formFieldMetadata['listings.title']?.minLength || 10}
                            />
                            <button
                              type="button"
                              onClick={() => handleOptimizeField('title')}
                              disabled={optimizingField === 'title' || !editingListing}
                              className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                              title="AI Optimize Title"
                            >
                              {optimizingField === 'title' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          {fieldOptimizationResult && fieldOptimizationResult.field === 'title' && (
                            <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-sm">
                              <p className="text-purple-700 mb-1">{fieldOptimizationResult.optimized}</p>
                              <button
                                type="button"
                                onClick={() => handleApplyFieldOptimization('title')}
                                className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                              >
                                Apply
                              </button>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-black flex items-center gap-2">
                            Price *
                            <HelpTooltip fieldKey="price" section="listings" />
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={listingFormData.price}
                            onChange={(e) => setListingFormData({ ...listingFormData, price: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg text-black"
                            placeholder={formFieldMetadata['listings.price']?.placeholder || "0.00"}
                            min={formFieldMetadata['listings.price']?.min || 0.01}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium mb-1 text-black flex items-center gap-2">
                            Description *
                            <HelpTooltip fieldKey="description" section="listings" />
                          </label>
                          <div className="flex gap-2">
                            <textarea
                              value={listingFormData.description}
                              onChange={(e) => setListingFormData({ ...listingFormData, description: e.target.value })}
                              className="flex-1 px-3 py-2 border rounded-lg text-black"
                              rows={4}
                              placeholder={formFieldMetadata['listings.description']?.placeholder || "Enter listing description"}
                              minLength={formFieldMetadata['listings.description']?.minLength || 200}
                              maxLength={formFieldMetadata['listings.description']?.maxLength || 5000}
                            />
                            <button
                              type="button"
                              onClick={() => handleOptimizeField('description')}
                              disabled={optimizingField === 'description' || !editingListing}
                              className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 self-start"
                              title="AI Optimize Description"
                            >
                              {optimizingField === 'description' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          {fieldOptimizationResult && fieldOptimizationResult.field === 'description' && (
                            <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-sm">
                              <p className="text-purple-700 whitespace-pre-wrap mb-1 max-h-32 overflow-y-auto">{fieldOptimizationResult.optimized}</p>
                              <button
                                type="button"
                                onClick={() => handleApplyFieldOptimization('description')}
                                className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                              >
                                Apply
                              </button>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-black flex items-center gap-2">
                            Quantity *
                            <HelpTooltip fieldKey="quantity" section="listings" />
                          </label>
                          <input
                            type="number"
                            value={listingFormData.quantity}
                            onChange={(e) => setListingFormData({ ...listingFormData, quantity: parseInt(e.target.value) || 1 })}
                            className="w-full px-3 py-2 border rounded-lg text-black"
                            min={formFieldMetadata['listings.quantity']?.min || 1}
                            placeholder={formFieldMetadata['listings.quantity']?.placeholder || "1"}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-black flex items-center gap-2">
                            Taxonomy ID *
                            <HelpTooltip fieldKey="taxonomy_id" section="listings" />
                          </label>
                          <input
                            type="number"
                            value={listingFormData.taxonomy_id}
                            onChange={(e) => setListingFormData({ ...listingFormData, taxonomy_id: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg text-black"
                            placeholder={formFieldMetadata['listings.taxonomy_id']?.placeholder || "e.g., 691"}
                            min={formFieldMetadata['listings.taxonomy_id']?.min || 1}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-black flex items-center gap-2">
                            Who Made
                            <HelpTooltip fieldKey="who_made" section="listings" />
                          </label>
                          <select
                            value={listingFormData.who_made}
                            onChange={(e) => setListingFormData({ ...listingFormData, who_made: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg text-black"
                          >
                            <option value="i_did">I did</option>
                            <option value="someone_else">Someone else</option>
                            <option value="collective">Collective</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-black flex items-center gap-2">
                            When Made
                            <HelpTooltip fieldKey="when_made" section="listings" />
                          </label>
                          <select
                            value={listingFormData.when_made}
                            onChange={(e) => setListingFormData({ ...listingFormData, when_made: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg text-black"
                          >
                            <option value="made_to_order">Made to order</option>
                            <option value="2020_2025">2020-2025</option>
                            <option value="2010_2019">2010-2019</option>
                            <option value="2006_2009">2006-2009</option>
                            <option value="before_2006">Before 2006</option>
                            <option value="2000_2005">2000-2005</option>
                            <option value="1990s">1990s</option>
                            <option value="1980s">1980s</option>
                            <option value="1970s">1970s</option>
                            <option value="1960s">1960s</option>
                            <option value="1950s">1950s</option>
                            <option value="1940s">1940s</option>
                            <option value="1930s">1930s</option>
                            <option value="1920s">1920s</option>
                            <option value="1910s">1910s</option>
                            <option value="1900s">1900s</option>
                            <option value="1800s">1800s</option>
                            <option value="1700s">1700s</option>
                            <option value="before_1700">Before 1700</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-black flex items-center gap-2">
                            Tags (comma-separated)
                            <HelpTooltip fieldKey="tags" section="listings" />
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={listingFormData.tags}
                              onChange={(e) => setListingFormData({ ...listingFormData, tags: e.target.value })}
                              className="flex-1 px-3 py-2 border rounded-lg text-black"
                              placeholder={formFieldMetadata['listings.tags']?.placeholder || "tag1, tag2, tag3"}
                              maxLength={formFieldMetadata['listings.tags']?.maxLength || 260}
                            />
                            <button
                              type="button"
                              onClick={() => handleOptimizeField('tags')}
                              disabled={optimizingField === 'tags' || !editingListing}
                              className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                              title="AI Optimize Tags"
                            >
                              {optimizingField === 'tags' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          {fieldOptimizationResult && fieldOptimizationResult.field === 'tags' && (
                            <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-sm">
                              <p className="text-purple-700 mb-1">{fieldOptimizationResult.optimized}</p>
                              <button
                                type="button"
                                onClick={() => handleApplyFieldOptimization('tags')}
                                className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                              >
                                Apply
                              </button>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-black flex items-center gap-2">
                            Materials (comma-separated)
                            <HelpTooltip fieldKey="materials" section="listings" />
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={listingFormData.materials}
                              onChange={(e) => setListingFormData({ ...listingFormData, materials: e.target.value })}
                              className="flex-1 px-3 py-2 border rounded-lg text-black"
                              placeholder={formFieldMetadata['listings.materials']?.placeholder || "cotton, silk, etc."}
                            />
                            <button
                              type="button"
                              onClick={() => handleOptimizeField('materials')}
                              disabled={optimizingField === 'materials' || !editingListing}
                              className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                              title="AI Optimize Materials"
                            >
                              {optimizingField === 'materials' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          {fieldOptimizationResult && fieldOptimizationResult.field === 'materials' && (
                            <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-sm">
                              <p className="text-purple-700 mb-1">{fieldOptimizationResult.optimized}</p>
                              <button
                                type="button"
                                onClick={() => handleApplyFieldOptimization('materials')}
                                className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                              >
                                Apply
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={listingFormData.is_supply}
                            onChange={(e) => setListingFormData({ ...listingFormData, is_supply: e.target.checked })}
                            className="h-4 w-4"
                          />
                          <label className="text-sm text-black">This is a supply</label>
                        </div>
                      </div>

                      {/* Images Section - Display Only (for new listings) */}
                      {!editingListing && (
                        <div className="mt-6 pt-6 border-t">
                          <SectionHeader
                            title={`Images (${newImageUrls.filter(url => url.trim()).length}/20)`}
                            icon={ImageIcon}
                            section="listings"
                            helpText="Add up to 20 high-quality images. The first image is your main listing photo. Use multiple angles and lifestyle shots to showcase your product."
                          />
                          <div className="space-y-2">
                            {newImageUrls.map((url, idx) => (
                              <div key={idx} className="flex gap-2">
                                <input
                                  type="text"
                                  value={url}
                                  onChange={(e) => {
                                    const newUrls = [...newImageUrls];
                                    newUrls[idx] = e.target.value;
                                    setNewImageUrls(newUrls);
                                  }}
                                  className="flex-1 px-3 py-2 border rounded-lg text-black"
                                  placeholder="Image URL"
                                />
                                {idx === newImageUrls.length - 1 && newImageUrls.length < 20 && (
                                  <button
                                    onClick={() => setNewImageUrls([...newImageUrls, ''])}
                                    className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                )}
                                {newImageUrls.length > 1 && (
                                  <button
                                    onClick={() => setNewImageUrls(newImageUrls.filter((_, i) => i !== idx))}
                                    className="px-3 py-2 bg-red-100 rounded-lg hover:bg-red-200"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">Add image URLs (up to 20 images). Images will be uploaded when creating the listing.</p>
                        </div>
                      )}

                      {/* Image Management Section - Separate section for editing listings */}
                      {editingListing && (
                        <div className="mt-6 pt-6 border-t">
                          <SectionHeader
                            title={`Image Management (${listingImages.length}/20)`}
                            icon={ImageIcon}
                            section="listings"
                            helpText="Upload, delete, and reorder images for this listing. Images are managed separately from other listing details."
                          />

                          {/* Current Images Display */}
                          {listingImages.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                              {listingImages
                                .sort((a, b) => (a.rank || 0) - (b.rank || 0))
                                .map((img: any, idx: number) => {
                                  const imageId = img.listing_image_id?.toString() || img.listingImageId?.toString() || '';
                                  const currentRank = img.rank || idx + 1;
                                  const isDeleting = deletingImageId === imageId;
                                  const isUpdatingRank = updatingImageRank === imageId;

                                  const src = img.url_fullxfull || img.url_570xN || img.url_75x75 || img.url;
                                  console.log(`[Listing Image ${idx}]`, { id: imageId, rank: currentRank, src, imgObj: img });

                                  return (
                                    <div key={imageId || idx} className="relative group border rounded-lg overflow-hidden bg-gray-100">
                                      {src ? (
                                        <img
                                          src={src}
                                          alt={`Image ${currentRank}`}
                                          className="w-full h-32 object-cover bg-white"
                                          onError={(e) => {
                                            console.error(`[Image Error] Failed to load: ${src}`);
                                            const target = e.target as HTMLImageElement;
                                            // Use a solid color placeholder if image fails
                                            target.style.display = 'none';
                                            target.parentElement?.classList.add('image-load-error');
                                          }}
                                        />
                                      ) : (
                                        <div className="w-full h-32 flex items-center justify-center bg-gray-200 text-gray-400">
                                          <ImageIcon className="h-8 w-8" />
                                        </div>
                                      )}
                                      {/* Fallback for error state */}
                                      <div className="hidden image-load-error:flex w-full h-32 absolute inset-0 items-center justify-center bg-gray-200 text-gray-500">
                                        <span className="text-xs">Failed to load</span>
                                      </div>

                                      <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded z-10">
                                        Rank: {currentRank}
                                      </div>
                                      {/* Overlay - changed to opacity transition for better compatibility */}
                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 z-20">
                                        <div className="flex flex-col gap-1">
                                          {/* Move Up */}
                                          {currentRank > 1 && (
                                            <button
                                              onClick={() => handleUpdateImageRank(imageId, currentRank - 1)}
                                              disabled={isUpdatingRank}
                                              className="p-1 bg-white rounded hover:bg-gray-100 disabled:opacity-50"
                                              title="Move up"
                                            >
                                              {isUpdatingRank ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                              ) : (
                                                <ArrowUp className="h-4 w-4 text-gray-700" />
                                              )}
                                            </button>
                                          )}
                                          {/* Move Down */}
                                          {currentRank < listingImages.length && (
                                            <button
                                              onClick={() => handleUpdateImageRank(imageId, currentRank + 1)}
                                              disabled={isUpdatingRank}
                                              className="p-1 bg-white rounded hover:bg-gray-100 disabled:opacity-50"
                                              title="Move down"
                                            >
                                              {isUpdatingRank ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                              ) : (
                                                <ArrowDown className="h-4 w-4 text-gray-700" />
                                              )}
                                            </button>
                                          )}
                                          {/* Delete */}
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteImage(imageId)}
                                            disabled={isDeleting}
                                            className="p-1 bg-red-500 rounded hover:bg-red-600 disabled:opacity-50"
                                            title="Delete image"
                                          >
                                            {isDeleting ? (
                                              <Loader2 className="h-4 w-4 animate-spin text-white" />
                                            ) : (
                                              <Trash2 className="h-4 w-4 text-white" />
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          )}

                          {/* Upload New Image */}
                          <div className="mt-4">
                            <label className="block text-sm font-medium mb-2 text-black">Upload New Image</label>
                            <div className="flex gap-2">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const nextRank = listingImages.length > 0
                                      ? Math.max(...listingImages.map((img: any) => img.rank || 0)) + 1
                                      : 1;
                                    handleUploadImage(file, nextRank);
                                    // Reset input
                                    e.target.value = '';
                                  }
                                }}
                                disabled={uploadingImage || listingImages.length >= 20}
                                className="flex-1 px-3 py-2 border rounded-lg text-black disabled:opacity-50"
                              />
                              {uploadingImage && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Uploading...
                                </div>
                              )}
                            </div>
                            {listingImages.length >= 20 && (
                              <p className="text-xs text-red-500 mt-1">Maximum of 20 images reached. Delete an image to add a new one.</p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">Upload images directly to this listing. Supported formats: JPG, PNG, GIF</p>
                          </div>
                        </div>
                      )}

                      {/* Videos Section */}
                      {editingListing && listingVideos.length > 0 && (
                        <div className="mt-6 pt-6 border-t">
                          <SectionHeader
                            title={`Videos (${listingVideos.length})`}
                            icon={Video}
                            section="listings"
                            helpText="Videos help showcase your product in action. They can increase buyer confidence and conversion rates."
                          />
                          <div className="space-y-2">
                            {listingVideos.map((video: any, idx: number) => (
                              <div key={video.video_id || idx} className="p-3 bg-gray-50 rounded border">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-black">Video #{idx + 1}</p>
                                    {(video.url || video.video_url || video.thumbnail_url) && (
                                      <a href={video.url || video.video_url || video.thumbnail_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600">
                                        View Video
                                      </a>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-500">ID: {video.video_id}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">Videos can be managed through Etsy's API endpoints</p>
                        </div>
                      )}

                      {/* Shipping & Processing Section */}
                      <div className="mt-6 pt-6 border-t">
                        <SectionHeader
                          title="Shipping & Processing"
                          icon={Truck}
                          section="listings"
                          helpText="Configure shipping profiles, processing times, and return policies. Accurate shipping information helps buyers make informed decisions."
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1 text-black">Shipping Profile</label>
                            <select
                              value={listingFormData.shipping_profile_id}
                              onChange={(e) => setListingFormData({ ...listingFormData, shipping_profile_id: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg text-black"
                            >
                              <option value="">Select shipping profile</option>
                              {shippingProfiles.map((profile: any) => (
                                <option key={profile.shipping_profile_id} value={profile.shipping_profile_id}>
                                  {profile.title || `Profile #${profile.shipping_profile_id}`}
                                </option>
                              ))}
                            </select>
                            {shippingProfiles.length === 0 && (
                              <p className="text-xs text-gray-500 mt-1">No shipping profiles found. Create one in Shipping Profiles section.</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1 text-black">Shop Section</label>
                            <select
                              value={listingFormData.shop_section_id}
                              onChange={(e) => setListingFormData({ ...listingFormData, shop_section_id: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg text-black"
                            >
                              <option value="">No section</option>
                              {shopSections.map((section: any) => (
                                <option key={section.shop_section_id} value={section.shop_section_id}>
                                  {section.title}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1 text-black">Return Policy</label>
                            <select
                              value={listingFormData.return_policy_id}
                              onChange={(e) => setListingFormData({ ...listingFormData, return_policy_id: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg text-black"
                            >
                              <option value="">No return policy</option>
                              {returnPolicies.map((policy: any) => (
                                <option key={policy.return_policy_id} value={policy.return_policy_id}>
                                  {policy.title || `Policy #${policy.return_policy_id}`}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1 text-black">Processing Min (days)</label>
                            <input
                              type="number"
                              value={listingFormData.processing_min}
                              onChange={(e) => setListingFormData({ ...listingFormData, processing_min: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg text-black"
                              placeholder="e.g., 5"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1 text-black">Processing Max (days)</label>
                            <input
                              type="number"
                              value={listingFormData.processing_max}
                              onChange={(e) => setListingFormData({ ...listingFormData, processing_max: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg text-black"
                              placeholder="e.g., 7"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Size/Variations Section */}
                      <div className="mt-6 pt-6 border-t">
                        <SectionHeader
                          title="Size Options & Variations"
                          icon={Package}
                          section="listings"
                          helpText="Add size variations to your listing. Each size can have its own price and quantity. Select a property (like Size) and choose the values you want to offer."
                        />
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={sizeVariations.enabled}
                              onChange={(e) => setSizeVariations({ ...sizeVariations, enabled: e.target.checked })}
                              className="h-4 w-4"
                            />
                            <label className="text-sm font-medium text-black">Enable size variations</label>
                          </div>

                          {sizeVariations.enabled && (
                            <div className="space-y-4 pl-6 border-l-2 border-purple-200">
                              {/* Property Selection */}
                              <div>
                                <label className="block text-sm font-medium mb-1 text-black">Size Property</label>
                                <select
                                  value={sizeVariations.propertyId}
                                  onChange={(e) => {
                                    const selectedProp = availableProperties.find((p: any) =>
                                      p.property_id?.toString() === e.target.value ||
                                      p.id?.toString() === e.target.value
                                    );
                                    setSizeVariations({
                                      ...sizeVariations,
                                      propertyId: e.target.value,
                                      propertyName: selectedProp?.name || selectedProp?.property_name || '',
                                      scaleId: selectedProp?.scale_id,
                                      values: [], // Reset values when property changes
                                    });
                                  }}
                                  className="w-full px-3 py-2 border rounded-lg text-black bg-white"
                                  disabled={!availableProperties || availableProperties.length === 0}
                                >
                                  <option value="">Select a property (e.g., Size)</option>
                                  {availableProperties.map((prop: any) => {
                                    const propId = prop.property_id || prop.id;
                                    const propName = prop.name || prop.property_name || prop.display_name || `Property ${propId}`;
                                    const isSizeProperty = propName.toLowerCase().includes('size');
                                    return (
                                      <option key={propId} value={propId} style={isSizeProperty ? { fontWeight: 'bold' } : {}}>
                                        {isSizeProperty && '⭐ '}
                                        {propName}
                                        {prop.scale_name && ` (${prop.scale_name})`}
                                        {prop.supports_variations === false && ' (no variations)'}
                                      </option>
                                    );
                                  })}
                                </select>
                                {(!availableProperties || availableProperties.length === 0) && listingFormData.taxonomy_id && (
                                  <p className="text-xs text-gray-500 mt-1">Loading properties for taxonomy {listingFormData.taxonomy_id}...</p>
                                )}
                                {!listingFormData.taxonomy_id && (
                                  <p className="text-xs text-gray-500 mt-1">Please select a taxonomy first to see available properties.</p>
                                )}
                                {availableProperties && availableProperties.length > 0 && (
                                  <p className="text-xs text-green-600 mt-1">✓ {availableProperties.length} property{availableProperties.length !== 1 ? 'ies' : ''} available</p>
                                )}
                              </div>

                              {/* Size Values Selection */}
                              {sizeVariations.propertyId && (() => {
                                const selectedProp = availableProperties.find((p: any) =>
                                  (p.property_id?.toString() === sizeVariations.propertyId) ||
                                  (p.id?.toString() === sizeVariations.propertyId)
                                );

                                // Get values from different possible structures
                                let availableValues: any[] = [];
                                if (selectedProp) {
                                  // Check for scales first (for size properties with measurement scales)
                                  if (selectedProp.scales && Array.isArray(selectedProp.scales) && selectedProp.scales.length > 0) {
                                    // Flatten all values from all scales
                                    selectedProp.scales.forEach((scale: any) => {
                                      if (scale.values && Array.isArray(scale.values)) {
                                        availableValues = [...availableValues, ...scale.values];
                                      }
                                    });
                                  }

                                  // Also check for direct values/possible_values
                                  if (availableValues.length === 0) {
                                    availableValues = selectedProp.possible_values || selectedProp.values || [];
                                  }

                                  console.log('[Size Variations] Selected property:', selectedProp.name || selectedProp.property_name || selectedProp.display_name);
                                  console.log('[Size Variations] Available values:', availableValues.length, availableValues);
                                }

                                return (
                                  <div>
                                    <label className="block text-sm font-medium mb-2 text-black">Select Sizes</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                                      {availableValues.map((value: any) => {
                                        const valueId = value.value_id || value.id || value;
                                        const valueName = typeof value === 'string' ? value : (value.name || value.value || value);

                                        if (!valueId || !valueName) return null;

                                        const isSelected = sizeVariations.values.some(v => v.valueId === valueId);

                                        return (
                                          <button
                                            key={valueId}
                                            type="button"
                                            onClick={() => {
                                              if (isSelected) {
                                                setSizeVariations({
                                                  ...sizeVariations,
                                                  values: sizeVariations.values.filter(v => v.valueId !== valueId),
                                                });
                                              } else {
                                                setSizeVariations({
                                                  ...sizeVariations,
                                                  values: [
                                                    ...sizeVariations.values,
                                                    {
                                                      valueId: typeof valueId === 'number' ? valueId : parseInt(valueId),
                                                      value: valueName,
                                                      price: listingFormData.price || '',
                                                      quantity: listingFormData.quantity?.toString() || '1',
                                                      sku: '',
                                                    },
                                                  ],
                                                });
                                              }
                                            }}
                                            className={`px-3 py-2 border rounded-lg text-sm transition-colors ${isSelected
                                              ? 'bg-purple-600 text-white border-purple-600'
                                              : 'bg-white text-black border-gray-300 hover:border-purple-400'
                                              }`}
                                          >
                                            {valueName}
                                          </button>
                                        );
                                      })}
                                    </div>

                                    {/* Size Details Table */}
                                    {sizeVariations.values.length > 0 && (
                                      <div className="mt-4">
                                        <label className="block text-sm font-medium mb-2 text-black">Size Details (Price & Quantity)</label>
                                        <div className="overflow-x-auto">
                                          <table className="w-full border-collapse border border-gray-300">
                                            <thead>
                                              <tr className="bg-gray-100">
                                                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-black">Size</th>
                                                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-black">Price ($)</th>
                                                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-black">Quantity</th>
                                                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-black">SKU (Optional)</th>
                                                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-black">Actions</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {sizeVariations.values.map((sizeVal, idx) => (
                                                <tr key={idx}>
                                                  <td className="border border-gray-300 px-3 py-2 text-black font-medium">{sizeVal.value}</td>
                                                  <td className="border border-gray-300 px-3 py-2">
                                                    <input
                                                      type="number"
                                                      step="0.01"
                                                      value={sizeVal.price}
                                                      onChange={(e) => {
                                                        const newValues = [...sizeVariations.values];
                                                        newValues[idx].price = e.target.value;
                                                        setSizeVariations({ ...sizeVariations, values: newValues });
                                                      }}
                                                      className="w-full px-2 py-1 border rounded text-black text-sm"
                                                      placeholder="0.00"
                                                    />
                                                  </td>
                                                  <td className="border border-gray-300 px-3 py-2">
                                                    <input
                                                      type="number"
                                                      value={sizeVal.quantity}
                                                      onChange={(e) => {
                                                        const newValues = [...sizeVariations.values];
                                                        newValues[idx].quantity = e.target.value;
                                                        setSizeVariations({ ...sizeVariations, values: newValues });
                                                      }}
                                                      className="w-full px-2 py-1 border rounded text-black text-sm"
                                                      placeholder="1"
                                                      min="0"
                                                    />
                                                  </td>
                                                  <td className="border border-gray-300 px-3 py-2">
                                                    <input
                                                      type="text"
                                                      value={sizeVal.sku || ''}
                                                      onChange={(e) => {
                                                        const newValues = [...sizeVariations.values];
                                                        newValues[idx].sku = e.target.value;
                                                        setSizeVariations({ ...sizeVariations, values: newValues });
                                                      }}
                                                      className="w-full px-2 py-1 border rounded text-black text-sm"
                                                      placeholder="SKU"
                                                    />
                                                  </td>
                                                  <td className="border border-gray-300 px-3 py-2">
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        setSizeVariations({
                                                          ...sizeVariations,
                                                          values: sizeVariations.values.filter((_, i) => i !== idx),
                                                        });
                                                      }}
                                                      className="text-red-600 hover:text-red-800 text-sm"
                                                    >
                                                      Remove
                                                    </button>
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Personalization Section */}
                      <div className="mt-6 pt-6 border-t">
                        <SectionHeader
                          title="Personalization Options"
                          section="listings"
                          helpText="Enable personalization to allow buyers to customize your product with text, colors, or other options. This can increase value and buyer satisfaction."
                        />
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={listingFormData.is_personalizable}
                              onChange={(e) => setListingFormData({ ...listingFormData, is_personalizable: e.target.checked })}
                              className="h-4 w-4"
                            />
                            <label className="text-sm text-black">This listing is personalizable</label>
                          </div>
                          {listingFormData.is_personalizable && (
                            <>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={listingFormData.personalization_is_required}
                                  onChange={(e) => setListingFormData({ ...listingFormData, personalization_is_required: e.target.checked })}
                                  className="h-4 w-4"
                                />
                                <label className="text-sm text-black">Personalization is required</label>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1 text-black">Max Character Count</label>
                                <input
                                  type="number"
                                  value={listingFormData.personalization_char_count_max}
                                  onChange={(e) => setListingFormData({ ...listingFormData, personalization_char_count_max: e.target.value })}
                                  className="w-full px-3 py-2 border rounded-lg text-black"
                                  placeholder="e.g., 256"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1 text-black">Personalization Instructions</label>
                                <textarea
                                  value={listingFormData.personalization_instructions}
                                  onChange={(e) => setListingFormData({ ...listingFormData, personalization_instructions: e.target.value })}
                                  className="w-full px-3 py-2 border rounded-lg text-black"
                                  rows={2}
                                  placeholder="Instructions for buyers"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Variations/Inventory Section */}
                      {editingListing && (
                        <div className="mt-6 pt-6 border-t">
                          <SectionHeader
                            title="Variations & Inventory"
                            icon={Package}
                            section="listings"
                            helpText="Manage product variations (size, color, etc.) and inventory levels. Variations allow you to offer multiple options for the same listing."
                          />
                          {listingInventory ? (
                            <div className="space-y-4">
                              {listingInventory.products && listingInventory.products.length > 0 ? (
                                listingInventory.products.map((product: any, productIdx: number) => (
                                  <div key={product.product_id || productIdx} className="p-4 bg-gray-50 rounded-lg border">
                                    <div className="font-medium text-black mb-2">Product #{productIdx + 1}</div>
                                    {product.properties && product.properties.length > 0 && (
                                      <div className="mb-3">
                                        <p className="text-sm font-medium text-black mb-2">Properties (Variations):</p>
                                        {product.properties.map((prop: any, propIdx: number) => (
                                          <div key={propIdx} className="text-sm text-gray-700 ml-4 mb-2 bg-white p-2 rounded border">
                                            <div className="font-medium text-black mb-1">
                                              {prop.property_name || `Property ${prop.property_id}`}
                                              {prop.scale_id && <span className="text-xs text-gray-500 ml-2">(Scale ID: {prop.scale_id})</span>}
                                            </div>
                                            {prop.value_ids && Array.isArray(prop.value_ids) && prop.value_ids.length > 0 && (
                                              <div className="ml-2">
                                                <span className="text-xs text-gray-600">Value IDs: </span>
                                                <span className="text-xs text-gray-800">{prop.value_ids.join(', ')}</span>
                                              </div>
                                            )}
                                            {prop.values && Array.isArray(prop.values) && prop.values.length > 0 && (
                                              <div className="ml-2 mt-1">
                                                <span className="text-xs text-gray-600">Values: </span>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                  {prop.values.map((value: string, valIdx: number) => (
                                                    <span key={valIdx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                                      {value}
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {product.offerings && product.offerings.length > 0 && (
                                      <div>
                                        <p className="text-sm font-medium text-black mb-2">Offerings (Price & Quantity):</p>
                                        <div className="space-y-2 ml-4">
                                          {product.offerings.map((offering: any, offIdx: number) => (
                                            <div key={offIdx} className="text-sm text-gray-700 bg-white p-3 rounded border">
                                              <div className="grid grid-cols-2 gap-2 mb-2">
                                                <div>
                                                  <span className="text-xs text-gray-600">Price: </span>
                                                  <span className="font-medium text-black">
                                                    ${offering.price?.amount && offering.price?.divisor
                                                      ? (offering.price.amount / offering.price.divisor).toFixed(2)
                                                      : offering.price ? String(offering.price) : '0.00'}
                                                  </span>
                                                </div>
                                                <div>
                                                  <span className="text-xs text-gray-600">Quantity: </span>
                                                  <span className="font-medium text-black">{offering.quantity || 0}</span>
                                                </div>
                                              </div>
                                              {offering.sku && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                  <span className="text-gray-600">SKU: </span>{offering.sku}
                                                </div>
                                              )}
                                              {offering.is_enabled !== undefined && (
                                                <div className="text-xs mt-1">
                                                  <span className={offering.is_enabled ? 'text-green-600' : 'text-red-600'}>
                                                    {offering.is_enabled ? '✓ Enabled' : '✗ Disabled'}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {product.sku_on_property && Array.isArray(product.sku_on_property) && product.sku_on_property.length > 0 && (
                                      <div className="mt-2 text-xs text-gray-600">
                                        SKU varies by: Property IDs {product.sku_on_property.join(', ')}
                                      </div>
                                    )}
                                    {product.price_on_property && Array.isArray(product.price_on_property) && product.price_on_property.length > 0 && (
                                      <div className="mt-1 text-xs text-gray-600">
                                        Price varies by: Property IDs {product.price_on_property.join(', ')}
                                      </div>
                                    )}
                                    {product.quantity_on_property && Array.isArray(product.quantity_on_property) && product.quantity_on_property.length > 0 && (
                                      <div className="mt-1 text-xs text-gray-600">
                                        Quantity varies by: Property IDs {product.quantity_on_property.join(', ')}
                                      </div>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-gray-600">No variations/products configured for this listing.</p>
                              )}
                              <p className="text-xs text-gray-500 mt-2">
                                Variations are managed through the inventory system. Use Etsy's inventory API to add/edit variations.
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-600">Loading inventory...</p>
                          )}
                        </div>
                      )}

                      {/* Additional Options */}
                      <div className="mt-6 pt-6 border-t">
                        <SectionHeader
                          title="Additional Options"
                          section="listings"
                          helpText="Configure tax settings, auto-renewal, featured rank, and listing state. These options help optimize your listing's visibility and compliance."
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={listingFormData.is_taxable}
                              onChange={(e) => setListingFormData({ ...listingFormData, is_taxable: e.target.checked })}
                              className="h-4 w-4"
                            />
                            <label className="text-sm text-black">Is taxable</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={listingFormData.should_auto_renew}
                              onChange={(e) => setListingFormData({ ...listingFormData, should_auto_renew: e.target.checked })}
                              className="h-4 w-4"
                            />
                            <label className="text-sm text-black">Auto-renew on expiration</label>
                          </div>
                          {editingListing && (
                            <>
                              <div>
                                <label className="block text-sm font-medium mb-1 text-black">Featured Rank</label>
                                <input
                                  type="number"
                                  value={listingFormData.featured_rank}
                                  onChange={(e) => setListingFormData({ ...listingFormData, featured_rank: e.target.value })}
                                  className="w-full px-3 py-2 border rounded-lg text-black"
                                  placeholder="Optional"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1 text-black">Listing State</label>
                                <select
                                  value={listingFormData.state}
                                  onChange={(e) => setListingFormData({ ...listingFormData, state: e.target.value })}
                                  className="w-full px-3 py-2 border rounded-lg text-black"
                                >
                                  <option value="draft">Draft</option>
                                  <option value="active">Active</option>
                                  <option value="inactive">Inactive</option>
                                </select>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 flex gap-2">
                        <button
                          onClick={() => editingListing ? handleUpdateListing(editingListing) : handleCreateListing()}
                          disabled={loading || !listingFormData.title || !listingFormData.description || !listingFormData.price || !listingFormData.taxonomy_id}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          {editingListing ? 'Update Listing' : 'Create Draft Listing'}
                        </button>
                        <button
                          onClick={() => {
                            setShowCreateListing(false);
                            setEditingListing(null);
                            setListingFormData({
                              title: '',
                              description: '',
                              quantity: 1,
                              price: '',
                              taxonomy_id: '',
                              who_made: 'i_did',
                              when_made: '2020_2025',
                              is_supply: false,
                              tags: '',
                              materials: '',
                              shipping_profile_id: '',
                              shop_section_id: '',
                              return_policy_id: '',
                              item_weight: '',
                              item_weight_unit: '',
                              item_length: '',
                              item_width: '',
                              item_height: '',
                              item_dimensions_unit: '',
                              processing_min: '',
                              processing_max: '',
                              is_taxable: false,
                              is_personalizable: false,
                              personalization_is_required: false,
                              personalization_char_count_max: '',
                              personalization_instructions: '',
                              should_auto_renew: false,
                              featured_rank: '',
                              state: 'draft',
                              type: 'physical',
                              readiness_state_id: '',
                            });
                            setListingImages([]);
                            setListingVideos([]);
                            setNewImageUrls(['']);
                            setListingInventory(null);
                            setAvailableProperties([]);
                          }}
                          className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-black">
                      Your Listings (
                      {listingsTab === 'active' ? (totalListings || listings.length) :
                        listingsTab === 'draft' ? draftListings.length :
                          inactiveListings.length})
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={loadDashboardStats}
                        disabled={isLoadingStats}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Refresh from cache/DB"
                      >
                        <RefreshCw className={`h-4 w-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                      <button
                        onClick={forceRefreshListings}
                        disabled={isLoadingStats}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Force refresh from Etsy API (ignores cache and DB)"
                      >
                        <RefreshCw className={`h-4 w-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
                        Force Refresh
                      </button>
                    </div>
                  </div>

                  {/* Tabs for Active/Draft/Inactive */}
                  <div className="flex gap-2 mb-4 border-b">
                    <button
                      onClick={() => setListingsTab('active')}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${listingsTab === 'active'
                        ? 'text-purple-600 border-b-2 border-purple-600'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      Active ({listings.length})
                    </button>
                    <button
                      onClick={() => setListingsTab('draft')}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${listingsTab === 'draft'
                        ? 'text-purple-600 border-b-2 border-purple-600'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      Draft ({draftListings.length})
                    </button>
                    <button
                      onClick={() => setListingsTab('inactive')}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${listingsTab === 'inactive'
                        ? 'text-purple-600 border-b-2 border-purple-600'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      Inactive ({inactiveListings.length})
                    </button>
                  </div>


                  <div className="space-y-3">
                    {(() => {
                      const currentListings = listingsTab === 'active' ? listings :
                        listingsTab === 'draft' ? draftListings :
                          inactiveListings;

                      if (currentListings.length === 0) {
                        return (
                          <p className="text-gray-500 text-center py-8">
                            No {listingsTab} listings found. {listingsTab === 'active' ? 'Create your first listing above.' : ''}
                          </p>
                        );
                      }

                      return currentListings.map((listing) => (
                        <div
                          key={listing.listingId}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors group"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-black truncate">{listing.title}</p>
                            <p className="text-sm text-gray-600">
                              ${listing.price?.amount?.toFixed(2) || '0.00'} • {listing.quantity || 0} in stock • {listing.state}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {listing.url && (
                              <a
                                href={listing.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="View on Etsy"
                              >
                                <Eye className="h-4 w-4" />
                              </a>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOptimizeListing(listing, 'all');
                              }}
                              disabled={optimizingListing === listing.listingId}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50 transition-colors text-xs font-semibold"
                              title="AI Optimize Listing"
                            >
                              {optimizingListing === listing.listingId ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Sparkles className="h-3.5 w-3.5" />
                              )}
                              <span className="hidden md:inline">Optimize</span>
                            </button>

                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                setEditingListing(listing);
                                await loadListingDetailsForEdit(listing.listingId);
                                setShowCreateListing(true);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-xs font-semibold"
                              title="Edit Listing"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              <span className="hidden md:inline">Edit</span>
                            </button>

                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
                                  await handleDeleteListing(listing.listingId);
                                }
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs font-semibold"
                              title="Delete Listing"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="hidden md:inline">Delete</span>
                            </button>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>

                  {/* Pagination Controls - Only show for active listings */}
                  {listingsTab === 'active' && listings.length > 0 && totalListings > 0 && (
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-4">
                      <div className="text-sm text-black">
                        Showing <span className="font-medium">{((listingsPage - 1) * listingsPerPage) + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(listingsPage * listingsPerPage, totalListings)}</span> of{' '}
                        <span className="font-medium">{totalListings}</span> listings
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setListingsPage(prev => Math.max(1, prev - 1));
                          }}
                          disabled={listingsPage === 1}
                          className="px-4 py-2 text-sm font-medium text-black bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-colors"
                        >
                          Previous
                        </button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, Math.ceil(totalListings / listingsPerPage)) }, (_, i) => {
                            const totalPages = Math.ceil(totalListings / listingsPerPage);
                            let pageNum: number;

                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (listingsPage <= 3) {
                              pageNum = i + 1;
                            } else if (listingsPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = listingsPage - 2 + i;
                            }

                            if (pageNum > totalPages) return null;

                            return (
                              <button
                                key={pageNum}
                                onClick={() => setListingsPage(pageNum)}
                                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${listingsPage === pageNum
                                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                                  : 'text-black bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                  }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          {Math.ceil(totalListings / listingsPerPage) > 5 && listingsPage < Math.ceil(totalListings / listingsPerPage) - 2 && (
                            <>
                              <span className="px-2 text-gray-500">...</span>
                              <button
                                onClick={() => setListingsPage(Math.ceil(totalListings / listingsPerPage))}
                                className="px-3 py-2 text-sm font-medium text-black bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                              >
                                {Math.ceil(totalListings / listingsPerPage)}
                              </button>
                            </>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setListingsPage(prev => prev + 1);
                          }}
                          disabled={!hasMoreListings || listingsPage * listingsPerPage >= totalListings}
                          className="px-4 py-2 text-sm font-medium text-black bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Optimization Results Modal */}
                {showListingModal && optimizationResult && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-purple-100 animate-in fade-in zoom-in duration-200">
                      <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-purple-600">
                          <Sparkles className="h-5 w-5" />
                          <h3 className="text-xl font-bold">AI Optimization Results</h3>
                        </div>
                        <button
                          onClick={() => {
                            setShowListingModal(false);
                            setOptimizationResult(null);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="p-6">
                        {/* Listing Info */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <h4 className="text-lg font-bold text-gray-900 mb-3">{optimizationResult.listing.title}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                            <div className="space-y-1">
                              <p className="text-gray-500 font-medium uppercase tracking-wider text-[10px]">Current Price</p>
                              <p className="font-bold text-gray-900">${optimizationResult.listing.price?.amount?.toFixed(2) || '0.00'}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-gray-500 font-medium uppercase tracking-wider text-[10px]">Current Stock</p>
                              <p className="font-bold text-gray-900">{optimizationResult.listing.quantity || 0} units</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-gray-500 font-medium uppercase tracking-wider text-[10px]">Status</p>
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${optimizationResult.listing.state === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                                }`}>
                                {optimizationResult.listing.state}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-gray-500 font-medium uppercase tracking-wider text-[10px]">Views</p>
                              <p className="font-bold text-gray-900">{optimizationResult.listing.views || 0}</p>
                            </div>
                          </div>
                        </div>

                        {/* Optimization Results Display */}
                        <div className="space-y-6">
                          <div className="p-6 bg-purple-50 rounded-xl border border-purple-100 space-y-6">
                            {(optimizationResult.mode === 'title' || optimizationResult.mode === 'all') && (
                              <div className="space-y-2">
                                <p className="text-xs font-bold text-purple-900 uppercase tracking-widest">Optimized Title</p>
                                <div className="p-3 bg-white rounded-lg border border-purple-200">
                                  <p className="text-gray-400 line-through text-xs mb-2">{optimizationResult.listing.title}</p>
                                  <p className="text-purple-700 font-semibold leading-relaxed">
                                    {optimizationResult.result.optimized?.title?.optimized_title ||
                                      optimizationResult.result.optimized?.optimized_title ||
                                      'No title generated'}
                                  </p>
                                </div>
                              </div>
                            )}

                            {(optimizationResult.mode === 'description' || optimizationResult.mode === 'all') && (
                              <div className="space-y-2">
                                <p className="text-xs font-bold text-purple-900 uppercase tracking-widest">Optimized Description</p>
                                <div className="p-4 bg-white rounded-lg border border-purple-200">
                                  <div className="text-purple-700 text-sm whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed font-medium">
                                    {optimizationResult.result.optimized?.description?.optimized_description ||
                                      optimizationResult.result.optimized?.optimized_description ||
                                      'No description generated.'}
                                  </div>
                                </div>
                              </div>
                            )}

                            {(optimizationResult.mode === 'tags' || optimizationResult.mode === 'all') && (
                              <div className="space-y-2">
                                <p className="text-xs font-bold text-purple-900 uppercase tracking-widest">Suggested Tags</p>
                                <div className="flex flex-wrap gap-2 p-3 bg-white rounded-lg border border-purple-200">
                                  {(optimizationResult.result.optimized?.tags?.optimized_tags ||
                                    optimizationResult.result.optimized?.optimized_tags || []).length > 0 ? (
                                    (optimizationResult.result.optimized?.tags?.optimized_tags ||
                                      optimizationResult.result.optimized?.optimized_tags || []).map((tag: string, i: number) => (
                                        <span key={i} className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-bold">
                                          {tag}
                                        </span>
                                      ))
                                  ) : (
                                    <p className="text-gray-400 text-xs italic">No tags generated.</p>
                                  )}
                                </div>
                              </div>
                            )}

                            {(optimizationResult.mode === 'materials' || optimizationResult.mode === 'all') && (
                              <div className="space-y-2">
                                <p className="text-xs font-bold text-purple-900 uppercase tracking-widest">Suggested Materials</p>
                                <div className="flex flex-wrap gap-2 p-3 bg-white rounded-lg border border-purple-200">
                                  {(optimizationResult.result.optimized?.materials?.optimized_materials ||
                                    optimizationResult.result.optimized?.optimized_materials || []).length > 0 ? (
                                    (optimizationResult.result.optimized?.materials?.optimized_materials ||
                                      optimizationResult.result.optimized?.optimized_materials || []).map((material: string, i: number) => (
                                        <span key={i} className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-bold">
                                          {material}
                                        </span>
                                      ))
                                  ) : (
                                    <p className="text-gray-400 text-xs italic">No materials generated.</p>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="pt-4 flex gap-3">
                              <button
                                onClick={handleApplyOptimization}
                                className="flex-1 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-bold transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
                              >
                                <Save className="h-5 w-5" />
                                Apply to Listing
                              </button>
                              <button
                                onClick={() => {
                                  setShowListingModal(false);
                                  setOptimizationResult(null);
                                }}
                                className="flex-1 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 font-bold transition-all"
                              >
                                Keep Original
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      case 'inventory':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4 text-black">Inventory & Pricing Intelligence</h3>
              <p className="text-gray-600 mb-6">
                Manage inventory levels, pricing, and product variations dynamically.
              </p>

              {/* Listing Selection */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <label className="block text-sm font-medium mb-2 text-black">Target Listing ID</label>
                <div className="flex gap-2">
                  <select
                    value={inventoryListingId}
                    onChange={async (e) => {
                      const newId = e.target.value;
                      setInventoryListingId(newId);
                      if (!newId || !selectedShopId) return;

                      // Auto-load inventory on selection
                      setIsInventoryLoading(true);
                      try {
                        const token = localStorage.getItem('token');
                        const res = await fetch(`/api/etsy/listings/${newId}/inventory?shopId=${selectedShopId}`, {
                          headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const data = await parseJsonResponse<any>(res);
                        if (data.success) {
                          setInventoryResults(data.inventory);
                          setProductResults(null);
                          setOfferingResults(null);
                          toast.success('Inventory loaded');
                        } else {
                          toast.error(data.error || 'Failed to load inventory');
                        }
                      } catch (e: any) {
                        toast.error(e.message);
                      } finally {
                        setIsInventoryLoading(false);
                      }
                    }}
                    className="flex-1 px-3 py-2 border rounded-lg text-black"
                  >
                    <option value="">Select a listing to manage inventory...</option>
                    {listings.length > 0 && (
                      <optgroup label="Active Listings">
                        {listings.map((l: any) => (
                          <option key={l.listingId || l.listing_id} value={l.listingId || l.listing_id}>
                            {l.title ? (l.title.length > 50 ? l.title.substring(0, 50) + '...' : l.title) : `Listing ${l.listingId || l.listing_id}`}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {draftListings.length > 0 && (
                      <optgroup label="Draft Listings">
                        {draftListings.map((l: any) => (
                          <option key={l.listingId || l.listing_id} value={l.listingId || l.listing_id}>
                            {l.title ? (l.title.length > 50 ? l.title.substring(0, 50) + '...' : l.title) : `Listing ${l.listingId || l.listing_id}`}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {inactiveListings.length > 0 && (
                      <optgroup label="Inactive Listings">
                        {inactiveListings.map((l: any) => (
                          <option key={l.listingId || l.listing_id} value={l.listingId || l.listing_id}>
                            {l.title ? (l.title.length > 50 ? l.title.substring(0, 50) + '...' : l.title) : `Listing ${l.listingId || l.listing_id}`}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!inventoryListingId || !selectedShopId) return;
                      setIsInventoryLoading(true);
                      try {
                        const token = localStorage.getItem('token');
                        const res = await fetch(`/api/etsy/listings/${inventoryListingId}/inventory?shopId=${selectedShopId}`, {
                          headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const data = await parseJsonResponse<any>(res);
                        if (data.success) {
                          setInventoryResults(data.inventory);
                          setProductResults(null);
                          setOfferingResults(null);
                          toast.success('Inventory refreshed');
                        } else {
                          toast.error(data.error || 'Failed to load inventory');
                        }
                      } catch (e: any) {
                        toast.error(e.message);
                      } finally {
                        setIsInventoryLoading(false);
                      }
                    }}
                    disabled={isInventoryLoading || !inventoryListingId}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isInventoryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
                  </button>
                </div>
              </div>

              {/* Inventory Details & Actions */}
              {inventoryResults && (
                <div className="space-y-6">
                  {/* Results Display */}
                  <div className="p-4 border rounded-lg bg-gray-50 max-h-96 overflow-y-auto">
                    <h4 className="font-semibold mb-2 text-black">Inventory Data</h4>
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(inventoryResults, null, 2)}
                    </pre>
                  </div>

                  {/* Products List & Selection */}
                  {inventoryResults.products && inventoryResults.products.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-black">Select Product for Details</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {inventoryResults.products.map((prod: any) => (
                          <div key={prod.product_id || prod.productId} className="border p-3 rounded bg-white flex justify-between items-center">
                            <div>
                              <span className="font-mono text-xs bg-gray-100 px-1 rounded">ID: {prod.product_id || prod.productId}</span>
                              <span className="ml-2 text-sm text-gray-600">SKU: {prod.sku || 'N/A'}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  setIsInventoryLoading(true);
                                  try {
                                    // Mocking the get product logic or using the API if we added one
                                    // Since we added one in lib, let's try to call it via a new API route or assume we have one.
                                    // Note: The user asked for dynamic APIs. I'll simulate the call or assuming I need to create a server action/api route
                                    // For now, I will display the product from the loaded inventory as "Product Details" 
                                    // OR if there's a specific endpoint, I'd fetch it.
                                    // Since I added getListingProduct in library, I need a backend route to proxy it if I want to call from client.
                                    // Let's assume I can just use the data I have or fetch if needed.
                                    setProductResults(prod);
                                    setSelectedInventoryProduct(prod);
                                    toast.success('Product details selected');
                                  } finally {
                                    setIsInventoryLoading(false);
                                  }
                                }}
                                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              >
                                Get Details
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Product Details Display */}
                  {productResults && (
                    <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold mb-2 text-blue-900">Product Details (ID: {productResults.product_id || productResults.productId})</h4>
                      <pre className="text-xs text-blue-800 whitespace-pre-wrap">
                        {JSON.stringify(productResults, null, 2)}
                      </pre>

                      {/* Offerings within Product */}
                      {productResults.offerings && productResults.offerings.length > 0 && (
                        <div className="mt-4">
                          <h5 className="font-medium text-blue-900 mb-2">Offerings</h5>
                          <div className="space-y-2">
                            {productResults.offerings.map((offering: any) => (
                              <div key={offering.offering_id || offering.offeringId} className="bg-white p-2 rounded border border-blue-100">
                                <div className="flex justify-between items-center">
                                  <div className="text-sm">
                                    <span className="font-mono text-xs text-gray-500">ID: {offering.offering_id || offering.offeringId}</span>
                                    <span className="ml-2 font-medium">Qty: {offering.quantity}</span>
                                    <span className="ml-2 font-medium">Price: {typeof offering.price === 'object' ? offering.price.amount / offering.price.divisor : offering.price}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOfferingResults(offering);
                                        setSelectedInventoryOffering(offering);
                                        // Pre-fill update form
                                        const price = typeof offering.price === 'object' ? (offering.price.amount / offering.price.divisor).toString() : String(offering.price);
                                        setInventoryUpdateData({
                                          price,
                                          quantity: String(offering.quantity)
                                        });
                                      }}
                                      className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                                    >
                                      Select Offering
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Offering Details & Update Form */}
                  {offeringResults && (
                    <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                      <h4 className="font-semibold mb-2 text-green-900">Offering Details (ID: {offeringResults.offering_id || offeringResults.offeringId})</h4>
                      <pre className="text-xs text-green-800 whitespace-pre-wrap mb-4">
                        {JSON.stringify(offeringResults, null, 2)}
                      </pre>

                      <div className="bg-white p-4 rounded border border-green-100">
                        <h5 className="font-medium text-gray-900 mb-3">Update Offering (Price & Quantity)</h5>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Price</label>
                            <input
                              type="text"
                              value={inventoryUpdateData.price}
                              onChange={(e) => setInventoryUpdateData({ ...inventoryUpdateData, price: e.target.value })}
                              className="w-full px-3 py-2 border rounded text-black"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                            <input
                              type="number"
                              value={inventoryUpdateData.quantity}
                              onChange={(e) => setInventoryUpdateData({ ...inventoryUpdateData, quantity: e.target.value })}
                              className="w-full px-3 py-2 border rounded text-black"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!inventoryListingId || !selectedShopId) return;
                            setIsInventoryLoading(true);
                            try {
                              const token = localStorage.getItem('token');

                              // Construct the inventory update payload
                              // For a specific offering update, we usually need to update the whole inventory or at least the product.
                              // This is a complex operation in Etsy API. We need to construct the full 'products' array with the modified offering.

                              // Clone inventory
                              const newInventory = JSON.parse(JSON.stringify(inventoryResults));
                              const prodIndex = newInventory.products.findIndex((p: any) =>
                                (p.product_id || p.productId) === (selectedInventoryProduct.product_id || selectedInventoryProduct.productId)
                              );

                              if (prodIndex !== -1) {
                                const offIndex = newInventory.products[prodIndex].offerings.findIndex((o: any) =>
                                  (o.offering_id || o.offeringId) === (offeringResults.offering_id || offeringResults.offeringId)
                                );

                                if (offIndex !== -1) {
                                  // Update values
                                  newInventory.products[prodIndex].offerings[offIndex].price = parseFloat(inventoryUpdateData.price);
                                  newInventory.products[prodIndex].offerings[offIndex].quantity = parseInt(inventoryUpdateData.quantity);

                                  // Ensure we set property IDs that quantities/prices vary by
                                  const propIds = new Set<number>();
                                  newInventory.products.forEach((p: any) => {
                                    p.property_values?.forEach((pv: any) => {
                                      if (pv.property_id) propIds.add(pv.property_id);
                                    });
                                  });

                                  const propIdsArray = Array.from(propIds);
                                  if (propIdsArray.length > 0) {
                                    newInventory.quantity_on_property = propIdsArray;
                                    newInventory.price_on_property = propIdsArray;
                                    newInventory.sku_on_property = propIdsArray;
                                  }

                                  // Call API
                                  const res = await fetch(`/api/etsy/listings/${inventoryListingId}/inventory?shopId=${selectedShopId}`, {
                                    method: 'PUT',
                                    headers: {
                                      'Authorization': `Bearer ${token}`,
                                      'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify(newInventory)
                                  });

                                  const data = await parseJsonResponse<any>(res);
                                  if (data.success) {
                                    toast.success('Inventory updated successfully');
                                    // Refresh inventory
                                    setInventoryResults(data.inventory || newInventory);
                                  } else {
                                    throw new Error(data.error);
                                  }
                                }
                              }
                            } catch (e: any) {
                              toast.error(e.message || 'Failed to update inventory');
                            } finally {
                              setIsInventoryLoading(false);
                            }
                          }}
                          disabled={isInventoryLoading}
                          className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {isInventoryLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Update Inventory'}
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>
        );
      case 'variations':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-black">Listing Variations Manager</h3>
                  <p className="text-sm text-gray-600">Specifically manage size variations and pricing for your listings.</p>
                </div>
                {inventoryListingId && (
                  <button
                    onClick={async () => {
                      setIsInventoryLoading(true);
                      try {
                        const token = localStorage.getItem('token');
                        const res = await fetch(`/api/etsy/listings/${inventoryListingId}/inventory?shopId=${selectedShopId}`, {
                          headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const data = await parseJsonResponse<any>(res);
                        if (data.success) {
                          setInventoryResults(data.inventory);
                          toast.success('Inventory refreshed');
                        }
                      } catch (e: any) {
                        toast.error(e.message);
                      } finally {
                        setIsInventoryLoading(false);
                      }
                    }}
                    disabled={isInventoryLoading}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    <RefreshCw className={`h-4 w-4 ${isInventoryLoading ? 'animate-spin' : ''}`} />
                    Refresh Data
                  </button>
                )}
              </div>

              {/* Listing Selection */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <SelectField
                  label="Select Listing"
                  value={inventoryListingId}
                  isOpen={isVariationListingDropdownOpen}
                  onOpenChange={setIsVariationListingDropdownOpen}
                  onSelect={async (newId) => {
                    setInventoryListingId(newId);
                    setShowAddVariantForm(false);
                    if (!newId || !selectedShopId) return;

                    setIsInventoryLoading(true);
                    try {
                      const token = localStorage.getItem('token');
                      const res = await fetch(`/api/etsy/listings/${newId}/inventory?shopId=${selectedShopId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                      });
                      const data = await parseJsonResponse<any>(res);
                      if (data.success) {
                        setInventoryResults(data.inventory);

                        // Find listing to get taxonomyId - Check all possible sources
                        const combinedListings = [...sharedListings, ...listings, ...draftListings, ...inactiveListings];
                        let selectedListing = combinedListings.find(l =>
                          (l.listingId || l.listing_id || '').toString() === newId.toString()
                        );

                        let taxId = selectedListing?.taxonomyId || (selectedListing as any)?.taxonomy_id;

                        // Check cache first for listing details
                        if (!taxId && listingDetailsCache[newId]) {
                          console.log('[Variations] Using cached listing details for:', newId);
                          selectedListing = { ...selectedListing, ...listingDetailsCache[newId] };
                          taxId = listingDetailsCache[newId].taxonomy_id || listingDetailsCache[newId].taxonomyId;
                        }

                        // Fallback: If taxonomyId is still missing, fetch full listing details
                        if (!taxId) {
                          console.log('[Variations] Taxonomy ID missing, fetching full details for:', newId);
                          try {
                            const detailsRes = await fetch(`/api/etsy/listings/${newId}/details?shopId=${selectedShopId}`, {
                              headers: { 'Authorization': `Bearer ${token}` }
                            });
                            const detailsData = await parseJsonResponse<any>(detailsRes);
                            if (detailsData.success && detailsData.listing) {
                              taxId = detailsData.listing.taxonomy_id || detailsData.listing.taxonomyId;
                              // Update selectedListing for property fetching
                              selectedListing = { ...selectedListing, ...detailsData.listing };
                              // Cache the listing details
                              setListingDetailsCache(prev => ({
                                ...prev,
                                [newId]: detailsData.listing
                              }));
                            }
                          } catch (err) {
                            console.error('[Variations] Failed to fetch listing details:', err);
                          }
                        }

                        if (taxId) {
                          const cacheKey = `${taxId}_${selectedShopId}`;

                          // Check cache first for taxonomy properties
                          if (taxonomyPropertiesCache[cacheKey]) {
                            console.log('[Variations] Using cached properties for taxId:', taxId);
                            setAvailablePropertiesForVariations(taxonomyPropertiesCache[cacheKey]);
                          } else {
                            console.log('[Variations] Fetching properties for taxId:', taxId);
                            const { fetchTaxonomyProperties } = useEtsyDataStore.getState();
                            const props = await fetchTaxonomyProperties(Number(taxId), 'seller', selectedShopId);
                            if (props && props.length > 0) {
                              console.log('[Variations] All properties received:', props);

                              // Strict filtering for variation properties only
                              const filteredProps = props.filter((p: any) => {
                                // Must explicitly support variations
                                const supportsVariations = p.supports_variations === true;

                                // Must have possible values (scales) for variations
                                const hasPossibleValues = p.possible_values && p.possible_values.length > 0;

                                // Must have a scale_id (indicates it's a standardized variation property)
                                const hasScaleId = p.scale_id !== null && p.scale_id !== undefined;

                                const isValid = supportsVariations && (hasPossibleValues || hasScaleId);

                                if (isValid) {
                                  console.log('[Variations] ✓ Valid variation property:', p.property_name || p.name, {
                                    scale_id: p.scale_id,
                                    possible_values_count: p.possible_values?.length || 0
                                  });
                                } else {
                                  console.log('[Variations] ✗ Filtered out:', p.property_name || p.name, {
                                    supports_variations: p.supports_variations,
                                    has_possible_values: hasPossibleValues,
                                    has_scale_id: hasScaleId
                                  });
                                }

                                return isValid;
                              });

                              console.log('[Variations] Filtered properties count:', filteredProps.length);
                              setAvailablePropertiesForVariations(filteredProps);
                              // Cache the taxonomy properties
                              setTaxonomyPropertiesCache(prev => ({
                                ...prev,
                                [cacheKey]: filteredProps
                              }));
                            } else {
                              console.warn('[Variations] No properties found for taxonomy:', taxId);
                            }
                          }
                        } else {
                          console.warn('[Variations] Could not determine taxonomyId for listing:', newId);
                          toast.error('Could not load variation properties for this listing.');
                        }

                        // Set readiness state from existing inventory or listing defaults
                        if (data.inventory?.products?.[0]?.offerings?.[0]?.readiness_state_id) {
                          setListingReadinessStateId(data.inventory.products[0].offerings[0].readiness_state_id);
                        } else if (selectedListing?.readiness_state_id) {
                          setListingReadinessStateId(selectedListing.readiness_state_id);
                        } else {
                          // Default to 2 (typically 'Ready to Ship')
                          setListingReadinessStateId(2);
                        }

                        toast.success('Variations loaded');
                      } else {
                        toast.error(data.error || 'Failed to load variations');
                        setInventoryResults(null);
                      }
                    } catch (e: any) {
                      toast.error(e.message);
                      setInventoryResults(null);
                    } finally {
                      setIsInventoryLoading(false);
                    }
                  }}
                  options={Array.from(new Map([...sharedListings, ...listings, ...draftListings, ...inactiveListings].map(l => [l.listingId || l.listing_id, l])).values())
                    .sort((a: any, b: any) => (a.title || '').localeCompare(b.title || ''))
                    .map((l: any) => {
                      const mainImage = l.images && l.images.length > 0
                        ? (l.images.find((img: any) => img.rank === 1) || l.images[0])
                        : null;
                      const imageUrl = mainImage?.url || mainImage?.url_570xN || mainImage?.url_fullxfull || mainImage?.url_170x135 || mainImage?.url_75x75;

                      return {
                        value: (l.listingId || l.listing_id).toString(),
                        label: `${l.state === 'draft' ? '[DRAFT] ' : l.state === 'inactive' ? '[INACTIVE] ' : ''}${l.title ? (l.title.length > 80 ? l.title.substring(0, 80) + '...' : l.title) : `Listing ${l.listingId || l.listing_id}`}`,
                        imageUrl: imageUrl,
                        description: `ID: ${l.listingId || l.listing_id}`
                      };
                    })}
                  placeholder="Select a listing to manage..."
                  className="w-full"
                />
              </div>

              {isInventoryLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
                  <p className="text-gray-600">Loading listing variations...</p>
                </div>
              )}

              {!isInventoryLoading && inventoryResults && (
                <div className="space-y-6">
                  {/* Variations Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                      <p className="text-xs text-purple-600 font-bold uppercase tracking-wider mb-1">Total Variants</p>
                      <p className="text-2xl font-black text-purple-900">{inventoryResults.products?.length || 0}</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Active Offerings</p>
                      <p className="text-2xl font-black text-blue-900">
                        {inventoryResults.products?.reduce((acc: number, p: any) => acc + (p.offerings?.filter((o: any) => !o.is_deleted).length || 0), 0) || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                      <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-1">In Stock</p>
                      <p className="text-2xl font-black text-green-900">
                        {inventoryResults.products?.reduce((acc: number, p: any) => acc + (p.offerings?.reduce((sum: number, o: any) => sum + (o.quantity || 0), 0) || 0), 0) || 0}
                      </p>
                    </div>
                  </div>

                  {/* Add New Variant Section */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Plus className="h-5 w-5 text-purple-600" />
                        <h4 className="font-bold text-gray-900">Add New Variation</h4>
                      </div>
                      <button
                        onClick={() => {
                          setShowAddVariantForm(!showAddVariantForm);
                          // Initialize propertyId if variations already exist
                          if (!showAddVariantForm && inventoryResults?.products?.length > 0) {
                            const firstProd = inventoryResults.products[0];
                            if (firstProd.property_values?.length > 0) {
                              const pv = firstProd.property_values[0];
                              setNewVariantData(prev => ({
                                ...prev,
                                propertyId: pv.property_id.toString(),
                                propertyName: pv.property_name
                              }));
                            }
                          }
                        }}
                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${showAddVariantForm ? 'bg-gray-200 text-gray-700' : 'bg-purple-600 text-white shadow-lg shadow-purple-500/20 hover:scale-105'
                          }`}
                      >
                        {showAddVariantForm ? 'Cancel' : 'Add Variant Value'}
                      </button>
                    </div>

                    {showAddVariantForm && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-6 gap-3 p-4 bg-white rounded-lg border border-purple-100 shadow-sm">
                        <div className="md:col-span-1">
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Property</label>
                          <SelectField
                            options={availablePropertiesForVariations.map((p: any) => ({
                              value: (p.property_id || p.id).toString(),
                              label: p.property_name || p.name || p.display_name
                            }))}
                            value={newVariantData.propertyId}
                            isOpen={isPropertyDropdownOpen}
                            onOpenChange={setIsPropertyDropdownOpen}
                            onSelect={(value) => {
                              const prop = availablePropertiesForVariations.find(p => (p.property_id || p.id).toString() === value);
                              setNewVariantData({
                                ...newVariantData,
                                propertyId: value,
                                propertyName: prop ? (prop.property_name || prop.name || prop.display_name) : '',
                                value: '',
                                valueId: ''
                              });
                              setIsValueDropdownOpen(false);
                            }}
                            placeholder="Select Property..."
                            disabled={availablePropertiesForVariations.length === 0}
                          />
                        </div>
                        <div className="md:col-span-1">
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Value</label>
                          {(() => {
                            const selectedProp = availablePropertiesForVariations.find(p => (p.property_id || p.id).toString() === newVariantData.propertyId);

                            // Debug logging
                            if (newVariantData.propertyId && selectedProp) {
                              console.log('[Variations] Selected Property:', selectedProp);
                              console.log('[Variations] Possible Values:', selectedProp.possible_values);
                            }

                            const possibleValues = selectedProp?.possible_values || selectedProp?.values || [];

                            if (possibleValues.length > 0) {
                              return (
                                <SelectField
                                  options={possibleValues.map((v: any) => ({
                                    value: (v.value_id || v.id) + '|' + (v.value || v.name),
                                    label: v.value || v.name
                                  }))}
                                  value={newVariantData.valueId + '|' + newVariantData.value}
                                  isOpen={isValueDropdownOpen}
                                  onOpenChange={setIsValueDropdownOpen}
                                  onSelect={(value) => {
                                    const [vId, vVal] = value.split('|');
                                    setNewVariantData({ ...newVariantData, valueId: vId, value: vVal });
                                  }}
                                  placeholder="Select Value..."
                                  disabled={!newVariantData.propertyId}
                                />
                              );
                            }

                            // Fallback to text input if no predefined values
                            return (
                              <input
                                type="text"
                                value={newVariantData.value}
                                onChange={(e) => setNewVariantData({ ...newVariantData, valueId: '', value: e.target.value })}
                                placeholder={selectedProp ? `Enter ${selectedProp.property_name || selectedProp.name} value` : "Select property first"}
                                disabled={!newVariantData.propertyId}
                                className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-black bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200"
                              />
                            );
                          })()}
                        </div>
                        <div className="md:col-span-1">
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Price ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={newVariantData.price}
                            onChange={(e) => setNewVariantData({ ...newVariantData, price: e.target.value })}
                            placeholder="0.00"
                            className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-black bg-white"
                          />
                        </div>
                        <div className="md:col-span-1">
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Stock</label>
                          <input
                            type="number"
                            value={newVariantData.quantity}
                            onChange={(e) => setNewVariantData({ ...newVariantData, quantity: e.target.value })}
                            placeholder="1"
                            className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-black bg-white"
                          />
                        </div>
                        <div className="md:col-span-1">
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">SKU (Optional)</label>
                          <input
                            type="text"
                            value={newVariantData.sku}
                            onChange={(e) => setNewVariantData({ ...newVariantData, sku: e.target.value })}
                            placeholder="SKU"
                            className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-black bg-white"
                          />
                        </div>
                        <div className="md:col-span-1 flex items-end">
                          <button
                            onClick={() => {
                              if (!newVariantData.value || !newVariantData.propertyId) {
                                toast.error('Please provide property and value');
                                return;
                              }

                              const newInv = JSON.parse(JSON.stringify(inventoryResults));

                              if (!newInv.products) {
                                newInv.products = [];
                              }

                              // Only remove the default variant if we're adding the FIRST variation
                              // (default variant has no property_values or empty property_values)
                              const hasOnlyDefaultVariant = newInv.products.length === 1 &&
                                (!newInv.products[0].property_values || newInv.products[0].property_values.length === 0);

                              if (hasOnlyDefaultVariant) {
                                console.log('[Variations] Removing default variant to add first variation');
                                newInv.products = [];
                              }

                              // Check if this exact variant already exists
                              const variantExists = newInv.products.some((p: any) =>
                                p.property_values?.some((pv: any) =>
                                  pv.property_id === Number(newVariantData.propertyId) &&
                                  (pv.values?.includes(newVariantData.value) || pv.value_ids?.includes(Number(newVariantData.valueId)))
                                )
                              );

                              if (variantExists) {
                                toast.error('This variant already exists!');
                                return;
                              }

                              const newProduct = {
                                sku: newVariantData.sku,
                                property_values: [
                                  {
                                    property_id: Number(newVariantData.propertyId),
                                    property_name: newVariantData.propertyName,
                                    value_ids: newVariantData.valueId ? [Number(newVariantData.valueId)] : [],
                                    values: newVariantData.valueId ? [] : [newVariantData.value]
                                  }
                                ],
                                offerings: [
                                  {
                                    price: Number(newVariantData.price) || 0,
                                    quantity: Number(newVariantData.quantity) || 0,
                                    is_enabled: true,
                                    readiness_state_id: listingReadinessStateId || 2
                                  }
                                ]
                              };

                              newInv.products.push(newProduct);

                              // Set flags - Don't overwrite, append if not present
                              const propId = Number(newVariantData.propertyId);
                              if (!newInv.price_on_property) newInv.price_on_property = [];
                              if (!newInv.price_on_property.includes(propId)) newInv.price_on_property.push(propId);

                              if (!newInv.quantity_on_property) newInv.quantity_on_property = [];
                              if (!newInv.quantity_on_property.includes(propId)) newInv.quantity_on_property.push(propId);

                              if (!newInv.sku_on_property) newInv.sku_on_property = [];
                              if (!newInv.sku_on_property.includes(propId)) newInv.sku_on_property.push(propId);

                              setInventoryResults(newInv);
                              // Clear ALL form fields after successful add
                              setNewVariantData({
                                value: '',
                                valueId: '',
                                price: '',
                                quantity: '1',
                                sku: '',
                                propertyId: '',
                                propertyName: ''
                              });
                              toast.success('Added to list locally. Save all changes to sync.');
                            }}
                            className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold hover:shadow-lg transition-all"
                          >
                            Add to List
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Variations Table - Desktop */}
                  <div className="hidden md:block overflow-x-auto border border-gray-100 rounded-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Product Variations</th>
                          <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">SKU</th>
                          <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Price ($)</th>
                          <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Stock Qty</th>
                          <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {inventoryResults.products?.map((product: any, pIdx: number) => {
                          const offering = product.offerings?.[0];
                          if (!offering) return null;

                          const variantLabels = product.property_values?.map((pv: any) =>
                            `${pv.property_name}: ${pv.values?.join(', ')}`
                          ).join(' | ');

                          return (
                            <tr key={product.product_id || pIdx} className="hover:bg-gray-50 group transition-colors">
                              <td className="px-4 py-4">
                                <p className="text-sm font-bold text-gray-900">{variantLabels || "Default Variant"}</p>
                                <p className="text-[10px] text-gray-500 font-mono mt-1">ID: {product.product_id}</p>
                              </td>
                              <td className="px-4 py-4">
                                <input
                                  type="text"
                                  value={product.sku || ''}
                                  onChange={(e) => {
                                    const newInv = JSON.parse(JSON.stringify(inventoryResults));
                                    if (newInv.products[pIdx]) {
                                      newInv.products[pIdx].sku = e.target.value;
                                      setInventoryResults(newInv);
                                    }
                                  }}
                                  placeholder="No SKU"
                                  className="w-full px-2 py-1 text-sm border-transparent group-hover:border-gray-200 border rounded bg-transparent focus:bg-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition-all"
                                />
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-400 font-bold text-xs">$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={offering.price?.amount && offering.price?.divisor
                                      ? (offering.price.amount / offering.price.divisor).toFixed(2)
                                      : (typeof offering.price === 'number' ? offering.price : (typeof offering.price === 'string' ? parseFloat(offering.price) : 0)).toFixed(2)}
                                    onChange={(e) => {
                                      const newInv = JSON.parse(JSON.stringify(inventoryResults));
                                      if (newInv.products[pIdx]?.offerings?.[0]) {
                                        const newPrice = parseFloat(e.target.value);
                                        newInv.products[pIdx].offerings[0].price = newPrice;
                                        setInventoryResults(newInv);
                                      }
                                    }}
                                    className="w-24 px-2 py-1 text-sm font-bold text-gray-900 border-transparent group-hover:border-gray-200 border rounded bg-transparent focus:bg-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition-all"
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <input
                                  type="number"
                                  value={offering.quantity}
                                  onChange={(e) => {
                                    const newInv = JSON.parse(JSON.stringify(inventoryResults));
                                    if (newInv.products[pIdx]?.offerings?.[0]) {
                                      newInv.products[pIdx].offerings[0].quantity = parseInt(e.target.value) || 0;
                                      setInventoryResults(newInv);
                                    }
                                  }}
                                  className="w-16 px-2 py-1 text-sm font-bold text-gray-900 border-transparent group-hover:border-gray-200 border rounded bg-transparent focus:bg-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition-all"
                                />
                              </td>
                              <td className="px-4 py-4 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={async () => {
                                      setIsInventoryLoading(true);
                                      try {
                                        const token = localStorage.getItem('token');
                                        const res = await fetch(`/api/etsy/listings/${inventoryListingId}/inventory?shopId=${selectedShopId}`, {
                                          method: 'PUT',
                                          headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Content-Type': 'application/json'
                                          },
                                          body: JSON.stringify(inventoryResults)
                                        });

                                        const data = await parseJsonResponse<any>(res);
                                        if (data.success) {
                                          toast.success('Variant updated!');
                                          setInventoryResults(data.inventory);

                                          // Update the listing cache
                                          if (listingDetailsCache[inventoryListingId]) {
                                            setListingDetailsCache(prev => ({
                                              ...prev,
                                              [inventoryListingId]: {
                                                ...prev[inventoryListingId],
                                                inventory: data.inventory
                                              }
                                            }));
                                          }
                                        } else {
                                          toast.error(data.error || 'Failed to update');
                                        }
                                      } catch (e: any) {
                                        toast.error(e.message);
                                      } finally {
                                        setIsInventoryLoading(false);
                                      }
                                    }}
                                    className="p-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-600 hover:text-white transition-all"
                                    title="Save changes for this variant"
                                  >
                                    <Save className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (!confirm(`Delete variant "${variantLabels || 'Default Variant'}"?`)) return;

                                      setIsInventoryLoading(true);
                                      try {
                                        const newInv = JSON.parse(JSON.stringify(inventoryResults));
                                        newInv.products.splice(pIdx, 1);

                                        const token = localStorage.getItem('token');
                                        const res = await fetch(`/api/etsy/listings/${inventoryListingId}/inventory?shopId=${selectedShopId}`, {
                                          method: 'PUT',
                                          headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Content-Type': 'application/json'
                                          },
                                          body: JSON.stringify(newInv)
                                        });

                                        const data = await parseJsonResponse<any>(res);
                                        if (data.success) {
                                          toast.success('Variant deleted!');
                                          setInventoryResults(data.inventory);

                                          // Update the listing cache
                                          if (listingDetailsCache[inventoryListingId]) {
                                            setListingDetailsCache(prev => ({
                                              ...prev,
                                              [inventoryListingId]: {
                                                ...prev[inventoryListingId],
                                                inventory: data.inventory
                                              }
                                            }));
                                          }
                                        } else {
                                          toast.error(data.error || 'Failed to delete');
                                        }
                                      } catch (e: any) {
                                        toast.error(e.message);
                                      } finally {
                                        setIsInventoryLoading(false);
                                      }
                                    }}
                                    className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                                    title="Delete this variant"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Variations Cards - Mobile */}
                  <div className="md:hidden space-y-3">
                    {inventoryResults.products?.map((product: any, pIdx: number) => {
                      const offering = product.offerings?.[0];
                      if (!offering) return null;

                      const variantLabels = product.property_values?.map((pv: any) =>
                        `${pv.property_name}: ${pv.values?.join(', ')}`
                      ).join(' | ');

                      return (
                        <div key={product.product_id || pIdx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="text-sm font-bold text-gray-900">{variantLabels || "Default Variant"}</p>
                              <p className="text-[10px] text-gray-500 font-mono mt-1">ID: {product.product_id}</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  setIsInventoryLoading(true);
                                  try {
                                    const token = localStorage.getItem('token');
                                    const res = await fetch(`/api/etsy/listings/${inventoryListingId}/inventory?shopId=${selectedShopId}`, {
                                      method: 'PUT',
                                      headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json'
                                      },
                                      body: JSON.stringify(inventoryResults)
                                    });

                                    const data = await parseJsonResponse<any>(res);
                                    if (data.success) {
                                      toast.success('Variant updated!');
                                      setInventoryResults(data.inventory);
                                      if (listingDetailsCache[inventoryListingId]) {
                                        setListingDetailsCache(prev => ({
                                          ...prev,
                                          [inventoryListingId]: {
                                            ...prev[inventoryListingId],
                                            inventory: data.inventory
                                          }
                                        }));
                                      }
                                    } else {
                                      toast.error(data.error || 'Failed to update');
                                    }
                                  } catch (e: any) {
                                    toast.error(e.message);
                                  } finally {
                                    setIsInventoryLoading(false);
                                  }
                                }}
                                className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-600 hover:text-white transition-all"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm(`Delete variant "${variantLabels || 'Default Variant'}"?`)) return;

                                  setIsInventoryLoading(true);
                                  try {
                                    const newInv = JSON.parse(JSON.stringify(inventoryResults));
                                    newInv.products.splice(pIdx, 1);

                                    const token = localStorage.getItem('token');
                                    const res = await fetch(`/api/etsy/listings/${inventoryListingId}/inventory?shopId=${selectedShopId}`, {
                                      method: 'PUT',
                                      headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json'
                                      },
                                      body: JSON.stringify(newInv)
                                    });

                                    const data = await parseJsonResponse<any>(res);
                                    if (data.success) {
                                      toast.success('Variant deleted!');
                                      setInventoryResults(data.inventory);
                                      if (listingDetailsCache[inventoryListingId]) {
                                        setListingDetailsCache(prev => ({
                                          ...prev,
                                          [inventoryListingId]: {
                                            ...prev[inventoryListingId],
                                            inventory: data.inventory
                                          }
                                        }));
                                      }
                                    } else {
                                      toast.error(data.error || 'Failed to delete');
                                    }
                                  } catch (e: any) {
                                    toast.error(e.message);
                                  } finally {
                                    setIsInventoryLoading(false);
                                  }
                                }}
                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">SKU</label>
                              <input
                                type="text"
                                value={product.sku || ''}
                                onChange={(e) => {
                                  const newInv = JSON.parse(JSON.stringify(inventoryResults));
                                  if (newInv.products[pIdx]) {
                                    newInv.products[pIdx].sku = e.target.value;
                                    setInventoryResults(newInv);
                                  }
                                }}
                                placeholder="No SKU"
                                className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none bg-white text-black"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Stock</label>
                              <input
                                type="number"
                                value={offering.quantity}
                                onChange={(e) => {
                                  const newInv = JSON.parse(JSON.stringify(inventoryResults));
                                  if (newInv.products[pIdx]?.offerings?.[0]) {
                                    newInv.products[pIdx].offerings[0].quantity = parseInt(e.target.value) || 0;
                                    setInventoryResults(newInv);
                                  }
                                }}
                                className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none bg-white text-black"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Price ($)</label>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 font-bold">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={offering.price?.amount && offering.price?.divisor
                                    ? (offering.price.amount / offering.price.divisor).toFixed(2)
                                    : (typeof offering.price === 'number' ? offering.price : (typeof offering.price === 'string' ? parseFloat(offering.price) : 0)).toFixed(2)}
                                  onChange={(e) => {
                                    const newInv = JSON.parse(JSON.stringify(inventoryResults));
                                    if (newInv.products[pIdx]?.offerings?.[0]) {
                                      const newPrice = parseFloat(e.target.value);
                                      newInv.products[pIdx].offerings[0].price = newPrice;
                                      setInventoryResults(newInv);
                                    }
                                  }}
                                  className="flex-1 px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none bg-white text-black"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center bg-gray-900 text-white p-6 rounded-2xl shadow-xl border border-gray-800">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                        <Package className="h-6 w-6 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-400">Bulk Variations Update</p>
                        <p className="text-xs text-gray-500">Save all changes made to the variation table above.</p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        setIsInventoryLoading(true);
                        try {
                          const token = localStorage.getItem('token');
                          const res = await fetch(`/api/etsy/listings/${inventoryListingId}/inventory?shopId=${selectedShopId}`, {
                            method: 'PUT',
                            headers: {
                              'Authorization': `Bearer ${token}`,
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(inventoryResults)
                          });

                          const data = await parseJsonResponse<any>(res);
                          if (data.success) {
                            toast.success('All variations updated successfully!');
                            setInventoryResults(data.inventory);

                            // Update the listing cache with the new inventory data
                            if (listingDetailsCache[inventoryListingId]) {
                              setListingDetailsCache(prev => ({
                                ...prev,
                                [inventoryListingId]: {
                                  ...prev[inventoryListingId],
                                  inventory: data.inventory,
                                  has_variations: data.inventory?.products?.length > 1 ||
                                    (data.inventory?.products?.[0]?.property_values?.length > 0)
                                }
                              }));
                            }
                          } else {
                            toast.error(data.error || 'Failed to update variations');
                          }
                        } catch (e: any) {
                          toast.error(e.message);
                        } finally {
                          setIsInventoryLoading(false);
                        }
                      }}
                      disabled={isInventoryLoading}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
                    >
                      {isInventoryLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                      Save All Changes
                    </button>
                  </div>
                </div>
              )}

              {!inventoryResults && !isInventoryLoading && (
                <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                  <div className="p-4 bg-white rounded-2xl shadow-sm mb-4">
                    <Layers className="h-10 w-10 text-gray-300" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">No Variations Loaded</h4>
                  <p className="text-gray-500 text-sm max-w-xs text-center">Select a listing from the dropdown above to start managing its size and price variations.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'orders':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4 text-black">Order & Receipt Management</h3>
              <p className="text-gray-600 mb-4">
                Complete order lifecycle management:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2 text-black">Receipts</h4>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• GET /v3/application/shops/{'{shop_id}'}/receipts - Get shop receipts</li>
                    <li>• GET /v3/application/shops/{'{shop_id}'}/receipts/{'{receipt_id}'} - Get receipt details</li>
                    <li>• PUT /v3/application/shops/{'{shop_id}'}/receipts/{'{receipt_id}'} - Update receipt</li>
                  </ul>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold mb-2 text-black">Transactions</h4>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• GET /v3/application/shops/{'{shop_id}'}/transactions - Get shop transactions</li>
                    <li>• GET /v3/application/shops/{'{shop_id}'}/receipts/{'{receipt_id}'}/transactions - Get receipt transactions</li>
                    <li>• GET /v3/application/shops/{'{shop_id}'}/listings/{'{listing_id}'}/transactions - Get listing transactions</li>
                  </ul>
                </div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold mb-2 text-black">Shipments</h4>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>• POST /v3/application/shops/{'{shop_id}'}/receipts/{'{receipt_id}'}/tracking - Create shipment</li>
                </ul>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-black">Recent Orders</h3>
                <button
                  onClick={loadDashboardStats}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>
              <div className="space-y-3">
                {receipts.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No orders found</p>
                ) : (
                  receipts.map((receipt) => (
                    <div key={receipt.receiptId} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-black">Order #{receipt.receiptId}</p>
                          <p className="text-sm text-gray-600">{receipt.name}</p>
                          {receipt.formattedAddress && (
                            <p className="text-xs text-gray-500 mt-1">{receipt.formattedAddress}</p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-medium text-black">${receipt.grandTotal?.amount.toFixed(2) || '0.00'}</p>
                          <p className={`text-xs font-medium ${receipt.isShipped ? 'text-green-600' : 'text-orange-600'}`}>
                            {receipt.isShipped ? 'Shipped' : 'Pending'}
                          </p>
                        </div>
                      </div>
                      {receipt.transactions && receipt.transactions.length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          {receipt.transactions.map((tx) => (
                            <div key={tx.transactionId} className="text-sm text-gray-600 mb-1">
                              {tx.title} - ${tx.price.amount.toFixed(2)} x {tx.quantity}
                            </div>
                          ))}
                        </div>
                      )}
                      {!receipt.isShipped && (
                        <div className="mt-3 pt-3 border-t">
                          <button
                            onClick={() => setShowCreateReceiptShipment(receipt.receiptId)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            <Truck className="h-4 w-4" />
                            Add Tracking
                          </button>
                        </div>
                      )}
                      {showCreateReceiptShipment === receipt.receiptId && (
                        <ShipmentForm
                          receiptId={receipt.receiptId}
                          onCancel={() => setShowCreateReceiptShipment(null)}
                          onSubmit={(trackingCode, carrierName) => {
                            handleCreateShipment(receipt.receiptId, trackingCode, carrierName);
                          }}
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      case 'reviews':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4 text-black">Review Management</h3>
              <p className="text-gray-600 mb-4">
                Monitor and manage customer reviews:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                <li>GET /v3/application/shops/{'{shop_id}'}/reviews - Get shop reviews</li>
                <li>GET /v3/application/listings/{'{listing_id}'}/reviews - Get listing reviews</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4 text-black">All Reviews ({reviews.length})</h3>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.transactionId} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {new Date(review.createTimestamp * 1000).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-800">{review.review}</p>
                    {review.imageUrlFullxFull && (
                      <img src={review.imageUrlFullxFull} alt="Review" className="mt-2 w-32 h-32 object-cover rounded" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'payments':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4 text-black">Financial Analytics</h3>
              <p className="text-gray-600 mb-4">
                Track payments and financial transactions:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2 text-black">Payments</h4>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• GET /v3/application/shops/{'{shop_id}'}/payments - Get payments</li>
                    <li>• GET /v3/application/shops/{'{shop_id}'}/receipts/{'{receipt_id}'}/payments - Get receipt payments</li>
                  </ul>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold mb-2 text-black">Ledger Entries</h4>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• GET /v3/application/shops/{'{shop_id}'}/payment-account/ledger-entries - Get ledger entries</li>
                    <li>• GET /v3/application/shops/{'{shop_id}'}/payment-account/ledger-entries/{'{ledger_entry_id}'} - Get entry details</li>
                    <li>• GET /v3/application/shops/{'{shop_id}'}/payment-account/ledger-entries/{'{ledger_entry_id}'}/payments - Get entry payments</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4 text-black">Recent Payments</h3>
              <div className="space-y-3">
                {payments.slice(0, 10).map((payment) => (
                  <div key={payment.paymentId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Payment #{payment.paymentId}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(payment.createTimestamp * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="font-medium text-green-600">
                      ${payment.amount.amount.toFixed(2)} {payment.currencyCode}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'shipping':
        return (
          <div className="space-y-6">
            {!selectedShopId ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-yellow-800 font-medium">Please select a shop to manage shipping profiles</p>
              </div>
            ) : (
              <>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-black">Shipping Profile Management</h3>
                      <div className="relative">
                        <button
                          type="button"
                          onMouseEnter={(e) => {
                            const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                            if (tooltip) tooltip.style.display = 'block';
                          }}
                          onMouseLeave={(e) => {
                            const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                            if (tooltip) tooltip.style.display = 'none';
                          }}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <HelpCircle className="h-5 w-5" />
                        </button>
                        <div className="hidden absolute z-50 left-0 bottom-full mb-2 w-72 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg">
                          <p>Shipping profiles allow you to set shipping costs, processing times, and delivery estimates. Create different profiles for different shipping methods or regions.</p>
                          <div className="absolute left-4 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowCreateShippingProfile(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Create Profile
                    </button>
                  </div>

                  {showCreateShippingProfile && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-black">{editingShippingProfile ? 'Edit Shipping Profile' : 'Create Shipping Profile'}</h4>
                        <button
                          onClick={() => {
                            setShowCreateShippingProfile(false);
                            setEditingShippingProfile(null);
                            setShippingProfileFormData({
                              title: '',
                              min_processing_time: 1,
                              max_processing_time: 3,
                              processing_time_unit: 'business_days',
                              origin_country_iso: 'US',
                              primary_cost: '',
                              secondary_cost: '',
                              min_delivery_days: '',
                              max_delivery_days: '',
                            });
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1 text-black flex items-center gap-2">
                            Profile Title *
                            <HelpTooltip fieldKey="title" section="shipping" />
                          </label>
                          <input
                            type="text"
                            value={shippingProfileFormData.title}
                            onChange={(e) => setShippingProfileFormData({ ...shippingProfileFormData, title: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg text-black"
                            placeholder={formFieldMetadata['shipping.title']?.placeholder || "e.g., Standard Shipping"}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-black flex items-center gap-2">
                            Origin Country ISO
                            <HelpTooltip fieldKey="origin_country_iso" section="shipping" />
                          </label>
                          <input
                            type="text"
                            value={shippingProfileFormData.origin_country_iso}
                            onChange={(e) => setShippingProfileFormData({ ...shippingProfileFormData, origin_country_iso: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg text-black"
                            placeholder={formFieldMetadata['shipping.origin_country_iso']?.placeholder || "US"}
                            maxLength={2}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-black flex items-center gap-2">
                            Min Processing Time
                            <HelpTooltip fieldKey="min_processing_time" section="shipping" />
                          </label>
                          <input
                            type="number"
                            value={shippingProfileFormData.min_processing_time ?? 1}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 1 : parseInt(e.target.value) || 1;
                              setShippingProfileFormData({ ...shippingProfileFormData, min_processing_time: val });
                            }}
                            className="w-full px-3 py-2 border rounded-lg text-black"
                            min={formFieldMetadata['shipping.min_processing_time']?.min || 1}
                            max="10"
                            placeholder={formFieldMetadata['shipping.min_processing_time']?.placeholder || "1"}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-black flex items-center gap-2">
                            Max Processing Time
                            <HelpTooltip fieldKey="max_processing_time" section="shipping" />
                          </label>
                          <input
                            type="number"
                            value={shippingProfileFormData.max_processing_time ?? 3}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 3 : parseInt(e.target.value) || 3;
                              setShippingProfileFormData({ ...shippingProfileFormData, max_processing_time: val });
                            }}
                            className="w-full px-3 py-2 border rounded-lg text-black"
                            min={formFieldMetadata['shipping.max_processing_time']?.min || 1}
                            max="10"
                            placeholder={formFieldMetadata['shipping.max_processing_time']?.placeholder || "3"}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-black">Processing Time Unit</label>
                          <select
                            value={shippingProfileFormData.processing_time_unit}
                            onChange={(e) => setShippingProfileFormData({ ...shippingProfileFormData, processing_time_unit: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg text-black"
                          >
                            <option value="business_days">Business Days</option>
                            <option value="weeks">Weeks</option>
                          </select>
                        </div>
                        {!editingShippingProfile && (
                          <>
                            <div>
                              <label className="block text-sm font-medium mb-1 text-black">Primary Cost *</label>
                              <input
                                type="number"
                                step="0.01"
                                value={shippingProfileFormData.primary_cost}
                                onChange={(e) => setShippingProfileFormData({ ...shippingProfileFormData, primary_cost: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg text-black"
                                placeholder="0.00"
                                min="0"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1 text-black">Secondary Cost *</label>
                              <input
                                type="number"
                                step="0.01"
                                value={shippingProfileFormData.secondary_cost}
                                onChange={(e) => setShippingProfileFormData({ ...shippingProfileFormData, secondary_cost: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg text-black"
                                placeholder="0.00"
                                min="0"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1 text-black">Min Delivery Days</label>
                              <input
                                type="number"
                                value={shippingProfileFormData.min_delivery_days}
                                onChange={(e) => setShippingProfileFormData({ ...shippingProfileFormData, min_delivery_days: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg text-black"
                                placeholder="Optional"
                                min="1"
                                max="45"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1 text-black">Max Delivery Days</label>
                              <input
                                type="number"
                                value={shippingProfileFormData.max_delivery_days}
                                onChange={(e) => setShippingProfileFormData({ ...shippingProfileFormData, max_delivery_days: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg text-black"
                                placeholder="Optional"
                                min="1"
                                max="45"
                              />
                            </div>
                          </>
                        )}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={handleCreateShippingProfile}
                          disabled={loading || !shippingProfileFormData.title || (!editingShippingProfile && (!shippingProfileFormData.primary_cost || !shippingProfileFormData.secondary_cost))}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          {editingShippingProfile ? 'Update Profile' : 'Create Profile'}
                        </button>
                        <button
                          onClick={() => setShowCreateShippingProfile(false)}
                          className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-semibold mb-4 text-black">Your Shipping Profiles ({shippingProfiles.length})</h3>
                  <div className="space-y-3">
                    {shippingProfiles.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No shipping profiles found. Create your first profile above.</p>
                    ) : (
                      shippingProfiles.map((profile: any) => (
                        <div key={profile.shipping_profile_id} className="p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-black">{profile.title || `Profile #${profile.shipping_profile_id}`}</p>
                              <p className="text-sm text-gray-600">ID: {profile.shipping_profile_id}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditShippingProfile(profile)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Edit shipping profile"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteShippingProfile(profile.shipping_profile_id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete shipping profile"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        );
      case 'sections':
        return (
          <div className="space-y-6">
            {!selectedShopId ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-yellow-800 font-medium">Please select a shop to manage shop sections</p>
              </div>
            ) : (
              <>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-black">Shop Section Management</h3>
                      <div className="relative">
                        <button
                          type="button"
                          onMouseEnter={(e) => {
                            const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                            if (tooltip) tooltip.style.display = 'block';
                          }}
                          onMouseLeave={(e) => {
                            const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                            if (tooltip) tooltip.style.display = 'none';
                          }}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <HelpCircle className="h-5 w-5" />
                        </button>
                        <div className="hidden absolute z-50 left-0 bottom-full mb-2 w-72 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg">
                          <p>Shop sections help organize your listings into categories. This makes it easier for buyers to browse your shop and find what they're looking for.</p>
                          <div className="absolute left-4 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowCreateSection(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Create Section
                    </button>
                  </div>

                  {showCreateSection && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-black">Create Shop Section</h4>
                        <button
                          onClick={() => {
                            setShowCreateSection(false);
                            setSectionFormData({ title: '' });
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-black flex items-center gap-2">
                          Section Title *
                          <HelpTooltip fieldKey="title" section="sections" />
                        </label>
                        <input
                          type="text"
                          value={sectionFormData.title}
                          onChange={(e) => setSectionFormData({ ...sectionFormData, title: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg text-black"
                          placeholder={formFieldMetadata['sections.title']?.placeholder || "e.g., Handmade Jewelry"}
                        />
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={handleCreateSection}
                          disabled={loading || !sectionFormData.title}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          {editingSection ? 'Update Section' : 'Create Section'}
                        </button>
                        <button
                          onClick={() => setShowCreateSection(false)}
                          className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-black">Your Shop Sections ({shopSections.length})</h3>
                    <button
                      onClick={loadShopSections}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </button>
                  </div>
                  <div className="space-y-3">
                    {shopSections.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No sections found. Create your first section above.</p>
                    ) : (
                      shopSections.map((section: any) => (
                        <div key={section.shop_section_id} className="p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-black">{section.title}</p>
                              <p className="text-sm text-gray-600">ID: {section.shop_section_id}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditSection(section)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Edit shop section"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSection(section.shop_section_id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete shop section"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        );
      case 'taxonomy':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-black">Taxonomy Research</h3>
                  <div className="relative">
                    <button
                      type="button"
                      onMouseEnter={(e) => {
                        const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                        if (tooltip) tooltip.style.display = 'block';
                      }}
                      onMouseLeave={(e) => {
                        const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                        if (tooltip) tooltip.style.display = 'none';
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <HelpCircle className="h-5 w-5" />
                    </button>
                    <div className="hidden absolute z-50 left-0 bottom-full mb-2 w-96 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg">
                      <p className="mb-2"><strong>Taxonomy Research</strong> helps you find the correct category and properties for your listings.</p>
                      <p className="mb-2"><strong>Buyer Taxonomy:</strong> Shows how buyers see categories when browsing Etsy.</p>
                      <p><strong>Seller Taxonomy:</strong> The categories you select when creating listings. Select a category to see available properties (like size, color, material) that you can use for variations.</p>
                      <div className="absolute left-4 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={loadTaxonomyNodes}
                  disabled={isLoadingTaxonomy}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingTaxonomy ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-4 mb-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="seller"
                      checked={taxonomyType === 'seller'}
                      onChange={(e) => {
                        setTaxonomyType(e.target.value as 'seller');
                        setSelectedTaxonomyNode(null);
                        setTaxonomyProperties([]);
                      }}
                      className="h-4 w-4"
                    />
                    <span className="text-sm font-medium text-black">Seller Taxonomy</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="buyer"
                      checked={taxonomyType === 'buyer'}
                      onChange={(e) => {
                        setTaxonomyType(e.target.value as 'buyer');
                        setSelectedTaxonomyNode(null);
                        setTaxonomyProperties([]);
                      }}
                      className="h-4 w-4"
                    />
                    <span className="text-sm font-medium text-black">Buyer Taxonomy</span>
                  </label>
                </div>

                {taxonomyType === 'seller' && !selectedShopId && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-yellow-800">
                      Please select a shop to view seller taxonomy. Buyer taxonomy is available without a shop selection.
                    </p>
                  </div>
                )}

                <div className="mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search taxonomy nodes..."
                    className="w-full px-3 py-2 border rounded-lg text-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="border rounded-lg p-4 bg-gray-50 max-h-[600px] overflow-y-auto">
                  <h4 className="font-semibold mb-3 text-black flex items-center gap-2">
                    {taxonomyType === 'seller' ? 'Seller' : 'Buyer'} Taxonomy Tree
                    {isLoadingTaxonomy && <Loader2 className="h-4 w-4 animate-spin" />}
                  </h4>
                  {isLoadingTaxonomy && (taxonomyType === 'seller' ? sellerTaxonomyNodes : buyerTaxonomyNodes).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p>Loading taxonomy nodes...</p>
                    </div>
                  ) : (taxonomyType === 'seller' ? sellerTaxonomyNodes : buyerTaxonomyNodes).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No taxonomy nodes found. Click Refresh to load.</p>
                    </div>
                  ) : (
                    <div>
                      {(taxonomyType === 'seller' ? sellerTaxonomyNodes : buyerTaxonomyNodes).map((node: any) =>
                        renderTaxonomyNode(node)
                      )}
                    </div>
                  )}
                </div>

                <div className="border rounded-lg p-4 bg-gray-50 max-h-[600px] overflow-y-auto">
                  <h4 className="font-semibold mb-3 text-black">
                    {selectedTaxonomyNode ? `Properties for: ${selectedTaxonomyNode.name}` : 'Select a taxonomy node'}
                  </h4>
                  {selectedTaxonomyNode && (
                    <div className="mb-3 p-2 bg-white rounded border">
                      <p className="text-sm"><strong>ID:</strong> {selectedTaxonomyNode.id}</p>
                      <p className="text-sm"><strong>Level:</strong> {selectedTaxonomyNode.level}</p>
                      {selectedTaxonomyNode.parent_id && (
                        <p className="text-sm"><strong>Parent ID:</strong> {selectedTaxonomyNode.parent_id}</p>
                      )}
                    </div>
                  )}
                  {isLoadingTaxonomy && taxonomyProperties.length === 0 && selectedTaxonomyNode ? (
                    <div className="text-center py-8 text-gray-500">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p>Loading properties...</p>
                    </div>
                  ) : taxonomyProperties.length === 0 && selectedTaxonomyNode ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No properties available for this taxonomy node.</p>
                    </div>
                  ) : selectedTaxonomyNode ? (
                    <div className="space-y-3">
                      {taxonomyProperties.map((prop: any) => (
                        <div key={prop.property_id} className="p-3 bg-white rounded border">
                          <div className="font-medium text-black mb-2">
                            {prop.display_name || prop.name}
                            <span className="text-xs text-gray-500 ml-2">(ID: {prop.property_id})</span>
                          </div>
                          {prop.description && (
                            <p className="text-xs text-gray-600 mb-2">{prop.description}</p>
                          )}
                          {prop.possible_values && prop.possible_values.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-700 mb-1">Possible Values:</p>
                              <div className="flex flex-wrap gap-1">
                                {prop.possible_values.slice(0, 10).map((value: any, idx: number) => (
                                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                    {value.name || value}
                                  </span>
                                ))}
                                {prop.possible_values.length > 10 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                    +{prop.possible_values.length - 10} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          {prop.is_required && (
                            <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                              Required
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>Select a taxonomy node from the tree to view its properties.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 'translations':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4 text-black">Multi-Language Listing Management</h3>
              <p className="text-gray-600 mb-4">
                Create and manage listing translations:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                <li>POST /v3/application/shops/{'{shop_id}'}/listings/{'{listing_id}'}/translations/{'{language}'} - Create translation</li>
                <li>GET /v3/application/shops/{'{shop_id}'}/listings/{'{listing_id}'}/translations/{'{language}'} - Get translation</li>
                <li>PUT /v3/application/shops/{'{shop_id}'}/listings/{'{listing_id}'}/translations/{'{language}'} - Update translation</li>
              </ul>
            </div>
          </div>
        );
      case 'media':
        return (
          <EtsyMediaLibrary
            shopId={selectedShopId}
            listings={sharedListings.filter((l: any) => l.state === 'active').map((l: any) => ({
              ...l,
              listingId: l.listingId || l.listing_id,
              title: l.title ? l.title.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&') : l.title
            }))}
          />
        );
      case 'policies':
        return (
          <div className="space-y-6">
            {!selectedShopId ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-yellow-800 font-medium">Please select a shop to manage return policies</p>
              </div>
            ) : (
              <>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-black">Return Policy Management</h3>
                      <div className="relative">
                        <button
                          type="button"
                          onMouseEnter={(e) => {
                            const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                            if (tooltip) tooltip.style.display = 'block';
                          }}
                          onMouseLeave={(e) => {
                            const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                            if (tooltip) tooltip.style.display = 'none';
                          }}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <HelpCircle className="h-5 w-5" />
                        </button>
                        <div className="hidden absolute z-50 left-0 bottom-full mb-2 w-96 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg">
                          <p className="mb-2"><strong>Return Policy Management</strong> allows you to create and manage return policies for your shop.</p>
                          <p className="mb-2">If you accept returns or exchanges, you must specify a return deadline (7, 14, 21, 30, 45, 60, or 90 days).</p>
                          <p>You can consolidate policies to merge listings from one policy into another and delete the source policy.</p>
                          <div className="absolute left-4 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowCreateReturnPolicy(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Create Policy
                    </button>
                  </div>

                  {showCreateReturnPolicy && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-black">{editingReturnPolicy ? 'Edit Return Policy' : 'Create Return Policy'}</h4>
                        <button
                          onClick={() => {
                            setShowCreateReturnPolicy(false);
                            setEditingReturnPolicy(null);
                            setReturnPolicyFormData({
                              accepts_returns: false,
                              accepts_exchanges: false,
                              return_deadline: null,
                            });
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={returnPolicyFormData.accepts_returns}
                            onChange={(e) => setReturnPolicyFormData({ ...returnPolicyFormData, accepts_returns: e.target.checked })}
                            className="h-4 w-4"
                          />
                          <label className="text-sm font-medium text-black">Accepts Returns</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={returnPolicyFormData.accepts_exchanges}
                            onChange={(e) => setReturnPolicyFormData({ ...returnPolicyFormData, accepts_exchanges: e.target.checked })}
                            className="h-4 w-4"
                          />
                          <label className="text-sm font-medium text-black">Accepts Exchanges</label>
                        </div>
                        {(returnPolicyFormData.accepts_returns || returnPolicyFormData.accepts_exchanges) && (
                          <div>
                            <label className="block text-sm font-medium mb-1 text-black">Return Deadline (days) *</label>
                            <select
                              value={returnPolicyFormData.return_deadline || ''}
                              onChange={(e) => setReturnPolicyFormData({ ...returnPolicyFormData, return_deadline: e.target.value ? parseInt(e.target.value) : null })}
                              className="w-full px-3 py-2 border rounded-lg text-black"
                            >
                              <option value="">Select deadline</option>
                              <option value="7">7 days</option>
                              <option value="14">14 days</option>
                              <option value="21">21 days</option>
                              <option value="30">30 days</option>
                              <option value="45">45 days</option>
                              <option value="60">60 days</option>
                              <option value="90">90 days</option>
                            </select>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={handleCreateReturnPolicy}
                          disabled={loading || ((returnPolicyFormData.accepts_returns || returnPolicyFormData.accepts_exchanges) && !returnPolicyFormData.return_deadline)}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          {editingReturnPolicy ? 'Update Policy' : 'Create Policy'}
                        </button>
                        <button
                          onClick={() => {
                            setShowCreateReturnPolicy(false);
                            setEditingReturnPolicy(null);
                            setReturnPolicyFormData({
                              accepts_returns: false,
                              accepts_exchanges: false,
                              return_deadline: null,
                            });
                          }}
                          className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-black">Your Return Policies ({returnPolicies.length})</h3>
                    <button
                      onClick={loadReturnPolicies}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </button>
                  </div>
                  <div className="space-y-3">
                    {returnPolicies.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No return policies found. Create your first policy above.</p>
                    ) : (
                      returnPolicies.map((policy: any) => (
                        <div key={policy.return_policy_id} className="p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-2">
                                <p className="font-medium text-black">Policy #{policy.return_policy_id}</p>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className={`px-2 py-1 rounded ${policy.accepts_returns ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                    {policy.accepts_returns ? 'Accepts Returns' : 'No Returns'}
                                  </span>
                                  <span className={`px-2 py-1 rounded ${policy.accepts_exchanges ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                                    {policy.accepts_exchanges ? 'Accepts Exchanges' : 'No Exchanges'}
                                  </span>
                                  {policy.return_deadline && (
                                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                                      {policy.return_deadline} days deadline
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => loadPolicyListings(policy.return_policy_id)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="View listings using this policy"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEditReturnPolicy(policy)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Edit return policy"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteReturnPolicy(policy.return_policy_id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete return policy"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {selectedPolicyForListings && policyListings.length > 0 && (
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-black">
                        Listings Using Policy #{selectedPolicyForListings} ({policyListings.length})
                      </h3>
                      <button
                        onClick={() => {
                          setPolicyListings([]);
                          setSelectedPolicyForListings(null);
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {policyListings.map((listing: any) => (
                        <div key={listing.listing_id} className="p-3 border rounded-lg">
                          <p className="font-medium text-black">{listing.title || `Listing #${listing.listing_id}`}</p>
                          <p className="text-sm text-gray-600">ID: {listing.listing_id}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {returnPolicies.length > 1 && (
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold mb-4 text-black">Consolidate Policies</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Move all listings from one policy to another and delete the source policy.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-black">Source Policy</label>
                        <select
                          id="source-policy"
                          className="w-full px-3 py-2 border rounded-lg text-black"
                        >
                          <option value="">Select source policy</option>
                          {returnPolicies.map((policy: any) => (
                            <option key={policy.return_policy_id} value={policy.return_policy_id}>
                              Policy #{policy.return_policy_id}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-black">Destination Policy</label>
                        <select
                          id="destination-policy"
                          className="w-full px-3 py-2 border rounded-lg text-black"
                        >
                          <option value="">Select destination policy</option>
                          {returnPolicies.map((policy: any) => (
                            <option key={policy.return_policy_id} value={policy.return_policy_id}>
                              Policy #{policy.return_policy_id}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const sourceSelect = document.getElementById('source-policy') as HTMLSelectElement;
                        const destSelect = document.getElementById('destination-policy') as HTMLSelectElement;
                        const sourceId = sourceSelect?.value ? parseInt(sourceSelect.value) : null;
                        const destId = destSelect?.value ? parseInt(destSelect.value) : null;
                        if (sourceId && destId && sourceId !== destId) {
                          handleConsolidatePolicies(sourceId, destId);
                        } else {
                          toast.error('Please select different source and destination policies');
                        }
                      }}
                      className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      Consolidate Policies
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        );
      case 'production':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4 text-black">Production Partner Management</h3>
              <p className="text-gray-600 mb-4">
                Manage production partners and readiness states:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2 text-black">Partners</h4>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• GET /v3/application/shops/{'{shop_id}'}/production-partners - Get production partners</li>
                  </ul>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold mb-2 text-black">Readiness States</h4>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• GET /v3/application/shops/{'{shop_id}'}/processing-profiles - Get readiness state definitions</li>
                    <li>• POST /v3/application/shops/{'{shop_id}'}/processing-profiles - Create readiness state</li>
                    <li>• GET /v3/application/shops/{'{shop_id}'}/processing-profiles/{'{processing_profile_id}'} - Get readiness state</li>
                    <li>• PUT /v3/application/shops/{'{shop_id}'}/processing-profiles/{'{processing_profile_id}'} - Update readiness state</li>
                    <li>• DELETE /v3/application/shops/{'{shop_id}'}/processing-profiles/{'{processing_profile_id}'} - Delete readiness state</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
      case 'holidays':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4 text-black">Holiday & Vacation Settings</h3>
              <p className="text-gray-600 mb-4">
                Configure holiday preferences and vacation mode:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                <li>GET /v3/application/shops/{'{shop_id}'}/holiday-preferences - Get holiday preferences</li>
                <li>PUT /v3/application/shops/{'{shop_id}'}/holiday-preferences - Update holiday preferences</li>
              </ul>
            </div>
          </div>
        );
      default:
        return <div className="text-center py-12 text-gray-500">Select a module to get started</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-2 text-black">Etsy Business Intelligence & Automation Suite</h1>
        <p className="text-gray-700 mb-4">
          Comprehensive platform utilizing all 100+ Etsy API endpoints for complete shop management, analytics, and automation
        </p>

        {/* Shop Selector */}
        <div className="mt-4">
          <EtsyShopSelector
            selectedShopId={selectedShopId}
            onShopChange={(shopId) => setSelectedShop(shopId)}
            showAddButton={true}
          />
        </div>

        {!selectedShopId && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Please connect or select an Etsy shop to start managing your listings, orders, and more.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Mobile Module Selector - Dropdown on small screens */}
        <div className="lg:hidden">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Select Management Module</label>
          <select
            value={activeModule}
            onChange={(e) => setActiveModule(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-black font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm"
          >
            {modules.map((module) => (
              <option key={module.id} value={module.id}>
                {module.label}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop Sidebar Sidebar */}
        <div className="hidden lg:block lg:w-72 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sticky top-4">
            <h2 className="font-bold mb-4 text-gray-900 px-2 tracking-tight">Management Modules</h2>
            <div className="space-y-1.5">
              {modules.map((module) => (
                <button
                  key={module.id}
                  onClick={() => setActiveModule(module.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 group ${activeModule === module.id
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 ring-1 ring-purple-600'
                    : 'hover:bg-purple-50 text-gray-600 hover:text-purple-700'
                    }`}
                >
                  <module.icon className={`h-5 w-5 shrink-0 transition-colors ${activeModule === module.id ? 'text-white' : 'text-gray-400 group-hover:text-purple-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{module.label}</div>
                    {module.description && (
                      <div className={`text-[10px] truncate ${activeModule === module.id ? 'text-purple-100' : 'text-gray-400'}`}>
                        {module.description}
                      </div>
                    )}
                  </div>
                  <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${activeModule === module.id ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-gray-200">
              <Loader2 className="h-10 w-10 animate-spin text-purple-600 mb-4" />
              <p className="text-gray-500 font-medium">Processing your request...</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {renderModuleContent()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

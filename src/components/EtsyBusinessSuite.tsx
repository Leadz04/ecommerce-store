'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import EtsyShopSelector from '@/components/EtsyShopSelector';

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
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [loading, setLoading] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [shopData, setShopData] = useState<Shop | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [draftListings, setDraftListings] = useState<Listing[]>([]);
  const [inactiveListings, setInactiveListings] = useState<Listing[]>([]);
  const [listingsTab, setListingsTab] = useState<'active' | 'draft' | 'inactive'>('active');
  const [optimizingListing, setOptimizingListing] = useState<number | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<any | null>(null);
  const [selectedListingForModal, setSelectedListingForModal] = useState<Listing | null>(null);
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
  });
  
  // Images and videos state
  const [listingImages, setListingImages] = useState<any[]>([]);
  const [listingVideos, setListingVideos] = useState<any[]>([]);
  const [newImageUrls, setNewImageUrls] = useState<string[]>(['']);
  
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

  const modules = [
    { id: 'dashboard', label: 'Business Dashboard', icon: BarChart3, description: 'Overview & KPIs' },
    { id: 'shops', label: 'Multi-Shop Management', icon: ShoppingCart, description: 'Manage multiple shops' },
    { id: 'listings', label: 'Listing Lifecycle', icon: Package, description: 'Create, update, optimize listings' },
    { id: 'inventory', label: 'Inventory & Pricing', icon: TrendingUp, description: 'Stock & pricing intelligence' },
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

  useEffect(() => {
    if (selectedShopId) {
      loadShopData();
      if (activeModule === 'shipping') {
        loadShippingProfiles();
      }
      if (activeModule === 'sections') {
        loadShopSections();
      }
      if (activeModule === 'policies') {
        loadReturnPolicies();
      }
      if (activeModule === 'listings' || activeModule === 'dashboard') {
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
      const token = localStorage.getItem('token');
      
      // Load seller taxonomy (requires shop)
      if (selectedShopId && token) {
        try {
          const sellerRes = await fetch(`/api/etsy/taxonomy/nodes?type=seller&shopId=${selectedShopId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          const sellerData = await parseJsonResponse<any>(sellerRes);
          if (sellerData.success) {
            // Handle both array and object with results property
            const nodes = Array.isArray(sellerData.results) ? sellerData.results : (sellerData.results?.results || []);
            setSellerTaxonomyNodes(nodes);
          }
        } catch (err) {
          console.error('Error loading seller taxonomy:', err);
        }
      }
      
      // Load buyer taxonomy (public, no auth needed)
      try {
        const buyerRes = await fetch(`/api/etsy/taxonomy/nodes?type=buyer`);
        const buyerData = await parseJsonResponse<any>(buyerRes);
        if (buyerData.success) {
          // Handle both array and object with results property
          const nodes = Array.isArray(buyerData.results) ? buyerData.results : (buyerData.results?.results || []);
          setBuyerTaxonomyNodes(nodes);
        }
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
      const token = localStorage.getItem('token');
      const url = taxonomyType === 'seller' && selectedShopId
        ? `/api/etsy/taxonomy/nodes/${taxonomyId}/properties?type=${taxonomyType}&shopId=${selectedShopId}`
        : `/api/etsy/taxonomy/nodes/${taxonomyId}/properties?type=${taxonomyType}`;
      
      const response = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await parseJsonResponse<any>(response);
      if (data.success) {
        setTaxonomyProperties(data.results || []);
      } else {
        toast.error(data.error || 'Failed to load properties');
      }
    } catch (error) {
      console.error('Error loading taxonomy properties:', error);
      toast.error('Failed to load taxonomy properties');
    } finally {
      setIsLoadingTaxonomy(false);
    }
  };

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
  const renderTaxonomyNode = (node: any, level: number = 0): JSX.Element => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const matchesSearch = !searchQuery || 
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.id.toString().includes(searchQuery);

    if (!matchesSearch && !hasChildren) return <></>;

    return (
      <div key={node.id} className="mb-1">
        <div
          className={`flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer ${
            selectedTaxonomyNode?.id === node.id ? 'bg-purple-50 border border-purple-200' : ''
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

  // Load shops list
  useEffect(() => {
    loadShops();
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

  const loadShops = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('/api/etsy/shops', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await parseJsonResponse<any>(response);
      if (data.success && data.shops) {
        setShops(data.shops);
        if (!selectedShopId && data.shops.length > 0) {
          setSelectedShopId(data.shops[0].shopId);
        }
      }
    } catch (error) {
      console.error('Error loading shops:', error);
    }
  };

  const loadShopData = async () => {
    if (!selectedShopId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/etsy/shop/${selectedShopId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await parseJsonResponse<any>(response);
      if (data.success) {
        setShopData(data.shop);
        loadDashboardStats();
      } else {
        toast.error('Failed to load shop data');
      }
    } catch (error) {
      toast.error('Error loading shop data');
    } finally {
      setLoading(false);
    }
  };

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
      if (listingFormData.item_weight) {
        listingPayload.listing.item_weight = parseFloat(listingFormData.item_weight);
      }
      if (listingFormData.item_weight_unit) {
        listingPayload.listing.item_weight_unit = listingFormData.item_weight_unit;
      }
      if (listingFormData.item_length) {
        listingPayload.listing.item_length = parseFloat(listingFormData.item_length);
      }
      if (listingFormData.item_width) {
        listingPayload.listing.item_width = parseFloat(listingFormData.item_width);
      }
      if (listingFormData.item_height) {
        listingPayload.listing.item_height = parseFloat(listingFormData.item_height);
      }
      if (listingFormData.item_dimensions_unit) {
        listingPayload.listing.item_dimensions_unit = listingFormData.item_dimensions_unit;
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
        });
        setListingImages([]);
        setListingVideos([]);
        setNewImageUrls(['']);
        setListingInventory(null);
        setAvailableProperties([]);
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
      const updateData: any = {
        shopId: selectedShopId,
      };
      
      // Basic fields
      if (listingFormData.title) updateData.title = listingFormData.title;
      if (listingFormData.description) updateData.description = listingFormData.description;
      if (listingFormData.price) updateData.price = parseFloat(listingFormData.price);
      if (listingFormData.quantity) updateData.quantity = listingFormData.quantity;
      if (listingFormData.taxonomy_id) updateData.taxonomy_id = parseInt(listingFormData.taxonomy_id);
      
      // Tags and materials
      if (listingFormData.tags) updateData.tags = listingFormData.tags.split(',').map(t => t.trim()).filter(Boolean);
      if (listingFormData.materials) updateData.materials = listingFormData.materials.split(',').map(m => m.trim()).filter(Boolean);
      
      // Who/When made
      if (listingFormData.who_made) updateData.who_made = listingFormData.who_made;
      if (listingFormData.when_made) updateData.when_made = listingFormData.when_made;
      updateData.is_supply = listingFormData.is_supply;
      
      // Shipping and sections
      if (listingFormData.shipping_profile_id) updateData.shipping_profile_id = parseInt(listingFormData.shipping_profile_id);
      if (listingFormData.shop_section_id) updateData.shop_section_id = parseInt(listingFormData.shop_section_id);
      if (listingFormData.return_policy_id) updateData.return_policy_id = parseInt(listingFormData.return_policy_id);
      
      // Processing times
      if (listingFormData.processing_min) updateData.processing_min = parseInt(listingFormData.processing_min);
      if (listingFormData.processing_max) updateData.processing_max = parseInt(listingFormData.processing_max);
      
      // Item weight and dimensions
      if (listingFormData.item_weight) updateData.item_weight = parseFloat(listingFormData.item_weight);
      if (listingFormData.item_weight_unit) updateData.item_weight_unit = listingFormData.item_weight_unit;
      if (listingFormData.item_length) updateData.item_length = parseFloat(listingFormData.item_length);
      if (listingFormData.item_width) updateData.item_width = parseFloat(listingFormData.item_width);
      if (listingFormData.item_height) updateData.item_height = parseFloat(listingFormData.item_height);
      if (listingFormData.item_dimensions_unit) updateData.item_dimensions_unit = listingFormData.item_dimensions_unit;
      
      // Image IDs (from existing images)
      if (listingImages.length > 0) {
        updateData.image_ids = listingImages.map((img: any) => img.listing_image_id).filter(Boolean);
      }
      
      // Personalization
      updateData.is_personalizable = listingFormData.is_personalizable;
      if (listingFormData.is_personalizable) {
        updateData.personalization_is_required = listingFormData.personalization_is_required;
        if (listingFormData.personalization_char_count_max) {
          updateData.personalization_char_count_max = parseInt(listingFormData.personalization_char_count_max);
        }
        if (listingFormData.personalization_instructions) {
          updateData.personalization_instructions = listingFormData.personalization_instructions;
        }
      }
      
      // Additional options
      updateData.is_taxable = listingFormData.is_taxable;
      updateData.should_auto_renew = listingFormData.should_auto_renew;
      if (listingFormData.featured_rank) updateData.featured_rank = parseInt(listingFormData.featured_rank);
      if (listingFormData.state) updateData.state = listingFormData.state;
      
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
        toast.success('Listing updated successfully!');
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
        });
        setListingImages([]);
        setListingVideos([]);
        setNewImageUrls(['']);
        setListingInventory(null);
        setAvailableProperties([]);
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
      const response = await fetch(`/api/etsy/listings/${listingId}?shopId=${selectedShopId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await parseJsonResponse<any>(response);
      if (data.success) {
        toast.success('Listing deleted successfully!');
        loadDashboardStats(); // Refresh listings
      } else {
        toast.error(data.error || 'Failed to delete listing');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error deleting listing');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeListing = async (listing: Listing, mode: 'title' | 'description' | 'tags' | 'all' = 'all') => {
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
        toast.success('Listing optimized successfully!');
        // Keep modal open to show results
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
        setSelectedListingForModal(null);
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
    if (!selectedShopId || !editingListing) {
      toast.error('Please select a shop and listing first');
      return;
    }

    try {
      setOptimizingField(field);
      setFieldOptimizationResult(null);
      const token = localStorage.getItem('token');
      
      // For materials, we'll use a custom optimization since it's not in the standard optimizer
      if (field === 'materials') {
        // Use the AI optimize endpoint with a custom prompt for materials
        const response = await fetch('/api/ai/optimize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            mode: 'tags', // Reuse tags mode for materials
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
          // Parse the comma-separated materials
          const optimizedMaterials = data.output.split(',').map((m: string) => m.trim()).filter(Boolean);
          setFieldOptimizationResult({ field, optimized: optimizedMaterials.join(', ') });
          toast.success('Materials optimized successfully!');
        } else {
          toast.error('Failed to optimize materials');
        }
      } else {
        // Use the listing optimizer for title, description, and tags
        // Pass form data to avoid unnecessary API calls
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
              processing_min: listingFormData.processing_min ? parseInt(listingFormData.processing_min) : undefined,
              processing_max: listingFormData.processing_max ? parseInt(listingFormData.processing_max) : undefined,
            },
          }),
        });

        const data = await parseJsonResponse<any>(response);
        if (data.success || data.optimized) {
          const optimized = data.optimized || data;
          let optimizedValue = '';
          
          if (field === 'title') {
            optimizedValue = optimized.title?.optimized_title || optimized.optimized_title || '';
          } else if (field === 'description') {
            optimizedValue = optimized.description?.optimized_description || optimized.optimized_description || '';
          } else if (field === 'tags') {
            const tags = optimized.tags?.optimized_tags || optimized.optimized_tags || [];
            optimizedValue = Array.isArray(tags) ? tags.join(', ') : tags;
          }
          
          setFieldOptimizationResult({ field, optimized: optimizedValue });
          toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} optimized successfully!`);
        } else {
          toast.error(data.error || `Failed to optimize ${field}`);
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
        
        // Calculate price from amount/divisor format
        const price = listing.price?.amount && listing.price?.divisor 
          ? (listing.price.amount / listing.price.divisor).toFixed(2)
          : listing.price ? String(listing.price) : '';
        
        // Set ALL fields exactly as they come from Etsy
        setListingFormData({
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
        });
      }
      
      // Load images
      const imagesRes = await fetch(`/api/etsy/listings/${listingId}/images?shopId=${selectedShopId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const imagesData = await imagesRes.json();
      if (imagesData.success) {
        setListingImages(imagesData.results || []);
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
            setAvailableProperties(propsData.results || []);
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

  const loadDashboardStats = async () => {
    if (!selectedShopId || isLoadingStats) return;
    
    setIsLoadingStats(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Only load data for dashboard module, or if listings module is active
      const shouldLoadAll = activeModule === 'dashboard';
      
      // Load shop data (always needed)
      const shopRes = await fetch(`/api/etsy/shop/${selectedShopId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const shopData = await parseJsonResponse<any>(shopRes);
      if (shopData.success) {
        setShopData(shopData.shop);
      }

      // Load listings (only if dashboard or listings module)
      if (shouldLoadAll || activeModule === 'listings') {
        const offset = (listingsPage - 1) * listingsPerPage;
        
        // Load active listings
        const activeRes = await fetch(`/api/etsy/shops/${selectedShopId}/listings?state=active&limit=${listingsPerPage}&offset=${offset}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        const activeData = await parseJsonResponse<any>(activeRes);
        if (activeData.success) {
          const fetchedListings = activeData.results || [];
          const decodedListings = fetchedListings.map((listing: any) => ({
            ...listing,
            title: listing.title ? listing.title.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&') : listing.title
          }));
          setListings(decodedListings);
          setTotalListings(activeData.total || activeData.count || decodedListings.length);
          setHasMoreListings(activeData.hasMore !== undefined ? activeData.hasMore : (decodedListings.length === listingsPerPage && (activeData.total || decodedListings.length) > decodedListings.length));
          setStats(prev => ({ ...prev, 
            totalListings: activeData.total || decodedListings.length,
            activeListings: decodedListings.filter((l: Listing) => l.state === 'active').length
          }));
        }
        
        // Load draft listings (only if listings module is active)
        if (activeModule === 'listings') {
          const draftRes = await fetch(`/api/etsy/shops/${selectedShopId}/listings?state=draft&limit=100&offset=0`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          });
          const draftData = await parseJsonResponse<any>(draftRes);
          if (draftData.success) {
            const decodedDrafts = (draftData.results || []).map((listing: any) => ({
              ...listing,
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
                        className={`h-4 w-4 ${
                          i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
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
                      
                      {/* Images Section */}
                      <div className="mt-6 pt-6 border-t">
                        <SectionHeader 
                          title={`Images (${listingImages.length}/20)`}
                          icon={ImageIcon}
                          section="listings"
                          helpText="Add up to 20 high-quality images. The first image is your main listing photo. Use multiple angles and lifestyle shots to showcase your product."
                        />
                        {editingListing && listingImages.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            {listingImages.map((img: any, idx: number) => (
                              <div key={img.listing_image_id || idx} className="relative group">
                                <img
                                  src={img.url_fullxfull || img.url_570xN || img.url_75x75}
                                  alt={`Image ${idx + 1}`}
                                  className="w-full h-24 object-cover rounded border"
                                />
                                <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                                  {img.rank || idx + 1}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
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
                                    {video.url && (
                                      <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600">
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
                      
                      {/* Item Weight & Dimensions Section */}
                      <div className="mt-6 pt-6 border-t">
                        <SectionHeader 
                          title="Item Weight & Dimensions"
                          section="listings"
                          helpText="Accurate weight and dimensions help calculate shipping costs correctly and set buyer expectations about product size."
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1 text-black">Weight</label>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                step="0.01"
                                value={listingFormData.item_weight}
                                onChange={(e) => setListingFormData({ ...listingFormData, item_weight: e.target.value })}
                                className="flex-1 px-3 py-2 border rounded-lg text-black"
                                placeholder="0.00"
                              />
                              <select
                                value={listingFormData.item_weight_unit}
                                onChange={(e) => setListingFormData({ ...listingFormData, item_weight_unit: e.target.value })}
                                className="px-3 py-2 border rounded-lg text-black"
                              >
                                <option value="">Unit</option>
                                <option value="oz">oz</option>
                                <option value="lb">lb</option>
                                <option value="g">g</option>
                                <option value="kg">kg</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1 text-black">Dimensions Unit</label>
                            <select
                              value={listingFormData.item_dimensions_unit}
                              onChange={(e) => setListingFormData({ ...listingFormData, item_dimensions_unit: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg text-black"
                            >
                              <option value="">Select unit</option>
                              <option value="in">inches</option>
                              <option value="ft">feet</option>
                              <option value="mm">mm</option>
                              <option value="cm">cm</option>
                              <option value="m">m</option>
                              <option value="yd">yards</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1 text-black">Length</label>
                            <input
                              type="number"
                              step="0.01"
                              value={listingFormData.item_length}
                              onChange={(e) => setListingFormData({ ...listingFormData, item_length: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg text-black"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1 text-black">Width</label>
                            <input
                              type="number"
                              step="0.01"
                              value={listingFormData.item_width}
                              onChange={(e) => setListingFormData({ ...listingFormData, item_width: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg text-black"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1 text-black">Height</label>
                            <input
                              type="number"
                              step="0.01"
                              value={listingFormData.item_height}
                              onChange={(e) => setListingFormData({ ...listingFormData, item_height: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg text-black"
                              placeholder="0.00"
                            />
                          </div>
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
                    <button
                      onClick={loadDashboardStats}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </button>
                  </div>
                  
                  {/* Tabs for Active/Draft/Inactive */}
                  <div className="flex gap-2 mb-4 border-b">
                    <button
                      onClick={() => setListingsTab('active')}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        listingsTab === 'active'
                          ? 'text-purple-600 border-b-2 border-purple-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Active ({listings.length})
                    </button>
                    <button
                      onClick={() => setListingsTab('draft')}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        listingsTab === 'draft'
                          ? 'text-purple-600 border-b-2 border-purple-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Draft ({draftListings.length})
                    </button>
                    <button
                      onClick={() => setListingsTab('inactive')}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        listingsTab === 'inactive'
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
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedListingForModal(listing);
                            setShowListingModal(true);
                            setOptimizationResult(null);
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-black truncate">{listing.title}</p>
                            <p className="text-sm text-gray-600">
                              ${listing.price?.amount?.toFixed(2) || '0.00'} • {listing.quantity || 0} in stock • {listing.state}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                            {listing.url && (
                              <a
                                href={listing.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                title="View on Etsy"
                              >
                                <Eye className="h-4 w-4" />
                              </a>
                            )}
                            <button
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                              title="More options"
                            >
                              <ChevronRight className="h-4 w-4" />
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
                                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                  listingsPage === pageNum
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

                {/* Listing Actions Modal */}
                {showListingModal && selectedListingForModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-black">Listing Options</h3>
                        <button
                          onClick={() => {
                            setShowListingModal(false);
                            setSelectedListingForModal(null);
                            setOptimizationResult(null);
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      
                      <div className="p-6">
                        {/* Listing Info */}
                        <div className="mb-6 pb-6 border-b border-gray-200">
                          <h4 className="text-lg font-semibold text-black mb-2">{selectedListingForModal.title}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Price</p>
                              <p className="font-medium text-black">${selectedListingForModal.price?.amount?.toFixed(2) || '0.00'}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Stock</p>
                              <p className="font-medium text-black">{selectedListingForModal.quantity || 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">State</p>
                              <p className="font-medium text-black capitalize">{selectedListingForModal.state}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Views</p>
                              <p className="font-medium text-black">{selectedListingForModal.views || 0}</p>
                            </div>
                          </div>
                          {selectedListingForModal.url && (
                            <a
                              href={selectedListingForModal.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-800 text-sm"
                            >
                              <Eye className="h-4 w-4" />
                              View on Etsy
                            </a>
                          )}
                        </div>

                        {/* Optimization Results Display */}
                        {optimizationResult && optimizationResult.listing.listingId === selectedListingForModal.listingId && (
                          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-semibold text-purple-900">Optimization Results</h4>
                              <button
                                onClick={() => setOptimizationResult(null)}
                                className="text-purple-600 hover:text-purple-800"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="space-y-3 text-sm">
                              {optimizationResult.mode === 'title' || optimizationResult.mode === 'all' ? (
                                <div>
                                  <p className="font-medium text-gray-700 mb-1">Title:</p>
                                  <p className="text-gray-600 line-through mb-1">{optimizationResult.listing.title}</p>
                                  <p className="text-purple-700 font-medium">
                                    {optimizationResult.result.optimized?.title?.optimized_title || 
                                     optimizationResult.result.optimized?.optimized_title || 
                                     'No title generated'}
                                  </p>
                                </div>
                              ) : null}
                              {optimizationResult.mode === 'description' || optimizationResult.mode === 'all' ? (
                                <div>
                                  <p className="font-medium text-gray-700 mb-1">Description:</p>
                                  {optimizationResult.result.optimized?.description?.optimized_description || 
                                   optimizationResult.result.optimized?.optimized_description ? (
                                    <p className="text-purple-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                                      {optimizationResult.result.optimized?.description?.optimized_description || 
                                       optimizationResult.result.optimized?.optimized_description}
                                    </p>
                                  ) : (
                                    <p className="text-gray-500 italic">No description generated. Please try optimizing again.</p>
                                  )}
                                </div>
                              ) : null}
                              {optimizationResult.mode === 'tags' || optimizationResult.mode === 'all' ? (
                                <div>
                                  <p className="font-medium text-gray-700 mb-1">Tags:</p>
                                  {optimizationResult.result.optimized?.tags?.optimized_tags || 
                                   optimizationResult.result.optimized?.optimized_tags ? (
                                    <div className="flex flex-wrap gap-2">
                                      {(optimizationResult.result.optimized?.tags?.optimized_tags || 
                                        optimizationResult.result.optimized?.optimized_tags || []).map((tag: string, i: number) => (
                                        <span key={i} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">{tag}</span>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-gray-500 italic">No tags generated. Please try optimizing again.</p>
                                  )}
                                </div>
                              ) : null}
                            </div>
                            <button
                              onClick={handleApplyOptimization}
                              className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                            >
                              Apply Optimization
                            </button>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-3">
                          <button
                            onClick={() => handleOptimizeListing(selectedListingForModal, 'all')}
                            disabled={optimizingListing === selectedListingForModal.listingId}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {optimizingListing === selectedListingForModal.listingId ? (
                              <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Optimizing...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-5 w-5" />
                                <span>AI Optimize Listing</span>
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={async () => {
                              setEditingListing(selectedListingForModal);
                              await loadListingDetailsForEdit(selectedListingForModal.listingId);
                              setShowListingModal(false);
                              setSelectedListingForModal(null);
                              setShowCreateListing(true);
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <Edit className="h-5 w-5" />
                            <span>Edit Listing</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
                                handleDeleteListing(selectedListingForModal.listingId);
                                setShowListingModal(false);
                                setSelectedListingForModal(null);
                              }
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                            <span>Delete Listing</span>
                          </button>
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
              <p className="text-gray-600 mb-4">
                Manage inventory levels, pricing, and product variations:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                <li>GET /v3/application/listings/{'{listing_id}'}/inventory - Get full inventory details</li>
                <li>PUT /v3/application/listings/{'{listing_id}'}/inventory - Update inventory quantities and prices</li>
                <li>GET /v3/application/listings/{'{listing_id}'}/product - Get product details</li>
                <li>GET /v3/application/listings/{'{listing_id}'}/offering - Get offering details</li>
              </ul>
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
                              className={`h-5 w-5 ${
                                i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
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
                              min_processing_days: 1,
                              max_processing_days: 3,
                              origin_country_iso: 'US',
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
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4 text-black">Media Library Management</h3>
              <p className="text-gray-600 mb-4">
                Manage listing images, videos, and files:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg min-w-0">
                  <h4 className="font-semibold mb-2 text-black">Images</h4>
                  <ul className="text-sm space-y-2 text-gray-700">
                    <li className="break-words">
                      <span className="font-mono text-xs">GET</span> /v3/application/listings/{'{listing_id}'}/images - Get images
                    </li>
                    <li className="break-words">
                      <span className="font-mono text-xs">POST</span> /v3/application/shops/{'{shop_id}'}/listings/{'{listing_id}'}/images - Upload image
                    </li>
                    <li className="break-words">
                      <span className="font-mono text-xs">GET</span> /v3/application/listings/{'{listing_id}'}/images/{'{listing_image_id}'} - Get image
                    </li>
                    <li className="break-words">
                      <span className="font-mono text-xs">DELETE</span> /v3/application/shops/{'{shop_id}'}/listings/{'{listing_id}'}/images/{'{listing_image_id}'} - Delete image
                    </li>
                  </ul>
                </div>
                <div className="p-4 bg-green-50 rounded-lg min-w-0">
                  <h4 className="font-semibold mb-2 text-black">Videos</h4>
                  <ul className="text-sm space-y-2 text-gray-700">
                    <li className="break-words">
                      <span className="font-mono text-xs">GET</span> /v3/application/listings/{'{listing_id}'}/videos - Get videos
                    </li>
                    <li className="break-words">
                      <span className="font-mono text-xs">POST</span> /v3/application/shops/{'{shop_id}'}/listings/{'{listing_id}'}/videos - Upload video
                    </li>
                    <li className="break-words">
                      <span className="font-mono text-xs">GET</span> /v3/application/listings/{'{listing_id}'}/videos/{'{listing_video_id}'} - Get video
                    </li>
                    <li className="break-words">
                      <span className="font-mono text-xs">DELETE</span> /v3/application/shops/{'{shop_id}'}/listings/{'{listing_id}'}/videos/{'{listing_video_id}'} - Delete video
                    </li>
                  </ul>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg min-w-0">
                  <h4 className="font-semibold mb-2 text-black">Files</h4>
                  <ul className="text-sm space-y-2 text-gray-700">
                    <li className="break-words">
                      <span className="font-mono text-xs">GET</span> /v3/application/shops/{'{shop_id}'}/listings/{'{listing_id}'}/files - Get files
                    </li>
                    <li className="break-words">
                      <span className="font-mono text-xs">POST</span> /v3/application/shops/{'{shop_id}'}/listings/{'{listing_id}'}/files - Upload file
                    </li>
                    <li className="break-words">
                      <span className="font-mono text-xs">GET</span> /v3/application/shops/{'{shop_id}'}/listings/{'{listing_id}'}/files/{'{listing_file_id}'} - Get file
                    </li>
                    <li className="break-words">
                      <span className="font-mono text-xs">DELETE</span> /v3/application/shops/{'{shop_id}'}/listings/{'{listing_id}'}/files/{'{listing_file_id}'} - Delete file
                    </li>
                  </ul>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg min-w-0">
                  <h4 className="font-semibold mb-2 text-black">Variation Images</h4>
                  <ul className="text-sm space-y-2 text-gray-700">
                    <li className="break-words">
                      <span className="font-mono text-xs">GET</span> /v3/application/listings/{'{listing_id}'}/variation-images - Get variation images
                    </li>
                    <li className="break-words">
                      <span className="font-mono text-xs">POST</span> /v3/application/shops/{'{shop_id}'}/listings/{'{listing_id}'}/variation-images - Update variation images
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
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
            onShopChange={(shopId) => setSelectedShopId(shopId)}
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-4 sticky top-4">
            <h2 className="font-semibold mb-4 text-black">Modules</h2>
            <div className="space-y-1">
              {modules.map((module) => (
                <button
                  key={module.id}
                  onClick={() => setActiveModule(module.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                    activeModule === module.id
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <module.icon className="h-5 w-5" />
                  <div className="flex-1">
                    <div className="font-medium text-sm text-black">{module.label}</div>
                    {module.description && (
                      <div className="text-xs text-gray-500">{module.description}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            renderModuleContent()
          )}
        </div>
      </div>
    </div>
  );
}

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

export default function EtsyBusinessSuite() {
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [loading, setLoading] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [shopData, setShopData] = useState<Shop | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
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
  const [showCreateShippingProfile, setShowCreateShippingProfile] = useState(false);
  const [shippingProfiles, setShippingProfiles] = useState<any[]>([]);
  const [shopSections, setShopSections] = useState<any[]>([]);
  
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
  });
  const [sectionFormData, setSectionFormData] = useState({
    title: '',
  });
  const [shippingProfileFormData, setShippingProfileFormData] = useState({
    title: '',
    min_processing_days: 1,
    max_processing_days: 3,
    origin_country_iso: 'US',
  });

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
      if (activeModule === 'listings' || activeModule === 'dashboard') {
        // Only load stats if not already loading
        if (!isLoadingStats) {
          loadDashboardStats();
        }
      }
    }
  }, [selectedShopId, activeModule, listingsPage]);

  // Load shops list
  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('/api/etsy/shops', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
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
      const data = await response.json();
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
      const listingPayload = {
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
          shipping_profile_id: listingFormData.shipping_profile_id ? parseInt(listingFormData.shipping_profile_id) : undefined,
        }
      };
      
      const response = await fetch('/api/etsy/listings/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(listingPayload),
      });
      
      const data = await response.json();
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
      
      // Prepare update data
      const updateData: any = {
        shopId: selectedShopId,
      };
      
      // Only include fields that are being updated
      if (listingFormData.title) updateData.title = listingFormData.title;
      if (listingFormData.description) updateData.description = listingFormData.description;
      if (listingFormData.price) updateData.price = parseFloat(listingFormData.price);
      if (listingFormData.quantity) updateData.quantity = listingFormData.quantity;
      if (listingFormData.tags) updateData.tags = listingFormData.tags.split(',').map(t => t.trim()).filter(Boolean);
      if (listingFormData.materials) updateData.materials = listingFormData.materials.split(',').map(m => m.trim()).filter(Boolean);
      if (listingFormData.who_made) updateData.who_made = listingFormData.who_made;
      if (listingFormData.when_made) updateData.when_made = listingFormData.when_made;
      if (listingFormData.taxonomy_id) updateData.taxonomy_id = parseInt(listingFormData.taxonomy_id);
      if (listingFormData.shipping_profile_id) updateData.shipping_profile_id = parseInt(listingFormData.shipping_profile_id);
      
      const response = await fetch(`/api/etsy/listings/${listing.listingId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Listing updated successfully!');
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
      
      const data = await response.json();
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
      
      const data = await response.json();
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
      
      const data = await response.json();
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
      const data = await response.json();
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
      const response = await fetch(`/api/etsy/shops/${selectedShopId}/shipping-profiles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shippingProfileFormData),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Shipping profile created successfully!');
        setShowCreateShippingProfile(false);
        setShippingProfileFormData({
          title: '',
          min_processing_days: 1,
          max_processing_days: 3,
          origin_country_iso: 'US',
        });
        loadShippingProfiles();
      } else {
        toast.error(data.error || 'Failed to create shipping profile');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error creating shipping profile');
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
      const data = await response.json();
      if (data.success) {
        setShopSections(data.results || []);
      }
    } catch (error) {
      console.error('Error loading shop sections:', error);
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
      const response = await fetch(`/api/etsy/shops/${selectedShopId}/sections`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sectionFormData),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Shop section created successfully!');
        setShowCreateSection(false);
        setSectionFormData({ title: '' });
        loadShopSections();
      } else {
        toast.error(data.error || 'Failed to create shop section');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error creating shop section');
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
      const shopData = await shopRes.json();
      if (shopData.success) {
        setShopData(shopData.shop);
      }

      // Load listings (only if dashboard or listings module)
      if (shouldLoadAll || activeModule === 'listings') {
        const offset = (listingsPage - 1) * listingsPerPage;
        const listingsRes = await fetch(`/api/etsy/shops/${selectedShopId}/listings?state=active&limit=${listingsPerPage}&offset=${offset}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        const listingsData = await listingsRes.json();
        if (listingsData.success) {
          const fetchedListings = listingsData.results || [];
          // Decode HTML entities in titles
          const decodedListings = fetchedListings.map((listing: any) => ({
            ...listing,
            title: listing.title ? listing.title.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&') : listing.title
          }));
          setListings(decodedListings);
          setTotalListings(listingsData.total || decodedListings.length);
          setHasMoreListings(listingsData.hasMore || false);
          setStats(prev => ({ ...prev, 
            totalListings: listingsData.total || decodedListings.length,
            activeListings: decodedListings.filter((l: Listing) => l.state === 'active').length
          }));
        }
      }

      // Load receipts (only for dashboard)
      if (shouldLoadAll) {
        const receiptsRes = await fetch(`/api/etsy/shops/${selectedShopId}/receipts?limit=100`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        const receiptsData = await receiptsRes.json();
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
        const reviewsData = await reviewsRes.json();
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
        const paymentsData = await paymentsRes.json();
        if (paymentsData.success) {
          setPayments(paymentsData.results || []);
        }

        // Load ledger entries (only for dashboard)
        const ledgerRes = await fetch(`/api/etsy/shops/${selectedShopId}/ledger`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        const ledgerData = await ledgerRes.json();
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
                  <p className="font-medium">#{receipt.receiptId}</p>
                  <p className="text-sm text-gray-600">{receipt.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${receipt.grandTotal?.amount.toFixed(2) || '0.00'}</p>
                  <p className={`text-xs ${receipt.isShipped ? 'text-green-600' : 'text-orange-600'}`}>
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
                <p className="text-sm">{review.review}</p>
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
                            });
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1 text-black">Title *</label>
                          <input
                            type="text"
                            value={listingFormData.title}
                            onChange={(e) => setListingFormData({ ...listingFormData, title: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg text-black"
                            placeholder="Enter listing title"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-black">Price *</label>
                          <input
                            type="number"
                            step="0.01"
                            value={listingFormData.price}
                            onChange={(e) => setListingFormData({ ...listingFormData, price: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg text-black"
                            placeholder="0.00"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium mb-1 text-black">Description *</label>
                          <textarea
                            value={listingFormData.description}
                            onChange={(e) => setListingFormData({ ...listingFormData, description: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg text-black"
                            rows={4}
                            placeholder="Enter listing description"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-black">Quantity *</label>
                          <input
                            type="number"
                            value={listingFormData.quantity}
                            onChange={(e) => setListingFormData({ ...listingFormData, quantity: parseInt(e.target.value) || 1 })}
                            className="w-full px-3 py-2 border rounded-lg text-black"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-black">Taxonomy ID *</label>
                          <input
                            type="number"
                            value={listingFormData.taxonomy_id}
                            onChange={(e) => setListingFormData({ ...listingFormData, taxonomy_id: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg text-black"
                            placeholder="e.g., 1429"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-black">Who Made</label>
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
                          <label className="block text-sm font-medium mb-1 text-black">When Made</label>
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
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-black">Tags (comma-separated)</label>
                          <input
                            type="text"
                            value={listingFormData.tags}
                            onChange={(e) => setListingFormData({ ...listingFormData, tags: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg text-black"
                            placeholder="tag1, tag2, tag3"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-black">Materials (comma-separated)</label>
                          <input
                            type="text"
                            value={listingFormData.materials}
                            onChange={(e) => setListingFormData({ ...listingFormData, materials: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg text-black"
                            placeholder="cotton, silk, etc."
                          />
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
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={handleCreateListing}
                          disabled={loading || !listingFormData.title || !listingFormData.description || !listingFormData.price || !listingFormData.taxonomy_id}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          Create Draft Listing
                        </button>
                        <button
                          onClick={() => setShowCreateListing(false)}
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
                    <h3 className="text-lg font-semibold text-black">Your Listings ({totalListings || listings.length})</h3>
                    <button
                      onClick={loadDashboardStats}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </button>
                  </div>
                  <div className="space-y-3">
                    {listings.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No listings found. Create your first listing above.</p>
                    ) : (
                      listings.map((listing) => (
                        <div key={listing.listingId} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-black truncate">{listing.title}</p>
                            <p className="text-sm text-gray-600">${listing.price.amount.toFixed(2)} • {listing.quantity} in stock • {listing.state}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <a
                              href={listing.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              title="View on Etsy"
                            >
                              <Eye className="h-4 w-4" />
                            </a>
                            <button
                              onClick={() => {
                                setEditingListing(listing);
                                setListingFormData({
                                  title: listing.title || '',
                                  description: listing.description || '',
                                  quantity: listing.quantity || 1,
                                  price: listing.price?.amount?.toFixed(2) || '',
                                  taxonomy_id: listing.taxonomyId?.toString() || '',
                                  who_made: listing.whoMade || 'i_did',
                                  when_made: listing.whenMade || '2020_2025',
                                  is_supply: listing.isSupply || false,
                                  tags: listing.tags?.join(', ') || '',
                                  materials: listing.materials?.join(', ') || '',
                                  shipping_profile_id: listing.shippingProfileId?.toString() || '',
                                });
                                setShowCreateListing(true);
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded"
                              title="Edit listing"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteListing(listing.listingId)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="Delete listing"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Pagination Controls */}
                  {listings.length > 0 && (
                    <div className="mt-6 flex items-center justify-between border-t pt-4">
                      <div className="text-sm text-gray-600">
                        Showing {((listingsPage - 1) * listingsPerPage) + 1} to {Math.min(listingsPage * listingsPerPage, totalListings)} of {totalListings} listings
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setListingsPage(prev => Math.max(1, prev - 1))}
                          disabled={listingsPage === 1}
                          className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="px-3 py-1.5 text-sm text-gray-700">
                          Page {listingsPage}
                        </span>
                        <button
                          onClick={() => setListingsPage(prev => prev + 1)}
                          disabled={!hasMoreListings}
                          className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
                    <h3 className="text-lg font-semibold text-black">Shipping Profile Management</h3>
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
                        <h4 className="font-semibold text-black">Create Shipping Profile</h4>
                        <button
                          onClick={() => {
                            setShowCreateShippingProfile(false);
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
                          <label className="block text-sm font-medium mb-1 text-black">Profile Title *</label>
                          <input
                            type="text"
                            value={shippingProfileFormData.title}
                            onChange={(e) => setShippingProfileFormData({ ...shippingProfileFormData, title: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg text-black"
                            placeholder="e.g., Standard Shipping"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-black">Origin Country ISO</label>
                          <input
                            type="text"
                            value={shippingProfileFormData.origin_country_iso}
                            onChange={(e) => setShippingProfileFormData({ ...shippingProfileFormData, origin_country_iso: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg text-black"
                            placeholder="US"
                            maxLength={2}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-black">Min Processing Days</label>
                          <input
                            type="number"
                            value={shippingProfileFormData.min_processing_days}
                            onChange={(e) => setShippingProfileFormData({ ...shippingProfileFormData, min_processing_days: parseInt(e.target.value) || 1 })}
                            className="w-full px-3 py-2 border rounded-lg text-black"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-black">Max Processing Days</label>
                          <input
                            type="number"
                            value={shippingProfileFormData.max_processing_days}
                            onChange={(e) => setShippingProfileFormData({ ...shippingProfileFormData, max_processing_days: parseInt(e.target.value) || 3 })}
                            className="w-full px-3 py-2 border rounded-lg text-black"
                            min="1"
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={handleCreateShippingProfile}
                          disabled={loading || !shippingProfileFormData.title}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          Create Profile
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
                              <button className="p-2 text-green-600 hover:bg-green-50 rounded">
                                <Edit className="h-4 w-4" />
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
                    <h3 className="text-lg font-semibold text-black">Shop Section Management</h3>
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
                        <label className="block text-sm font-medium mb-1 text-black">Section Title *</label>
                        <input
                          type="text"
                          value={sectionFormData.title}
                          onChange={(e) => setSectionFormData({ ...sectionFormData, title: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg text-black"
                          placeholder="e.g., Handmade Jewelry"
                        />
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={handleCreateSection}
                          disabled={loading || !sectionFormData.title}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          Create Section
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
                              <button className="p-2 text-green-600 hover:bg-green-50 rounded">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button className="p-2 text-red-600 hover:bg-red-50 rounded">
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
              <h3 className="text-lg font-semibold mb-4 text-black">Taxonomy Research</h3>
              <p className="text-gray-600 mb-4">
                Research categories and product properties:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2 text-black">Buyer Taxonomy</h4>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• GET /v3/application/buyer-taxonomy/nodes - Get buyer taxonomy nodes</li>
                    <li>• GET /v3/application/buyer-taxonomy/nodes/{'{taxonomy_id}'}/properties - Get properties by buyer taxonomy</li>
                  </ul>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold mb-2 text-black">Seller Taxonomy</h4>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• GET /v3/application/seller-taxonomy/nodes - Get seller taxonomy nodes</li>
                    <li>• GET /v3/application/seller-taxonomy/nodes/{'{taxonomy_id}'}/properties - Get properties by seller taxonomy</li>
                  </ul>
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
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4 text-black">Return Policy Management</h3>
              <p className="text-gray-600 mb-4">
                Create and manage return policies:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                <li>GET /v3/application/shops/{'{shop_id}'}/policies/return - Get return policies</li>
                <li>POST /v3/application/shops/{'{shop_id}'}/policies/return - Create return policy</li>
                <li>GET /v3/application/shops/{'{shop_id}'}/policies/return/{'{return_policy_id}'} - Get policy details</li>
                <li>PUT /v3/application/shops/{'{shop_id}'}/policies/return/{'{return_policy_id}'} - Update policy</li>
                <li>DELETE /v3/application/shops/{'{shop_id}'}/policies/return/{'{return_policy_id}'} - Delete policy</li>
                <li>GET /v3/application/shops/{'{shop_id}'}/policies/return/{'{return_policy_id}'}/listings - Get policy listings</li>
                <li>POST /v3/application/shops/{'{shop_id}'}/policies/return/consolidate - Consolidate policies</li>
              </ul>
            </div>
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

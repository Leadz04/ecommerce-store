'use client';

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import {
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  Shield,
  ShieldCheck,
  UserPlus,
  UserCheck,
  UserX,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Plus,
  RefreshCw,
  DollarSign,
  Tag,
  Image as ImageIcon,
  FileText,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  AlertCircle,
  Calendar,
  Gift,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Copy,
  Cloud,
  ExternalLink,
  MoreVertical,
  Sparkles,
  FileCheck,
  History,
  Wrench,
  Home,
  Mail,
  Activity,
  ListChecks,
  Type,
  AlignLeft,
  ChevronDown,
  ChevronLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  MessageCircle,
  Send,
  User,
  X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import SourcingPanel from './sourcing-panel';
import BlogAdmin from '@/components/BlogAdmin';
import KeywordPlanner from '@/components/KeywordPlanner';
import EmailTrackingDashboard from '@/components/EmailTrackingDashboard';
import AdminProductCard, { AdminProductCardBadge, AdminProductCardStat } from '@/components/AdminProductCard';
import ProductEmailMarketing from '@/components/ProductEmailMarketing';
import { useAuthStore } from '@/store/authStore';
import UserForm from '@/components/UserForm';
import RoleForm from '@/components/RoleForm';
import ProductForm from '@/components/ProductForm';
import OrderDetailModal from '@/components/OrderDetailModal';
import { AdminSkeleton, TableSkeleton } from '@/components/LoadingSkeleton';
import SelectField, { SelectOption } from '@/components/SelectField';
import toast from 'react-hot-toast';

const allowedTabs = ['users', 'roles', 'products', 'policy-review', 'orders', 'overview', 'marketing', 'performance', 'analytics', 'etsy', 'seo', 'seo-raw', 'analytics-seo', 'blogs', 'keyword-planner', 'sourcing', 'email-tracking', 'support', 'chat'] as const;
type TabKey = typeof allowedTabs[number];
type SidebarTab = {
  id: TabKey;
  label: string;
  description?: string;
  icon: LucideIcon;
  children?: Array<{ id: TabKey; label: string; icon?: LucideIcon }>;
};

interface User {
  _id: string;
  name: string;
  email: string;
  role: {
    _id: string;
    name: string;
    description: string;
  };
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
}

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
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockCount: number;
  tags: string[];
  specifications: Record<string, string>;
  isActive: boolean;
  etsyExported?: boolean;
  etsyExportedAt?: string | null;
  policyReview?: {
    lastRunAt?: string | null;
    score?: number;
    complianceRate?: number;
    summary?: PolicyReviewResult['summary'];
    aiReview?: PolicyReviewResult['aiReview'];
  };
  createdAt: string;
  updatedAt: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  userId: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  items: Array<{
    productId: string;
    product: {
      _id: string;
      name: string;
      image: string;
      price: number;
    };
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  billingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface PolicyReviewResult {
  score: number;
  complianceRate: number;
  summary: {
    totalViolations: number;
    criticalIssues: number;
    warnings: number;
    recommendations: number;
    isCompliant: boolean;
  };
  aiReview?: {
    status?: 'complete' | 'skipped' | 'error';
    summary?: string;
    riskLevel?: string;
    score?: number;
    issues?: Array<{
      policy?: string;
      severity?: string;
      description?: string;
      fix?: string;
      handbookReference?: string;
    }>;
  };
  lastRunAt?: string | null;
}

interface ProductImprovementBlock {
  suggestion?: string;
  reasoning?: string;
  checklist?: string[];
}

interface ProductImprovementResult {
  summary?: string;
  notes?: string[];
  title?: ProductImprovementBlock;
  description?: ProductImprovementBlock;
  tags?: {
    suggestion?: string[];
    reasoning?: string;
  };
}

interface ProductImprovementState {
  loading?: boolean;
  applying?: boolean;
  error?: string;
  data?: ProductImprovementResult;
  selection?: {
    title?: boolean;
    description?: boolean;
    tags?: boolean;
  };
}

type PolicyReviewFilter = 'all' | 'risk' | 'compliant' | 'pending';

const buildPolicyReviewResultFromProduct = (
  policyReview?: Product['policyReview']
): PolicyReviewResult | undefined => {
  if (!policyReview?.summary && !policyReview?.lastRunAt) return undefined;
  const summary = (policyReview?.summary ?? {}) as Partial<PolicyReviewResult['summary']>;
  return {
    score: policyReview?.score ?? 0,
    complianceRate: policyReview?.complianceRate ?? 0,
    summary: {
      totalViolations: summary.totalViolations ?? 0,
      criticalIssues: summary.criticalIssues ?? 0,
      warnings: summary.warnings ?? 0,
      recommendations: summary.recommendations ?? 0,
      isCompliant: !!summary.isCompliant,
    },
    aiReview: policyReview?.aiReview,
    lastRunAt: policyReview?.lastRunAt ?? null,
  };
};

export default function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const isSuperAdmin = user?.role?.name?.toUpperCase?.() === 'SUPER_ADMIN';
  const initialTabParam = (typeof window !== 'undefined') ? (new URLSearchParams(window.location.search).get('tab') || '') : '';
  const initialTab = (allowedTabs as readonly string[]).includes(initialTabParam) ? (initialTabParam as any) : 'overview';
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'products' | 'policy-review' | 'orders' | 'overview' | 'marketing' | 'performance' | 'analytics' | 'etsy' | 'seo' | 'seo-raw' | 'analytics-seo' | 'blogs' | 'keyword-planner' | 'sourcing' | 'email-tracking' | 'support'>(initialTab);
  const [openNestedMenu, setOpenNestedMenu] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [campaignSubject, setCampaignSubject] = useState('');
  const [campaignHtml, setCampaignHtml] = useState('<p>Hello from ShopEase!</p>');
  const [campaignText, setCampaignText] = useState('Hello from ShopEase!');
  const [segmentPurchased, setSegmentPurchased] = useState(false);
  const [segmentMinOrders, setSegmentMinOrders] = useState<number | ''>('');
  const [segmentDaysSinceLogin, setSegmentDaysSinceLogin] = useState<number | ''>('');
  const [segmentCategory, setSegmentCategory] = useState('');
  const [sendingCampaign, setSendingCampaign] = useState(false);

  // SEO Research (SerpAPI) state
  const [keywordQuery, setKeywordQuery] = useState('');
  const [seoSelectedCategory, setSeoSelectedCategory] = useState('');
  const [keywords, setKeywords] = useState<any[]>([]);
  const [productsSeo, setProductsSeo] = useState<any[]>([]);
  const [seoLoading, setSeoLoading] = useState<{ [key: string]: boolean }>({});
  const seoLoadedOnceRef = useRef(false);
  const [seoAudit, setSeoAudit] = useState<any>(null);
  const [seoHistory, setSeoHistory] = useState<any[]>([]);

  // Product modal state
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const productsFetchedRef = useRef(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [analysisSelectedIds, setAnalysisSelectedIds] = useState<string[]>([]);
  const [analysisSelectedMeta, setAnalysisSelectedMeta] = useState<Record<string, { name: string; price?: number }>>({});
  const [etsyExportLoading, setEtsyExportLoading] = useState<Record<string, boolean>>({});
  const [etsyProductSearch, setEtsyProductSearch] = useState('');

  const ETSY_SYNC_ACTION_OPTIONS: SelectOption[] = [
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'delete', label: 'Delete' },
  ];

  const ETSY_EXPORT_CATEGORY_OPTIONS: SelectOption[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'Men', label: 'Men' },
    { value: 'Women', label: 'Women' },
    { value: 'Office & Travel', label: 'Office & Travel' },
    { value: 'Accessories', label: 'Accessories' },
    { value: 'Gifting', label: 'Gifting' },
  ];

  const ETSY_EXPORT_LIMIT_OPTIONS: SelectOption[] = [
    { value: '10', label: '10' },
    { value: '25', label: '25' },
    { value: '50', label: '50' },
    { value: '100', label: '100' },
    { value: '250', label: '250' },
    { value: '500', label: '500' },
    { value: 'custom', label: 'Custom' },
  ];

  const [etsySyncProductId, setEtsySyncProductId] = useState('');
  const [etsySyncProductOpen, setEtsySyncProductOpen] = useState(false);
  const [etsySyncAction, setEtsySyncAction] = useState<'create' | 'update' | 'delete'>('create');
  const [etsySyncActionOpen, setEtsySyncActionOpen] = useState(false);
  const [etsyExportCategory, setEtsyExportCategory] = useState('all');
  const [etsyExportCategoryOpen, setEtsyExportCategoryOpen] = useState(false);
  const [etsyExportLimit, setEtsyExportLimit] = useState('50');
  const [etsyExportLimitOpen, setEtsyExportLimitOpen] = useState(false);
  const [etsyExportCustomLimit, setEtsyExportCustomLimit] = useState('');
  const [seoHistoryLoading, setSeoHistoryLoading] = useState(false);
  const [seoHistoryExpanded, setSeoHistoryExpanded] = useState<Record<string, { kw: number; pr: number }>>({});
  const [seoRawSnapshot, setSeoRawSnapshot] = useState<any>(null);
  const [policyReviewSearch, setPolicyReviewSearch] = useState('');
  const [policyReviewFilter, setPolicyReviewFilter] = useState<PolicyReviewFilter>('all');
  const [policyReviewStatus, setPolicyReviewStatus] = useState<Record<string, { loading: boolean; error?: string; result?: PolicyReviewResult }>>({});
  const [policyImprovements, setPolicyImprovements] = useState<Record<string, ProductImprovementState>>({});
  const [rawSearchItems, setRawSearchItems] = useState<any[]>([]);

  const hydratePolicyReviewsFromProducts = (productList: Product[]) => {
    if (!Array.isArray(productList) || productList.length === 0) {
      return;
    }
    setPolicyReviewStatus(prevStatus => {
      let changed = false;
      const nextStatus = { ...prevStatus };
      productList.forEach(product => {
        const persistedResult = buildPolicyReviewResultFromProduct(product.policyReview);
        if (!persistedResult) return;
        const previousEntry = prevStatus[product._id];
        if (!previousEntry || previousEntry.result?.lastRunAt !== persistedResult.lastRunAt) {
          nextStatus[product._id] = {
            loading: false,
            error: undefined,
            result: persistedResult,
          };
          changed = true;
        }
      });
      return changed ? nextStatus : prevStatus;
    });
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    return date.toLocaleString();
  };

  // Google & Google Shopping Analytics state
  const [analyticsSearchQuery, setAnalyticsSearchQuery] = useState('');
  const [analyticsResults, setAnalyticsResults] = useState<any[]>([]);
  const [analyticsSeoLoading, setAnalyticsSeoLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Dynamic insights for Decision Helper
  const seoInsights = useMemo(() => {
    const k = keywords || [];
    const p = productsSeo || [];

    const vols = k.map((x: any) => Number(x.searchVolume) || 0).filter((n: number) => n > 0);
    const diffs = k.map((x: any) => Number(x.difficulty) || 0).filter((n: number) => n > 0);
    const compHighRatio = k.length ? k.filter((x: any) => x.competition === 'high').length / k.length : 0;
    const avgVolume = vols.length ? Math.round(vols.reduce((a: number, b: number) => a + b, 0) / vols.length) : 0;
    const avgDifficulty = diffs.length ? Math.round(diffs.reduce((a: number, b: number) => a + b, 0) / diffs.length) : 0;

    const prices = p.map((x: any) => Number(x.price)).filter((n: number) => !Number.isNaN(n) && n > 0);
    const ratings = p.map((x: any) => Number(x.rating)).filter((n: number) => !Number.isNaN(n) && n > 0);
    const reviews = p.map((x: any) => Number(x.reviews)).filter((n: number) => !Number.isNaN(n) && n >= 0);
    const discountCount = p.filter((x: any) => Number(x.originalPrice) && Number(x.price) && Number(x.originalPrice) > Number(x.price)).length;
    const avgPrice = prices.length ? +(prices.reduce((a: number, b: number) => a + b, 0) / prices.length).toFixed(2) : undefined;
    const avgRating = ratings.length ? +(ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(2) : undefined;
    const avgReviews = reviews.length ? Math.round(reviews.reduce((a: number, b: number) => a + b, 0) / reviews.length) : undefined;

    const signals: string[] = [];
    const cautions: string[] = [];

    if (avgVolume && avgVolume > 10000) signals.push(`Healthy search volume (~${avgVolume.toLocaleString()})`);
    if (avgDifficulty && avgDifficulty < 40) signals.push(`Manageable keyword difficulty (~${avgDifficulty})`);
    if (avgPrice && avgPrice >= 120 && avgPrice <= 300) signals.push(`Market price aligns to $120–$300 band (avg ~$${avgPrice})`);
    if (avgRating && avgRating >= 4.5) signals.push(`Strong average rating (★ ${avgRating})`);
    if (avgReviews && avgReviews >= 50) signals.push(`Meaningful social proof (avg ${avgReviews} reviews)`);
    if (discountCount > 0) signals.push(`Discounted competitors detected (${discountCount} with strikethrough price)`);

    if (!avgVolume || avgVolume < 3000) cautions.push('Low average search volume');
    if (avgDifficulty && avgDifficulty > 70) cautions.push(`High keyword difficulty (~${avgDifficulty})`);
    if (compHighRatio > 0.5) cautions.push(`High-competition share (${Math.round(compHighRatio * 100)}%)`);
    if (!prices.length) cautions.push('Few/no product prices found');
    if (!ratings.length) cautions.push('Few/no ratings present');

    // Simple score (0-100)
    let score = 50;
    score += Math.min(20, Math.max(-20, Math.round((avgVolume - 5000) / 1000)));
    score += avgDifficulty ? Math.round((40 - avgDifficulty) / 2) : 0;
    score += avgRating ? Math.round((avgRating - 4) * 8) : 0;
    score += avgReviews ? Math.min(10, Math.round(avgReviews / 20)) : 0;
    score = Math.max(0, Math.min(100, score));

    const action = score >= 70
      ? 'Proceed: create 2–3 listings targeting long-tail variations; emphasize quality and value.'
      : score >= 50
        ? 'Cautious test: publish 1–2 listings; differentiate on materials, fit, or personalization.'
        : 'Hold: gather more ideas, broaden the seed terms, or target seasonal angles.';

    return {
      query: keywordQuery,
      score,
      metrics: { avgVolume, avgDifficulty, avgPrice, avgRating, avgReviews, products: p.length, keywords: k.length },
      signals,
      cautions,
      action
    };
  }, [keywordQuery, keywords, productsSeo]);

  // SEO Research functions
  const searchKeywords = async () => {
    if (!keywordQuery.trim()) return;

    setSeoLoading(prev => ({ ...prev, keywords: true }));
    try {
      const response = await fetch(`/api/seo/keywords?q=${encodeURIComponent(keywordQuery)}&limit=20`);
      const data = await response.json();
      if (data.success) {
        setKeywords(data.keywords);
        toast.success(`Found ${data.keywords.length} keywords`);
      } else {
        toast.error('Failed to search keywords');
      }
    } catch (error) {
      toast.error('Error searching keywords');
    } finally {
      setSeoLoading(prev => ({ ...prev, keywords: false }));
    }
  };

  const searchProducts = async () => {
    if (!keywordQuery.trim()) return;
    setSeoLoading(prev => ({ ...prev, products: true }));
    try {
      const res = await fetch(`/api/seo/products?q=${encodeURIComponent(keywordQuery)}&limit=20`);
      const data = await res.json();
      if (data.success) {
        setProductsSeo(data.products);
        if (data.rawResponse) setSeoRawSnapshot(data.rawResponse);
        toast.success(`Loaded ${data.products.length} products`);
      } else {
        toast.error('Failed to load products');
      }
    } catch (e) {
      toast.error('Error loading products');
    } finally {
      setSeoLoading(prev => ({ ...prev, products: false }));
    }
  };

  const saveSeoData = async () => {
    try {
      const res = await fetch('/api/seo/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: keywordQuery, keywords, products: productsSeo })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Saved SEO data to DB');
      } else {
        toast.error('Failed to save SEO data');
      }
    } catch (e) {
      toast.error('Error saving SEO data');
    }
  };

  const fetchSeoHistory = async () => {
    setSeoHistoryLoading(true);
    try {
      const res = await fetch('/api/seo/history?limit=20&kw=5&pr=3');
      const data = await res.json();
      if (data.success) {
        setSeoHistory(data.history || []);
        toast.success(`Loaded ${data.history?.length || 0} past searches`);
      } else {
        toast.error('Failed to fetch search history');
        setSeoHistory([]);
      }
    } catch (e) {
      toast.error('Error fetching search history');
      setSeoHistory([]);
    } finally {
      setSeoHistoryLoading(false);
    }
  };

  const loadHistoryMore = async (query: string, type: 'keywords' | 'products', step: number) => {
    const key = `${query}`;
    const current = seoHistoryExpanded[key] || { kw: 5, pr: 3 };
    const nextKw = type === 'keywords' ? current.kw + step : current.kw;
    const nextPr = type === 'products' ? current.pr + step : current.pr;
    try {
      const res = await fetch(`/api/seo/history/details?query=${encodeURIComponent(query)}&kwLimit=${nextKw}&prLimit=${nextPr}`);
      const data = await res.json();
      if (data.success) {
        setSeoHistory(h => h.map(item => item.query === query ? { ...item, keywords: data.keywords.items, products: data.products.items } : item));
        setSeoHistoryExpanded(prev => ({ ...prev, [key]: { kw: nextKw, pr: nextPr } }));
      } else {
        toast.error('Failed to load more');
      }
    } catch (e) {
      toast.error('Error loading more');
    }
  };

  // Google & Google Shopping Analytics functions
  const searchAnalytics = async () => {
    if (!analyticsSearchQuery.trim()) return;

    setAnalyticsSeoLoading(true);
    try {
      const response = await fetch(`/api/seo/raw-search?q=${encodeURIComponent(analyticsSearchQuery)}&limit=10`);
      const data = await response.json();
      if (data.success) {
        setAnalyticsResults(data.items);
        toast.success(`Found ${data.total} analytics results`);
      } else {
        toast.error('Search failed');
      }
    } catch (error) {
      console.error('Analytics search error:', error);
      toast.error('Search failed');
    } finally {
      setAnalyticsSeoLoading(false);
    }
  };

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Auto-load once when SEO tab becomes active
  useEffect(() => {
    if ((activeTab as any) === 'seo' && !seoLoadedOnceRef.current) {
      seoLoadedOnceRef.current = true;
      // no auto fetch to conserve SerpAPI quota; just keep ready
    }
  }, [activeTab]);

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productPage, setProductPage] = useState(1);
  const [productPerPage, setProductPerPage] = useState(20);
  const [productEmailStats, setProductEmailStats] = useState<Record<string, {
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    lastSentAt: string;
  }>>({});

  const etsyProductOptions = useMemo<SelectOption[]>(() => {
    if (!Array.isArray(products) || products.length === 0) return [];
    return products.map((product) => {
      const priceLabel =
        typeof product.price === 'number' ? ` - $${product.price.toFixed(2)}` : '';
      return {
        value: product._id,
        label: `${product.name || 'Untitled Product'}${priceLabel}`,
      };
    });
  }, [products]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Support Tickets state
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportSearchTerm, setSupportSearchTerm] = useState('');
  const [supportStatusFilter, setSupportStatusFilter] = useState('all');
  const [supportCategoryFilter, setSupportCategoryFilter] = useState('all');
  const [supportPriorityFilter, setSupportPriorityFilter] = useState('all');
  const [supportAssignedFilter, setSupportAssignedFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [viewingTicket, setViewingTicket] = useState<any | null>(null);
  const [ticketMessage, setTicketMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [updatingTicket, setUpdatingTicket] = useState(false);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  
  // Chat management state
  const [chatConversations, setChatConversations] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatStatusFilter, setChatStatusFilter] = useState('all');
  const [chatAssignedFilter, setChatAssignedFilter] = useState('all');
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [viewingConversation, setViewingConversation] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [sendingChatMessage, setSendingChatMessage] = useState(false);
  
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [organizedFilter, setOrganizedFilter] = useState<'all' | 'organized' | 'unorganized'>('all');
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [selectedOrderStatus, setSelectedOrderStatus] = useState('');
  const [selectedProductStatus, setSelectedProductStatus] = useState('');
  const [selectedStockCount, setSelectedStockCount] = useState<string>('');
  const [selectedIsActive, setSelectedIsActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [productSortBy, setProductSortBy] = useState<string>('createdAt');
  const [productSortOrder, setProductSortOrder] = useState<'asc' | 'desc'>('desc');
  const [openSelect, setOpenSelect] = useState<'category' | 'brand' | 'status' | 'role' | 'orderStatus' | 'organized' | 'productStatus' | 'stockCount' | 'isActive' | 'ticketStatus' | 'ticketPriority' | 'ticketAssigned' | 'chatStatus' | 'chatAssigned' | 'supportStatus' | 'supportCategory' | 'supportPriority' | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [showEmailMarketing, setShowEmailMarketing] = useState(false);
  const [emailMarketingProduct, setEmailMarketingProduct] = useState<Product | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [deletingRole, setDeletingRole] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null);

  // New: metrics state
  const [metrics, setMetrics] = useState<{
    kpis: { totalRevenue: number; totalOrders: number; avgOrderValue: number };
    revenueByDay: Array<{ _id: string; revenue: number; orders: number }>;
    topProducts: Array<{ productId: string; name?: string; image?: string; revenue: number; units: number }>;
  } | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsDays, setMetricsDays] = useState<7 | 30 | 90>(30);

  // Helper function to check if a product is organized (has Cloudinary images)
  const isProductOrganized = (product: Product): boolean => {
    const allImages = [product.image, ...(product.images || [])].filter(Boolean);
    if (allImages.length === 0) return false;
    return allImages.some((url: string) =>
      url && typeof url === 'string' && (url.includes('cloudinary.com') || url.includes('res.cloudinary.com'))
    );
  };

  // Reusable collapsible JSON tree viewer
  const JsonTree: React.FC<{ data: any; defaultOpen?: boolean; label?: string }> = ({ data, defaultOpen = false }) => {
    if (data === null || typeof data !== 'object') {
      return (
        <span className="font-mono text-black">{typeof data === 'string' ? JSON.stringify(data) : String(data)}</span>
      );
    }
    if (Array.isArray(data)) {
      return (
        <details className="ml-3" open={defaultOpen}>
          <summary className="cursor-pointer font-mono text-sm text-green-800">[Array] ({data.length})</summary>
          <div className="mt-2 space-y-1">
            {data.map((item, idx) => (
              <div key={idx} className="pl-3 border-l border-green-100">
                <div className="font-mono text-[11px] text-green-700">[{idx}]</div>
                <JsonTree data={item} />
              </div>
            ))}
          </div>
        </details>
      );
    }
    const entries = Object.entries(data as Record<string, any>);
    return (
      <details className="ml-3" open={defaultOpen}>
        <summary className="cursor-pointer font-mono text-sm text-green-800">{`{Object} (${entries.length})`}</summary>
        <div className="mt-2 space-y-1">
          {entries.map(([key, value]) => (
            <div key={key} className="pl-3 border-l border-green-100">
              <div className="font-mono text-[11px] text-green-700">{key}</div>
              <JsonTree data={value} />
            </div>
          ))}
        </div>
      </details>
    );
  };

  const fetchMetrics = async (days = metricsDays) => {
    try {
      setMetricsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/metrics?days=${days}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch metrics');
      setMetrics(data);
    } catch (e) {
      console.error('Metrics fetch error', e);
      toast.error(e instanceof Error ? e.message : 'Failed to fetch metrics');
    } finally {
      setMetricsLoading(false);
    }
  };

  // Normalize and memo revenue points for chart
  const chartPoints = useMemo(() => {
    const series = metrics?.revenueByDay || [];
    if (!series.length) return [] as { x: number; y: number; label: string }[];
    const maxRevenue = Math.max(...series.map(d => d.revenue), 1);
    const width = 600;
    const height = 140;
    const padding = 20;
    const stepX = series.length > 1 ? (width - padding * 2) / (series.length - 1) : 0;
    return series.map((d, i) => ({
      x: padding + i * stepX,
      y: height - padding - (d.revenue / maxRevenue) * (height - padding * 2),
      label: d._id,
    }));
  }, [metrics]);

  const [analytics, setAnalytics] = useState<{ funnel: any[]; search: any[]; cohorts: Record<string, { users: number; revenue: number }>; ltv: number } | null>(null);
  const [analyticsDays, setAnalyticsDays] = useState<7 | 30 | 90>(30);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const lastAnalyticsKeyRef = useRef<string | null>(null);

  const fetchAnalytics = async (days = analyticsDays) => {
    try {
      setAnalyticsLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/analytics?days=${days}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch analytics');
      setAnalytics(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to fetch analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Fetch analytics only when Analytics tab becomes active OR range changes.
  // It will not refetch on unrelated re-renders.
  useEffect(() => {
    if ((activeTab as any) !== 'analytics') return;
    const key = `days:${analyticsDays}`;
    if (lastAnalyticsKeyRef.current === key) return;
    lastAnalyticsKeyRef.current = key;
    fetchAnalytics(analyticsDays);
  }, [activeTab, analyticsDays]);

  function AnalyticsFunnel() {
    const map: Record<string, number> = {};
    (analytics?.funnel || []).forEach((f: any) => { map[f._id] = f.count; });
    const steps = [
      { key: 'product_view', label: 'Product Views' },
      { key: 'add_to_cart', label: 'Add to Cart' },
      { key: 'checkout_start', label: 'Checkout Start' },
      { key: 'purchase', label: 'Purchases' },
    ];
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-600">Range:</span>
          <div className="inline-flex rounded-md border bg-white shadow-sm overflow-hidden">
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => { lastAnalyticsKeyRef.current = null; setAnalyticsDays(d as 7 | 30 | 90); }} className={`px-3 py-1.5 text-sm ${analyticsDays === d ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}>{d}d</button>
            ))}
          </div>
        </div>
        {analyticsLoading ? <p className="text-gray-500">Loading...</p> : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 transition-opacity duration-200" style={{ opacity: analyticsLoading ? 0.6 : 1 }}>
            {steps.map(s => (
              <div key={s.key} className="p-4 border border-blue-100 bg-blue-50/20 rounded-lg">
                <div className="text-sm text-blue-900 font-medium">{s.label}</div>
                <div className="text-2xl font-bold text-blue-700">{map[s.key] || 0}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function SearchAnalytics() {
    return (
      <div className="p-6">
        {analyticsLoading ? <p className="text-gray-500">Loading...</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="font-medium text-gray-900 mb-2">Top Searches</div>
              <div className="space-y-2">
                {(analytics?.search || []).map((s: any) => (
                  <div key={s._id} className="flex items-center justify-between text-sm">
                    <span className="truncate max-w-[70%]">{s._id}</span>
                    <span className="font-mono">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="font-medium text-gray-900 mb-2">No-results Queries</div>
              <div className="space-y-2">
                {(analytics?.search || []).filter((s: any) => s.noResults > 0).map((s: any) => (
                  <div key={s._id} className="flex items-center justify-between text-sm">
                    <span className="truncate max-w-[70%]">{s._id}</span>
                    <span className="font-mono">{s.noResults}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function CohortAnalytics() {
    const entries = Object.entries(analytics?.cohorts || {}).sort(([a], [b]) => a.localeCompare(b));
    return (
      <div className="p-6">
        <div className="mb-4 text-gray-700">Estimated average LTV: <span className="font-semibold">${(analytics?.ltv || 0).toFixed(2)}</span></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {entries.map(([month, val]: any) => (
            <div key={month} className="p-4 border border-blue-100 bg-blue-50/20 rounded-lg">
              <div className="text-sm text-blue-900 font-medium">{month}</div>
              <div className="text-sm text-gray-700">Users: <span className="font-medium">{val.users}</span></div>
              <div className="text-sm text-gray-700">Revenue: <span className="font-medium">${val.revenue.toFixed(2)}</span></div>
            </div>
          ))}
        </div>

        {/* Product Details Modal */}
        {showProductModal && selectedProductForModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Product Details</h2>
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Product Image */}
                  <div className="flex justify-center">
                    <img
                      src={selectedProductForModal.image || '/placeholder-product.svg'}
                      alt={selectedProductForModal.name}
                      className="w-48 h-48 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-product.svg';
                      }}
                    />
                  </div>

                  {/* Product Info */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{selectedProductForModal.name}</h3>
                      <p className="text-lg text-gray-600 mt-1">{selectedProductForModal.description}</p>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className="text-3xl font-bold text-green-600">${selectedProductForModal.price}</span>
                      {selectedProductForModal.originalPrice && selectedProductForModal.originalPrice > selectedProductForModal.price && (
                        <span className="text-xl text-gray-500 line-through">${selectedProductForModal.originalPrice}</span>
                      )}
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                        {selectedProductForModal.category}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {selectedProductForModal.brand}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`h-5 w-5 ${i < Math.floor(selectedProductForModal.rating || 0)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                              }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="text-sm text-gray-500 ml-2">
                          {selectedProductForModal.rating || 0} ({selectedProductForModal.reviewCount || 0} reviews)
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Stock Status</h4>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${selectedProductForModal.inStock
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {selectedProductForModal.inStock ? `In Stock (${selectedProductForModal.stockCount || 0})` : 'Out of Stock'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${selectedProductForModal.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                          }`}>
                          {selectedProductForModal.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    {isSuperAdmin && (
                      <div className="flex items-center justify-between p-4 border border-purple-100 rounded-lg bg-purple-50/40">
                        <div>
                          <h4 className="font-medium text-purple-900 mb-1">Etsy Export</h4>
                          <p className="text-sm text-purple-700">
                            {selectedProductForModal.etsyExported
                              ? `Exported${selectedProductForModal.etsyExportedAt ? ` on ${new Date(selectedProductForModal.etsyExportedAt).toLocaleDateString()}` : ''}`
                              : 'Not exported yet'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleToggleEtsyExport(selectedProductForModal._id, !selectedProductForModal.etsyExported)}
                          disabled={!!etsyExportLoading[selectedProductForModal._id]}
                          className={`inline-flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium ${selectedProductForModal.etsyExported
                            ? 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-50'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                            } ${etsyExportLoading[selectedProductForModal._id] ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          {etsyExportLoading[selectedProductForModal._id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          <span>{selectedProductForModal.etsyExported ? 'Unmark' : 'Mark exported'}</span>
                        </button>
                      </div>
                    )}

                    {selectedProductForModal.tags && selectedProductForModal.tags.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedProductForModal.tags.map((tag, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedProductForModal.specifications && Object.keys(selectedProductForModal.specifications).length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Specifications</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {Object.entries(selectedProductForModal.specifications).map(([key, value]) => (
                            <div key={key} className="flex justify-between py-1 border-b border-gray-100">
                              <span className="font-medium text-gray-600">{key}:</span>
                              <span className="text-gray-900">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {isSuperAdmin && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Quick Copy for Etsy</h4>
                        {[
                          { label: 'Title', value: selectedProductTitle },
                          { label: 'Description', value: selectedProductDescription },
                          { label: 'Tags', value: selectedProductTagsText },
                          { label: 'Specifications', value: selectedProductSpecsText },
                        ].map(section => (
                          <div key={section.label} className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-3">
                            <div className="flex-1">
                              <p className="text-xs uppercase tracking-wide text-gray-500">{section.label}</p>
                              <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                                {section.value || '—'}
                              </p>
                            </div>
                            <button
                              onClick={() => copyProductSection(section.label, section.value)}
                              className="inline-flex items-center space-x-1 rounded-md border border-purple-200 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-50"
                            >
                              <Copy className="h-4 w-4" />
                              <span>Copy</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Created:</span> {new Date(selectedProductForModal.createdAt).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Updated:</span> {new Date(selectedProductForModal.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleProductSelection(selectedProductForModal._id);
                      toast.success(selectedProductIds.includes(selectedProductForModal._id) ? 'Product deselected' : 'Product selected');
                      setShowProductModal(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    {selectedProductIds.includes(selectedProductForModal._id) ? 'Deselect' : 'Select'} Product
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function EventTester() {
    const [type, setType] = useState<'product_view' | 'add_to_cart' | 'checkout_start' | 'purchase' | 'page_view'>('page_view');
    const [productId, setProductId] = useState('');
    const [orderId, setOrderId] = useState('');
    const [value, setValue] = useState('');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState('0');
    const [loading, setLoading] = useState(false);

    const sendEvent = async () => {
      try {
        setLoading(true);
        const payload: any = { type };
        if (productId) payload.productId = productId;
        if (orderId) payload.orderId = orderId;
        if (value) payload.value = Number(value);
        const res = await fetch('/api/analytics/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');
        toast.success('Event sent');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed');
      } finally {
        setLoading(false);
      }
    };

    const sendSearch = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/analytics/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, resultsCount: Number(results) }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');
        toast.success('Search recorded');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="text-sm font-semibold text-blue-900">Send Event</div>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="px-3 py-2 border border-blue-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <option value="page_view">page_view</option>
              <option value="product_view">product_view</option>
              <option value="add_to_cart">add_to_cart</option>
              <option value="checkout_start">checkout_start</option>
              <option value="purchase">purchase</option>
            </select>
            <input
              placeholder="value (optional)"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="px-3 py-2 border border-blue-200 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
            <input
              placeholder="productId"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="px-3 py-2 border border-blue-200 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
            <input
              placeholder="orderId"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="px-3 py-2 border border-blue-200 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          <button
            onClick={sendEvent}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 w-fit transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
        <div className="space-y-4">
          <div className="text-sm font-semibold text-blue-900">Record Search</div>
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="px-3 py-2 border border-blue-200 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
            <input
              placeholder="results count"
              value={results}
              onChange={(e) => setResults(e.target.value)}
              className="px-3 py-2 border border-blue-200 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          <button
            onClick={sendSearch}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 w-fit transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {loading ? 'Recording...' : 'Record'}
          </button>
        </div>
      </div>
    );
  }

  // Navigation helpers for Overview clickable cards
  const goToUsers = () => {
    setActiveTab('users');
    // Optionally clear filters relevant to users
    setSearchTerm('');
    setSelectedRole('');
    updateQuery({ tab: 'users', status: undefined, orderId: undefined, userId: undefined, productId: undefined });
  };

  const goToRoles = () => {
    setActiveTab('roles');
    updateQuery({ tab: 'roles', status: undefined, orderId: undefined, userId: undefined, productId: undefined });
  };

  const goToProducts = () => {
    setActiveTab('products');
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedBrand('');
    updateQuery({ tab: 'products', status: undefined, orderId: undefined, userId: undefined, productId: undefined });
  };

  const goToOrders = (status?: string) => {
    setActiveTab('orders');
    setSearchTerm('');
    setSelectedOrderStatus(status || '');
    updateQuery({ tab: 'orders', status: status || '', orderId: undefined, userId: undefined, productId: undefined });
  };

  // Update URL query params helper
  const updateQuery = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setOpenNestedMenu(null);
    setMobileSidebarOpen(false);
    if (tab === 'orders') {
      updateQuery({ tab: 'orders', status: undefined, orderId: undefined, userId: undefined, productId: undefined });
      return;
    }
    updateQuery({ tab });
  };

  const sidebarTabs: SidebarTab[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3, description: 'Snapshot & key KPIs' },
    { id: 'sourcing', label: 'Sourcing', icon: Download, description: 'Import and curate products' },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'roles', label: 'Roles & Permissions', icon: Shield },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'policy-review', label: 'Policy Review', icon: ShieldCheck },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'support', label: 'Support Tickets', icon: MessageSquare },
    { id: 'chat', label: 'Live Chat', icon: MessageCircle, description: 'Manage customer chat conversations' },
    {
      id: 'marketing',
      label: 'Growth & Insights',
      icon: Activity,
      description: 'Campaigns, analytics & SEO',
      children: [
        { id: 'marketing', label: 'Campaign Hub', icon: Mail },
        { id: 'performance', label: 'Performance', icon: BarChart3 },
        { id: 'analytics', label: 'Analytics', icon: Activity },
        { id: 'analytics-seo', label: 'Google & Shopping', icon: AlignLeft },
        { id: 'etsy', label: 'Etsy Integration', icon: ShoppingCart },
        { id: 'seo', label: 'SEO Research', icon: Search },
        { id: 'seo-raw', label: 'SEO Raw Data', icon: Type },
      ],
    },
    { id: 'email-tracking', label: 'Email Tracking', icon: Mail },
    { id: 'blogs', label: 'Blogs', icon: FileText },
    { id: 'keyword-planner', label: 'Keyword Planner', icon: Type },
  ];

  const isTabActive = (tab: SidebarTab) =>
    tab.id === activeTab || tab.children?.some(child => child.id === activeTab);

  const shouldShowChildren = (tab: SidebarTab) =>
    !!tab.children && (openNestedMenu === tab.id || tab.children.some(child => child.id === activeTab));

  // Find parent tab for nested/child tabs
  const getParentTab = (): SidebarTab | null => {
    for (const tab of sidebarTabs) {
      if (tab.children?.some(child => child.id === activeTab)) {
        return tab;
      }
    }
    return null;
  };

  const parentTab = getParentTab();
  const isNestedTab = !!parentTab;

  const handleParentKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, tab: SidebarTab) => {
    if (!tab.children) return;
    if (event.key === 'ArrowRight') {
      setOpenNestedMenu(tab.id);
    }
    if (event.key === 'ArrowLeft') {
      setOpenNestedMenu(null);
    }
  };

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!user?.permissions?.includes('system:settings')) {
      router.push('/');
      toast.error('Access denied. Admin privileges required.');
      return;
    }

  }, [isAuthenticated, user, router, activeTab]);

  const getAttributionCookies = () => {
    if (typeof document === 'undefined') return [] as Array<{ key: string; value: string }>;
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'aff'];
    const cookies = document.cookie.split(';').map(c => c.trim());
    const map: Record<string, string> = {};
    for (const c of cookies) {
      const [k, ...rest] = c.split('=');
      if (!k) continue;
      map[k] = decodeURIComponent(rest.join('='));
    }
    return keys
      .filter(k => map[k])
      .map(k => ({ key: k, value: map[k] }));
  };

  const handleSendCampaign = async () => {
    try {
      setSendingCampaign(true);
      const token = localStorage.getItem('token');
      const segment: any = {};
      if (segmentPurchased) segment.purchased = true;
      if (segmentMinOrders !== '') segment.minOrders = Number(segmentMinOrders);
      if (segmentDaysSinceLogin !== '') segment.daysSinceLastLoginGt = Number(segmentDaysSinceLogin);
      if (segmentCategory) segment.categoryInterest = segmentCategory;

      const res = await fetch('/api/email/campaign', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject: campaignSubject, html: campaignHtml, text: campaignText, segment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send campaign');
      toast.success(`Campaign sent to ${data.sent} of ${data.recipients}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send campaign');
    } finally {
      setSendingCampaign(false);
    }
  };

  // Deep-link: set tab/status from URL
  useEffect(() => {
    const tabParam = searchParams.get('tab') as 'users' | 'roles' | 'products' | 'policy-review' | 'orders' | 'overview' | 'marketing' | 'performance' | 'analytics' | 'etsy' | 'seo' | 'seo-raw' | null;
    if (tabParam) setActiveTab(tabParam);
    if (tabParam === 'orders') setSelectedOrderStatus(searchParams.get('status') || '');
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === 'undefined' || !mobileSidebarOpen) return undefined;
    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', keyHandler);
    return () => window.removeEventListener('keydown', keyHandler);
  }, [mobileSidebarOpen]);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [activeTab]);

  useEffect(() => {
    if (etsyExportLimit !== 'custom') {
      setEtsyExportCustomLimit('');
    }
  }, [etsyExportLimit]);

  // Open detail modals based on URL ids when data is present
  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId && activeTab === 'orders' && orders.length) {
      const found = orders.find(o => o._id === orderId);
      if (found) setViewingOrder(found);
    }
  }, [searchParams, activeTab, orders]);

  // Fetch brands only when products tab is active or when ProductForm might be needed
  useEffect(() => {
    if ((activeTab === 'products' || activeTab === 'policy-review') && isAuthenticated) {
      fetchBrands();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAuthenticated]);

  // Fetch support tickets when support tab is active
  useEffect(() => {
    if (activeTab === 'support' && isAuthenticated) {
      fetchSupportTickets();
      fetchAdminUsers();
    }
    if (activeTab === 'chat' && isAuthenticated) {
      fetchChatConversations();
      fetchAdminUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAuthenticated, supportStatusFilter, supportCategoryFilter, supportPriorityFilter, supportAssignedFilter, chatStatusFilter, chatAssignedFilter]);

  // Auto-refresh messages when viewing a conversation
  useEffect(() => {
    if (!viewingConversation) return;

    const interval = setInterval(() => {
      const refreshMessages = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/admin/chat/conversations/${viewingConversation.conversationId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            setChatMessages(data.messages || []);
            setViewingConversation(data.conversation);
            // Also refresh conversation list to update unread counts
            fetchChatConversations();
          }
        } catch (error) {
          console.error('Error refreshing messages:', error);
        }
      };
      refreshMessages();
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [viewingConversation]);


  useEffect(() => {
    const userId = searchParams.get('userId');
    if (userId && activeTab === 'users' && users.length) {
      const found = users.find(u => u._id === userId);
      if (found) setEditingUser(found);
    }
  }, [searchParams, activeTab, users]);

  useEffect(() => {
    const productId = searchParams.get('productId');
    if (productId && activeTab === 'products' && products.length) {
      const found = products.find(p => p._id === productId);
      if (found) setEditingProduct(found);
    }
  }, [searchParams, activeTab, products]);

  useEffect(() => {
    if (activeTab !== 'etsy') {
      productsFetchedRef.current = false;
    }
  }, [activeTab]);

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch roles
  const fetchRoles = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/admin/roles', { headers });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.error('Fetch roles failed', { status: response.status, body: text });
        toast.error(`Failed to fetch roles (${response.status})`);
        setRoles([]);
        return;
      }

      const data = await response.json().catch(() => ({}));
      setRoles(Array.isArray(data.roles) ? data.roles : []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to fetch roles');
      setRoles([]);
    }
  };

  // Fetch products - only fetch current page, not all pages
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalProductPages, setTotalProductPages] = useState(1);
  const fetchProducts = async (pageToFetch?: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const page = pageToFetch || productPage;
      const limit = productPerPage;

      // Build query params including all filters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      if (selectedBrand) {
        params.append('brand', selectedBrand);
      }
      if (selectedProductStatus) {
        params.append('status', selectedProductStatus);
      }
      if (organizedFilter && organizedFilter !== 'all') {
        params.append('organized', organizedFilter);
      }
      if (selectedStockCount) {
        params.append('stockCount', selectedStockCount);
      }
      if (selectedIsActive && selectedIsActive !== 'all') {
        params.append('isActive', selectedIsActive);
      }
      if (productSortBy) {
        params.append('sortBy', productSortBy);
      }
      if (productSortOrder) {
        params.append('sortOrder', productSortOrder);
      }

      const res = await fetch(`/api/admin/products?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.text().catch(() => '');
        throw new Error(`Failed to fetch products (page ${page}): ${res.status} ${err}`);
      }
      // Check if response has content before parsing JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Invalid response format (page ${page}): ${text.substring(0, 100)}`);
      }
      const json = await res.json().catch((err) => {
        throw new Error(`Failed to parse JSON response (page ${page}): ${err.message}`);
      });
      const items = Array.isArray(json.products) ? json.products : [];
      setProducts(items);
      hydratePolicyReviewsFromProducts(items);

      const totalFromResponse = Number(json.pagination?.total ?? json.total ?? items.length);
      const total = Number.isFinite(totalFromResponse) && totalFromResponse > 0
        ? totalFromResponse
        : items.length;
      const pagesFromResponse = Number(json.pagination?.totalPages ?? json.pagination?.pages ?? 0);
      const calculatedPages = pagesFromResponse > 0
        ? pagesFromResponse
        : Math.max(1, Math.ceil(total / Math.max(1, limit)));

      setTotalProducts(total);
      setTotalProductPages(calculatedPages);
      setProductPage(page);

      // Fetch product email stats
      fetchProductEmailStats(items.map(p => p._id));
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductEmailStats = async (productIds: string[]) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/products/email-stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.productStats) {
          const statsMap: Record<string, any> = {};
          data.productStats.forEach((stat: any) => {
            statsMap[stat.productId] = stat;
          });
          setProductEmailStats(statsMap);
        }
      }
    } catch (error) {
      console.error('Error fetching product email stats:', error);
      // Don't show error toast for this, it's not critical
    }
  };

  const handleProductSort = (column: string) => {
    if (productSortBy === column) {
      // Toggle sort order if same column
      setProductSortOrder(productSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setProductSortBy(column);
      setProductSortOrder('asc');
    }
    setProductPage(1);
  };

  const getSortIcon = (column: string) => {
    if (productSortBy !== column) {
      return <ArrowUpDown className="h-3 w-3 ml-1 text-gray-400" />;
    }
    return productSortOrder === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-1 text-blue-600" />
      : <ArrowDown className="h-3 w-3 ml-1 text-blue-600" />;
  };

  const handleRunPolicyReview = async (product: Product) => {
    if (!product?._id) return;
    const existingStatus = policyReviewStatus[product._id];
    const existingLastRunAt =
      existingStatus?.result?.lastRunAt || product.policyReview?.lastRunAt;
    if (existingStatus?.result || existingLastRunAt) {
      const persistedResult =
        existingStatus?.result || buildPolicyReviewResultFromProduct(product.policyReview);
      if (persistedResult) {
        setPolicyReviewStatus(prev => ({
          ...prev,
          [product._id]: {
            loading: false,
            error: undefined,
            result: persistedResult,
          },
        }));
      }
      toast('Gemini review already completed for this product.');
      return;
    }
    setPolicyReviewStatus(prev => ({
      ...prev,
      [product._id]: {
        ...(prev[product._id] || {}),
        loading: true,
        error: undefined,
      }
    }));

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setPolicyReviewStatus(prev => ({
          ...prev,
          [product._id]: {
            ...(prev[product._id] || {}),
            loading: false,
            error: 'Authentication required',
          },
        }));
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`/api/products/${product._id}/check-etsy-policies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          const persistedResult = buildPolicyReviewResultFromProduct(data.policyReview);
          setPolicyReviewStatus(prev => ({
            ...prev,
            [product._id]: {
              ...(prev[product._id] || {}),
              loading: false,
              error: undefined,
              ...(persistedResult ? { result: persistedResult } : {}),
            },
          }));
          if (data.policyReview) {
            setProducts(prev =>
              prev.map(p =>
                p._id === product._id
                  ? {
                    ...p,
                    policyReview: {
                      lastRunAt: data.policyReview.lastRunAt,
                      score: data.policyReview.score,
                      complianceRate: data.policyReview.complianceRate,
                      summary: data.policyReview.summary,
                      aiReview: data.policyReview.aiReview,
                    },
                  }
                  : p
              )
            );
          }
          toast('Gemini review already completed for this product.');
          return;
        }
        throw new Error(data.error || 'Failed to review product');
      }

      const persistedPolicyReview =
        data.policyReview || {
          lastRunAt: new Date().toISOString(),
          score: data.score,
          complianceRate: data.complianceRate,
          summary: data.summary,
          aiReview: data.aiReview,
        };
      const normalizedResult =
        buildPolicyReviewResultFromProduct(persistedPolicyReview) || {
          score: persistedPolicyReview.score ?? 0,
          complianceRate: persistedPolicyReview.complianceRate ?? 0,
          summary: {
            totalViolations: persistedPolicyReview.summary?.totalViolations ?? 0,
            criticalIssues: persistedPolicyReview.summary?.criticalIssues ?? 0,
            warnings: persistedPolicyReview.summary?.warnings ?? 0,
            recommendations: persistedPolicyReview.summary?.recommendations ?? 0,
            isCompliant: !!persistedPolicyReview.summary?.isCompliant,
          },
          aiReview: persistedPolicyReview.aiReview,
          lastRunAt: persistedPolicyReview.lastRunAt ?? null,
        };

      setPolicyReviewStatus(prev => ({
        ...prev,
        [product._id]: {
          loading: false,
          result: normalizedResult,
        },
      }));
      setProducts(prev =>
        prev.map(p =>
          p._id === product._id
            ? {
              ...p,
              policyReview: {
                lastRunAt: persistedPolicyReview.lastRunAt,
                score: persistedPolicyReview.score,
                complianceRate: persistedPolicyReview.complianceRate,
                summary: persistedPolicyReview.summary,
                aiReview: persistedPolicyReview.aiReview,
              },
            }
            : p
        )
      );

      toast.success(`Gemini review ready for “${product.name}”`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to review product';
      setPolicyReviewStatus(prev => ({
        ...prev,
        [product._id]: {
          loading: false,
          error: message,
        },
      }));
      toast.error(message);
    }
  };

  const handleImproveProduct = async (product: Product, review?: PolicyReviewResult) => {
    if (!product?._id) return;
    console.log('[Frontend] handleImproveProduct called for product:', product._id);
    setPolicyImprovements(prev => {
      const previous = prev[product._id] || { loading: false };
      return {
        ...prev,
        [product._id]: {
          ...previous,
          loading: true,
          error: undefined,
        },
      };
    });

    try {
      console.log('[Frontend] Calling /api/products/' + product._id + '/improve');
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setPolicyImprovements(prev => {
          const previous = prev[product._id] || { loading: false };
          return {
            ...prev,
            [product._id]: {
              ...previous,
              loading: false,
              error: 'Authentication required',
            },
          };
        });
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`/api/products/${product._id}/improve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reviewSummary: review }),
      });

      console.log('[Frontend] Response status:', response.status);
      console.log('[Frontend] Response ok:', response.ok);

      let data;
      try {
        const text = await response.text();
        console.log('[Frontend] Response text length:', text.length);
        console.log('[Frontend] Response text preview:', text.substring(0, 500));
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('[Frontend] Failed to parse response:', parseError);
        throw new Error('Failed to parse server response');
      }

      console.log('[Frontend] Parsed data:', data);

      if (!response.ok) {
        console.error('[Frontend] Response not ok. Error:', data.error);
        throw new Error(data.error || 'Failed to generate improvements');
      }

      const improvements: ProductImprovementResult | undefined = data?.improvements;
      console.log('[Frontend] Improvements received:', !!improvements);

      const selection = {
        title: !!improvements?.title?.suggestion,
        description: !!improvements?.description?.suggestion,
        tags: !!(improvements?.tags?.suggestion && improvements.tags.suggestion.length),
      };

      setPolicyImprovements(prev => {
        const previous = prev[product._id] || { loading: false };
        return {
          ...prev,
          [product._id]: {
            ...previous,
            loading: false,
            data: improvements,
            selection,
          },
        };
      });

      toast.success(`Improvement plan ready for “${product.name}”`);
    } catch (error) {
      console.error('[Frontend] Error in handleImproveProduct:', error);
      console.error('[Frontend] Error stack:', error instanceof Error ? error.stack : 'No stack');
      const message = error instanceof Error ? error.message : 'Failed to improve product';
      setPolicyImprovements(prev => {
        const previous = prev[product._id] || { loading: false };
        return {
          ...prev,
          [product._id]: {
            ...previous,
            loading: false,
            error: message,
          },
        };
      });
      toast.error(message);
    }
  };

  const handleToggleImprovementSelection = (productId: string, field: 'title' | 'description' | 'tags', checked: boolean) => {
    setPolicyImprovements(prev => {
      const current = prev[productId];
      if (!current) return prev;
      const currentSelection = current.selection ?? {
        title: true,
        description: true,
        tags: true,
      };
      return {
        ...prev,
        [productId]: {
          ...current,
          selection: {
            ...currentSelection,
            [field]: checked,
          },
        },
      };
    });
  };

  const handleApplyImprovements = async (product: Product) => {
    if (!product?._id) return;
    const entry = policyImprovements[product._id];
    if (!entry?.data) {
      toast.error('Generate improvements first');
      return;
    }
    const selection = entry.selection ?? {
      title: false,
      description: false,
      tags: false,
    };
    const updates: Record<string, any> = {};

    if (selection.title && entry.data.title?.suggestion) {
      updates.name = entry.data.title.suggestion.trim();
    }
    if (selection.description && entry.data.description?.suggestion) {
      updates.description = entry.data.description.suggestion.trim();
    }
    if (selection.tags && entry.data.tags?.suggestion?.length) {
      updates.tags = entry.data.tags.suggestion;
    }

    if (Object.keys(updates).length === 0) {
      toast.error('Select at least one improvement to apply');
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      toast.error('Authentication required');
      return;
    }

    setPolicyImprovements(prev => {
      const previous = prev[product._id] || { loading: false };
      return {
        ...prev,
        [product._id]: {
          ...previous,
          applying: true,
          error: undefined,
        },
      };
    });

    try {
      const response = await fetch(`/api/admin/products/${product._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to apply improvements');
      }
      setPolicyImprovements(prev => {
        const previous = prev[product._id] || { loading: false };
        return {
          ...prev,
          [product._id]: {
            ...previous,
            applying: false,
          },
        };
      });
      toast.success('Improvements applied');
      fetchProducts();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to apply improvements';
      setPolicyImprovements(prev => {
        const previous = prev[product._id] || { loading: false };
        return {
          ...prev,
          [product._id]: {
            ...previous,
            applying: false,
            error: message,
          },
        };
      });
      toast.error(message);
    }
  };

  const goToProductPage = (nextPage: number) => {
    const totalPages = Math.max(1, totalProductPages || 1);
    if (nextPage < 1 || nextPage > totalPages) {
      return;
    }
    fetchProducts(nextPage);
  };

  const renderEtsyPaginationControls = (
    label: string,
    options?: { filteredCount?: number; filteredLabel?: string }
  ) => {
    const totalPages = Math.max(1, totalProductPages || 1);
    const hasProducts = totalProducts > 0;
    const start = hasProducts ? (productPage - 1) * productPerPage + 1 : 0;
    const end = hasProducts ? Math.min(totalProducts, productPage * productPerPage) : 0;
    const filteredCount =
      typeof options?.filteredCount === 'number' ? options.filteredCount : undefined;
    const filteredLabel = options?.filteredLabel || 'match current filters';

    return (
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm mb-4 w-full">
        <div>
          <p className="text-sm font-semibold text-gray-800">{label}</p>
          <p className="text-xs text-gray-500">
            {hasProducts
              ? `Showing ${start}-${end} of ${totalProducts} products • Page ${productPage} of ${totalPages}`
              : 'No products available'}
            {typeof filteredCount === 'number' && hasProducts && (
              <>
                {' · '}
                {filteredCount === totalProducts
                  ? 'All visible products match current filters'
                  : `${filteredCount} ${filteredLabel}`}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => goToProductPage(productPage - 1)}
            disabled={productPage === 1 || loading}
            className={`px-4 py-2.5 text-sm font-medium rounded-xl border-2 transition-all ${productPage === 1 || loading
              ? 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed'
              : 'text-gray-700 border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 shadow-sm hover:shadow-md transform hover:-translate-y-0.5'
              }`}
          >
            <span className="flex items-center space-x-1.5">
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </span>
          </button>
          <span className="text-sm font-bold text-gray-700 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-sm">
            Page {productPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => goToProductPage(productPage + 1)}
            disabled={productPage === totalPages || loading}
            className={`px-4 py-2.5 text-sm font-medium rounded-xl border-2 transition-all ${productPage === totalPages || loading
              ? 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed'
              : 'text-gray-700 border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 shadow-sm hover:shadow-md transform hover:-translate-y-0.5'
              }`}
          >
            <span className="flex items-center space-x-1.5">
              <span>Next</span>
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </span>
          </button>
        </div>
      </div>
    );
  };

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  // Fetch support tickets
  const fetchSupportTickets = async () => {
    try {
      setSupportLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (supportStatusFilter !== 'all') params.set('status', supportStatusFilter);
      if (supportCategoryFilter !== 'all') params.set('category', supportCategoryFilter);
      if (supportPriorityFilter !== 'all') params.set('priority', supportPriorityFilter);
      if (supportAssignedFilter !== 'all') params.set('assignedTo', supportAssignedFilter);
      if (supportSearchTerm) params.set('search', supportSearchTerm);

      const response = await fetch(`/api/support/tickets?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch support tickets');
      }

      const data = await response.json();
      setSupportTickets(data.tickets || []);
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      toast.error('Failed to fetch support tickets');
    } finally {
      setSupportLoading(false);
    }
  };

  // Fetch admin users for assignment
  const fetchAdminUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter users with admin permissions
        const admins = (data.users || []).filter((u: any) => 
          u.role?.name === 'SUPER_ADMIN' || 
          u.permissions?.some((p: string) => p.includes('ORDER_VIEW_ALL'))
        );
        setAdminUsers(admins);
      }
    } catch (error) {
      console.error('Error fetching admin users:', error);
    }
  };

  // Update ticket (status, priority, assignment)
  const handleUpdateTicket = async (ticketId: string, updates: any) => {
    try {
      setUpdatingTicket(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update ticket');
      }

      toast.success('Ticket updated successfully');
      fetchSupportTickets();
      if (viewingTicket && viewingTicket._id === ticketId) {
        const data = await response.json();
        setViewingTicket(data.ticket);
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast.error('Failed to update ticket');
    } finally {
      setUpdatingTicket(false);
    }
  };

  // Send message as admin
  const handleSendTicketMessage = async (ticketId: string) => {
    if (!ticketMessage.trim()) {
      toast.error('Message cannot be empty');
      return;
    }

    try {
      setSendingMessage(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: ticketMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      toast.success('Message sent successfully');
      setTicketMessage('');
      fetchSupportTickets();
      if (viewingTicket && viewingTicket._id === ticketId) {
        const data = await response.json();
        setViewingTicket(data.ticket);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Fetch ticket details
  const handleViewTicket = async (ticket: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/support/tickets/${ticket._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setViewingTicket(data.ticket);
      } else {
        throw new Error('Failed to fetch ticket details');
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
      toast.error('Failed to load ticket details');
    }
  };

  // Chat management functions
  const fetchChatConversations = async () => {
    try {
      setChatLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (chatStatusFilter !== 'all') params.set('status', chatStatusFilter);
      if (chatAssignedFilter !== 'all') params.set('assignedTo', chatAssignedFilter);
      if (chatSearchTerm) params.set('searchTerm', chatSearchTerm);

      const response = await fetch(`/api/admin/chat/conversations?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat conversations');
      }

      const data = await response.json();
      setChatConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching chat conversations:', error);
      toast.error('Failed to fetch chat conversations');
    } finally {
      setChatLoading(false);
    }
  };

  const handleViewConversation = async (conversation: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/chat/conversations/${conversation.conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setViewingConversation(data.conversation);
        setChatMessages(data.messages || []);
        updateQuery({ conversationId: conversation.conversationId });
      } else {
        throw new Error('Failed to fetch conversation details');
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      toast.error('Failed to load conversation details');
    }
  };

  const handleSendChatMessage = async (conversationId: string) => {
    if (!chatMessage.trim()) {
      toast.error('Message cannot be empty');
      return;
    }

    try {
      setSendingChatMessage(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: chatMessage,
          conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      setChatMessage('');
      // Refresh messages to get the latest
      if (viewingConversation) {
        const refreshResponse = await fetch(`/api/admin/chat/conversations/${conversationId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setChatMessages(refreshData.messages || []);
        }
      }
      fetchChatConversations();
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending chat message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingChatMessage(false);
    }
  };

  const handleUpdateConversation = async (conversationId: string, updates: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/chat/conversations/${conversationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update conversation');
      }

      toast.success('Conversation updated successfully');
      fetchChatConversations();
      if (viewingConversation && viewingConversation.conversationId === conversationId) {
        const data = await response.json();
        setViewingConversation(data.conversation);
      }
    } catch (error) {
      console.error('Error updating conversation:', error);
      toast.error('Failed to update conversation');
    }
  };

  // Fetch brands
  const fetchBrands = async () => {
    try {
      setBrandsLoading(true);
      const response = await fetch('/api/admin/brands');
      const data = await response.json();
      if (response.ok && Array.isArray(data.brands)) {
        setAvailableBrands(data.brands);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setBrandsLoading(false);
    }
  };

  // Seed roles (for initial setup)
  const seedRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/seed-roles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to seed roles');
      }

      toast.success('Roles and permissions seeded successfully');
      fetchRoles();
    } catch (error) {
      console.error('Error seeding roles:', error);
      toast.error('Failed to seed roles');
    }
  };

  // User management handlers
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    updateQuery({ tab: 'users', userId: user._id });
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Delete user error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    }
  };

  const handleUserFormSuccess = () => {
    fetchUsers();
    setEditingUser(null);
    setShowCreateUser(false);
    updateQuery({ userId: undefined });
  };

  // Role management handlers
  const handleEditRole = (role: Role) => {
    setEditingRole(role);
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete role');
      }

      toast.success('Role deleted successfully');
      fetchRoles();
    } catch (error) {
      console.error('Delete role error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete role');
    }
  };

  const handleRoleFormSuccess = () => {
    fetchRoles();
    setEditingRole(null);
    setShowCreateRole(false);
  };

  // Product management handlers
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    updateQuery({ tab: 'products', productId: product._id });
  };

  const handleOrganizeProductImages = async (productId: string, productName: string) => {
    if (!confirm(`Organize images for "${productName}"? This will upload images to Cloudinary and create a folder structure.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/products/${productId}/organize-images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to organize images');
      }

      toast.success(
        `Images organized! ${data.stats?.uploaded || 0} uploaded to Cloudinary folder: ${data.product?.folder || ''}`
      );

      // Refresh products list
      fetchProducts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to organize images');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete product');
      }

      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Delete product error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete product');
    }
  };

  // Copy functions for product data
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error(`Failed to copy ${label}`);
    }
  };

  const handleCopyTitle = (product: Product) => {
    copyToClipboard(product.name || '', 'Title');
  };

  const handleCopyDescription = (product: Product) => {
    copyToClipboard(product.description || '', 'Description');
  };

  const handleCopyTags = (product: Product) => {
    const tagsText = (product.tags || []).join(', ');
    copyToClipboard(tagsText, 'Tags');
  };

  const handleCopySpecs = (product: Product) => {
    const specs = product.specifications || {};
    const specsText = Object.entries(specs)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    copyToClipboard(specsText || 'No specifications', 'Specifications');
  };

  const handleCopyImageUrls = (product: Product) => {
    const allImages = [product.image, ...(product.images || [])].filter(Boolean);
    const imagesText = allImages.join('\n');
    copyToClipboard(imagesText || 'No images', 'Image URLs');
  };

  const handleCopyAltTexts = (product: Product) => {
    const altTexts = (product as any).imageAltTexts || [];
    if (altTexts.length === 0) {
      toast.error('No alt texts available. Generate them first!');
      return;
    }
    const altTextsString = altTexts.map((text: string, index: number) =>
      `Image ${index + 1}: ${text}`
    ).join('\n');
    copyToClipboard(altTextsString, 'Image Alt Texts');
  };

  const handleGenerateAltText = async (productId: string, productName: string) => {
    if (!confirm(`Generate unique alt text for all images of "${productName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/products/${productId}/generate-alt-text`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate alt text');
      }

      toast.success(
        `Generated ${data.altTexts?.length || 0} unique alt texts for product images!`
      );

      // Refresh products list
      fetchProducts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate alt text');
    }
  };

  // Close copy menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.copy-menu-container')) {
        document.querySelectorAll('[id^="copy-menu-"]').forEach(menu => {
          menu.classList.add('hidden');
        });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleProductFormSuccess = () => {
    fetchProducts();
    setEditingProduct(null);
    setShowCreateProduct(false);
    updateQuery({ productId: undefined });
  };

  // Handle product selection for export
  const handleProductSelection = (productId: string) => {
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    setSelectedProductIds(products.map(p => p._id));
    toast.success('All products selected');
  };

  const handleClearAll = () => {
    setSelectedProductIds([]);
    toast.success('Selection cleared');
  };

  // Handle Shopify CSV export
  const handleShopifyExport = async () => {
    if (selectedProductIds.length === 0) {
      toast.error('Please select at least one product to export');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/products/export-shopify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productIds: selectedProductIds }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to export products');
      }

      // Download the CSV file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shopify_products_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Exported ${selectedProductIds.length} product(s) to Shopify CSV`);
    } catch (error) {
      console.error('Shopify export error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to export products');
    }
  };


  const handleAnalysisSelectionChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedOnPage = Array.from(event.target.selectedOptions).map(option => option.value);
    const currentPageIds = products.map(product => product._id);

    setAnalysisSelectedIds(prev => {
      const idsWithoutCurrentPage = prev.filter(id => !currentPageIds.includes(id));
      return [...idsWithoutCurrentPage, ...selectedOnPage];
    });

    setAnalysisSelectedMeta(prev => {
      const updated = { ...prev };
      currentPageIds.forEach(id => {
        if (!selectedOnPage.includes(id)) {
          delete updated[id];
        }
      });
      selectedOnPage.forEach(id => {
        const product = products.find(p => p._id === id);
        if (product) {
          updated[id] = { name: product.name, price: product.price };
        }
      });
      return updated;
    });
  };

  const handleAnalysisToggleProduct = (productId: string) => {
    const product = products.find(p => p._id === productId);
    if (!product) return;

    setAnalysisSelectedIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });

    setAnalysisSelectedMeta(prev => {
      const updated = { ...prev };
      if (updated[productId]) {
        delete updated[productId];
      } else {
        updated[productId] = { name: product.name, price: product.price };
      }
      return updated;
    });
  };

  const handleAnalysisSelectAllCurrentPage = () => {
    const currentIds = products.map(product => product._id);
    if (!currentIds.length) return;

    setAnalysisSelectedIds(prev => {
      const idsWithoutCurrentPage = prev.filter(id => !currentIds.includes(id));
      return [...idsWithoutCurrentPage, ...currentIds];
    });

    setAnalysisSelectedMeta(prev => {
      const updated = { ...prev };
      products.forEach(product => {
        updated[product._id] = { name: product.name, price: product.price };
      });
      return updated;
    });
  };

  const handleAnalysisClearCurrentPage = () => {
    const currentIds = products.map(product => product._id);
    if (!currentIds.length) return;

    setAnalysisSelectedIds(prev => prev.filter(id => !currentIds.includes(id)));
    setAnalysisSelectedMeta(prev => {
      const updated = { ...prev };
      currentIds.forEach(id => {
        delete updated[id];
      });
      return updated;
    });
  };

  const handleAnalysisRemoveSelection = (productId: string) => {
    setAnalysisSelectedIds(prev => prev.filter(id => id !== productId));
    setAnalysisSelectedMeta(prev => {
      const updated = { ...prev };
      delete updated[productId];
      return updated;
    });
  };

  const applyProductUpdate = (productId: string, updates: Partial<Product>) => {
    setProducts(prev =>
      prev.map(product =>
        product._id === productId ? { ...product, ...updates } : product
      )
    );
    setSelectedProductForModal(prev =>
      prev && prev._id === productId ? { ...prev, ...updates } : prev
    );
  };

  const handleToggleEtsyExport = async (productId: string, nextValue: boolean) => {
    if (!isSuperAdmin) {
      toast.error('Super admin access required');
      return;
    }
    try {
      setEtsyExportLoading(prev => ({ ...prev, [productId]: true }));
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ etsyExported: nextValue }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to update Etsy export status');
      }
      const updatedProduct = data?.product || {};
      applyProductUpdate(productId, {
        etsyExported: updatedProduct.etsyExported ?? nextValue,
        etsyExportedAt: updatedProduct.etsyExportedAt ?? (nextValue ? new Date().toISOString() : null),
      });
      toast.success(nextValue ? 'Marked as exported to Etsy' : 'Marked as not exported');
    } catch (error) {
      console.error('Toggle Etsy export error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update Etsy export status');
    } finally {
      setEtsyExportLoading(prev => {
        const { [productId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const copyProductSection = async (label: string, value?: string) => {
    if (!isSuperAdmin) {
      toast.error('Super admin access required');
      return;
    }
    if (!value || !value.trim()) {
      toast.error(`No ${label.toLowerCase()} to copy`);
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      toast.error('Clipboard is not available in this browser');
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      console.error('Copy clipboard error:', error);
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  // Order management handlers
  const handleViewOrder = (order: Order) => {
    setViewingOrder(order);
    updateQuery({ tab: 'orders', orderId: order._id });
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update order status');
      }

      toast.success('Order status updated successfully');
      fetchOrders();
      updateQuery({ orderId });
    } catch (error) {
      console.error('Update order error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update order status');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete order');
      }

      toast.success('Order deleted successfully');
      fetchOrders();
      updateQuery({ orderId: undefined });
    } catch (error) {
      console.error('Delete order error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete order');
    }
  };

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/orders/${orderId}/invoice`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to download invoice');
      }

      // Get the HTML content
      const htmlContent = await response.text();

      // Create a blob with the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);

      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderId}.html`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Download invoice error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to download invoice');
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user?.permissions?.includes('system:settings')) return;

    // Lazy-load only what the active tab needs
    switch (activeTab as any) {
      case 'overview':
        fetchMetrics(metricsDays);
        break;
      case 'users':
        fetchUsers();
        fetchRoles();
        break;
      case 'roles':
        fetchRoles();
        break;
      case 'products':
      case 'policy-review':
        fetchProducts();
        break;
      case 'orders':
        fetchOrders();
        break;
      case 'etsy':
        // Fetch products for Etsy export functionality
        if (!productsFetchedRef.current) {
          productsFetchedRef.current = true;
          fetchProducts();
        }
        break;
      default:
        // For tabs like blogs/seo, their own components handle fetching
        break;
    }
  }, [isAuthenticated, user, activeTab, metricsDays]);

  // Refetch products when filters, sorting, or pagination changes
  useEffect(() => {
    if ((activeTab === 'products' || activeTab === 'policy-review') && isAuthenticated) {
      // Debounce search term to avoid too many API calls
      const timeoutId = setTimeout(() => {
        // When filters/sorting change, always fetch from current page (which should be 1 after filter changes)
        // When only productPage changes, fetch that specific page
        fetchProducts();
      }, searchTerm ? 500 : 0);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizedFilter, productPage, productPerPage, selectedCategory, selectedBrand, selectedProductStatus, selectedStockCount, selectedIsActive, productSortBy, productSortOrder, searchTerm]);

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !selectedRole || user.role?.name === selectedRole;
    return matchesSearch && matchesRole;
  });

  useEffect(() => {
    if (!products.length) return;
    setPolicyReviewStatus(prev => {
      let changed = false;
      const next = { ...prev };

      products.forEach(product => {
        const derived = buildPolicyReviewResultFromProduct(product.policyReview);
        if (!derived) {
          return;
        }
        const existing = next[product._id];
        const existingResult = existing?.result;
        const alreadySynced =
          existingResult &&
          existingResult.score === derived.score &&
          existingResult.complianceRate === derived.complianceRate &&
          existingResult.summary.totalViolations === derived.summary.totalViolations &&
          existingResult.summary.criticalIssues === derived.summary.criticalIssues &&
          existingResult.summary.warnings === derived.summary.warnings &&
          existingResult.summary.recommendations === derived.summary.recommendations &&
          existingResult.summary.isCompliant === derived.summary.isCompliant;

        if (!alreadySynced) {
          next[product._id] = {
            loading: false,
            error: undefined,
            result: derived,
          };
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [products]);

  const getPolicyReviewResultForProduct = (product: Product): PolicyReviewResult | undefined => {
    return policyReviewStatus[product._id]?.result || buildPolicyReviewResultFromProduct(product.policyReview);
  };

  const filteredPolicyProducts = useMemo(() => {
    const query = policyReviewSearch.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.brand?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
      const result = getPolicyReviewResultForProduct(product);

      switch (policyReviewFilter) {
        case 'compliant':
          return result?.summary?.isCompliant ?? false;
        case 'risk':
          return result ? !result.summary.isCompliant : false;
        case 'pending':
          return !result;
        default:
          return true;
      }
    });
  }, [products, policyReviewSearch, policyReviewFilter, policyReviewStatus]);

  const visiblePolicyProducts = filteredPolicyProducts;

  const selectedProductTitle = selectedProductForModal?.name || '';
  const selectedProductDescription = selectedProductForModal?.description || '';
  const selectedProductTagsText = selectedProductForModal?.tags?.join(', ') || '';
  const selectedProductSpecsText = selectedProductForModal?.specifications
    ? Object.entries(selectedProductForModal.specifications)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')
    : '';

  if (!isAuthenticated || !user?.permissions?.includes('system:settings')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="md:hidden flex items-center justify-between rounded-2xl border border-gray-200 bg-white/70 px-4 py-3 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">Navigate</p>
              <p className="text-base font-semibold text-gray-900">Choose a workspace area</p>
            </div>
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(prev => !prev)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              aria-expanded={mobileSidebarOpen}
              aria-controls="admin-sidebar"
            >
              {mobileSidebarOpen ? 'Hide Menu' : 'Open Menu'}
            </button>
          </div>

          {mobileSidebarOpen && (
            <div
              role="presentation"
              aria-hidden="true"
              className="fixed inset-0 z-30 bg-black/40 md:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}

          <aside
            id="admin-sidebar"
            aria-label="Admin navigation"
            className={`md:w-64 lg:w-72 xl:w-80 ${mobileSidebarOpen
              ? 'fixed inset-y-4 left-4 right-4 z-40 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl md:relative md:block md:h-full md:max-h-none md:p-0 md:border-0 md:shadow-none'
              : 'hidden md:block md:sticky md:top-6'
              }`}
          >
            <div className={`space-y-6 ${mobileSidebarOpen ? '' : 'md:sticky md:top-6'}`}>
              {mobileSidebarOpen && (
                <div className="flex items-center justify-between gap-2 rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-2 md:hidden">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isNestedTab && parentTab && (
                      <button
                        type="button"
                        onClick={() => {
                          handleTabChange(parentTab.id);
                          setOpenNestedMenu(parentTab.id);
                        }}
                        className="flex items-center justify-center p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 flex-shrink-0"
                        aria-label={`Back to ${parentTab.label}`}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                    )}
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {isNestedTab && parentTab ? parentTab.label : 'Navigation'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 flex-shrink-0"
                  >
                    Close
                  </button>
                </div>
              )}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-600">Control Center</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">Admin Dashboard</h1>
                <p className="text-sm text-gray-600 mt-2">Manage users, roles, and system settings</p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-500">Navigate</p>
                </div>
                <div className="p-3 flex flex-col gap-1.5">
                  {sidebarTabs.map((tab) => {
                    const active = isTabActive(tab);
                    const childrenVisible = shouldShowChildren(tab);
                    return (
                      <div key={tab.id} className="space-y-1.5">
                        <div
                          className={`flex items-center gap-2 rounded-xl px-3 py-3 text-sm transition-all border ${active
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 shadow-sm'
                            : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleTabChange(tab.id)}
                            onKeyDown={(event) => handleParentKeyDown(event, tab)}
                            aria-current={tab.id === activeTab ? 'page' : undefined}
                            aria-expanded={tab.children ? childrenVisible : undefined}
                            aria-controls={tab.children ? `sidebar-section-${tab.id}` : undefined}
                            className="flex flex-1 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                          >
                            <tab.icon className={`h-4 w-4 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                            <div className="flex-1">
                              <div className="font-semibold">{tab.label}</div>
                              {tab.description && (
                                <p className="text-xs text-gray-500">{tab.description}</p>
                              )}
                            </div>
                          </button>
                          {tab.children && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setOpenNestedMenu((prev) => (prev === tab.id ? null : tab.id));
                              }}
                              className="p-1 rounded-lg hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                              aria-label={`${childrenVisible ? 'Collapse' : 'Expand'} ${tab.label} submenu`}
                              aria-expanded={childrenVisible}
                              aria-controls={`sidebar-section-${tab.id}`}
                            >
                              <ChevronDown
                                className={`h-4 w-4 transition-transform ${childrenVisible ? 'rotate-180 text-blue-600' : 'text-gray-400'
                                  }`}
                              />
                            </button>
                          )}
                        </div>
                        {tab.children && (
                          <div
                            id={`sidebar-section-${tab.id}`}
                            role="region"
                            aria-label={`${tab.label} submenu`}
                            aria-hidden={!childrenVisible}
                            className={`ml-9 flex flex-col gap-1 border-l border-gray-100 pl-3 transition-all duration-200 ${childrenVisible ? 'mt-1 mb-2 opacity-100' : 'max-h-0 overflow-hidden opacity-0'
                              }`}
                          >
                            {tab.children.map((child) => {
                              const childActive = activeTab === child.id;
                              return (
                                <button
                                  type="button"
                                  key={child.id}
                                  onClick={() => handleTabChange(child.id)}
                                  aria-current={childActive ? 'page' : undefined}
                                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${childActive
                                    ? 'bg-blue-600/10 text-blue-700'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                  {child.icon && (
                                    <child.icon
                                      className={`h-4 w-4 ${childActive ? 'text-blue-600' : 'text-gray-400'}`}
                                    />
                                  )}
                                  <span>{child.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-500">Quick Actions</p>
                <div className="mt-4 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={seedRoles}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow-sm hover:from-blue-700 hover:to-indigo-700 transition-all"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Seed Roles</span>
                  </button>
                  <Link
                    href="/admin/audit-logs"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <FileCheck className="h-4 w-4 text-gray-500" />
                    <span>Audit Logs</span>
                  </Link>
                  <Link
                    href="/admin/product-versions"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <History className="h-4 w-4 text-gray-500" />
                    <span>Product Changes</span>
                  </Link>
                  <Link
                    href="/admin/tools"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <Wrench className="h-4 w-4 text-gray-500" />
                    <span>Admin Tools</span>
                  </Link>
                  <Link
                    href="/"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <Home className="h-4 w-4 text-gray-500" />
                    <span>Back to Store</span>
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          <div className={`flex-1 min-w-0 ${mobileSidebarOpen ? 'lg:pl-0' : ''}`}>
            <div className="space-y-8">

              {/* Sourcing Tab */}
              {activeTab === 'sourcing' && (
                <div className="space-y-6">
                  <SourcingPanel />
                </div>
              )}

              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Controls for metrics */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Metrics Range:</span>
                      <div className="inline-flex rounded-md border bg-white shadow-sm overflow-hidden">
                        {[7, 30, 90].map((d) => (
                          <button
                            key={d}
                            onClick={() => { setMetricsDays(d as 7 | 30 | 90); fetchMetrics(d as 7 | 30 | 90); }}
                            className={`px-3 py-1.5 text-sm ${metricsDays === d ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                          >
                            {d}d
                          </button>
                        ))}
                      </div>


                    </div>
                    <button onClick={() => fetchMetrics(metricsDays)} className="flex items-center gap-2 text-sm px-3 py-1.5 border rounded-md">
                      <RefreshCw className="h-4 w-4" /> Refresh
                    </button>
                  </div>

                  {/* New KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                      <p className="text-sm font-medium text-gray-600">Total Revenue ({metricsDays}d)</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">
                        ${metrics?.kpis.totalRevenue?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                      <p className="text-sm font-medium text-gray-600">Total Orders ({metricsDays}d)</p>
                      <p className="text-3xl font-bold text-blue-600 mt-2">
                        {metrics?.kpis.totalOrders ?? 0}
                      </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                      <p className="text-sm font-medium text-gray-600">Average Order Value</p>
                      <p className="text-3xl font-bold text-purple-600 mt-2">
                        ${metrics?.kpis.avgOrderValue?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>

                  {/* Inline SVG Revenue Chart */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue (last {metricsDays} days)</h3>
                    {metricsLoading ? (
                      <p className="text-gray-500">Loading metrics...</p>
                    ) : chartPoints.length ? (
                      <div className="overflow-x-auto">
                        <svg width={640} height={180} className="min-w-[640px]">
                          {/* Axes */}
                          <line x1="20" y1="160" x2="620" y2="160" stroke="#e5e7eb" />
                          <line x1="20" y1="20" x2="20" y2="160" stroke="#e5e7eb" />
                          {/* Path */}
                          <polyline
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2"
                            points={chartPoints.map(p => `${p.x},${p.y}`).join(' ')}
                          />
                          {/* Points */}
                          {chartPoints.map((p, i) => (
                            <circle key={i} cx={p.x} cy={p.y} r={3} fill="#2563eb" />
                          ))}
                        </svg>
                      </div>
                    ) : (
                      <p className="text-gray-500">No data</p>
                    )}
                  </div>

                  {/* Top Products */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products (by revenue)</h3>
                    {metrics?.topProducts?.length ? (
                      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {metrics.topProducts.map((p) => (
                          <div key={p.productId} className="flex items-center gap-4 border rounded-lg p-3">
                            <img src={p.image || '/vercel.svg'} alt={p.name || 'Product'} className="w-14 h-14 rounded object-cover border" />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 truncate">{p.name || p.productId}</div>
                              <div className="text-sm text-gray-600">${p.revenue.toFixed(2)} · {p.units} units</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No top products yet.</p>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div onClick={goToUsers} className="bg-white p-6 rounded-lg shadow-sm border cursor-pointer hover:border-blue-300 hover:shadow transition-colors">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Users</p>
                          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                        </div>
                      </div>
                    </div>
                    <div onClick={goToUsers} className="bg-white p-6 rounded-lg shadow-sm border cursor-pointer hover:border-blue-300 hover:shadow transition-colors">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <UserCheck className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Active Users</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {users.filter(u => u.isActive).length}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div onClick={goToRoles} className="bg-white p-6 rounded-lg shadow-sm border cursor-pointer hover:border-blue-300 hover:shadow transition-colors">
                      <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Shield className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Roles</p>
                          <p className="text-2xl font-bold text-gray-900">{roles.length}</p>
                        </div>
                      </div>
                    </div>
                    <div onClick={goToProducts} className="bg-white p-6 rounded-lg shadow-sm border cursor-pointer hover:border-blue-300 hover:shadow transition-colors">
                      <div className="flex items-center">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Package className="h-6 w-6 text-orange-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Products</p>
                          <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <div onClick={() => goToOrders()} className="bg-white p-6 rounded-lg shadow-sm border cursor-pointer hover:border-blue-300 hover:shadow transition-colors">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <ShoppingCart className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Orders</p>
                          <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                        </div>
                      </div>
                    </div>
                    <div onClick={() => goToOrders('pending')} className="bg-white p-6 rounded-lg shadow-sm border cursor-pointer hover:border-blue-300 hover:shadow transition-colors">
                      <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Pending</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {orders.filter(o => o.status === 'pending').length}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div onClick={() => goToOrders('processing')} className="bg-white p-6 rounded-lg shadow-sm border cursor-pointer hover:border-blue-300 hover:shadow transition-colors">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Truck className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Processing</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {orders.filter(o => o.status === 'processing').length}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div onClick={() => goToOrders('delivered')} className="bg-white p-6 rounded-lg shadow-sm border cursor-pointer hover:border-blue-300 hover:shadow transition-colors">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Delivered</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {orders.filter(o => o.status === 'delivered').length}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div onClick={() => goToOrders('cancelled')} className="bg-white p-6 rounded-lg shadow-sm border cursor-pointer hover:border-blue-300 hover:shadow transition-colors">
                      <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <XCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Cancelled</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {orders.filter(o => o.status === 'cancelled').length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Revenue Summary */}
                  <div onClick={() => goToOrders()} className="bg-white p-6 rounded-lg shadow-sm border cursor-pointer hover:border-blue-300 hover:shadow transition-colors">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                        <p className="text-3xl font-bold text-green-600">
                          ${orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600">Average Order Value</p>
                        <p className="text-3xl font-bold text-blue-600">
                          ${orders.length > 0 ? (orders.reduce((sum, order) => sum + order.total, 0) / orders.length).toFixed(2) : '0.00'}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600">Orders This Month</p>
                        <p className="text-3xl font-bold text-purple-600">
                          {orders.filter(order => {
                            const orderDate = new Date(order.createdAt);
                            const now = new Date();
                            return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
                          }).length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Tab */}
              {(activeTab as any) === 'performance' && (
                <div className="space-y-8">
                  {/* Image Optimization */}
                  <div className="bg-white rounded-lg shadow-sm border border-blue-100">
                    <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50/40 to-indigo-50/30">
                      <h2 className="text-xl font-semibold text-blue-900">Image Optimization</h2>
                      <p className="text-blue-700/80 mt-1 text-sm">Using Next/Image with optional CDN loader.</p>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 border border-blue-100 rounded-lg bg-blue-50/20">
                          <span className="text-blue-900">CDN Origin</span>
                          <code className="text-blue-800">{process.env.NEXT_PUBLIC_IMAGE_CDN || 'Not set'}</code>
                        </div>
                        <p className="text-gray-700">Set <code className="px-1 py-0.5 bg-blue-50 border border-blue-100 rounded">NEXT_PUBLIC_IMAGE_CDN</code> to proxy images via your CDN.</p>
                      </div>
                      <div className="space-y-2">
                        <a className="inline-block px-4 py-2 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100" href="/categories/men" target="_blank">Open Category (optimized hero)</a>
                        <a className="ml-3 inline-block px-4 py-2 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100" href="/products" target="_blank">Open Products</a>
                      </div>
                    </div>
                  </div>

                  {/* ISR */}
                  <div className="bg-white rounded-lg shadow-sm border border-blue-100">
                    <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50/40 to-indigo-50/30">
                      <h2 className="text-xl font-semibold text-blue-900">Incremental Static Regeneration</h2>
                      <p className="text-blue-700/80 mt-1 text-sm">ISR enabled for product and category routes.</p>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="p-3 border border-blue-100 rounded-lg bg-blue-50/20">
                        <div className="text-blue-900 font-medium">Categories</div>
                        <div className="text-blue-800">revalidate: 300s</div>
                        <code className="text-xs">src/app/categories/[slug]/layout.tsx</code>
                      </div>
                      <div className="p-3 border border-blue-100 rounded-lg bg-blue-50/20">
                        <div className="text-blue-900 font-medium">Products</div>
                        <div className="text-blue-800">revalidate: 600s</div>
                        <code className="text-xs">src/app/products/[id]/layout.tsx</code>
                      </div>
                      <div className="p-3 border border-blue-100 rounded-lg bg-blue-50/20">
                        <div className="text-blue-900 font-medium">Hint</div>
                        <div className="text-blue-800">Update content → first request regenerates in background.</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Analytics Tab */}
              {(activeTab as any) === 'analytics' && (
                <div className="space-y-8">
                  {/* API Helpers */}
                  <div className="bg-white rounded-lg shadow-sm border border-blue-100">
                    <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50/40 to-indigo-50/30">
                      <h2 className="text-xl font-semibold text-blue-900">Quick Event Tester</h2>
                      <p className="text-blue-700/80 mt-1 text-sm">Send test events to validate analytics pipeline.</p>
                    </div>
                    <EventTester />
                  </div>
                  {/* Funnel */}
                  <div className="bg-white rounded-lg shadow-sm border border-blue-100">
                    <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50/40 to-indigo-50/30">
                      <h2 className="text-xl font-semibold text-blue-900">Product Funnel</h2>
                      <p className="text-blue-700/80 mt-1 text-sm">Events collected server-side from key actions.</p>
                    </div>
                    <AnalyticsFunnel />
                  </div>

                  {/* Search */}
                  <div className="bg-white rounded-lg shadow-sm border border-blue-100">
                    <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50/40 to-indigo-50/30">
                      <h2 className="text-xl font-semibold text-blue-900">Search Analytics</h2>
                    </div>
                    <SearchAnalytics />
                  </div>

                  {/* Cohorts */}
                  <div className="bg-white rounded-lg shadow-sm border border-blue-100">
                    <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50/40 to-indigo-50/30">
                      <h2 className="text-xl font-semibold text-blue-900">Cohort Retention & LTV</h2>
                    </div>
                    <CohortAnalytics />
                  </div>
                </div>
              )}

              {/* Etsy Integration Tab */}
              {(activeTab as any) === 'etsy' && (
                <div className="space-y-8">
                  {/* How It Works - Info Section */}
                  <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl shadow-lg border-2 border-blue-200 p-6 mb-8">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 rounded-xl shrink-0">
                        <HelpCircle className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-gray-900 mb-4">How Etsy Policy Checking Works</h3>
                        <div className="space-y-4 text-sm text-gray-700">
                          <div>
                            <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">1</span>
                              Product Data Extraction
                            </h4>
                            <p className="ml-8 text-gray-600">The system extracts and analyzes three key components from each product:</p>
                            <ul className="ml-8 mt-2 space-y-1 list-disc list-inside text-gray-600">
                              <li><strong>Title:</strong> Product name/title text</li>
                              <li><strong>Description:</strong> Full product description (HTML stripped to plain text)</li>
                              <li><strong>Image Alt Text:</strong> Image filenames and metadata (if available)</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">2</span>
                              Policy Violation Detection
                            </h4>
                            <p className="ml-8 text-gray-600 mb-2">The system scans for prohibited content using pattern matching:</p>
                            <div className="ml-8 grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                              <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
                                <p className="font-semibold text-red-900 text-xs mb-1">❌ Personal Information</p>
                                <p className="text-xs text-red-700">Phone numbers, emails, addresses, ZIP codes</p>
                              </div>
                              <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
                                <p className="font-semibold text-red-900 text-xs mb-1">❌ External Marketplace Links</p>
                                <p className="text-xs text-red-700">Amazon, eBay, Shopify, Walmart, etc.</p>
                              </div>
                              <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
                                <p className="font-semibold text-red-900 text-xs mb-1">❌ Prohibited Content</p>
                                <p className="text-xs text-red-700">Counterfeit, weapons, drugs, hate speech</p>
                              </div>
                              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                                <p className="font-semibold text-yellow-900 text-xs mb-1">⚠️ Misleading Information</p>
                                <p className="text-xs text-yellow-700">Spam phrases, false guarantees</p>
                              </div>
                              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                                <p className="font-semibold text-yellow-900 text-xs mb-1">⚠️ Copyright Violations</p>
                                <p className="text-xs text-yellow-700">Disney, Marvel, Nintendo, etc.</p>
                              </div>
                              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                                <p className="font-semibold text-blue-900 text-xs mb-1">ℹ️ Spam Keywords</p>
                                <p className="text-xs text-blue-700">ALL CAPS, excessive punctuation</p>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">3</span>
                              Etsy Handbook Comparison
                            </h4>
                            <p className="ml-8 text-gray-600 mb-2">Each product is scored against Etsy's seller handbook guidelines:</p>
                            <div className="ml-8 grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                              <div className="bg-white border-2 border-gray-200 p-2 rounded-lg">
                                <p className="font-semibold text-xs text-gray-900">Title Requirements</p>
                                <p className="text-xs text-gray-600">Max 140 chars, no personal info, descriptive keywords</p>
                              </div>
                              <div className="bg-white border-2 border-gray-200 p-2 rounded-lg">
                                <p className="font-semibold text-xs text-gray-900">Description Requirements</p>
                                <p className="text-xs text-gray-600">Min 200 chars, include materials, dimensions, care info</p>
                              </div>
                              <div className="bg-white border-2 border-gray-200 p-2 rounded-lg">
                                <p className="font-semibold text-xs text-gray-900">Image Alt Text</p>
                                <p className="text-xs text-gray-600">Descriptive, accessible, no personal information</p>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">4</span>
                              Scoring System
                            </h4>
                            <p className="ml-8 text-gray-600 mb-2">Products receive a compliance score (0-100) based on:</p>
                            <div className="ml-8 grid grid-cols-3 gap-3 mt-2">
                              <div className="text-center p-3 bg-green-50 border-2 border-green-300 rounded-lg">
                                <p className="text-2xl font-black text-green-600">80-100</p>
                                <p className="text-xs font-semibold text-green-900 mt-1">Compliant</p>
                              </div>
                              <div className="text-center p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                                <p className="text-2xl font-black text-yellow-600">60-79</p>
                                <p className="text-xs font-semibold text-yellow-900 mt-1">Needs Work</p>
                              </div>
                              <div className="text-center p-3 bg-red-50 border-2 border-red-300 rounded-lg">
                                <p className="text-2xl font-black text-red-600">0-59</p>
                                <p className="text-xs font-semibold text-red-900 mt-1">Critical Issues</p>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">5</span>
                              Google Search Analysis (Optional - SerpAPI)
                            </h4>
                            <p className="ml-8 text-gray-600 mb-2">When enabled, the system also performs Google Shopping searches to:</p>
                            <div className="ml-8 grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                              <div className="bg-indigo-50 border-l-4 border-indigo-400 p-3 rounded">
                                <p className="font-semibold text-indigo-900 text-xs mb-1">🔍 Search Visibility</p>
                                <p className="text-xs text-indigo-700">Checks if your product appears in Google Shopping results for relevant keywords</p>
                              </div>
                              <div className="bg-indigo-50 border-l-4 border-indigo-400 p-3 rounded">
                                <p className="font-semibold text-indigo-900 text-xs mb-1">📊 Competitor Analysis</p>
                                <p className="text-xs text-indigo-700">Compares your product title, price, and ratings with top competitors</p>
                              </div>
                              <div className="bg-indigo-50 border-l-4 border-indigo-400 p-3 rounded">
                                <p className="font-semibold text-indigo-900 text-xs mb-1">🔑 Keyword Performance</p>
                                <p className="text-xs text-indigo-700">Extracts related search terms and trending keywords from Google</p>
                              </div>
                              <div className="bg-indigo-50 border-l-4 border-indigo-400 p-3 rounded">
                                <p className="font-semibold text-indigo-900 text-xs mb-1">⚡ SEO Insights</p>
                                <p className="text-xs text-indigo-700">Identifies opportunities to improve search ranking and discoverability</p>
                              </div>
                            </div>
                            <p className="ml-8 mt-2 text-xs text-gray-500 italic">Note: Requires SERPAPI_KEY in environment variables. Adds ~1 second delay per product for API rate limiting.</p>
                          </div>
                          <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded-lg mt-4">
                            <p className="text-xs font-bold text-blue-900 mb-1">💡 Important Note:</p>
                            <p className="text-xs text-blue-800">This tool uses pattern matching and Etsy's published guidelines. It cannot guarantee 100% compliance - always review Etsy's latest policies before listing. The Google Search Analysis provides additional insights but does not replace manual review.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product Analysis Tool */}
                  <div className="bg-white rounded-2xl shadow-xl border-2 border-orange-100 overflow-hidden">
                    <div className="p-4 sm:p-8 border-b-2 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-lg flex-shrink-0">
                          <BarChart3 className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">Product Analysis vs Etsy Handbook</h2>
                          <p className="text-orange-50 text-xs sm:text-sm lg:text-base mt-1 sm:mt-2 font-medium">Analyze products using SerpAPI and compare with Etsy seller handbook guidelines</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 sm:p-8 bg-gradient-to-br from-gray-50 via-white to-gray-50">
                      <div className="mb-8">
                        <label className="block text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <Package className="h-5 w-5 text-orange-600" />
                          </div>
                          <span>Select Products to Analyze</span>
                        </label>

                        {/* Product Search */}
                        <div className="mb-4">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search products by name, category, or brand..."
                              value={etsyProductSearch}
                              onChange={(e) => setEtsyProductSearch(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-200 transition-all bg-white shadow-sm text-sm"
                            />
                            {etsyProductSearch && (
                              <button
                                onClick={() => setEtsyProductSearch('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                aria-label="Clear search"
                              >
                                <XCircle className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                          {etsyProductSearch && (
                            <p className="mt-2 text-xs text-gray-600">
                              Showing filtered results for "{etsyProductSearch}"
                            </p>
                          )}
                        </div>

                        <div className="mb-4 flex justify-center">
                          {renderEtsyPaginationControls('SerpAPI analysis pagination')}
                        </div>

                        {/* Filtered Products */}
                        {(() => {
                          const filteredProducts = etsyProductSearch
                            ? products.filter((p: any) => {
                              const searchLower = etsyProductSearch.toLowerCase();
                              return (
                                p.name?.toLowerCase().includes(searchLower) ||
                                p.category?.toLowerCase().includes(searchLower) ||
                                p.brand?.toLowerCase().includes(searchLower) ||
                                p.description?.toLowerCase().includes(searchLower)
                              );
                            })
                            : products;

                          if (etsyProductSearch && filteredProducts.length === 0) {
                            return (
                              <div className="text-center py-12 bg-white rounded-2xl border-2 border-gray-200">
                                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600 font-medium">No products found matching "{etsyProductSearch}"</p>
                                <button
                                  onClick={() => setEtsyProductSearch('')}
                                  className="mt-4 text-sm text-orange-600 hover:text-orange-700 font-semibold"
                                >
                                  Clear search
                                </button>
                              </div>
                            );
                          }

                          return (
                            <>
                              {/* Mobile: Card Layout, Desktop: Table Layout */}
                              <div className="hidden md:block overflow-x-auto">
                                <div className="inline-block min-w-full align-middle">
                                  <div className="overflow-hidden rounded-2xl border-2 border-gray-300 bg-white shadow-md">
                                    <table className="min-w-full divide-y divide-gray-200">
                                      <thead className="bg-gradient-to-r from-orange-50 to-red-50">
                                        <tr>
                                          <th scope="col" className="w-12 px-4 py-3 text-left">
                                            <input
                                              type="checkbox"
                                              checked={filteredProducts.length > 0 && filteredProducts.every((p: any) => analysisSelectedIds.includes(p._id))}
                                              onChange={(e) => {
                                                if (e.target.checked) {
                                                  filteredProducts.forEach((p: any) => {
                                                    if (!analysisSelectedIds.includes(p._id)) {
                                                      handleAnalysisToggleProduct(p._id);
                                                    }
                                                  });
                                                } else {
                                                  filteredProducts.forEach((p: any) => {
                                                    if (analysisSelectedIds.includes(p._id)) {
                                                      handleAnalysisToggleProduct(p._id);
                                                    }
                                                  });
                                                }
                                              }}
                                              className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                            />
                                          </th>
                                          <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                                            Product Name
                                          </th>
                                          <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                                            Price
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-200 bg-white">
                                        {filteredProducts.map((p: any) => {
                                          const isSelected = analysisSelectedIds.includes(p._id);
                                          return (
                                            <tr
                                              key={p._id}
                                              className={`cursor-pointer transition-colors ${isSelected
                                                ? 'bg-orange-50 hover:bg-orange-100'
                                                : 'hover:bg-gray-50'
                                                }`}
                                              onClick={() => handleAnalysisToggleProduct(p._id)}
                                            >
                                              <td className="px-4 py-3">
                                                <input
                                                  type="checkbox"
                                                  checked={isSelected}
                                                  onChange={() => handleAnalysisToggleProduct(p._id)}
                                                  onClick={(e) => e.stopPropagation()}
                                                  className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                                                />
                                              </td>
                                              <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                                {p.name}
                                              </td>
                                              <td className="px-4 py-3 text-sm font-bold text-gray-700">
                                                ${typeof p.price === 'number' ? p.price.toFixed(2) : '0.00'}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>

                              {/* Mobile: Card Layout */}
                              <div className="md:hidden space-y-3">
                                {filteredProducts.map((p: any) => {
                                  const isSelected = analysisSelectedIds.includes(p._id);
                                  return (
                                    <div
                                      key={p._id}
                                      onClick={() => handleAnalysisToggleProduct(p._id)}
                                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${isSelected
                                        ? 'bg-orange-50 border-orange-300 shadow-md'
                                        : 'bg-white border-gray-200 hover:border-orange-200'
                                        }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleAnalysisToggleProduct(p._id)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 flex-shrink-0 cursor-pointer"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                                        <p className="text-sm font-bold text-orange-600 mt-1">
                                          ${typeof p.price === 'number' ? p.price.toFixed(2) : '0.00'}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Action Buttons - Responsive */}
                              <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center">
                                <button
                                  onClick={() => {
                                    filteredProducts.forEach((p: any) => {
                                      if (!analysisSelectedIds.includes(p._id)) {
                                        handleAnalysisToggleProduct(p._id);
                                      }
                                    });
                                  }}
                                  className="px-6 py-3 text-sm font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                  Select All {etsyProductSearch ? '(Filtered)' : ''}
                                </button>
                                <button
                                  onClick={() => {
                                    filteredProducts.forEach((p: any) => {
                                      if (analysisSelectedIds.includes(p._id)) {
                                        handleAnalysisToggleProduct(p._id);
                                      }
                                    });
                                  }}
                                  className="px-6 py-3 text-sm font-bold bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all shadow-md hover:shadow-lg"
                                >
                                  Clear {etsyProductSearch ? 'Filtered' : 'Page'}
                                </button>
                              </div>

                              {/* Tip - Mobile Friendly */}
                              <div className="mt-4 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl border-2 border-gray-200 shadow-lg">
                                <p className="text-xs text-gray-700 flex flex-col sm:flex-row items-start sm:items-center gap-2 font-medium">
                                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md font-bold">TIP</span>
                                  <span>Tap products to select/deselect. Use buttons above to select all or clear {etsyProductSearch ? 'filtered' : 'current page'}.</span>
                                </p>
                              </div>
                            </>
                          );
                        })()}
                        {analysisSelectedIds.length > 0 && (
                          <div className="mt-4 bg-white border border-orange-100 rounded-2xl p-4 shadow-sm">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <p className="text-sm font-semibold text-gray-800">
                                Selected {analysisSelectedIds.length} product{analysisSelectedIds.length === 1 ? '' : 's'} across pages
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  setAnalysisSelectedIds([]);
                                  setAnalysisSelectedMeta({});
                                }}
                                className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                              >
                                Clear all
                              </button>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                              {analysisSelectedIds.map(id => (
                                <span
                                  key={id}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-xs font-medium text-orange-800"
                                >
                                  <span className="truncate max-w-[160px]">
                                    {analysisSelectedMeta[id]?.name || 'Product'}
                                    {(() => {
                                      const price = analysisSelectedMeta[id]?.price;
                                      return typeof price === 'number' ? ` · $${price.toFixed(2)}` : '';
                                    })()}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleAnalysisRemoveSelection(id)}
                                    className="text-orange-500 hover:text-orange-700"
                                    aria-label={`Remove ${analysisSelectedMeta[id]?.name || 'product'} from selection`}
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mb-8 p-4 sm:p-5 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-2xl border-2 border-blue-200 shadow-md">
                        <label className="flex items-start sm:items-center gap-3 sm:gap-4 cursor-pointer">
                          <input
                            type="checkbox"
                            id="includeGoogleData"
                            defaultChecked
                            className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 border-gray-300 rounded-lg focus:ring-orange-500 focus:ring-4 cursor-pointer mt-1 sm:mt-0 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm sm:text-base font-bold text-gray-900 block mb-1">Include Google Search Analysis</span>
                            <span className="text-xs sm:text-sm text-gray-600">Uses SerpAPI to analyze search visibility and competitor data (requires SERPAPI_KEY)</span>
                          </div>
                        </label>
                      </div>

                      <div className="flex justify-center px-4">
                        <button
                          onClick={async () => {
                            const includeGoogle = (document.getElementById('includeGoogleData') as HTMLInputElement)?.checked ?? true;
                            const selectedIds = analysisSelectedIds;
                            if (selectedIds.length === 0) {
                              toast.error('Please select at least one product');
                              return;
                            }

                            try {
                              toast.loading('Analyzing products with SerpAPI...', { id: 'analyze-etsy' });
                              const response = await fetch('/api/admin/products/analyze-etsy', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  productIds: selectedIds,
                                  includeGoogleData: includeGoogle
                                })
                              });

                              const data = await response.json();
                              if (!response.ok) throw new Error(data.error || 'Analysis failed');

                              // Store results in a modal or expandable section
                              const resultsDiv = document.getElementById('etsyAnalysisResults');
                              if (resultsDiv) {
                                // Define tag generation function if not already defined
                                if (!(window as any).generateTagsForProduct) {
                                  (window as any).generateTagsForProduct = async function (productId: any, button: any) {
                                    const originalText = button.innerHTML;
                                    button.disabled = true;
                                    button.innerHTML = '<div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent inline-block"></div> Generating...';

                                    try {
                                      const token = localStorage.getItem('token');
                                      if (!token) {
                                        alert('Authentication required');
                                        button.innerHTML = originalText;
                                        button.disabled = false;
                                        return;
                                      }

                                      const url = '/api/products/' + productId + '/generate-tags';
                                      const response = await fetch(url, {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'Authorization': 'Bearer ' + token
                                        },
                                        body: JSON.stringify({ useSerpAPI: true })
                                      });

                                      const data = await response.json();
                                      if (!response.ok) throw new Error(data.error || 'Failed to generate tags');

                                      const addedCount = data.added?.length || 0;
                                      const totalTags = data.tags?.length || 0;
                                      const message = 'Generated ' + addedCount + ' new tags. Total: ' + totalTags + '/13';

                                      if (typeof toast !== 'undefined') {
                                        toast.success(message, { id: 'generate-tags' });
                                      } else {
                                        alert(message);
                                      }

                                      button.innerHTML = originalText;
                                      button.disabled = false;

                                      // Reload page to show updated tags
                                      setTimeout(() => window.location.reload(), 1000);
                                    } catch (error) {
                                      const errorMessage = error instanceof Error ? error.message : 'Failed to generate tags';
                                      if (typeof toast !== 'undefined') {
                                        toast.error(errorMessage, { id: 'generate-tags' });
                                      } else {
                                        alert(errorMessage);
                                      }
                                      button.innerHTML = originalText;
                                      button.disabled = false;
                                    }
                                  };
                                }

                                resultsDiv.innerHTML = `
                          <div class="mt-10 space-y-10">
                            <!-- Analysis Summary Section -->
                            <div class="bg-gradient-to-br from-white via-gray-50 to-white p-10 rounded-3xl shadow-2xl border-2 border-gray-200">
                              <div class="flex items-center gap-4 mb-8">
                                <div class="p-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-xl">
                                  <BarChart3 class="h-7 w-7 text-white" />
                                </div>
                                <h3 class="text-3xl font-black text-gray-900 tracking-tight">Analysis</h3>
                              </div>
                              
                              <!-- Key Metrics Grid -->
                              <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                                <div class="bg-white p-6 rounded-2xl border-2 border-gray-300 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                                  <p class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Total Products</p>
                                  <p class="text-5xl font-black text-gray-900 leading-none">${data.summary.totalProducts}</p>
                                </div>
                                <div class="bg-white p-6 rounded-2xl border-2 ${data.summary.averageScore >= 80 ? 'border-green-400' : data.summary.averageScore >= 60 ? 'border-yellow-400' : 'border-red-400'} shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                                  <p class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Avg Score</p>
                                  <div class="flex items-baseline gap-1">
                                    <p class="text-5xl font-black ${data.summary.averageScore >= 80 ? 'text-green-600' : data.summary.averageScore >= 60 ? 'text-yellow-600' : 'text-red-600'} leading-none">${data.summary.averageScore}</p>
                                    <p class="text-xl font-bold text-gray-400">/100</p>
                                  </div>
                                </div>
                                <div class="bg-white p-6 rounded-2xl border-2 border-orange-300 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                                  <p class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Total Issues</p>
                                  <p class="text-5xl font-black text-orange-600 leading-none">${data.summary.totalIssues}</p>
                                </div>
                                <div class="bg-white p-6 rounded-2xl border-2 border-red-400 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                                  <p class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Critical</p>
                                  <p class="text-5xl font-black text-red-600 leading-none">${data.summary.criticalIssues}</p>
                                </div>
                              </div>
                              
                              <!-- Compliance Rate by Category -->
                              ${data.summary.complianceRate ? `
                                <div class="pt-8 border-t-2 border-gray-300">
                                  <h4 class="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                                    <div class="p-2 bg-orange-100 rounded-lg">
                                      <Shield class="h-6 w-6 text-orange-600" />
                                    </div>
                                    <span>Compliance Rate by Category</span>
                                  </h4>
                                  <div class="grid grid-cols-3 md:grid-cols-6 gap-4">
                                    ${['title', 'description', 'tags', 'images', 'pricing', 'seo'].map(cat => {
                                  const rate = data.summary.complianceRate[cat] || 0;
                                  const isCompliant = rate >= 80;
                                  return `
                                        <div class="text-center p-5 bg-white rounded-2xl border-2 ${isCompliant ? 'border-green-300 bg-green-50/50' : 'border-red-300 bg-red-50/50'} shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5">
                                          <p class="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">${cat.charAt(0).toUpperCase() + cat.slice(1)}</p>
                                          <p class="text-3xl font-black ${isCompliant ? 'text-green-600' : 'text-red-600'} leading-none">${Math.round(rate)}%</p>
                                        </div>
                                      `;
                                }).join('')}
                                  </div>
                                </div>
                              ` : ''}
                            </div>
                            
                            <!-- Product Analysis Results -->
                            <div>
                              <div class="flex items-center gap-4 mb-8">
                                <div class="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg">
                                  <Package class="h-6 w-6 text-white" />
                                </div>
                                <h3 class="text-3xl font-black text-gray-900 tracking-tight">Product Analysis</h3>
                              </div>
                              
                              <div class="space-y-6">
                                ${data.results.map((result: any, idx: number) => `
                                  <div class="bg-white border-2 ${result.score >= 80 ? 'border-green-400' : result.score >= 60 ? 'border-yellow-400' : 'border-red-400'} rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all">
                                    <!-- Product Header -->
                                    <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6 pb-6 border-b-2 border-gray-200">
                                      <div class="flex-1">
                                        <div class="flex items-center justify-between mb-4">
                                          <h4 class="font-black text-gray-900 text-2xl leading-tight">${result.productName}</h4>
                                          <button 
                                            onclick="generateTagsForProduct('${result.productId}', this)"
                                            class="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg text-sm font-bold flex items-center gap-2 whitespace-nowrap"
                                            title="Generate tags using SerpAPI"
                                          >
                                            <Tag class="h-4 w-4" />
                                            Generate Tags
                                          </button>
                                        </div>
                                        <div class="flex flex-wrap items-center gap-2">
                                          <div class="flex items-center gap-2 px-3 py-2 rounded-lg ${result.etsyCompliance.title ? 'bg-green-100 text-green-900 border-2 border-green-400' : 'bg-red-100 text-red-900 border-2 border-red-400'} shadow-sm whitespace-nowrap">
                                            <CheckCircle2 class="h-4 w-4 ${result.etsyCompliance.title ? 'text-green-700' : 'text-red-700'} shrink-0" />
                                            <span class="font-bold text-xs">Title</span>
                                          </div>
                                          <div class="flex items-center gap-2 px-3 py-2 rounded-lg ${result.etsyCompliance.description ? 'bg-green-100 text-green-900 border-2 border-green-400' : 'bg-red-100 text-red-900 border-2 border-red-400'} shadow-sm whitespace-nowrap">
                                            <CheckCircle2 class="h-4 w-4 ${result.etsyCompliance.description ? 'text-green-700' : 'text-red-700'} shrink-0" />
                                            <span class="font-bold text-xs">Description</span>
                                          </div>
                                          <div class="flex items-center gap-2 px-3 py-2 rounded-lg ${result.etsyCompliance.tags ? 'bg-green-100 text-green-900 border-2 border-green-400' : 'bg-red-100 text-red-900 border-2 border-red-400'} shadow-sm whitespace-nowrap">
                                            <CheckCircle2 class="h-4 w-4 ${result.etsyCompliance.tags ? 'text-green-700' : 'text-red-700'} shrink-0" />
                                            <span class="font-bold text-xs">Tags</span>
                                          </div>
                                          <div class="flex items-center gap-2 px-3 py-2 rounded-lg ${result.etsyCompliance.images ? 'bg-green-100 text-green-900 border-2 border-green-400' : 'bg-red-100 text-red-900 border-2 border-red-400'} shadow-sm whitespace-nowrap">
                                            <CheckCircle2 class="h-4 w-4 ${result.etsyCompliance.images ? 'text-green-700' : 'text-red-700'} shrink-0" />
                                            <span class="font-bold text-xs">Images</span>
                                          </div>
                                          <div class="flex items-center gap-2 px-3 py-2 rounded-lg ${result.etsyCompliance.pricing ? 'bg-green-100 text-green-900 border-2 border-green-400' : 'bg-red-100 text-red-900 border-2 border-red-400'} shadow-sm whitespace-nowrap">
                                            <CheckCircle2 class="h-4 w-4 ${result.etsyCompliance.pricing ? 'text-green-700' : 'text-red-700'} shrink-0" />
                                            <span class="font-bold text-xs">Pricing</span>
                                          </div>
                                          <div class="flex items-center gap-2 px-3 py-2 rounded-lg ${result.etsyCompliance.seo ? 'bg-green-100 text-green-900 border-2 border-green-400' : 'bg-red-100 text-red-900 border-2 border-red-400'} shadow-sm whitespace-nowrap">
                                            <CheckCircle2 class="h-4 w-4 ${result.etsyCompliance.seo ? 'text-green-700' : 'text-red-700'} shrink-0" />
                                            <span class="font-bold text-xs">SEO</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div class="px-6 py-5 rounded-2xl ${result.score >= 80 ? 'bg-gradient-to-br from-green-100 to-green-50 text-green-900 border-2 border-green-400' : result.score >= 60 ? 'bg-gradient-to-br from-yellow-100 to-yellow-50 text-yellow-900 border-2 border-yellow-400' : 'bg-gradient-to-br from-red-100 to-red-50 text-red-900 border-2 border-red-400'} shadow-lg">
                                        <p class="text-xs font-black uppercase tracking-widest mb-2">Score</p>
                                        <div class="flex items-baseline gap-1">
                                          <p class="text-4xl font-black">${result.score}</p>
                                          <p class="text-base font-bold opacity-70">/100</p>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <!-- Issues Section -->
                                    ${result.issues.length > 0 ? `
                                      <div class="space-y-4">
                                        ${result.issues.map((issue: any, issueIdx: number) => `
                                          <div class="p-5 rounded-2xl border-l-4 ${issue.severity === 'error' ? 'bg-red-50 border-red-500' : issue.severity === 'warning' ? 'bg-yellow-50 border-yellow-500' : 'bg-blue-50 border-blue-500'} shadow-md">
                                            <div class="flex items-start gap-4">
                                              <div class="p-3 rounded-xl ${issue.severity === 'error' ? 'bg-red-100' : issue.severity === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'} shrink-0 shadow-sm">
                                                <AlertTriangle class="h-6 w-6 ${issue.severity === 'error' ? 'text-red-600' : issue.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600'}" />
                                              </div>
                                              <div class="flex-1 min-w-0">
                                                <div class="flex items-center gap-2 mb-3 flex-wrap">
                                                  <span class="px-3 py-1.5 rounded-lg text-xs font-black uppercase whitespace-nowrap ${issue.severity === 'error' ? 'bg-red-200 text-red-900 border-2 border-red-400' : issue.severity === 'warning' ? 'bg-yellow-200 text-yellow-900 border-2 border-yellow-400' : 'bg-blue-200 text-blue-900 border-2 border-blue-400'}">
                                                    ${issue.category}
                                                  </span>
                                                  <span class="text-xs font-bold text-gray-700 px-2.5 py-1.5 bg-gray-200 rounded-md border border-gray-300 whitespace-nowrap">${issue.severity}</span>
                                                </div>
                                                <p class="text-base font-bold ${issue.severity === 'error' ? 'text-red-900' : issue.severity === 'warning' ? 'text-yellow-900' : 'text-blue-900'} mb-3 leading-relaxed">
                                                  ${issue.message}
                                                </p>
                                                ${issue.found && issue.found.length > 0 ? `
                                                  <div class="mb-3 p-3 bg-white/60 rounded-lg border border-gray-200">
                                                    <p class="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Found:</p>
                                                    <div class="flex flex-wrap gap-2">
                                                      ${issue.found.slice(0, 3).map((item: string) => `
                                                        <span class="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-lg text-xs font-mono border border-gray-300">${item.substring(0, 30)}${item.length > 30 ? '...' : ''}</span>
                                                      `).join('')}
                                                      ${issue.found.length > 3 ? `<span class="px-3 py-1.5 bg-gray-300 text-gray-900 rounded-lg text-xs font-bold border-2 border-gray-400">+${issue.found.length - 3} more</span>` : ''}
                                                    </div>
                                                  </div>
                                                ` : ''}
                                                <div class="mt-4 pt-4 border-t-2 ${issue.severity === 'error' ? 'border-red-200' : issue.severity === 'warning' ? 'border-yellow-200' : 'border-blue-200'}">
                                                  <p class="text-sm text-gray-800 leading-relaxed">
                                                    <span class="font-black text-gray-900">💡 Recommendation:</span> ${issue.recommendation}
                                                  </p>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        `).join('')}
                                      </div>
                                    ` : `
                                      <div class="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl shadow-lg">
                                        <div class="flex items-center gap-4">
                                          <div class="p-3 bg-green-100 rounded-xl shadow-sm">
                                            <CheckCircle2 class="h-7 w-7 text-green-600" />
                                          </div>
                                          <div>
                                            <p class="text-base font-black text-green-900">✓ All Clear!</p>
                                            <p class="text-sm text-green-700 mt-1 font-medium">This product meets all Etsy seller handbook guidelines.</p>
                                          </div>
                                        </div>
                                      </div>
                                    `}
                                  </div>
                                `).join('')}
                              </div>
                            </div>
                          </div>
                        `;
                                resultsDiv.style.display = 'block';
                                resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                              }
                              toast.success(`Analysis complete! Found ${data.summary.totalIssues} issues across ${data.summary.totalProducts} products`, { id: 'analyze-etsy' });
                            } catch (error) {
                              toast.error(error instanceof Error ? error.message : 'Analysis failed', { id: 'analyze-etsy' });
                            }
                          }}
                          className="w-full sm:w-auto px-6 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white rounded-2xl hover:from-orange-600 hover:via-red-600 hover:to-pink-600 transition-all duration-200 shadow-2xl hover:shadow-3xl font-black text-base sm:text-xl flex items-center justify-center gap-2 sm:gap-3 transform hover:-translate-y-1"
                        >
                          <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
                          <span className="text-center">Analyze Products with SerpAPI</span>
                        </button>
                      </div>
                      <div id="etsyAnalysisResults" className="hidden mt-10"></div>
                    </div>
                  </div>
                  {/* Etsy Connection */}
                  <div className="bg-white rounded-lg shadow-sm border border-purple-100">
                    <div className="p-6 border-b border-purple-100 bg-gradient-to-r from-purple-50/40 to-pink-50/30">
                      <h2 className="text-xl font-semibold text-purple-900">Etsy Shop Connection</h2>
                      <p className="text-purple-700/80 mt-1 text-sm">Connect your Etsy shop to sync products, orders, and inventory.</p>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">Connect to Etsy</h3>
                          <p className="text-gray-600 mt-1">Authorize access to your Etsy shop to enable product and order synchronization.</p>
                        </div>
                        <a
                          href="/api/etsy/auth"
                          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          Connect Etsy Shop
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Sync Controls */}
                  <div className="bg-white rounded-lg shadow-sm border border-purple-100">
                    <div className="p-6 border-b border-purple-100 bg-gradient-to-r from-purple-50/40 to-pink-50/30">
                      <h2 className="text-xl font-semibold text-purple-900">Sync Controls</h2>
                      <p className="text-purple-700/80 mt-1 text-sm">Manually trigger synchronization between your store and Etsy.</p>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/etsy/sync', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ type: 'listings', shopId: 'your-shop-id' })
                              });
                              const result = await response.json();
                              if (result.success) {
                                toast.success('Listings synced successfully');
                              } else {
                                toast.error('Failed to sync listings');
                              }
                            } catch (error) {
                              toast.error('Sync failed');
                            }
                          }}
                          className="p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                        >
                          <Package className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                          <h3 className="font-medium text-gray-900">Sync Listings</h3>
                          <p className="text-sm text-gray-600 mt-1">Sync products from Etsy to your store</p>
                        </button>

                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/etsy/sync', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ type: 'orders', shopId: 'your-shop-id' })
                              });
                              const result = await response.json();
                              if (result.success) {
                                toast.success('Orders synced successfully');
                              } else {
                                toast.error('Failed to sync orders');
                              }
                            } catch (error) {
                              toast.error('Sync failed');
                            }
                          }}
                          className="p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                        >
                          <ShoppingCart className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                          <h3 className="font-medium text-gray-900">Sync Orders</h3>
                          <p className="text-sm text-gray-600 mt-1">Import orders from Etsy to your store</p>
                        </button>

                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/etsy/sync', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ type: 'inventory', shopId: 'your-shop-id' })
                              });
                              const result = await response.json();
                              if (result.success) {
                                toast.success('Inventory synced successfully');
                              } else {
                                toast.error('Failed to sync inventory');
                              }
                            } catch (error) {
                              toast.error('Sync failed');
                            }
                          }}
                          className="p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                        >
                          <RefreshCw className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                          <h3 className="font-medium text-gray-900">Sync Inventory</h3>
                          <p className="text-sm text-gray-600 mt-1">Update stock levels across platforms</p>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Product Sync */}
                  <div className="bg-white rounded-lg shadow-sm border border-purple-100">
                    <div className="p-6 border-b border-purple-100 bg-gradient-to-r from-purple-50/40 to-pink-50/30">
                      <h2 className="text-xl font-semibold text-purple-900">Product Sync to Etsy</h2>
                      <p className="text-purple-700/80 mt-1 text-sm">Sync your store products to Etsy listings.</p>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                          <SelectField
                            value={etsySyncProductId}
                            options={etsyProductOptions}
                            isOpen={etsySyncProductOpen}
                            onOpenChange={setEtsySyncProductOpen}
                            onSelect={(val) => setEtsySyncProductId(val)}
                            placeholder="Select a product to sync"
                            className="flex-1 min-w-[240px]"
                            disabled={!etsyProductOptions.length}
                          />
                          <SelectField
                            value={etsySyncAction}
                            options={ETSY_SYNC_ACTION_OPTIONS}
                            isOpen={etsySyncActionOpen}
                            onOpenChange={setEtsySyncActionOpen}
                            onSelect={(val) => setEtsySyncAction(val as 'create' | 'update' | 'delete')}
                            className="w-full sm:w-56"
                          />
                          <button className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-2 text-center text-white transition-all duration-200 shadow-sm hover:from-purple-700 hover:to-purple-800 hover:shadow-md lg:w-auto">
                            Sync to Etsy
                          </button>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>• <strong>Create:</strong> Upload a new product to Etsy</p>
                          <p>• <strong>Update:</strong> Modify an existing Etsy listing</p>
                          <p>• <strong>Delete:</strong> Remove a product from Etsy</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CSV Export for Etsy */}
                  <div className="bg-white rounded-lg shadow-sm border border-purple-100">
                    <div className="p-6 border-b border-purple-100 bg-gradient-to-r from-purple-50/40 to-pink-50/30">
                      <h2 className="text-xl font-semibold text-purple-900">Export Products for Etsy</h2>
                      <p className="text-purple-700/80 mt-1 text-sm">Export your products as CSV file for Etsy bulk import.</p>
                    </div>
                    <div className="p-6">
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:flex-wrap">
                            <SelectField
                              value={etsyExportCategory}
                              options={ETSY_EXPORT_CATEGORY_OPTIONS}
                              isOpen={etsyExportCategoryOpen}
                              onOpenChange={setEtsyExportCategoryOpen}
                              onSelect={setEtsyExportCategory}
                              className="w-full sm:w-56"
                            />
                            <SelectField
                              value={etsyExportLimit}
                              options={ETSY_EXPORT_LIMIT_OPTIONS}
                              isOpen={etsyExportLimitOpen}
                              onOpenChange={setEtsyExportLimitOpen}
                              onSelect={setEtsyExportLimit}
                              className="w-full sm:w-56"
                            />
                            {etsyExportLimit === 'custom' && (
                              <input
                                type="number"
                                min="1"
                                max="1000"
                                value={etsyExportCustomLimit}
                                onChange={(e) => setEtsyExportCustomLimit(e.target.value)}
                                placeholder="Custom limit (1-1000)"
                                className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm text-gray-700 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 sm:w-48"
                              />
                            )}
                            <button
                              onClick={async () => {
                                try {
                                  let customLimitValue = etsyExportCustomLimit.trim();
                                  if (etsyExportLimit === 'custom') {
                                    const numeric = Number(customLimitValue);
                                    if (!customLimitValue || Number.isNaN(numeric) || numeric < 1 || numeric > 1000) {
                                      toast.error('Enter a custom limit between 1 and 1000');
                                      return;
                                    }
                                    customLimitValue = String(Math.floor(numeric));
                                  } else {
                                    customLimitValue = '';
                                  }

                                  // Build query parameters
                                  const params = new URLSearchParams({
                                    category: etsyExportCategory,
                                    limit: etsyExportLimit
                                  });

                                  if (etsyExportLimit === 'custom' && customLimitValue) {
                                    params.set('customLimit', customLimitValue);
                                  }

                                  const response = await fetch(`/api/admin/etsy-export?${params.toString()}`);

                                  if (!response.ok) {
                                    const errorData = await response.json();
                                    throw new Error(errorData.error || 'Export failed');
                                  }

                                  const blob = await response.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;

                                  // Set filename based on category and limit
                                  const exportFinalLimit =
                                    etsyExportLimit === 'custom'
                                      ? customLimitValue
                                      : etsyExportLimit;

                                  let filename = 'etsy-products-export.csv';
                                  if (etsyExportCategory === 'all') {
                                    filename = `etsy-products-export-${exportFinalLimit}-${new Date().toISOString().split('T')[0]}.csv`;
                                  } else {
                                    filename = `etsy-${etsyExportCategory}-products-${exportFinalLimit}-${new Date().toISOString().split('T')[0]}.csv`;
                                  }

                                  a.download = filename;
                                  document.body.appendChild(a);
                                  a.click();
                                  window.URL.revokeObjectURL(url);
                                  document.body.removeChild(a);

                                  toast.success(`CSV file downloaded successfully! Exported ${exportFinalLimit} products.`);
                                  await fetchProducts();
                                } catch (error) {
                                  console.error('Export error:', error);
                                  toast.error(error instanceof Error ? error.message : 'Failed to export products');
                                }
                              }}
                              className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2"
                            >
                              <Download className="h-4 w-4" />
                              <span>Export CSV</span>
                            </button>
                          </div>

                          {/* Enhanced Product Selection */}
                          <div className="border-t border-purple-100 pt-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-medium text-gray-900">Select Specific Products</h3>
                              <button
                                onClick={() => fetchProducts()}
                                className="text-sm text-purple-600 hover:text-purple-800 flex items-center space-x-2 px-3 py-1 rounded-lg hover:bg-purple-50 transition-colors"
                              >
                                <RefreshCw className="h-4 w-4" />
                                <span>Refresh Products</span>
                              </button>
                            </div>
                            {renderEtsyPaginationControls('Export list pagination')}

                            {/* Product Grid */}
                            <div className="space-y-4">
                              {loading ? (
                                <div className="flex items-center justify-center py-8">
                                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                                  <span className="ml-2 text-gray-600">Loading products...</span>
                                </div>
                              ) : products.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                  <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                  <p>No products found</p>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                                  {products.map((product) => (
                                    <div
                                      key={product._id}
                                      className={`group relative rounded-lg p-4 transition-all duration-200 cursor-pointer ${selectedProductIds.includes(product._id)
                                        ? 'bg-purple-50 border-2 border-purple-300 shadow-md'
                                        : 'bg-white border border-gray-200 hover:border-purple-300 hover:shadow-md'
                                        }`}
                                      onClick={() => {
                                        setSelectedProductForModal(product);
                                        setShowProductModal(true);
                                      }}
                                    >
                                      <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0">
                                          <img
                                            src={product.image || '/placeholder-product.svg'}
                                            alt={product.name}
                                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).src = '/placeholder-product.svg';
                                            }}
                                          />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-purple-700 transition-colors">
                                            {product.name}
                                          </h4>
                                          <p className="text-lg font-semibold text-green-600 mt-1">
                                            ${product.price}
                                          </p>
                                          <div className="flex items-center space-x-2 mt-2">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                              {product.category}
                                            </span>
                                            {product.originalPrice && product.originalPrice > product.price && (
                                              <span className="text-xs text-gray-500 line-through">
                                                ${product.originalPrice}
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center space-x-1 mt-2">
                                            <div className="flex items-center">
                                              {[...Array(5)].map((_, i) => (
                                                <svg
                                                  key={i}
                                                  className={`h-3 w-3 ${i < Math.floor(product.rating || 0)
                                                    ? 'text-yellow-400'
                                                    : 'text-gray-300'
                                                    }`}
                                                  fill="currentColor"
                                                  viewBox="0 0 20 20"
                                                >
                                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                              ))}
                                              <span className="text-xs text-gray-500 ml-1">
                                                ({product.reviewCount || 0})
                                              </span>
                                            </div>
                                          </div>
                                          <div className="mt-2 flex items-center justify-between">
                                            <span className={`text-xs px-2 py-1 rounded-full ${product.inStock
                                              ? 'bg-green-100 text-green-800'
                                              : 'bg-red-100 text-red-800'
                                              }`}>
                                              {product.inStock ? `In Stock (${product.stockCount || 0})` : 'Out of Stock'}
                                            </span>
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                              <input
                                                type="checkbox"
                                                checked={selectedProductIds.includes(product._id)}
                                                onChange={(e) => {
                                                  e.stopPropagation();
                                                  handleProductSelection(product._id);
                                                }}
                                                className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                                              />
                                              <span className="text-xs text-purple-600 font-medium">
                                                Select
                                              </span>
                                            </label>
                                            {isSuperAdmin && (
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleToggleEtsyExport(product._id, !product.etsyExported);
                                                }}
                                                disabled={!!etsyExportLoading[product._id]}
                                                className={`inline-flex items-center space-x-1 rounded-full border px-2 py-1 text-xs font-medium transition-colors ${product.etsyExported
                                                  ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                                  } ${etsyExportLoading[product._id] ? 'opacity-60 cursor-not-allowed' : ''}`}
                                              >
                                                {etsyExportLoading[product._id] ? (
                                                  <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                  <CheckCircle
                                                    className={`h-3 w-3 ${product.etsyExported ? 'text-green-600' : 'text-gray-400'
                                                      }`}
                                                  />
                                                )}
                                                <span>{product.etsyExported ? 'Exported' : 'Mark exported'}</span>
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>


                            {/* Action Buttons */}
                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-3">
                                  <button
                                    onClick={handleSelectAll}
                                    className="px-4 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center space-x-2"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Select All</span>
                                  </button>
                                  <button
                                    onClick={handleClearAll}
                                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                                  >
                                    <XCircle className="h-4 w-4" />
                                    <span>Clear All</span>
                                  </button>
                                </div>

                                {/* Selected Products Counter */}
                                <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                                  <Package className="h-4 w-4 text-blue-600" />
                                  <div className="text-sm font-medium text-blue-900">
                                    {selectedProductIds.length} product{selectedProductIds.length !== 1 ? 's' : ''} selected
                                    {selectedProductIds.length === 1 && (
                                      <div className="text-xs text-blue-700 mt-1">
                                        File: {(() => {
                                          const product = products.find(p => p._id === selectedProductIds[0]);
                                          if (product) {
                                            const productName = product.name || 'product';
                                            const sanitized = productName
                                              .replace(/[^a-zA-Z0-9\s-_]/g, '')
                                              .replace(/\s+/g, '-')
                                              .substring(0, 30);
                                            return `etsy-${sanitized}.csv`;
                                          }
                                          return 'etsy-product.csv';
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={async () => {
                                  try {
                                    if (selectedProductIds.length === 0) {
                                      toast.error('Please select at least one product');
                                      return;
                                    }

                                    const params = new URLSearchParams({
                                      productIds: selectedProductIds.join(',')
                                    });

                                    // If single product selected, pass the product name as filename
                                    if (selectedProductIds.length === 1) {
                                      const selectedProduct = products.find(p => p._id === selectedProductIds[0]);
                                      if (selectedProduct) {
                                        params.set('filename', selectedProduct.name || 'product');
                                      }
                                    }

                                    const response = await fetch(`/api/admin/etsy-export?${params.toString()}`);

                                    if (!response.ok) {
                                      const errorData = await response.json();
                                      throw new Error(errorData.error || 'Export failed');
                                    }

                                    const blob = await response.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;

                                    // Set filename based on selection
                                    let filename = 'etsy-products-export.csv';
                                    if (selectedProductIds.length === 1) {
                                      const selectedProduct = products.find(p => p._id === selectedProductIds[0]);
                                      if (selectedProduct) {
                                        const productName = selectedProduct.name || 'product';
                                        const sanitized = productName
                                          .replace(/[^a-zA-Z0-9\s-_]/g, '')
                                          .replace(/\s+/g, '-')
                                          .substring(0, 50);
                                        filename = `etsy-${sanitized}.csv`;
                                      }
                                    } else if (selectedProductIds.length > 1) {
                                      filename = `etsy-products-export-${new Date().toISOString().split('T')[0]}.csv`;
                                    }

                                    a.download = filename;
                                    document.body.appendChild(a);
                                    a.click();
                                    window.URL.revokeObjectURL(url);
                                    document.body.removeChild(a);

                                    const productCount = selectedProductIds.length;
                                    const message = productCount === 1
                                      ? `CSV file downloaded successfully! Exported "${products.find(p => p._id === selectedProductIds[0])?.name || 'product'}"`
                                      : `CSV file downloaded successfully! Exported ${productCount} selected products.`;
                                    toast.success(message);
                                    setSelectedProductIds([]);
                                    await fetchProducts();
                                  } catch (error) {
                                    console.error('Export error:', error);
                                    toast.error(error instanceof Error ? error.message : 'Failed to export selected products');
                                  }
                                }}
                                disabled={selectedProductIds.length === 0}
                                className={`px-6 py-3 rounded-lg transition-all duration-200 shadow-sm flex items-center space-x-2 ${selectedProductIds.length === 0
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-md'
                                  }`}
                              >
                                <Download className="h-5 w-5" />
                                <span>
                                  {selectedProductIds.length === 1
                                    ? `Export "${products.find(p => p._id === selectedProductIds[0])?.name || 'Product'}"`
                                    : `Export Selected Products (${selectedProductIds.length})`
                                  }
                                </span>
                              </button>
                            </div>

                            <p className="text-xs text-gray-500 mt-3 text-center">
                              Click on any product to view details • Use checkboxes to select/deselect individual products
                            </p>
                          </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h3 className="font-medium text-blue-900 mb-2">Export Information</h3>
                          <div className="text-sm text-blue-800 space-y-1">
                            <p>• <strong>Format:</strong> Etsy-compatible CSV with all required fields</p>
                            <p>• <strong>Fields included:</strong> Title, Description, Category, Price, Images, Tags, etc.</p>
                            <p>• <strong>Variants:</strong> Product variations will be included as separate rows</p>
                            <p>• <strong>Images:</strong> Up to 10 product images per listing</p>
                            <p>• <strong>Ready to import:</strong> Download and upload directly to Etsy</p>
                            <p>• <strong>Custom limit:</strong> Enter any number between 1-1000 products</p>
                          </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h3 className="font-medium text-yellow-900 mb-2">Before Importing to Etsy</h3>
                          <div className="text-sm text-yellow-800 space-y-1">
                            <p>• Review and edit product descriptions for Etsy compliance</p>
                            <p>• Verify all images are high-quality and meet Etsy standards</p>
                            <p>• Check pricing and shipping information</p>
                            <p>• Ensure tags are relevant and within Etsy's guidelines</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sync Status */}
                  <div className="bg-white rounded-lg shadow-sm border border-purple-100">
                    <div className="p-6 border-b border-purple-100 bg-gradient-to-r from-purple-50/40 to-pink-50/30">
                      <h2 className="text-xl font-semibold text-purple-900">Sync Status</h2>
                      <p className="text-purple-700/80 mt-1 text-sm">Monitor the status of your Etsy integration.</p>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="font-medium text-green-900">Shop Connected</p>
                                <p className="text-sm text-green-700">Etsy shop is connected and active</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Package className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="font-medium text-blue-900">Listings Synced</p>
                                <p className="text-sm text-blue-700">12 products synced to Etsy</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Clock className="h-5 w-5 text-yellow-600" />
                              <div>
                                <p className="font-medium text-yellow-900">Last Sync</p>
                                <p className="text-sm text-yellow-700">2 hours ago</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <ShoppingCart className="h-5 w-5 text-purple-600" />
                              <div>
                                <p className="font-medium text-purple-900">Orders Pending</p>
                                <p className="text-sm text-purple-700">3 orders to sync</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Marketing & Performance Aggregated Tab */}
              {activeTab === 'marketing' && (
                <div className="space-y-8">
                  {/* Sub-navigation for grouped features (moved to top) */}
                  <div className="bg-white rounded-lg shadow-sm border border-blue-100">
                    <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50/40 to-indigo-50/30">
                      <h2 className="text-xl font-semibold text-blue-900">More tools</h2>
                      <p className="text-blue-700/80 mt-1 text-sm">Access performance, analytics, Etsy integration, and SEO research.</p>
                    </div>
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
                      <button onClick={() => { setActiveTab('performance'); updateQuery({ tab: 'performance' }); }} className="px-3 py-2 border rounded hover:bg-gray-50 text-gray-700">Performance</button>
                      <button onClick={() => { setActiveTab('analytics'); updateQuery({ tab: 'analytics' }); }} className="px-3 py-2 border rounded hover:bg-gray-50 text-gray-700">Analytics</button>
                      <button onClick={() => { setActiveTab('etsy'); updateQuery({ tab: 'etsy' }); }} className="px-3 py-2 border rounded hover:bg-gray-50 text-gray-700">Etsy Integration</button>
                      <button onClick={() => { setActiveTab('seo'); updateQuery({ tab: 'seo' }); }} className="px-3 py-2 border rounded hover:bg-gray-50 text-gray-700">SEO Research</button>
                      <button onClick={() => { setActiveTab('seo-raw'); updateQuery({ tab: 'seo-raw' }); }} className="px-3 py-2 border rounded hover:bg-gray-50 text-gray-700">SEO Raw</button>
                      <button onClick={() => { setActiveTab('analytics-seo' as any); updateQuery({ tab: 'analytics-seo' }); }} className="px-3 py-2 border rounded hover:bg-gray-50 text-gray-700">Google & Google Shopping Analytics</button>
                    </div>
                  </div>

                  {/* Email Campaigns */}
                  <div className="bg-white rounded-lg shadow-sm border border-blue-100">
                    <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50/40 to-indigo-50/30">
                      <h2 className="text-xl font-semibold text-blue-900">Email Campaigns</h2>
                      <p className="text-blue-700/80 mt-1 text-sm">Send a one-off campaign to a segment using the built-in mailer.</p>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-blue-800 mb-1">Subject</label>
                          <input value={campaignSubject} onChange={(e) => setCampaignSubject(e.target.value)}
                            className="w-full px-3 py-2 border border-blue-200 bg-blue-50/30 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Spring Sale starts now" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-800 mb-1">Plain Text</label>
                          <textarea value={campaignText} onChange={(e) => setCampaignText(e.target.value)} rows={3}
                            className="w-full px-3 py-2 border border-blue-200 bg-blue-50/30 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-800 mb-1">HTML</label>
                          <textarea value={campaignHtml} onChange={(e) => setCampaignHtml(e.target.value)} rows={8}
                            className="w-full px-3 py-2 border border-blue-200 bg-blue-50/30 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                        </div>
                        <button onClick={handleSendCampaign} disabled={sendingCampaign || !campaignSubject || !campaignHtml}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                          {sendingCampaign ? 'Sending…' : 'Send Campaign'}
                        </button>
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-blue-900">Segment Filters</h3>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" checked={segmentPurchased} onChange={(e) => setSegmentPurchased(e.target.checked)} />
                          <span className="text-sm text-blue-800">Has purchased before</span>
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-blue-800 mb-1">Min orders</label>
                            <input type="number" min={0} value={segmentMinOrders} onChange={(e) => setSegmentMinOrders(e.target.value === '' ? '' : Number(e.target.value))}
                              className="w-full px-3 py-2 border border-blue-200 bg-blue-50/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-blue-800 mb-1">Days since last login</label>
                            <input type="number" min={0} value={segmentDaysSinceLogin} onChange={(e) => setSegmentDaysSinceLogin(e.target.value === '' ? '' : Number(e.target.value))}
                              className="w-full px-3 py-2 border border-blue-200 bg-blue-50/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-800 mb-1">Category interest (contains)</label>
                          <input value={segmentCategory} onChange={(e) => setSegmentCategory(e.target.value)} placeholder="e.g. leather"
                            className="w-full px-3 py-2 border border-blue-200 bg-blue-50/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Referral & UTM */}
                  <div className="bg-white rounded-lg shadow-sm border border-blue-100">
                    <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50/40 to-indigo-50/30">
                      <h2 className="text-xl font-semibold text-blue-900">Referral & UTM</h2>
                      <p className="text-blue-700/80 mt-1 text-sm">Captured from URL and persisted to cookies for 90 days.</p>
                    </div>
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-semibold text-blue-900 mb-2">Current Attribution Cookies</h3>
                        <div className="border border-blue-100 rounded-lg divide-y divide-blue-100 bg-blue-50/20">
                          {getAttributionCookies().length ? getAttributionCookies().map(c => (
                            <div key={c.key} className="flex items-center justify-between px-3 py-2 text-sm">
                              <span className="text-blue-800">{c.key}</span>
                              <span className="font-mono text-blue-900">{c.value}</span>
                            </div>
                          )) : (
                            <div className="px-3 py-2 text-sm text-blue-700/80">No attribution cookies set yet.</div>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-blue-900 mb-2">Sample Referral Links</h3>
                        <div className="space-y-2 text-sm">
                          <a className="text-blue-700 hover:text-blue-800 underline break-all" href={`/?utm_source=newsletter&utm_medium=email&utm_campaign=spring`}>/?utm_source=newsletter&utm_medium=email&utm_campaign=spring</a>
                          <a className="text-blue-700 hover:text-blue-800 underline break-all" href={`/?ref=aff123&aff=partnerA`}>/?ref=aff123&aff=partnerA</a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SEO */}
                  <div className="bg-white rounded-lg shadow-sm border border-blue-100">
                    <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50/40 to-indigo-50/30">
                      <h2 className="text-xl font-semibold text-blue-900">SEO</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <a className="px-4 py-3 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100" href="/sitemap.xml" target="_blank" rel="noreferrer">View Sitemap</a>
                      <a className="px-4 py-3 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100" href="/robots.txt" target="_blank" rel="noreferrer">View robots.txt</a>
                      <a className="px-4 py-3 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100" href="/" target="_blank" rel="noreferrer">Open Homepage</a>
                    </div>
                  </div>

                  {/* Blog */}
                  <div className="bg-white rounded-lg shadow-sm border border-blue-100">
                    <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50/40 to-indigo-50/30">
                      <h2 className="text-xl font-semibold text-blue-900">Blog</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <a className="px-4 py-3 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100" href="/blog" target="_blank" rel="noreferrer">Open Blog</a>
                      <a className="px-4 py-3 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100" href="/blog/hello-world" target="_blank" rel="noreferrer">Sample Post</a>
                      <a className="px-4 py-3 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100" href="/rss.xml" target="_blank" rel="noreferrer">RSS Feed</a>
                    </div>
                  </div>

                  {/* End sub-navigation moved to top */}
                </div>
              )}

              {activeTab === 'email-tracking' && (
                <EmailTrackingDashboard />
              )}

              {/* SEO Research Tab (SerpAPI) */}
              {(activeTab as any) === 'seo' && (
                <div className="space-y-8">
                  {/* Keyword Research */}
                  <div className="bg-white rounded-lg shadow-sm border border-green-100">
                    <div className="p-6 border-b border-green-100 bg-gradient-to-r from-green-50/40 to-emerald-50/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-semibold text-green-900">SEO Research (SerpAPI)</h2>
                          <p className="text-green-700/80 mt-1 text-sm">Run live keyword lookups powered by SerpAPI. Your plan allows ~250 searches/month.</p>
                        </div>
                        <a href="/admin/seo-history" className="text-sm text-green-700 underline">Open SEO History</a>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-green-800 mb-2">Search Keywords</label>
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                placeholder="e.g. handmade jewelry, minimalist necklace, vintage ring"
                                value={keywordQuery}
                                onChange={(e) => setKeywordQuery(e.target.value)}
                                className="flex-1 px-3 py-2 border border-green-200 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              />
                              <button
                                onClick={searchKeywords}
                                disabled={seoLoading.keywords}
                                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
                              >
                                {seoLoading.keywords ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                              </button>
                              <button
                                onClick={searchProducts}
                                disabled={seoLoading.products}
                                className="px-4 py-2 bg-white text-green-700 border border-green-200 rounded-lg hover:bg-green-50 transition-all duration-200 disabled:opacity-50"
                                title="Fetch product cards from SerpAPI"
                              >
                                {seoLoading.products ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Products'}
                              </button>
                            </div>
                          </div>

                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <h3 className="font-medium text-green-900 mb-3">Results</h3>
                            <div className="space-y-2 text-sm max-h-72 overflow-y-auto">
                              {keywords.length > 0 ? (
                                keywords.map((k, idx) => (
                                  <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center p-2 rounded border border-green-100 bg-white">
                                    <div className="text-green-900 font-medium truncate">{k.keyword}</div>
                                    <div className="text-green-700">Vol: {k.searchVolume?.toLocaleString?.() || k.searchVolume}</div>
                                    <div className="text-green-700 capitalize">Comp: {k.competition}</div>
                                    <div className="text-green-700">Diff: {k.difficulty}</div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-green-700">Enter a keyword and click search to see suggestions.</div>
                              )}
                            </div>
                            <div className="mt-3">
                              <button
                                onClick={() => {
                                  if (keywords.length > 0) {
                                    const csvContent = keywords.map((k: any) => `${k.keyword},${k.searchVolume},${k.competition},${k.difficulty}`).join('\n');
                                    const blob = new Blob([`keyword,searchVolume,competition,difficulty\n${csvContent}`], { type: 'text/csv' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = 'serpapi_keywords.csv';
                                    a.click();
                                    URL.revokeObjectURL(url);
                                    toast.success('Exported keywords.csv');
                                  } else {
                                    toast.error('No keywords to export');
                                  }
                                }}
                                className="px-3 py-2 text-sm border border-green-200 text-green-700 rounded-lg hover:bg-green-50"
                              >
                                Export CSV
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Usage Tips */}
                        <div className="p-4 bg-white border border-green-200 rounded-lg">
                          <h3 className="font-semibold text-green-900 mb-2">How to use SerpAPI effectively</h3>
                          <ul className="list-disc pl-5 text-sm space-y-2 text-green-800">
                            <li><b>Start broad, then niche down</b>: try "handmade jewelry" → "minimalist gold necklace".</li>
                            <li><b>Use buyer intent terms</b>: include words like "custom", "personalized", "gift", "for women".</li>
                            <li><b>Mix seasonal terms</b>: "valentine necklace", "christmas ornament", "wedding favor".</li>
                            <li><b>Test synonyms</b>: "vintage" vs "retro", "eco-friendly" vs "sustainable".</li>
                            <li><b>Mind your quota</b>: you have ~250 searches/month; batch your research sessions.</li>
                            <li><b>Export and compare</b>: export CSV, sort by volume/difficulty to prioritize.</li>
                          </ul>
                          <div className="mt-4 text-xs text-green-700">
                            Tip: use 3–5 seed queries per session and iterate based on results to conserve quota.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product Results */}
                  <div className="bg-white rounded-lg shadow-sm border border-green-100">
                    <div className="p-6 border-b border-green-100 bg-gradient-to-r from-green-50/40 to-emerald-50/30">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h2 className="text-xl font-semibold text-green-900">Product Results</h2>
                          <p className="text-green-700/80 mt-1 text-sm">Live cards from SerpAPI immersive products for your query.</p>
                        </div>
                        {seoRawSnapshot ? (
                          <div className="text-right space-y-2 max-w-full md:max-w-2xl">
                            {seoRawSnapshot.engines?.google_shopping ? (
                              <details>
                                <summary className="cursor-pointer text-sm text-green-800">View raw SerpAPI (Google Shopping)</summary>
                                <pre className="mt-2 p-3 bg-green-50 border border-green-100 rounded text-xs overflow-auto whitespace-pre-wrap break-all max-h-80 text-black w-full max-w-full font-mono">{JSON.stringify(seoRawSnapshot.engines.google_shopping, null, 2)}</pre>
                              </details>
                            ) : null}
                            {seoRawSnapshot.engines?.google ? (
                              <details>
                                <summary className="cursor-pointer text-sm text-green-800">View raw SerpAPI (Google)</summary>
                                <pre className="mt-2 p-3 bg-green-50 border border-green-100 rounded text-xs overflow-auto whitespace-pre-wrap break-all max-h-80 text-black w-full max-w-full font-mono">{JSON.stringify(seoRawSnapshot.engines.google, null, 2)}</pre>
                              </details>
                            ) : (
                              // Fallback for older snapshots without engines
                              <details>
                                <summary className="cursor-pointer text-sm text-green-800">View raw SerpAPI snapshot</summary>
                                <pre className="mt-2 p-3 bg-green-50 border border-green-100 rounded text-xs overflow-auto whitespace-pre-wrap break-all max-h-80 text-black w-full max-w-full font-mono">{JSON.stringify(seoRawSnapshot, null, 2)}</pre>
                              </details>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="p-6">
                      {productsSeo.length === 0 ? (
                        <div className="text-green-700">Click Products to fetch product cards.</div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {productsSeo.map((p, i) => (
                            <div key={i} className="border border-green-200 rounded-lg overflow-hidden bg-white">
                              {p.thumbnail ? (
                                <img src={p.thumbnail} alt={p.title} className="w-full h-40 object-cover" />
                              ) : null}
                              <div className="p-3 space-y-1">
                                <div className="font-semibold text-green-900 line-clamp-2" title={p.title}>{p.title}</div>
                                <div className="text-sm text-green-700 flex items-center gap-2">
                                  {p.source ? <span className="px-2 py-0.5 bg-green-50 border border-green-200 rounded">{p.source}</span> : null}
                                  {typeof p.rating === 'number' ? <span>★ {p.rating}</span> : null}
                                  {typeof p.reviews === 'number' ? <span>({p.reviews})</span> : null}
                                </div>
                                <div className="text-sm text-green-800">
                                  {typeof p.price === 'number' ? `$${p.price.toFixed(2)}` : '—'}
                                  {typeof p.originalPrice === 'number' ? <span className="ml-2 line-through text-green-600/70">${p.originalPrice.toFixed(2)}</span> : null}
                                </div>
                                <div className="text-xs text-gray-600 break-all">
                                  <strong>link:</strong> {p.link || 'null'}
                                </div>
                                <div className="flex gap-2 text-xs">
                                  {p.link ? (
                                    <a className="text-green-700 underline" href={p.link} target="_blank" rel="noreferrer">View Product</a>
                                  ) : null}
                                  {p.productApiUrl ? (
                                    <a className="text-green-600 underline" href={p.productApiUrl} target="_blank" rel="noreferrer">Product API</a>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {seoRawSnapshot && (
                        <div className="mt-6">
                          <details className="bg-white border border-green-200 rounded-lg p-3">
                            <summary className="cursor-pointer text-sm text-green-800">View raw SerpAPI snapshot</summary>
                            <pre className="mt-2 p-3 bg-green-50 border border-green-100 rounded text-xs overflow-x-auto whitespace-pre-wrap break-words">{JSON.stringify(seoRawSnapshot, null, 2)}</pre>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Free SEO Audit (OG + PSI) */}
                  <div className="bg-white rounded-lg shadow-sm border border-green-100">
                    <div className="p-6 border-b border-green-100 bg-gradient-to-r from-green-50/40 to-emerald-50/30">
                      <h2 className="text-xl font-semibold text-green-900">Free SEO Audit</h2>
                      <p className="text-green-700/80 mt-1 text-sm">Check a URL for Open Graph meta and PageSpeed Insights (mobile) scores.</p>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="https://yourdomain.com/product/123"
                          className="flex-1 px-3 py-2 border border-green-200 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          value={keywordQuery}
                          onChange={(e) => setKeywordQuery(e.target.value)}
                        />
                        <button
                          onClick={async () => {
                            if (!keywordQuery.trim()) return;
                            setSeoLoading(prev => ({ ...prev, audit: true }));
                            try {
                              const res = await fetch(`/api/seo/audit?url=${encodeURIComponent(keywordQuery)}`);
                              const data = await res.json();
                              if (data.success) {
                                toast.success('Audit complete');
                                setSeoAudit(data);
                              } else {
                                toast.error('Audit failed');
                                setSeoAudit(null);
                              }
                            } catch (e) {
                              toast.error('Audit error');
                              setSeoAudit(null);
                            } finally {
                              setSeoLoading(prev => ({ ...prev, audit: false }));
                            }
                          }}
                          disabled={seoLoading.audit}
                          className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
                        >
                          {seoLoading.audit ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Audit'}
                        </button>
                      </div>
                      <div className="text-xs text-green-700">Tip: audit your top landing pages and best-selling product URLs.</div>

                      {seoAudit && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                            <div className="font-semibold text-green-900 mb-2">Open Graph</div>
                            <div className="text-sm text-green-800"><span className="font-medium">Title:</span> {seoAudit.og?.title || '—'}</div>
                            <div className="text-sm text-green-800"><span className="font-medium">Description:</span> {seoAudit.og?.description || '—'}</div>
                            {seoAudit.og?.image ? (
                              <img src={seoAudit.og.image} alt="og" className="mt-2 w-full h-28 object-cover rounded" />
                            ) : null}
                          </div>
                          <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                            <div className="font-semibold text-blue-900 mb-2">Lighthouse (Mobile)</div>
                            <div className="text-sm text-blue-800">SEO: {seoAudit.psi?.seo ?? '—'}</div>
                            <div className="text-sm text-blue-800">Performance: {seoAudit.psi?.performance ?? '—'}</div>
                            <div className="text-sm text-blue-800">Accessibility: {seoAudit.psi?.accessibility ?? '—'}</div>
                            <div className="text-sm text-blue-800">Best Practices: {seoAudit.psi?.bestPractices ?? '—'}</div>
                          </div>
                          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                            <div className="font-semibold text-gray-900 mb-2">Notes</div>
                            <div className="text-sm text-gray-700">Some marketplaces block PSI/OG. We apply a desktop user agent and HTML fallback for title/description. Use results directionally.</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* How this SEO page works */}
                  <div className="bg-white rounded-lg shadow-sm border border-green-100">
                    <div className="p-6 border-b border-green-100 bg-gradient-to-r from-green-50/40 to-emerald-50/30">
                      <h2 className="text-xl font-semibold text-green-900">How this SEO page works</h2>
                      <p className="text-green-700/80 mt-1 text-sm">Understand each section and the recommended workflow.</p>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                      <div className="space-y-2">
                        <div className="font-semibold text-green-900">1) Keyword Research</div>
                        <ul className="list-disc pl-5 space-y-1 text-green-800">
                          <li>Enter a seed term and click <b>Search</b>.</li>
                          <li>We call SerpAPI to fetch related searches.</li>
                          <li>Columns show volume, competition, and difficulty.</li>
                          <li>Export CSV to prioritize offline.</li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <div className="font-semibold text-green-900">2) Product Results</div>
                        <ul className="list-disc pl-5 space-y-1 text-green-800">
                          <li>Click <b>Products</b> to fetch product cards.</li>
                          <li>We try <b>google_shopping</b> first, then fallback.</li>
                          <li>Cards show title, source, price, rating, reviews.</li>
                          <li>If empty, broaden the query and try again.</li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <div className="font-semibold text-green-900">3) Decide & Save</div>
                        <ul className="list-disc pl-5 space-y-1 text-green-800">
                          <li>Use <b>Decision Helper</b> signals/cautions.</li>
                          <li>Click <b>Save Keywords & Products to DB</b>.</li>
                          <li>Check server logs for [SerpAPI] and [API] lines.</li>
                          <li>Quota tip: ~250 searches/month—batch sessions.</li>
                        </ul>
                      </div>
                    </div>
                    <div className="px-6 pb-6 flex gap-3">
                      <a href="/admin/seo-help" className="px-4 py-2 border border-green-200 text-green-700 rounded-lg hover:bg-green-50">Open Help Page</a>
                      <a href="/docs/SEO_RESEARCH_SERPAPI.md" className="px-4 py-2 border border-green-200 text-green-700 rounded-lg hover:bg-green-50">Read Full Docs</a>
                    </div>
                  </div>

                  {/* Decision Helper */}
                  <div className="bg-white rounded-lg shadow-sm border border-green-100">
                    <div className="p-6 border-b border-green-100 bg-gradient-to-r from-green-50/40 to-emerald-50/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-semibold text-green-900">Decision Helper</h2>
                          <p className="text-green-700/80 mt-1 text-sm">Assess which product niches to add and why.</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-green-700">Query</div>
                          <div className="text-sm font-medium text-green-900">{seoInsights.query || '—'}</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-green-50 border border-green-200 rounded">
                          <div className="text-xs text-green-700">Avg Volume</div>
                          <div className="text-lg font-semibold text-green-900">{seoInsights.metrics.avgVolume ? seoInsights.metrics.avgVolume.toLocaleString() : '—'}</div>
                        </div>
                        <div className="p-3 bg-green-50 border border-green-200 rounded">
                          <div className="text-xs text-green-700">Avg Difficulty</div>
                          <div className="text-lg font-semibold text-green-900">{seoInsights.metrics.avgDifficulty ?? '—'}</div>
                        </div>
                        <div className="p-3 bg-green-50 border border-green-200 rounded">
                          <div className="text-xs text-green-700">Avg Price</div>
                          <div className="text-lg font-semibold text-green-900">{seoInsights.metrics.avgPrice ? `$${seoInsights.metrics.avgPrice}` : '—'}</div>
                        </div>
                        <div className="p-3 bg-green-50 border border-green-200 rounded">
                          <div className="text-xs text-green-700">Score</div>
                          <div className="text-lg font-semibold text-green-900">{seoInsights.score}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                          <div className="font-semibold text-green-900 mb-1">Signals We Like</div>
                          <ul className="list-disc text-sm text-green-800 pl-5 space-y-1">
                            {seoInsights.signals.length ? seoInsights.signals.map((s: string, i: number) => (
                              <li key={i}>{s}</li>
                            )) : <li>No strong signals yet. Try broader seeds.</li>}
                          </ul>
                        </div>
                        <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                          <div className="font-semibold text-yellow-900 mb-1">Caution Flags</div>
                          <ul className="list-disc text-sm text-yellow-800 pl-5 space-y-1">
                            {seoInsights.cautions.length ? seoInsights.cautions.map((s: string, i: number) => (
                              <li key={i}>{s}</li>
                            )) : <li>None detected. Validate with more searches.</li>}
                          </ul>
                        </div>
                        <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                          <div className="font-semibold text-blue-900 mb-1">Recommended Action</div>
                          <div className="text-sm text-blue-800">{seoInsights.action}</div>
                        </div>
                      </div>
                      <div>
                        <button onClick={saveSeoData} className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm hover:shadow-md">
                          Save Keywords & Products to DB
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Past Searches */}
                  <div className="bg-white rounded-lg shadow-sm border border-green-100">
                    <div className="p-6 border-b border-green-100 bg-gradient-to-r from-green-50/40 to-emerald-50/30">
                      <div className="flex justify-between items-center">
                        <div>
                          <h2 className="text-xl font-semibold text-green-900">Past Searches</h2>
                          <p className="text-green-700/80 mt-1 text-sm">View your previous keyword and product research sessions.</p>
                        </div>
                        <button
                          onClick={fetchSeoHistory}
                          disabled={seoHistoryLoading}
                          className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
                        >
                          {seoHistoryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                          {seoHistoryLoading ? 'Loading...' : 'Load History'}
                        </button>
                      </div>
                    </div>
                    <div className="p-6">
                      {seoHistory.length === 0 ? (
                        <div className="text-center py-8 text-green-700">
                          <Clock className="h-12 w-12 mx-auto mb-4 text-green-400" />
                          <p>No past searches found. Start researching keywords to see your history here.</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {seoHistory.map((search, index) => (
                            <div key={index} className="border border-green-200 rounded-lg p-4 bg-green-50/30">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h3 className="font-semibold text-green-900">{search.query}</h3>
                                  <div className="text-sm text-green-700">
                                    {search.type === 'keywords' ? 'Keywords Research' : 'Products Research'} •
                                    {new Date(search.createdAt).toLocaleDateString()} •
                                    {search.resultsCount} results
                                  </div>
                                </div>
                                <div className="text-xs text-green-600">
                                  {new Date(search.createdAt).toLocaleTimeString()}
                                </div>
                              </div>

                              {(activeTab as any) === 'seo-raw' && (
                                <div className="bg-white rounded-lg shadow-sm border border-green-100">
                                  <div className="p-6 border-b border-green-100 bg-gradient-to-r from-green-50/40 to-emerald-50/30">
                                    <h2 className="text-xl font-semibold text-green-900">Search Saved SerpAPI Raw Data</h2>
                                    <p className="text-green-700/80 mt-1 text-sm">Find stored raw responses by product title, source, link, or keyword. Useful for auditing.</p>
                                  </div>
                                  <div className="p-6 space-y-4">
                                    <div className="flex flex-col md:flex-row gap-2">
                                      <input
                                        type="text"
                                        placeholder="Search term (product name, link, or keyword)"
                                        className="flex-1 px-3 py-2 border border-green-200 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        value={keywordQuery}
                                        onChange={(e) => setKeywordQuery(e.target.value)}
                                      />
                                      <button
                                        onClick={async () => {
                                          try {
                                            setSeoLoading(prev => ({ ...prev, rawSearch: true }));
                                            const res = await fetch(`/api/seo/raw-search?q=${encodeURIComponent(keywordQuery)}&limit=5`);
                                            const data = await res.json();
                                            if (data.success) {
                                              console.log('Raw search results:', data.items);
                                              console.log('First item allProducts:', data.items[0]?.allProducts?.slice(0, 3).map((p: any) => ({ title: p.title, link: p.link, productApiUrl: p.productApiUrl })));
                                              setSeoRawSnapshot(null); // reset header block; show per-result blocks
                                              setSeoHistory(h => h); // noop to trigger state usage
                                              (window as any).__rawSearchItems = data.items; // simple scratch area
                                              toast.success(`Found ${data.total} matching sessions`);
                                              setRawSearchItems(data.items || []);
                                            } else {
                                              toast.error('Search failed');
                                              setRawSearchItems([]);
                                            }
                                          } catch (e) {
                                            toast.error('Error searching raw data');
                                            setRawSearchItems([]);
                                          } finally {
                                            setSeoLoading(prev => ({ ...prev, rawSearch: false }));
                                          }
                                        }}
                                        disabled={seoLoading.rawSearch}
                                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
                                      >
                                        {seoLoading.rawSearch ? 'Searching…' : 'Search Raw Data'}
                                      </button>
                                    </div>

                                    {/* Results list */}
                                    {rawSearchItems && rawSearchItems.length > 0 ? (
                                      <div className="space-y-4">
                                        {rawSearchItems.map((item: any, idx: number) => (
                                          <div key={idx} className="border border-green-200 rounded-lg p-3">
                                            <div className="flex items-center justify-between gap-2">
                                              <div>
                                                <div className="text-sm text-green-800">Query</div>
                                                <div className="font-medium text-green-900">{item.query}</div>
                                              </div>
                                              <div className="text-xs text-green-600">{new Date(item.createdAt).toLocaleString()}</div>
                                            </div>
                                            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                                              <div className="p-2 bg-green-50 border border-green-100 rounded">
                                                <div className="text-xs text-green-700">Shopping matches</div>
                                                <div className="text-sm font-semibold text-green-900">{item.matches.shoppingCount}</div>
                                              </div>
                                              <div className="p-2 bg-green-50 border border-green-100 rounded">
                                                <div className="text-xs text-green-700">Google matches</div>
                                                <div className="text-sm font-semibold text-green-900">{item.matches.googleCount}</div>
                                              </div>
                                              <div className="p-2 bg-green-50 border border-green-100 rounded">
                                                <div className="text-xs text-green-700">DB products</div>
                                                <div className="text-sm font-semibold text-green-900">{item.matches.dbCount}</div>
                                              </div>
                                            </div>

                                            {/* Expandable raw JSON viewers */}
                                            <div className="mt-3 space-y-2">
                                              {item.rawResponse?.engines?.google_shopping && (
                                                <details>
                                                  <summary className="cursor-pointer text-sm text-green-800">Raw JSON: Google Shopping</summary>
                                                  <div className="mt-2 p-3 bg-green-50 border border-green-100 rounded text-xs overflow-auto whitespace-pre-wrap break-all max-h-80 text-black w-full max-w-full font-mono">
                                                    <JsonTree data={item.rawResponse.engines.google_shopping} />
                                                  </div>
                                                </details>
                                              )}
                                              {item.rawResponse?.engines?.google && (
                                                <details>
                                                  <summary className="cursor-pointer text-sm text-green-800">Raw JSON: Google</summary>
                                                  <div className="mt-2 p-3 bg-green-50 border border-green-100 rounded text-xs overflow-auto whitespace-pre-wrap break-all max-h-80 text-black w-full max-w-full font-mono">
                                                    <JsonTree data={item.rawResponse.engines.google} />
                                                  </div>
                                                </details>
                                              )}
                                            </div>

                                            {/* Deduplicated products from all sources */}
                                            {item.allProducts && item.allProducts.length > 0 && (
                                              <div className="mt-3">
                                                <div className="text-sm font-medium text-green-900 mb-2">All Products (Deduplicated) ({item.allProducts.length})</div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                                                  {item.allProducts.slice(0, 12).map((p: any, i: number) => (
                                                    <div key={i} className="border border-green-200 rounded-lg p-3 bg-white">
                                                      <div className="flex items-start gap-2">
                                                        {p.thumbnail ? <img src={p.thumbnail} alt={p.title} className="w-12 h-12 object-cover rounded" /> : null}
                                                        <div className="flex-1 min-w-0">
                                                          <div className="text-sm font-medium text-green-900 line-clamp-2">{p.title}</div>
                                                          <div className="text-xs text-green-600 mt-1">
                                                            {p.source} • {p.sourceType}
                                                            {p.price ? ` • $${p.price}` : ''}
                                                          </div>
                                                          <div className="mt-1 text-xs text-gray-600 break-all">
                                                            <strong>link:</strong> {p.link || 'null'}
                                                          </div>
                                                          <div className="mt-1 flex gap-1">
                                                            {p.link ? (
                                                              <a className="text-xs text-green-700 underline" href={p.link} target="_blank" rel="noreferrer">View</a>
                                                            ) : p.productApiUrl ? (
                                                              <a className="text-xs text-green-700 underline" href={p.productApiUrl} target="_blank" rel="noreferrer">View</a>
                                                            ) : (
                                                              <span className="text-xs text-gray-500">No link</span>
                                                            )}
                                                            {p.productApiUrl && p.link ? (
                                                              <a className="text-xs text-green-600 underline" href={p.productApiUrl} target="_blank" rel="noreferrer">API</a>
                                                            ) : null}
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}

                                            {/* Raw products from SerpAPI response */}
                                            {(item.rawProducts || item.rawResponse) && (
                                              <div className="mt-3 space-y-3">
                                                {/* Google Shopping Products */}
                                                {item.rawProducts.googleShopping && item.rawProducts.googleShopping.length > 0 && (
                                                  <div>
                                                    <div className="text-sm font-medium text-green-900 mb-1">Google Shopping Products ({item.rawProducts.googleShopping.length})</div>
                                                    <div className="space-y-1 max-h-40 overflow-auto">
                                                      {item.rawProducts.googleShopping.map((p: any, i: number) => (
                                                        <div key={i} className="text-sm text-green-800 flex items-center gap-2">
                                                          {p.thumbnail ? <img src={p.thumbnail} alt={p.title} className="w-8 h-8 object-cover rounded" /> : null}
                                                          <div className="flex-1 min-w-0">
                                                            <div className="truncate font-medium">{p.title}</div>
                                                            <div className="text-xs text-green-600">
                                                              {p.source} • ${p.price || 'N/A'}
                                                              {p.link ? ' • ' : ''}{p.link ? <a className="underline" href={p.link} target="_blank" rel="noreferrer">open</a> : p.productApiUrl ? <a className="underline" href={p.productApiUrl} target="_blank" rel="noreferrer">open</a> : <span className="text-gray-500">no link</span>}
                                                            </div>
                                                            <div className="text-xs text-gray-600 break-all">
                                                              <strong>link:</strong> {p.link || 'null'}
                                                            </div>
                                                          </div>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </div>
                                                )}

                                                {/* Google Immersive Products */}
                                                {item.rawProducts.googleImmersive && item.rawProducts.googleImmersive.length > 0 && (
                                                  <div>
                                                    <div className="text-sm font-medium text-green-900 mb-1">Google Immersive Products ({item.rawProducts.googleImmersive.length})</div>
                                                    <div className="space-y-1 max-h-40 overflow-auto">
                                                      {item.rawProducts.googleImmersive.map((p: any, i: number) => (
                                                        <div key={i} className="text-sm text-green-800 flex items-center gap-2">
                                                          {p.thumbnail ? <img src={p.thumbnail} alt={p.title} className="w-8 h-8 object-cover rounded" /> : null}
                                                          <div className="flex-1 min-w-0">
                                                            <div className="truncate font-medium">{p.title}</div>
                                                            <div className="text-xs text-green-600">
                                                              {p.source} • ${p.price || 'N/A'}
                                                              {p.link ? ' • ' : ''}{p.link ? <a className="underline" href={p.link} target="_blank" rel="noreferrer">open</a> : p.productApiUrl ? <a className="underline" href={p.productApiUrl} target="_blank" rel="noreferrer">open</a> : <span className="text-gray-500">no link</span>}
                                                            </div>
                                                            <div className="text-xs text-gray-600 break-all">
                                                              <strong>link:</strong> {p.link || 'null'}
                                                            </div>
                                                          </div>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </div>
                                                )}

                                                {/* Google Organic Results */}
                                                {item.rawProducts.googleOrganic && item.rawProducts.googleOrganic.length > 0 && (
                                                  <div>
                                                    <div className="text-sm font-medium text-green-900 mb-1">Google Organic Results ({item.rawProducts.googleOrganic.length})</div>
                                                    <div className="space-y-1 max-h-40 overflow-auto">
                                                      {item.rawProducts.googleOrganic.map((p: any, i: number) => (
                                                        <div key={i} className="text-sm text-green-800 flex items-center gap-2">
                                                          <div className="flex-1 min-w-0">
                                                            <div className="truncate font-medium">{p.title}</div>
                                                            <div className="text-xs text-green-600">
                                                              {p.source}
                                                              {p.link ? ' • ' : ''}{p.link ? <a className="underline" href={p.link} target="_blank" rel="noreferrer">open</a> : <span className="text-gray-500">no link</span>}
                                                            </div>
                                                            <div className="text-xs text-gray-600 break-all">
                                                              <strong>link:</strong> {p.link || 'null'}
                                                            </div>
                                                          </div>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </div>
                                                )}

                                                {/* DB Matches (fallback) */}
                                                {item.productsDb && item.productsDb.length > 0 && (
                                                  <div>
                                                    <div className="text-sm font-medium text-green-900 mb-1">DB Matches ({item.productsDb.length})</div>
                                                    <div className="space-y-1 max-h-40 overflow-auto">
                                                      {item.productsDb.map((p: any, i: number) => (
                                                        <div key={i} className="text-sm text-green-800 flex items-center gap-2">
                                                          {p.thumbnail ? <img src={p.thumbnail} alt={p.title} className="w-8 h-8 object-cover rounded" /> : null}
                                                          <div className="flex-1 min-w-0">
                                                            <div className="truncate font-medium">{p.title}</div>
                                                            <div className="text-xs text-green-600">{p.source} {p.link ? '• ' : ''}{p.link ? <a className="underline" href={p.link} target="_blank" rel="noreferrer">open</a> : p.productApiUrl ? <a className="underline" href={p.productApiUrl} target="_blank" rel="noreferrer">open</a> : <span className="text-gray-500">no link</span>}</div>
                                                            <div className="text-xs text-gray-600 break-all">
                                                              <strong>link:</strong> {p.link || 'null'}
                                                            </div>
                                                          </div>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </div>
                                                )}

                                                {/* Fallback: Extract products directly from raw response if rawProducts not available */}
                                                {!item.rawProducts && item.rawResponse && (
                                                  <>
                                                    {/* Extract Google Shopping Products from raw response */}
                                                    {item.rawResponse.engines?.google_shopping?.shopping_results && item.rawResponse.engines.google_shopping.shopping_results.length > 0 && (
                                                      <div>
                                                        <div className="text-sm font-medium text-green-900 mb-1">
                                                          Google Shopping Products ({item.rawResponse.engines.google_shopping.shopping_results.length})
                                                        </div>
                                                        <div className="space-y-1 max-h-40 overflow-auto">
                                                          {item.rawResponse.engines.google_shopping.shopping_results.slice(0, 10).map((p: any, i: number) => (
                                                            <div key={i} className="text-sm text-green-800 flex items-center gap-2">
                                                              {p.thumbnail ? <img src={p.thumbnail} alt={p.title} className="w-8 h-8 object-cover rounded" /> : null}
                                                              <div className="flex-1 min-w-0">
                                                                <div className="truncate font-medium">{p.title}</div>
                                                                <div className="text-xs text-green-600">
                                                                  {p.source || p.store} • ${p.extracted_price || 'N/A'}
                                                                  {p.link ? ' • ' : ''}{p.link ? <a className="underline" href={p.link} target="_blank" rel="noreferrer">open</a> : null}
                                                                </div>
                                                              </div>
                                                            </div>
                                                          ))}
                                                        </div>
                                                      </div>
                                                    )}

                                                    {/* Extract Google Immersive Products from raw response */}
                                                    {item.rawResponse.engines?.google?.immersive_products && item.rawResponse.engines.google.immersive_products.length > 0 && (
                                                      <div>
                                                        <div className="text-sm font-medium text-green-900 mb-1">
                                                          Google Immersive Products ({item.rawResponse.engines.google.immersive_products.length})
                                                        </div>
                                                        <div className="space-y-1 max-h-40 overflow-auto">
                                                          {item.rawResponse.engines.google.immersive_products.slice(0, 10).map((p: any, i: number) => (
                                                            <div key={i} className="text-sm text-green-800 flex items-center gap-2">
                                                              {p.thumbnail ? <img src={p.thumbnail} alt={p.title} className="w-8 h-8 object-cover rounded" /> : null}
                                                              <div className="flex-1 min-w-0">
                                                                <div className="truncate font-medium">{p.title}</div>
                                                                <div className="text-xs text-green-600">
                                                                  {p.source} • ${p.extracted_price || 'N/A'}
                                                                  {p.link ? ' • ' : ''}{p.link ? <a className="underline" href={p.link} target="_blank" rel="noreferrer">open</a> : null}
                                                                </div>
                                                              </div>
                                                            </div>
                                                          ))}
                                                        </div>
                                                      </div>
                                                    )}

                                                    {/* Extract Google Organic Results from raw response */}
                                                    {item.rawResponse.engines?.google?.organic_results && item.rawResponse.engines.google.organic_results.length > 0 && (
                                                      <div>
                                                        <div className="text-sm font-medium text-green-900 mb-1">
                                                          Google Organic Results ({item.rawResponse.engines.google.organic_results.length})
                                                        </div>
                                                        <div className="space-y-1 max-h-40 overflow-auto">
                                                          {item.rawResponse.engines.google.organic_results.slice(0, 10).map((p: any, i: number) => (
                                                            <div key={i} className="text-sm text-green-800 flex items-center gap-2">
                                                              <div className="flex-1 min-w-0">
                                                                <div className="truncate font-medium">{p.title}</div>
                                                                <div className="text-xs text-green-600">
                                                                  {p.source || 'Google'}
                                                                  {p.link ? ' • ' : ''}{p.link ? <a className="underline" href={p.link} target="_blank" rel="noreferrer">open</a> : null}
                                                                </div>
                                                              </div>
                                                            </div>
                                                          ))}
                                                        </div>
                                                      </div>
                                                    )}
                                                  </>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-sm text-green-700">Enter a term and click Search Raw Data.</div>
                                    )}
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Keywords */}
                                {search.keywords && search.keywords.length > 0 && (
                                  <div>
                                    <h4 className="font-medium text-green-800 mb-2">Keywords ({search.keywords.length})</h4>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                      {(search.keywords || []).slice(0, (seoHistoryExpanded[search.query]?.kw || 5)).map((keyword: any, idx: number) => (
                                        <div key={idx} className="text-sm text-green-700 flex items-center justify-between gap-2">
                                          <span className="truncate">{keyword.keyword}</span>
                                          <span className="ml-2 whitespace-nowrap text-green-600">
                                            Vol: {keyword.searchVolume ? keyword.searchVolume.toLocaleString() : '—'}
                                            {typeof keyword.competition !== 'undefined' && (
                                              <>
                                                {' '}• Comp: <span className="capitalize">{keyword.competition}</span>
                                              </>
                                            )}
                                            {typeof keyword.difficulty !== 'undefined' && (
                                              <>
                                                {' '}• Diff: {keyword.difficulty}
                                              </>
                                            )}
                                          </span>
                                        </div>
                                      ))}
                                      <div className="pt-2">
                                        <button
                                          onClick={() => loadHistoryMore(search.query, 'keywords', 10)}
                                          className="text-xs text-green-700 underline"
                                        >
                                          Load more keywords
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Products */}
                                {search.products && search.products.length > 0 && (
                                  <div>
                                    <h4 className="font-medium text-green-800 mb-2">Products ({search.products.length})</h4>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                      {(search.products || []).slice(0, (seoHistoryExpanded[search.query]?.pr || 3)).map((product: any, idx: number) => (
                                        <a key={idx} href={product.link} target="_blank" rel="noreferrer" className="block text-sm text-green-700 hover:text-green-800">
                                          <div className="flex items-center gap-2">
                                            {product.thumbnail && (
                                              <img src={product.thumbnail} alt={product.title} className="w-8 h-8 object-cover rounded" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                              <div className="truncate font-medium">{product.title}</div>
                                              <div className="text-xs text-green-600">
                                                {product.source} • {product.price ? `$${product.price}` : '—'}
                                              </div>
                                              <div className="text-xs text-gray-600 break-all">
                                                <strong>link:</strong> {product.link || 'null'}
                                              </div>
                                            </div>
                                          </div>
                                        </a>
                                      ))}
                                      <div className="pt-2">
                                        <button
                                          onClick={() => loadHistoryMore(search.query, 'products', 6)}
                                          className="text-xs text-green-700 underline"
                                        >
                                          Load more products
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {/* Raw snapshot */}
                                {search.rawResponse && (
                                  <div className="md:col-span-2">
                                    <details className="bg-white border border-green-200 rounded-lg p-3">
                                      <summary className="cursor-pointer text-sm text-green-800">View raw SerpAPI snapshot</summary>
                                      <pre className="mt-2 p-3 bg-green-50 border border-green-100 rounded text-xs overflow-x-auto whitespace-pre-wrap break-words">{JSON.stringify(search.rawResponse, null, 2)}</pre>
                                    </details>
                                  </div>
                                )}
                              </div>

                              <div className="mt-3 flex gap-2">
                                <button
                                  onClick={async () => {
                                    try {
                                      setKeywordQuery(search.query);
                                      // Load full saved results (not the preview-limited ones)
                                      const detailRes = await fetch(`/api/seo/history/details?query=${encodeURIComponent(search.query)}&kwLimit=200&prLimit=200`);
                                      const detail = await detailRes.json();
                                      if (detail.success) {
                                        setKeywords(detail.keywords?.items || []);
                                        setProductsSeo(detail.products?.items || []);
                                        setSeoRawSnapshot(detail.rawResponse || search.rawResponse || null);
                                        toast.success(`Loaded ${search.query} results (${detail.products?.total || 0} products)`);
                                      } else {
                                        // fallback to preview data if details failed
                                        setKeywords(search.keywords || []);
                                        setProductsSeo(search.products || []);
                                        setSeoRawSnapshot(search.rawResponse || null);
                                        toast.error('Failed to load full results; showing preview');
                                      }
                                    } catch (err) {
                                      setKeywords(search.keywords || []);
                                      setProductsSeo(search.products || []);
                                      setSeoRawSnapshot(search.rawResponse || null);
                                      toast.error('Error loading full results; showing preview');
                                    }
                                  }}
                                  className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                >
                                  Load Results
                                </button>
                                <button
                                  onClick={() => {
                                    const csvContent = search.keywords?.map((k: any) =>
                                      `${k.keyword},${k.searchVolume},${k.competition},${k.difficulty}`
                                    ).join('\n') || '';
                                    if (csvContent) {
                                      const blob = new Blob([`keyword,searchVolume,competition,difficulty\n${csvContent}`], { type: 'text/csv' });
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = `keywords_${search.query.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
                                      a.click();
                                      URL.revokeObjectURL(url);
                                      toast.success('Exported keywords.csv');
                                    }
                                  }}
                                  className="px-3 py-1 text-xs bg-white text-green-700 border border-green-200 rounded hover:bg-green-50 transition-colors"
                                >
                                  Export CSV
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {(activeTab as any) === 'seo-raw' && (
                <div className="bg-white rounded-lg shadow-sm border border-green-100">
                  <div className="p-6 border-b border-green-100 bg-gradient-to-r from-green-50/40 to-emerald-50/30">
                    <h2 className="text-xl font-semibold text-green-900">Search Saved SerpAPI Raw Data</h2>
                    <p className="text-green-700/80 mt-1 text-sm">Find stored raw responses by product title, source, link, or keyword. Useful for auditing.</p>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex flex-col md:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Search term (product name, link, or keyword)"
                        className="flex-1 px-3 py-2 border border-green-200 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        value={keywordQuery}
                        onChange={(e) => setKeywordQuery(e.target.value)}
                      />
                      <button
                        onClick={async () => {
                          try {
                            setSeoLoading(prev => ({ ...prev, rawSearch: true }));
                            const res = await fetch(`/api/seo/raw-search?q=${encodeURIComponent(keywordQuery)}&limit=5`);
                            const data = await res.json();
                            if (data.success) {
                              console.log('Raw search results (marketing):', data.items);
                              console.log('First item allProducts (marketing):', data.items[0]?.allProducts?.slice(0, 3).map((p: any) => ({ title: p.title, link: p.link, productApiUrl: p.productApiUrl })));
                              setSeoRawSnapshot(null);
                              setRawSearchItems(data.items || []);
                              toast.success(`Found ${data.total} matching sessions`);
                            } else {
                              toast.error('Search failed');
                              setRawSearchItems([]);
                            }
                          } catch (e) {
                            toast.error('Error searching raw data');
                            setRawSearchItems([]);
                          } finally {
                            setSeoLoading(prev => ({ ...prev, rawSearch: false }));
                          }
                        }}
                        disabled={seoLoading.rawSearch}
                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
                      >
                        {seoLoading.rawSearch ? 'Searching…' : 'Search Raw Data'}
                      </button>
                    </div>

                    {rawSearchItems && rawSearchItems.length > 0 ? (
                      <div className="space-y-4">
                        {rawSearchItems.map((item: any, idx: number) => (
                          <div key={idx} className="border border-green-200 rounded-lg p-3">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <div className="text-sm text-green-800">Query</div>
                                <div className="font-medium text-green-900">{item.query}</div>
                              </div>
                              <div className="text-xs text-green-600">{new Date(item.createdAt).toLocaleString()}</div>
                            </div>

                            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="p-2 bg-green-50 border border-green-100 rounded">
                                <div className="text-xs text-green-700">Shopping matches</div>
                                <div className="text-sm font-semibold text-green-900">{item.matches.shoppingCount}</div>
                              </div>
                              <div className="p-2 bg-green-50 border border-green-100 rounded">
                                <div className="text-xs text-green-700">Google matches</div>
                                <div className="text-sm font-semibold text-green-900">{item.matches.googleCount}</div>
                              </div>
                              <div className="p-2 bg-green-50 border border-green-100 rounded">
                                <div className="text-xs text-green-700">DB products</div>
                                <div className="text-sm font-semibold text-green-900">{item.matches.dbCount}</div>
                              </div>
                            </div>

                            <div className="mt-3 space-y-2">
                              {item.rawResponse?.engines?.google_shopping && (
                                <details>
                                  <summary className="cursor-pointer text-sm text-green-800">Raw JSON: Google Shopping</summary>
                                  <pre className="mt-2 p-3 bg-green-50 border border-green-100 rounded text-xs overflow-auto whitespace-pre-wrap break-all max-h-80 text-black w-full max-w-full font-mono">{JSON.stringify(item.rawResponse.engines.google_shopping, null, 2)}</pre>
                                </details>
                              )}
                              {item.rawResponse?.engines?.google && (
                                <details>
                                  <summary className="cursor-pointer text-sm text-green-800">Raw JSON: Google</summary>
                                  <pre className="mt-2 p-3 bg-green-50 border border-green-100 rounded text-xs overflow-auto whitespace-pre-wrap break-all max-h-80 text-black w-full max-w-full font-mono">{JSON.stringify(item.rawResponse.engines.google, null, 2)}</pre>
                                </details>
                              )}
                            </div>

                            {/* Deduplicated products from all sources */}
                            {item.allProducts && item.allProducts.length > 0 && (
                              <div className="mt-3">
                                <div className="text-sm font-medium text-green-900 mb-2">All Products (Deduplicated) ({item.allProducts.length})</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                                  {item.allProducts.slice(0, 12).map((p: any, i: number) => (
                                    <div key={i} className="border border-green-200 rounded-lg p-3 bg-white">
                                      <div className="flex items-start gap-2">
                                        {p.thumbnail ? <img src={p.thumbnail} alt={p.title} className="w-12 h-12 object-cover rounded" /> : null}
                                        <div className="flex-1 min-w-0">
                                          <div className="text-sm font-medium text-green-900 line-clamp-2">{p.title}</div>
                                          <div className="text-xs text-green-600 mt-1">
                                            {p.source} • {p.sourceType}
                                            {p.price ? ` • $${p.price}` : ''}
                                          </div>
                                          <div className="mt-1 text-xs text-gray-600 break-all">
                                            <strong>link:</strong> {p.link || 'null'}
                                          </div>
                                          <div className="mt-1 flex gap-1">
                                            {p.link ? (
                                              <a className="text-xs text-green-700 underline" href={p.link} target="_blank" rel="noreferrer">View</a>
                                            ) : p.productApiUrl ? (
                                              <a className="text-xs text-green-700 underline" href={p.productApiUrl} target="_blank" rel="noreferrer">View</a>
                                            ) : (
                                              <span className="text-xs text-gray-500">No link</span>
                                            )}
                                            {p.productApiUrl && p.link ? (
                                              <a className="text-xs text-green-600 underline" href={p.productApiUrl} target="_blank" rel="noreferrer">API</a>
                                            ) : null}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Raw products from SerpAPI response */}
                            {(item.rawProducts || item.rawResponse) && (
                              <div className="mt-3 space-y-3">
                                {/* Google Shopping Products */}
                                {item.rawProducts.googleShopping && item.rawProducts.googleShopping.length > 0 && (
                                  <div>
                                    <div className="text-sm font-medium text-green-900 mb-1">Google Shopping Products ({item.rawProducts.googleShopping.length})</div>
                                    <div className="space-y-1 max-h-40 overflow-auto">
                                      {item.rawProducts.googleShopping.map((p: any, i: number) => (
                                        <div key={i} className="text-sm text-green-800 flex items-center gap-2">
                                          {p.thumbnail ? <img src={p.thumbnail} alt={p.title} className="w-8 h-8 object-cover rounded" /> : null}
                                          <div className="flex-1 min-w-0">
                                            <div className="truncate font-medium">{p.title}</div>
                                            <div className="text-xs text-green-600">
                                              {p.source} • ${p.price || 'N/A'}
                                              {p.link ? ' • ' : ''}{p.link ? <a className="underline" href={p.link} target="_blank" rel="noreferrer">open</a> : p.productApiUrl ? <a className="underline" href={p.productApiUrl} target="_blank" rel="noreferrer">open</a> : <span className="text-gray-500">no link</span>}
                                            </div>
                                            <div className="text-xs text-gray-600 break-all">
                                              <strong>link:</strong> {p.link || 'null'}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Google Immersive Products */}
                                {item.rawProducts.googleImmersive && item.rawProducts.googleImmersive.length > 0 && (
                                  <div>
                                    <div className="text-sm font-medium text-green-900 mb-1">Google Immersive Products ({item.rawProducts.googleImmersive.length})</div>
                                    <div className="space-y-1 max-h-40 overflow-auto">
                                      {item.rawProducts.googleImmersive.map((p: any, i: number) => (
                                        <div key={i} className="text-sm text-green-800 flex items-center gap-2">
                                          {p.thumbnail ? <img src={p.thumbnail} alt={p.title} className="w-8 h-8 object-cover rounded" /> : null}
                                          <div className="flex-1 min-w-0">
                                            <div className="truncate font-medium">{p.title}</div>
                                            <div className="text-xs text-green-600">
                                              {p.source} • ${p.price || 'N/A'}
                                              {p.link ? ' • ' : ''}{p.link ? <a className="underline" href={p.link} target="_blank" rel="noreferrer">open</a> : p.productApiUrl ? <a className="underline" href={p.productApiUrl} target="_blank" rel="noreferrer">open</a> : <span className="text-gray-500">no link</span>}
                                            </div>
                                            <div className="text-xs text-gray-600 break-all">
                                              <strong>link:</strong> {p.link || 'null'}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Google Organic Results */}
                                {item.rawProducts.googleOrganic && item.rawProducts.googleOrganic.length > 0 && (
                                  <div>
                                    <div className="text-sm font-medium text-green-900 mb-1">Google Organic Results ({item.rawProducts.googleOrganic.length})</div>
                                    <div className="space-y-1 max-h-40 overflow-auto">
                                      {item.rawProducts.googleOrganic.map((p: any, i: number) => (
                                        <div key={i} className="text-sm text-green-800 flex items-center gap-2">
                                          <div className="flex-1 min-w-0">
                                            <div className="truncate font-medium">{p.title}</div>
                                            <div className="text-xs text-green-600">
                                              {p.source}
                                              {p.link ? ' • ' : ''}{p.link ? <a className="underline" href={p.link} target="_blank" rel="noreferrer">open</a> : <span className="text-gray-500">no link</span>}
                                            </div>
                                            <div className="text-xs text-gray-600 break-all">
                                              <strong>link:</strong> {p.link || 'null'}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* DB Matches (fallback) */}
                                {item.productsDb && item.productsDb.length > 0 && (
                                  <div>
                                    <div className="text-sm font-medium text-green-900 mb-1">DB Matches ({item.productsDb.length})</div>
                                    <div className="space-y-1 max-h-40 overflow-auto">
                                      {item.productsDb.map((p: any, i: number) => (
                                        <div key={i} className="text-sm text-green-800 flex items-center gap-2">
                                          {p.thumbnail ? <img src={p.thumbnail} alt={p.title} className="w-8 h-8 object-cover rounded" /> : null}
                                          <div className="flex-1 min-w-0">
                                            <div className="truncate font-medium">{p.title}</div>
                                            <div className="text-xs text-green-600">{p.source} {p.link ? '• ' : ''}{p.link ? <a className="underline" href={p.link} target="_blank" rel="noreferrer">open</a> : p.productApiUrl ? <a className="underline" href={p.productApiUrl} target="_blank" rel="noreferrer">open</a> : <span className="text-gray-500">no link</span>}</div>
                                            <div className="text-xs text-gray-600 break-all">
                                              <strong>link:</strong> {p.link || 'null'}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Fallback: Extract products directly from raw response if rawProducts not available */}
                                {!item.rawProducts && item.rawResponse && (
                                  <>
                                    {/* Extract Google Shopping Products from raw response */}
                                    {item.rawResponse.engines?.google_shopping?.shopping_results && item.rawResponse.engines.google_shopping.shopping_results.length > 0 && (
                                      <div>
                                        <div className="text-sm font-medium text-green-900 mb-1">
                                          Google Shopping Products ({item.rawResponse.engines.google_shopping.shopping_results.length})
                                        </div>
                                        <div className="space-y-1 max-h-40 overflow-auto">
                                          {item.rawResponse.engines.google_shopping.shopping_results.slice(0, 10).map((p: any, i: number) => (
                                            <div key={i} className="text-sm text-green-800 flex items-center gap-2">
                                              {p.thumbnail ? <img src={p.thumbnail} alt={p.title} className="w-8 h-8 object-cover rounded" /> : null}
                                              <div className="flex-1 min-w-0">
                                                <div className="truncate font-medium">{p.title}</div>
                                                <div className="text-xs text-green-600">
                                                  {p.source || p.store} • ${p.extracted_price || 'N/A'}
                                                  {p.link ? ' • ' : ''}{p.link ? <a className="underline" href={p.link} target="_blank" rel="noreferrer">open</a> : null}
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Extract Google Immersive Products from raw response */}
                                    {item.rawResponse.engines?.google?.immersive_products && item.rawResponse.engines.google.immersive_products.length > 0 && (
                                      <div>
                                        <div className="text-sm font-medium text-green-900 mb-1">
                                          Google Immersive Products ({item.rawResponse.engines.google.immersive_products.length})
                                        </div>
                                        <div className="space-y-1 max-h-40 overflow-auto">
                                          {item.rawResponse.engines.google.immersive_products.slice(0, 10).map((p: any, i: number) => (
                                            <div key={i} className="text-sm text-green-800 flex items-center gap-2">
                                              {p.thumbnail ? <img src={p.thumbnail} alt={p.title} className="w-8 h-8 object-cover rounded" /> : null}
                                              <div className="flex-1 min-w-0">
                                                <div className="truncate font-medium">{p.title}</div>
                                                <div className="text-xs text-green-600">
                                                  {p.source} • ${p.extracted_price || 'N/A'}
                                                  {p.link ? ' • ' : ''}{p.link ? <a className="underline" href={p.link} target="_blank" rel="noreferrer">open</a> : null}
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Extract Google Organic Results from raw response */}
                                    {item.rawResponse.engines?.google?.organic_results && item.rawResponse.engines.google.organic_results.length > 0 && (
                                      <div>
                                        <div className="text-sm font-medium text-green-900 mb-1">
                                          Google Organic Results ({item.rawResponse.engines.google.organic_results.length})
                                        </div>
                                        <div className="space-y-1 max-h-40 overflow-auto">
                                          {item.rawResponse.engines.google.organic_results.slice(0, 10).map((p: any, i: number) => (
                                            <div key={i} className="text-sm text-green-800 flex items-center gap-2">
                                              <div className="flex-1 min-w-0">
                                                <div className="truncate font-medium">{p.title}</div>
                                                <div className="text-xs text-green-600">
                                                  {p.source || 'Google'}
                                                  {p.link ? ' • ' : ''}{p.link ? <a className="underline" href={p.link} target="_blank" rel="noreferrer">open</a> : null}
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-green-700">Enter a term and click Search Raw Data.</div>
                    )}
                  </div>
                </div>
              )}

              {/* Google & Google Shopping Analytics Tab */}
              {(activeTab as any) === 'analytics-seo' && (
                <div className="space-y-6">
                  {/* Search Section */}
                  <div className="bg-white rounded-lg shadow-sm border border-purple-100">
                    <div className="p-6 border-b border-purple-100 bg-gradient-to-r from-purple-50/40 to-indigo-50/30">
                      <h2 className="text-xl font-semibold text-purple-900">Google & Google Shopping Analytics</h2>
                      <p className="text-purple-700/80 mt-1 text-sm">Search and analyze saved SerpAPI responses from Google Search and Google Shopping engines.</p>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex flex-col md:flex-row gap-2">
                        <input
                          type="text"
                          placeholder="Search term (e.g., 'men leather jacket')"
                          className="flex-1 px-3 py-2 border border-purple-200 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          value={analyticsSearchQuery}
                          onChange={(e) => setAnalyticsSearchQuery(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && searchAnalytics()}
                        />
                        <button
                          onClick={searchAnalytics}
                          disabled={analyticsSeoLoading}
                          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {analyticsSeoLoading ? 'Searching...' : 'Search Analytics'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Results Section */}
                  {analyticsResults.length > 0 && (
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg shadow-sm border border-purple-100">
                        <div className="p-4 border-b border-purple-100">
                          <h3 className="text-lg font-semibold text-purple-900">Search Results ({analyticsResults.length})</h3>
                        </div>
                        <div className="p-4 space-y-3">
                          {analyticsResults.map((result, index) => (
                            <div key={index} className="border border-purple-200 rounded-lg p-4 hover:bg-purple-50/30 transition-colors">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-purple-900">{result.query}</h4>
                                  <p className="text-sm text-purple-600">
                                    {new Date(result.createdAt).toLocaleString()} •
                                    Google Shopping: {result.matches?.shoppingCount || 0} •
                                    Google: {result.matches?.googleCount || 0} •
                                    DB: {result.matches?.dbCount || 0}
                                  </p>
                                </div>
                                <button
                                  onClick={() => setSelectedResult(selectedResult === result ? null : result)}
                                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                  {selectedResult === result ? 'Hide Details' : 'View Details'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Selected Result Details */}
                      {selectedResult && (
                        <div className="bg-white rounded-lg shadow-sm border border-purple-100">
                          <div className="p-4 border-b border-purple-100">
                            <h3 className="text-lg font-semibold text-purple-900">Analytics Details: {selectedResult.query}</h3>
                            <p className="text-sm text-purple-600">
                              Created: {new Date(selectedResult.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="p-4 space-y-6">
                            {/* Google Search Response */}
                            {selectedResult.rawResponse?.engines?.google && (
                              <div className="border border-gray-200 rounded-lg">
                                <div className="p-3 bg-blue-50 border-b border-blue-200">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium text-xs">Google Search</span>
                                    <h4 className="font-semibold text-gray-900">Search Response</h4>
                                  </div>
                                </div>
                                <div className="p-4 space-y-4">
                                  {/* Search Metadata */}
                                  {selectedResult.rawResponse.engines.google.search_metadata && (
                                    <div>
                                      <button
                                        onClick={() => toggleSection('google-metadata')}
                                        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                                      >
                                        <span>{expandedSections['google-metadata'] ? '▼' : '▶'}</span>
                                        Search Metadata
                                      </button>
                                      {expandedSections['google-metadata'] && (
                                        <div className="mt-2 p-3 bg-gray-50 rounded border">
                                          <pre className="text-xs text-gray-700 overflow-auto max-h-60 whitespace-pre-wrap">
                                            {JSON.stringify(selectedResult.rawResponse.engines.google.search_metadata, null, 2)}
                                          </pre>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Search Parameters */}
                                  {selectedResult.rawResponse.engines.google.search_parameters && (
                                    <div>
                                      <button
                                        onClick={() => toggleSection('google-parameters')}
                                        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                                      >
                                        <span>{expandedSections['google-parameters'] ? '▼' : '▶'}</span>
                                        Search Parameters
                                      </button>
                                      {expandedSections['google-parameters'] && (
                                        <div className="mt-2 p-3 bg-gray-50 rounded border">
                                          <pre className="text-xs text-gray-700 overflow-auto max-h-60 whitespace-pre-wrap">
                                            {JSON.stringify(selectedResult.rawResponse.engines.google.search_parameters, null, 2)}
                                          </pre>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Immersive Products */}
                                  {selectedResult.rawResponse.engines.google.immersive_products && (
                                    <div>
                                      <button
                                        onClick={() => toggleSection('google-immersive')}
                                        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                                      >
                                        <span>{expandedSections['google-immersive'] ? '▼' : '▶'}</span>
                                        Immersive Products ({selectedResult.rawResponse.engines.google.immersive_products.length} items)
                                      </button>
                                      {expandedSections['google-immersive'] && (
                                        <div className="mt-2 space-y-4">
                                          {/* Section Header */}
                                          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium text-xs">Google Search</span>
                                            <span className="text-sm text-gray-700">Immersive Products - {selectedResult.rawResponse.engines.google.immersive_products.length} items</span>
                                          </div>
                                          {/* Product Cards UI */}
                                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {selectedResult.rawResponse.engines.google.immersive_products.slice(0, 12).map((product: any, index: number) => (
                                              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                                                <div className="flex items-start gap-3">
                                                  {product.thumbnail && (
                                                    <img
                                                      src={product.thumbnail}
                                                      alt={product.title}
                                                      className="w-16 h-16 object-cover rounded"
                                                      onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                      }}
                                                    />
                                                  )}
                                                  <div className="flex-1 min-w-0">
                                                    <h5 className="font-medium text-gray-900 line-clamp-2 text-sm">{product.title}</h5>
                                                    <div className="mt-1 space-y-1">
                                                      <div className="flex items-center gap-2 text-xs">
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">Google Search</span>
                                                        <span className="text-gray-600">{product.source || 'Unknown'}</span>
                                                        {product.rating && (
                                                          <span className="flex items-center gap-1 text-gray-600">
                                                            ★ {product.rating}
                                                            {product.reviews && <span>({product.reviews})</span>}
                                                          </span>
                                                        )}
                                                      </div>
                                                      <div className="flex items-center gap-2 text-sm">
                                                        {product.extracted_price && (
                                                          <span className="font-semibold text-green-600">${product.extracted_price}</span>
                                                        )}
                                                        {product.extracted_original_price && product.extracted_original_price !== product.extracted_price && (
                                                          <span className="text-gray-500 line-through text-xs">${product.extracted_original_price}</span>
                                                        )}
                                                      </div>
                                                      <div className="flex items-center gap-2">
                                                        {product.link ? (
                                                          <a
                                                            href={product.link}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-xs text-blue-600 hover:text-blue-800 underline font-medium"
                                                          >
                                                            View Product
                                                          </a>
                                                        ) : (
                                                          <span className="text-xs text-gray-500">No link available</span>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                          {selectedResult.rawResponse.engines.google.immersive_products.length > 12 && (
                                            <div className="text-center text-sm text-gray-500">
                                              Showing first 12 of {selectedResult.rawResponse.engines.google.immersive_products.length} products
                                            </div>
                                          )}
                                          {/* Raw JSON Toggle */}
                                          <details className="mt-4">
                                            <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                                              View Raw JSON
                                            </summary>
                                            <div className="mt-2 p-3 bg-gray-50 rounded border">
                                              <pre className="text-xs text-gray-700 overflow-auto max-h-60 whitespace-pre-wrap">
                                                {JSON.stringify(selectedResult.rawResponse.engines.google.immersive_products, null, 2)}
                                              </pre>
                                            </div>
                                          </details>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Organic Results */}
                                  {selectedResult.rawResponse.engines.google.organic_results && (
                                    <div>
                                      <button
                                        onClick={() => toggleSection('google-organic')}
                                        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                                      >
                                        <span>{expandedSections['google-organic'] ? '▼' : '▶'}</span>
                                        Organic Results ({selectedResult.rawResponse.engines.google.organic_results.length} items)
                                      </button>
                                      {expandedSections['google-organic'] && (
                                        <div className="mt-2 space-y-4">
                                          {/* Organic Results UI */}
                                          <div className="space-y-3">
                                            {selectedResult.rawResponse.engines.google.organic_results.map((result: any, index: number) => (
                                              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                                                <div className="space-y-2">
                                                  <h5 className="font-medium text-blue-600 hover:text-blue-800">
                                                    {result.link ? (
                                                      <a href={result.link} target="_blank" rel="noreferrer" className="hover:underline">
                                                        {result.title}
                                                      </a>
                                                    ) : (
                                                      result.title
                                                    )}
                                                  </h5>
                                                  {result.displayed_link && (
                                                    <p className="text-sm text-green-600">{result.displayed_link}</p>
                                                  )}
                                                  {result.snippet && (
                                                    <p className="text-sm text-gray-700 line-clamp-3">{result.snippet}</p>
                                                  )}
                                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    {result.position && <span>Position: {result.position}</span>}
                                                    {result.date && <span>Date: {result.date}</span>}
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                          {/* Raw JSON Toggle */}
                                          <details className="mt-4">
                                            <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                                              View Raw JSON
                                            </summary>
                                            <div className="mt-2 p-3 bg-gray-50 rounded border">
                                              <pre className="text-xs text-gray-700 overflow-auto max-h-60 whitespace-pre-wrap">
                                                {JSON.stringify(selectedResult.rawResponse.engines.google.organic_results, null, 2)}
                                              </pre>
                                            </div>
                                          </details>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Related Brands */}
                                  {selectedResult.rawResponse.engines.google.related_brands && (
                                    <div>
                                      <button
                                        onClick={() => toggleSection('google-brands')}
                                        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                                      >
                                        <span>{expandedSections['google-brands'] ? '▼' : '▶'}</span>
                                        Related Brands ({selectedResult.rawResponse.engines.google.related_brands.length} items)
                                      </button>
                                      {expandedSections['google-brands'] && (
                                        <div className="mt-2 space-y-4">
                                          {/* Related Brands UI */}
                                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                            {selectedResult.rawResponse.engines.google.related_brands.map((brand: any, index: number) => (
                                              <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white hover:shadow-md transition-shadow">
                                                <div className="text-center space-y-2">
                                                  {brand.thumbnail && (
                                                    <img
                                                      src={brand.thumbnail}
                                                      alt={brand.name}
                                                      className="w-12 h-12 object-cover rounded mx-auto"
                                                      onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                      }}
                                                    />
                                                  )}
                                                  <h6 className="font-medium text-gray-900 text-sm">{brand.name}</h6>
                                                  {brand.link && (
                                                    <a
                                                      href={brand.link}
                                                      target="_blank"
                                                      rel="noreferrer"
                                                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                                                    >
                                                      Visit Brand
                                                    </a>
                                                  )}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                          {/* Raw JSON Toggle */}
                                          <details className="mt-4">
                                            <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                                              View Raw JSON
                                            </summary>
                                            <div className="mt-2 p-3 bg-gray-50 rounded border">
                                              <pre className="text-xs text-gray-700 overflow-auto max-h-60 whitespace-pre-wrap">
                                                {JSON.stringify(selectedResult.rawResponse.engines.google.related_brands, null, 2)}
                                              </pre>
                                            </div>
                                          </details>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Related Searches */}
                                  {selectedResult.rawResponse.engines.google.related_searches && (
                                    <div>
                                      <button
                                        onClick={() => toggleSection('google-related')}
                                        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                                      >
                                        <span>{expandedSections['google-related'] ? '▼' : '▶'}</span>
                                        Related Searches ({selectedResult.rawResponse.engines.google.related_searches.length} items)
                                      </button>
                                      {expandedSections['google-related'] && (
                                        <div className="mt-2 space-y-4">
                                          {/* Related Searches UI */}
                                          <div className="flex flex-wrap gap-2">
                                            {selectedResult.rawResponse.engines.google.related_searches.map((search: any, index: number) => (
                                              <div key={index} className="border border-gray-200 rounded-full px-3 py-1 bg-white hover:shadow-md transition-shadow">
                                                {search.query ? (
                                                  <a
                                                    href={search.link || '#'}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                                  >
                                                    {search.query}
                                                  </a>
                                                ) : (
                                                  <span className="text-sm text-gray-700">{search}</span>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                          {/* Raw JSON Toggle */}
                                          <details className="mt-4">
                                            <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                                              View Raw JSON
                                            </summary>
                                            <div className="mt-2 p-3 bg-gray-50 rounded border">
                                              <pre className="text-xs text-gray-700 overflow-auto max-h-60 whitespace-pre-wrap">
                                                {JSON.stringify(selectedResult.rawResponse.engines.google.related_searches, null, 2)}
                                              </pre>
                                            </div>
                                          </details>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Pagination */}
                                  {selectedResult.rawResponse.engines.google.serpapi_pagination && (
                                    <div>
                                      <button
                                        onClick={() => toggleSection('google-pagination')}
                                        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                                      >
                                        <span>{expandedSections['google-pagination'] ? '▼' : '▶'}</span>
                                        Pagination
                                      </button>
                                      {expandedSections['google-pagination'] && (
                                        <div className="mt-2 p-3 bg-gray-50 rounded border">
                                          <pre className="text-xs text-gray-700 overflow-auto max-h-60 whitespace-pre-wrap">
                                            {JSON.stringify(selectedResult.rawResponse.engines.google.serpapi_pagination, null, 2)}
                                          </pre>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Google Shopping Response */}
                            {selectedResult.rawResponse?.engines?.google_shopping && (
                              <div className="border border-gray-200 rounded-lg">
                                <div className="p-3 bg-green-50 border-b border-green-200">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium text-xs">Google Shopping</span>
                                    <h4 className="font-semibold text-gray-900">Shopping Response</h4>
                                  </div>
                                </div>
                                <div className="p-4 space-y-4">
                                  {/* Shopping Results */}
                                  {selectedResult.rawResponse.engines.google_shopping.shopping_results && (
                                    <div>
                                      <button
                                        onClick={() => toggleSection('shopping-results')}
                                        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                                      >
                                        <span>{expandedSections['shopping-results'] ? '▼' : '▶'}</span>
                                        Shopping Results ({selectedResult.rawResponse.engines.google_shopping.shopping_results.length} items)
                                      </button>
                                      {expandedSections['shopping-results'] && (
                                        <div className="mt-2 space-y-4">
                                          {/* Section Header */}
                                          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium text-xs">Google Shopping</span>
                                            <span className="text-sm text-gray-700">Shopping Results - {selectedResult.rawResponse.engines.google_shopping.shopping_results.length} items</span>
                                          </div>
                                          {/* Shopping Results UI */}
                                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {selectedResult.rawResponse.engines.google_shopping.shopping_results.slice(0, 12).map((product: any, index: number) => (
                                              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                                                <div className="flex items-start gap-3">
                                                  {product.thumbnail && (
                                                    <img
                                                      src={product.thumbnail}
                                                      alt={product.title}
                                                      className="w-16 h-16 object-cover rounded"
                                                      onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                      }}
                                                    />
                                                  )}
                                                  <div className="flex-1 min-w-0">
                                                    <h5 className="font-medium text-gray-900 line-clamp-2 text-sm">{product.title}</h5>
                                                    <div className="mt-1 space-y-1">
                                                      <div className="flex items-center gap-2 text-xs">
                                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium">Google Shopping</span>
                                                        <span className="text-gray-600">{product.source || product.store || 'Unknown'}</span>
                                                        {product.rating && (
                                                          <span className="flex items-center gap-1 text-gray-600">
                                                            ★ {product.rating}
                                                            {product.reviews && <span>({product.reviews})</span>}
                                                          </span>
                                                        )}
                                                      </div>
                                                      <div className="flex items-center gap-2 text-sm">
                                                        {product.extracted_price && (
                                                          <span className="font-semibold text-green-600">${product.extracted_price}</span>
                                                        )}
                                                        {product.extracted_original_price && product.extracted_original_price !== product.extracted_price && (
                                                          <span className="text-gray-500 line-through text-xs">${product.extracted_original_price}</span>
                                                        )}
                                                      </div>
                                                      <div className="flex items-center gap-2">
                                                        {product.link ? (
                                                          <a
                                                            href={product.link}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-xs text-blue-600 hover:text-blue-800 underline font-medium"
                                                          >
                                                            View Product
                                                          </a>
                                                        ) : (
                                                          <span className="text-xs text-gray-500">No link available</span>
                                                        )}
                                                        {product.serpapi_product_api && (
                                                          <a
                                                            href={product.serpapi_product_api}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-xs text-gray-500 hover:text-gray-700 underline"
                                                          >
                                                            API
                                                          </a>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                          {selectedResult.rawResponse.engines.google_shopping.shopping_results.length > 12 && (
                                            <div className="text-center text-sm text-gray-500">
                                              Showing first 12 of {selectedResult.rawResponse.engines.google_shopping.shopping_results.length} products
                                            </div>
                                          )}
                                          {/* Raw JSON Toggle */}
                                          <details className="mt-4">
                                            <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                                              View Raw JSON
                                            </summary>
                                            <div className="mt-2 p-3 bg-gray-50 rounded border">
                                              <pre className="text-xs text-gray-700 overflow-auto max-h-60 whitespace-pre-wrap">
                                                {JSON.stringify(selectedResult.rawResponse.engines.google_shopping.shopping_results, null, 2)}
                                              </pre>
                                            </div>
                                          </details>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Shopping Metadata */}
                                  {selectedResult.rawResponse.engines.google_shopping.search_metadata && (
                                    <div>
                                      <button
                                        onClick={() => toggleSection('shopping-metadata')}
                                        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                                      >
                                        <span>{expandedSections['shopping-metadata'] ? '▼' : '▶'}</span>
                                        Shopping Metadata
                                      </button>
                                      {expandedSections['shopping-metadata'] && (
                                        <div className="mt-2 p-3 bg-gray-50 rounded border">
                                          <pre className="text-xs text-gray-700 overflow-auto max-h-60 whitespace-pre-wrap">
                                            {JSON.stringify(selectedResult.rawResponse.engines.google_shopping.search_metadata, null, 2)}
                                          </pre>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Shopping Parameters */}
                                  {selectedResult.rawResponse.engines.google_shopping.search_parameters && (
                                    <div>
                                      <button
                                        onClick={() => toggleSection('shopping-parameters')}
                                        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                                      >
                                        <span>{expandedSections['shopping-parameters'] ? '▼' : '▶'}</span>
                                        Shopping Parameters
                                      </button>
                                      {expandedSections['shopping-parameters'] && (
                                        <div className="mt-2 p-3 bg-gray-50 rounded border">
                                          <pre className="text-xs text-gray-700 overflow-auto max-h-60 whitespace-pre-wrap">
                                            {JSON.stringify(selectedResult.rawResponse.engines.google_shopping.search_parameters, null, 2)}
                                          </pre>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* No Results */}
                  {analyticsResults.length === 0 && analyticsSearchQuery && !analyticsSeoLoading && (
                    <div className="bg-white rounded-lg shadow-sm border border-purple-100 p-6 text-center">
                      <p className="text-purple-600">No analytics results found for "{analyticsSearchQuery}"</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'blogs' && (
                <div className="bg-white rounded-lg shadow-sm border">
                  <BlogAdmin />
                </div>
              )}

              {activeTab === 'keyword-planner' && (
                <div className="bg-white rounded-lg shadow-sm border">
                  <KeywordPlanner />
                </div>
              )}

              {activeTab === 'users' && (
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
                      <button
                        onClick={() => setShowCreateUser(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <UserPlus className="h-4 w-4" />
                        <span>Add User</span>
                      </button>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="w-full sm:w-auto">
                        <SelectField
                          options={[
                            { value: '', label: 'All Roles' },
                            ...roles.map(role => ({ value: role.name, label: role.name })),
                          ]}
                          value={selectedRole}
                          isOpen={openSelect === 'role'}
                          onOpenChange={(open) => setOpenSelect(open ? 'role' : null)}
                          onSelect={(value) => setSelectedRole(value)}
                          className="w-full sm:w-auto"
                        />
                      </div>
                      <button
                        onClick={fetchUsers}
                        className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span>Refresh</span>
                      </button>
                    </div>
                  </div>

                  {/* Users Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Login
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                              Loading users...
                            </td>
                          </tr>
                        ) : filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                              No users found
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((user) => (
                            <tr key={user._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleEditUser(user)}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {user.role?.name || 'N/A'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                                  }`}>
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {user.lastLogin
                                  ? new Date(user.lastLogin).toLocaleDateString()
                                  : 'Never'
                                }
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditUser(user);
                                    }}
                                    className="text-indigo-600 hover:text-indigo-900"
                                    title="Edit user"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteUser(user._id);
                                    }}
                                    className="text-red-600 hover:text-red-900"
                                    title="Delete user"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Roles Tab */}
              {activeTab === 'roles' && (
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">Roles & Permissions</h2>
                      <button
                        onClick={() => setShowCreateRole(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Role</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {roles.map((role) => (
                        <div key={role._id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${role.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                              }`}>
                              {role.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-4">{role.description}</p>
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Permissions ({role.permissions.length})
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {role.permissions.slice(0, 3).map((permission) => (
                                <span
                                  key={permission}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                >
                                  {permission.split(':')[0]}
                                </span>
                              ))}
                              {role.permissions.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                  +{role.permissions.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditRole(role)}
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteRole(role._id)}
                              className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Products Tab */}
              {activeTab === 'products' && (
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden">
                  <div className="p-4 sm:p-6 lg:p-8 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">Product Management</h2>
                        <p className="text-xs sm:text-sm text-gray-600">Manage and filter your product inventory</p>
                      </div>
                      <button
                        onClick={() => setShowCreateProduct(true)}
                        className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-95"
                      >
                        <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span>Add Product</span>
                      </button>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col gap-4 sm:gap-5">
                      {/* Search Section */}
                      <div className="w-full">
                        <label className="block text-sm font-semibold text-gray-700 mb-2.5">Search Products</label>
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <input
                            type="text"
                            placeholder="Search by name, description, or brand..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setProductPage(1); }}
                            className="w-full pl-12 pr-4 py-3.5 text-base border-2 border-gray-300 text-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md bg-white"
                          />
                        </div>
                      </div>

                      {/* Filters Section */}
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Filters</h3>
                          <button
                            onClick={() => {
                              setSelectedCategory('');
                              setSelectedBrand('');
                              setSelectedProductStatus('');
                              setSelectedIsActive('all');
                              setSelectedStockCount('');
                              setOrganizedFilter('all');
                              setProductPage(1);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                          >
                            Clear All
                          </button>
                        </div>

                        {/* Filter Groups */}
                        <div className="flex flex-col gap-4">
                          {/* Primary Filters Row */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="flex flex-col">
                              <label className="text-sm font-medium text-gray-700 mb-2">Category</label>
                              <SelectField
                                options={[
                                  { value: '', label: 'All Categories' },
                                  { value: 'Men', label: 'Men' },
                                  { value: 'Women', label: 'Women' },
                                  { value: 'Office & Travel', label: 'Office & Travel' },
                                  { value: 'Accessories', label: 'Accessories' },
                                  { value: 'Gifting', label: 'Gifting' },
                                ]}
                                value={selectedCategory}
                                isOpen={openSelect === 'category'}
                                onOpenChange={(open) => setOpenSelect(open ? 'category' : null)}
                                onSelect={(value) => { setSelectedCategory(value); setProductPage(1); }}
                                className="w-full"
                              />
                            </div>

                            <div className="flex flex-col">
                              <label className="text-sm font-medium text-gray-700 mb-2">Brand</label>
                              <SelectField
                                options={[
                                  { value: '', label: brandsLoading ? 'Loading brands...' : availableBrands.length === 0 ? 'No brands available' : 'All Brands' },
                                  ...availableBrands.map(brand => ({ value: brand, label: brand })),
                                ]}
                                value={selectedBrand}
                                isOpen={openSelect === 'brand'}
                                onOpenChange={(open) => setOpenSelect(open ? 'brand' : null)}
                                onSelect={(value) => { setSelectedBrand(value); setProductPage(1); }}
                                disabled={brandsLoading}
                                className="w-full"
                              />
                            </div>

                            <div className="flex flex-col">
                              <label className="text-sm font-medium text-gray-700 mb-2">Stock Count</label>
                              <div className="relative">
                                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                  type="number"
                                  placeholder="Enter exact count"
                                  value={selectedStockCount}
                                  onChange={(e) => { setSelectedStockCount(e.target.value); setProductPage(1); }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      fetchProducts();
                                    }
                                  }}
                                  onBlur={() => {
                                    if (selectedStockCount) {
                                      fetchProducts();
                                    }
                                  }}
                                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md bg-white"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Secondary Filters Row */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="flex flex-col">
                              <label className="text-sm font-medium text-gray-700 mb-2">Status</label>
                              <SelectField
                                options={[
                                  { value: '', label: 'All Statuses' },
                                  { value: 'draft', label: 'Draft' },
                                  { value: 'published', label: 'Published' },
                                  { value: 'archived', label: 'Archived' },
                                  { value: 'scheduled', label: 'Scheduled' },
                                  { value: 'live', label: 'Live' },
                                ]}
                                value={selectedProductStatus}
                                isOpen={openSelect === 'productStatus'}
                                onOpenChange={(open) => setOpenSelect(open ? 'productStatus' : null)}
                                onSelect={(value) => { setSelectedProductStatus(value); setProductPage(1); }}
                                className="w-full"
                              />
                            </div>

                            <div className="flex flex-col">
                              <label className="text-sm font-medium text-gray-700 mb-2">Active Status</label>
                              <SelectField
                                options={[
                                  { value: 'all', label: 'All' },
                                  { value: 'active', label: 'Active' },
                                  { value: 'inactive', label: 'Inactive' },
                                ]}
                                value={selectedIsActive}
                                isOpen={openSelect === 'isActive'}
                                onOpenChange={(open) => setOpenSelect(open ? 'isActive' : null)}
                                onSelect={(value) => { setSelectedIsActive(value as 'all' | 'active' | 'inactive'); setProductPage(1); }}
                                className="w-full"
                              />
                            </div>

                            <div className="flex flex-col">
                              <label className="text-sm font-medium text-gray-700 mb-2">Organization</label>
                              <SelectField
                                options={[
                                  { value: 'all', label: 'All Products' },
                                  { value: 'organized', label: 'Organized' },
                                  { value: 'unorganized', label: 'Unorganized' },
                                ]}
                                value={organizedFilter}
                                isOpen={openSelect === 'organized'}
                                onOpenChange={(open) => setOpenSelect(open ? 'organized' : null)}
                                onSelect={(value) => { setOrganizedFilter(value as 'all' | 'organized' | 'unorganized'); setProductPage(1); }}
                                className="w-full"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons Section */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t-2 border-gray-200">
                        <div className="flex flex-col sm:flex-row gap-3 flex-1">
                          <button
                            onClick={() => fetchProducts()}
                            className="flex items-center justify-center space-x-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:scale-95"
                          >
                            <RefreshCw className="h-5 w-5" />
                            <span>Refresh</span>
                          </button>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                          <a
                            href="/api/admin/products/export-csv"
                            className="flex items-center justify-center space-x-2 px-5 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:scale-95"
                          >
                            <Download className="h-5 w-5" />
                            <span>Export CSV</span>
                          </a>
                          <button
                            onClick={handleShopifyExport}
                            disabled={selectedProductIds.length === 0}
                            className={`flex items-center justify-center space-x-2 px-5 py-3 rounded-xl transition-all font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:scale-95 ${selectedProductIds.length === 0
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800'
                              }`}
                            title={selectedProductIds.length === 0 ? 'Select products to export' : `Export ${selectedProductIds.length} selected product(s)`}
                          >
                            <Download className="h-5 w-5" />
                            <span>Export to Shopify {selectedProductIds.length > 0 && `(${selectedProductIds.length})`}</span>
                          </button>
                          <a
                            href="/api/admin/products/sample-csv"
                            className="flex items-center justify-center px-5 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium border-2 border-gray-300 shadow-sm hover:shadow-md active:scale-95"
                          >
                            Sample CSV
                          </a>
                          <label className="flex items-center justify-center space-x-2 px-5 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all font-medium cursor-pointer shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:scale-95">
                            <Download className="h-5 w-5" />
                            <span>Import CSV</span>
                            <input
                              type="file"
                              accept=".csv,text/csv"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const token = localStorage.getItem('token');
                                  const text = await file.text();
                                  // First do a dry-run to validate mapping
                                  let res = await fetch('/api/admin/products/import-csv?dryRun=true', {
                                    method: 'POST',
                                    headers: {
                                      'Authorization': `Bearer ${token}`,
                                      'Content-Type': 'text/csv',
                                    },
                                    body: text,
                                  });
                                  let data = await res.json();
                                  if (!res.ok) throw new Error(data.error || 'Validation failed');
                                  if (data.warnings?.length) {
                                    toast((t) => (
                                      <span className="text-sm">{`Warnings: ${data.warnings.length}. Proceeding with import...`}</span>
                                    ));
                                  }
                                  // Proceed actual import
                                  res = await fetch('/api/admin/products/import-csv', {
                                    method: 'POST',
                                    headers: {
                                      'Authorization': `Bearer ${token}`,
                                      'Content-Type': 'text/csv',
                                    },
                                    body: text,
                                  });
                                  data = await res.json();
                                  if (!res.ok) throw new Error(data.error || 'Import failed');
                                  toast.success(`Import complete: ${data.created} created, ${data.updated} updated`);
                                  fetchProducts();
                                } catch (err) {
                                  toast.error(err instanceof Error ? err.message : 'Import failed');
                                } finally {
                                  e.currentTarget.value = '';
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Products Table Section */}
                  {loading ? (
                    <div className="p-6">
                      <TableSkeleton rows={8} columns={6} />
                    </div>
                  ) : (
                    <>
                      {/* Desktop Table View */}
                      <div className="hidden lg:block -mx-4 sm:mx-0">
                        <div className="inline-block w-full align-middle">
                          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-xl">
                            <table className="w-full border-collapse border-spacing-0 table-fixed">
                              <thead className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-blue-200">
                                <tr className="m-0 p-0">
                                  <th className="w-[3%] px-4 py-0 text-left border-b border-gray-200 m-0 p-0">
                                    <div className="flex items-center justify-center h-6 m-0">
                                      <input
                                        type="checkbox"
                                        checked={selectedProductIds.length === products.length && products.length > 0}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            handleSelectAll();
                                          } else {
                                            handleClearAll();
                                          }
                                        }}
                                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded cursor-pointer"
                                        title="Select all products on this page"
                                      />
                                    </div>
                                  </th>
                                  <th
                                    className="w-[30%] px-4 xl:px-6 py-0 text-left text-xs font-bold text-gray-800 uppercase tracking-wider cursor-pointer hover:bg-blue-100/70 transition-all duration-200 group border-b border-gray-200 m-0 p-0 leading-none"
                                    onClick={() => handleProductSort('name')}
                                  >
                                    <div className="flex items-center space-x-1.5 h-6 m-0">
                                      <span className="m-0 leading-none">Product</span>
                                      <span className="opacity-0 group-hover:opacity-100 transition-opacity m-0">
                                        {getSortIcon('name')}
                                      </span>
                                      {productSortBy === 'name' && (
                                        <span className="opacity-100 m-0">{getSortIcon('name')}</span>
                                      )}
                                    </div>
                                  </th>
                                  <th
                                    className="w-[12%] px-4 xl:px-6 py-0 text-left text-xs font-bold text-gray-800 uppercase tracking-wider cursor-pointer hover:bg-blue-100/70 transition-all duration-200 group border-b border-gray-200 m-0 p-0 leading-none"
                                    onClick={() => handleProductSort('category')}
                                  >
                                    <div className="flex items-center space-x-1.5 h-6 m-0">
                                      <span className="m-0 leading-none">Category</span>
                                      <span className="opacity-0 group-hover:opacity-100 transition-opacity m-0">
                                        {getSortIcon('category')}
                                      </span>
                                      {productSortBy === 'category' && (
                                        <span className="opacity-100 m-0">{getSortIcon('category')}</span>
                                      )}
                                    </div>
                                  </th>
                                  <th
                                    className="w-[14%] px-4 xl:px-6 py-0 text-left text-xs font-bold text-gray-800 uppercase tracking-wider cursor-pointer hover:bg-blue-100/70 transition-all duration-200 group border-b border-gray-200 m-0 p-0 leading-none"
                                    onClick={() => handleProductSort('brand')}
                                  >
                                    <div className="flex items-center space-x-1.5 h-6 m-0">
                                      <span className="m-0 leading-none">Brand</span>
                                      <span className="opacity-0 group-hover:opacity-100 transition-opacity m-0">
                                        {getSortIcon('brand')}
                                      </span>
                                      {productSortBy === 'brand' && (
                                        <span className="opacity-100 m-0">{getSortIcon('brand')}</span>
                                      )}
                                    </div>
                                  </th>
                                  <th
                                    className="w-[10%] px-4 xl:px-6 py-0 text-left text-xs font-bold text-gray-800 uppercase tracking-wider cursor-pointer hover:bg-blue-100/70 transition-all duration-200 group border-b border-gray-200 m-0 p-0 leading-none"
                                    onClick={() => handleProductSort('price')}
                                  >
                                    <div className="flex items-center space-x-1.5 h-6 m-0">
                                      <span className="m-0 leading-none">Price</span>
                                      <span className="opacity-0 group-hover:opacity-100 transition-opacity m-0">
                                        {getSortIcon('price')}
                                      </span>
                                      {productSortBy === 'price' && (
                                        <span className="opacity-100 m-0">{getSortIcon('price')}</span>
                                      )}
                                    </div>
                                  </th>
                                  <th
                                    className="w-[8%] px-4 xl:px-6 py-0 text-left text-xs font-bold text-gray-800 uppercase tracking-wider cursor-pointer hover:bg-blue-100/70 transition-all duration-200 group border-b border-gray-200 m-0 p-0 leading-none"
                                    onClick={() => handleProductSort('stockCount')}
                                  >
                                    <div className="flex items-center space-x-1.5 h-6 m-0">
                                      <span className="m-0 leading-none">Stock</span>
                                      <span className="opacity-0 group-hover:opacity-100 transition-opacity m-0">
                                        {getSortIcon('stockCount')}
                                      </span>
                                      {productSortBy === 'stockCount' && (
                                        <span className="opacity-100 m-0">{getSortIcon('stockCount')}</span>
                                      )}
                                    </div>
                                  </th>
                                  <th
                                    className="w-[12%] px-4 xl:px-6 py-0 text-left text-xs font-bold text-gray-800 uppercase tracking-wider cursor-pointer hover:bg-blue-100/70 transition-all duration-200 group border-b border-gray-200 m-0 p-0 leading-none"
                                    onClick={() => handleProductSort('isActive')}
                                  >
                                    <div className="flex items-center space-x-1.5 h-6 m-0">
                                      <span className="m-0 leading-none">Status</span>
                                      <span className="opacity-0 group-hover:opacity-100 transition-opacity m-0">
                                        {getSortIcon('isActive')}
                                      </span>
                                      {productSortBy === 'isActive' && (
                                        <span className="opacity-100 m-0">{getSortIcon('isActive')}</span>
                                      )}
                                    </div>
                                  </th>
                                  <th className="w-[14%] px-4 xl:px-6 py-0 text-left text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-200 m-0 p-0 leading-none">
                                    <div className="h-6 m-0 leading-none">Actions</div>
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white m-0 p-0">
                                {products.map((product, index) => (
                                  <tr key={product._id} className={`hover:bg-blue-50/50 cursor-pointer transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} m-0 p-0`} onClick={() => handleEditProduct(product)}>
                                    <td className="w-[3%] px-4 py-5 align-top m-0 p-0" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex items-center justify-center h-6 m-0 p-0">
                                        <input
                                          type="checkbox"
                                          checked={selectedProductIds.includes(product._id)}
                                          onChange={() => handleProductSelection(product._id)}
                                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded cursor-pointer"
                                          title="Select this product"
                                        />
                                      </div>
                                    </td>
                                    <td className="w-[30%] px-4 xl:px-6 py-5 align-top m-0 p-0">
                                      <div className="flex items-center min-w-0 h-6 m-0 p-0">
                                        <div className="flex-shrink-0 h-5 w-5 m-0 p-0">
                                          <img
                                            className="h-5 w-5 rounded object-cover border border-gray-200 m-0 p-0"
                                            src={product.image}
                                            alt={product.name}
                                          />
                                        </div>
                                        <div className="ml-2 min-w-0 flex-1 m-0 p-0">
                                          <div
                                            className="text-xs font-semibold text-gray-900 truncate leading-none m-0 p-0 cursor-help"
                                            title={product.name}
                                          >
                                            {product.name.length > 50 ? `${product.name.substring(0, 50)}...` : product.name}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="w-[12%] px-4 xl:px-6 py-5 align-top text-gray-700 m-0 p-0">
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200 leading-none m-0">
                                        {product.category || 'N/A'}
                                      </span>
                                    </td>
                                    <td className="w-[14%] px-4 xl:px-6 py-5 align-top text-xs font-medium text-gray-700 truncate m-0 p-0 leading-none">
                                      {product.brand || 'N/A'}
                                    </td>
                                    <td className="w-[10%] px-4 xl:px-6 py-5 align-top m-0 p-0">
                                      <div className="flex items-center h-6 m-0 p-0">
                                        <DollarSign className="h-3 w-3 text-green-500 mr-0.5 flex-shrink-0 m-0" />
                                        <span className="font-semibold text-gray-900 text-xs m-0 leading-none">${(product.price ?? 0).toFixed(2)}</span>
                                      </div>
                                    </td>
                                    <td className="w-[8%] px-4 xl:px-6 py-5 align-top m-0 p-0">
                                      <div className="flex items-center h-6 m-0 p-0">
                                        <Package className="h-3 w-3 text-indigo-500 mr-0.5 flex-shrink-0 m-0" />
                                        <span className="font-medium text-gray-700 text-xs m-0 leading-none">{product.stockCount}</span>
                                      </div>
                                    </td>
                                    <td className="w-[12%] px-4 xl:px-6 py-5 align-top m-0 p-0">
                                      <div className="flex flex-wrap gap-0.5 items-center h-6 m-0 p-0">
                                        <span className={`inline-flex items-center px-1 py-0.5 rounded text-xs font-medium leading-none m-0 ${product.isActive
                                          ? 'bg-green-100 text-green-800 border border-green-200'
                                          : 'bg-red-100 text-red-800 border border-red-200'
                                          }`}>
                                          {product.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                        {(() => {
                                          const status = (product as any).status || 'draft';
                                          const publishAt = (product as any).publishAt ? new Date((product as any).publishAt) : null;
                                          const isScheduled = status === 'published' && publishAt && publishAt > new Date();
                                          const isLive = status === 'published' && (!publishAt || publishAt <= new Date());
                                          const badgeText = isScheduled ? 'Scheduled' : isLive ? 'Live' : status.charAt(0).toUpperCase() + status.slice(1);
                                          const badgeClass = isScheduled
                                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                            : isLive
                                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                              : status === 'archived'
                                                ? 'bg-gray-100 text-gray-700 border border-gray-200'
                                                : 'bg-purple-100 text-purple-800 border border-purple-200';
                                          return (
                                            <span className={`inline-flex items-center px-1 py-0.5 rounded text-xs font-medium leading-none m-0 ${badgeClass}`}>
                                              {badgeText}
                                            </span>
                                          );
                                        })()}
                                      </div>
                                    </td>
                                    <td className="w-[14%] px-4 xl:px-6 py-5 align-top text-xs font-medium m-0 p-0">
                                      <div className="flex flex-wrap gap-1 items-center m-0 p-0" onClick={(e) => e.stopPropagation()}>
                                        {/* Primary Actions */}
                                        <Link
                                          href={`/products/${product._id}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors duration-150 flex-shrink-0"
                                          title="View product"
                                        >
                                          <ExternalLink className="h-3.5 w-3.5" />
                                        </Link>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditProduct(product);
                                          }}
                                          className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors duration-150 flex-shrink-0"
                                          title="Edit product"
                                        >
                                          <Edit className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEmailMarketingProduct(product);
                                            setShowEmailMarketing(true);
                                          }}
                                          className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors duration-150 flex-shrink-0"
                                          title="Send promotional email"
                                        >
                                          <Mail className="h-3.5 w-3.5" />
                                        </button>

                                        {/* Copy Actions - Quick Access */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopyTitle(product);
                                          }}
                                          className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors duration-150 flex-shrink-0"
                                          title="Copy Title"
                                        >
                                          <FileText className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopyDescription(product);
                                          }}
                                          className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors duration-150 flex-shrink-0"
                                          title="Copy Description"
                                        >
                                          <FileText className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopyTags(product);
                                          }}
                                          className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors duration-150 flex-shrink-0"
                                          title="Copy Tags"
                                        >
                                          <Tag className="h-3.5 w-3.5" />
                                        </button>

                                        {/* Copy Menu for Additional Options */}
                                        <div className="relative group copy-menu-container flex-shrink-0">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              document.querySelectorAll('[id^="copy-menu-"]').forEach(menu => {
                                                if (menu.id !== `copy-menu-${product._id}`) {
                                                  menu.classList.add('hidden');
                                                }
                                              });
                                              const menu = document.getElementById(`copy-menu-${product._id}`);
                                              if (menu) {
                                                menu.classList.toggle('hidden');
                                              }
                                            }}
                                            className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors duration-150"
                                            title="More copy options"
                                          >
                                            <Copy className="h-3.5 w-3.5" />
                                          </button>
                                          <div
                                            id={`copy-menu-${product._id}`}
                                            className="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 copy-menu-container"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <div className="py-1">
                                              <button
                                                onClick={() => {
                                                  handleCopySpecs(product);
                                                  const menu = document.getElementById(`copy-menu-${product._id}`);
                                                  if (menu) menu.classList.add('hidden');
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                              >
                                                <FileText className="h-4 w-4" />
                                                <span>Copy Specifications</span>
                                              </button>
                                              <button
                                                onClick={() => {
                                                  handleCopyImageUrls(product);
                                                  const menu = document.getElementById(`copy-menu-${product._id}`);
                                                  if (menu) menu.classList.add('hidden');
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                              >
                                                <ImageIcon className="h-4 w-4" />
                                                <span>Copy Image URLs</span>
                                              </button>
                                              {(product as any).imageAltTexts && (product as any).imageAltTexts.length > 0 && (
                                                <button
                                                  onClick={() => {
                                                    handleCopyAltTexts(product);
                                                    const menu = document.getElementById(`copy-menu-${product._id}`);
                                                    if (menu) menu.classList.add('hidden');
                                                  }}
                                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                                >
                                                  <Sparkles className="h-4 w-4" />
                                                  <span>Copy Alt Texts</span>
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Image Actions */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleGenerateAltText(product._id, product.name);
                                          }}
                                          className={`p-1 rounded transition-colors duration-150 flex-shrink-0 ${(product as any).imageAltTexts && (product as any).imageAltTexts.length > 0
                                            ? 'text-green-600 hover:text-green-800 hover:bg-green-50'
                                            : 'text-orange-600 hover:text-orange-800 hover:bg-orange-50'
                                            }`}
                                          title={
                                            (product as any).imageAltTexts && (product as any).imageAltTexts.length > 0
                                              ? 'Alt text already generated - Click to regenerate'
                                              : 'Generate unique alt text for all images'
                                          }
                                        >
                                          <Sparkles className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOrganizeProductImages(product._id, product.name);
                                          }}
                                          className={`p-1 rounded transition-colors duration-150 flex-shrink-0 ${(() => {
                                            const allImages = [product.image, ...(product.images || [])].filter(Boolean);
                                            const hasCloudinary = allImages.some((url: string) =>
                                              url && (url.includes('cloudinary.com') || url.includes('res.cloudinary.com'))
                                            );
                                            return hasCloudinary
                                              ? 'text-green-600 hover:text-green-800 hover:bg-green-50'
                                              : 'text-purple-600 hover:text-purple-800 hover:bg-purple-50';
                                          })()
                                            }`}
                                          title={(() => {
                                            const allImages = [product.image, ...(product.images || [])].filter(Boolean);
                                            const hasCloudinary = allImages.some((url: string) =>
                                              url && (url.includes('cloudinary.com') || url.includes('res.cloudinary.com'))
                                            );
                                            return hasCloudinary
                                              ? 'Images already organized in Cloudinary'
                                              : 'Organize images in Cloudinary';
                                          })()}
                                        >
                                          <Cloud className="h-3.5 w-3.5" />
                                        </button>

                                        {/* Delete Action */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteProduct(product._id);
                                          }}
                                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors duration-150 flex-shrink-0"
                                          title="Delete product"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      {/* Mobile/Tablet Card View */}
                      <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4">
                        {products.map((product) => (
                          <div
                            key={product._id}
                            className="bg-white rounded-xl shadow-md border-2 border-gray-200 hover:shadow-xl transition-all duration-200 overflow-hidden active:scale-[0.98]"
                            onClick={() => handleEditProduct(product)}
                          >
                            {/* Card Header */}
                            <div className="flex items-start p-3 sm:p-4 space-x-3 sm:space-x-4">
                              <div className="flex-shrink-0">
                                <img
                                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg object-cover shadow-sm border-2 border-gray-200"
                                  src={product.image}
                                  alt={product.name}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm sm:text-base font-bold text-gray-900 line-clamp-2 mb-1.5">
                                  {product.name}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2">
                                  {product.description || 'No description'}
                                </p>
                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                  <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200">
                                    {product.category || 'N/A'}
                                  </span>
                                  {product.brand && (
                                    <span className="text-xs sm:text-sm text-gray-600 font-medium truncate max-w-[120px]">
                                      {product.brand}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Card Body */}
                            <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2.5 sm:space-y-3">
                              {/* Price, Stock, and Views */}
                              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2 sm:p-2.5">
                                <div className="flex items-center">
                                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mr-1.5" />
                                  <span className="font-bold text-base sm:text-lg text-gray-900">${(product.price ?? 0).toFixed(2)}</span>
                                  {product.originalPrice && product.originalPrice > (product.price ?? 0) && (
                                    <span className="ml-2 text-xs sm:text-sm text-gray-500 line-through">
                                      ${product.originalPrice.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center bg-indigo-50 px-2 sm:px-2.5 py-1 rounded-lg">
                                  <Package className="h-4 w-4 text-indigo-600 mr-1" />
                                  <span className="text-sm sm:text-base font-bold text-indigo-700">{product.stockCount}</span>
                                </div>
                              </div>

                              {/* Status */}
                              <div className="flex flex-wrap gap-2">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${product.isActive
                                  ? 'bg-green-100 text-green-800 border border-green-200'
                                  : 'bg-red-100 text-red-800 border border-red-200'
                                  }`}>
                                  {product.isActive ? 'Active' : 'Inactive'}
                                </span>
                                {(() => {
                                  const status = (product as any).status || 'draft';
                                  const publishAt = (product as any).publishAt ? new Date((product as any).publishAt) : null;
                                  const isScheduled = status === 'published' && publishAt && publishAt > new Date();
                                  const isLive = status === 'published' && (!publishAt || publishAt <= new Date());
                                  const badgeText = isScheduled ? 'Scheduled' : isLive ? 'Live' : status.charAt(0).toUpperCase() + status.slice(1);
                                  const badgeClass = isScheduled
                                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                    : isLive
                                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                      : status === 'archived'
                                        ? 'bg-gray-100 text-gray-700 border border-gray-200'
                                        : 'bg-purple-100 text-purple-800 border border-purple-200';
                                  return (
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
                                      {badgeText}
                                    </span>
                                  );
                                })()}
                              </div>

                              {/* Actions */}
                              <div className="pt-2.5 sm:pt-3 border-t-2 border-gray-200" onClick={(e) => e.stopPropagation()}>
                                <div className="flex flex-wrap gap-2">
                                  {/* Primary Actions */}
                                  <Link
                                    href={`/products/${product._id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex-1 flex items-center justify-center px-3 sm:px-4 py-2.5 sm:py-2 text-sm font-medium text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-all duration-150 border-2 border-blue-300 active:scale-95 min-h-[44px]"
                                  >
                                    <ExternalLink className="h-4 w-4 mr-1.5" />
                                    <span>View</span>
                                  </Link>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditProduct(product);
                                    }}
                                    className="flex-1 flex items-center justify-center px-3 sm:px-4 py-2.5 sm:py-2 text-sm font-medium text-indigo-700 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl transition-all duration-150 border-2 border-indigo-300 active:scale-95 min-h-[44px]"
                                  >
                                    <Edit className="h-4 w-4 mr-1.5" />
                                    <span>Edit</span>
                                  </button>

                                  {/* Quick Copy Actions */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyTitle(product);
                                    }}
                                    className="px-3 sm:px-3.5 py-2.5 sm:py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-150 border-2 border-gray-300 active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
                                    title="Copy Title"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyDescription(product);
                                    }}
                                    className="px-3 sm:px-3.5 py-2.5 sm:py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-150 border-2 border-gray-300 active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
                                    title="Copy Description"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyTags(product);
                                    }}
                                    className="px-3 sm:px-3.5 py-2.5 sm:py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-150 border-2 border-gray-300 active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
                                    title="Copy Tags"
                                  >
                                    <Tag className="h-4 w-4" />
                                  </button>

                                  {/* Copy Menu */}
                                  <div className="relative copy-menu-container">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        document.querySelectorAll('[id^="copy-menu-mobile-"]').forEach(menu => {
                                          if (menu.id !== `copy-menu-mobile-${product._id}`) {
                                            menu.classList.add('hidden');
                                          }
                                        });
                                        const menu = document.getElementById(`copy-menu-mobile-${product._id}`);
                                        if (menu) {
                                          menu.classList.toggle('hidden');
                                        }
                                      }}
                                      className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors duration-150 border border-gray-200"
                                      title="More copy options"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </button>
                                    <div
                                      id={`copy-menu-mobile-${product._id}`}
                                      className="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 copy-menu-container"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div className="py-1">
                                        <button
                                          onClick={() => {
                                            handleCopySpecs(product);
                                            const menu = document.getElementById(`copy-menu-mobile-${product._id}`);
                                            if (menu) menu.classList.add('hidden');
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                        >
                                          <FileText className="h-4 w-4" />
                                          <span>Copy Specifications</span>
                                        </button>
                                        <button
                                          onClick={() => {
                                            handleCopyImageUrls(product);
                                            const menu = document.getElementById(`copy-menu-mobile-${product._id}`);
                                            if (menu) menu.classList.add('hidden');
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                        >
                                          <ImageIcon className="h-4 w-4" />
                                          <span>Copy Image URLs</span>
                                        </button>
                                        {(product as any).imageAltTexts && (product as any).imageAltTexts.length > 0 && (
                                          <button
                                            onClick={() => {
                                              handleCopyAltTexts(product);
                                              const menu = document.getElementById(`copy-menu-mobile-${product._id}`);
                                              if (menu) menu.classList.add('hidden');
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                          >
                                            <Sparkles className="h-4 w-4" />
                                            <span>Copy Alt Texts</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Image Actions */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleGenerateAltText(product._id, product.name);
                                    }}
                                    className={`px-3 py-2 rounded-lg transition-colors duration-150 border ${(product as any).imageAltTexts && (product as any).imageAltTexts.length > 0
                                      ? 'text-green-600 hover:text-green-800 hover:bg-green-50 border-green-200'
                                      : 'text-orange-600 hover:text-orange-800 hover:bg-orange-50 border-orange-200'
                                      }`}
                                    title={
                                      (product as any).imageAltTexts && (product as any).imageAltTexts.length > 0
                                        ? 'Alt text already generated'
                                        : 'Generate alt text'
                                    }
                                  >
                                    <Sparkles className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOrganizeProductImages(product._id, product.name);
                                    }}
                                    className={`px-3 py-2 rounded-lg transition-colors duration-150 border ${(() => {
                                      const allImages = [product.image, ...(product.images || [])].filter(Boolean);
                                      const hasCloudinary = allImages.some((url: string) =>
                                        url && (url.includes('cloudinary.com') || url.includes('res.cloudinary.com'))
                                      );
                                      return hasCloudinary
                                        ? 'text-green-600 hover:text-green-800 hover:bg-green-50 border-green-200'
                                        : 'text-purple-600 hover:text-purple-800 hover:bg-purple-50 border-purple-200';
                                    })()
                                      }`}
                                    title="Organize images"
                                  >
                                    <Cloud className="h-4 w-4" />
                                  </button>

                                  {/* Delete Action */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteProduct(product._id);
                                    }}
                                    className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-150 border border-red-200"
                                    title="Delete product"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Pagination Controls */}
                  {!loading && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-5 sm:py-6 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 border-t-2 border-gray-200">
                      <div className="text-sm sm:text-base text-gray-700 font-semibold text-center sm:text-left">
                        {(() => {
                          const start = (productPage - 1) * productPerPage + 1;
                          const end = Math.min(productPage * productPerPage, totalProducts);
                          return (
                            <span>
                              Showing <span className="text-blue-700 font-bold">{start}</span> to <span className="text-blue-700 font-bold">{end}</span> of <span className="text-blue-700 font-bold">{totalProducts}</span> products
                            </span>
                          );
                        })()}
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
                        <div className="flex items-center space-x-2.5">
                          <span className="text-sm text-gray-600 font-medium">Items per page:</span>
                          <select
                            value={productPerPage}
                            onChange={(e) => { setProductPerPage(parseInt(e.target.value)); setProductPage(1); }}
                            className="px-3 sm:px-4 py-2 text-sm border-2 border-gray-300 text-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm hover:shadow-md transition-all font-medium"
                          >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                          </select>
                        </div>
                        <div className="flex items-center space-x-2.5">
                          <button
                            onClick={() => {
                              const prevPage = Math.max(1, productPage - 1);
                              setProductPage(prevPage);
                              fetchProducts(prevPage);
                            }}
                            className="px-4 py-2.5 text-sm font-medium border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 disabled:hover:text-gray-700 bg-white shadow-sm hover:shadow-md transform hover:-translate-y-0.5 disabled:transform-none"
                            disabled={productPage === 1}
                          >
                            <span className="flex items-center space-x-1.5">
                              <ChevronLeft className="h-4 w-4" />
                              <span>Previous</span>
                            </span>
                          </button>
                          <div className="flex items-center space-x-1">
                            <span className="px-4 py-2.5 text-sm font-bold text-blue-700 bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300 rounded-xl shadow-sm">
                              {productPage} / {totalProductPages}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              const nextPage = productPage + 1;
                              setProductPage(nextPage);
                              fetchProducts(nextPage);
                            }}
                            className="px-4 py-2.5 text-sm font-medium border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 disabled:hover:text-gray-700 bg-white shadow-sm hover:shadow-md transform hover:-translate-y-0.5 disabled:transform-none"
                            disabled={productPage >= totalProductPages}
                          >
                            <span className="flex items-center space-x-1.5">
                              <span>Next</span>
                              <ChevronLeft className="h-4 w-4 rotate-180" />
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Policy Review Tab */}
              {activeTab === 'policy-review' && (
                <div className="space-y-6 max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8">
                  <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-100 rounded-3xl p-6 sm:p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4" />
                          Etsy Policy & Gemini Review
                        </p>
                        <h2 className="text-2xl font-black text-gray-900 mt-2">Audit Listings Before Publishing</h2>
                        <p className="text-sm text-gray-700 mt-2 max-w-2xl">
                          Run the deterministic policy scanner together with Gemini&apos;s Seller Handbook analysis.
                          Spot risky claims, missing disclosures, and external links before they get flagged by Etsy.
                        </p>
                      </div>
                      <Link
                        href="https://www.etsy.com/seller-handbook"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-emerald-700 border border-emerald-200 font-semibold text-sm hover:bg-emerald-50 transition-colors"
                      >
                        Open Seller Handbook
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-700">
                      <div className="p-3 rounded-2xl bg-white/70 border border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Gemini Insights</p>
                        <p className="mt-1 text-gray-800">
                          AI highlights risky phrasing, missing disclosures, and references the seller handbook directly.
                        </p>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/70 border border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Deterministic Checks</p>
                        <p className="mt-1 text-gray-800">
                          Pattern-based guardrails catch personal info, spam language, and counterfeit keywords instantly.
                        </p>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/70 border border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Responsive Workflow</p>
                        <p className="mt-1 text-gray-800">
                          Cards adapt to any screen—review products on desktop or tablet while sourcing new listings.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                      <div className="w-full xl:max-w-xl">
                        <label className="text-sm font-medium text-gray-700">Search catalog</label>
                        <div className="relative mt-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <input
                            type="text"
                            placeholder="Filter by product, brand, or category"
                            value={policyReviewSearch}
                            onChange={(e) => setPolicyReviewSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 text-gray-800"
                          />
                        </div>
                      </div>
                      <div className="w-full xl:flex-1">
                        <div className="flex gap-2 overflow-x-auto sm:flex-wrap sm:overflow-visible pb-1 sm:pb-0">
                          {[
                            { label: 'All', value: 'all' },
                            { label: 'Needs Attention', value: 'risk' },
                            { label: 'Compliant', value: 'compliant' },
                            { label: 'Pending Review', value: 'pending' },
                          ].map((filter) => (
                            <button
                              key={filter.value}
                              onClick={() => setPolicyReviewFilter(filter.value as PolicyReviewFilter)}
                              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex-shrink-0 ${policyReviewFilter === filter.value
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                              {filter.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {renderEtsyPaginationControls('Policy review pagination', {
                    filteredCount: filteredPolicyProducts.length,
                    filteredLabel: 'products match current filters',
                  })}

                  {visiblePolicyProducts.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                      {visiblePolicyProducts.map((product) => {
                        const reviewEntry = policyReviewStatus[product._id];
                        const improvementEntry = policyImprovements[product._id];
                        const isReviewLoading = reviewEntry?.loading;
                        const result = reviewEntry?.result;
                        const lastReviewAt = result?.lastRunAt || product.policyReview?.lastRunAt || null;
                        const reviewLocked = Boolean(lastReviewAt);
                        const improvements = improvementEntry?.data;
                        const improvementSelection =
                          improvementEntry?.selection ?? {
                            title: true,
                            description: true,
                            tags: true,
                          };

                        const reviewBadges: AdminProductCardBadge[] = [];
                        if (result) {
                          reviewBadges.push({
                            label: result.summary.isCompliant ? 'Compliant' : 'Needs Attention',
                            tone: result.summary.isCompliant ? 'success' : 'danger',
                            icon: <ShieldCheck className="h-3.5 w-3.5" />,
                          });
                          if (result.aiReview?.riskLevel) {
                            const toneMap: Record<string, AdminProductCardBadge['tone']> = {
                              low: 'success',
                              medium: 'warning',
                              high: 'danger',
                            };
                            reviewBadges.push({
                              label: `Risk: ${result.aiReview.riskLevel.toUpperCase()}`,
                              tone: toneMap[result.aiReview.riskLevel.toLowerCase()] || 'info',
                              icon: <Activity className="h-3.5 w-3.5" />,
                            });
                          }
                          if (reviewLocked && lastReviewAt) {
                            reviewBadges.push({
                              label: `Reviewed ${formatDateTime(lastReviewAt)}`,
                              tone: 'info',
                              icon: <Clock className="h-3.5 w-3.5" />,
                              subtle: true,
                            });
                          }
                        } else {
                          reviewBadges.push({
                            label: isReviewLoading ? 'Review Running' : 'Review Pending',
                            tone: isReviewLoading ? 'info' : 'neutral',
                            icon: <Sparkles className="h-3.5 w-3.5" />,
                          });
                        }

                        const reviewStats: AdminProductCardStat[] = [];
                        if (result) {
                          reviewStats.push({
                            label: 'Rule Score',
                            value: `${result.score}/100`,
                            tone: result.summary.isCompliant ? 'success' : 'danger',
                            icon: <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />,
                            helper: `${result.summary.criticalIssues} critical · ${result.summary.warnings} warnings`,
                          });
                          reviewStats.push({
                            label: 'Critical Issues',
                            value: result.summary.criticalIssues,
                            tone: result.summary.criticalIssues ? 'danger' : 'success',
                            icon: <AlertTriangle className="h-3.5 w-3.5 text-red-500" />,
                          });
                          reviewStats.push({
                            label: 'Warnings',
                            value: result.summary.warnings,
                            tone: result.summary.warnings ? 'warning' : 'success',
                            icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
                          });
                          if (result.aiReview?.riskLevel) {
                            reviewStats.push({
                              label: 'AI Risk',
                              value: result.aiReview.riskLevel.toUpperCase(),
                              tone:
                                result.aiReview.riskLevel.toLowerCase() === 'low'
                                  ? 'success'
                                  : result.aiReview.riskLevel.toLowerCase() === 'high'
                                    ? 'danger'
                                    : 'warning',
                              icon: <Activity className="h-3.5 w-3.5 text-slate-500" />,
                            });
                          }
                        } else if (!isReviewLoading) {
                          reviewStats.push({
                            label: 'Review Status',
                            value: 'Not run',
                            tone: 'warning',
                            icon: <Sparkles className="h-3.5 w-3.5 text-amber-500" />,
                            helper: 'Run Gemini to see compliance insights',
                          });
                        }

                        const toolbarButtonClass =
                          'p-2 rounded-full border border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600 transition-colors';

                        const actionButtons = [
                          {
                            title: 'Edit product',
                            icon: <Edit className="h-4 w-4" />,
                            onClick: () => handleEditProduct(product),
                          },
                          {
                            title: 'Copy title',
                            icon: <Type className="h-4 w-4" />,
                            onClick: () => handleCopyTitle(product),
                          },
                          {
                            title: 'Copy description',
                            icon: <FileText className="h-4 w-4" />,
                            onClick: () => handleCopyDescription(product),
                          },
                          {
                            title: 'Copy tags',
                            icon: <Tag className="h-4 w-4" />,
                            onClick: () => handleCopyTags(product),
                          },
                          {
                            title: 'Copy specs',
                            icon: <ListChecks className="h-4 w-4" />,
                            onClick: () => handleCopySpecs(product),
                          },
                          {
                            title: 'Copy image URLs',
                            icon: <ImageIcon className="h-4 w-4" />,
                            onClick: () => handleCopyImageUrls(product),
                          },
                          {
                            title: 'Copy alt text',
                            icon: <AlignLeft className="h-4 w-4" />,
                            onClick: () => handleCopyAltTexts(product),
                          },
                        ];

                        return (
                          <AdminProductCard
                            key={product._id}
                            product={product}
                            metaBadges={reviewBadges}
                            statHighlights={reviewStats}
                            highlightTone="emerald"
                            density="compact"
                            showTags={false}
                            topRightSlot={
                              <div className="text-right text-xs text-gray-500 space-y-1">
                                <p className="font-mono">#{(product._id || '').slice(-6)}</p>
                                <Link
                                  href={`/products/${product._id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-sm hover:text-emerald-900"
                                >
                                  View listing
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Link>
                              </div>
                            }
                            actionButtons={actionButtons.map(btn => (
                              <button
                                key={btn.title}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  btn.onClick();
                                }}
                                className={toolbarButtonClass}
                                title={btn.title}
                              >
                                {btn.icon}
                              </button>
                            ))}
                            secondaryActions={
                              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                                <button
                                  type="button"
                                  onClick={() => handleRunPolicyReview(product)}
                                  disabled={isReviewLoading || reviewLocked}
                                  className="w-full sm:w-auto px-4 py-2 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-700 hover:border-emerald-200 hover:text-emerald-700 transition-colors disabled:opacity-50"
                                  title={
                                    reviewLocked
                                      ? 'Gemini review already saved for this product'
                                      : 'Run policy review'
                                  }
                                >
                                  {reviewLocked ? 'Locked' : 'Quick Run'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleImproveProduct(product, result)}
                                  disabled={improvementEntry?.loading}
                                  className="w-full sm:w-auto px-4 py-2 rounded-2xl border border-emerald-200 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                  {improvementEntry?.loading ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      Improving...
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="h-4 w-4" />
                                      Improve Listing
                                    </>
                                  )}
                                </button>
                              </div>
                            }
                            primaryAction={{
                              label: reviewLocked
                                ? 'Review Locked'
                                : result
                                  ? 'Re-run Gemini Review'
                                  : 'Run Gemini Review',
                              onClick: () => {
                                if (reviewLocked) return;
                                handleRunPolicyReview(product);
                              },
                              loading: isReviewLoading,
                              icon: <Sparkles className="h-4 w-4" />,
                              disabled: reviewLocked,
                            }}
                          >
                            {reviewEntry?.error && (
                              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-3 py-2">
                                {reviewEntry.error}
                              </p>
                            )}
                            {reviewLocked && lastReviewAt && (
                              <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-2xl px-3 py-2">
                                Gemini scan locked on {formatDateTime(lastReviewAt)}. Re-run is disabled to
                                avoid duplicate processing.
                              </p>
                            )}

                            {result ? (
                              <div className="space-y-4">
                                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-emerald-600" />
                                    Gemini Summary
                                  </p>
                                  <p className="text-sm text-gray-700 mt-2">
                                    {result.aiReview?.summary ||
                                      'Gemini did not include an additional summary.'}
                                  </p>
                                </div>

                                {result.aiReview?.issues?.length ? (
                                  <div className="space-y-2">
                                    {result.aiReview.issues.slice(0, 3).map((issue, idx) => (
                                      <div
                                        key={`${product._id}-issue-${idx}`}
                                        className="p-3 rounded-2xl border border-gray-100 bg-gray-50 text-sm text-gray-700"
                                      >
                                        <span className="font-semibold text-gray-900">
                                          {issue.policy || 'Policy'}
                                        </span>
                                        : {issue.description || 'Gemini flagged this area.'}
                                        {issue.fix && (
                                          <p className="text-xs text-gray-500 mt-1">
                                            Fix: {issue.fix}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                    {result.aiReview.issues.length > 3 && (
                                      <p className="text-xs text-gray-500">
                                        +{result.aiReview.issues.length - 3} more callouts
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-2xl px-3 py-2">
                                    Gemini did not flag any additional risks.
                                  </p>
                                )}
                              </div>
                            ) : (
                              !isReviewLoading && (
                                <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-600">
                                  Run a review to see Gemini feedback, rule-based scores, and quick fixes.
                                </div>
                              )
                            )}

                            {improvementEntry?.error && !improvementEntry.loading && (
                              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-3 py-2">
                                {improvementEntry.error}
                              </p>
                            )}

                            {improvements ? (
                              <div className="space-y-3 rounded-2xl border border-emerald-100 bg-white p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                      <Sparkles className="h-4 w-4 text-emerald-600" />
                                      AI Improvement Plan
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      {improvements.summary || 'Gemini prepared refinements for this listing.'}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleApplyImprovements(product)}
                                    disabled={improvementEntry?.applying}
                                    className="px-4 py-2 rounded-2xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60 flex items-center gap-2"
                                  >
                                    {improvementEntry?.applying ? (
                                      <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Applying...
                                      </>
                                    ) : (
                                      'Apply Selected'
                                    )}
                                  </button>
                                </div>

                                {improvements.title?.suggestion && (
                                  <label
                                    className={`block rounded-2xl border p-3 transition-colors ${improvementSelection.title !== false
                                      ? 'border-emerald-200 bg-emerald-50/40'
                                      : 'border-gray-200'
                                      }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <input
                                        type="checkbox"
                                        className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                        checked={improvementSelection.title ?? true}
                                        onChange={(e) =>
                                          handleToggleImprovementSelection(product._id, 'title', e.target.checked)
                                        }
                                      />
                                      <div className="space-y-1">
                                        <p className="text-sm font-semibold text-gray-900">Title</p>
                                        <p className="text-xs text-gray-500 line-clamp-1">
                                          Current: {product.name}
                                        </p>
                                        <p className="text-sm text-gray-900">
                                          Suggestion: {improvements.title.suggestion}
                                        </p>
                                        {improvements.title.reasoning && (
                                          <p className="text-xs text-gray-500">
                                            Reason: {improvements.title.reasoning}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </label>
                                )}

                                {improvements.description?.suggestion && (
                                  <label
                                    className={`block rounded-2xl border p-3 transition-colors ${improvementSelection.description !== false
                                      ? 'border-emerald-200 bg-emerald-50/40'
                                      : 'border-gray-200'
                                      }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <input
                                        type="checkbox"
                                        className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                        checked={improvementSelection.description ?? true}
                                        onChange={(e) =>
                                          handleToggleImprovementSelection(product._id, 'description', e.target.checked)
                                        }
                                      />
                                      <div className="space-y-1">
                                        <p className="text-sm font-semibold text-gray-900">Description</p>
                                        <p className="text-xs text-gray-500 line-clamp-2">
                                          Current: {product.description}
                                        </p>
                                        <div className="text-sm text-gray-900 bg-white border border-gray-100 rounded-xl p-2">
                                          {improvements.description.suggestion}
                                        </div>
                                        {improvements.description.reasoning && (
                                          <p className="text-xs text-gray-500">
                                            Reason: {improvements.description.reasoning}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </label>
                                )}

                                {improvements.tags?.suggestion && improvements.tags.suggestion.length > 0 && (
                                  <label
                                    className={`block rounded-2xl border p-3 transition-colors ${improvementSelection.tags !== false
                                      ? 'border-emerald-200 bg-emerald-50/40'
                                      : 'border-gray-200'
                                      }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <input
                                        type="checkbox"
                                        className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                        checked={improvementSelection.tags ?? true}
                                        onChange={(e) =>
                                          handleToggleImprovementSelection(product._id, 'tags', e.target.checked)
                                        }
                                      />
                                      <div className="space-y-1 flex-1">
                                        <p className="text-sm font-semibold text-gray-900">Tags</p>
                                        <p className="text-xs text-gray-500">
                                          Current: {(product.tags || []).slice(0, 6).join(', ') || '—'}
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                          {improvements.tags.suggestion.slice(0, 13).map(tagValue => (
                                            <span
                                              key={tagValue}
                                              className="px-2.5 py-1 rounded-full bg-white border border-emerald-100 text-xs font-medium text-emerald-700"
                                            >
                                              {tagValue}
                                            </span>
                                          ))}
                                        </div>
                                        {improvements.tags.reasoning && (
                                          <p className="text-xs text-gray-500">
                                            Reason: {improvements.tags.reasoning}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </label>
                                )}

                                {improvements.notes && improvements.notes.length > 0 && (
                                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                      Notes
                                    </p>
                                    <ul className="mt-1 list-disc list-inside text-sm text-gray-700 space-y-1">
                                      {improvements.notes.map((note: string, idx: number) => (
                                        <li key={`${product._id}-note-${idx}`}>{note}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ) : improvementEntry?.loading ? (
                              <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                                Generating improvement plan...
                              </div>
                            ) : null}
                          </AdminProductCard>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white border border-dashed border-gray-300 rounded-3xl p-8 text-center text-gray-600">
                      {products.length
                        ? 'No products match your filters yet. Adjust search or run a new review.'
                        : 'No products found. Import or create listings to start reviewing.'}
                    </div>
                  )}

                </div>
              )}

              {/* Support Tickets Tab */}
              {activeTab === 'support' && (
                <div className="space-y-6">
                  {/* Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">Total Tickets</p>
                          <p className="text-2xl font-bold text-blue-900 mt-1">{supportTickets.length}</p>
                        </div>
                        <MessageSquare className="h-8 w-8 text-blue-500" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-yellow-600">Open</p>
                          <p className="text-2xl font-bold text-yellow-900 mt-1">
                            {supportTickets.filter(t => t.status === 'open').length}
                          </p>
                        </div>
                        <AlertCircle className="h-8 w-8 text-yellow-500" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-600">In Progress</p>
                          <p className="text-2xl font-bold text-orange-900 mt-1">
                            {supportTickets.filter(t => t.status === 'in_progress').length}
                          </p>
                        </div>
                        <Clock className="h-8 w-8 text-orange-500" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-red-600">Urgent</p>
                          <p className="text-2xl font-bold text-red-900 mt-1">
                            {supportTickets.filter(t => t.priority === 'urgent').length}
                          </p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-red-500" />
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">Support Tickets</h2>
                          <p className="text-sm text-gray-600 mt-1">Manage and respond to customer support requests</p>
                        </div>
                        <button
                          onClick={fetchSupportTickets}
                          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                        >
                          <RefreshCw className="h-4 w-4" />
                          <span>Refresh</span>
                        </button>
                      </div>

                      {/* Search and Filters */}
                      <div className="space-y-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <input
                            type="text"
                            placeholder="Search by ticket number, subject, or message content..."
                            value={supportSearchTerm}
                            onChange={(e) => setSupportSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchSupportTickets()}
                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder:text-gray-400"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <SelectField
                            options={[
                              { value: 'all', label: 'All Statuses' },
                              { value: 'open', label: 'Open' },
                              { value: 'in_progress', label: 'In Progress' },
                              { value: 'waiting_customer', label: 'Waiting Customer' },
                              { value: 'resolved', label: 'Resolved' },
                              { value: 'closed', label: 'Closed' },
                            ]}
                            value={supportStatusFilter}
                            isOpen={openSelect === 'supportStatus'}
                            onOpenChange={(open) => setOpenSelect(open ? 'supportStatus' : null)}
                            onSelect={(value) => setSupportStatusFilter(value)}
                            placeholder="All Statuses"
                            className="w-full"
                          />
                          <SelectField
                            options={[
                              { value: 'all', label: 'All Categories' },
                              { value: 'order', label: 'Order' },
                              { value: 'product', label: 'Product' },
                              { value: 'payment', label: 'Payment' },
                              { value: 'shipping', label: 'Shipping' },
                              { value: 'technical', label: 'Technical' },
                              { value: 'other', label: 'Other' },
                            ]}
                            value={supportCategoryFilter}
                            isOpen={openSelect === 'supportCategory'}
                            onOpenChange={(open) => setOpenSelect(open ? 'supportCategory' : null)}
                            onSelect={(value) => setSupportCategoryFilter(value)}
                            placeholder="All Categories"
                            className="w-full"
                          />
                          <SelectField
                            options={[
                              { value: 'all', label: 'All Priorities' },
                              { value: 'low', label: 'Low' },
                              { value: 'medium', label: 'Medium' },
                              { value: 'high', label: 'High' },
                              { value: 'urgent', label: 'Urgent' },
                            ]}
                            value={supportPriorityFilter}
                            isOpen={openSelect === 'supportPriority'}
                            onOpenChange={(open) => setOpenSelect(open ? 'supportPriority' : null)}
                            onSelect={(value) => setSupportPriorityFilter(value)}
                            placeholder="All Priorities"
                            className="w-full"
                          />
                          <button
                            onClick={fetchSupportTickets}
                            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                          >
                            Apply Filters
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      {supportLoading ? (
                        <TableSkeleton rows={8} columns={8} />
                      ) : supportTickets.length === 0 ? (
                        <div className="p-16 text-center">
                          <MessageSquare className="h-20 w-20 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">No tickets found</h3>
                          <p className="text-gray-600">No support tickets match your current filters.</p>
                        </div>
                      ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ticket</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Customer</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Subject</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Priority</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Assigned</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {supportTickets.map((ticket) => (
                              <tr 
                                key={ticket._id} 
                                className="hover:bg-blue-50/50 cursor-pointer transition-colors border-l-4 border-transparent hover:border-blue-500"
                                onClick={() => handleViewTicket(ticket)}
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-gray-400" />
                                    <div>
                                      <div className="text-sm font-semibold text-gray-900">{ticket.ticketNumber}</div>
                                      <div className="text-xs text-gray-500">{ticket.messages?.length || 0} message{ticket.messages?.length !== 1 ? 's' : ''}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                                      {(ticket.guestEmail || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">{ticket.guestEmail || 'Guest User'}</div>
                                      {ticket.userId ? (
                                        <div className="text-xs text-blue-600 flex items-center gap-1">
                                          <User className="h-3 w-3" />
                                          Registered
                                        </div>
                                      ) : (
                                        <div className="text-xs text-gray-500">Guest</div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm font-medium text-gray-900 max-w-xs truncate" title={ticket.subject}>
                                    {ticket.subject}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 capitalize border border-blue-200">
                                    {ticket.category}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                    ticket.priority === 'urgent' ? 'bg-red-100 text-red-800 border border-red-200' :
                                    ticket.priority === 'high' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                                    ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                    'bg-gray-100 text-gray-800 border border-gray-200'
                                  }`}>
                                    {ticket.priority === 'urgent' && <AlertTriangle className="h-3 w-3 mr-1" />}
                                    {ticket.priority.toUpperCase()}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <select
                                    value={ticket.status}
                                    onChange={(e) => handleUpdateTicket(ticket._id, { status: e.target.value })}
                                    onClick={(e) => e.stopPropagation()}
                                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border-0 focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all ${
                                      ticket.status === 'open' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                                      ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                                      ticket.status === 'waiting_customer' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' :
                                      ticket.status === 'resolved' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                                      'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                    }`}
                                  >
                                    <option value="open">Open</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="waiting_customer">Waiting Customer</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                  </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <select
                                    value={ticket.assignedTo || 'unassigned'}
                                    onChange={(e) => handleUpdateTicket(ticket._id, { assignedTo: e.target.value === 'unassigned' ? null : e.target.value })}
                                    className="text-xs px-3 py-1.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <option value="unassigned">Unassigned</option>
                                    {adminUsers.map(admin => (
                                      <option key={admin._id} value={admin._id}>{admin.name || admin.email}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900 font-medium">
                                    {new Date(ticket.createdAt).toLocaleDateString()}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewTicket(ticket);
                                    }}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors"
                                    title="View ticket details"
                                  >
                                    <Eye className="h-4 w-4" />
                                    View
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">Order Management</h2>
                      <button
                        onClick={fetchOrders}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span>Refresh</span>
                      </button>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col lg:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <input
                            type="text"
                            placeholder="Search orders by number, customer name, or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border text-gray-700 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="w-full lg:w-auto">
                        <SelectField
                          options={[
                            { value: '', label: 'All Statuses' },
                            { value: 'pending', label: 'Pending' },
                            { value: 'processing', label: 'Processing' },
                            { value: 'shipped', label: 'Shipped' },
                            { value: 'delivered', label: 'Delivered' },
                            { value: 'cancelled', label: 'Cancelled' },
                          ]}
                          value={selectedOrderStatus}
                          isOpen={openSelect === 'orderStatus'}
                          onOpenChange={(open) => setOpenSelect(open ? 'orderStatus' : null)}
                          onSelect={(value) => setSelectedOrderStatus(value)}
                          className="w-full lg:w-auto"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    {loading ? (
                      <TableSkeleton rows={8} columns={7} />
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200 min-w-[1200px]">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Order
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Customer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Items
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Payment
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {orders
                            .filter(order => {
                              const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
                              const matchesStatus = !selectedOrderStatus || order.status === selectedOrderStatus;
                              return matchesSearch && matchesStatus;
                            })
                            .map((order) => (
                              <tr key={order._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewOrder(order)}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">#{order.orderNumber}</div>
                                    <div className="text-sm text-gray-500">ID: {order._id.slice(-8)}</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{order.user?.name || 'N/A'}</div>
                                    <div className="text-sm text-gray-500">{order.user?.email || 'N/A'}</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {order.items.slice(0, 2).map(item => item.product.name).join(', ')}
                                    {order.items.length > 2 && ` +${order.items.length - 2} more`}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <div className="flex items-center">
                                    <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                                    {order.total.toFixed(2)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-2">
                                    <select
                                      value={order.status}
                                      onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                      className={`text-xs font-medium px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-blue-500 ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                          order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                              'bg-red-100 text-red-800'
                                        }`}
                                    >
                                      <option value="pending">Pending</option>
                                      <option value="processing">Processing</option>
                                      <option value="shipped">Shipped</option>
                                      <option value="delivered">Delivered</option>
                                      <option value="cancelled">Cancelled</option>
                                    </select>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-2">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.paymentStatus === 'paid'
                                      ? 'bg-green-100 text-green-800'
                                      : order.paymentStatus === 'pending'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                      }`}>
                                      {order.paymentStatus}
                                    </span>
                                    <span className="text-xs text-gray-500">{order.paymentMethod}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <div>
                                    <div>{new Date(order.createdAt).toLocaleDateString()}</div>
                                    <div className="text-xs text-gray-400">
                                      {new Date(order.createdAt).toLocaleTimeString()}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewOrder(order);
                                      }}
                                      className="text-indigo-600 hover:text-indigo-900"
                                      title="View order details"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadInvoice(order._id);
                                      }}
                                      className="text-green-600 hover:text-green-900"
                                      title="Download invoice"
                                    >
                                      <Download className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteOrder(order._id);
                                      }}
                                      className="text-red-600 hover:text-red-900"
                                      title="Delete order"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* User Form Modal */}
              <UserForm
                user={editingUser || undefined}
                roles={roles}
                isOpen={showCreateUser || !!editingUser}
                onClose={() => {
                  setShowCreateUser(false);
                  setEditingUser(null);
                  updateQuery({ userId: undefined });
                }}
                onSuccess={handleUserFormSuccess}
              />

              {/* Role Form Modal */}
              <RoleForm
                role={editingRole || undefined}
                isOpen={showCreateRole || !!editingRole}
                onClose={() => {
                  setShowCreateRole(false);
                  setEditingRole(null);
                }}
                onSuccess={handleRoleFormSuccess}
              />

              {/* Product Form Modal */}
              <ProductForm
                product={editingProduct || undefined}
                isOpen={showCreateProduct || !!editingProduct}
                onClose={() => {
                  setShowCreateProduct(false);
                  setEditingProduct(null);
                  updateQuery({ productId: undefined });
                }}
                onSuccess={handleProductFormSuccess}
              />

              {/* Order Detail Modal */}
              <OrderDetailModal
                order={viewingOrder}
                isOpen={!!viewingOrder}
                onClose={() => {
                  setViewingOrder(null);
                  updateQuery({ orderId: undefined });
                }}
                onUpdateStatus={handleUpdateOrderStatus}
                onDeleteOrder={handleDeleteOrder}
                onDownloadInvoice={handleDownloadInvoice}
              />

              {/* Support Ticket Detail Modal */}
              {viewingTicket && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                  <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity" onClick={() => setViewingTicket(null)}></div>
                    <div className="relative inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full border-0">
                      {/* Enhanced Header with Better Colors */}
                      <div className="relative bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 px-8 py-6 overflow-hidden">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
                        <div className="relative flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-3">
                              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 shadow-lg">
                                <MessageSquare className="h-7 w-7 text-white" />
                              </div>
                              <div>
                                <h3 className="text-2xl font-bold text-white mb-1">{viewingTicket.ticketNumber}</h3>
                                <p className="text-base text-blue-50 font-medium">{viewingTicket.subject}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-4">
                              <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-bold shadow-md ${
                                viewingTicket.status === 'open' ? 'bg-blue-500 text-white border-2 border-blue-400' :
                                viewingTicket.status === 'in_progress' ? 'bg-amber-500 text-white border-2 border-amber-400' :
                                viewingTicket.status === 'waiting_customer' ? 'bg-orange-500 text-white border-2 border-orange-400' :
                                viewingTicket.status === 'resolved' ? 'bg-emerald-500 text-white border-2 border-emerald-400' :
                                'bg-slate-500 text-white border-2 border-slate-400'
                              }`}>
                                {viewingTicket.status === 'open' && <AlertCircle className="h-3.5 w-3.5 mr-1.5" />}
                                {viewingTicket.status === 'in_progress' && <Clock className="h-3.5 w-3.5 mr-1.5" />}
                                {viewingTicket.status === 'waiting_customer' && <Clock className="h-3.5 w-3.5 mr-1.5" />}
                                {viewingTicket.status === 'resolved' && <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
                                {viewingTicket.status === 'closed' && <XCircle className="h-3.5 w-3.5 mr-1.5" />}
                                {viewingTicket.status.replace('_', ' ').toUpperCase()}
                              </span>
                              <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-bold shadow-md ${
                                viewingTicket.priority === 'urgent' ? 'bg-red-600 text-white border-2 border-red-400 animate-pulse' :
                                viewingTicket.priority === 'high' ? 'bg-orange-500 text-white border-2 border-orange-400' :
                                viewingTicket.priority === 'medium' ? 'bg-yellow-500 text-white border-2 border-yellow-400' :
                                'bg-slate-400 text-white border-2 border-slate-300'
                              }`}>
                                {viewingTicket.priority === 'urgent' && <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />}
                                {viewingTicket.priority === 'high' && <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />}
                                {viewingTicket.priority.toUpperCase()}
                              </span>
                              <span className="inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-bold bg-white/25 text-white capitalize backdrop-blur-sm border border-white/30">
                                {viewingTicket.category}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => setViewingTicket(null)}
                            className="ml-4 text-white/90 hover:text-white transition-all p-2.5 hover:bg-white/20 rounded-xl backdrop-blur-sm"
                          >
                            <X className="h-6 w-6" />
                          </button>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-gray-50 to-white">
                        {/* Enhanced Customer Info & Quick Actions */}
                        <div className="px-8 py-6">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                            {/* Customer Card */}
                            <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-md border-2 border-gray-100">
                              <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Customer Information</label>
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-lg border-4 border-white">
                                  {(viewingTicket.guestEmail || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <p className="text-base font-bold text-gray-900 mb-1">{viewingTicket.guestEmail || 'Guest User'}</p>
                                  {viewingTicket.userId ? (
                                    <div className="flex items-center gap-2">
                                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                                        <User className="h-3 w-3 mr-1.5" />
                                        Registered User
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                      Guest User
                                    </span>
                                  )}
                                  {viewingTicket.createdAt && (
                                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      Created {new Date(viewingTicket.createdAt).toLocaleDateString()} at {new Date(viewingTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Quick Actions Card */}
                            <div className="bg-white rounded-xl p-5 shadow-md border-2 border-gray-100">
                              <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Quick Actions</label>
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Status</label>
                                  <SelectField
                                    options={[
                                      { value: 'open', label: 'Open' },
                                      { value: 'in_progress', label: 'In Progress' },
                                      { value: 'waiting_customer', label: 'Waiting Customer' },
                                      { value: 'resolved', label: 'Resolved' },
                                      { value: 'closed', label: 'Closed' },
                                    ]}
                                    value={viewingTicket.status}
                                    isOpen={openSelect === 'ticketStatus'}
                                    onOpenChange={(open) => setOpenSelect(open ? 'ticketStatus' : null)}
                                    onSelect={(value) => handleUpdateTicket(viewingTicket._id, { status: value })}
                                    placeholder="Select status"
                                    className="w-full"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Priority</label>
                                  <SelectField
                                    options={[
                                      { value: 'low', label: 'Low' },
                                      { value: 'medium', label: 'Medium' },
                                      { value: 'high', label: 'High' },
                                      { value: 'urgent', label: 'Urgent' },
                                    ]}
                                    value={viewingTicket.priority}
                                    isOpen={openSelect === 'ticketPriority'}
                                    onOpenChange={(open) => setOpenSelect(open ? 'ticketPriority' : null)}
                                    onSelect={(value) => handleUpdateTicket(viewingTicket._id, { priority: value })}
                                    placeholder="Select priority"
                                    className="w-full"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Assign To</label>
                                  <SelectField
                                    options={[
                                      { value: 'unassigned', label: 'Unassigned' },
                                      ...adminUsers.map(admin => ({ 
                                        value: admin._id, 
                                        label: admin.name || admin.email 
                                      })),
                                    ]}
                                    value={viewingTicket.assignedTo || 'unassigned'}
                                    isOpen={openSelect === 'ticketAssigned'}
                                    onOpenChange={(open) => setOpenSelect(open ? 'ticketAssigned' : null)}
                                    onSelect={(value) => handleUpdateTicket(viewingTicket._id, { assignedTo: value === 'unassigned' ? null : value })}
                                    placeholder="Select admin"
                                    className="w-full"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Enhanced Messages Section */}
                          <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-100 mb-6">
                            <div className="flex items-center justify-between mb-5 pb-4 border-b-2 border-gray-100">
                              <h4 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                                  <MessageSquare className="h-5 w-5 text-white" />
                                </div>
                                Conversation Thread
                              </h4>
                              <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                                {viewingTicket.messages?.length || 0} message{viewingTicket.messages?.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="space-y-5 max-h-[450px] overflow-y-auto pr-3 custom-scrollbar">
                              {viewingTicket.messages?.map((msg: any, idx: number) => (
                                <div
                                  key={msg._id}
                                  className={`flex gap-4 ${msg.senderType === 'admin' ? 'flex-row-reverse' : ''}`}
                                >
                                  <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border-2 ${
                                    msg.senderType === 'admin' 
                                      ? 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 border-blue-400' 
                                      : 'bg-gradient-to-br from-gray-400 to-gray-500 border-gray-300'
                                  }`}>
                                    {msg.senderType === 'admin' ? (
                                      <Shield className="h-6 w-6 text-white" />
                                    ) : (
                                      <User className="h-6 w-6 text-white" />
                                    )}
                                  </div>
                                  <div className={`flex-1 ${msg.senderType === 'admin' ? 'text-right' : ''}`}>
                                    <div className={`inline-block max-w-[80%] ${
                                      msg.senderType === 'admin' ? 'text-right' : 'text-left'
                                    }`}>
                                      <div className={`flex items-center gap-2 mb-2 ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                        <span className="text-sm font-bold text-gray-800">{msg.senderName}</span>
                                        {msg.senderType === 'admin' && (
                                          <span className="text-xs px-2.5 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-bold shadow-sm">
                                            ADMIN
                                          </span>
                                        )}
                                        <span className="text-xs text-gray-400 font-medium">
                                          {new Date(msg.createdAt).toLocaleDateString()} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                      <div className={`p-4 rounded-2xl shadow-md ${
                                        msg.senderType === 'admin'
                                          ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200'
                                          : 'bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200'
                                      }`}>
                                        <p className={`text-sm whitespace-pre-wrap leading-relaxed ${
                                          msg.senderType === 'admin' ? 'text-gray-800' : 'text-gray-700'
                                        }`}>{msg.message}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Enhanced Reply Form */}
                          {viewingTicket.status !== 'closed' && (
                            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200 shadow-lg">
                              <label className="block text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                                  <Send className="h-4 w-4 text-white" />
                                </div>
                                Reply as Admin
                              </label>
                              <textarea
                                value={ticketMessage}
                                onChange={(e) => setTicketMessage(e.target.value)}
                                rows={6}
                                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y mb-4 bg-white shadow-sm transition-all text-sm text-gray-900 placeholder:text-gray-400"
                                placeholder="Type your response to the customer..."
                                maxLength={5000}
                              />
                              <div className="flex justify-between items-center">
                                <p className="text-xs text-gray-600 font-semibold">
                                  {ticketMessage.length}/5000 characters
                                </p>
                                <button
                                  onClick={() => handleSendTicketMessage(viewingTicket._id)}
                                  disabled={sendingMessage || !ticketMessage.trim()}
                                  className="px-8 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 disabled:transform-none"
                                >
                                  {sendingMessage ? (
                                    <>
                                      <Loader2 className="h-5 w-5 animate-spin" />
                                      <span>Sending...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Send className="h-5 w-5" />
                                      <span>Send Reply</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                          {viewingTicket.status === 'closed' && (
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border-2 border-gray-200 text-center shadow-md">
                              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
                                <XCircle className="h-8 w-8 text-gray-500" />
                              </div>
                              <p className="text-base font-bold text-gray-700 mb-2">This ticket is closed</p>
                              <p className="text-sm text-gray-600">Reopen the ticket to send a reply to the customer.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Chat Management */}
              {activeTab === 'chat' && (
                <div className="space-y-6">
                  {/* Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">Total Conversations</p>
                          <p className="text-2xl font-bold text-blue-900 mt-1">
                            {chatConversations.length}
                          </p>
                        </div>
                        <MessageCircle className="h-8 w-8 text-blue-500" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600">Active</p>
                          <p className="text-2xl font-bold text-green-900 mt-1">
                            {chatConversations.filter(c => c.status === 'active').length}
                          </p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-600">Waiting</p>
                          <p className="text-2xl font-bold text-orange-900 mt-1">
                            {chatConversations.filter(c => c.status === 'waiting').length}
                          </p>
                        </div>
                        <Clock className="h-8 w-8 text-orange-500" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-red-600">Unread Messages</p>
                          <p className="text-2xl font-bold text-red-900 mt-1">
                            {chatConversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)}
                          </p>
                        </div>
                        <AlertCircle className="h-8 w-8 text-red-500" />
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">Live Chat Conversations</h2>
                          <p className="text-sm text-gray-600 mt-1">Manage and respond to customer chat conversations</p>
                        </div>
                        <button
                          onClick={fetchChatConversations}
                          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                        >
                          <RefreshCw className="h-4 w-4" />
                          <span>Refresh</span>
                        </button>
                      </div>

                      {/* Search and Filters */}
                      <div className="space-y-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <input
                            type="text"
                            placeholder="Search by conversation ID or email..."
                            value={chatSearchTerm}
                            onChange={(e) => setChatSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchChatConversations()}
                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder:text-gray-400"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          <SelectField
                            options={[
                              { value: 'all', label: 'All Statuses' },
                              { value: 'active', label: 'Active' },
                              { value: 'waiting', label: 'Waiting' },
                              { value: 'closed', label: 'Closed' },
                            ]}
                            value={chatStatusFilter}
                            isOpen={openSelect === 'chatStatus'}
                            onOpenChange={(open) => setOpenSelect(open ? 'chatStatus' : null)}
                            onSelect={(value) => setChatStatusFilter(value)}
                            placeholder="All Statuses"
                            className="w-full"
                          />
                          <SelectField
                            options={[
                              { value: 'all', label: 'All Assignments' },
                              { value: 'unassigned', label: 'Unassigned' },
                              ...adminUsers.map(admin => ({
                                value: admin._id,
                                label: admin.name || admin.email
                              })),
                            ]}
                            value={chatAssignedFilter}
                            isOpen={openSelect === 'chatAssigned'}
                            onOpenChange={(open) => setOpenSelect(open ? 'chatAssigned' : null)}
                            onSelect={(value) => setChatAssignedFilter(value)}
                            placeholder="All Assignments"
                            className="w-full"
                          />
                          <button
                            onClick={fetchChatConversations}
                            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                          >
                            Apply Filters
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Conversations Table */}
                    <div className="overflow-x-auto">
                      {chatLoading ? (
                        <TableSkeleton />
                      ) : chatConversations.length === 0 ? (
                        <div className="text-center py-12">
                          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">No conversations found</p>
                        </div>
                      ) : (
                        <table className="w-full">
                          <thead className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Customer</th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Last Message</th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Assigned To</th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Unread</th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {chatConversations.map((conv) => (
                              <tr
                                key={conv._id}
                                onClick={() => handleViewConversation(conv)}
                                className="hover:bg-blue-50 cursor-pointer transition-colors border-l-4 border-transparent hover:border-blue-500"
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                                      {(conv.guestEmail || conv.userId || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">{conv.guestEmail || 'User'}</p>
                                      <p className="text-xs text-gray-500">{conv.conversationId}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  {conv.lastMessage ? (
                                    <div>
                                      <p className="text-sm text-gray-900 truncate max-w-xs">{conv.lastMessage.message}</p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {new Date(conv.lastMessageAt).toLocaleString()}
                                      </p>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-400">No messages</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                    conv.status === 'active' ? 'bg-green-100 text-green-800' :
                                    conv.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {conv.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {conv.assignedTo ? (
                                    adminUsers.find(u => u._id === conv.assignedTo)?.name || 'Unknown'
                                  ) : (
                                    <span className="text-gray-400">Unassigned</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {conv.unreadCount > 0 ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                                      {conv.unreadCount}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewConversation(conv);
                                    }}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="View conversation"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Chat Conversation Detail Modal */}
              {viewingConversation && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                  <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity" onClick={() => {
                      setViewingConversation(null);
                      updateQuery({ conversationId: undefined });
                    }}></div>
                    <div className="relative inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full border-0">
                      {/* Header */}
                      <div className="relative bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 px-8 py-6 overflow-hidden">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
                        <div className="relative flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-3">
                              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 shadow-lg">
                                <MessageCircle className="h-7 w-7 text-white" />
                              </div>
                              <div>
                                <h3 className="text-2xl font-bold text-white mb-1">Chat Conversation</h3>
                                <p className="text-base text-blue-50 font-medium">
                                  {viewingConversation.userInfo?.name || viewingConversation.guestEmail || 'User'}
                                </p>
                                {(viewingConversation.userInfo?.email || viewingConversation.guestEmail) && (
                                  <p className="text-sm text-blue-100 mt-1">
                                    {viewingConversation.userInfo?.email || viewingConversation.guestEmail}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-4">
                              <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-bold shadow-md ${
                                viewingConversation.status === 'active' ? 'bg-green-500 text-white border-2 border-green-400' :
                                viewingConversation.status === 'waiting' ? 'bg-yellow-500 text-white border-2 border-yellow-400' :
                                'bg-gray-500 text-white border-2 border-gray-400'
                              }`}>
                                {viewingConversation.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setViewingConversation(null);
                              updateQuery({ conversationId: undefined });
                            }}
                            className="ml-4 text-white/90 hover:text-white transition-all p-2.5 hover:bg-white/20 rounded-xl backdrop-blur-sm"
                          >
                            <X className="h-6 w-6" />
                          </button>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-gray-50 to-white">
                        <div className="px-8 py-6">
                          {/* Customer Info Card */}
                          <div className="bg-white rounded-xl p-5 shadow-md border-2 border-gray-100 mb-6">
                            <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Customer Information</label>
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-lg border-4 border-white">
                                {(viewingConversation.userInfo?.name || viewingConversation.guestEmail || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <p className="text-base font-bold text-gray-900 mb-1">
                                  {viewingConversation.userInfo?.name || 'Guest User'}
                                </p>
                                <p className="text-sm text-gray-600 mb-1">
                                  {viewingConversation.userInfo?.email || viewingConversation.guestEmail || 'No email'}
                                </p>
                                {viewingConversation.userInfo?.phone && (
                                  <p className="text-sm text-gray-600">{viewingConversation.userInfo.phone}</p>
                                )}
                                {viewingConversation.userId ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200 mt-2">
                                    <User className="h-3 w-3 mr-1.5" />
                                    Registered User
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200 mt-2">
                                    Guest User
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Messages */}
                          <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-100 mb-6">
                            <div className="flex items-center justify-between mb-5 pb-4 border-b-2 border-gray-100">
                              <h4 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                                  <MessageCircle className="h-5 w-5 text-white" />
                                </div>
                                Messages
                              </h4>
                              <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                                {chatMessages.length} message{chatMessages.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="space-y-5 max-h-[450px] overflow-y-auto pr-3">
                              {chatMessages.map((msg: any) => (
                                <div
                                  key={msg._id}
                                  className={`flex gap-4 ${msg.senderType === 'admin' ? 'flex-row-reverse' : ''}`}
                                >
                                  <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border-2 ${
                                    msg.senderType === 'admin' 
                                      ? 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 border-blue-400' 
                                      : 'bg-gradient-to-br from-gray-400 to-gray-500 border-gray-300'
                                  }`}>
                                    {msg.senderType === 'admin' ? (
                                      <Shield className="h-6 w-6 text-white" />
                                    ) : (
                                      <User className="h-6 w-6 text-white" />
                                    )}
                                  </div>
                                  <div className={`flex-1 ${msg.senderType === 'admin' ? 'text-right' : ''}`}>
                                    <div className={`inline-block max-w-[80%] ${
                                      msg.senderType === 'admin' ? 'text-right' : 'text-left'
                                    }`}>
                                      <div className={`flex items-center gap-2 mb-2 ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                        <span className="text-sm font-bold text-gray-800">{msg.senderName}</span>
                                        {msg.senderType === 'admin' && (
                                          <span className="text-xs px-2.5 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-bold shadow-sm">
                                            ADMIN
                                          </span>
                                        )}
                                        <span className="text-xs text-gray-400 font-medium">
                                          {new Date(msg.createdAt).toLocaleDateString()} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                      <div className={`p-4 rounded-2xl shadow-md ${
                                        msg.senderType === 'admin'
                                          ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200'
                                          : 'bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200'
                                      }`}>
                                        <p className={`text-sm whitespace-pre-wrap leading-relaxed ${
                                          msg.senderType === 'admin' ? 'text-gray-800' : 'text-gray-700'
                                        }`}>{msg.message}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Reply Form */}
                          {viewingConversation.status !== 'closed' && (
                            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200 shadow-lg">
                              <label className="block text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                                  <Send className="h-4 w-4 text-white" />
                                </div>
                                Reply as Admin
                              </label>
                              <textarea
                                value={chatMessage}
                                onChange={(e) => setChatMessage(e.target.value)}
                                rows={6}
                                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y mb-4 bg-white shadow-sm transition-all text-sm text-gray-900 placeholder:text-gray-400"
                                placeholder="Type your response to the customer..."
                                maxLength={2000}
                              />
                              <div className="flex justify-between items-center">
                                <p className="text-xs text-gray-600 font-semibold">
                                  {chatMessage.length}/2000 characters
                                </p>
                                <button
                                  onClick={() => handleSendChatMessage(viewingConversation.conversationId)}
                                  disabled={sendingChatMessage || !chatMessage.trim()}
                                  className="px-8 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 disabled:transform-none"
                                >
                                  {sendingChatMessage ? (
                                    <>
                                      <Loader2 className="h-5 w-5 animate-spin" />
                                      <span>Sending...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Send className="h-5 w-5" />
                                      <span>Send Reply</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Product Email Marketing Modal */}
              {showEmailMarketing && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <ProductEmailMarketing
                      product={emailMarketingProduct}
                      onClose={() => {
                        setShowEmailMarketing(false);
                        setEmailMarketingProduct(null);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


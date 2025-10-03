'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  Shield,
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
  Loader2
} from 'lucide-react';
import BlogAdmin from '@/components/BlogAdmin';
import KeywordPlanner from '@/components/KeywordPlanner';
import { useAuthStore } from '@/store/authStore';
import UserForm from '@/components/UserForm';
import RoleForm from '@/components/RoleForm';
import ProductForm from '@/components/ProductForm';
import OccasionForm from '@/components/OccasionForm';
import OrderDetailModal from '@/components/OrderDetailModal';
import { AdminSkeleton, TableSkeleton } from '@/components/LoadingSkeleton';
import toast from 'react-hot-toast';

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

interface Occasion {
  _id: string;
  name: string;
  description: string;
  date: string;
  orderDaysBefore: number;
  image: string;
  link: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const allowedTabs = ['users','roles','products','orders','occasions','overview','marketing','performance','analytics','etsy','seo','seo-raw','analytics-seo','blogs','keyword-planner'] as const;
  const initialTabParam = (typeof window !== 'undefined') ? (new URLSearchParams(window.location.search).get('tab') || '') : '';
  const initialTab = (allowedTabs as readonly string[]).includes(initialTabParam) ? (initialTabParam as any) : 'overview';
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'products' | 'orders' | 'occasions' | 'overview' | 'marketing' | 'performance' | 'analytics' | 'etsy' | 'seo' | 'seo-raw' | 'analytics-seo' | 'blogs' | 'keyword-planner'>(initialTab);
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
  const [seoHistoryLoading, setSeoHistoryLoading] = useState(false);
  const [seoHistoryExpanded, setSeoHistoryExpanded] = useState<Record<string, { kw: number; pr: number }>>({});
  const [seoRawSnapshot, setSeoRawSnapshot] = useState<any>(null);
  const [rawSearchItems, setRawSearchItems] = useState<any[]>([]);
  
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedOrderStatus, setSelectedOrderStatus] = useState('');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingOccasion, setEditingOccasion] = useState<Occasion | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [showOccasionForm, setShowOccasionForm] = useState(false);
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
      const res = await fetch(`/api/admin/analytics?days=${days}` , { headers: { 'Authorization': `Bearer ${token}` } });
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
            {[7,30,90].map(d => (
              <button key={d} onClick={() => { lastAnalyticsKeyRef.current = null; setAnalyticsDays(d as 7|30|90); }} className={`px-3 py-1.5 text-sm ${analyticsDays===d?'bg-blue-600 text-white':'text-gray-700 hover:bg-gray-50'}`}>{d}d</button>
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
                {(analytics?.search || []).filter((s: any) => s.noResults>0).map((s: any) => (
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
    const entries = Object.entries(analytics?.cohorts || {}).sort(([a],[b]) => a.localeCompare(b));
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
      </div>
    );
  }

  function EventTester() {
    const [type, setType] = useState<'product_view'|'add_to_cart'|'checkout_start'|'purchase'|'page_view'>('page_view');
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
              onChange={(e)=>setValue(e.target.value)} 
              className="px-3 py-2 border border-blue-200 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
            />
            <input 
              placeholder="productId" 
              value={productId} 
              onChange={(e)=>setProductId(e.target.value)} 
              className="px-3 py-2 border border-blue-200 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
            />
            <input 
              placeholder="orderId" 
              value={orderId} 
              onChange={(e)=>setOrderId(e.target.value)} 
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
              onChange={(e)=>setQuery(e.target.value)} 
              className="px-3 py-2 border border-blue-200 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
            />
            <input 
              placeholder="results count" 
              value={results} 
              onChange={(e)=>setResults(e.target.value)} 
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

    // Check if user tries to access occasions tab without SUPER_ADMIN role
    if (activeTab === 'occasions' && user?.role?.name !== 'SUPER_ADMIN') {
      setActiveTab('overview');
      toast.error('Access denied. Super Admin privileges required for occasion management.');
      return;
    }
  }, [isAuthenticated, user, router, activeTab]);

  const getAttributionCookies = () => {
    if (typeof document === 'undefined') return [] as Array<{ key: string; value: string }>; 
    const keys = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','ref','aff'];
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
    const tabParam = searchParams.get('tab') as 'users' | 'roles' | 'products' | 'orders' | 'occasions' | 'overview' | 'marketing' | 'performance' | 'analytics' | 'etsy' | 'seo' | 'seo-raw' | null;
    if (tabParam) setActiveTab(tabParam);
    if (tabParam === 'orders') setSelectedOrderStatus(searchParams.get('status') || '');
  }, [searchParams]);

  // Open detail modals based on URL ids when data is present
  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId && activeTab === 'orders' && orders.length) {
      const found = orders.find(o => o._id === orderId);
      if (found) setViewingOrder(found);
    }
  }, [searchParams, activeTab, orders]);

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

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/products?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.products);
      // Reset to first page on fresh fetch
      setProductPage(1);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
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

  // Fetch occasions
  const fetchOccasions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/occasions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch occasions');
      }

      const data = await response.json();
      setOccasions(data.occasions);
    } catch (error) {
      console.error('Error fetching occasions:', error);
      toast.error('Failed to fetch occasions');
    } finally {
      setLoading(false);
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

  const handleProductFormSuccess = () => {
    fetchProducts();
    setEditingProduct(null);
    setShowCreateProduct(false);
    updateQuery({ productId: undefined });
  };

  // Occasion management handlers
  const handleEditOccasion = (occasion: Occasion) => {
    setEditingOccasion(occasion);
  };

  const handleDeleteOccasion = async (occasionId: string) => {
    if (!confirm('Are you sure you want to delete this occasion? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/occasions/${occasionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete occasion');
      }

      toast.success('Occasion deleted successfully');
      fetchOccasions();
    } catch (error) {
      console.error('Delete occasion error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete occasion');
    }
  };

  const handleOccasionFormSuccess = async (occasionData: any) => {
    try {
      const token = localStorage.getItem('token');
      const url = editingOccasion 
        ? `/api/admin/occasions/${editingOccasion._id}`
        : '/api/admin/occasions';
      
      const method = editingOccasion ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(occasionData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save occasion');
      }

      toast.success(`Occasion ${editingOccasion ? 'updated' : 'created'} successfully`);
      fetchOccasions();
      setEditingOccasion(null);
      setShowOccasionForm(false);
    } catch (error) {
      console.error('Save occasion error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save occasion');
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
        fetchProducts();
        break;
      case 'orders':
        fetchOrders();
        break;
      case 'occasions':
        fetchOccasions();
        break;
      default:
        // For tabs like blogs/seo, their own components handle fetching
        break;
    }
  }, [isAuthenticated, user, activeTab, metricsDays]);

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !selectedRole || user.role.name === selectedRole;
    return matchesSearch && matchesRole;
  });

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage users, roles, and system settings</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={seedRoles}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Seed Roles
              </button>
              <Link
                href="/admin/audit-logs"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Audit Logs
              </Link>
              <Link
                href="/admin/product-versions"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Product Changes
              </Link>
              <Link
                href="/admin/tools"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Admin Tools
              </Link>
              <Link
                href="/"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Store
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => { setActiveTab('overview'); updateQuery({ tab: 'overview' }); }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="h-5 w-5 inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => { setActiveTab('users'); updateQuery({ tab: 'users' }); }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="h-5 w-5 inline mr-2" />
              Users
            </button>
            <button
              onClick={() => { setActiveTab('roles'); updateQuery({ tab: 'roles' }); }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'roles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Shield className="h-5 w-5 inline mr-2" />
              Roles & Permissions
            </button>
            <button
              onClick={() => { setActiveTab('products'); updateQuery({ tab: 'products' }); }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'products'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="h-5 w-5 inline mr-2" />
              Products
            </button>
            <button
              onClick={() => { setActiveTab('orders'); updateQuery({ tab: 'orders', status: undefined, orderId: undefined, userId: undefined, productId: undefined } as any); }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ShoppingCart className="h-5 w-5 inline mr-2" />
              Orders
            </button>
            <button
              onClick={() => { setActiveTab('marketing'); updateQuery({ tab: 'marketing' }); }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                ['marketing','performance','analytics','etsy','occasions'].includes(activeTab as any)
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="h-5 w-5 inline mr-2" />
              Marketing & Performance
            </button>
            <button
              onClick={() => { setActiveTab('seo'); updateQuery({ tab: 'seo' }); }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                (activeTab as any) === 'seo'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Search className="h-5 w-5 inline mr-2" />
              SEO Research
            </button>
          <button
            onClick={() => { setActiveTab('seo-raw'); updateQuery({ tab: 'seo-raw' }); }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              (activeTab as any) === 'seo-raw'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Search className="h-5 w-5 inline mr-2" />
            SEO Raw
          </button>
          <button
            onClick={() => { setActiveTab('blogs'); updateQuery({ tab: 'blogs' }); }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              (activeTab as any) === 'blogs'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="h-5 w-5 inline mr-2" />
            Blogs
          </button>
          <button
            onClick={() => { setActiveTab('keyword-planner'); updateQuery({ tab: 'keyword-planner' }); }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              (activeTab as any) === 'keyword-planner'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Search className="h-5 w-5 inline mr-2" />
            Keyword Planner
          </button>
          </nav>
        </div>

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
                  <div className="flex items-center space-x-4">
                    <select className="px-3 py-2 border border-purple-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                      <option value="">Select a product to sync</option>
                      {/* Products would be populated here */}
                    </select>
                    <select className="px-3 py-2 border border-purple-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                      <option value="create">Create New Listing</option>
                      <option value="update">Update Existing</option>
                      <option value="delete">Delete Listing</option>
                    </select>
                    <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-sm hover:shadow-md">
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
                <p className="text-blue-700/80 mt-1 text-sm">Access performance, analytics, Etsy integration, occasions, and SEO research.</p>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
                <button onClick={() => { setActiveTab('performance'); updateQuery({ tab: 'performance' }); }} className="px-3 py-2 border rounded hover:bg-gray-50 text-gray-700">Performance</button>
                <button onClick={() => { setActiveTab('analytics'); updateQuery({ tab: 'analytics' }); }} className="px-3 py-2 border rounded hover:bg-gray-50 text-gray-700">Analytics</button>
                <button onClick={() => { setActiveTab('etsy'); updateQuery({ tab: 'etsy' }); }} className="px-3 py-2 border rounded hover:bg-gray-50 text-gray-700">Etsy Integration</button>
                <button onClick={() => { setActiveTab('occasions'); updateQuery({ tab: 'occasions' }); }} className="px-3 py-2 border rounded hover:bg-gray-50 text-gray-700">Occasions</button>
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
                                  {p.thumbnail ? <img src={p.thumbnail} alt={p.title} className="w-12 h-12 object-cover rounded"/> : null}
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
                                    {p.thumbnail ? <img src={p.thumbnail} alt={p.title} className="w-8 h-8 object-cover rounded"/> : null}
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
                                    {p.thumbnail ? <img src={p.thumbnail} alt={p.title} className="w-8 h-8 object-cover rounded"/> : null}
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
                                    {p.thumbnail ? <img src={p.thumbnail} alt={p.title} className="w-8 h-8 object-cover rounded"/> : null}
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
                                        {p.thumbnail ? <img src={p.thumbnail} alt={p.title} className="w-8 h-8 object-cover rounded"/> : null}
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
                                        {p.thumbnail ? <img src={p.thumbnail} alt={p.title} className="w-8 h-8 object-cover rounded"/> : null}
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
                                  {p.thumbnail ? <img src={p.thumbnail} alt={p.title} className="w-12 h-12 object-cover rounded"/> : null}
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
                                    {p.thumbnail ? <img src={p.thumbnail} alt={p.title} className="w-8 h-8 object-cover rounded"/> : null}
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
                                    {p.thumbnail ? <img src={p.thumbnail} alt={p.title} className="w-8 h-8 object-cover rounded"/> : null}
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
                                    {p.thumbnail ? <img src={p.thumbnail} alt={p.title} className="w-8 h-8 object-cover rounded"/> : null}
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
                                        {p.thumbnail ? <img src={p.thumbnail} alt={p.title} className="w-8 h-8 object-cover rounded"/> : null}
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
                                        {p.thumbnail ? <img src={p.thumbnail} alt={p.title} className="w-8 h-8 object-cover rounded"/> : null}
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
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Roles</option>
                  {roles.map(role => (
                    <option key={role._id} value={role.name}>{role.name}</option>
                  ))}
                </select>
                <button
                  onClick={fetchUsers}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
                            {user.role.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.isActive 
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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        role.isActive 
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
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Product Management</h2>
                <button
                  onClick={() => setShowCreateProduct(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Product</span>
                </button>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setProductPage(1); }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => { setSelectedCategory(e.target.value); setProductPage(1); }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Office & Travel">Office & Travel</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Gifting">Gifting</option>
                </select>
                <select
                  value={selectedBrand}
                  onChange={(e) => { setSelectedBrand(e.target.value); setProductPage(1); }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Brands</option>
                  <option value="LeatherCraft">LeatherCraft</option>
                  <option value="LuxuryLeather">LuxuryLeather</option>
                  <option value="CraftLeather">CraftLeather</option>
                  <option value="VintageLeather">VintageLeather</option>
                  <option value="CustomCraft">CustomCraft</option>
                  <option value="MinimalLeather">MinimalLeather</option>
                  <option value="BohoLeather">BohoLeather</option>
                  <option value="HandCraft">HandCraft</option>
                  <option value="Apple">Apple</option>
                  <option value="Samsung">Samsung</option>
                  <option value="Nike">Nike</option>
                  <option value="Adidas">Adidas</option>
                  <option value="Generic">Generic</option>
                </select>
                <select
                  value={selectedOrderStatus}
                  onChange={(e) => { setSelectedOrderStatus(e.target.value); setProductPage(1); }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Product Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="live">Live</option>
                </select>
                <button
                  onClick={fetchProducts}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </button>
                
                
                {/* CSV Export */}
                <a
                  href="/api/admin/products/export-csv"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Export CSV
                </a>
                <a
                  href="/api/admin/products/sample-csv"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Sample CSV
                </a>
                {/* CSV Import */}
                <label className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  Import CSV
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

            <div className="overflow-x-auto">
              {loading ? (
                <TableSkeleton rows={8} columns={6} />
              ) : (
                <table className="min-w-full divide-y divide-gray-200 min-w-[1000px]">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                        Brand
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {products
                      .filter(product => {
                        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                             product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                             product.brand.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesCategory = !selectedCategory || product.category === selectedCategory;
                        const matchesBrand = !selectedBrand || product.brand.toLowerCase().includes(selectedBrand.toLowerCase());
                        return matchesSearch && matchesCategory && matchesBrand;
                      })
                      .slice((productPage - 1) * productPerPage, productPage * productPerPage)
                      .map((product, index) => (
                      <tr key={product._id} className={`hover:bg-blue-50 cursor-pointer transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`} onClick={() => handleEditProduct(product)}>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-14 w-14">
                              <img
                                className="h-14 w-14 rounded-xl object-cover shadow-sm border border-gray-200"
                                src={product.image}
                                alt={product.name}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-600 truncate max-w-xs">
                                {product.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-gray-700 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-700">
                          {product.brand}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-sm">
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                            <span className="font-semibold text-gray-900">${product.price.toFixed(2)}</span>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <span className="ml-2 text-sm text-gray-500 line-through">
                                ${product.originalPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-sm">
                          <div className="flex items-center">
                            <Package className="h-4 w-4 text-indigo-500 mr-1" />
                            <span className="font-medium text-gray-700">{product.stockCount}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              product.isActive 
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
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditProduct(product);
                              }}
                              className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors duration-150"
                              title="Edit product"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProduct(product._id);
                              }}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-150"
                              title="Delete product"
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

            {/* Pagination Controls */}
            {!loading && (
              <div className="flex items-center justify-between px-6 py-6 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200">
                <div className="text-sm text-gray-600 font-medium">
                  {(() => {
                    const filteredCount = products.filter(product => {
                      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        product.brand.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchesCategory = !selectedCategory || product.category === selectedCategory;
                      const matchesBrand = !selectedBrand || product.brand.toLowerCase().includes(selectedBrand.toLowerCase());
                      return matchesSearch && matchesCategory && matchesBrand;
                    }).length;
                    const start = (productPage - 1) * productPerPage + 1;
                    const end = Math.min(productPage * productPerPage, filteredCount);
                    return `Showing ${start}-${end} of ${filteredCount} products`;
                  })()}
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 font-medium">Show:</span>
                    <select
                      value={productPerPage}
                      onChange={(e) => { setProductPerPage(parseInt(e.target.value)); setProductPage(1); }}
                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                    >
                      <option value={10}>10 per page</option>
                      <option value={20}>20 per page</option>
                      <option value={50}>50 per page</option>
                      <option value={100}>100 per page</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed bg-white shadow-sm"
                      disabled={productPage === 1}
                    >
                      Previous
                    </button>
                    <div className="flex items-center space-x-1">
                      <span className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-lg">
                        {productPage}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const filteredCount = products.filter(product => {
                          const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.brand.toLowerCase().includes(searchTerm.toLowerCase());
                          const matchesCategory = !selectedCategory || product.category === selectedCategory;
                          const matchesBrand = !selectedBrand || product.brand.toLowerCase().includes(selectedBrand.toLowerCase());
                          return matchesSearch && matchesCategory && matchesBrand;
                        }).length;
                        const totalPages = Math.max(1, Math.ceil(filteredCount / productPerPage));
                        setProductPage((p) => Math.min(totalPages, p + 1));
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed bg-white shadow-sm"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
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
                <select
                  value={selectedOrderStatus}
                  onChange={(e) => setSelectedOrderStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
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
                                             order.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                             order.user.email.toLowerCase().includes(searchTerm.toLowerCase());
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
                            <div className="text-sm font-medium text-gray-900">{order.user.name}</div>
                            <div className="text-sm text-gray-500">{order.user.email}</div>
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
                              className={`text-xs font-medium px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-blue-500 ${
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
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
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.paymentStatus === 'paid' 
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

        {/* Occasions Tab */}
        {activeTab === 'occasions' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Occasion Management</h2>
                <div className="flex space-x-3">
                  <button
                    onClick={fetchOccasions}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Refresh</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingOccasion(null);
                      setShowOccasionForm(true);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Occasion</span>
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search occasions by name or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border text-gray-700 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <TableSkeleton rows={5} columns={6} />
              ) : (
                <table className="min-w-full divide-y divide-gray-200 min-w-[800px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Occasion
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Days Before
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {occasions
                      .filter(occasion => 
                        !searchTerm || 
                        occasion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        occasion.description.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((occasion) => (
                      <tr key={occasion._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12">
                              <img
                                className="h-12 w-12 rounded-lg object-cover"
                                src={occasion.image}
                                alt={occasion.name}
                                onError={(e) => {
                                  e.currentTarget.src = 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=200&h=200&fit=crop';
                                }}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{occasion.name}</div>
                              <div className="text-sm text-gray-500 max-w-xs truncate">
                                {occasion.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(occasion.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{occasion.orderDaysBefore} days</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            occasion.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {occasion.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(occasion.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEditOccasion(occasion)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit occasion"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteOccasion(occasion._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete occasion"
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

        {/* Occasion Form Modal */}
        <OccasionForm
          occasion={editingOccasion || undefined}
          isOpen={showOccasionForm || !!editingOccasion}
          onClose={() => {
            setShowOccasionForm(false);
            setEditingOccasion(null);
          }}
          onSave={handleOccasionFormSuccess}
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
      </div>
    </div>
  );
}


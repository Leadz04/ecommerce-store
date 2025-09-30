'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { RefreshCw, Filter, ChevronDown, ChevronRight, Search, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

interface VersionEntry {
  _id: string;
  productId?: string;
  action: 'created' | 'updated' | 'unchanged';
  externalId?: string;
  source: string;
  before?: any;
  after?: any;
  diff?: Array<{ field: string; before: any; after: any }>;
  fetchedAt: string;
}

const actionBadge = (action: VersionEntry['action']) => {
  switch (action) {
    case 'created':
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    case 'updated':
      return 'bg-amber-100 text-amber-800 border border-amber-200';
    default:
      return 'bg-gray-100 text-gray-700 border border-gray-200';
  }
};

export default function ProductVersionsPage() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [action, setAction] = useState('');
  const [source, setSource] = useState('');
  const [productId, setProductId] = useState('');
  const [externalId, setExternalId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [pages, setPages] = useState(1);
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (action) params.set('action', action);
      if (source) params.set('source', source);
      if (productId) params.set('productId', productId);
      if (externalId) params.set('externalId', externalId);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await fetch(`/api/admin/product-versions?${params.toString()}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch changes');
      setVersions(data.versions);
      setPages(data.pagination.pages);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Failed to fetch changes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user?.permissions?.includes('dashboard:view')) {
      router.push('/');
      toast.error('Access denied');
      return;
    }
    fetchVersions();
  }, [isAuthenticated, user, page, limit]);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Product Changes</h1>
          <p className="text-gray-500 text-sm mt-1">Review created/updated records from external syncs with field-level diffs.</p>
        </div>
        <button onClick={fetchVersions} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
            <input
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              placeholder="Product ID"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder:text-gray-400"
            />
          </div>
          <select value={action} onChange={(e) => setAction(e.target.value)} className="px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800">
            <option value="">All Actions</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="unchanged">Unchanged</option>
          </select>
          <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Source (e.g., wolveyes)" className="px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800" />
          <input value={externalId} onChange={(e) => setExternalId(e.target.value)} placeholder="External ID" className="px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800" />
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800" />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button onClick={() => { setPage(1); fetchVersions(); }} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
            <Filter className="h-4 w-4" /> Apply
          </button>
          <button onClick={() => { setAction(''); setSource(''); setProductId(''); setExternalId(''); setFrom(''); setTo(''); setPage(1); fetchVersions(); }} className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Clear</button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-gray-500">Loading changes...</div>
        ) : versions.length === 0 ? (
          <div className="text-gray-500">No changes found.</div>
        ) : (
          versions.map((v) => {
            const isOpen = !!openIds[v._id];
            const toggle = () => setOpenIds((s) => ({ ...s, [v._id]: !s[v._id] }));
            const productName = (v.after && v.after.name) || (v.before && v.before.name) || '';
            const detailsHref = v.productId ? `/products/${v.productId}` : '#';
            return (
              <div key={v._id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="w-full px-4 py-3 flex items-center justify-between">
                  <button onClick={toggle} className="flex items-center gap-3 hover:opacity-90">
                    {isOpen ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                    <span className={`text-xs px-2 py-1 rounded-full ${actionBadge(v.action)}`}>{v.action.toUpperCase()}</span>
                    <span className="text-gray-900 font-medium">Product {v.productId || 'N/A'}</span>
                    {productName && <span className="text-gray-600">• {productName}</span>}
                    {v.externalId && <span className="text-gray-500 text-sm">(ext: {v.externalId})</span>}
                  </button>
                  <div className="flex items-center gap-2">
                    {v.productId && (
                      <Link href={detailsHref} target="_blank" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm">
                        <ExternalLink className="h-4 w-4" /> View
                      </Link>
                    )}
                    <div className="text-sm text-gray-500">{new Date(v.fetchedAt).toLocaleString()} • {v.source}</div>
                  </div>
                </div>

                {isOpen && (
                  <div className="px-4 pb-4">
                    {v.diff && v.diff.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-500">
                              <th className="px-3 py-2">Field</th>
                              <th className="px-3 py-2">Before</th>
                              <th className="px-3 py-2">After</th>
                            </tr>
                          </thead>
                          <tbody>
                            {v.diff.map((d, i) => (
                              <tr key={i} className="border-t">
                                <td className="px-3 py-2 font-medium text-gray-900 align-top w-44">{d.field}</td>
                                <td className="px-3 py-2 text-gray-600 whitespace-pre-wrap align-top">
                                  <code className="bg-gray-50 rounded px-2 py-1 block border border-gray-200">{formatValue(d.before)}</code>
                                </td>
                                <td className="px-3 py-2 text-gray-900 whitespace-pre-wrap align-top">
                                  <code className="bg-emerald-50 rounded px-2 py-1 block border border-emerald-100">{formatValue(d.after)}</code>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 p-3">No field changes.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-600">Page {page} of {pages}</div>
        <div className="flex gap-2">
          <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50">Prev</button>
          <button disabled={page >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))} className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50">Next</button>
          <select value={limit} onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }} className="px-2 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700">
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function formatValue(val: any) {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'string') return val;
  try {
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
}

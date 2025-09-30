'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Filter, Calendar, TrendingUp, Package, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

export default function SeoHistoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [type, setType] = useState<'all' | 'keywords' | 'products'>('all');
  const [queryFilter, setQueryFilter] = useState('');

  const pageSize = 12;

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String((page - 1) * pageSize),
        type,
        kw: '5',
        pr: '3',
      });
      const res = await fetch(`/api/seo/history?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.history);
      } else {
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, type]);

  const filtered = queryFilter
    ? items.filter(i => i.query.toLowerCase().includes(queryFilter.toLowerCase()))
    : items;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                SEO History
              </h1>
              <p className="text-slate-600 mt-1">Track your keyword research journey</p>
            </div>
          </div>
          <Link 
            href="/admin" 
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={queryFilter}
                onChange={(e) => setQueryFilter(e.target.value)}
                placeholder="Search your research queries..."
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-slate-50/50 transition-all duration-200"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value as any)} 
                className="pl-10 pr-8 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-slate-50/50 transition-all duration-200 appearance-none"
              >
                <option value="all">All Research</option>
                <option value="keywords">Keywords Only</option>
                <option value="products">Products Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((s, idx) => (
            <div key={idx} className="group bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-emerald-300 transition-all duration-300 overflow-hidden">
              {/* Card Header */}
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100/50">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                      {s.query}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        s.type === 'keywords' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {s.type === 'keywords' ? 'Keywords' : 'Products'}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="h-3 w-3" />
                        {new Date(s.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Link 
                    href={`/admin/seo-history/${encodeURIComponent(s.query)}`} 
                    className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors text-sm font-medium"
                  >
                    Open
                  </Link>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6 space-y-4">
                {/* Keywords Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                    </div>
                    <h4 className="font-medium text-slate-800">Keywords ({(s.keywords || []).length})</h4>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {(s.keywords || []).map((k: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <span className="text-sm font-medium text-slate-700 truncate flex-1">{k.keyword}</span>
                        <span className="text-xs text-slate-500 ml-2 font-mono">
                          {k.searchVolume ? k.searchVolume.toLocaleString() : '—'}
                        </span>
                      </div>
                    ))}
                    {(!s.keywords || s.keywords.length === 0) && (
                      <div className="text-sm text-slate-400 italic">No keywords found</div>
                    )}
                  </div>
                </div>

                {/* Products Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-purple-100 rounded-lg">
                      <Package className="h-4 w-4 text-purple-600" />
                    </div>
                    <h4 className="font-medium text-slate-800">Products ({(s.products || []).length})</h4>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {(s.products || []).map((p: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        {p.thumbnail && (
                          <img 
                            src={p.thumbnail} 
                            alt={p.title} 
                            className="w-8 h-8 object-cover rounded-lg flex-shrink-0" 
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-700 truncate">{p.title}</div>
                          <div className="text-xs text-slate-500">
                            {p.source} • {p.price ? `$${p.price}` : '—'}
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!s.products || s.products.length === 0) && (
                      <div className="text-sm text-slate-400 italic">No products found</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filtered.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="p-4 bg-slate-100 rounded-full w-16 h-16 mx-auto mb-4">
              <Search className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No research found</h3>
            <p className="text-slate-600">
              {queryFilter ? 'Try adjusting your search terms' : 'Start researching keywords to see your history here'}
            </p>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-center gap-4">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))} 
            disabled={page === 1 || loading} 
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <div className="flex items-center gap-2">
            <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-medium">
              Page {page}
            </span>
          </div>
          <button 
            onClick={() => setPage(p => p + 1)} 
            disabled={loading} 
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}



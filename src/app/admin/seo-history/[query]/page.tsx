'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Package, ChevronLeft, ChevronRight, Search } from 'lucide-react';

export default function SeoHistoryDetailPage() {
  const params = useParams() as { query?: string };
  const query = decodeURIComponent((params?.query || '').toString());

  const [loading, setLoading] = useState(false);
  const [kwPage, setKwPage] = useState(1);
  const [prPage, setPrPage] = useState(1);
  const kwPageSize = 25;
  const prPageSize = 12;

  const [kwTotal, setKwTotal] = useState(0);
  const [prTotal, setPrTotal] = useState(0);
  const [keywords, setKeywords] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Simple decision heuristics
  function getTopKeywords(limit = 4): string[] {
    return (keywords || []).slice(0, limit).map((k: any) => String(k.keyword || '').toLowerCase());
  }

  function containsTopKeyword(title: string): boolean {
    const t = (title || '').toLowerCase();
    return getTopKeywords().some(k => k && t.includes(k));
  }

  function isBrandLocked(source: string | undefined, title: string | undefined): boolean {
    const brandList = ['nike', 'disney', 'marvel', 'harry potter', 'lego', 'pottery barn', 'apple', 'adidas'];
    const hay = `${(source||'').toLowerCase()} ${(title||'').toLowerCase()}`;
    return brandList.some(b => hay.includes(b));
  }

  function computeDecision(product: any) {
    const rating = typeof product?.rating === 'number' ? product.rating : null;
    const reviews = typeof product?.reviews === 'number' ? product.reviews : null;
    const price = typeof product?.price === 'number' ? product.price : null;
    const original = typeof product?.originalPrice === 'number' ? product.originalPrice : null;
    const discountPct = price && original && original > price ? Math.round(((original - price) / original) * 100) : 0;
    const freeDelivery = String(product?.delivery || '').toLowerCase().includes('free');
    const brandLocked = isBrandLocked(product?.source, product?.title);
    const kwMatch = containsTopKeyword(product?.title || '');

    // scoring
    let score = 0;
    if (rating && rating >= 4.6) score += 2; else if (rating && rating >= 4.4) score += 1; else if (rating && rating < 4.0) score -= 2;
    if (reviews && reviews >= 200) score += 2; else if (reviews && reviews >= 100) score += 1; else if (reviews && reviews < 10) score -= 2;
    if (price !== null) {
      if (price >= 25 && price <= 120) score += 1; else score -= 1;
    }
    if (discountPct >= 15 || freeDelivery) score += 1;
    if (brandLocked) score -= 2;
    if (kwMatch) score += 1;

    let label: 'Pick' | 'Consider' | 'Skip' = 'Consider';
    if (score >= 3) label = 'Pick';
    else if (score <= 0) label = 'Skip';

    const reasons: string[] = [];
    if (kwMatch) reasons.push('Matches top keywords');
    if (rating) reasons.push(`Rating ${rating}★`);
    if (reviews) reasons.push(`${reviews} reviews`);
    if (price !== null) reasons.push(`Price $${price}`);
    if (discountPct >= 15) reasons.push(`${discountPct}% off`);
    if (freeDelivery) reasons.push('Free delivery');
    if (brandLocked) reasons.push('Brand-locked risk');
    return { score, label, reasons, discountPct, brandLocked, freeDelivery };
  }

  const load = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const kwOffset = (kwPage - 1) * kwPageSize;
      const prOffset = (prPage - 1) * prPageSize;
      const url = `/api/seo/history/details?query=${encodeURIComponent(query)}&kwLimit=${kwPageSize}&kwOffset=${kwOffset}&prLimit=${prPageSize}&prOffset=${prOffset}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setKeywords(data.keywords.items || []);
        setProducts(data.products.items || []);
        setKwTotal(data.keywords.total || 0);
        setPrTotal(data.products.total || 0);
      } else {
        setKeywords([]);
        setProducts([]);
        setKwTotal(0);
        setPrTotal(0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [query, kwPage, prPage]);

  const kwPages = useMemo(() => Math.max(1, Math.ceil(kwTotal / kwPageSize)), [kwTotal]);
  const prPages = useMemo(() => Math.max(1, Math.ceil(prTotal / prPageSize)), [prTotal]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              SEO History → <span className="text-emerald-700">{query || '—'}</span>
            </h1>
            <p className="text-slate-600 mt-1">Stored keywords and products for this query</p>
          </div>
          <Link href="/admin/seo-history" className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all duration-200 shadow-sm">
            <ArrowLeft className="h-4 w-4" /> Back to list
          </Link>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Keywords */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg"><TrendingUp className="h-4 w-4 text-blue-600" /></div>
                <h2 className="font-semibold text-slate-800">Keywords</h2>
                <span className="text-xs text-slate-500">{kwTotal} total</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setKwPage(p => Math.max(1, p-1))} disabled={kwPage===1 || loading} className="px-2 py-1 border border-slate-200 rounded-lg bg-white disabled:opacity-50"> <ChevronLeft className="h-4 w-4"/> </button>
                <span className="text-sm px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg">{kwPage}/{kwPages}</span>
                <button onClick={() => setKwPage(p => Math.min(kwPages, p+1))} disabled={kwPage>=kwPages || loading} className="px-2 py-1 border border-slate-200 rounded-lg bg-white disabled:opacity-50"> <ChevronRight className="h-4 w-4"/> </button>
              </div>
            </div>
            <div className="p-6">
              {keywords.length === 0 && !loading && (
                <div className="text-center text-slate-500">No keywords found</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {keywords.map((k: any, i: number) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-slate-800 truncate mr-2">{k.keyword}</div>
                      <div className="text-xs text-slate-500 font-mono">{k.searchVolume ? k.searchVolume.toLocaleString() : '—'}</div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className={`px-2 py-0.5 rounded-full border ${
                        k.competition === 'low' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        k.competition === 'high' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>Comp: {k.competition || '—'}</span>
                      <span className="px-2 py-0.5 rounded-full border bg-slate-50 text-slate-700 border-slate-200">Diff: {k.difficulty ?? '—'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 rounded-lg"><Package className="h-4 w-4 text-purple-600" /></div>
                <h2 className="font-semibold text-slate-800">Products</h2>
                <span className="text-xs text-slate-500">{prTotal} total</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setPrPage(p => Math.max(1, p-1))} disabled={prPage===1 || loading} className="px-2 py-1 border border-slate-200 rounded-lg bg-white disabled:opacity-50"> <ChevronLeft className="h-4 w-4"/> </button>
                <span className="text-sm px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg">{prPage}/{prPages}</span>
                <button onClick={() => setPrPage(p => Math.min(prPages, p+1))} disabled={prPage>=prPages || loading} className="px-2 py-1 border border-slate-200 rounded-lg bg-white disabled:opacity-50"> <ChevronRight className="h-4 w-4"/> </button>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {products.length === 0 && !loading && (
                <div className="text-center text-slate-500">No products found</div>
              )}
              {products.map((p: any, i: number) => {
                const decision = computeDecision(p);
                return (
                <button key={i} onClick={() => setSelectedProduct({ ...p, decision })} className="w-full text-left flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  {p.thumbnail ? (
                    <img src={p.thumbnail} alt={p.title} className="w-12 h-12 object-cover rounded-lg" />
                  ) : (
                    <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center"><Search className="h-5 w-5 text-slate-500"/></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate" title={p.title}>{p.title}</div>
                    <div className="text-xs text-slate-500">{p.source} • {p.price ? `$${p.price}` : '—'}</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    decision.label === 'Pick' ? 'bg-emerald-100 text-emerald-700' :
                    decision.label === 'Consider' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {decision.label}
                  </span>
                </button>
              );})}
            </div>
          </div>
        </div>

        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 p-4" onClick={() => setSelectedProduct(null)}>
            <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="font-semibold text-slate-900 truncate pr-4">{selectedProduct.title}</div>
                <button onClick={() => setSelectedProduct(null)} className="text-slate-500 hover:text-slate-700 text-xl font-bold">×</button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Product Image */}
                  <div>
                    {selectedProduct.thumbnail ? (
                      <img src={selectedProduct.thumbnail} alt={selectedProduct.title} className="w-full h-64 object-cover rounded-lg shadow-sm" />
                    ) : (
                      <div className="w-full h-64 bg-slate-200 rounded-lg flex items-center justify-center">
                        <Search className="h-12 w-12 text-slate-400"/>
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">Product Information</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-600">Source:</span>
                          <span className="font-medium text-slate-900">{selectedProduct.source || '—'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-600">Price:</span>
                          <div className="text-right">
                            <span className="font-medium text-slate-900">
                              {selectedProduct.price ? `$${selectedProduct.price}` : '—'}
                            </span>
                            {selectedProduct.originalPrice && (
                              <span className="ml-2 text-slate-500 line-through text-sm">
                                ${selectedProduct.originalPrice}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-600">Currency:</span>
                          <span className="font-medium text-slate-900">{selectedProduct.currency || 'USD'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-600">Rating:</span>
                          <div className="text-right">
                            {typeof selectedProduct.rating === 'number' ? (
                              <span className="font-medium text-slate-900">
                                {selectedProduct.rating}★
                                {typeof selectedProduct.reviews === 'number' && (
                                  <span className="ml-1 text-slate-500 text-sm">({selectedProduct.reviews} reviews)</span>
                                )}
                              </span>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-600">Product ID:</span>
                          <span className="font-mono text-sm text-slate-600">{selectedProduct.productId || '—'}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-slate-600">Category:</span>
                          <span className="font-medium text-slate-900">{selectedProduct.category || '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Extensions/Offers */}
                    {selectedProduct.extensions && selectedProduct.extensions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800 mb-2">Offers & Extensions</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedProduct.extensions.map((ext: string, idx: number) => (
                            <span key={idx} className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                              {ext}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Delivery Info */}
                    {selectedProduct.delivery && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800 mb-2">Delivery</h4>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {selectedProduct.delivery}
                        </span>
                      </div>
                    )}

                    {/* Decision */}
                    {selectedProduct.decision && (
                      <div className="pt-4 border-t border-slate-200">
                        <h4 className="text-sm font-semibold text-slate-800 mb-2">Decision</h4>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            selectedProduct.decision.label === 'Pick' ? 'bg-emerald-100 text-emerald-700' :
                            selectedProduct.decision.label === 'Consider' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {selectedProduct.decision.label}
                          </span>
                          <span className="text-xs text-slate-500">Score: {selectedProduct.decision.score}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedProduct.decision.reasons.map((r: string, idx: number) => (
                            <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs">{r}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Database Info */}
                    <div className="pt-4 border-t border-slate-200">
                      <h4 className="text-sm font-semibold text-slate-800 mb-2">Research Data</h4>
                      <div className="text-xs text-slate-500 space-y-1">
                        <div>Query: {query}</div>
                        <div>Saved: {selectedProduct.createdAt ? new Date(selectedProduct.createdAt).toLocaleString() : '—'}</div>
                        <div>Source: SerpAPI</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



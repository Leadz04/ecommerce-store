'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Link2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface ScrapedItem {
  _id: string;
  sourceUrl: string;
  title: string;
  description?: string;
  price?: number;
  images?: string[];
  createdAt?: string;
  raw?: any;
}

export default function SourcingPanel() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ScrapedItem[]>([]);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchList = async () => {
    try {
      setRefreshing(true);
      const res = await fetch(`/api/admin/sourcing/list?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch list');
      setItems(data.items || []);
    } catch (e: any) {
      toast.error(e.message || 'Failed to fetch');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  const importUrl = async () => {
    if (!url.trim()) {
      toast.error('Enter a URL');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch('/api/admin/sourcing/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, alsoCreateDraftProduct: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      toast.success('Imported successfully');
      setUrl('');
      fetchList();
    } catch (e: any) {
      toast.error(e.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = async () => {
    try {
      const ids = items.map(i => i._id).join(',');
      const url = `/api/admin/sourcing/export-csv?ids=${encodeURIComponent(ids)}`;
      const a = document.createElement('a');
      a.href = url;
      a.download = '';
      a.click();
    } catch (e: any) {
      toast.error('Export failed');
    }
  };

  const [selected, setSelected] = useState<ScrapedItem | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState<number>(0);
  useEffect(() => {
    if (selected) setSelectedImageIdx(0);
  }, [selected]);
  const [previewTab, setPreviewTab] = useState<'parsed' | 'original'>('parsed');
  const [enhanceIdx, setEnhanceIdx] = useState<number | null>(null);
  const [enhanceHint, setEnhanceHint] = useState('');
  const [enhanceLoading, setEnhanceLoading] = useState(false);
  const [enhanceErrorByIdx, setEnhanceErrorByIdx] = useState<{ [k: number]: string }>({});
  // Etsy editable preview state
  const [etsyTitle, setEtsyTitle] = useState('');
  const [etsyTags, setEtsyTags] = useState('');
  const [etsyMaterials, setEtsyMaterials] = useState('');
  const [etsyCategory, setEtsyCategory] = useState('Accessories');
  const [etsyPrice, setEtsyPrice] = useState('');

  useEffect(() => {
    if (!selected) return;
    const specs = (selected as any).specs || {};
    const mat = specs['Material'] || specs['Materials'] || '';
    setEtsyTitle(selected.title || '');
    setEtsyTags('');
    setEtsyMaterials(typeof mat === 'string' ? String(mat) : '');
    setEtsyCategory('Accessories');
    setEtsyPrice(String(selected.price ?? ''));
  }, [selected]);

  const exportEditedCsv = () => {
    if (!selected) return;
    const row: Record<string,string> = {
      'Title': etsyTitle || '',
      'Description': selected.description || '',
      'Category': etsyCategory || 'Accessories',
      'Who made it?': 'I made it',
      'What is it?': 'A finished product',
      'When was it made?': '2024',
      'Renewal options': 'Auto-renew',
      'Product type': 'Physical',
      'Tags': etsyTags,
      'Materials': etsyMaterials || 'Leather',
      'Production partners': '',
      'Section': etsyCategory || 'Accessories',
      'Price': etsyPrice || String(selected.price ?? 0),
      'Quantity': '1',
      'SKU': '',
      'Variation 1': '',
      'V1 Option': '',
      'Variation 2': '',
      'V2 Option': '',
      'Var Price': '',
      'Var Quantity': '',
      'Var SKU': '',
      'Var Visibility': '',
      'Var Photo': '',
      'Shipping profile': 'Standard',
      'Weight': '0.5',
      'Length': '10',
      'Width': '8',
      'Height': '2',
      'Return policy': '14 days',
      'Photo 1': selected.images?.[0] || '',
      'Photo 2': selected.images?.[1] || '',
      'Photo 3': selected.images?.[2] || '',
      'Photo 4': selected.images?.[3] || '',
      'Photo 5': selected.images?.[4] || '',
      'Photo 6': selected.images?.[5] || '',
      'Photo 7': selected.images?.[6] || '',
      'Photo 8': selected.images?.[7] || '',
      'Photo 9': selected.images?.[8] || '',
      'Photo 10': selected.images?.[9] || '',
      'Video 1': '',
      'Digital file 1': '',
      'Digital file 2': '',
      'Digital file 3': '',
      'Digital file 4': '',
      'Digital file 5': ''
    };
    const headers = Object.keys(row);
    const csv = [headers.join(','), headers.map(h => '"' + String(row[h] ?? '').replace(/"/g,'""') + '"').join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const name = etsyTitle || selected.title || 'etsy-item';
    const fn = 'etsy-' + name.replace(/[^a-z0-9\-\s_]/gi,'').replace(/\s+/g,'-').slice(0,50) + '.csv';
    a.download = fn;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV generated');
  };
  const exportOne = (id: string) => {
    const a = document.createElement('a');
    a.href = `/api/admin/sourcing/export-csv?ids=${id}`;
    a.download = '';
    a.click();
  };

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-sky-50 via-white to-indigo-50">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="relative p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Source Products from a URL</h2>
              <p className="text-sm text-gray-600">Paste a public product page URL. We’ll parse details, store them in the Sourcing DB, and create a draft product.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 text-gray-700">
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://www.angeljackets.com/products/reeves-black-vintage-leather-jacket.html"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setUrl('https://www.angeljackets.com/products/reeves-black-vintage-leather-jacket.html')}
                className="px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-sm"
              >
                Paste Example
              </button>
              <button
                onClick={importUrl}
                disabled={loading}
                className="px-5 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
              >
                {loading ? 'Importing…' : 'Import URL'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search title or URL"
            className="border border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
          />
          <button
            onClick={fetchList}
            className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
        <button
          onClick={exportCsv}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2 shadow-sm"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-56 border rounded-2xl bg-white">
          <div className="text-gray-900 font-medium">No sourced products yet</div>
          <div className="text-gray-500 text-sm mt-1">Paste a product URL above to get started.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <button key={item._id} onClick={() => setSelected(item)} className="text-left group overflow-hidden rounded-2xl border bg-white hover:shadow-md transition-shadow">
              <div className="aspect-[4/3] bg-gray-100">
                {item.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image</div>
                )}
              </div>
              <div className="p-4">
                <div className="font-medium text-gray-900 line-clamp-2">{item.title}</div>
                <div className="text-sm text-gray-500 truncate mt-1">{item.sourceUrl}</div>
                <div className="text-sm mt-2 font-semibold text-emerald-700">${(item.price ?? 0).toFixed(2)}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-7xl bg-white rounded-3xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="px-6 py-5 border-b bg-gradient-to-r from-indigo-50 via-white to-sky-50">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-2xl font-semibold text-gray-900 truncate">{selected.title}</div>
                  <div className="mt-1 text-sm text-gray-500 truncate">
                    <a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600">
                      {selected.sourceUrl}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">${(selected.price ?? 0).toFixed(2)}</div>
                  <button onClick={() => setSelected(null)} className="h-9 w-9 rounded-full bg-white border text-gray-600 hover:bg-gray-50">✕</button>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="grid grid-cols-12">
              <div className="col-span-12 lg:col-span-6 bg-gray-50 p-5">
                {(selected.images && selected.images.length > 0) ? (
                  <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                    {selected.images.map((src, idx) => (
                      <div key={idx} className="bg-white rounded-2xl border shadow-sm p-3">
                        <div className="w-full rounded-xl overflow-hidden flex items-center justify-center" style={{ maxHeight: '360px' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt={`${selected.title} ${idx+1}`} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex justify-end mt-3">
                          <button
                            onClick={async () => {
                              if (!selected) return;
                              setEnhanceIdx(idx);
                              setEnhanceHint(idx === 0 ? 'front' : '');
                              setEnhanceErrorByIdx(prev => ({ ...prev, [idx]: '' }));
                            }}
                            className="px-3 py-2 rounded-lg border bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer text-sm font-medium"
                          >
                            Change and get new URL
                          </button>
                        </div>
                        {enhanceErrorByIdx[idx] && (
                          <div className="mt-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
                            {enhanceErrorByIdx[idx]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center text-gray-400">No images</div>
                )}
              </div>
              {/* Enhance modal */}
              {enhanceIdx !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-semibold">Set product view hint</div>
                      {!enhanceLoading && (
                        <button onClick={()=> setEnhanceIdx(null)} className="h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200">✕</button>
                      )}
                    </div>
                    <label className="block text-xs text-gray-500 mb-1">Pose/View (e.g., front, back, left side, right side)</label>
                    <input
                      value={enhanceHint}
                      onChange={(e)=>setEnhanceHint(e.target.value)}
                      disabled={enhanceLoading}
                      placeholder="front"
                      className="w-full border rounded-lg px-3 py-2"
                    />
                    {typeof enhanceIdx === 'number' && enhanceErrorByIdx[enhanceIdx] && (
                      <div className="mt-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
                        {enhanceErrorByIdx[enhanceIdx]}
                      </div>
                    )}
                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        onClick={async ()=>{
                          if (!selected || enhanceIdx === null) return;
                          try {
                            setEnhanceLoading(true);
                            const resp = await fetch('/api/admin/sourcing/images/enhance', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ productId: (selected as any)._id, title: selected.title, imageUrl: selected.images?.[enhanceIdx], viewHint: enhanceHint })
                            });
                            const data = await resp.json();
                            if (!resp.ok) {
                              const msg = data?.detail || data?.error || 'Enhance failed';
                              setEnhanceErrorByIdx(prev => ({ ...prev, [enhanceIdx]: String(msg) }));
                              return;
                            }
                            setSelected(prev => prev ? { ...prev, images: prev.images?.map((u, i) => i===enhanceIdx ? data.url : u) } as any : prev);
                            setEnhanceErrorByIdx(prev => { const n = { ...prev }; delete n[enhanceIdx]; return n; });
                            toast.success('Image enhanced');
                            setEnhanceIdx(null);
                          } catch (e: any) {
                            setEnhanceErrorByIdx(prev => ({ ...prev, [enhanceIdx!]: e?.message || 'Enhance failed' }));
                          } finally {
                            setEnhanceLoading(false);
                          }
                        }}
                        disabled={enhanceLoading}
                        className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                      >
                        {enhanceLoading ? 'Enhancing…' : 'Generate & Update'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="col-span-12 lg:col-span-6 p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Tabs: Parsed vs Original Preview */}
                <div className="inline-flex rounded-xl border bg-white shadow-sm overflow-hidden">
                  <button
                    onClick={() => setPreviewTab('parsed')}
                    className={`px-4 py-2 text-sm ${previewTab==='parsed' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                  >Parsed Details</button>
                  <button
                    onClick={() => setPreviewTab('original')}
                    className={`px-4 py-2 text-sm ${previewTab==='original' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                  >Original Preview</button>
                </div>

                {previewTab === 'original' ? (
                  <div className="bg-white border rounded-2xl shadow-sm p-3">
                    <div className="text-xs text-gray-500 mb-2">Sandboxed preview of fetched HTML (scripts disabled)</div>
                    <div className="rounded-lg overflow-hidden border" style={{height: '560px'}}>
                      <iframe
                        title="Original HTML Preview"
                        sandbox=""
                        srcDoc={String((selected as any).raw?.fullHtml || '<html><body><p>No HTML captured.</p></body></html>')}
                        style={{width: '100%', height: '100%', border: '0'}}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                ) : (
                /* Product Details section */
                <div className="bg-white border rounded-2xl shadow-sm p-5">
                  <div className="text-lg font-semibold text-gray-900 mb-3">Product Details</div>
                  <div className="space-y-3 text-gray-800 text-sm leading-6">
                    {(selected.description || '').split(/\n\n|\r\n\r\n/).filter(Boolean).map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                    {!selected.description && (
                      <p className="text-gray-500">No description</p>
                    )}
                  </div>
                  <div className="mt-5">
                    <div className="font-semibold text-gray-900 mb-2">Specification:</div>
                    {Object.keys((selected as any).specs || {}).length === 0 ? (
                      <div className="text-sm text-gray-500">No specs found</div>
                    ) : (
                      <ul className="list-disc pl-5 space-y-1 text-sm text-gray-800">
                        {Object.entries((selected as any).specs || {}).map(([k,v]) => (
                          k.startsWith('__bullet__') ? (
                            <li key={k}>{String(v)}</li>
                          ) : (
                            <li key={k}><span className="font-semibold">{k}:</span> {String(v)}</li>
                          )
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* All extracted data (expandable) */}
                  <details className="mt-6 group">
                    <summary className="cursor-pointer select-none text-sm text-indigo-700 hover:text-indigo-800">Show all extracted data</summary>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 border rounded-xl p-3 max-h-56 overflow-auto">
                        <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">All Image URLs</div>
                        {selected.images && selected.images.length ? (
                          <ul className="list-decimal pl-5 space-y-1 text-xs text-gray-700">
                            {selected.images.map((src, idx) => (
                              <li key={idx} className="break-all">
                                <a href={src} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600">{src}</a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-sm text-gray-500">No images</div>
                        )}
                      </div>
                      <div className="bg-gray-50 border rounded-xl p-3 max-h-56 overflow-auto">
                        <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Parsed Object</div>
                        <pre className="text-xs whitespace-pre-wrap break-words text-gray-800">{JSON.stringify({
                          title: selected.title,
                          price: selected.price,
                          sourceUrl: selected.sourceUrl,
                          description: selected.description,
                          specs: (selected as any).specs || {},
                          images: selected.images || []
                        }, null, 2)}</pre>
                      </div>
                      {Boolean((selected as any).raw?.debugSample) && (
                        <div className="md:col-span-2 bg-gray-50 border rounded-xl p-3 max-h-56 overflow-auto">
                          <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Raw Snapshot</div>
                          <pre className="text-xs whitespace-pre-wrap break-words text-gray-700">{String((selected as any).raw?.debugSample)}</pre>
                        </div>
                      )}
                      {Boolean((selected as any).raw?.fullHtml) && (
                        <div className="md:col-span-2 bg-white border rounded-xl p-3 max-h-[60vh] overflow-auto">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs uppercase tracking-wide text-gray-500">Full HTML</div>
                            <button
                              onClick={async () => {
                                try {
                                  const html = String((selected as any).raw?.fullHtml || '');
                                  await navigator.clipboard.writeText(html);
                                  toast.success('Full HTML copied');
                                } catch {
                                  try {
                                    const html = String((selected as any).raw?.fullHtml || '');
                                    const ta = document.createElement('textarea');
                                    ta.value = html;
                                    document.body.appendChild(ta);
                                    ta.select();
                                    document.execCommand('copy');
                                    document.body.removeChild(ta);
                                    toast.success('Full HTML copied');
                                  } catch (e) {
                                    toast.error('Copy failed');
                                  }
                                }
                              }}
                              className="px-2 py-1 rounded-md text-xs bg-indigo-600 text-white hover:bg-indigo-700"
                            >
                              Copy
                            </button>
                          </div>
                          <pre className="text-xs whitespace-pre-wrap break-words">{String((selected as any).raw?.fullHtml)}</pre>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
                )}

                {/* Product Info */}
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Product Info</div>
                  <div className="space-y-2 text-sm bg-white border rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Images</span><span className="font-medium">{selected.images?.length || 0}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Source</span><span className="font-medium truncate max-w-[220px]" title={selected.sourceUrl}>{new URL(selected.sourceUrl).hostname}</span></div>
                  </div>
                </div>
                {/* Etsy Preview */}
                <div className="bg-white border rounded-2xl shadow-sm p-5">
                  <div className="text-lg font-semibold text-gray-900 mb-3">Etsy Listing Preview</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Title</label>
                        <input value={etsyTitle} onChange={e=>setEtsyTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Tags (comma separated)</label>
                        <input value={etsyTags} onChange={e=>setEtsyTags(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Materials</label>
                        <input value={etsyMaterials} onChange={e=>setEtsyMaterials(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Category</label>
                        <input value={etsyCategory} onChange={e=>setEtsyCategory(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Price (USD)</label>
                        <input value={etsyPrice} onChange={e=>setEtsyPrice(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
                      </div>
                      <div className="pt-2 flex gap-2">
                        <button onClick={exportEditedCsv} className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">Export CSV (Edited)</button>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Footer actions */}
                <div className="sticky bottom-0 bg-white/70 backdrop-blur pt-3">
                  <div className="flex gap-3">
                    <a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 shadow-sm">Open Source</a>
                    <button onClick={() => exportOne(selected._id)} className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm">Export CSV</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



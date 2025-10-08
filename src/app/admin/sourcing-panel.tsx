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

  // Selected sourced item state (needed by filters below)
  const [selected, setSelected] = useState<ScrapedItem | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState<number>(0);
  useEffect(() => { if (selected) setSelectedImageIdx(0); }, [selected]);
  const [previewTab, setPreviewTab] = useState<'parsed' | 'original'>('parsed');
  const [enhanceIdx, setEnhanceIdx] = useState<number | null>(null);
  const [enhanceHint, setEnhanceHint] = useState('');
  const [enhanceLoading, setEnhanceLoading] = useState(false);
  const [enhanceErrorByIdx, setEnhanceErrorByIdx] = useState<{ [k: number]: string }>({});
  const [selectedZoomIdx, setSelectedZoomIdx] = useState<number | null>(null);
  // Lightbox state for immersive zoom view
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxScale, setLightboxScale] = useState(1);
  const [lightboxPan, setLightboxPan] = useState<{x:number,y:number}>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{x:number,y:number}>({ x: 0, y: 0 });

  // Category scrape UI state
  type ScrapedCategoryProduct = { title: string; price: string | null; image: string | null; url: string };
  const [categoryUrl, setCategoryUrl] = useState('');
  const [categoryMaxPages, setCategoryMaxPages] = useState('1');
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryResults, setCategoryResults] = useState<ScrapedCategoryProduct[]>([]);
  const [previewCrawled, setPreviewCrawled] = useState<ScrapedCategoryProduct | null>(null);

  // Crawl main page UI state
  type CrawlCategory = { section: string; label: string; url: string };
  type CrawlResult = { countCategories: number; categories: CrawlCategory[]; results: Record<string, { label: string; url: string; products: ScrapedCategoryProduct[] }> };
  const [crawlUrl, setCrawlUrl] = useState('https://www.angeljackets.com/');
  const [crawlHtml, setCrawlHtml] = useState('');
  const [crawlMaxPages, setCrawlMaxPages] = useState('1');
  const [crawlLoading, setCrawlLoading] = useState(false);
  const [crawlData, setCrawlData] = useState<CrawlResult | null>(null);
  // Saved sourced list state
  type SavedItem = { _id: string; title: string; sourceUrl: string; price?: number; images?: string[]; categoryGroup: string; description?: string; specs?: Record<string,string> };
  const [savedQuery, setSavedQuery] = useState('');
  const [savedPage, setSavedPage] = useState(1);
  const [savedLimit, setSavedLimit] = useState(12);
  const [savedTotal, setSavedTotal] = useState(0);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedSelected, setSavedSelected] = useState<SavedItem | null>(null);
  const [savedParsedRaw, setSavedParsedRaw] = useState<any | null>(null);
  const [savedParsedLoading, setSavedParsedLoading] = useState(false);
  const [savedRefreshLoading, setSavedRefreshLoading] = useState(false);
  const [addToProductsLoading, setAddToProductsLoading] = useState(false);
  const [bulkAddToProductsLoading, setBulkAddToProductsLoading] = useState(false);
  const [bulkRefreshLoading, setBulkRefreshLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [savedZoomIdx, setSavedZoomIdx] = useState<number | null>(null);
  const [savedSelectedIds, setSavedSelectedIds] = useState<Record<string, boolean>>({});

  // Filters (must appear after selected/savedSelected exist)
  const filteredSelectedImages = useMemo(
    () => (selected?.images || []).filter(
      (u) =>
        u &&
        !(/ajax-loader|spinner|loading|placeholder|\.gif($|\?)/i.test(u) ||
          /\/lib\/flags\//i.test(u) ||
          /angellogo/i.test(u) ||
          /images\/close/i.test(u)),
    ),
    [selected],
  );

  const filteredSavedImages = useMemo(
    () => (savedSelected?.images || []).filter(
      (u) =>
        u &&
        !(/ajax-loader|spinner|loading|placeholder|\.gif($|\?)/i.test(u) ||
          /\/lib\/flags\//i.test(u) ||
          /angellogo/i.test(u) ||
          /images\/close/i.test(u)),
    ),
    [savedSelected],
  );
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

  function openLightbox(images: string[], index: number) {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxScale(1);
    setLightboxPan({ x: 0, y: 0 });
    setLightboxOpen(true);
  }

  function closeLightbox() {
    setLightboxOpen(false);
    setTimeout(() => {
      setLightboxImages([]);
      setLightboxIndex(0);
      setLightboxScale(1);
      setLightboxPan({ x: 0, y: 0 });
    }, 150);
  }

  function onWheelZoom(e: React.WheelEvent) {
    e.preventDefault();
    const delta = -e.deltaY;
    const factor = delta > 0 ? 0.1 : -0.1;
    setLightboxScale((prev) => Math.max(1, Math.min(4, prev + factor)));
  }

  function onMouseDown(e: React.MouseEvent) {
    if (lightboxScale <= 1) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - lightboxPan.x, y: e.clientY - lightboxPan.y });
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!isPanning) return;
    setLightboxPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  }
  function onMouseUp() { setIsPanning(false); }

  // Handlers (must exist before JSX usage)
  async function fetchList() {
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
  }

  async function importUrl() {
    if (!url.trim()) { toast.error('Enter a URL'); return; }
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
  }

  function exportCsv() {
    try {
      const ids = items.map((i) => i._id).join(',');
      const dl = document.createElement('a');
      dl.href = `/api/admin/sourcing/export-csv?ids=${encodeURIComponent(ids)}`;
      dl.download = '';
      dl.click();
    } catch {
      toast.error('Export failed');
    }
  }

  async function fetchSaved(page = 1) {
    try {
      setSavedLoading(true);
      const res = await fetch(`/api/admin/sourcing/sourced/list?q=${encodeURIComponent(savedQuery)}&page=${page}&limit=${savedLimit}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load saved products');
      setSavedItems(Array.isArray(data.items) ? data.items : []);
      setSavedTotal(Number(data.total || 0));
      setSavedPage(Number(data.page || page));
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load saved');
    } finally {
      setSavedLoading(false);
    }
  }

  async function crawlAngel() {
    const hasHtml = crawlHtml.trim().length > 0;
    const hasUrl = crawlUrl.trim().length > 0;
    if (!hasHtml && !hasUrl) { toast.error('Enter URL or paste HTML'); return; }
    const mp = crawlMaxPages.trim() ? Math.max(1, Math.min(100, parseInt(crawlMaxPages))) : 100;
    try {
      setCrawlLoading(true);
      const res = await fetch('/api/admin/sourcing/crawl-angel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: hasUrl ? crawlUrl : undefined, html: hasHtml ? crawlHtml : undefined, maxPagesPerCategory: mp, save: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to crawl');
      setCrawlData(data);
      const total = Object.values(data?.results || {}).reduce((acc: number, g: any) => acc + (Array.isArray((g as any).products) ? (g as any).products.length : 0), 0);
      toast.success(`Found ${total} products across ${data?.countCategories ?? 0} categories`);
      fetchSaved(1);
    } catch (e: any) {
      toast.error(e?.message || 'Crawl failed');
    } finally {
      setCrawlLoading(false);
    }
  }

  async function scrapeCategory() {
    if (!categoryUrl.trim()) { toast.error('Enter a category URL'); return; }
    const mp = categoryMaxPages.trim() ? Math.max(1, Math.min(100, parseInt(categoryMaxPages))) : 100;
    try {
      setCategoryLoading(true);
      const res = await fetch(`/api/admin/sourcing/scrape-category?url=${encodeURIComponent(categoryUrl)}&maxPages=${mp}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to scrape');
      const arr: { url: string }[] = Array.isArray(data?.products) ? data.products : [];
      const seen = new Set<string>();
      const unique = arr.filter((p) => {
        if (!p?.url) return false; if (seen.has(p.url)) return false; seen.add(p.url); return true;
      });
      setCategoryResults(unique as any);
      toast.success(`Found ${data?.count ?? 0} products`);
    } catch (e: any) {
      toast.error(e?.message || 'Scrape failed');
    } finally {
      setCategoryLoading(false);
    }
  }

  // Load both sourced list and saved products on mount
  useEffect(() => { fetchList(); }, []);
  useEffect(() => { fetchSaved(1); }, []);

  // When opening saved modal, re-fetch the latest from DB by sourceUrl to ensure description/images are current
  useEffect(() => {
    (async () => {
      if (!savedSelected?.sourceUrl) return;
      try {
        const res = await fetch(`/api/admin/sourcing/sourced/list?sourceUrl=${encodeURIComponent(savedSelected.sourceUrl)}&limit=1&page=1`);
        const data = await res.json();
        if (res.ok && Array.isArray(data?.items) && data.items[0]) {
          setSavedSelected((prev) => prev ? { ...prev, ...data.items[0] } : data.items[0]);
        }
      } catch {}
    })();
  }, [savedSelected?._id]);

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
              <p className="text-sm text-gray-600">Paste a public product page URL. We'll parse details, store them in the Sourcing DB, and create a draft product.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 text-gray-700">
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://www.angeljackets.com/products/reeves-black-vintage-leather-jacket.html"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setUrl('https://www.angeljackets.com/products/reeves-black-vintage-leather-jacket.html')}
                className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
              >
                Paste Example
              </button>
              <button
                onClick={importUrl}
                disabled={loading}
                className="px-5 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
              >
                {loading ? 'Importing…' : 'Import URL'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrape Category Section */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-teal-200/40 blur-3xl" />
        <div className="relative p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Scrape Category Listing</h2>
              <p className="text-sm text-gray-600">Enter a category URL (e.g., Men, Women) to fetch product cards for review.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 text-gray-700">
            <input
              value={categoryUrl}
              onChange={e => setCategoryUrl(e.target.value)}
              placeholder="https://www.angeljackets.com/categories/Mens-Leather-Jackets.html"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
            />
            <div className="flex gap-2 items-stretch">
              <input
                value={categoryMaxPages}
                onChange={e => setCategoryMaxPages(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Pages"
                aria-label="Max pages"
                className="w-28 border border-gray-200 rounded-xl px-3 py-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
              />
              <button
                onClick={scrapeCategory}
                disabled={categoryLoading}
                className="px-5 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                {categoryLoading ? 'Fetching…' : 'Fetch Products'}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="mt-5">
            {categoryResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 border rounded-2xl bg-white">
                <div className="text-gray-900 font-medium">No category results</div>
                <div className="text-gray-500 text-sm mt-1">Enter a category URL and click Fetch.</div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-gray-700">Found <span className="font-semibold text-gray-900">{categoryResults.length}</span> products</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryResults.map((p, idx) => (
                    <button key={idx} onClick={() => setPreviewCrawled(p)} className="text-left group overflow-hidden rounded-2xl border bg-white hover:shadow-md transition-shadow">
                      <div className="aspect-[4/3] bg-gray-100">
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image</div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="font-medium text-gray-900 line-clamp-2" title={p.title}>{p.title}</div>
                        <div className="text-sm mt-2 font-semibold text-emerald-700">{p.price || '—'}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Crawl Men/Women from Main Page Section */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-amber-50 via-white to-rose-50">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-rose-200/40 blur-3xl" />
        <div className="relative p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-sm">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Discover Categories (Men/Women) and Scrape</h2>
              <p className="text-sm text-gray-600">Enter main page URL or paste HTML. We'll find Men/Women category links (e.g., View All) and scrape each.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-gray-700">
            <input
              value={crawlUrl}
              onChange={e => setCrawlUrl(e.target.value)}
              placeholder="https://www.angeljackets.com/"
              className="border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
            />
            <input
              value={crawlMaxPages}
              onChange={e => setCrawlMaxPages(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Pages per category"
              aria-label="Pages per category"
              className="border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
            />
            <button
              onClick={crawlAngel}
              disabled={crawlLoading}
              className="px-5 py-3 rounded-xl bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
            >
              {crawlLoading ? 'Crawling…' : 'Crawl via URL'}
            </button>
          </div>

          <div className="mt-3">
            <label className="block text-xs text-gray-500 mb-1">Or paste main page HTML</label>
            <textarea
              value={crawlHtml}
              onChange={e => setCrawlHtml(e.target.value)}
              rows={8}
              placeholder="Paste the full HTML of the main page here"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={crawlAngel}
                disabled={crawlLoading}
                className="px-5 py-2.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2"
              >
                {crawlLoading ? 'Crawling…' : 'Crawl via HTML'}
              </button>
            </div>
          </div>

          {/* Crawl Results */}
          <div className="mt-5">
            {!crawlData ? (
              <div className="flex flex-col items-center justify-center h-32 border rounded-2xl bg-white">
                <div className="text-gray-900 font-medium">No crawl results yet</div>
                <div className="text-gray-500 text-sm mt-1">Use URL or paste HTML above and crawl.</div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-sm text-gray-700">Found <span className="font-semibold text-gray-900">{crawlData.countCategories}</span> categories</div>
                {Object.entries(crawlData.results || {}).map(([key, group]) => (
                  <div key={key} className="bg-white border rounded-2xl shadow-sm">
                    <div className="px-4 py-3 border-b flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{group.label}</div>
                        <a href={group.url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-600 hover:text-indigo-700 break-all">{group.url}</a>
                      </div>
                      <div className="text-xs text-gray-700">{group.products?.length || 0} products</div>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(group.products || []).map((p, idx) => (
                        <button key={idx} onClick={() => setPreviewCrawled(p)} className="text-left rounded-xl border bg-white overflow-hidden hover:shadow-md transition-shadow">
                          <div className="aspect-[4/3] bg-gray-100">
                            {p.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image</div>
                            )}
                          </div>
                          <div className="p-3">
                            <div className="text-sm font-medium text-gray-900 line-clamp-2" title={p.title}>{p.title}</div>
                            <div className="text-xs mt-1 font-semibold text-emerald-700">{p.price || '—'}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Saved Sourced Products */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-50 via-white to-zinc-50">
        <div className="relative p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Saved Sourced Products</h2>
              <p className="text-sm text-gray-600">Search and paginate through products saved from the crawl.</p>
            </div>
            <div className="flex gap-2">
              <input
                value={savedQuery}
                onChange={e => setSavedQuery(e.target.value)}
                placeholder="Search title or URL"
                className="border border-gray-200 rounded-xl px-4 py-2.5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
              />
              <button onClick={() => fetchSaved(1)} className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2">Search</button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={savedItems.length > 0 && savedItems.every(i => savedSelectedIds[i._id])}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const next: Record<string, boolean> = {};
                    if (checked) savedItems.forEach(i => { next[i._id] = true; });
                    setSavedSelectedIds(next);
                  }}
                />
                <span>Select all</span>
              </label>
              <span className="text-gray-400">|</span>
              <span>{Object.values(savedSelectedIds).filter(Boolean).length} selected</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  try {
                    // Show warning for processing all products
                    const confirmed = window.confirm(
                      'This will refresh ALL sourced products. This may take several minutes depending on the number of products. Continue?'
                    );
                    if (!confirmed) return;
                    
                    setBulkRefreshLoading(true);
                    const token = localStorage.getItem('token');
                    const resp = await fetch('/api/admin/sourcing/refresh-all', {
                      method: 'POST',
                      headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({})
                    });
                    const data = await resp.json();
                    if (!resp.ok) throw new Error(data?.error || 'Bulk refresh failed');
                    
                    const { results } = data;
                    
                    if (results.refreshed > 0) {
                      toast.success(`Successfully refreshed ${results.refreshed} products`);
                    }
                    if (results.errors > 0) {
                      toast.error(`Failed to refresh ${results.errors} products. Check console for details.`);
                      console.error('Bulk refresh errors:', results.errors);
                    }
                    
                    // Show detailed results
                    console.log('Bulk refresh results:', {
                      total: results.total,
                      refreshed: results.refreshed,
                      errors: results.errors,
                      totalInDatabase: results.totalInDatabase,
                      allProcessed: results.allProcessed
                    });
                    
                    if (results.allProcessed) {
                      toast.success(`All ${results.totalInDatabase} products have been processed!`);
                    }
                    
                    // Refresh the list to show updated data
                    await fetchSaved(savedPage);
                  } catch (e: any) {
                    toast.error(e?.message || 'Bulk refresh failed');
                  } finally {
                    setBulkRefreshLoading(false);
                  }
                }}
                className="px-3 py-2 rounded-xl bg-orange-600 text-white hover:bg-orange-700 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2 disabled:opacity-60"
                disabled={bulkRefreshLoading}
              >
                {bulkRefreshLoading ? 'Refreshing All Products…' : 'Refresh All Products'}
              </button>
              {/* Test Refresh button removed */}
              <button
                onClick={async () => {
                  const ids = Object.entries(savedSelectedIds).filter(([,v]) => v).map(([k]) => k);
                  if (ids.length === 0) return toast.error('No items selected');
                  try {
                    setBulkAddToProductsLoading(true);
                    const token = localStorage.getItem('token');
                    const resp = await fetch('/api/admin/sourcing/convert-bulk-to-products', {
                      method: 'POST',
                      headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({ sourcedIds: ids })
                    });
                    const data = await resp.json();
                    if (!resp.ok) throw new Error(data?.error || 'Bulk add failed');
                    
                    const { results, errors, summary } = data;
                    
                    if (results.length > 0) {
                      const productNames = results.map(r => r.name);
                      toast.success(`Successfully added ${results.length} products: ${productNames.join(', ')}`);
                    }
                    if (errors.length > 0) {
                      console.error('Bulk add errors:', errors);
                      console.table(errors.map(e => ({
                        title: e.title || 'Unknown',
                        error: e.error || 'Unknown error',
                        sourcedId: e.sourcedId
                      })));
                      const errorMessages = errors.map(e => `${e.title || 'Unknown'}: ${e.error || 'Unknown error'}`).join('; ');
                      toast.error(`Failed to add ${errors.length} products: ${errorMessages}`);
                    }
                    
                    // Clear selection after successful operations
                    if (results.length > 0) {
                      setSavedSelectedIds({});
                      await fetchSaved(savedPage);
                    }
                  } catch (e: any) {
                    toast.error(e?.message || 'Bulk add failed');
                  } finally {
                    setBulkAddToProductsLoading(false);
                  }
                }}
                className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-60"
                disabled={bulkAddToProductsLoading}
              >
                {bulkAddToProductsLoading ? 'Adding…' : `Add to Products (${Object.values(savedSelectedIds).filter(Boolean).length})`}
              </button>
              <button
                onClick={() => {
                  const ids = Object.entries(savedSelectedIds).filter(([,v]) => v).map(([k]) => k);
                  if (ids.length === 0) return toast.error('No items selected');
                  const a = document.createElement('a');
                  a.href = `/api/admin/sourcing/sourced/export-csv?ids=${encodeURIComponent(ids.join(','))}`;
                  a.download = '';
                  a.click();
                }}
                className="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                Export selected ({Object.values(savedSelectedIds).filter(Boolean).length})
              </button>
            </div>
          </div>
          {/* Top Pagination */}
          <div className="mt-4 mb-2 flex items-center justify-between">
            <div className="text-sm text-gray-600">Showing {savedItems.length} of {savedTotal}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => fetchSaved(Math.max(1, savedPage - 1))} disabled={savedLoading || savedPage <= 1} className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 disabled:opacity-50 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2">Prev</button>
              <div className="text-sm text-gray-700">Page {savedPage}</div>
              <button onClick={() => fetchSaved(savedPage + 1)} disabled={savedLoading || (savedPage * savedLimit) >= savedTotal} className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 disabled:opacity-50 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2">Next</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedItems.map(it => {
              const thumb = (it.images || []).find(u => u && !(/ajax-loader|spinner|loading|placeholder|\.gif($|\?)/i.test(u) || /\/lib\/flags\//i.test(u) || /angellogo/i.test(u) || /images\/close/i.test(u)));
              return (
              <div key={it._id} onClick={() => setSavedSelected(it)} className="text-left group overflow-hidden rounded-2xl border bg-white hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between px-3 pt-3">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={!!savedSelectedIds[it._id]}
                      onChange={(e) => setSavedSelectedIds(prev => ({ ...prev, [it._id]: e.target.checked }))}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span>Select</span>
                  </label>
                  <button onClick={(e) => { e.stopPropagation(); setSavedSelected(it); }} className="text-xs px-2 py-1 rounded-lg border bg-white hover:bg-gray-50">Open</button>
                </div>
                <div className="aspect-[4/3] bg-gray-100">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt={it.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="font-medium text-gray-900 line-clamp-2" title={it.title}>{it.title}</div>
                  <div className="text-xs text-gray-500 truncate mt-1">{it.categoryGroup}</div>
                  <div className="text-sm mt-2 font-semibold text-emerald-700">{typeof it.price === 'number' ? `$${it.price.toFixed(2)}` : '—'}</div>
                </div>
              </div>
            );})}
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">Showing {savedItems.length} of {savedTotal}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => fetchSaved(Math.max(1, savedPage - 1))} disabled={savedLoading || savedPage <= 1} className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 disabled:opacity-50 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2">Prev</button>
              <div className="text-sm text-gray-700">Page {savedPage}</div>
              <button onClick={() => fetchSaved(savedPage + 1)} disabled={savedLoading || (savedPage * savedLimit) >= savedTotal} className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 disabled:opacity-50 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2">Next</button>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={async () => {
                try {
                  if (savedTotal <= 0) return toast.error('No saved products to add');
                  setBulkAddToProductsLoading(true);
                  const token = localStorage.getItem('token');
                  const resp = await fetch('/api/admin/sourcing/convert-all-to-products', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    }
                  });
                  const result = await resp.json();
                  if (!resp.ok) throw new Error(result?.error || 'Bulk add failed');
                  const created = result?.created ?? 0;
                  const errors = result?.errors ?? 0;
                  toast.success(`Added ${created} products${errors ? `, ${errors} errors` : ''}`);
                  await fetchSaved(savedPage);
                } catch (e: any) {
                  toast.error(e?.message || 'Bulk add failed');
                } finally {
                  setBulkAddToProductsLoading(false);
                }
              }}
              className="mr-3 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              {bulkAddToProductsLoading ? 'Adding ALL…' : `Add ALL to Products (${savedTotal})`}
            </button>
            <button
              onClick={() => {
                try {
                  const ids = savedItems.map(s => s._id).join(',');
                  const url = `/api/admin/sourcing/sourced/export-csv?ids=${encodeURIComponent(ids)}`;
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = '';
                  a.click();
                } catch (e) { toast.error('Export failed'); }
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              Export CSV (Saved)
            </button>
          </div>
        </div>
      </div>

      {/* Saved Product Details Modal */}
      {savedSelected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSavedSelected(null)} />
          <div className="relative w-full max-w-5xl bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b bg-gradient-to-r from-slate-50 via-white to-zinc-50">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xl font-semibold text-gray-900 truncate">{savedSelected.title}</div>
                  <div className="mt-1 text-sm text-gray-500 truncate">
                    <a href={savedSelected.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600">{savedSelected.sourceUrl}</a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">{typeof savedSelected.price === 'number' ? `$${savedSelected.price.toFixed(2)}` : '—'}</div>
                  <button onClick={() => setSavedSelected(null)} className="h-9 w-9 rounded-full bg-white border text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2" aria-label="Close">✕</button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-12">
              <div className="col-span-12 lg:col-span-6 bg-gray-50 p-5">
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                  {(savedSelected.images || []).filter(u => u && !(/ajax-loader|spinner|loading|placeholder|\.gif($|\?)/i.test(u) || /\/lib\/flags\//i.test(u) || /angellogo/i.test(u) || /images\/close/i.test(u))).map((src, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border shadow-sm p-3">
                      <div
                        className="w-full rounded-xl overflow-hidden flex items-center justify-center cursor-zoom-in"
                        style={{ maxHeight: '360px' }}
                        onClick={() => openLightbox(filteredSavedImages, idx)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`${savedSelected.title} ${idx+1}`} className="w-full h-full object-contain" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-span-12 lg:col-span-6 p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="bg-white border rounded-2xl shadow-sm p-5">
                  <div className="text-lg font-semibold text-gray-900 mb-3">Product Details</div>
                  <div className="space-y-3 text-gray-800 text-sm leading-6">
                    {(savedSelected.description || '').split(/\n\n|\r\n\r\n/).filter(Boolean).map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                    {!savedSelected.description && (
                      <p className="text-gray-500">No description</p>
                    )}
                  </div>
                  <div className="mt-5">
                    <div className="font-semibold text-gray-900 mb-2">Specification:</div>
                    {(!savedSelected.specs || Object.keys(savedSelected.specs).length === 0) ? (
                      <div className="text-sm text-gray-500">No specs found</div>
                    ) : (
                      <ul className="list-disc pl-5 space-y-1 text-sm text-gray-800">
                        {Object.entries(savedSelected.specs || {}).map(([k,v]) => (
                          <li key={k}><span className="font-semibold">{k}:</span> {String(v)}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                {/* Raw parsed details from crawl/parse API */}
                <div className="bg-white border rounded-2xl shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-lg font-semibold text-gray-900">Raw Parsed Details</div>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          if (!savedSelected) return;
                          try {
                            setSavedParsedLoading(true);
                            const resp = await fetch('/api/admin/sourcing/import-url', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ url: savedSelected.sourceUrl, alsoCreateDraftProduct: false })
                            });
                            const data = await resp.json();
                            if (!resp.ok) throw new Error(data?.error || 'Parse failed');
                            setSavedParsedRaw(data?.parsed || null);
                            toast.success('Parsed details loaded');
                          } catch (e: any) {
                            toast.error(e?.message || 'Parse failed');
                          } finally {
                            setSavedParsedLoading(false);
                          }
                        }}
                        className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                        disabled={savedParsedLoading}
                      >
                        {savedParsedLoading ? 'Loading…' : 'Load Raw'}
                      </button>
                      <button
                        onClick={() => {
                          try {
                            const id = savedSelected?._id;
                            const a = document.createElement('a');
                            a.href = `/api/admin/sourcing/sourced/export-csv?ids=${id}`;
                            a.download = '';
                            a.click();
                          } catch { toast.error('Export failed'); }
                        }}
                        className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                      >
                        Export CSV (This)
                      </button>
                    </div>
                  </div>
                  {!savedParsedRaw ? (
                    <div className="text-sm text-gray-500">Click "Load Raw" to fetch parsed JSON from the parser.</div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-xs uppercase tracking-wide text-gray-500">JSON</div>
                      <pre className="text-xs whitespace-pre-wrap break-words bg-white border rounded-xl p-3 max-h-72 overflow-auto text-gray-900">{JSON.stringify(savedParsedRaw, null, 2)}</pre>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!savedSelected) return;
                      try {
                        setSavedRefreshLoading(true);
                        const resp = await fetch('/api/admin/sourcing/import-url', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ url: savedSelected.sourceUrl, alsoCreateDraftProduct: false })
                        });
                        const data = await resp.json();
                        if (!resp.ok) throw new Error(data?.error || 'Refresh failed');
                        const parsed = data?.parsed || {};
                        setSavedSelected(prev => prev ? {
                          ...prev,
                          title: parsed.title || prev.title,
                          price: typeof parsed.price === 'number' ? parsed.price : prev.price,
                          description: parsed.description || prev.description,
                          specs: parsed.specs || prev.specs,
                          images: Array.isArray(parsed.images) && parsed.images.length ? parsed.images : prev.images,
                        } : prev);
                        // persist to DB for saved sourced item
                        try {
                          await fetch('/api/admin/sourcing/sourced/upsert', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              id: savedSelected?._id,
                              categoryGroup: savedSelected?.categoryGroup || 'Unknown',
                              title: parsed.title || savedSelected?.title,
                              sourceUrl: savedSelected?.sourceUrl,
                              price: parsed.price,
                              description: parsed.description,
                              images: parsed.images,
                              specs: parsed.specs,
                            })
                          });
                          await fetchSaved(savedPage);
                        } catch {}
                        toast.success('Details refreshed');
                      } catch (e: any) {
                        toast.error(e?.message || 'Refresh failed');
                      } finally {
                        setSavedRefreshLoading(false);
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:opacity-60"
                    disabled={savedRefreshLoading}
                  >
                    {savedRefreshLoading ? 'Refreshing…' : 'Refresh details'}
                  </button>
                  <button
                    onClick={async () => {
                      if (!savedSelected) return;
                      try {
                        setAddToProductsLoading(true);
                        const token = localStorage.getItem('token');
                        const resp = await fetch('/api/admin/sourcing/convert-to-product', {
                          method: 'POST',
                          headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({ sourcedId: savedSelected._id })
                        });
                        const data = await resp.json();
                        if (!resp.ok) {
                          if (data.error?.includes('already exists')) {
                            toast.error('Product already exists with this source URL');
                          } else {
                            throw new Error(data?.error || 'Failed to add to products');
                          }
                          return;
                        }
                        toast.success(`Product "${data.product.name}" created successfully!`);
                        setSavedSelected(null);
                      } catch (e: any) {
                        toast.error(e?.message || 'Failed to add to products');
                      } finally {
                        setAddToProductsLoading(false);
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-60"
                    disabled={addToProductsLoading}
                  >
                    {addToProductsLoading ? 'Adding…' : 'Add to Products'}
                  </button>
                  <a href={savedSelected.sourceUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">Open Source</a>
                  <button onClick={() => setSavedSelected(null)} className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crawled Product Modal */}
      {previewCrawled && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPreviewCrawled(null)} />
          <div className="relative w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b bg-gradient-to-r from-emerald-50 via-white to-teal-50">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xl font-semibold text-gray-900 truncate">{previewCrawled.title}</div>
                  <div className="mt-1 text-sm text-gray-500 truncate">{previewCrawled.url}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">{previewCrawled.price || '—'}</div>
                  <button onClick={() => setPreviewCrawled(null)} className="h-9 w-9 rounded-full bg-white border text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2" aria-label="Close">✕</button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-12">
              <div className="col-span-12 lg:col-span-6 bg-gray-50 p-5">
                <div className="w-full rounded-2xl overflow-hidden border bg-white flex items-center justify-center" style={{ minHeight: '280px' }}>
                  {previewCrawled.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewCrawled.image} alt={previewCrawled.title} className="max-h-[420px] w-full object-contain" />
                  ) : (
                    <div className="text-gray-400">No image</div>
                  )}
                </div>
              </div>
              <div className="col-span-12 lg:col-span-6 p-6 space-y-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Title</div>
                  <div className="text-sm text-gray-900 break-words">{previewCrawled.title}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Price</div>
                  <div className="text-sm font-semibold text-emerald-700">{previewCrawled.price || '—'}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Source</div>
                  <div className="text-sm text-gray-700 break-all">{previewCrawled.url}</div>
                </div>
                <div className="pt-2 flex gap-2">
                  <a href={previewCrawled.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">Open in new tab</a>
                  <button onClick={() => setPreviewCrawled(null)} className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search title or URL"
            className="border border-gray-200 rounded-xl px-4 py-2.5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
          />
          <button
            onClick={fetchList}
            className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 flex items-center gap-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
        <button
          onClick={exportCsv}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
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
                  <button onClick={() => setSelected(null)} className="h-9 w-9 rounded-full bg-white border text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2" aria-label="Close">✕</button>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="grid grid-cols-12">
              <div className="col-span-12 lg:col-span-6 bg-gray-50 p-5">
                {(selected.images && selected.images.length > 0) ? (
                  <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                    {selected.images.filter(u => u && !(/ajax-loader|spinner|loading|placeholder|\.gif($|\?)/i.test(u) || /\/lib\/flags\//i.test(u) || /angellogo/i.test(u) || /images\/close/i.test(u))).map((src, idx) => (
                      <div key={idx} className="bg-white rounded-2xl border shadow-sm p-3">
                        <div
                          className="w-full rounded-xl overflow-hidden flex items-center justify-center cursor-zoom-in"
                          style={{ maxHeight: '360px' }}
                          onClick={() => openLightbox(filteredSelectedImages, idx)}
                        >
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
                            className="px-3 py-2 rounded-lg border bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
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
                        <button onClick={()=> setEnhanceIdx(null)} className="h-8 w-8 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2" aria-label="Close enhance">✕</button>
                      )}
                    </div>
                    <label className="block text-xs text-gray-500 mb-1">Pose/View (e.g., front, back, left side, right side)</label>
                    <input
                      value={enhanceHint}
                      onChange={(e)=>setEnhanceHint(e.target.value)}
                      disabled={enhanceLoading}
                      placeholder="front"
                      className="w-full border rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                        className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
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
                              className="px-2 py-1 rounded-md text-xs bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
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
                        <input value={etsyTitle} onChange={e=>setEtsyTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Tags (comma separated)</label>
                        <input value={etsyTags} onChange={e=>setEtsyTags(e.target.value)} className="w-full border rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Materials</label>
                        <input value={etsyMaterials} onChange={e=>setEtsyMaterials(e.target.value)} className="w-full border rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Category</label>
                        <input value={etsyCategory} onChange={e=>setEtsyCategory(e.target.value)} className="w-full border rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Price (USD)</label>
                        <input value={etsyPrice} onChange={e=>setEtsyPrice(e.target.value)} className="w-full border rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
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
                    <button
                      onClick={async () => {
                        if (!selected) return;
                        try {
                          setRefreshLoading(true);
                          const resp = await fetch('/api/admin/sourcing/import-url', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ url: selected.sourceUrl, alsoCreateDraftProduct: false })
                          });
                          const data = await resp.json();
                          if (!resp.ok) throw new Error(data?.error || 'Refresh failed');
                          const parsed = data?.parsed || {};
                          setSelected(prev => prev ? {
                            ...prev,
                            title: parsed.title || prev.title,
                            price: typeof parsed.price === 'number' ? parsed.price : prev.price,
                            description: parsed.description || prev.description,
                            specs: parsed.specs || (prev as any).specs,
                            images: Array.isArray(parsed.images) && parsed.images.length ? parsed.images : prev.images,
                          } : prev);
                          // upsert to saved sourced DB if we can infer a group from source host
                          try {
                            const categoryGroup = `Auto:${new URL(selected.sourceUrl).hostname}`;
                            await fetch('/api/admin/sourcing/sourced/upsert', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                categoryGroup,
                                title: parsed.title || selected.title,
                                sourceUrl: selected.sourceUrl,
                                price: parsed.price,
                                description: parsed.description,
                                images: parsed.images,
                                specs: parsed.specs,
                              })
                            });
                            await fetchSaved(1);
                          } catch {}
                          toast.success('Details refreshed');
                        } catch (e: any) {
                          toast.error(e?.message || 'Refresh failed');
                        } finally {
                          setRefreshLoading(false);
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:opacity-60"
                      disabled={refreshLoading}
                    >
                      {refreshLoading ? 'Refreshing…' : 'Refresh details'}
                    </button>
                    <a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2">Open Source</a>
                    <button onClick={() => exportOne(selected._id)} className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2">Export CSV</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Lightbox for images */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 transition-opacity duration-150 opacity-100"
          onWheel={onWheelZoom}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 h-10 px-4 rounded-full bg-white/90 text-gray-800 shadow-sm"
          >
            Close
          </button>
          <button
            onClick={() => { setLightboxIndex((lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length); setLightboxScale(1); setLightboxPan({x:0,y:0}); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 h-10 px-3 rounded-full bg-white/80 text-gray-800 shadow-sm"
          >
            ‹
          </button>
          <button
            onClick={() => { setLightboxIndex((lightboxIndex + 1) % lightboxImages.length); setLightboxScale(1); setLightboxPan({x:0,y:0}); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 px-3 rounded-full bg-white/80 text-gray-800 shadow-sm"
          >
            ›
          </button>
          <div
            className="max-w-[92vw] max-h-[92vh] overflow-hidden cursor-grab active:cursor-grabbing rounded-xl bg-white"
            onMouseDown={onMouseDown}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImages[lightboxIndex]}
              alt="zoomed"
              style={{ transform: `translate(${lightboxPan.x}px, ${lightboxPan.y}px) scale(${lightboxScale})`, transition: isPanning ? 'none' : 'transform 120ms ease' }}
              className="block max-w-[92vw] max-h-[92vh] object-contain select-none"
              draggable={false}
            />
          </div>
          <div className="absolute bottom-6 inset-x-0 flex items-center justify-center gap-2">
            <button onClick={() => setLightboxScale(s => Math.max(1, s - 0.2))} className="px-3 py-1 rounded-md bg-white/90 text-gray-800">-</button>
            <button onClick={() => { setLightboxScale(1); setLightboxPan({x:0,y:0}); }} className="px-3 py-1 rounded-md bg-white/90 text-gray-800">Reset</button>
            <button onClick={() => setLightboxScale(s => Math.min(4, s + 0.2))} className="px-3 py-1 rounded-md bg-white/90 text-gray-800">+</button>
          </div>
        </div>
      )}
    </div>
  );
}



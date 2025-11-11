'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
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
  type ScrapedCategoryProduct = { 
    title: string; 
    price: string | null; 
    image: string | null; 
    url: string;
    images?: string[];
    description?: string;
    specifications?: Record<string, string>;
    priceNumber?: number;
  };
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
  // Multi-brand import state
  const brands = ['Angel Jackets','Engine','Lama','London Bridge','Outfitters','The Jacket Maker'];
  const [activeBrand, setActiveBrand] = useState<string>('Angel Jackets');
  const [brandUrl, setBrandUrl] = useState('');
  const [brandHtml, setBrandHtml] = useState('');
  const [brandImporting, setBrandImporting] = useState(false);
  // Outfiters scraping state
  const [outfitersHtml, setOutfitersHtml] = useState('');
  const [outfitersUrl, setOutfitersUrl] = useState('');
  const [outfitersLoading, setOutfitersLoading] = useState(false);
  const [outfitersResults, setOutfitersResults] = useState<ScrapedCategoryProduct[]>([]);
  // Direct collection scraping (uses /api/scrape) state
  const [directScrapeUrl, setDirectScrapeUrl] = useState('https://outfitters.com.pk/collections/men-outerwear');
  const [directScrapeMaxPages, setDirectScrapeMaxPages] = useState('50');
  const [directScrapeDelayMs, setDirectScrapeDelayMs] = useState('200');
  const [directScrapeLoading, setDirectScrapeLoading] = useState(false);
  const [directScrapeResults, setDirectScrapeResults] = useState<ScrapedCategoryProduct[]>([]);
  const [directScrapePagesVisited, setDirectScrapePagesVisited] = useState<string[]>([]);
  // Outfitters Collection scraping state
  const [outfittersCollectionUrl, setOutfittersCollectionUrl] = useState('https://outfitters.com.pk/collections/men-outerwear');
  const [outfittersCollectionMaxPages, setOutfittersCollectionMaxPages] = useState('10');
  const [outfittersCollectionLoading, setOutfittersCollectionLoading] = useState(false);
  const [outfittersCollectionResults, setOutfittersCollectionResults] = useState<ScrapedCategoryProduct[]>([]);
  // London Bridge scraping state
  const [londonBridgeUrl, setLondonBridgeUrl] = useState('https://londonbridge.com.pk/collections');
  const [londonBridgeMaxPages, setLondonBridgeMaxPages] = useState('10');
  const [londonBridgeLoading, setLondonBridgeLoading] = useState(false);
  const [londonBridgeResults, setLondonBridgeResults] = useState<ScrapedCategoryProduct[]>([]);
  // Saved sourced list state
  type SavedItem = { _id: string; title: string; sourceUrl: string; price?: number; images?: string[]; categoryGroup: string; description?: string; specs?: Record<string,string>; brand?: string };
  const [savedQuery, setSavedQuery] = useState('');
  const [savedPage, setSavedPage] = useState(1);
  const [savedLimit, setSavedLimit] = useState(12);
  const [savedTotal, setSavedTotal] = useState(0);
  const [savedPages, setSavedPages] = useState(1); // Total number of pages
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [savedGroupedByBrand, setSavedGroupedByBrand] = useState<Record<string, SavedItem[]>>({});
  const [savedBrands, setSavedBrands] = useState<string[]>([]);
  const [savedBrandCounts, setSavedBrandCounts] = useState<Record<string, number>>({});
  const [savedBrandPages, setSavedBrandPages] = useState<Record<string, number>>({}); // Total pages per brand
  const [savedBrandCurrentPages, setSavedBrandCurrentPages] = useState<Record<string, number>>({}); // Current page per brand
  const [savedBrandTotals, setSavedBrandTotals] = useState<Record<string, number>>({});
  const [savedBrandLimit, setSavedBrandLimit] = useState(12); // Items per page for brand view
  const [expandedBrands, setExpandedBrands] = useState<Record<string, boolean>>({});
  const [savedLoading, setSavedLoading] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState<Record<string, boolean>>({});
  const [savedSelected, setSavedSelected] = useState<SavedItem | null>(null);
  const [savedParsedRaw, setSavedParsedRaw] = useState<any | null>(null);
  const [savedParsedLoading, setSavedParsedLoading] = useState(false);
  const [savedRefreshLoading, setSavedRefreshLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [savedZoomIdx, setSavedZoomIdx] = useState<number | null>(null);
  const [savedSelectedIds, setSavedSelectedIds] = useState<Record<string, boolean>>({});
  const [savedViewMode, setSavedViewMode] = useState<'list' | 'brands'>('brands');
  const [savedSectionExpanded, setSavedSectionExpanded] = useState(true);

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
      const res = await fetch(`/api/admin/sourcing/sourced/list?q=${encodeURIComponent(savedQuery)}&page=${page}&limit=${savedLimit}&groupByBrand=${savedViewMode === 'brands' ? 'true' : 'false'}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load saved products');
      
      if (savedViewMode === 'brands') {
        // Brand view - get brand list with counts
        setSavedBrands(data.brands || []);
        setSavedBrandCounts(data.brandCounts || {});
        setSavedTotal(Number(data.total || 0));
        // Initialize brand pages if not set
        const newBrandPages: Record<string, number> = { ...savedBrandPages };
        const newBrandTotals: Record<string, number> = { ...savedBrandTotals };
        (data.brands || []).forEach((brand: string) => {
          if (!newBrandPages[brand]) newBrandPages[brand] = 1;
          if (!newBrandTotals[brand]) newBrandTotals[brand] = data.brandCounts?.[brand] || 0;
        });
        setSavedBrandPages(newBrandPages);
        setSavedBrandTotals(newBrandTotals);
      } else {
        // Regular list
        setSavedItems(Array.isArray(data.items) ? data.items : []);
        setSavedTotal(Number(data.total || 0));
        setSavedPage(Number(data.page || page));
        setSavedPages(Number(data.pages || Math.ceil((data.total || 0) / savedLimit) || 1));
        setSavedGroupedByBrand({});
        setSavedBrands([]);
        setSavedBrandCounts({});
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load saved');
    } finally {
      setSavedLoading(false);
    }
  }

  async function fetchBrandProducts(brand: string, page = 1) {
    try {
      setLoadingBrands(prev => ({ ...prev, [brand]: true }));
      const res = await fetch(`/api/admin/sourcing/sourced/list?q=${encodeURIComponent(savedQuery)}&groupByBrand=true&brand=${encodeURIComponent(brand)}&brandPage=${page}&brandLimit=${savedBrandLimit}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load brand products');
      
      setSavedGroupedByBrand(prev => ({ ...prev, [brand]: Array.isArray(data.items) ? data.items : [] }));
      setSavedBrandPages(prev => ({ ...prev, [brand]: Number(data.pages || 1) })); // Total pages
      setSavedBrandCurrentPages(prev => ({ ...prev, [brand]: page })); // Current page
      setSavedBrandTotals(prev => ({ ...prev, [brand]: Number(data.total || 0) }));
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load brand products');
    } finally {
      setLoadingBrands(prev => ({ ...prev, [brand]: false }));
    }
  }

  function toggleBrand(brand: string) {
    const isExpanded = expandedBrands[brand];
    setExpandedBrands(prev => ({ ...prev, [brand]: !isExpanded }));
    
    if (!isExpanded && !savedGroupedByBrand[brand]) {
      // Fetch first 5 products for this brand when expanding
      fetchBrandProducts(brand, 1);
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

  async function scrapeDirectCollection() {
    if (!directScrapeUrl.trim()) {
      toast.error('Enter a collection URL');
      return;
    }

    const parsedMaxPages = Number.parseInt(directScrapeMaxPages, 10);
    const parsedDelay = Number.parseInt(directScrapeDelayMs, 10);

    const payload: { url: string; maxPages?: number; delayMsBetweenPages?: number } = {
      url: directScrapeUrl.trim(),
    };

    if (Number.isFinite(parsedMaxPages) && !Number.isNaN(parsedMaxPages) && parsedMaxPages > 0) {
      payload.maxPages = Math.min(Math.max(parsedMaxPages, 1), 200);
    }

    if (Number.isFinite(parsedDelay) && !Number.isNaN(parsedDelay) && parsedDelay >= 0) {
      payload.delayMsBetweenPages = Math.min(Math.max(parsedDelay, 0), 5000);
    }

    try {
      setDirectScrapeLoading(true);
      setDirectScrapePagesVisited([]);

      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || data?.error || 'Failed to scrape collection');
      }

      const list: ScrapedCategoryProduct[] = Array.isArray(data?.products)
        ? data.products.map((item: any) => ({
            title: item?.title ?? 'Untitled Product',
            price: typeof item?.price === 'string' ? item.price : item?.price ?? null,
            image: item?.image ?? null,
            url: item?.url ?? payload.url,
          }))
        : [];

      setDirectScrapeResults(list);
      setDirectScrapePagesVisited(Array.isArray(data?.pagesVisited) ? data.pagesVisited : []);

      toast.success(`Found ${list.length} product${list.length === 1 ? '' : 's'}`);
    } catch (e: any) {
      toast.error(e?.message || 'Scrape failed');
    } finally {
      setDirectScrapeLoading(false);
    }
  }

  function resetDirectScrape() {
    setDirectScrapeResults([]);
    setDirectScrapePagesVisited([]);
  }

  async function scrapeOutfiters() {
    const hasUrl = outfitersUrl.trim().length > 0;
    const hasHtml = outfitersHtml.trim().length > 0;
    if (!hasUrl && !hasHtml) { toast.error('Enter URL or paste HTML'); return; }
    try {
      setOutfitersLoading(true);
      const res = await fetch('/api/admin/sourcing/import-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: 'Outfitters', url: hasUrl ? outfitersUrl : undefined, html: hasHtml ? outfitersHtml : undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          // Duplicate product
          toast.error(data?.message || 'Product already exists');
        } else {
          throw new Error(data?.error || 'Failed to import Outfitters product');
        }
        return;
      }
      
      // Convert the imported product to ScrapedCategoryProduct format for display
      const product: ScrapedCategoryProduct = {
        title: data.parsed?.title || data.item?.title || 'Imported Product',
        price: data.parsed?.price ? `Rs. ${data.parsed.price.toFixed(2)}` : null,
        priceNumber: data.parsed?.price,
        image: Array.isArray(data.parsed?.images) && data.parsed.images.length > 0 ? data.parsed.images[0] : null,
        url: data.parsed?.sourceUrl || data.item?.sourceUrl || outfitersUrl || '',
        images: Array.isArray(data.parsed?.images) ? data.parsed.images : [],
        description: data.parsed?.description || '',
        specifications: data.parsed?.specs || {},
      };
      
      setOutfitersResults(prev => {
        // Check if product already exists in results
        const exists = prev.some(p => p.title === product.title && p.url === product.url);
        if (exists) return prev;
        return [...prev, product];
      });
      
      toast.success('Product imported to Outfitters brand');
      setOutfitersUrl('');
      setOutfitersHtml('');
      await fetchSaved(1);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to import Outfitters product');
    } finally {
      setOutfitersLoading(false);
    }
  }

  async function scrapeOutfittersCollection() {
    if (!outfittersCollectionUrl.trim()) { toast.error('Enter a collections URL'); return; }
    const mp = outfittersCollectionMaxPages.trim() ? Math.max(1, Math.min(50, parseInt(outfittersCollectionMaxPages))) : 10;
    try {
      setOutfittersCollectionLoading(true);
      const res = await fetch('/api/admin/sourcing/scrape-outfitters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: outfittersCollectionUrl, maxPages: mp, fetchDetails: true, save: true, brand: 'Outfitters' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to scrape Outfitters');
      const arr: ScrapedCategoryProduct[] = Array.isArray(data?.products) ? data.products : [];
      const seen = new Set<string>();
      const unique = arr.filter((p) => {
        if (!p?.url) return false; if (seen.has(p.url)) return false; seen.add(p.url); return true;
      });
      setOutfittersCollectionResults(unique);
      const savedMsg = data?.saved ? ` and saved ${data?.savedCount ?? 0} to database` : '';
      toast.success(`Found ${data?.count ?? 0} products from ${data?.pagesVisited?.length ?? 0} pages${savedMsg}`);
      if (data?.saved) {
        await fetchSaved(1); // Refresh saved products list
      }
    } catch (e: any) {
      toast.error(e?.message || 'Scrape failed');
    } finally {
      setOutfittersCollectionLoading(false);
    }
  }

  async function scrapeLondonBridge() {
    if (!londonBridgeUrl.trim()) { toast.error('Enter a collections URL'); return; }
    const mp = londonBridgeMaxPages.trim() ? Math.max(1, Math.min(50, parseInt(londonBridgeMaxPages))) : 10;
    try {
      setLondonBridgeLoading(true);
      const res = await fetch('/api/admin/sourcing/scrape-londonbridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: londonBridgeUrl, maxPages: mp, fetchDetails: true, save: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to scrape London Bridge');
      const arr: ScrapedCategoryProduct[] = Array.isArray(data?.products) ? data.products : [];
      const seen = new Set<string>();
      const unique = arr.filter((p) => {
        if (!p?.url) return false; if (seen.has(p.url)) return false; seen.add(p.url); return true;
      });
      setLondonBridgeResults(unique);
      const savedMsg = data?.saved ? ` and saved ${data?.savedCount ?? 0} to database` : '';
      toast.success(`Found ${data?.count ?? 0} products from ${data?.pagesVisited?.length ?? 0} pages${savedMsg}`);
      if (data?.saved) {
        await fetchSaved(1); // Refresh saved products list
      }
    } catch (e: any) {
      toast.error(e?.message || 'Scrape failed');
    } finally {
      setLondonBridgeLoading(false);
    }
  }

  // Load both sourced list and saved products on mount
  useEffect(() => { fetchList(); }, []);
  useEffect(() => { fetchSaved(1); }, []);

  // Debounced search for savedQuery
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Skip debounce on initial mount when query is empty
    const query = savedQuery || '';
    const viewMode = savedViewMode || 'brands';
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (viewMode === 'brands') {
        setSavedGroupedByBrand({});
        setExpandedBrands({});
      }
      fetchSaved(1);
    }, 500);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [savedQuery || '', savedViewMode || 'brands']); // Ensure always 2 string values

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

      {/* Brand-specific Import */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50">
        <div className="relative p-6 sm:p-8">
          <div className="mb-4">
            <div className="text-xl font-semibold text-gray-900">Import by Brand (URL or HTML)</div>
            <div className="text-sm text-gray-600">Choose a brand and paste a product URL or full HTML. We'll parse and save to the sourced database with the brand.</div>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {brands.map(b => (
              <button
                key={b}
                onClick={() => setActiveBrand(b)}
                className={`px-3 py-1.5 rounded-full border text-sm ${activeBrand===b ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >{b}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-gray-700">
            <input
              value={brandUrl}
              onChange={e=>setBrandUrl(e.target.value)}
              placeholder={`Paste ${activeBrand} product URL`}
              className="border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
            />
            <div className="lg:col-span-2">
              <textarea
                value={brandHtml}
                onChange={e=>setBrandHtml(e.target.value)}
                rows={3}
                placeholder="Or paste full HTML of the product page"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={async ()=>{
                const hasU = brandUrl.trim().length>0; const hasH = brandHtml.trim().length>0;
                if (!hasU && !hasH) { toast.error('Enter URL or paste HTML'); return; }
                try {
                  setBrandImporting(true);
                  const resp = await fetch('/api/admin/sourcing/import-brand', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ brand: activeBrand, url: hasU?brandUrl:undefined, html: hasH?brandHtml:undefined })
                  });
                  const data = await resp.json();
                  if (!resp.ok) throw new Error(data?.error || 'Import failed');
                  toast.success('Imported to sourced DB');
                  setBrandUrl(''); setBrandHtml('');
                  await fetchSaved(1);
                } catch(e:any) {
                  toast.error(e?.message || 'Import failed');
                } finally { setBrandImporting(false); }
              }}
              disabled={brandImporting}
              className="px-5 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
            >{brandImporting ? 'Importing…' : 'Import'}</button>
          </div>
        </div>
      </div>

      {/* Outfitters Brand Scraper */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-orange-200/40 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="relative p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-sm">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Scrape Outfitters Brand</h2>
              <p className="text-sm text-gray-600">Enter a product URL or paste HTML content to import products under the Outfitters brand.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-gray-700 mb-3">
            <input
              value={outfitersUrl}
              onChange={e => setOutfitersUrl(e.target.value)}
              placeholder="https://outfitters.com.pk/products/..."
              className="border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
            />
            <div className="lg:col-span-2">
              <textarea
                value={outfitersHtml}
                onChange={e => setOutfitersHtml(e.target.value)}
                rows={3}
                placeholder="Or paste full HTML of the product page"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
              />
            </div>
          </div>
          
          <div className="flex justify-end mb-5">
            <button
              onClick={scrapeOutfiters}
              disabled={outfitersLoading}
              className="px-5 py-3 rounded-xl bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2"
            >
              {outfitersLoading ? 'Importing…' : 'Import Product'}
            </button>
          </div>

          {/* Results */}
          <div className="mt-5">
            {outfitersResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 border rounded-2xl bg-white">
                <div className="text-gray-900 font-medium">No products imported yet</div>
                <div className="text-gray-500 text-sm mt-1">Enter a URL or paste HTML and click Import Product.</div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-gray-700">Imported <span className="font-semibold text-gray-900">{outfitersResults.length}</span> {outfitersResults.length === 1 ? 'product' : 'products'}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {outfitersResults.map((p, idx) => (
                    <button key={idx} onClick={() => setPreviewCrawled(p)} className="text-left group overflow-hidden rounded-2xl border bg-white hover:shadow-md transition-shadow relative">
                      {/* Badge for products with full details */}
                      {(p.images && p.images.length > 1) || p.description || (p.specifications && Object.keys(p.specifications).length > 0) ? (
                        <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-orange-600 text-white text-xs font-semibold rounded-full shadow-lg">
                          Full Details
                        </div>
                      ) : null}
                      <div className="aspect-[4/3] bg-gray-100 relative">
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image</div>
                        )}
                        {/* Image count badge */}
                        {p.images && p.images.length > 1 && (
                          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs font-semibold rounded-full">
                            {p.images.length} images
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="font-medium text-gray-900 line-clamp-2" title={p.title}>{p.title}</div>
                        <div className="text-sm mt-2 font-semibold text-orange-700">{p.price || '—'}</div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          {p.images && p.images.length > 0 && (
                            <span className="flex items-center gap-1">
                              <span>📷</span> {p.images.length} {p.images.length === 1 ? 'image' : 'images'}
                            </span>
                          )}
                          {p.description && (
                            <span className="flex items-center gap-1">
                              <span>📝</span> Description
                            </span>
                          )}
                          {p.specifications && Object.keys(p.specifications).length > 0 && (
                            <span className="flex items-center gap-1">
                              <span>⚙️</span> {Object.keys(p.specifications).length} specs
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Collection Scraper (uses /api/scrape) */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-50 via-white to-sky-50">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="relative p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Quick Collection Scraper</h2>
              <p className="text-sm text-gray-600">
                Call the new <code className="rounded bg-blue-100 px-1 py-0.5 text-xs text-blue-700">/api/scrape</code> route to gather product cards from any Outfitters (or similar) collection page.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 text-gray-700">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={directScrapeUrl}
                onChange={(event) => setDirectScrapeUrl(event.target.value)}
                placeholder="https://outfitters.com.pk/collections/men-outerwear"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              />
              <div className="flex gap-2">
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Max Pages</label>
                  <input
                    value={directScrapeMaxPages}
                    onChange={(event) => setDirectScrapeMaxPages(event.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="50"
                    className="w-24 border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Delay (ms)</label>
                  <input
                    value={directScrapeDelayMs}
                    onChange={(event) => setDirectScrapeDelayMs(event.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="200"
                    className="w-24 border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex gap-2">
                <button
                  onClick={scrapeDirectCollection}
                  disabled={directScrapeLoading}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  <RefreshCw className={`h-4 w-4 ${directScrapeLoading ? 'animate-spin' : ''}`} />
                  {directScrapeLoading ? 'Scraping…' : 'Fetch Collection'}
                </button>
                <button
                  onClick={resetDirectScrape}
                  disabled={directScrapeLoading || directScrapeResults.length === 0}
                  className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  Clear Results
                </button>
              </div>
              <div className="text-xs text-gray-500">
                Uses POST with JSON payload: <code className="rounded bg-blue-100 px-1 py-0.5 text-[10px] text-blue-700">{'{ url, maxPages?, delayMsBetweenPages? }'}</code>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {directScrapePagesVisited.length > 0 && (
              <div className="rounded-xl border border-blue-100 bg-white/60 p-4">
                <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Pages Visited ({directScrapePagesVisited.length})</div>
                <div className="flex flex-wrap gap-2">
                  {directScrapePagesVisited.map((page, index) => (
                    <a
                      key={page}
                      href={page}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700 hover:bg-blue-100 transition"
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-semibold">
                        {index + 1}
                      </span>
                      <span className="truncate max-w-[12rem] sm:max-w-[16rem]">{page.replace(/^https?:\/\//, '')}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div>
              {directScrapeResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 border border-dashed border-blue-200 rounded-2xl bg-white/70">
                  <div className="text-gray-900 font-medium">No collection scraped yet</div>
                  <div className="text-gray-500 text-sm mt-1 text-center max-w-md">
                    Enter a collection URL and click <span className="font-semibold text-blue-700">Fetch Collection</span> to see product cards pulled directly from the page.
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-gray-700">
                    Found <span className="font-semibold text-gray-900">{directScrapeResults.length}</span> {directScrapeResults.length === 1 ? 'product' : 'products'}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {directScrapeResults.map((product, index) => (
                      <button
                        key={`${product.url}-${index}`}
                        onClick={() => setPreviewCrawled(product)}
                        className="text-left group overflow-hidden rounded-2xl border bg-white hover:shadow-md transition-shadow relative"
                      >
                        <div className="aspect-[4/3] bg-gray-100 relative">
                          {product.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.image} alt={product.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image</div>
                          )}
                        </div>
                        <div className="p-4 space-y-2">
                          <div className="font-medium text-gray-900 line-clamp-2" title={product.title}>{product.title}</div>
                          <div className="text-sm font-semibold text-blue-700">{product.price || '—'}</div>
                          <div className="text-xs text-gray-500 break-words">
                            {product.url ? (
                              <a
                                href={product.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(event) => event.stopPropagation()}
                                className="text-blue-600 hover:text-blue-800 transition"
                              >
                                View Product →
                              </a>
                            ) : (
                              'No product URL'
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Outfitters Collection Scraper */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-teal-50 via-white to-cyan-50">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-teal-200/40 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="relative p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Scrape Outfitters Collections</h2>
              <p className="text-sm text-gray-600">Enter a collection URL to scrape all products from Outfitters collections (e.g., /collections/men-outerwear).</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 text-gray-700 mb-3">
            <input
              value={outfittersCollectionUrl}
              onChange={e => setOutfittersCollectionUrl(e.target.value)}
              placeholder="https://outfitters.com.pk/collections/men-outerwear"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent shadow-sm"
            />
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 whitespace-nowrap">Max Pages:</label>
              <input
                type="number"
                min="1"
                max="50"
                value={outfittersCollectionMaxPages}
                onChange={e => setOutfittersCollectionMaxPages(e.target.value)}
                className="w-20 border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent shadow-sm"
              />
            </div>
            <button
              onClick={scrapeOutfittersCollection}
              disabled={outfittersCollectionLoading}
              className="px-5 py-3 rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
            >
              {outfittersCollectionLoading ? 'Scraping…' : 'Scrape Collection'}
            </button>
          </div>

          {/* Results */}
          <div className="mt-5">
            {outfittersCollectionResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 border rounded-2xl bg-white">
                <div className="text-gray-900 font-medium">No products scraped yet</div>
                <div className="text-gray-500 text-sm mt-1">Enter a collection URL and click Scrape Collection.</div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-gray-700">Found <span className="font-semibold text-gray-900">{outfittersCollectionResults.length}</span> {outfittersCollectionResults.length === 1 ? 'product' : 'products'}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {outfittersCollectionResults.map((p, idx) => (
                    <button key={idx} onClick={() => setPreviewCrawled(p)} className="text-left group overflow-hidden rounded-2xl border bg-white hover:shadow-md transition-shadow relative">
                      {/* Badge for products with full details */}
                      {(p.images && p.images.length > 1) || p.description || (p.specifications && Object.keys(p.specifications).length > 0) ? (
                        <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-teal-600 text-white text-xs font-semibold rounded-full shadow-lg">
                          Full Details
                        </div>
                      ) : null}
                      <div className="aspect-[4/3] bg-gray-100 relative">
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image</div>
                        )}
                        {/* Image count badge */}
                        {p.images && p.images.length > 1 && (
                          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs font-semibold rounded-full">
                            {p.images.length} images
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="font-medium text-gray-900 line-clamp-2" title={p.title}>{p.title}</div>
                        <div className="text-sm mt-2 font-semibold text-teal-700">{p.price || '—'}</div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          {p.images && p.images.length > 0 && (
                            <span className="flex items-center gap-1">
                              <span>📷</span> {p.images.length} {p.images.length === 1 ? 'image' : 'images'}
                            </span>
                          )}
                          {p.description && (
                            <span className="flex items-center gap-1">
                              <span>📝</span> Description
                            </span>
                          )}
                          {p.specifications && Object.keys(p.specifications).length > 0 && (
                            <span className="flex items-center gap-1">
                              <span>⚙️</span> {Object.keys(p.specifications).length} specs
                            </span>
                          )}
                        </div>
                        <a 
                          href={p.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-teal-600 hover:text-teal-800 mt-1 block truncate"
                        >
                          View Product →
                        </a>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* London Bridge Collections Scraper */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-violet-50 via-white to-purple-50">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-violet-200/40 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-purple-200/40 blur-3xl" />
        <div className="relative p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-sm">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Scrape London Bridge Collections</h2>
              <p className="text-sm text-gray-600">Enter a collections URL to scrape products. Handles "Load More" buttons and pagination automatically.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 text-gray-700">
            <input
              value={londonBridgeUrl}
              onChange={e => setLondonBridgeUrl(e.target.value)}
              placeholder="https://londonbridge.com.pk/collections/..."
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent shadow-sm"
            />
            <div className="flex gap-2 items-stretch">
              <input
                value={londonBridgeMaxPages}
                onChange={e => setLondonBridgeMaxPages(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Pages"
                aria-label="Max pages"
                className="w-28 border border-gray-200 rounded-xl px-3 py-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent shadow-sm"
              />
              <button
                onClick={scrapeLondonBridge}
                disabled={londonBridgeLoading}
                className="px-5 py-3 rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
              >
                {londonBridgeLoading ? 'Scraping…' : 'Scrape Products'}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="mt-5">
            {londonBridgeResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 border rounded-2xl bg-white">
                <div className="text-gray-900 font-medium">No products scraped yet</div>
                <div className="text-gray-500 text-sm mt-1">Enter a collections URL and click Scrape Products.</div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-gray-700">Found <span className="font-semibold text-gray-900">{londonBridgeResults.length}</span> products</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {londonBridgeResults.map((p, idx) => (
                    <button key={idx} onClick={() => setPreviewCrawled(p)} className="text-left group overflow-hidden rounded-2xl border bg-white hover:shadow-md transition-shadow relative">
                      {/* Badge for products with full details */}
                      {(p.images && p.images.length > 1) || p.description || (p.specifications && Object.keys(p.specifications).length > 0) ? (
                        <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-violet-600 text-white text-xs font-semibold rounded-full shadow-lg">
                          Full Details
                        </div>
                      ) : null}
                      <div className="aspect-[4/3] bg-gray-100 relative">
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image</div>
                        )}
                        {/* Image count badge */}
                        {p.images && p.images.length > 1 && (
                          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs font-semibold rounded-full">
                            {p.images.length} images
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="font-medium text-gray-900 line-clamp-2" title={p.title}>{p.title}</div>
                        <div className="text-sm mt-2 font-semibold text-violet-700">{p.price || '—'}</div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          {p.images && p.images.length > 0 && (
                            <span className="flex items-center gap-1">
                              <span>📷</span> {p.images.length} {p.images.length === 1 ? 'image' : 'images'}
                            </span>
                          )}
                          {p.specifications && Object.keys(p.specifications).length > 0 && (
                            <span className="flex items-center gap-1">
                              <span>⚙️</span> {Object.keys(p.specifications).length} specs
                            </span>
                          )}
                        </div>
                        <a 
                          href={p.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-violet-600 hover:text-violet-800 mt-1 block truncate"
                        >
                          View Product →
                        </a>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Saved Sourced Products */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-50 via-white to-zinc-50">
        <div className="relative p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={() => setSavedSectionExpanded(!savedSectionExpanded)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={savedSectionExpanded ? 'Collapse' : 'Expand'}
              >
                {savedSectionExpanded ? (
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Saved Sourced Products</h2>
                <p className="text-sm text-gray-600">Search and filter scraped products organized by brand.</p>
              </div>
            </div>
            {savedSectionExpanded && (
            <div className="flex gap-2">
              <div className="relative">
                <input
                  value={savedQuery}
                  onChange={e => setSavedQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      // Clear debounce and search immediately
                      if (searchTimeoutRef.current) {
                        clearTimeout(searchTimeoutRef.current);
                      }
                      if (savedViewMode === 'brands') {
                        setSavedGroupedByBrand({});
                        setExpandedBrands({});
                      }
                      fetchSaved(1);
                    }
                  }}
                  placeholder="Filter by title, URL, or brand..."
                  className="border-2 border-indigo-200 rounded-xl px-4 py-2.5 pr-10 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm w-64"
                />
                {savedQuery && (
                  <button
                    onClick={() => {
                      setSavedQuery('');
                      if (savedViewMode === 'brands') {
                        setSavedGroupedByBrand({});
                        setExpandedBrands({});
                      }
                      fetchSaved(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    title="Clear filter"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button 
                onClick={() => {
                  if (savedViewMode === 'brands') {
                    setSavedGroupedByBrand({});
                    setExpandedBrands({});
                  }
                  fetchSaved(1);
                }} 
                className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
              >
                Search
              </button>
              <div className="flex gap-1 border border-gray-200 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => { setSavedViewMode('brands'); setSavedGroupedByBrand({}); setExpandedBrands({}); fetchSaved(1); }}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${savedViewMode === 'brands' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  By Brand
                </button>
                <button
                  onClick={() => { setSavedViewMode('list'); fetchSaved(1); }}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${savedViewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  List
                </button>
              </div>
            </div>
            )}
          </div>

          {savedSectionExpanded && (
          <>
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
          {savedViewMode === 'brands' && savedBrands.length > 0 ? (
            // Grouped by brand view with pagination
            <div className="space-y-6">
              {savedBrands.map((brand) => {
                const brandProducts = savedGroupedByBrand[brand] || [];
                const isExpanded = expandedBrands[brand] || false;
                const brandPage = savedBrandCurrentPages[brand] || 1; // Current page
                const brandTotal = savedBrandTotals[brand] || savedBrandCounts[brand] || 0;
                const brandPages = savedBrandPages[brand] || Math.ceil(brandTotal / savedBrandLimit); // Total pages
                const isLoading = loadingBrands[brand] || false;

                return (
                  <div key={brand} className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden">
                    {/* Brand Header - Always Visible */}
                    <div 
                      className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-5 cursor-pointer hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all"
                      onClick={() => toggleBrand(brand)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-2xl font-black text-white mb-1">{brand}</h3>
                          <p className="text-sm text-white/90">
                            {brandTotal} {brandTotal === 1 ? 'product' : 'products'} total
                            {isExpanded && brandProducts.length > 0 && brandTotal > savedBrandLimit && (
                              <span className="ml-2">• Page {brandPage} of {brandPages}</span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-lg font-bold border-2 border-white/30">
                            {brandTotal}
                          </div>
                          <div className="text-white">
                            {isExpanded ? (
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            ) : (
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Brand Products - Collapsible */}
                    {isExpanded && (
                      <div className="p-6">
                        {isLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            <span className="ml-3 text-gray-600">Loading products...</span>
                          </div>
                        ) : brandProducts.length === 0 ? (
                          <div className="text-center py-12 text-gray-500">No products found for this brand</div>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                              {brandProducts.map((it) => {
                                const thumb = (it.images || []).find(u => u && !(/ajax-loader|spinner|loading|placeholder|\.gif($|\?)/i.test(u) || /\/lib\/flags\//i.test(u) || /angellogo/i.test(u) || /images\/close/i.test(u)));
                                return (
                                  <div key={it._id} onClick={() => setSavedSelected(it)} className="text-left group overflow-hidden rounded-xl border bg-white hover:shadow-md transition-shadow cursor-pointer">
                                    <div className="flex items-center justify-between px-3 pt-3">
                                      <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                                        <input
                                          type="checkbox"
                                          className="h-3 w-3 rounded border-gray-300"
                                          checked={!!savedSelectedIds[it._id]}
                                          onChange={(e) => setSavedSelectedIds(prev => ({ ...prev, [it._id]: e.target.checked }))}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </label>
                                      <button onClick={(e) => { e.stopPropagation(); setSavedSelected(it); }} className="text-xs px-2 py-1 rounded-lg border bg-white hover:bg-gray-50">Open</button>
                                    </div>
                                    <div className="aspect-[4/3] bg-gray-100">
                                      {thumb ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={thumb} alt={it.title} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No image</div>
                                      )}
                                    </div>
                                    <div className="p-3">
                                      <div className="font-medium text-sm text-gray-900 line-clamp-2" title={it.title}>{it.title}</div>
                                      <div className="text-sm mt-2 font-semibold text-emerald-700">{typeof it.price === 'number' ? `Rs. ${it.price.toFixed(2)}` : '—'}</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Pagination for brand products */}
                            {brandTotal > savedBrandLimit && (
                              <div className="mt-6 pt-4 border-t border-gray-200">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                  <div className="text-sm text-gray-600">
                                    Showing <span className="font-semibold text-gray-900">{(brandPage - 1) * savedBrandLimit + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(brandPage * savedBrandLimit, brandTotal)}</span> of <span className="font-semibold text-gray-900">{brandTotal}</span> products
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {/* First page button */}
                                    <button 
                                      onClick={() => fetchBrandProducts(brand, 1)} 
                                      disabled={isLoading || brandPage <= 1}
                                      className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 transition-colors"
                                      title="First page"
                                    >
                                      ««
                                    </button>
                                    
                                    {/* Previous page button */}
                                    <button 
                                      onClick={() => fetchBrandProducts(brand, Math.max(1, brandPage - 1))} 
                                      disabled={isLoading || brandPage <= 1}
                                      className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 transition-colors"
                                    >
                                      Prev
                                    </button>
                                    
                                    {/* Page numbers */}
                                    <div className="flex items-center gap-1">
                                      {Array.from({ length: Math.min(5, brandPages) }, (_, i) => {
                                        let pageNum: number;
                                        if (brandPages <= 5) {
                                          pageNum = i + 1;
                                        } else if (brandPage <= 3) {
                                          pageNum = i + 1;
                                        } else if (brandPage >= brandPages - 2) {
                                          pageNum = brandPages - 4 + i;
                                        } else {
                                          pageNum = brandPage - 2 + i;
                                        }
                                        
                                        if (pageNum < 1 || pageNum > brandPages) return null;
                                        
                                        return (
                                          <button
                                            key={pageNum}
                                            onClick={() => fetchBrandProducts(brand, pageNum)}
                                            disabled={isLoading || brandPage === pageNum}
                                            className={`min-w-[40px] px-3 py-2 rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
                                              brandPage === pageNum
                                                ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                                                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                                            }`}
                                          >
                                            {pageNum}
                                          </button>
                                        );
                                      })}
                                    </div>
                                    
                                    {/* Next page button */}
                                    <button 
                                      onClick={() => fetchBrandProducts(brand, brandPage + 1)} 
                                      disabled={isLoading || brandPage >= brandPages}
                                      className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 transition-colors"
                                    >
                                      Next
                                    </button>
                                    
                                    {/* Last page button */}
                                    <button 
                                      onClick={() => fetchBrandProducts(brand, brandPages)} 
                                      disabled={isLoading || brandPage >= brandPages}
                                      className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 transition-colors"
                                      title="Last page"
                                    >
                                      »»
                                    </button>
                                  </div>
                                  
                                  {/* Page info */}
                                  <div className="text-sm text-gray-600">
                                    Page <span className="font-semibold text-gray-900">{brandPage}</span> of <span className="font-semibold text-gray-900">{brandPages}</span>
                                  </div>
                                </div>
                                
                                {/* Items per page selector */}
                                <div className="mt-4 flex items-center justify-center gap-2">
                                  <label className="text-sm text-gray-600">Items per page:</label>
                                  <select
                                    value={savedBrandLimit}
                                    onChange={async (e) => {
                                      const newLimit = parseInt(e.target.value);
                                      setSavedBrandLimit(newLimit);
                                      // Fetch first page with new limit
                                      await fetchBrandProducts(brand, 1);
                                    }}
                                    disabled={isLoading}
                                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                                  >
                                    <option value="12">12</option>
                                    <option value="24">24</option>
                                    <option value="48">48</option>
                                    <option value="96">96</option>
                                  </select>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            // Regular list view
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
                    {it.brand && <div className="text-xs text-indigo-600 font-medium mt-1">{it.brand}</div>}
                    <div className="text-xs text-gray-500 truncate mt-1">{it.categoryGroup}</div>
                    <div className="text-sm mt-2 font-semibold text-emerald-700">{typeof it.price === 'number' ? `Rs. ${it.price.toFixed(2)}` : '—'}</div>
                  </div>
                </div>
              );})}
            </div>
          )}

          {/* Pagination - only show in list view */}
          {savedViewMode === 'list' && savedTotal > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{(savedPage - 1) * savedLimit + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(savedPage * savedLimit, savedTotal)}</span> of <span className="font-semibold text-gray-900">{savedTotal}</span> products
                </div>
                <div className="flex items-center gap-2">
                  {/* First page button */}
                  <button 
                    onClick={() => fetchSaved(1)} 
                    disabled={savedLoading || savedPage <= 1}
                    className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 transition-colors"
                    title="First page"
                  >
                    ««
                  </button>
                  
                  {/* Previous page button */}
                  <button 
                    onClick={() => fetchSaved(Math.max(1, savedPage - 1))} 
                    disabled={savedLoading || savedPage <= 1}
                    className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 transition-colors"
                  >
                    Prev
                  </button>
                  
                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, savedPages) }, (_, i) => {
                      let pageNum: number;
                      if (savedPages <= 5) {
                        pageNum = i + 1;
                      } else if (savedPage <= 3) {
                        pageNum = i + 1;
                      } else if (savedPage >= savedPages - 2) {
                        pageNum = savedPages - 4 + i;
                      } else {
                        pageNum = savedPage - 2 + i;
                      }
                      
                      if (pageNum < 1 || pageNum > savedPages) return null;
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => fetchSaved(pageNum)}
                          disabled={savedLoading || savedPage === pageNum}
                          className={`min-w-[40px] px-3 py-2 rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
                            savedPage === pageNum
                              ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Next page button */}
                  <button 
                    onClick={() => fetchSaved(savedPage + 1)} 
                    disabled={savedLoading || savedPage >= savedPages}
                    className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 transition-colors"
                  >
                    Next
                  </button>
                  
                  {/* Last page button */}
                  <button 
                    onClick={() => fetchSaved(savedPages)} 
                    disabled={savedLoading || savedPage >= savedPages}
                    className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 transition-colors"
                    title="Last page"
                  >
                    »»
                  </button>
                </div>
                
                {/* Page info */}
                <div className="text-sm text-gray-600">
                  Page <span className="font-semibold text-gray-900">{savedPage}</span> of <span className="font-semibold text-gray-900">{savedPages}</span>
                </div>
              </div>
              
              {/* Items per page selector */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <label className="text-sm text-gray-600">Items per page:</label>
                <select
                  value={savedLimit}
                  onChange={async (e) => {
                    const newLimit = parseInt(e.target.value);
                    setSavedLimit(newLimit);
                    setSavedPage(1);
                    // Fetch with new limit directly
                    try {
                      setSavedLoading(true);
                      const res = await fetch(`/api/admin/sourcing/sourced/list?q=${encodeURIComponent(savedQuery)}&page=1&limit=${newLimit}&groupByBrand=false`);
                      const data = await res.json();
                      if (!res.ok) throw new Error(data?.error || 'Failed to load saved products');
                      setSavedItems(Array.isArray(data.items) ? data.items : []);
                      setSavedTotal(Number(data.total || 0));
                      setSavedPage(1);
                      setSavedPages(Number(data.pages || Math.ceil((data.total || 0) / newLimit) || 1));
                    } catch (e: any) {
                      toast.error(e?.message || 'Failed to load saved');
                    } finally {
                      setSavedLoading(false);
                    }
                  }}
                  disabled={savedLoading}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                >
                  <option value="12">12</option>
                  <option value="24">24</option>
                  <option value="48">48</option>
                  <option value="96">96</option>
                </select>
              </div>
            </div>
          )}
          {savedViewMode === 'brands' && (
            <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
              <div className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">Total: {savedTotal} products</span> across <span className="font-semibold text-indigo-700">{savedBrands.length} {savedBrands.length === 1 ? 'brand' : 'brands'}</span>
                {savedBrands.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {savedBrands.map(brand => (
                      <span key={brand} className="px-2 py-1 bg-white rounded-lg text-xs border border-indigo-200">
                        {brand}: {savedBrandCounts[brand] || 0}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="mt-3 flex justify-end">
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
      </>
      )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPreviewCrawled(null)} />
          <div className="relative w-full max-w-6xl bg-white rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b bg-gradient-to-r from-violet-50 via-white to-purple-50 flex-shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-xl font-semibold text-gray-900 truncate">{previewCrawled.title}</div>
                  <div className="mt-1 text-sm text-gray-500 truncate">{previewCrawled.url}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 rounded-full bg-violet-100 text-violet-700 font-semibold">{previewCrawled.price || '—'}</div>
                  <button onClick={() => setPreviewCrawled(null)} className="h-9 w-9 rounded-full bg-white border text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2" aria-label="Close">✕</button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-12 gap-6 p-6">
                {/* Images Section */}
                <div className="col-span-12 lg:col-span-6 space-y-4">
                  <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Images ({previewCrawled.images?.length || (previewCrawled.image ? 1 : 0)})
                  </div>
                  <div className="space-y-3">
                    {(previewCrawled.images && previewCrawled.images.length > 0 ? previewCrawled.images : (previewCrawled.image ? [previewCrawled.image] : [])).map((img, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-center h-64">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt={`${previewCrawled.title} - Image ${idx + 1}`} className="max-h-full max-w-full object-contain" />
                        </div>
                        <div className="mt-2 text-xs text-gray-500 text-center truncate">{img}</div>
                      </div>
                    ))}
                    {(!previewCrawled.images || previewCrawled.images.length === 0) && !previewCrawled.image && (
                      <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 text-center text-gray-400">No images available</div>
                    )}
                  </div>
                </div>
                
                {/* Details Section */}
                <div className="col-span-12 lg:col-span-6 space-y-6">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Title</div>
                    <div className="text-sm text-gray-900 break-words">{previewCrawled.title}</div>
                  </div>
                  
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Price</div>
                    <div className="text-sm font-semibold text-violet-700">{previewCrawled.price || '—'}</div>
                  </div>

                  {/* Description */}
                  {previewCrawled.description && (
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Description</div>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap break-words bg-gray-50 p-3 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                        {previewCrawled.description}
                      </div>
                    </div>
                  )}

                  {/* Specifications */}
                  {previewCrawled.specifications && Object.keys(previewCrawled.specifications).length > 0 && (
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Specifications</div>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
                        <div className="space-y-2">
                          {Object.entries(previewCrawled.specifications).map(([key, value]) => (
                            <div key={key} className="flex gap-3 text-sm">
                              <div className="font-medium text-gray-700 min-w-[120px]">{key}:</div>
                              <div className="text-gray-600 break-words flex-1">{String(value)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Source URL</div>
                    <div className="text-sm text-gray-700 break-all">{previewCrawled.url}</div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <a href={previewCrawled.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2">Open in new tab</a>
                    <button onClick={() => setPreviewCrawled(null)} className="px-4 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2">Close</button>
                  </div>
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



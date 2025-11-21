'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, Link2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import SelectField from '@/components/SelectField';

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
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [savedLimit, setSavedLimit] = useState(20);
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
  const [addToProductsLoading, setAddToProductsLoading] = useState(false);
  const [bulkAddToProductsLoading, setBulkAddToProductsLoading] = useState(false);
  const [bulkRefreshLoading, setBulkRefreshLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [savedZoomIdx, setSavedZoomIdx] = useState<number | null>(null);
  const [savedSelectedIds, setSavedSelectedIds] = useState<Record<string, boolean>>({});
  const [savedViewMode, setSavedViewMode] = useState<'list' | 'brands'>('list');
  const [savedViewModeOpen, setSavedViewModeOpen] = useState(false);
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
      'Who made it?': 'I did',
      'What is it?': 'A finished product',
      'When was it made?': 'Made To Order',
      'Renewal options': 'Auto-renew',
      'Product type': 'Physical',
      'Tags': etsyTags,
      'Materials': etsyMaterials || 'Leather',
      'Production partners': '',
      'Section': 'Real Leather Jacket',
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
      'Shipping profile': 'Shipping',
      'Weight': '0.5',
      'Length': '10',
      'Width': '8',
      'Height': '2',
      'Return policy': '14 days to return or exchange',
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
        setSavedItems([]);
        setSavedPage(1);
        setSavedPages(1);
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
        setExpandedBrands({});
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
  // Initialize saved page and limit from URL (limit overrides localStorage)
  useEffect(() => {
    const spPage = searchParams?.get('page');
    const spLimit = searchParams?.get('limit');
    let initialLimit = savedLimit;
    if (spLimit) {
      const num = Math.max(1, Math.min(100, parseInt(spLimit)));
      initialLimit = num;
      setSavedLimit(num);
      try { localStorage.setItem('sourcedSavedLimit', String(num)); } catch {}
    } else {
      try {
        const persisted = localStorage.getItem('sourcedSavedLimit');
        if (persisted) {
          const num = Math.max(1, Math.min(100, parseInt(persisted)));
          initialLimit = num;
          setSavedLimit(num);
        }
      } catch {}
    }
    if (spPage) {
      const p = Math.max(1, parseInt(spPage));
      setSavedPage(p);
      fetchSaved(p);
    } else {
      fetchSaved(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Persist savedLimit and refetch when it changes
  useEffect(() => {
    try { localStorage.setItem('sourcedSavedLimit', String(savedLimit)); } catch {}
    // Reset to page 1 to avoid out-of-range
    setSavedPage(1);
    fetchSaved(1);
    // Update URL
    try {
      const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
      sp.set('limit', String(savedLimit));
      sp.set('page', '1');
      router.replace(`?${sp.toString()}`);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedLimit]);

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
      {/* Sourcing Panel Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Sourcing Panel</h2>
        <p className="text-gray-600 mb-6">
          Import products from external sources by URL or browse saved sourced products.
        </p>

        {/* Import by URL Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Link2 className="inline h-4 w-4 mr-2" />
                Product URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/product-page"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="pt-6">
              <button
                onClick={importUrl}
                disabled={loading || !url}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>{loading ? 'Importing...' : 'Import'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Products Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Saved Sourced Products</h3>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <button
                onClick={() => fetchSaved(1)}
                disabled={savedLoading}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${savedLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <SelectField
                value={savedViewMode}
                options={[
                  { value: 'list', label: 'List View' },
                  { value: 'brands', label: 'Group by Brand' },
                ]}
                isOpen={savedViewModeOpen}
                onOpenChange={setSavedViewModeOpen}
                onSelect={(val) => setSavedViewMode(val as 'list' | 'brands')}
                placeholder="Select view"
                className="w-full sm:w-auto"
              />
            </div>
          </div>

          <input
            type="text"
            value={savedQuery}
            onChange={(e) => setSavedQuery(e.target.value)}
            placeholder="Search saved products..."
            className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <div className="p-6">
          {savedLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading saved products...</p>
            </div>
          ) : savedViewMode === 'brands' ? (
            savedBrands.length ? (
              <div className="space-y-6">
                {savedBrands.map((brand) => (
                  <div key={brand} className="rounded-lg border border-gray-200">
                    <button
                      onClick={() => {
                        const isExpanded = expandedBrands[brand];
                        setExpandedBrands((prev) => ({ ...prev, [brand]: !isExpanded }));
                        if (!isExpanded && !savedGroupedByBrand[brand]) {
                          fetchBrandProducts(brand, 1);
                        }
                      }}
                      className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-gray-50"
                    >
                      <div className="flex flex-col gap-0.5">
                        <h4 className="font-semibold text-gray-900">{brand}</h4>
                        <span className="text-sm text-gray-500">{savedBrandCounts[brand] || 0} items</span>
                      </div>
                      <span className="text-gray-400">{expandedBrands[brand] ? '−' : '+'}</span>
                    </button>

                    {expandedBrands[brand] && (
                      <div className="border-t border-gray-100 bg-gray-50 p-4">
                        {loadingBrands[brand] ? (
                          <div className="py-8 text-center">
                            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"></div>
                          </div>
                        ) : (savedGroupedByBrand[brand] || []).length ? (
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {(savedGroupedByBrand[brand] || []).map((item) => (
                              <div
                                key={item._id}
                                onClick={() => setSavedSelected(item)}
                                className="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                              >
                                {item.images && item.images[0] && (
                                  <img
                                    src={item.images[0]}
                                    alt={item.title}
                                    className="mb-3 h-40 w-full rounded-lg object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = '/placeholder-product.svg';
                                    }}
                                  />
                                )}
                                <h5 className="mb-2 line-clamp-2 text-sm font-medium text-gray-900">
                                  {item.title}
                                </h5>
                                {item.price && (
                                  <p className="text-sm font-semibold text-blue-600">${item.price}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="py-8 text-center text-sm text-gray-500">No products for this brand.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No brands found yet</p>
                <p className="text-gray-400 mt-2">Try importing products or switch to list view.</p>
              </div>
            )
          ) : savedItems.length ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {savedItems.map((item) => (
                <div
                  key={item._id}
                  onClick={() => setSavedSelected(item)}
                  className="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  {item.images && item.images[0] && (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="mb-3 h-40 w-full rounded-lg object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-product.svg';
                      }}
                    />
                  )}
                  <h5 className="mb-2 line-clamp-2 text-sm font-medium text-gray-900">{item.title}</h5>
                  {item.price && <p className="text-sm font-semibold text-blue-600">${item.price}</p>}
                  {item.brand && <p className="mt-1 text-xs text-gray-500">{item.brand}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-gray-500">No saved products found</p>
              <p className="mt-2 text-gray-400">Import products using the URL field above</p>
            </div>
          )}

          {/* Pagination */}
          {savedPages > 1 && (
            <div className="mt-6 flex items-center justify-center space-x-2">
              <button
                onClick={() => fetchSaved(savedPage - 1)}
                disabled={savedPage === 1 || savedLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-gray-600">
                Page {savedPage} of {savedPages}
              </span>
              <button
                onClick={() => fetchSaved(savedPage + 1)}
                disabled={savedPage === savedPages || savedLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Product Detail Modal */}
      {savedSelected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Product Details</h3>
              <button
                onClick={() => setSavedSelected(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {filteredSavedImages.length > 0 && (
                    <img
                      src={filteredSavedImages[0]}
                      alt={savedSelected.title}
                      className="w-full h-64 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-product.svg';
                      }}
                    />
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{savedSelected.title}</h4>
                  {savedSelected.price && (
                    <p className="text-2xl font-bold text-blue-600 mb-4">${savedSelected.price}</p>
                  )}
                  {savedSelected.description && (
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-700 mb-2">Description:</h5>
                      <p className="text-gray-600 text-sm">{savedSelected.description}</p>
                    </div>
                  )}
                  {savedSelected.brand && (
                    <p className="text-gray-600 mb-2">
                      <span className="font-medium">Brand:</span> {savedSelected.brand}
                    </p>
                  )}
                  {savedSelected.sourceUrl && (
                    <a
                      href={savedSelected.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm flex items-center space-x-1"
                    >
                      <Link2 className="h-4 w-4" />
                      <span>View Original</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

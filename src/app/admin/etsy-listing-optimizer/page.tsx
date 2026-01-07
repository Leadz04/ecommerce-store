'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    Loader2,
    Package,
    Store,
    AlertCircle,
    XCircle,
    CheckCircle,
    Sparkles,
    DollarSign,
    Star,
    Eye,
    Heart,
    Tag,
    ArrowLeft,
    Image as ImageIcon,
    X,
    ExternalLink,
    RefreshCw,
    History,
    Edit3,
    ChevronDown,
} from 'lucide-react';

interface EtsyListing {
    listing_id: number;
    etsyListingId?: string;
    title: string;
    url: string;
    price: number;
    currency: string;
    views: number | null;
    num_favorers: number | null;
    shop_id: number | null;
    shop_name: string | null;
    is_star_seller: boolean;
    taxonomy_id: number | null;
    category_path: string[];
    tags: string[];
    description: string | null;
    images: any[] | null;
    state?: string;
}

interface ShopInfo {
    shopId: string;
    shopName: string;
    currencyCode: string;
    listingActiveCount: number;
    loginName: string;
    shopLocationCountryIso: string;
    acceptsCustomRequests: boolean;
}

export default function EtsyListingOptimizerPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Shop info
    const [shopId, setShopId] = useState<string | null>(null);
    const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);

    // 1. Search Marketplace State
    const [searchTerm, setSearchTerm] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<EtsyListing[]>([]);
    const [searchError, setSearchError] = useState<string | null>(null);

    // 2. Selected Market Listing State
    const [selectedMarketListing, setSelectedMarketListing] = useState<EtsyListing | null>(null);
    const [loadingMarketDetails, setLoadingMarketDetails] = useState(false);

    // 3. User Listing Selection State
    const [userListings, setUserListings] = useState<EtsyListing[]>([]);
    const [selectedUserListing, setSelectedUserListing] = useState<EtsyListing | null>(null);
    const [loadingUserListings, setLoadingUserListings] = useState(false);

    // Caching for Market Insights (Persistent across refreshes)
    const [marketDetailsCache, setMarketDetailsCache] = useState<Record<number, any>>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('etsy_market_cache');
            return saved ? JSON.parse(saved) : {};
        }
        return {};
    });

    // Form data (The Merge Form)
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('0');
    const [quantity, setQuantity] = useState('1');
    const [tags, setTags] = useState('');
    const [taxonomyId, setTaxonomyId] = useState('691');
    const [materials, setMaterials] = useState('');
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [customImageUrl, setCustomImageUrl] = useState('');

    // Dropdown data
    const [shopSections, setShopSections] = useState<any[]>([]);
    const [shippingProfiles, setShippingProfiles] = useState<any[]>([]);
    const [returnPolicies, setReturnPolicies] = useState<any[]>([]);
    const [shippingTemplateId, setShippingTemplateId] = useState('');
    const [shopSectionId, setShopSectionId] = useState('');
    const [returnPolicyId, setReturnPolicyId] = useState('');

    // Form status
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);

    // Check authentication
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    router.push('/login');
                    return;
                }

                const res = await fetch('/api/etsy/status', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const data = await res.json();
                if (!res.ok || !data.success) {
                    router.push('/login');
                    return;
                }

                setIsAuthenticated(true);
                if (data.connected && data.shop?.shopId) {
                    const sid = data.shop.shopId.toString();
                    setShopId(sid);
                    setShopInfo(data.shop);

                    // Load cached listings first for instant UI
                    const cachedListings = localStorage.getItem(`etsy_listings_${sid}`);
                    if (cachedListings) {
                        try {
                            setUserListings(JSON.parse(cachedListings));
                        } catch (e) {
                            console.error('Failed to parse cached listings');
                        }
                    }

                    fetchRelatedData(sid, token);
                    fetchUserListings(sid, token);
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                router.push('/login');
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    // Save market cache to localStorage whenever it changes
    useEffect(() => {
        if (Object.keys(marketDetailsCache).length > 0) {
            localStorage.setItem('etsy_market_cache', JSON.stringify(marketDetailsCache));
        }
    }, [marketDetailsCache]);

    const fetchRelatedData = async (sid: string, token: string) => {
        const headers = { Authorization: `Bearer ${token}` };
        fetch(`/api/etsy/shops/${sid}/sections`, { headers })
            .then(r => r.json()).then(data => data.success && setShopSections(data.results || []));
        fetch(`/api/etsy/shops/${sid}/shipping-profiles`, { headers })
            .then(r => r.json()).then(data => data.success && setShippingProfiles(data.results || []));
        fetch(`/api/etsy/shops/${sid}/return-policies`, { headers })
            .then(r => r.json()).then(data => data.success && setReturnPolicies(data.results || []));
    };

    const fetchUserListings = async (sid: string, token: string) => {
        setLoadingUserListings(true);
        try {
            const res = await fetch(`/api/etsy/listings?shopId=${sid}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                const sorted = (data.listings || []).sort((a: any, b: any) => (a.views || 0) - (b.views || 0));
                setUserListings(sorted);
                // Persistent cache
                localStorage.setItem(`etsy_listings_${sid}`, JSON.stringify(sorted));
            }
        } catch (error) {
            console.error('Failed to fetch user listings:', error);
        } finally {
            setLoadingUserListings(false);
        }
    };

    const handleSearch = async () => {
        if (!searchTerm.trim()) return;
        setSearching(true);
        setSearchError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/etsy/market-insights', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ keywords: searchTerm, limit: 50 }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Search failed');

            const highView = (data.listings || []).filter((l: any) => l.views > 100);
            highView.sort((a: any, b: any) => (b.views || 0) - (a.views || 0));
            setSearchResults(highView);
        } catch (error: any) {
            setSearchError(error.message);
        } finally {
            setSearching(false);
        }
    };

    const loadMarketListingDetails = async (listing: EtsyListing) => {
        // Check cache first
        if (marketDetailsCache[listing.listing_id]) {
            setSelectedMarketListing({ ...listing, ...marketDetailsCache[listing.listing_id] });
            return;
        }

        setLoadingMarketDetails(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/etsy/market-insights/${listing.listing_id}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = await res.json();
            if (data.success && data.listing) {
                // Update cache
                setMarketDetailsCache(prev => ({
                    ...prev,
                    [listing.listing_id]: data.listing
                }));
                setSelectedMarketListing({ ...listing, ...data.listing });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingMarketDetails(false);
        }
    };

    // Fill form from Marketplace Listing
    const copyFromMarketToForm = () => {
        if (!selectedMarketListing) return;
        setTitle(selectedMarketListing.title || '');
        setDescription(selectedMarketListing.description || '');
        setPrice(selectedMarketListing.price?.toString() || '0');
        setTags(Array.isArray(selectedMarketListing.tags) ? selectedMarketListing.tags.join(', ') : '');
        setTaxonomyId(selectedMarketListing.taxonomy_id?.toString() || '691');

        const images: string[] = [];
        if (Array.isArray(selectedMarketListing.images)) {
            selectedMarketListing.images.forEach((img: any) => {
                const url = img.url_fullxfull || img.url_570xN || img.url;
                if (url) images.push(url);
            });
        }
        setSelectedImages(images);
        setFormSuccess('Data copied from Market Listing to form!');
        setTimeout(() => setFormSuccess(null), 2000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setFormSuccess(null);

        if (!selectedUserListing) {
            setFormError('Please select one of your listings to update.');
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                shopId,
                listing: {
                    title: title.trim(),
                    description: description.trim(),
                    price: {
                        amount: Math.round(Number(price) * 100),
                        divisor: 100,
                        currency_code: shopInfo?.currencyCode || 'USD',
                    },
                    tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                    taxonomy_id: Number(taxonomyId),
                    quantity: Number(quantity),
                    shipping_profile_id: shippingTemplateId ? Number(shippingTemplateId) : undefined,
                    shop_section_id: shopSectionId ? Number(shopSectionId) : undefined,
                    return_policy_id: returnPolicyId ? Number(returnPolicyId) : undefined,
                },
                productImages: selectedImages,
            };

            const res = await fetch(`/api/etsy/listings/${selectedUserListing.etsyListingId}?shopId=${shopId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Update failed');

            setFormSuccess('Listing updated successfully on Etsy!');

            // Proactively update local state and cache
            if (shopId) {
                const numericPrice = Number(price);
                const updatedListings = userListings.map(l =>
                    l.etsyListingId === selectedUserListing.etsyListingId
                        ? { ...l, ...payload.listing, price: numericPrice, views: l.views, images: payload.productImages.map(url => ({ url })) }
                        : l
                );
                setUserListings(updatedListings as EtsyListing[]);
                localStorage.setItem(`etsy_listings_${shopId}`, JSON.stringify(updatedListings));

                // Also update selectedUserListing to reflect changes in current view
                const newSelected = updatedListings.find(l => l.etsyListingId === selectedUserListing.etsyListingId);
                if (newSelected) setSelectedUserListing(newSelected as EtsyListing);
            }

            if (shopId && token) fetchUserListings(shopId, token);
        } catch (error: any) {
            setFormError(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-purple-600" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-purple-100 sticky top-0 z-20 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <button onClick={() => router.push('/admin')} className="p-2 hover:bg-gray-100 rounded-lg">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Etsy Listing Optimizer</h1>
                            <p className="text-[10px] sm:text-xs text-gray-500">Update your listings using market insights</p>
                        </div>
                    </div>
                    {shopInfo && (
                        <div className="flex items-center gap-3 bg-purple-50 px-4 py-2 rounded-full border border-purple-100 w-full sm:w-auto justify-center sm:justify-start">
                            <Store className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-semibold text-purple-900">{shopInfo.shopName}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* SECTION 1: MARKET SEARCH */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5 overflow-hidden flex flex-col h-auto lg:h-[700px]">
                            <h2 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Search className="h-4 w-4 text-purple-600" />
                                1. Search Market Place
                            </h2>
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Keywords..."
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none text-gray-900 text-sm"
                                />
                                <button onClick={handleSearch} disabled={searching} className="bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center min-w-[50px]">
                                    {searching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 pr-2 max-h-[400px] lg:max-h-none">
                                {searchResults.map(listing => (
                                    <div
                                        key={listing.listing_id}
                                        onClick={() => loadMarketListingDetails(listing)}
                                        className={`p-3 border-2 rounded-xl cursor-pointer transition-all ${selectedMarketListing?.listing_id === listing.listing_id ? 'border-purple-500 bg-purple-50' : 'border-gray-100 hover:border-purple-200 bg-white'}`}
                                    >
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                <img src={listing.images?.[0]?.url_170x135 || listing.images?.[0]?.url} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-gray-900 line-clamp-2">{listing.title}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-purple-600 font-bold text-xs">${listing.price}</span>
                                                    <span className="text-[10px] text-gray-500 flex items-center gap-1"><Eye className="h-2.5 w-2.5" />{listing.views}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: SELECTED MARKET LISTING DATA */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5 h-auto lg:h-[700px] flex flex-col">
                            <h2 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-amber-500" />
                                2. Market Insight Details
                            </h2>

                            {loadingMarketDetails ? (
                                <div className="flex-1 min-h-[200px] flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-purple-300" /></div>
                            ) : selectedMarketListing ? (
                                <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[500px] lg:max-h-none">
                                    <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                                        <img src={selectedMarketListing.images?.[0]?.url_fullxfull || selectedMarketListing.images?.[0]?.url} className="w-full h-full object-contain" />
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">{selectedMarketListing.title}</h3>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {selectedMarketListing.tags?.map((tag, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-gray-100 text-[10px] text-gray-600 rounded-md border border-gray-200">{tag}</span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                                        <p className="text-xs text-purple-900 font-bold mb-1">Description Hint:</p>
                                        <p className="text-[11px] text-gray-600 line-clamp-6">{selectedMarketListing.description}</p>
                                    </div>

                                    <button
                                        onClick={copyFromMarketToForm}
                                        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        Copy to Optimization Form
                                    </button>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-center gap-2">
                                    <Eye className="h-10 w-10 opacity-20" />
                                    <p className="text-sm">Select a listing from search<br />to see details here</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECTION 3: YOUR SHOP LISTING */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5 h-auto lg:h-[700px] flex flex-col">
                            <h2 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Store className="h-4 w-4 text-purple-600" />
                                3. Your Existing Listing
                            </h2>

                            <div className="mb-4">
                                <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block tracking-widest">Select Target Listing</label>

                                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                                    {loadingUserListings && userListings.length === 0 ? (
                                        <div className="flex items-center justify-center p-4">
                                            <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
                                        </div>
                                    ) : userListings.map(l => (
                                        <div
                                            key={l.etsyListingId}
                                            onClick={() => setSelectedUserListing(l)}
                                            className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer border-2 transition-all ${selectedUserListing?.etsyListingId === l.etsyListingId ? 'border-purple-600 bg-purple-50/50 shadow-sm' : 'border-gray-100 hover:border-purple-200 opacity-80 hover:opacity-100 bg-white'}`}
                                        >
                                            <div className="w-11 h-11 rounded-lg overflow-hidden border border-gray-100 shrink-0 bg-gray-50 flex items-center justify-center shadow-inner">
                                                {l.images?.[0]?.url ? (
                                                    <img src={l.images[0].url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="h-4 w-4 text-gray-300" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-[11px] font-bold line-clamp-1 ${selectedUserListing?.etsyListingId === l.etsyListingId ? 'text-purple-700' : 'text-gray-900'}`}>
                                                    {l.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="flex items-center gap-0.5 text-[10px] text-gray-500 bg-gray-50 px-1 border border-gray-100 rounded"><Eye className="h-2.5 w-2.5" />{l.views || 0}</span>
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter ${l.state === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-50 text-gray-500 border border-gray-100'}`}>{l.state}</span>
                                                </div>
                                            </div>
                                            {selectedUserListing?.etsyListingId === l.etsyListingId && (
                                                <CheckCircle className="h-4 w-4 text-purple-600 shrink-0 fill-purple-50" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {selectedUserListing ? (
                                <div className="flex-1 overflow-y-auto space-y-4 max-h-[500px] lg:max-h-none">
                                    <div className="p-4 bg-indigo-50/30 rounded-2xl border-2 border-indigo-100/50">
                                        <div className="flex gap-4 mb-4">
                                            <div className="w-20 h-20 bg-white border-2 border-indigo-200 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                                                <img src={selectedUserListing.images?.[0]?.url} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="min-w-0 flex-1 py-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="px-2 py-0.5 bg-indigo-600 text-[10px] text-white font-black rounded-md shadow-sm">TARGET</span>
                                                    <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase border ${selectedUserListing.state === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>{selectedUserListing.state}</span>
                                                </div>
                                                <p className="text-[13px] font-bold text-gray-900 leading-tight line-clamp-2">{selectedUserListing.title}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div className="bg-white p-2.5 rounded-xl border border-indigo-100 text-center shadow-sm">
                                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-wider mb-0.5">Price</p>
                                                <p className="text-sm font-black text-gray-900">${selectedUserListing.price}</p>
                                            </div>
                                            <div className="bg-white p-2.5 rounded-xl border border-indigo-100 text-center shadow-sm">
                                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-wider mb-0.5">Perform</p>
                                                <p className="text-sm font-black text-gray-900">{selectedUserListing.views || 0} <span className="text-[10px] text-gray-400 font-normal">views</span></p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] uppercase font-black text-indigo-300 tracking-widest pl-1">Target Keywords</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {selectedUserListing.tags && selectedUserListing.tags.length > 0 ? selectedUserListing.tags.map((t, i) => (
                                                    <span key={i} className="px-2 py-1 bg-white border border-indigo-100 text-[10px] font-bold text-gray-600 rounded-lg shadow-sm hover:border-indigo-300 transition-colors">{t}</span>
                                                )) : (
                                                    <span className="text-[10px] text-gray-400 italic pl-1">No tags set yet</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200/50 text-amber-900 text-[11px] flex items-start gap-3 shadow-inner">
                                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-orange-400" />
                                        <p className="leading-relaxed">This listing will be <span className="font-bold underline">overwritten</span> on Etsy. Use the form below to merge your market insights into this listing.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-center gap-2">
                                    <History className="h-10 w-10 opacity-20" />
                                    <p className="text-sm">Select one of your<br />listings to compare</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* THE FORM: OPTIMIZATION HUB */}
                <div className="mt-8 sm:mt-10 bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-purple-100 overflow-hidden">
                    <div className="bg-purple-600 px-4 sm:px-8 py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Edit3 className="h-4 sm:h-5 w-4 sm:w-5 text-white" />
                            </div>
                            <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider">Optimization Update Form</h2>
                        </div>
                        <div className="flex items-center gap-2 text-purple-100 text-xs">
                            <Sparkles className="h-3 w-3" />
                            Use this form to finalize the changes
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-4 sm:p-8">
                        {formError && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
                                <XCircle className="h-5 w-5 shrink-0" />
                                {formError}
                            </div>
                        )}
                        {formSuccess && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700 text-sm">
                                <CheckCircle className="h-5 w-5 shrink-0" />
                                {formSuccess}
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
                            <div className="space-y-6">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Listing Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-5 py-3 border-2 border-gray-100 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-50/50 outline-none transition-all text-gray-900"
                                        placeholder="Optimized title..."
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                                    <textarea
                                        rows={8}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full px-5 py-3 border-2 border-gray-100 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-50/50 outline-none transition-all text-gray-900"
                                        placeholder="Detailed description..."
                                    />
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Tags (comma separated)</label>
                                    <textarea
                                        rows={3}
                                        value={tags}
                                        onChange={(e) => setTags(e.target.value)}
                                        className="w-full px-5 py-3 border-2 border-gray-100 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-50/50 outline-none transition-all text-gray-900"
                                        placeholder="Tag1, Tag2, Tag3..."
                                    />
                                    <p className="text-[10px] text-gray-500 mt-2">Up to 13 tags, 20 characters each max.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Images */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Images ({selectedImages.length})</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                        {selectedImages.map((img, idx) => (
                                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                                                <img src={img} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedImages(selectedImages.filter((_, i) => i !== idx))}
                                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="url"
                                            value={customImageUrl}
                                            onChange={(e) => setCustomImageUrl(e.target.value)}
                                            placeholder="Add image URL..."
                                            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-900"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => { if (customImageUrl) setSelectedImages([...selectedImages, customImageUrl]); setCustomImageUrl(''); }}
                                            className="px-4 py-2 bg-gray-200 rounded-xl hover:bg-gray-300 transition-all font-bold text-xs"
                                        >
                                            ADD
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Price ($)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={price}
                                                onChange={(e) => setPrice(e.target.value)}
                                                className="w-full pl-10 pr-5 py-3 border-2 border-gray-100 rounded-2xl focus:border-purple-500 outline-none text-gray-900"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Quantity</label>
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            className="w-full px-5 py-3 border-2 border-gray-100 rounded-2xl focus:border-purple-500 outline-none text-gray-900"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Taxonomy ID</label>
                                    <input
                                        type="text"
                                        value={taxonomyId}
                                        onChange={(e) => setTaxonomyId(e.target.value)}
                                        className="w-full px-5 py-3 border-2 border-gray-100 rounded-2xl focus:border-purple-500 outline-none text-gray-900"
                                        placeholder="e.g. 691"
                                    />
                                </div>

                                {/* Taxonomy and Profiles */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2">Shop Section</label>
                                        <select
                                            value={shopSectionId}
                                            onChange={(e) => setShopSectionId(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-50 outline-none transition-all"
                                        >
                                            <option value="">None</option>
                                            {shopSections.map(s => <option key={s.shop_section_id} value={s.shop_section_id}>{s.title}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2">Shipping Profile</label>
                                        <select
                                            value={shippingTemplateId}
                                            onChange={(e) => setShippingTemplateId(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-50 outline-none transition-all"
                                        >
                                            <option value="">None</option>
                                            {shippingProfiles.map(p => <option key={p.shipping_profile_id} value={p.shipping_profile_id}>{p.title}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2">Return Policy</label>
                                        <select
                                            value={returnPolicyId}
                                            onChange={(e) => setReturnPolicyId(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-50 outline-none transition-all"
                                        >
                                            <option value="">None</option>
                                            {returnPolicies.map(p => <option key={p.return_policy_id} value={p.return_policy_id}>{p.title}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-6 mt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
                                    <button
                                        type="submit"
                                        disabled={submitting || !selectedUserListing}
                                        className="w-full sm:flex-[2] py-4 bg-purple-600 text-white rounded-2xl font-black text-base sm:text-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-purple-200 flex items-center justify-center gap-3 px-4"
                                    >
                                        {submitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <RefreshCw className="h-6 w-6" />}
                                        UPDATE MY LISTING
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTitle('');
                                            setDescription('');
                                            setTags('');
                                            setSelectedImages([]);
                                        }}
                                        className="w-full sm:flex-1 py-4 border-2 border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all text-sm sm:text-base"
                                    >
                                        Clear Form
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

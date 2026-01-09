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
    Filter,
    RefreshCw,
} from 'lucide-react';

interface EtsyListing {
    listing_id: number;
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

export default function EtsyListingCreatorPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Shop info
    const [shopId, setShopId] = useState<string | null>(null);
    const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);

    // Search state
    const [searchTerm, setSearchTerm] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<EtsyListing[]>([]);
    const [searchError, setSearchError] = useState<string | null>(null);

    // Filter state
    const [showFilters, setShowFilters] = useState(false);
    const [isStarSeller, setIsStarSeller] = useState(false);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [shopLocation, setShopLocation] = useState('');

    // Selected listing for details
    const [selectedListing, setSelectedListing] = useState<EtsyListing | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Form state
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Dropdown data
    const [shopSections, setShopSections] = useState<any[]>([]);
    const [shippingProfiles, setShippingProfiles] = useState<any[]>([]);
    const [returnPolicies, setReturnPolicies] = useState<any[]>([]);

    // Form fields
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('0');
    const [quantity, setQuantity] = useState('1');
    const [tags, setTags] = useState('');
    const [taxonomyId, setTaxonomyId] = useState('691');
    const [materials, setMaterials] = useState('');
    const [shippingTemplateId, setShippingTemplateId] = useState('');
    const [shopSectionId, setShopSectionId] = useState('');
    const [returnPolicyId, setReturnPolicyId] = useState('');
    const [processingMin, setProcessingMin] = useState('');
    const [processingMax, setProcessingMax] = useState('');
    const [whoMade, setWhoMade] = useState<'i_did' | 'collective' | 'someone_else'>('i_did');
    const [whenMade, setWhenMade] = useState<string>('made_to_order');
    const [isSupply, setIsSupply] = useState(false);
    const [isCustomizable, setIsCustomizable] = useState(false);
    const [isDigital, setIsDigital] = useState(false);
    const [shouldAutoRenew, setShouldAutoRenew] = useState(false);
    const [isPrivate, setIsPrivate] = useState(false);

    // Images from selected listing
    const [customImageUrl, setCustomImageUrl] = useState('');
    const [selectedImages, setSelectedImages] = useState<string[]>([]);

    // Check authentication and load shop info
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    router.push('/login');
                    return;
                }

                // Verify token and get shop info
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
                    fetchRelatedData(sid, token);
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

    // Fetch shop sections, shipping profiles, return policies
    const fetchRelatedData = async (sid: string, token: string) => {
        try {
            const headers = { Authorization: `Bearer ${token}` };

            // Shop Sections
            fetch(`/api/etsy/shops/${sid}/sections`, { headers })
                .then((r) => r.json())
                .then((data) => {
                    if (data.success) setShopSections(data.results || []);
                });

            // Shipping Profiles
            fetch(`/api/etsy/shops/${sid}/shipping-profiles`, { headers })
                .then((r) => r.json())
                .then((data) => {
                    if (data.success) setShippingProfiles(data.results || []);
                });

            // Return Policies
            fetch(`/api/etsy/shops/${sid}/return-policies`, { headers })
                .then((r) => r.json())
                .then((data) => {
                    if (data.success) setReturnPolicies(data.results || []);
                });
        } catch (e) {
            console.error('Failed to fetch related Etsy data:', e);
        }
    };

    // Search Etsy listings
    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            setSearchError('Please enter a search term');
            return;
        }

        setSearching(true);
        setSearchError(null);
        setSearchResults([]);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/etsy/market-insights', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    keywords: searchTerm,
                    limit: 500, // Increase limit for better filtering
                    minPrice: minPrice ? parseFloat(minPrice) : undefined,
                    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
                    shopLocation: shopLocation || undefined,
                    isStarSeller: isStarSeller,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Search failed');
            }

            // Sort all results: Star Seller first, then by views
            const allListings = (data.listings || []).sort((a: EtsyListing, b: EtsyListing) => {
                // Star Sellers first
                if (a.is_star_seller !== b.is_star_seller) {
                    return a.is_star_seller ? -1 : 1;
                }
                // Then by views (highest first)
                return (b.views || 0) - (a.views || 0);
            });

            if (allListings.length === 0) {
                setSearchError('No listings found. Try a different search term.');
            }

            setSearchResults(allListings);
        } catch (error: any) {
            console.error('Search error:', error);
            setSearchError(error.message || 'Failed to search Etsy listings');
        } finally {
            setSearching(false);
        }
    };

    // Load full listing details
    const loadListingDetails = async (listing: EtsyListing) => {
        setLoadingDetails(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/etsy/market-insights/${listing.listing_id}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            const data = await res.json();

            if (data.success && data.listing) {
                const fullListing = data.listing;

                // Populate form with listing data
                setTitle(fullListing.title || '');
                setDescription(fullListing.description || '');
                setPrice(fullListing.price?.toString() || '0');
                setTags(Array.isArray(fullListing.tags) ? fullListing.tags.join(', ') : '');
                setTaxonomyId(fullListing.taxonomy_id?.toString() || '691');

                // Extract images
                const images: string[] = [];
                if (Array.isArray(fullListing.images)) {
                    fullListing.images.forEach((img: any) => {
                        const imageUrl = img.url_fullxfull || img.url_570xN || img.url;
                        if (imageUrl) images.push(imageUrl);
                    });
                }
                setSelectedImages(images);

                // Update selected listing with full details
                setSelectedListing({ ...listing, ...fullListing });
            }
        } catch (error) {
            console.error('Failed to load listing details:', error);
        } finally {
            setLoadingDetails(false);
        }
    };

    // Handle listing selection
    const handleSelectListing = (listing: EtsyListing) => {
        loadListingDetails(listing);
    };

    // Submit form to create Etsy listing
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setFormSuccess(null);

        if (!shopId) {
            setFormError('No active Etsy shop connected. Connect your shop first.');
            return;
        }

        const numericPrice = Number(price);
        const numericQuantity = Number(quantity || '1');
        const numericTaxonomyId = taxonomyId ? Number(taxonomyId) : undefined;

        if (!title.trim() || !description.trim() || !numericPrice || !numericTaxonomyId) {
            setFormError('Title, description, price, and taxonomy ID are required.');
            return;
        }

        const tagList = tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);

        const materialList = materials
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);

        const listingPayload: any = {
            title: title.trim(),
            description: description.trim(),
            quantity: numericQuantity || 1,
            price: {
                amount: Math.round(numericPrice * 100),
                divisor: 100,
                currency_code: shopInfo?.currencyCode || 'USD',
            },
            tags: tagList,
            taxonomy_id: numericTaxonomyId,
            who_made: whoMade,
            when_made: whenMade,
            is_supply: isSupply,
            is_customizable: isCustomizable,
            is_digital: isDigital,
            should_auto_renew: shouldAutoRenew,
            is_private: isPrivate,
            language: 'en-US',
        };

        if (materialList.length) {
            listingPayload.materials = materialList;
        }
        if (shippingTemplateId) {
            listingPayload.shipping_profile_id = Number(shippingTemplateId);
        }
        if (shopSectionId) {
            listingPayload.shop_section_id = Number(shopSectionId);
        }
        if (returnPolicyId) {
            listingPayload.return_policy_id = Number(returnPolicyId);
        }
        if (processingMin) {
            listingPayload.processing_min = Number(processingMin);
        }
        if (processingMax) {
            listingPayload.processing_max = Number(processingMax);
        }

        try {
            setSubmitting(true);
            const token = localStorage.getItem('token');
            const res = await fetch('/api/etsy/listings/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    shopId,
                    listing: listingPayload,
                    productImages: selectedImages,
                }),
            });

            const json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.error || 'Failed to create listing');
            }

            setFormSuccess('Draft listing created on Etsy successfully!');

            // Reset form
            setTimeout(() => {
                resetForm();
            }, 2000);
        } catch (e: any) {
            console.error('Failed to create Etsy listing:', e);
            setFormError(e?.message || 'Failed to create listing');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setPrice('0');
        setQuantity('1');
        setTags('');
        setMaterials('');
        setTaxonomyId('691');
        setShippingTemplateId('');
        setShopSectionId('');
        setReturnPolicyId('');
        setProcessingMin('');
        setProcessingMax('');
        setWhoMade('i_did');
        setWhenMade('made_to_order');
        setIsSupply(false);
        setIsCustomizable(false);
        setIsDigital(false);
        setShouldAutoRenew(false);
        setIsPrivate(false);
        setSelectedListing(null);
        setSelectedImages([]);
    };

    const handleReset = () => {
        setSearchTerm('');
        setMinPrice('');
        setMaxPrice('');
        setShopLocation('');
        setIsStarSeller(false);
        setSearchResults([]);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
            {/* Header */}
            <div className="bg-white border-b border-purple-100 shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/admin')}
                                className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Etsy Listing Creator</h1>
                                <p className="text-sm text-gray-600">Search Etsy & Create Draft Listings</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Shop Info Card */}
                {shopInfo && (
                    <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                    {shopInfo.shopName?.charAt(0) || 'S'}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{shopInfo.shopName}</h3>
                                    <p className="text-xs text-purple-700">
                                        ID: {shopId} • {shopInfo.shopLocationCountryIso}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-purple-500 font-bold">
                                        Currency
                                    </p>
                                    <p className="font-semibold text-gray-800">{shopInfo.currencyCode}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-purple-500 font-bold">
                                        Active
                                    </p>
                                    <p className="font-semibold text-gray-800">{shopInfo.listingActiveCount}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-purple-500 font-bold">
                                        User
                                    </p>
                                    <p className="font-semibold text-gray-800 truncate">{shopInfo.loginName}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-purple-500 font-bold">
                                        Custom
                                    </p>
                                    <p className="font-semibold text-gray-800">
                                        {shopInfo.acceptsCustomRequests ? 'Yes' : 'No'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!shopId && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <p className="text-sm font-medium">
                            No active Etsy shop connected. Please connect your shop from the admin panel.
                        </p>
                    </div>
                )}

                {/* Main Content - Two Column Layout (stacks on mobile) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Side - Search Results */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Search className="h-5 w-5 text-purple-600" />
                                Search Etsy Listings
                            </h2>

                            {/* Search Controls (Sample UI Inspired) */}
                            <div className="space-y-4 mb-6 bg-white p-5 rounded-xl border border-purple-100 shadow-sm">
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Keywords
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                                placeholder="e.g. leather jacket, wedding ring, wall art"
                                                className="w-full h-11 px-4 pr-11 rounded-lg border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base text-gray-900 transition-all outline-none"
                                            />
                                            <Search className="h-5 w-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Min Price ($)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={minPrice}
                                                onChange={(e) => setMinPrice(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full h-11 px-4 rounded-lg border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base text-gray-900 transition-all outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Max Price ($)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={maxPrice}
                                                onChange={(e) => setMaxPrice(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full h-11 px-4 rounded-lg border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base text-gray-900 transition-all outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Shop Location <span className="text-gray-400 font-normal">(optional)</span>
                                        </label>
                                        <input
                                            list="creator-countries"
                                            type="text"
                                            value={shopLocation}
                                            onChange={(e) => setShopLocation(e.target.value)}
                                            placeholder="e.g. United States, Germany"
                                            className="w-full h-11 px-4 rounded-lg border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base text-gray-900 transition-all outline-none"
                                        />
                                        <datalist id="creator-countries">
                                            {Array.from(new Set(searchResults.map(l => l.shop_name?.split(' ')?.pop() || '').filter(s => s.length === 2))).sort().map((country) => (
                                                <option key={country} value={country} />
                                            ))}
                                        </datalist>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={isStarSeller}
                                                onChange={(e) => setIsStarSeller(e.target.checked)}
                                                className="w-5 h-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500 transition-all"
                                            />
                                            <span className="text-gray-900 font-medium flex items-center gap-1.5 text-sm">
                                                <Star className="h-4 w-4 fill-purple-600 text-purple-600" />
                                                Star Seller Only
                                            </span>
                                        </label>

                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <button
                                                onClick={handleReset}
                                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border-2 border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                                Reset
                                            </button>
                                            <button
                                                onClick={handleSearch}
                                                disabled={searching}
                                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2 text-[15px] font-bold rounded-lg text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
                                            >
                                                {searching ? (
                                                    <>
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                        Searching...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Search className="h-5 w-5" />
                                                        Analyze Market
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {!searchResults.length && !searching && (
                                    <div className="flex items-center gap-2 text-xs text-gray-500 pt-3 border-t border-gray-100 mt-2">
                                        <AlertCircle className="h-4 w-4 text-blue-500" />
                                        <span>Enter a query and click &quot;Analyze Market&quot; to see results from public Etsy listings.</span>
                                    </div>
                                )}
                            </div>

                            {/* Search Error */}
                            {searchError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm mt-4">
                                    <XCircle className="h-4 w-4 flex-shrink-0" />
                                    {searchError}
                                </div>
                            )}

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div className="mb-3 flex items-center justify-between text-[10px] sm:text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">
                                            Found {searchResults.length}+ matches
                                        </span>
                                        <span className="text-gray-400">Showing filtered results</span>
                                    </div>
                                    <Sparkles className="h-3 w-3 text-amber-400 animate-pulse" />
                                </div>
                            )}

                            <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
                                {searchResults.length === 0 && !searching && (
                                    <div className="text-center py-12 text-gray-500">
                                        <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                        <p className="text-sm">Search for items to get started</p>
                                    </div>
                                )}

                                {searchResults.map((listing) => (
                                    <div
                                        key={listing.listing_id}
                                        onClick={() => handleSelectListing(listing)}
                                        className={`border-2 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${selectedListing?.listing_id === listing.listing_id
                                            ? 'border-purple-500 bg-purple-50'
                                            : 'border-gray-200 bg-white hover:border-purple-300'
                                            }`}
                                    >
                                        <div className="flex gap-4">
                                            {/* Listing Image */}
                                            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                {(() => {
                                                    // Try to get image from various possible locations
                                                    const images = listing.images;
                                                    if (images && Array.isArray(images) && images.length > 0) {
                                                        const firstImage = images[0];
                                                        const imageUrl = firstImage?.url_170x135 || firstImage?.url_75x75 || firstImage?.url;

                                                        if (imageUrl) {
                                                            return (
                                                                <img
                                                                    src={imageUrl}
                                                                    alt={listing.title}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23e5e7eb" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="10"%3ENo Image%3C/text%3E%3C/svg%3E';
                                                                    }}
                                                                />
                                                            );
                                                        }
                                                    }
                                                    return (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <ImageIcon className="h-8 w-8 text-gray-400" />
                                                        </div>
                                                    );
                                                })()}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
                                                    {listing.title}
                                                </h3>

                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <span className="text-lg font-bold text-purple-600">
                                                        {listing.currency} {listing.price.toFixed(2)}
                                                    </span>
                                                    {listing.is_star_seller && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                                                            <Star className="h-3 w-3 fill-yellow-500" />
                                                            Star Seller
                                                        </span>
                                                    )}
                                                </div>

                                                {listing.shop_name && (
                                                    <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                                                        <Store className="h-3 w-3" />
                                                        {listing.shop_name}
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                                    {listing.views !== null && (
                                                        <span className="flex items-center gap-1">
                                                            <Eye className="h-3 w-3" />
                                                            {listing.views}
                                                        </span>
                                                    )}
                                                    {listing.num_favorers !== null && (
                                                        <span className="flex items-center gap-1">
                                                            <Heart className="h-3 w-3" />
                                                            {listing.num_favorers}
                                                        </span>
                                                    )}
                                                </div>

                                                {listing.tags && listing.tags.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                        {listing.tags.slice(0, 3).map((tag, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                                                            >
                                                                <Tag className="h-2.5 w-2.5" />
                                                                {tag}
                                                            </span>
                                                        ))}
                                                        {listing.tags.length > 3 && (
                                                            <span className="text-xs text-gray-500">
                                                                +{listing.tags.length - 3} more
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.open(listing.url, '_blank');
                                                        }}
                                                        className="flex-1 py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                                                    >
                                                        <ExternalLink className="h-3 w-3" />
                                                        View on Etsy
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSelectListing(listing);
                                                        }}
                                                        className="flex-1 py-1.5 px-3 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                                                    >
                                                        <Eye className="h-3 w-3" />
                                                        Inspect Details
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Create Listing Form */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Package className="h-5 w-5 text-purple-600" />
                                Create Draft Listing
                            </h2>

                            {loadingDetails && (
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-blue-700 text-sm">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading listing details...
                                </div>
                            )}

                            {formError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                                    <XCircle className="h-4 w-4 flex-shrink-0" />
                                    {formError}
                                </div>
                            )}

                            {formSuccess && (
                                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
                                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                                    {formSuccess}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
                                {/* Selected Images Preview & Add More */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Images {selectedImages.length > 0 && `(${selectedImages.length})`}</label>
                                    {selectedImages.length > 0 && (
                                        <div className="grid grid-cols-4 gap-2">
                                            {selectedImages.map((img, idx) => (
                                                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 group">
                                                    <img src={img} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                                                    <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                                                        {idx + 1}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedImages(selectedImages.filter((_, i) => i !== idx))}
                                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {/* Add Custom Image URL */}
                                    <div className="flex gap-2">
                                        <input
                                            type="url"
                                            value={customImageUrl}
                                            onChange={(e) => setCustomImageUrl(e.target.value)}
                                            placeholder="Add image URL..."
                                            className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 transition-all text-gray-900"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (customImageUrl.trim()) {
                                                    setSelectedImages([...selectedImages, customImageUrl.trim()]);
                                                    setCustomImageUrl('');
                                                }
                                            }}
                                            disabled={!customImageUrl.trim()}
                                            className="px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500">Add up to 10 images. Etsy supports JPG, PNG, GIF formats.</p>
                                </div>

                                {/* Title */}
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700">
                                        Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 transition-all text-gray-900"
                                        placeholder="Listing title"
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700">
                                        Description <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={6}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 transition-all text-gray-900"
                                        placeholder="Full product description..."
                                        required
                                    />
                                </div>

                                {/* Price and Quantity */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-gray-700">
                                            Price ({shopInfo?.currencyCode || 'USD'}) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={price}
                                                onChange={(e) => setPrice(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 transition-all text-gray-900"
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-gray-700">Quantity</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 transition-all text-gray-900"
                                            placeholder="1"
                                        />
                                    </div>
                                </div>

                                {/* Tags */}
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700">Tags (comma-separated)</label>
                                    <input
                                        type="text"
                                        value={tags}
                                        onChange={(e) => setTags(e.target.value)}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 transition-all text-gray-900"
                                        placeholder="tag1, tag2, tag3"
                                    />
                                    <p className="text-xs text-gray-500">Max 13 tags, each up to 20 characters</p>
                                </div>

                                {/* Taxonomy ID */}
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700">
                                        Taxonomy (Category) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={taxonomyId}
                                        onChange={(e) => setTaxonomyId(e.target.value)}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 transition-all text-gray-900"
                                        placeholder="e.g. 691"
                                        required
                                    />
                                </div>

                                {/* Materials */}
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700">Materials (comma-separated)</label>
                                    <input
                                        type="text"
                                        value={materials}
                                        onChange={(e) => setMaterials(e.target.value)}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 transition-all text-gray-900"
                                        placeholder="cotton, leather, metal"
                                    />
                                </div>

                                {/* Who Made & When Made */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-gray-700">Who Made</label>
                                        <select
                                            value={whoMade}
                                            onChange={(e) => setWhoMade(e.target.value as any)}
                                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 transition-all text-gray-900"
                                        >
                                            <option value="i_did">I did</option>
                                            <option value="collective">Collective</option>
                                            <option value="someone_else">Someone else</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-gray-700">When Made</label>
                                        <select
                                            value={whenMade}
                                            onChange={(e) => setWhenMade(e.target.value)}
                                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 transition-all text-gray-900"
                                        >
                                            <option value="made_to_order">Made to order</option>
                                            <option value="2020_2024">2020-2024</option>
                                            <option value="2010_2019">2010-2019</option>
                                            <option value="2000_2009">2000-2009</option>
                                            <option value="before_2000">Before 2000</option>
                                            <option value="1990s">1990s</option>
                                            <option value="1980s">1980s</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Shipping, Section, Return Policy */}
                                {(shippingProfiles.length > 0 || shopSections.length > 0 || returnPolicies.length > 0) && (
                                    <div className="space-y-4">
                                        {shippingProfiles.length > 0 && (
                                            <div className="space-y-1">
                                                <label className="text-sm font-bold text-gray-700">Shipping Profile</label>
                                                <select
                                                    value={shippingTemplateId}
                                                    onChange={(e) => setShippingTemplateId(e.target.value)}
                                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 transition-all text-gray-900"
                                                >
                                                    <option value="">Select shipping profile</option>
                                                    {shippingProfiles.map((profile) => (
                                                        <option key={profile.shipping_profile_id} value={profile.shipping_profile_id}>
                                                            {profile.title || `Profile ${profile.shipping_profile_id}`}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {shopSections.length > 0 && (
                                            <div className="space-y-1">
                                                <label className="text-sm font-bold text-gray-700">Shop Section</label>
                                                <select
                                                    value={shopSectionId}
                                                    onChange={(e) => setShopSectionId(e.target.value)}
                                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 transition-all text-gray-900"
                                                >
                                                    <option value="">Select section</option>
                                                    {shopSections.map((section) => (
                                                        <option key={section.shop_section_id} value={section.shop_section_id}>
                                                            {section.title}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {returnPolicies.length > 0 && (
                                            <div className="space-y-1">
                                                <label className="text-sm font-bold text-gray-700">Return Policy</label>
                                                <select
                                                    value={returnPolicyId}
                                                    onChange={(e) => setReturnPolicyId(e.target.value)}
                                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 transition-all text-gray-900"
                                                >
                                                    <option value="">Select return policy</option>
                                                    {returnPolicies.map((policy) => (
                                                        <option key={policy.return_policy_id} value={policy.return_policy_id}>
                                                            {policy.title || `Policy ${policy.return_policy_id}`}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Processing Time */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-gray-700">Processing Min (days)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={processingMin}
                                            onChange={(e) => setProcessingMin(e.target.value)}
                                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 transition-all text-gray-900"
                                            placeholder="1"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-gray-700">Processing Max (days)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={processingMax}
                                            onChange={(e) => setProcessingMax(e.target.value)}
                                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 transition-all text-gray-900"
                                            placeholder="3"
                                        />
                                    </div>
                                </div>

                                {/* Checkboxes */}
                                <div className="space-y-2 border-t pt-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isSupply}
                                            onChange={(e) => setIsSupply(e.target.checked)}
                                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                        />
                                        <span className="text-sm text-gray-700">Is a supply or tool</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isCustomizable}
                                            onChange={(e) => setIsCustomizable(e.target.checked)}
                                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                        />
                                        <span className="text-sm text-gray-700">Is customizable</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isDigital}
                                            onChange={(e) => setIsDigital(e.target.checked)}
                                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                        />
                                        <span className="text-sm text-gray-700">Is a digital download</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={shouldAutoRenew}
                                            onChange={(e) => setShouldAutoRenew(e.target.checked)}
                                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                        />
                                        <span className="text-sm text-gray-700">Auto-renew listing</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isPrivate}
                                            onChange={(e) => setIsPrivate(e.target.checked)}
                                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                        />
                                        <span className="text-sm text-gray-700">Private listing</span>
                                    </label>
                                </div>

                                {/* Submit Buttons */}
                                <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-white pb-2">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                                    >
                                        Reset
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting || !shopId}
                                        className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="h-5 w-5" />
                                                Create Draft Listing
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import ProductCard from '@/components/scraped/ProductCard';
import FilterSidebar from '@/components/scraped/FilterSidebar';
import ProductDetailModal from '@/components/scraped/ProductDetailModal';
import { ScrapedProduct, Facets } from '@/types/scraped-product';
import { Search } from 'lucide-react';

export default function ScrapedProductsPage() {
    const [products, setProducts] = useState<ScrapedProduct[]>([]);
    const [facets, setFacets] = useState<Facets>({
        departments: {},
        categories: {},
        subCategories: {},
        brands: {}
    });
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        department: '',
        category: '',
        subCategory: '',
        brand: '',
        search: '',
        minPrice: '',
        maxPrice: '',
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 24,
        total: 0,
        totalPages: 0
    });
    const [selectedProduct, setSelectedProduct] = useState<ScrapedProduct | null>(null);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', pagination.page.toString());
            params.append('limit', pagination.limit.toString());
            if (filters.department) params.append('department', filters.department);
            if (filters.category) params.append('category', filters.category);
            if (filters.subCategory) params.append('subCategory', filters.subCategory);
            if (filters.brand) params.append('brand', filters.brand);
            if (filters.search) params.append('search', filters.search);
            if (filters.minPrice) params.append('minPrice', filters.minPrice);
            if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);

            const res = await fetch(`/api/scraped-products?${params.toString()}`);
            if (!res.ok) {
                throw new Error(`API error: ${res.status} ${res.statusText}`);
            }
            const data = await res.json();

            console.log('[ScrapedProductsPage] API Response:', {
                productsCount: data.products?.length || 0,
                pagination: data.pagination,
                filters: filters
            });

            setProducts(Array.isArray(data.products) ? data.products : []);
            setPagination(prev => ({ ...prev, ...data.pagination }));
            setFacets(data.facets || { departments: {}, categories: {}, subCategories: {}, brands: {} });
        } catch (error) {
            console.error('Failed to fetch products', error);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, filters]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value === prev[key as keyof typeof filters] ? '' : value // Toggle
        }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchProducts();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-900">Market Explorer</h1>

                    <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4 relative">
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2 border rounded-full bg-gray-100 focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </form>

                    <div className="text-sm text-gray-500">
                        {pagination.total.toLocaleString()} Products
                    </div>
                </div>
            </div>

            <ProductDetailModal
                product={selectedProduct}
                isOpen={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <aside className="w-full lg:w-64 flex-shrink-0">
                        <div className="bg-white p-4 rounded-lg shadow-sm sticky top-24">
                            <FilterSidebar
                                facets={facets}
                                filters={filters}
                                onFilterChange={handleFilterChange}
                                loading={loading}
                            />
                        </div>
                    </aside>

                    {/* Product Grid */}
                    <div className="flex-1">
                        {products.length === 0 && !loading ? (
                            <div className="text-center py-20 bg-white rounded-lg border border-dashed">
                                <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
                                <button
                                    onClick={() => setFilters({ department: '', category: '', subCategory: '', brand: '', search: '', minPrice: '', maxPrice: '' })}
                                    className="mt-4 text-blue-600 hover:underline"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                                {products.map((product, idx) => (
                                    <ProductCard
                                        key={`${product.sourceUrl}-${idx}`}
                                        product={product}
                                        onClick={() => setSelectedProduct(product)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Pagination Controls */}
                        {products.length > 0 && pagination.totalPages > 1 && (
                            <div className="mt-8 flex justify-center gap-2 flex-wrap">
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                    disabled={pagination.page === 1 || loading}
                                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 text-sm text-gray-700 bg-white transition-colors"
                                >
                                    Prev
                                </button>

                                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                    // Logic to show a window of pages around current page
                                    let p = pagination.page;
                                    if (pagination.totalPages <= 5) {
                                        p = i + 1;
                                    } else if (pagination.page <= 3) {
                                        p = i + 1;
                                    } else if (pagination.page >= pagination.totalPages - 2) {
                                        p = pagination.totalPages - 4 + i;
                                    } else {
                                        p = pagination.page - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={p}
                                            onClick={() => setPagination(prev => ({ ...prev, page: p }))}
                                            disabled={loading}
                                            className={`px-3 py-1 border rounded text-sm transition-colors ${pagination.page === p
                                                ? 'bg-black text-white border-black'
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                    disabled={pagination.page >= pagination.totalPages || loading}
                                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 text-sm text-gray-700 bg-white transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        )}

                        {loading && products.length === 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="animate-pulse bg-white p-4 rounded-lg h-80">
                                        <div className="bg-gray-200 h-48 rounded mb-4"></div>
                                        <div className="bg-gray-200 h-4 w-3/4 rounded mb-2"></div>
                                        <div className="bg-gray-200 h-4 w-1/2 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

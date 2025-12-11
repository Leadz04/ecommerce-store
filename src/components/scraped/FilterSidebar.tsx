import { Facets } from '@/types/scraped-product';

interface FilterSidebarProps {
    facets: Facets;
    filters: {
        department: string;
        category: string;
        subCategory: string;
        brand: string;
        minPrice?: string;
        maxPrice?: string;
    };
    onFilterChange: (key: string, value: string) => void;
    loading: boolean;
}

export default function FilterSidebar({ facets, filters, onFilterChange, loading }: FilterSidebarProps) {
    const sections = [
        { title: 'Department', key: 'department', data: facets.departments },
        { title: 'Category', key: 'category', data: facets.categories },
        { title: 'Sub Category', key: 'subCategory', data: facets.subCategories },
        { title: 'Brand', key: 'brand', data: facets.brands },
    ];

    return (
        <div className={`space-y-6 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Clear Filters */}
            {(filters.department || filters.category || filters.subCategory || filters.brand || filters.minPrice || filters.maxPrice) && (
                <button
                    onClick={() => {
                        onFilterChange('department', '');
                        onFilterChange('category', '');
                        onFilterChange('subCategory', '');
                        onFilterChange('brand', '');
                        onFilterChange('minPrice', '');
                        onFilterChange('maxPrice', '');
                    }}
                    className="text-sm text-red-600 hover:text-red-800 underline mb-4"
                >
                    Clear All Filters
                </button>
            )}

            {/* Price Range */}
            <div className="border-b pb-4 last:border-0">
                <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
                <div className="flex gap-2">
                    <input
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice || ''}
                        onChange={(e) => onFilterChange('minPrice', e.target.value)}
                        className="w-1/2 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-black focus:border-black"
                    />
                    <input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice || ''}
                        onChange={(e) => onFilterChange('maxPrice', e.target.value)}
                        className="w-1/2 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-black focus:border-black"
                    />
                </div>
            </div>

            {sections.map((section) => (
                <div key={section.key} className="border-b pb-4 last:border-0">
                    <h3 className="font-semibold text-gray-900 mb-3">{section.title}</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {Object.entries(section.data)
                            .sort(([, a], [, b]) => b - a)
                            .map(([label, count]) => (
                                <label key={label} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                    <input
                                        type="radio"
                                        name={section.key}
                                        checked={filters[section.key as keyof typeof filters] === label}
                                        onChange={() => { }} // Controlled by onClick
                                        onClick={() => onFilterChange(section.key, label)}
                                        className="rounded border-gray-300 text-black focus:ring-black"
                                    />
                                    <span className="text-sm text-gray-700 flex-1 truncate">{label}</span>
                                    <span className="text-xs text-gray-400">({count})</span>
                                </label>
                            ))}
                        {Object.keys(section.data).length === 0 && (
                            <p className="text-xs text-gray-400 italic">No options available</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

export interface ScrapedProduct {
    name: string;
    brand: string;
    price: number;
    originalPrice?: number;
    image: string;
    images: string[];
    department: string;
    category: string;
    subCategory: string;
    sourceUrl: string;
    [key: string]: any;
}

export interface Facets {
    departments: Record<string, number>;
    categories: Record<string, number>;
    subCategories: Record<string, number>;
    brands: Record<string, number>;
}

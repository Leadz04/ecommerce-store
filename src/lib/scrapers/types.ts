export interface ShopifyVariant {
    id: number;
    title: string;
    price: string;
    sku?: string;
    available: boolean;
    compare_at_price?: string;
    option1?: string;
    option2?: string;
    option3?: string;
    inventory_quantity?: number;
}

export interface ShopifyImage {
    id: number;
    src: string;
    width?: number;
    height?: number;
    alt?: string;
}

export interface ShopifyOption {
    name: string;
    values: string[];
}

export interface ShopifyProduct {
    id: number;
    title: string;
    handle: string;
    body_html?: string;
    vendor?: string;
    product_type?: string;
    tags?: string[] | string; // Sometimes string, sometimes array
    variants: ShopifyVariant[];
    images: ShopifyImage[];
    image?: ShopifyImage | null; // Single image fallback
    options?: ShopifyOption[];
    published_at?: string;
    created_at?: string;
    updated_at?: string;
}

export interface ShopifyProductsResponse {
    products: ShopifyProduct[];
}

export interface MappedProduct {
    name: string;
    description: string;
    descriptionHtml?: string;
    price: number;
    originalPrice?: number;
    image: string;
    images: string[];
    category: string;
    brand: string;
    sourceUrl: string;
    productType: string;
    tags: string[];
    specifications: Record<string, string>;
    variants?: any[];
    status: string;
    isActive: boolean;
    inStock: boolean;
    rating: number;
    reviewCount: number;
    stockCount: number;
    raw?: {
        shopifyId: number;
        handle: string;
        variants: ShopifyVariant[];
        options?: ShopifyOption[];
        vendor?: string;
        product_type?: string;
    };
}

export interface ScraperOptions {
    page?: number;
    limit?: number;
}

export interface ScrapeResult {
    brand: string;
    source: string;
    scrapedAt: string;
    totalProducts: number;
    products: MappedProduct[];
}

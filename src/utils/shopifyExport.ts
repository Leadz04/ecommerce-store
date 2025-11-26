/**
 * Shopify CSV Export Utility
 * Converts product data to Shopify product CSV format with unit price fields
 */

interface Product {
    _id: string;
    name: string;
    description?: string;
    price: number;
    originalPrice?: number;
    image: string;
    images?: string[];
    category?: string;
    brand?: string;
    tags?: string[];
    inStock?: boolean;
    stockCount?: number;
    specifications?: Record<string, any>;
    status?: string;
    isActive?: boolean;
    [key: string]: any;
}

/**
 * Escapes CSV field values to handle commas, quotes, and newlines
 */
function escapeCsvValue(value: any): string {
    if (value === null || value === undefined) {
        return '';
    }

    const stringValue = String(value);

    // If the value contains comma, quote, or newline, wrap in quotes and escape existing quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
}

/**
 * Generates a URL-friendly handle from product name
 */
function generateHandle(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Normalizes product status to valid Shopify status values
 * Valid values: active, draft, archived
 */
function normalizeStatus(product: Product): string {
    const status = product.status?.toLowerCase();

    // Check if status is already a valid Shopify value
    if (status === 'active' || status === 'draft' || status === 'archived') {
        return status;
    }

    // Map common status values to Shopify equivalents
    if (status === 'published' || product.isActive === true) {
        return 'active';
    }

    if (status === 'inactive' || status === 'unpublished' || product.isActive === false) {
        return 'draft';
    }

    if (status === 'deleted' || status === 'hidden') {
        return 'archived';
    }

    // Default to draft for unknown statuses
    return 'draft';
}

/**
 * Converts products to Shopify CSV format
 */
export function generateShopifyCSV(products: Product[]): string {
    // Shopify CSV header (52 columns from template)
    const headers = [
        'Title',
        'URL handle',
        'Description',
        'Vendor',
        'Product category',
        'Type',
        'Tags',
        'Published on online store',
        'Status',
        'SKU',
        'Barcode',
        'Option1 name',
        'Option1 value',
        'Option2 name',
        'Option2 value',
        'Option3 name',
        'Option3 value',
        'Price',
        'Compare-at price',
        'Cost per item',
        'Charge tax',
        'Tax code',
        'Unit price total measure',
        'Unit price total measure unit',
        'Unit price base measure',
        'Unit price base measure unit',
        'Inventory tracker',
        'Inventory quantity',
        'Continue selling when out of stock',
        'Weight value (grams)',
        'Weight unit for display',
        'Requires shipping',
        'Fulfillment service',
        'Product image URL',
        'Image position',
        'Image alt text',
        'Variant image URL',
        'Gift card',
        'SEO title',
        'SEO description',
        'Google Shopping / Google product category',
        'Google Shopping / Gender',
        'Google Shopping / Age group',
        'Google Shopping / MPN',
        'Google Shopping / AdWords Grouping',
        'Google Shopping / AdWords labels',
        'Google Shopping / Condition',
        'Google Shopping / Custom product',
        'Google Shopping / Custom label 0',
        'Google Shopping / Custom label 1',
        'Google Shopping / Custom label 2',
        'Google Shopping / Custom label 3',
        'Google Shopping / Custom label 4'
    ];

    const rows: string[][] = [];

    products.forEach((product) => {
        const handle = generateHandle(product.name);
        const tags = product.tags?.join(', ') || '';
        const status = normalizeStatus(product);
        const publishedOnline = status === 'active' ? 'TRUE' : 'FALSE';

        // Get all images
        const allImages = [product.image, ...(product.images || [])].filter(Boolean);

        // Main product row (first image)
        const mainRow = [
            product.name, // Title
            handle, // URL handle
            product.description || '', // Description
            product.brand || '', // Vendor
            product.category || '', // Product category
            product.category || '', // Type
            tags, // Tags
            publishedOnline, // Published on online store
            status, // Status
            product._id, // SKU (using product ID)
            '', // Barcode
            'Title', // Option1 name
            'Default Title', // Option1 value
            '', // Option2 name
            '', // Option2 value
            '', // Option3 name
            '', // Option3 value
            product.price.toString(), // Price
            product.originalPrice?.toString() || '', // Compare-at price
            '', // Cost per item
            'TRUE', // Charge tax
            '', // Tax code
            '', // Unit price total measure
            '', // Unit price total measure unit
            '', // Unit price base measure
            '', // Unit price base measure unit
            'shopify', // Inventory tracker
            product.stockCount?.toString() || '0', // Inventory quantity
            product.inStock === false ? 'deny' : 'continue', // Continue selling when out of stock
            '', // Weight value (grams)
            'g', // Weight unit for display
            'TRUE', // Requires shipping
            'manual', // Fulfillment service
            allImages[0] || '', // Product image URL
            '1', // Image position
            product.name, // Image alt text
            '', // Variant image URL
            'FALSE', // Gift card
            product.name, // SEO title
            product.description || '', // SEO description
            product.category || '', // Google Shopping / Google product category
            '', // Google Shopping / Gender
            '', // Google Shopping / Age group
            '', // Google Shopping / MPN
            product.category || '', // Google Shopping / AdWords Grouping
            tags, // Google Shopping / AdWords labels
            'new', // Google Shopping / Condition
            'FALSE', // Google Shopping / Custom product
            '', // Google Shopping / Custom label 0
            '', // Google Shopping / Custom label 1
            '', // Google Shopping / Custom label 2
            '', // Google Shopping / Custom label 3
            '' // Google Shopping / Custom label 4
        ];

        rows.push(mainRow);

        // Additional image rows (if product has multiple images)
        allImages.slice(1).forEach((imageUrl, index) => {
            const imageRow = [
                '', // Title (empty for additional images)
                handle, // URL handle
                '', // Description
                '', // Vendor
                '', // Product category
                '', // Type
                '', // Tags
                '', // Published on online store
                '', // Status
                '', // SKU
                '', // Barcode
                '', // Option1 name
                '', // Option1 value
                '', // Option2 name
                '', // Option2 value
                '', // Option3 name
                '', // Option3 value
                '', // Price
                '', // Compare-at price
                '', // Cost per item
                '', // Charge tax
                '', // Tax code
                '', // Unit price total measure
                '', // Unit price total measure unit
                '', // Unit price base measure
                '', // Unit price base measure unit
                '', // Inventory tracker
                '', // Inventory quantity
                '', // Continue selling when out of stock
                '', // Weight value (grams)
                '', // Weight unit for display
                '', // Requires shipping
                '', // Fulfillment service
                imageUrl, // Product image URL
                (index + 2).toString(), // Image position
                `${product.name} - Image ${index + 2}`, // Image alt text
                '', // Variant image URL
                '', // Gift card
                '', // SEO title
                '', // SEO description
                '', // Google Shopping / Google product category
                '', // Google Shopping / Gender
                '', // Google Shopping / Age group
                '', // Google Shopping / MPN
                '', // Google Shopping / AdWords Grouping
                '', // Google Shopping / AdWords labels
                '', // Google Shopping / Condition
                '', // Google Shopping / Custom product
                '', // Google Shopping / Custom label 0
                '', // Google Shopping / Custom label 1
                '', // Google Shopping / Custom label 2
                '', // Google Shopping / Custom label 3
                '' // Google Shopping / Custom label 4
            ];

            rows.push(imageRow);
        });
    });

    // Build CSV string
    const csvLines = [
        headers.map(escapeCsvValue).join(','),
        ...rows.map(row => row.map(escapeCsvValue).join(','))
    ];

    return csvLines.join('\r\n');
}

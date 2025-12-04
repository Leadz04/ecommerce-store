import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { verifyToken, requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';

// Product Schema (same as in src/models/Product.ts)
const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [5000, 'Description cannot be more than 5000 characters']
  },
  descriptionHtml: {
    type: String,
    required: false,
    maxlength: [20000, 'HTML description too long']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  image: {
    type: String,
    required: [true, 'Product image is required']
  },
  images: [{
    type: String
  }],
  imageAltTexts: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    enum: ['Men', 'Women', 'Office & Travel', 'Accessories', 'Gifting'],
    default: 'Accessories'
  },
  brand: {
    type: String,
    required: false,
    trim: true
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5']
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: [0, 'Review count cannot be negative']
  },
  inStock: {
    type: Boolean,
    default: true
  },
  stockCount: {
    type: Number,
    required: false,
    default: 0,
    min: [0, 'Stock count cannot be negative']
  },
  tags: [{
    type: String,
    trim: true
  }],
  specifications: {
    type: Map,
    of: String
  },
  sourceUrl: {
    type: String,
    index: true,
    sparse: true,
  },
  productType: {
    type: String,
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true,
  },
  publishAt: {
    type: Date,
    default: null,
    index: true,
  },
  variants: [{
    title: { type: String },
    sku: { type: String },
    price: { type: Number, min: 0 },
    originalPrice: { type: Number, min: 0 },
    available: { type: Boolean },
    inventory: { type: Number, min: 0, required: false },
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

let stage3Connection: mongoose.Connection | null = null;

async function getStage3Connection() {
  if (stage3Connection && stage3Connection.readyState === 1) {
    return stage3Connection;
  }

  const MONGODB_URI_STAGE3 = process.env.MONGODB_URI_STAGE3;
  if (!MONGODB_URI_STAGE3) {
    throw new Error('MONGODB_URI_STAGE3 is not configured');
  }

  stage3Connection = await mongoose.createConnection(MONGODB_URI_STAGE3).asPromise();
  return stage3Connection;
}

interface FurorjeansProduct {
  id: number;
  title: string;
  handle: string;
  body_html?: string;
  vendor?: string;
  product_type?: string;
  tags?: string[];
  variants: Array<{
    id: number;
    title: string;
    price: string;
    sku?: string;
    available: boolean;
    compare_at_price?: string;
    option1?: string;
    option2?: string;
    option3?: string;
  }>;
  images: Array<{
    id: number;
    src: string;
    width?: number;
    height?: number;
  }>;
  options?: Array<{
    name: string;
    values: string[];
  }>;
}

interface FurorjeansResponse {
  products: FurorjeansProduct[];
}

// Helper function to map categoryGroup to category
function mapCategory(productType?: string, tags?: string[]): string {
  if (!productType && !tags) return 'Accessories';
  
  const text = ((productType || '') + ' ' + (tags?.join(' ') || '')).toLowerCase();
  
  if (text.includes('men') || text.includes("men's")) return 'Men';
  if (text.includes('women') || text.includes("women's")) return 'Women';
  if (text.includes('office') || text.includes('travel')) return 'Office & Travel';
  if (text.includes('gift')) return 'Gifting';
  if (text.includes('accessor')) return 'Accessories';
  
  return 'Accessories';
}

// Helper function to convert price (Shopify prices are in cents, but Furorjeans seems to use decimal)
function convertPrice(price: string | number): number {
  if (typeof price === 'number') {
    // If price is less than 100, assume it's in dollars, multiply by 100
    // Otherwise assume it's already in the correct unit
    return price < 100 ? Math.round(price * 100) : price;
  }
  if (typeof price === 'string') {
    const num = parseFloat(price);
    return isNaN(num) ? 0 : (num < 100 ? Math.round(num * 100) : num);
  }
  return 0;
}

// Helper function to extract tags
function extractTags(product: FurorjeansProduct): string[] {
  const tags: string[] = [];
  
  // Add tags from product tags array
  if (product.tags && Array.isArray(product.tags)) {
    tags.push(...product.tags);
  }
  
  // Extract from product type
  if (product.product_type) {
    const typeTags = product.product_type.toLowerCase().split(/\s+/);
    tags.push(...typeTags);
  }
  
  // Extract from title
  const titleWords = product.title.toLowerCase().split(/\s+/);
  const commonTags = ['cap', 'beanie', 'trousers', 'hoodie', 'polo', 'tee', 'shirt', 'tracksuit', 'co-ord'];
  titleWords.forEach(word => {
    if (commonTags.includes(word) && !tags.includes(word)) {
      tags.push(word);
    }
  });
  
  return [...new Set(tags)].filter(Boolean);
}

// Helper function to map variants
function mapVariants(product: FurorjeansProduct) {
  if (!product.variants || product.variants.length === 0) return [];
  
  return product.variants.map(variant => ({
    title: variant.title || 'Default',
    sku: variant.sku || null,
    price: convertPrice(variant.price),
    originalPrice: variant.compare_at_price ? convertPrice(variant.compare_at_price) : undefined,
    available: variant.available !== false,
    inventory: null
  }));
}

// Helper function to map specifications
function mapSpecifications(product: FurorjeansProduct) {
  const specifications = new Map<string, string>();
  
  if (product.vendor) {
    specifications.set('Vendor', product.vendor);
  }
  if (product.product_type) {
    specifications.set('Type', product.product_type);
  }
  if (product.tags && product.tags.length > 0) {
    specifications.set('Tags', product.tags.join(', '));
  }
  if (product.options && product.options.length > 0) {
    product.options.forEach(option => {
      if (option.values && option.values.length > 0) {
        specifications.set(option.name, option.values.join(', '));
      }
    });
  }
  
  return specifications;
}

// Helper function to strip HTML tags
function stripHtml(html?: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

// Helper function to check if product is winter-related
function isWinterProduct(product: FurorjeansProduct): boolean {
  const winterKeywords = [
    'winter', 'wool', 'coat', 'jacket', 'warm', 'fleece', 'thermal', 'sweater', 
    'cardigan', 'hoodie', 'shawl', 'scarf', 'gloves', 'beanie', 'cap', 'boots', 
    'boot', 'puffer', 'down', 'insulated', 'sherpa', 'fur', 'faux fur', 'quilted', 
    'padded', 'fleece-lined', 'thermal', 'warmth', 'cold', 'snow', 'snowy',
    'blazer', 'trench', 'parka', 'anorak', 'bomber', 'windbreaker', 'fleece jacket',
    'wool coat', 'wool jacket', 'wool blazer', 'wool sweater', 'wool cardigan'
  ];
  
  const searchText = [
    product.title?.toLowerCase() || '',
    product.body_html?.toLowerCase() || '',
    product.product_type?.toLowerCase() || '',
    product.tags?.join(' ').toLowerCase() || '',
    product.vendor?.toLowerCase() || ''
  ].join(' ');
  
  return winterKeywords.some(keyword => searchText.includes(keyword.toLowerCase()));
}

// Helper function to fetch products with pagination
async function fetchAllProductsWithPagination(baseUrl: string): Promise<FurorjeansProduct[]> {
  const allProducts: FurorjeansProduct[] = [];
  let page = 1;
  const limit = 250; // Shopify default limit
  let hasMore = true;
  let totalFetched = 0;
  let totalFiltered = 0;
  
  while (hasMore) {
    try {
      const url = `${baseUrl}?page=${page}&limit=${limit}`;
      console.log(`[Furorjeans Scraper] Fetching page ${page} from ${url}`);
      
      const response = await axios.get<FurorjeansResponse>(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      
      const products = response.data.products || [];
      
      if (products.length === 0) {
        hasMore = false;
        break;
      }
      
      totalFetched += products.length;
      
      // Filter for winter products only
      const winterProducts = products.filter(product => isWinterProduct(product));
      allProducts.push(...winterProducts);
      totalFiltered += winterProducts.length;
      
      console.log(`[Furorjeans Scraper] Page ${page}: Found ${products.length} products, ${winterProducts.length} winter-related (Total: ${totalFetched} fetched, ${totalFiltered} winter)`);
      
      // If we got less than the limit, we're on the last page
      if (products.length < limit) {
        hasMore = false;
      } else {
        page++;
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error: any) {
      console.error(`[Furorjeans Scraper] Error fetching page ${page}:`, error.message);
      // If it's a 404 or similar, we've reached the end
      if (error.response?.status === 404) {
        hasMore = false;
      } else {
        // For other errors, try next page but log the error
        page++;
        if (page > 100) { // Safety limit
          hasMore = false;
        }
      }
    }
  }
  
  console.log(`[Furorjeans Scraper] Pagination complete: ${totalFetched} total products, ${totalFiltered} winter products`);
  return allProducts;
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.PRODUCT_CREATE)(request);
    
    const FURORJEANS_URL = 'https://furorjeans.com/products.json';
    
    console.log('[Furorjeans Scraper] Starting to fetch winter products with pagination from:', FURORJEANS_URL);
    
    // Fetch all products with pagination and filter for winter products
    const products = await fetchAllProductsWithPagination(FURORJEANS_URL);
    console.log(`[Furorjeans Scraper] Fetched ${products.length} winter-related products (after filtering)`);
    
    // Connect to STAGE3 database
    const conn = await getStage3Connection();
    const Product = conn.model('Product', ProductSchema);
    
    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const scrapedProducts: any[] = [];
    
    // Process each product
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      try {
        // Skip if missing required fields
        if (!product.title || !product.handle) {
          console.log(`[${i + 1}/${products.length}] Skipping: Missing title or handle`);
          skippedCount++;
          continue;
        }
        
        // Get images
        const images = product.images?.map(img => img.src).filter(Boolean) || [];
        const primaryImage = images[0];
        
        if (!primaryImage) {
          console.log(`[${i + 1}/${products.length}] Skipping: No image - "${product.title}"`);
          skippedCount++;
          continue;
        }
        
        // Build source URL
        const sourceUrl = `https://furorjeans.com/products/${product.handle}`;
        
        // Check if product already exists
        const existingProduct = await Product.findOne({ sourceUrl });
        if (existingProduct) {
          console.log(`[${i + 1}/${products.length}] Skipped (already exists): "${product.title}"`);
          skippedCount++;
          continue;
        }
        
        // Convert product data
        const description = stripHtml(product.body_html) || product.title;
        const price = product.variants?.[0] ? convertPrice(product.variants[0].price) : 0;
        const originalPrice = product.variants?.[0]?.compare_at_price 
          ? convertPrice(product.variants[0].compare_at_price) 
          : undefined;
        const category = mapCategory(product.product_type, product.tags);
        const tags = extractTags(product);
        const variants = mapVariants(product);
        const specifications = mapSpecifications(product);
        
        // Create product data
        const productData = {
          name: product.title,
          description: description.substring(0, 5000),
          descriptionHtml: product.body_html?.substring(0, 20000) || undefined,
          price: price,
          originalPrice: originalPrice,
          image: primaryImage,
          images: images,
          category: category,
          brand: 'furorjeans',
          sourceUrl: sourceUrl,
          productType: product.product_type || '',
          tags: tags,
          specifications: specifications,
          variants: variants.length > 0 ? variants : undefined,
          status: 'draft',
          isActive: true,
          inStock: true,
          rating: 0,
          reviewCount: 0
        };
        
        // Save to database
        const newProduct = new Product(productData);
        await newProduct.save();
        importedCount++;
        console.log(`[${i + 1}/${products.length}] Imported: "${product.title}"`);
        
        // Add to scraped products array for JSON file
        scrapedProducts.push({
          title: product.title,
          description: description,
          price: price / 100, // Convert back to dollars for JSON
          originalPrice: originalPrice ? originalPrice / 100 : undefined,
          images: images,
          sourceUrl: sourceUrl,
          brand: 'furorjeans',
          categoryGroup: product.product_type || category,
          tags: tags,
          specs: Object.fromEntries(specifications),
          raw: {
            shopifyId: product.id,
            handle: product.handle,
            vendor: product.vendor,
            product_type: product.product_type,
            variants: product.variants,
            options: product.options,
          }
        });
        
      } catch (error: any) {
        console.error(`[${i + 1}/${products.length}] Error processing "${product.title}":`, error.message);
        errorCount++;
      }
    }
    
    // Save to JSON file
    const jsonData = {
      scrapedAt: new Date().toISOString(),
      source: 'furorjeans.com',
      totalProducts: products.length,
      importedProducts: importedCount,
      skippedProducts: skippedCount,
      errorProducts: errorCount,
      products: scrapedProducts
    };
    
    // Ensure scraped directory exists
    const scrapedDir = path.join(process.cwd(), 'scraped');
    try {
      await fs.access(scrapedDir);
    } catch {
      await fs.mkdir(scrapedDir, { recursive: true });
    }
    
    // Write JSON file
    const jsonFilePath = path.join(scrapedDir, 'furorjeans-winter-products.json');
    await fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2), 'utf-8');
    console.log(`[Furorjeans Scraper] Saved JSON file: ${jsonFilePath}`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully scraped and imported ${importedCount} winter products from Furorjeans`,
      summary: {
        totalProducts: products.length,
        imported: importedCount,
        skipped: skippedCount,
        errors: errorCount,
        jsonFile: jsonFilePath
      }
    });
    
  } catch (error: any) {
    console.error('[Furorjeans Scraper] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to scrape Furorjeans products' 
      },
      { status: 500 }
    );
  }
}

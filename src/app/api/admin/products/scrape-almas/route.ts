import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import mongoose from 'mongoose';
import { promises as fs } from 'fs';
import path from 'path';
import { requireAnyPermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';

// Product Schema
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

interface ShopifyProduct {
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
    option1?: string;
    option2?: string;
    option3?: string;
    compare_at_price?: string;
  }>;
  images: Array<{
    id: number;
    src: string;
    alt?: string;
  }>;
  options?: Array<{
    name: string;
    values: string[];
  }>;
}

interface ShopifyProductsResponse {
  products: ShopifyProduct[];
}

// Helper function to map categoryGroup to category
function mapCategory(productType?: string, vendor?: string): string {
  if (!productType && !vendor) return 'Accessories';
  
  const text = `${productType || ''} ${vendor || ''}`.toLowerCase();
  
  if (text.includes('men') || text.includes("men's")) return 'Men';
  if (text.includes('women') || text.includes("women's") || text.includes('girls')) return 'Women';
  if (text.includes('office') || text.includes('travel')) return 'Office & Travel';
  if (text.includes('gift')) return 'Gifting';
  if (text.includes('accessor')) return 'Accessories';
  
  // Default based on common patterns
  return 'Accessories';
}

// Helper function to extract tags
function extractTags(description: string, title: string, productType?: string, tags?: string[]): string[] {
  const extractedTags: string[] = [];
  const text = `${description} ${title} ${productType || ''}`.toLowerCase();
  
  // Common tags
  if (text.includes('leather')) extractedTags.push('leather');
  if (text.includes('jacket')) extractedTags.push('jacket');
  if (text.includes('coat')) extractedTags.push('coat');
  if (text.includes('puffer')) extractedTags.push('puffer');
  if (text.includes('bomber')) extractedTags.push('bomber');
  if (text.includes('varsity')) extractedTags.push('varsity');
  if (text.includes('hooded')) extractedTags.push('hooded');
  if (text.includes('dress')) extractedTags.push('dress');
  if (text.includes('trouser') || text.includes('pant')) extractedTags.push('trouser');
  if (text.includes('shirt')) extractedTags.push('shirt');
  if (text.includes('sweater')) extractedTags.push('sweater');
  if (text.includes('shacket')) extractedTags.push('shacket');
  if (text.includes('cardigan')) extractedTags.push('cardigan');
  if (text.includes('shawl')) extractedTags.push('shawl');
  if (text.includes('hoodie')) extractedTags.push('hoodie');
  if (text.includes('blazer')) extractedTags.push('blazer');
  if (text.includes('suit')) extractedTags.push('suit');
  if (text.includes('denim')) extractedTags.push('denim');
  if (text.includes('sweatshirt')) extractedTags.push('sweatshirt');
  
  // Add tags from Shopify tags array
  if (tags && Array.isArray(tags)) {
    extractedTags.push(...tags.filter(tag => tag && typeof tag === 'string'));
  }
  
  return [...new Set(extractedTags)]; // Remove duplicates
}

// Helper function to convert price (Shopify prices are in string format, e.g., "4799.70")
function convertPrice(price: string | number): number {
  if (typeof price === 'number') {
    return Math.round(price);
  }
  if (typeof price === 'string') {
    const num = parseFloat(price);
    return isNaN(num) ? 0 : Math.round(num);
  }
  return 0;
}

// Helper function to map variants
function mapVariants(variants: ShopifyProduct['variants']): any[] {
  if (!variants || !Array.isArray(variants)) return [];
  
  return variants.map(variant => ({
    title: variant.title || 'Default',
    sku: variant.sku || null,
    price: convertPrice(variant.price),
    originalPrice: variant.compare_at_price ? convertPrice(variant.compare_at_price) : undefined,
    available: variant.available !== false,
    inventory: null
  }));
}

// Helper function to map specifications
function mapSpecifications(product: ShopifyProduct): Map<string, string> {
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
  
  // Add options as specifications
  if (product.options && Array.isArray(product.options)) {
    product.options.forEach(option => {
      if (option.values && option.values.length > 0) {
        specifications.set(option.name, option.values.join(', '));
      }
    });
  }
  
  return specifications;
}

// Helper function to check if product is winter-related
function isWinterProduct(product: ShopifyProduct): boolean {
  const title = (product.title || '').toLowerCase();
  const productType = (product.product_type || '').toLowerCase();
  const bodyHtml = (product.body_html || '').toLowerCase();
  const tags = (product.tags || []).map(tag => tag.toLowerCase()).join(' ');
  
  const combinedText = `${title} ${productType} ${bodyHtml} ${tags}`;
  
  // Winter-related keywords
  const winterKeywords = [
    'winter',
    'win',
    '25-win',
    'winter-24',
    'winter-25',
    'warm',
    'wool',
    'fleece',
    'quilted',
    'puffer',
    'insulated',
    'thermal',
    'coat',
    'jacket',
    'hoodie',
    'sweater',
    'cardigan',
    'shawl',
    'scarf',
    'glove',
    'beanie',
    'hat',
    'boot',
    'snow',
    'blazer',
    'outerwear',
    'men winter',
    'women winter',
    'winter drop',
    'woolblend',
    'shearlux',
    'fur-lined',
    'fur',
    'lounge set',
    'fleece feel'
  ];
  
  // Check if any winter keyword is present
  return winterKeywords.some(keyword => combinedText.includes(keyword));
}

// Convert Shopify product to our Product format
function convertShopifyToProduct(shopifyProduct: ShopifyProduct): any {
  const firstVariant = shopifyProduct.variants?.[0];
  const price = firstVariant ? convertPrice(firstVariant.price) : 0;
  const originalPrice = firstVariant?.compare_at_price ? convertPrice(firstVariant.compare_at_price) : undefined;
  
  // Get all images
  const images = shopifyProduct.images?.map(img => {
    if (img.src.startsWith('//')) {
      return `https:${img.src}`;
    }
    if (img.src.startsWith('/')) {
      return `https://www.almas.pk${img.src}`;
    }
    return img.src;
  }) || [];
  
  const primaryImage = images.length > 0 ? images[0] : '';
  
  // Build description from body_html
  let description = '';
  if (shopifyProduct.body_html) {
    // Remove HTML tags and decode entities
    description = shopifyProduct.body_html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }
  
  if (!description) {
    description = shopifyProduct.title;
  }
  
  const category = mapCategory(shopifyProduct.product_type, shopifyProduct.vendor);
  const tags = extractTags(description, shopifyProduct.title, shopifyProduct.product_type, shopifyProduct.tags);
  const variants = mapVariants(shopifyProduct.variants);
  const specifications = mapSpecifications(shopifyProduct);
  
  const sourceUrl = `https://www.almas.pk/products/${shopifyProduct.handle}`;
  
  return {
    name: shopifyProduct.title,
    description: description.substring(0, 5000),
    descriptionHtml: shopifyProduct.body_html || '',
    price: price,
    originalPrice: originalPrice,
    image: primaryImage,
    images: images,
    category: category,
    brand: 'almas', // Set brand to "almas" as requested
    sourceUrl: sourceUrl,
    productType: shopifyProduct.product_type || '',
    tags: tags,
    specifications: specifications,
    variants: variants.length > 0 ? variants : undefined,
    status: 'draft',
    isActive: true,
    inStock: true,
    rating: 0,
    reviewCount: 0,
    stockCount: 0
  };
}

// Function to fetch products from a specific page
async function fetchAlmasProducts(page = 1, limit = 250): Promise<{ products: ShopifyProduct[]; hasNext: boolean }> {
  try {
    const url = `https://www.almas.pk/products.json?page=${page}&limit=${limit}`;
    console.log(`[Almas Scraper] Fetching page ${page} from ${url}`);

    const response = await axios.get<ShopifyProductsResponse>(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const products = response.data.products || [];
    // Shopify typically returns 250 products per page, if we get less, we're on the last page
    const hasNext = products.length === limit;

    return { products, hasNext };
  } catch (error: any) {
    console.error(`[Almas Scraper] Error fetching page ${page}:`, error.message);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and permissions
    await requireAnyPermission([PERMISSIONS.PRODUCT_VIEW, PERMISSIONS.PRODUCT_MANAGE])(request);
    
    console.log('[Almas Scraper] Starting to scrape products with pagination...');
    
    // Connect to MongoDB stage3
    const conn = await getStage3Connection();
    const Product = conn.model('Product', ProductSchema);
    
    // Scrape all pages with pagination
    let page = 1;
    let hasNext = true;
    const limit = 250;
    let totalFetched = 0;
    let totalFiltered = 0;
    
    // Convert and save products
    let importedCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;
    let filteredOutCount = 0;
    const allScrapedProducts: any[] = [];
    const winterProducts: any[] = [];
    
    while (hasNext) {
      try {
        const { products, hasNext: hasMore } = await fetchAlmasProducts(page, limit);
        totalFetched += products.length;
        
        console.log(`[Almas Scraper] Page ${page}: Fetched ${products.length} products (Total fetched: ${totalFetched})`);
        
        // Process each product
        for (let i = 0; i < products.length; i++) {
          const shopifyProduct = products[i];
          
          try {
            const productData = convertShopifyToProduct(shopifyProduct);
            
            // Store for all products JSON file
            allScrapedProducts.push({
              ...productData,
              shopifyId: shopifyProduct.id,
              handle: shopifyProduct.handle,
              raw: {
                shopifyId: shopifyProduct.id,
                handle: shopifyProduct.handle,
                variants: shopifyProduct.variants,
                options: shopifyProduct.options,
              }
            });
            
            // Check if product is winter-related
            const isWinter = isWinterProduct(shopifyProduct);
            
            if (isWinter) {
              totalFiltered++;
              
              // Store for winter products JSON file
              winterProducts.push({
                ...productData,
                shopifyId: shopifyProduct.id,
                handle: shopifyProduct.handle,
                raw: {
                  shopifyId: shopifyProduct.id,
                  handle: shopifyProduct.handle,
                  variants: shopifyProduct.variants,
                  options: shopifyProduct.options,
                }
              });
              
              // Check if product exists by sourceUrl
              const existingProduct = await Product.findOne({ sourceUrl: productData.sourceUrl });
              
              if (existingProduct) {
                // Update existing product
                Object.assign(existingProduct, productData);
                await existingProduct.save();
                updatedCount++;
                console.log(`[Page ${page}, ${i + 1}/${products.length}] Updated (winter): "${productData.name}"`);
              } else {
                // Create new product
                const newProduct = new Product(productData);
                await newProduct.save();
                importedCount++;
                console.log(`[Page ${page}, ${i + 1}/${products.length}] Imported (winter): "${productData.name}"`);
              }
            } else {
              filteredOutCount++;
            }
          } catch (error: any) {
            console.error(`[Page ${page}, ${i + 1}/${products.length}] Error processing "${shopifyProduct.title}":`, error.message);
            skippedCount++;
          }
        }
        
        hasNext = hasMore;
        page++;
        
        // Small delay to avoid rate limiting
        if (hasNext) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error: any) {
        console.error(`[Almas Scraper] Error on page ${page}:`, error.message);
        // Continue to next page even if one fails
        hasNext = false;
      }
    }
    
    console.log(`[Almas Scraper] Completed. Total fetched: ${totalFetched}, Winter products: ${totalFiltered}, Filtered out: ${filteredOutCount}`);
    
    // Save all products to JSON file
    const allProductsJsonData = {
      scrapedAt: new Date().toISOString(),
      source: 'https://www.almas.pk/products.json',
      brand: 'almas',
      totalProducts: allScrapedProducts.length,
      pagesScraped: page - 1,
      products: allScrapedProducts
    };
    
    // Save winter products to separate JSON file
    const winterProductsJsonData = {
      scrapedAt: new Date().toISOString(),
      source: 'https://www.almas.pk/products.json',
      brand: 'almas',
      filter: 'winter-related',
      totalFetched: totalFetched,
      totalFiltered: totalFiltered,
      filteredOut: filteredOutCount,
      totalProducts: winterProducts.length,
      pagesScraped: page - 1,
      products: winterProducts
    };
    
    const scrapedDir = path.join(process.cwd(), 'scraped');
    
    // Ensure scraped directory exists
    try {
      await fs.access(scrapedDir);
    } catch {
      await fs.mkdir(scrapedDir, { recursive: true });
    }
    
    // Save all products JSON file
    const allProductsFilePath = path.join(scrapedDir, 'almas-all-products.json');
    await fs.writeFile(allProductsFilePath, JSON.stringify(allProductsJsonData, null, 2), 'utf-8');
    console.log(`[Almas Scraper] Saved ${allScrapedProducts.length} products to ${allProductsFilePath}`);
    
    // Save winter products JSON file
    const winterProductsFilePath = path.join(scrapedDir, 'almas-winter-products.json');
    await fs.writeFile(winterProductsFilePath, JSON.stringify(winterProductsJsonData, null, 2), 'utf-8');
    console.log(`[Almas Scraper] Saved ${winterProducts.length} winter products to ${winterProductsFilePath}`);
    
    return NextResponse.json({
      success: true,
      message: 'Products scraped and imported successfully',
      summary: {
        totalFetched: totalFetched,
        totalFiltered: totalFiltered,
        filteredOut: filteredOutCount,
        imported: importedCount,
        updated: updatedCount,
        skipped: skippedCount,
        pagesScraped: page - 1,
        allProductsFile: allProductsFilePath,
        winterProductsFile: winterProductsFilePath
      }
    });
    
  } catch (error: any) {
    console.error('[Almas Scraper] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to scrape products' },
      { status: 500 }
    );
  }
}

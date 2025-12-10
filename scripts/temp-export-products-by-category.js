const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Define the Product schema (matching the model)
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
    enum: ['Men', 'Women', 'Children', 'Office & Travel', 'Accessories', 'Gifting', 'Wool', 'Footwear'],
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
  expectedReleaseDate: {
    type: Date,
    required: false,
    index: true,
  },
  tags: [{
    type: String,
    trim: true
  }],
  specifications: {
    type: Map,
    of: String
  },
  faqs: [{
    type: String,
    trim: true
  }],
  generatedFAQs: [{
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    source: { type: String, enum: ['gemini', 'serpapi'], required: true },
    generatedAt: { type: Date, default: Date.now },
    model: { type: String }
  }],
  relatedSearches: [{
    type: String,
    trim: true
  }],
  peopleAlsoSearchFor: [{
    text: { type: String, required: true },
    link: { type: String },
    highlightedWords: [{ type: String }]
  }],
  isActive: {
    type: Boolean,
    default: true
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
  etsyExported: {
    type: Boolean,
    default: false,
    index: true,
  },
  etsyExportedAt: {
    type: Date,
    default: null,
  },
  policyReview: {
    lastRunAt: { type: Date, default: null },
    score: { type: Number },
    complianceRate: { type: Number },
    summary: {
      totalViolations: { type: Number },
      criticalIssues: { type: Number },
      warnings: { type: Number },
      recommendations: { type: Number },
      isCompliant: { type: Boolean },
    },
    aiReview: {
      type: mongoose.Schema.Types.Mixed,
    },
  }
}, {
  timestamps: true
});

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

// Helper function to normalize text for comparison
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Helper function to normalize URL
function normalizeUrl(url) {
  if (!url) return '';
  return url.toLowerCase().trim().replace(/\/$/, '');
}

// Shopify-based brands that use productType field (from Shopify product_type)
const SHOPIFY_BRANDS = [
  '999pk',
  'EverStyleCrafts',
  'Eviternity',
  'breakout',
  'engine',
  'furorjeans',
  'hustlenholla',
  'unze',
  'almas',
  'TruCarry',
  'beoneshopone'
];

// Brands to skip (different data patterns)
const SKIP_BRANDS = [
  'The Jacket Maker',
  'TheJacketMaker',
  'Jacket Maker Products'
];

// Helper function to detect category from product (checks name, tags, and productType)
function detectCategoryFromProduct(product) {
  const brand = (product.brand || '').trim();
  
  // Skip brands with different patterns
  if (SKIP_BRANDS.some(skipBrand => brand.toLowerCase().includes(skipBrand.toLowerCase()))) {
    return null; // Don't auto-fix these brands
  }
  
  // Combine all text sources for analysis
  const name = (product.name || '').toLowerCase();
  const tags = (product.tags || []).join(' ').toLowerCase();
  const productType = (product.productType || '').toLowerCase();
  const description = (product.description || '').toLowerCase();
  
  // Combine all sources (productType + tags + name + description)
  // This matches how 999pk scraper does it
  const combinedText = `${productType} ${tags} ${name} ${description}`;
  
  // Check for category indicators (priority order matters)
  
  // 1. Check for Men's indicators
  if (
    /\bmen'?s\b/i.test(combinedText) ||
    /\bmen\b/i.test(combinedText) ||
    /\bfor him\b/i.test(combinedText) ||
    /\bgift for him\b/i.test(combinedText) ||
    /\bhusband\b/i.test(combinedText) ||
    /\bfather'?s day\b/i.test(combinedText) ||
    /\bgroomsmen\b/i.test(combinedText) ||
    /\bmens\b/i.test(combinedText) ||
    /\bmale\b/i.test(combinedText)
  ) {
    return 'Men';
  }
  
  // 2. Check for Women's indicators
  if (
    /\bwomen'?s\b/i.test(combinedText) ||
    /\bwomen\b/i.test(combinedText) ||
    /\bfor her\b/i.test(combinedText) ||
    /\bgift for her\b/i.test(combinedText) ||
    /\bwife\b/i.test(combinedText) ||
    /\bmother'?s day\b/i.test(combinedText) ||
    /\bwomens\b/i.test(combinedText) ||
    /\bladies\b/i.test(combinedText) ||
    /\bfemale\b/i.test(combinedText)
  ) {
    return 'Women';
  }
  
  // 3. Check for other categories
  if (/\bchildren'?s\b/i.test(combinedText) || /\bkid'?s\b/i.test(combinedText) || /\bkids\b/i.test(combinedText) || /\bchild\b/i.test(combinedText)) {
    return 'Children';
  }
  
  if (/\bfootwear\b/i.test(combinedText) || /\bshoes?\b/i.test(combinedText) || /\bboots?\b/i.test(combinedText)) {
    return 'Footwear';
  }
  
  if (/\bwool\b/i.test(combinedText) || /\bwoolen\b/i.test(combinedText)) {
    return 'Wool';
  }
  
  if (/\boffice\b/i.test(combinedText) || /\btravel\b/i.test(combinedText) || /\bbriefcase\b/i.test(combinedText) || /\blaptop bag\b/i.test(combinedText)) {
    return 'Office & Travel';
  }
  
  if (/\bgifting\b/i.test(combinedText) || /\bgift\b/i.test(combinedText) || /\bpresent\b/i.test(combinedText)) {
    return 'Gifting';
  }
  
  // No clear category detected
  return null;
}

async function exportProductsByCategory() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI is not set in environment variables');
      process.exit(1);
    }

    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Fetch all products
    console.log('📦 Fetching all products from database...');
    const allProducts = await Product.find({}).lean();
    console.log(`✅ Found ${allProducts.length} products\n`);

    // Step 1: Identify duplicates
    console.log('🔍 Identifying duplicates...');
    const bySourceUrl = new Map();
    const byName = new Map();

    allProducts.forEach(product => {
      const url = normalizeUrl(product.sourceUrl);
      if (url) {
        if (!bySourceUrl.has(url)) {
          bySourceUrl.set(url, []);
        }
        bySourceUrl.get(url).push(product);
      }

      const normalizedName = normalizeText(product.name);
      if (normalizedName.length >= 10) {
        const key = `${normalizedName}|${product.brand || ''}`;
        if (!byName.has(key)) {
          byName.set(key, []);
        }
        byName.get(key).push(product);
      }
    });

    const duplicateIds = new Set();
    const keepers = new Set();
    let duplicateGroups = 0;

    // Process sourceUrl duplicates
    for (const [url, products] of bySourceUrl.entries()) {
      if (products.length > 1) {
        // Sort by: published > draft, etsyExported > not, newest first
        const sorted = products.slice().sort((a, b) => {
          const scoreA = (a.status === 'published' ? 5 : 0) + (a.etsyExported ? 3 : 0) + (a.inStock ? 1 : 0);
          const scoreB = (b.status === 'published' ? 5 : 0) + (b.etsyExported ? 3 : 0) + (b.inStock ? 1 : 0);
          if (scoreB !== scoreA) return scoreB - scoreA;
          const updatedA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const updatedB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return updatedB - updatedA;
        });

        const keep = sorted[0];
        const remove = sorted.slice(1);
        
        keepers.add(keep._id.toString());
        remove.forEach(p => duplicateIds.add(p._id.toString()));
        duplicateGroups++;
      } else if (products.length === 1) {
        keepers.add(products[0]._id.toString());
      }
    }

    // Process name duplicates (only if not already marked as duplicate)
    for (const [key, products] of byName.entries()) {
      if (products.length > 1) {
        const notDuplicate = products.filter(p => !duplicateIds.has(p._id.toString()));
        if (notDuplicate.length > 1) {
          const sorted = notDuplicate.slice().sort((a, b) => {
            const scoreA = (a.status === 'published' ? 5 : 0) + (a.etsyExported ? 3 : 0) + (a.inStock ? 1 : 0);
            const scoreB = (b.status === 'published' ? 5 : 0) + (b.etsyExported ? 3 : 0) + (b.inStock ? 1 : 0);
            if (scoreB !== scoreA) return scoreB - scoreA;
            const updatedA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const updatedB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return updatedB - updatedA;
          });

          const keep = sorted[0];
          const remove = sorted.slice(1);
          
          if (!keepers.has(keep._id.toString())) {
            keepers.add(keep._id.toString());
          }
          remove.forEach(p => {
            if (!duplicateIds.has(p._id.toString())) {
              duplicateIds.add(p._id.toString());
            }
          });
          duplicateGroups++;
        }
      }
    }

    console.log(`   Found ${duplicateGroups} duplicate groups`);
    console.log(`   Marked ${duplicateIds.size} products as duplicates\n`);

    // Step 2: Filter duplicates and fix categories
    console.log('🔧 Fixing categories and removing duplicates...');
    const fixedProducts = [];
    let categoryFixes = 0;

    allProducts.forEach(product => {
      // Skip duplicates
      if (duplicateIds.has(product._id.toString())) {
        return;
      }

      // Fix category if needed
      const detectedCategory = detectCategoryFromProduct(product);
      let finalCategory = product.category || 'Accessories';

      // If we detected a category and it's different from current, fix it
      if (detectedCategory && detectedCategory !== finalCategory) {
        finalCategory = detectedCategory;
        categoryFixes++;
      }

      fixedProducts.push({
        _id: product._id.toString(),
        name: product.name,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        images: product.images || [],
        imageAltTexts: product.imageAltTexts || [],
        category: finalCategory,
        brand: product.brand,
        rating: product.rating,
        reviewCount: product.reviewCount,
        inStock: product.inStock,
        stockCount: product.stockCount,
        tags: product.tags || [],
        specifications: product.specifications 
          ? (product.specifications instanceof Map 
              ? Object.fromEntries(product.specifications) 
              : product.specifications)
          : {},
        productType: product.productType,
        status: product.status,
        isActive: product.isActive,
        sourceUrl: product.sourceUrl,
        variants: product.variants || [],
        etsyExported: product.etsyExported || false,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      });
    });

    console.log(`   Removed ${duplicateIds.size} duplicate products`);
    console.log(`   Fixed ${categoryFixes} category mismatches\n`);

    // Step 3: Group products by category
    console.log('📊 Categorizing products...');
    const categorizedProducts = {};
    const categoryStats = {};

    fixedProducts.forEach(product => {
      const category = product.category || 'Uncategorized';
      
      // Initialize category if it doesn't exist
      if (!categorizedProducts[category]) {
        categorizedProducts[category] = [];
        categoryStats[category] = 0;
      }

      // Add product to category
      categorizedProducts[category].push(product);
      categoryStats[category]++;
    });

    // Create summary
    const summary = {
      totalProducts: fixedProducts.length,
      originalTotalProducts: allProducts.length,
      duplicatesRemoved: duplicateIds.size,
      categoryFixes: categoryFixes,
      totalCategories: Object.keys(categorizedProducts).length,
      categoryCounts: categoryStats,
      exportDate: new Date().toISOString()
    };

    // Prepare final output
    const output = {
      summary,
      productsByCategory: categorizedProducts
    };

    // Save to JSON file
    const outputPath = path.join(__dirname, '..', 'products-by-category.json');
    console.log(`💾 Saving results to: ${outputPath}`);
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log('✅ File saved successfully!\n');

    // Display summary
    console.log('='.repeat(60));
    console.log('📋 EXPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Original Products: ${summary.originalTotalProducts}`);
    console.log(`After Deduplication: ${summary.totalProducts}`);
    console.log(`Duplicates Removed: ${summary.duplicatesRemoved}`);
    console.log(`Category Fixes: ${summary.categoryFixes}`);
    console.log(`Total Categories: ${summary.totalCategories}`);
    console.log('\n📊 Products by Category:');
    Object.entries(categoryStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`   ${category}: ${count} products`);
      });
    console.log('='.repeat(60));

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    console.log(`\n📄 Results saved to: ${outputPath}`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

exportProductsByCategory();


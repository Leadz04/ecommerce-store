const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

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

// SourcedProduct Schema (for sourcing page)
const SourcedProductSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  sourceUrl: { type: String, required: true, index: true },
  categoryGroup: { type: String, required: true, index: true },
  brand: { type: String, index: true },
  price: { type: Number },
  description: { type: String },
  images: [{ type: String }],
  specs: { type: Map, of: String },
}, { timestamps: true });

// Helper function to map categoryGroup to category
function mapCategory(categoryGroup) {
  if (!categoryGroup) return 'Accessories';
  
  const lower = categoryGroup.toLowerCase();
  if (lower.includes('men') || lower.includes("men's")) return 'Men';
  if (lower.includes('women') || lower.includes("women's")) return 'Women';
  if (lower.includes('office') || lower.includes('travel')) return 'Office & Travel';
  if (lower.includes('gift')) return 'Gifting';
  if (lower.includes('accessor')) return 'Accessories';
  
  // Default based on common patterns
  return 'Accessories';
}

// Helper function to extract tags from description
function extractTags(description, title, categoryGroup) {
  const tags = [];
  if (!description) return tags;
  
  const text = (description + ' ' + title + ' ' + (categoryGroup || '')).toLowerCase();
  
  // Common tags
  if (text.includes('leather')) tags.push('leather');
  if (text.includes('jacket')) tags.push('jacket');
  if (text.includes('coat')) tags.push('coat');
  if (text.includes('puffer')) tags.push('puffer');
  if (text.includes('bomber')) tags.push('bomber');
  if (text.includes('windbreaker')) tags.push('windbreaker');
  if (text.includes('quilted')) tags.push('quilted');
  if (text.includes('hooded')) tags.push('hooded');
  if (text.includes('custom')) tags.push('custom');
  
  return [...new Set(tags)]; // Remove duplicates
}

// Helper function to convert price (JSON has price in dollars, convert to cents or keep as is)
function convertPrice(price) {
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

// Helper function to map variants from raw data
function mapVariants(raw) {
  if (!raw || !raw.variants) return [];
  
  return raw.variants.map(variant => ({
    title: variant.title || 'Default',
    sku: variant.sku || null,
    price: convertPrice(variant.price),
    originalPrice: variant.compare_at_price ? convertPrice(variant.compare_at_price) : undefined,
    available: variant.available !== false,
    inventory: variant.inventory_quantity || null
  }));
}

// Helper function to map specifications
function mapSpecifications(specs, raw) {
  const specifications = new Map();
  
  if (specs && typeof specs === 'object') {
    Object.entries(specs).forEach(([key, value]) => {
      if (value) specifications.set(key, String(value));
    });
  }
  
  // Add from raw data if available
  if (raw) {
    if (raw.vendor) specifications.set('Vendor', raw.vendor);
    if (raw.product_type) specifications.set('Type', raw.product_type);
    if (raw.tags) specifications.set('Tags', raw.tags);
  }
  
  return specifications;
}

async function importProducts() {
  try {
    const MONGODB_URI_STAGE3 = process.env.MONGODB_URI_STAGE3;
    if (!MONGODB_URI_STAGE3) {
      console.error('❌ MONGODB_URI_STAGE3 is not set in environment variables');
      process.exit(1);
    }

    // Connect to STAGE3 database for Products
    console.log('🔄 Connecting to MONGODB_URI_STAGE3 for Products...');
    const productConn = await mongoose.createConnection(MONGODB_URI_STAGE3);
    const Product = productConn.model('Product', ProductSchema);
    console.log('✅ Connected to STAGE3 database for Products\n');

    // Connect to scraped database for SourcedProducts (use MONGODB_SCRAPED_URI or MONGODB_URI_STAGE3)
    const MONGODB_SCRAPED_URI = process.env.MONGODB_SCRAPED_URI || MONGODB_URI_STAGE3;
    console.log('🔄 Connecting to database for SourcedProducts...');
    const sourcedConn = await mongoose.createConnection(MONGODB_SCRAPED_URI);
    const SourcedProduct = sourcedConn.model('SourcedProduct', SourcedProductSchema);
    console.log('✅ Connected to database for SourcedProducts\n');

    // Read the JSON file
    const jsonFilePath = path.join(__dirname, '..', 'scraped', 'shopify-products.json');
    console.log(`📂 Reading JSON file: ${jsonFilePath}`);
    
    if (!fs.existsSync(jsonFilePath)) {
      console.error(`❌ File not found: ${jsonFilePath}`);
      process.exit(1);
    }

    const fileContent = fs.readFileSync(jsonFilePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);
    const productsInFile = jsonData.products || [];
    
    console.log(`📊 Products in JSON file: ${productsInFile.length}`);
    console.log(`📅 Scraped at: ${jsonData.scrapedAt || 'Unknown'}`);
    console.log(`🌐 Source: ${jsonData.source || 'Unknown'}\n`);

    let importedCount = 0;
    let skippedCount = 0;
    let sourcedCount = 0;
    let sourcedSkippedCount = 0;

    console.log('🚀 Starting import process...\n');

    for (let i = 0; i < productsInFile.length; i++) {
      const jsonProduct = productsInFile[i];
      
      try {
        // Skip if missing required fields
        if (!jsonProduct.title || !jsonProduct.sourceUrl) {
          console.log(`⏭️  [${i + 1}/${productsInFile.length}] Skipping: Missing title or sourceUrl`);
          skippedCount++;
          continue;
        }

        const title = jsonProduct.title.trim();
        const sourceUrl = jsonProduct.sourceUrl.trim();
        const description = jsonProduct.description || '';
        const price = convertPrice(jsonProduct.price);
        const images = Array.isArray(jsonProduct.images) ? jsonProduct.images : [];
        const brand = jsonProduct.brand || 'The Jacket Maker';
        const categoryGroup = jsonProduct.categoryGroup || '';
        const category = mapCategory(categoryGroup);
        const tags = extractTags(description, title, categoryGroup);
        const variants = mapVariants(jsonProduct.raw);
        const specifications = mapSpecifications(jsonProduct.specs, jsonProduct.raw);
        
        // Get primary image
        const primaryImage = images.length > 0 ? images[0] : '';

        if (!primaryImage) {
          console.log(`⏭️  [${i + 1}/${productsInFile.length}] Skipping: No image - "${title}"`);
          skippedCount++;
          continue;
        }

        // Import into Product model
        const productData = {
          name: title,
          description: description.substring(0, 5000), // Ensure within limit
          price: price,
          image: primaryImage,
          images: images,
          category: category,
          brand: brand,
          sourceUrl: sourceUrl,
          productType: categoryGroup,
          tags: tags,
          specifications: specifications,
          variants: variants.length > 0 ? variants : undefined,
          status: 'draft', // Start as draft
          isActive: true,
          inStock: true,
          rating: 0,
          reviewCount: 0
        };

        // Check if product exists by sourceUrl - skip if it already exists
        const existingProduct = await Product.findOne({ sourceUrl: sourceUrl });
        
        if (existingProduct) {
          // Skip existing products - don't update
          skippedCount++;
          console.log(`⏭️  [${i + 1}/${productsInFile.length}] Skipped (already exists): "${title}"`);
          continue; // Skip to next product
        }
        
        // Create new product only if it doesn't exist
        const newProduct = new Product(productData);
        await newProduct.save();
        importedCount++;
        console.log(`✅ [${i + 1}/${productsInFile.length}] Imported: "${title}"`);

        // Also import into SourcedProduct for sourcing page (only if new)
        const sourcedData = {
          title: title,
          sourceUrl: sourceUrl,
          categoryGroup: categoryGroup || category,
          brand: brand,
          price: price,
          description: description.substring(0, 5000),
          images: images,
          specs: jsonProduct.specs || {}
        };

        try {
          // Check if SourcedProduct already exists - skip if it does
          const existingSourced = await SourcedProduct.findOne({ 
            $or: [
              { sourceUrl: sourceUrl },
              { title: { $regex: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
            ]
          });
          
          if (existingSourced) {
            // Skip - already exists
            sourcedSkippedCount++;
          } else {
            try {
              const newSourced = new SourcedProduct(sourcedData);
              await newSourced.save();
              sourcedCount++;
            } catch (uniqueError) {
              // If unique constraint fails, it means it exists - skip
              console.log(`   ⚠️  SourcedProduct already exists: ${title}`);
            }
          }
        } catch (sourcedError) {
          // Ignore sourced product errors
          console.log(`   ⚠️  SourcedProduct error: ${sourcedError.message}`);
        }

        // Progress indicator
        if ((i + 1) % 50 === 0) {
          console.log(`\n📊 Progress: ${i + 1}/${productsInFile.length} processed\n`);
        }

      } catch (error) {
        console.error(`❌ [${i + 1}/${productsInFile.length}] Error processing "${jsonProduct.title}":`, error.message);
        skippedCount++;
      }
    }

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 IMPORT SUMMARY`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Total in file:     ${productsInFile.length}`);
    console.log(`✅ Imported (new):  ${importedCount}`);
    console.log(`⏭️  Skipped (exists): ${skippedCount}`);
    console.log(`\nSourcedProducts:`);
    console.log(`✅ Created (new):   ${sourcedCount}`);
    console.log(`⏭️  Skipped (exists): ${sourcedSkippedCount}`);
    console.log(`${'='.repeat(60)}\n`);

    // Get brand statistics
    const brands = await Product.distinct('brand', { sourceUrl: { $regex: /thejacketmaker/i } });
    console.log(`🏷️  Brands imported: ${brands.length}`);
    brands.forEach(brand => {
      if (brand) console.log(`   - ${brand}`);
    });

    await productConn.close();
    await sourcedConn.close();
    console.log('\n✅ Disconnected from databases');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

importProducts();


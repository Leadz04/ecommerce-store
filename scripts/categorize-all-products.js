const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config({ path: '.env.local' });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Define the Product schema (same as in your models)
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
  category: {
    type: String,
    enum: ['Men', 'Women', 'Office & Travel', 'Accessories', 'Gifting'],
    default: 'Accessories'
  },
  brand: {
    type: String,
    trim: true,
    default: 'Wolveyes'
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
    min: [0, 'Stock count cannot be negative'],
    default: 0
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
    trim: true,
    unique: true,
    sparse: true
  },
  productType: {
    type: String,
    trim: true
  },
  variants: [{
    name: { type: String, required: true },
    sku: { type: String },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    available: { type: Boolean, default: true },
    inventory: { type: Number, default: 0 }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

// Category mapping based on product_type
const categoryMapping = {
  'mens': 'Men',
  'men': 'Men',
  'ladies': 'Women',
  'women': 'Women',
  'lady': 'Women',
  'office': 'Office & Travel',
  'travel': 'Office & Travel',
  'accessories': 'Accessories',
  'accessory': 'Accessories',
  'gift': 'Gifting',
  'gifting': 'Gifting',
  '': 'Accessories', // Default for empty product_type
  'default': 'Accessories'
};

// Helper function to clean price string and convert to number
function cleanPrice(priceStr) {
  if (!priceStr) return 0;
  // Remove 'Rs.' and commas, then parse
  const cleaned = priceStr.replace(/Rs\.|,/g, '').trim();
  const price = parseFloat(cleaned);
  return isNaN(price) ? 0 : price;
}

// Helper function to parse variants from the variants string
function parseVariants(variantsStr) {
  if (!variantsStr) return [];
  
  try {
    const variants = [];
    const variantStrings = variantsStr.split('||').map(v => v.trim()).filter(v => v);
    
    for (const variantStr of variantStrings) {
      const parts = variantStr.split('|').map(p => p.trim());
      const variant = {
        name: parts[0] || 'Default',
        sku: parts[1] ? parts[1].replace('SKU:', '').trim() : undefined,
        price: cleanPrice(parts[2]),
        originalPrice: cleanPrice(parts[3]),
        available: parts[4] ? parts[4].replace('Available:', '').trim() === 'True' : true,
        inventory: parts[5] ? parseInt(parts[5].replace('Inventory:', '').trim()) || 0 : 0
      };
      
      if (variant.name && variant.name !== 'Default') {
        variants.push(variant);
      }
    }
    
    return variants;
  } catch (error) {
    console.error('Error parsing variants:', error);
    return [];
  }
}

// Helper function to parse images from the images string
function parseImages(imagesStr) {
  if (!imagesStr) return [];
  
  try {
    return imagesStr.split('|').map(img => img.trim()).filter(img => img);
  } catch (error) {
    console.error('Error parsing images:', error);
    return [];
  }
}

// Helper function to parse tags from the tags string
function parseTags(tagsStr) {
  if (!tagsStr) return [];
  
  try {
    return tagsStr.split('|').map(tag => tag.trim()).filter(tag => tag);
  } catch (error) {
    console.error('Error parsing tags:', error);
    return [];
  }
}

// Helper function to determine category from product_type
function determineCategory(productType) {
  if (!productType) return 'Accessories';
  
  const normalizedType = productType.toLowerCase().trim();
  
  // Check for exact matches first
  if (categoryMapping[normalizedType]) {
    return categoryMapping[normalizedType];
  }
  
  // Check for partial matches
  for (const [key, category] of Object.entries(categoryMapping)) {
    if (normalizedType.includes(key) || key.includes(normalizedType)) {
      return category;
    }
  }
  
  // Default fallback
  return 'Accessories';
}

async function categorizeAllProducts() {
  try {
    console.log('🚀 Starting comprehensive product categorization...');
    
    // First, clear all existing products to start fresh
    console.log('🗑️  Clearing existing products...');
    const deleteResult = await Product.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} existing products`);
    
    // Read and process the CSV file
    const products = [];
    const csvFilePath = 'scraped.csv';
    
    if (!fs.existsSync(csvFilePath)) {
      console.error('❌ CSV file not found:', csvFilePath);
      return;
    }
    
    console.log('📖 Reading scraped.csv file...');
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          try {
            // Clean and process the data
            const title = row.title?.trim();
            const priceSale = cleanPrice(row.price_sale);
            const priceRegular = cleanPrice(row.price_regular);
            const url = row.url?.trim();
            const imageUrl = row.image_url?.trim();
            const outOfStock = row.out_of_stock === 'True';
            const description = row.description ? row.description.substring(0, 5000) : '';
            const productType = row.product_type?.trim() || '';
            const tags = parseTags(row.tags);
            const variants = parseVariants(row.variants);
            const images = parseImages(row.images);
            
            if (!title || !url) {
              console.warn('⚠️  Skipping row with missing title or URL:', row);
              return;
            }
            
            // Determine category based on product_type
            const category = determineCategory(productType);
            
            // Use the first image as the main image, or image_url if available
            const mainImage = imageUrl || images[0] || '';
            
            const product = {
              name: title,
              description: description || title || '',
              price: priceSale || 0,
              originalPrice: priceRegular > priceSale ? priceRegular : undefined,
              image: mainImage,
              images: images,
              category: category,
              brand: 'Wolveyes',
              rating: 0,
              reviewCount: 0,
              inStock: !outOfStock,
              stockCount: 0,
              tags: tags,
              specifications: {},
              sourceUrl: url,
              productType: productType,
              variants: variants,
              isActive: true
            };
            
            products.push(product);
          } catch (error) {
            console.error('❌ Error processing row:', error, row);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`📊 Parsed ${products.length} products from CSV`);
    
    if (products.length === 0) {
      console.log('❌ No products to import');
      return;
    }
    
    // Show category distribution before import
    const categoryDistribution = {};
    products.forEach(product => {
      categoryDistribution[product.category] = (categoryDistribution[product.category] || 0) + 1;
    });
    
    console.log('\n📈 Category distribution from CSV:');
    Object.entries(categoryDistribution).forEach(([category, count]) => {
      console.log(`• ${category}: ${count} products`);
    });
    
    // Insert products into database
    console.log('\n📦 Importing products to database...');
    let successCount = 0;
    let errorCount = 0;
    
    for (const product of products) {
      try {
        // Use upsert with sourceUrl to avoid duplicates
        const result = await Product.findOneAndUpdate(
          { sourceUrl: product.sourceUrl },
          product,
          { upsert: true, new: true, runValidators: true }
        );
        
        if (result) {
          successCount++;
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error importing ${product.name}:`, error.message);
      }
    }
    
    // Final verification
    const finalCategoryCounts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const totalProducts = await Product.countDocuments();
    
    console.log('\n🎉 Product categorization completed!');
    console.log('=====================================');
    console.log(`✅ Successfully imported: ${successCount} products`);
    console.log(`❌ Errors: ${errorCount} products`);
    console.log(`📊 Total products in database: ${totalProducts}`);
    
    console.log('\n📈 Final Category Breakdown:');
    finalCategoryCounts.forEach(cat => {
      console.log(`• ${cat._id}: ${cat.count} products`);
    });
    
    // Show some sample products from each category
    console.log('\n📋 Sample products by category:');
    for (const categoryCount of finalCategoryCounts) {
      const sampleProducts = await Product.find({ category: categoryCount._id }).limit(3);
      console.log(`\n${categoryCount._id} (${categoryCount.count} products):`);
      sampleProducts.forEach(product => {
        console.log(`  • ${product.name} - ${product.productType || 'N/A'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error during categorization:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the categorization
connectDB().then(() => {
  categorizeAllProducts();
});

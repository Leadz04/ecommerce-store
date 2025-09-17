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

async function importWomenCollection() {
  try {
    console.log('🚀 Starting Women Collection import...');
    
    // First, remove all existing products from Women category
    console.log('🗑️  Removing all existing products from Women category...');
    const deleteResult = await Product.deleteMany({ category: 'Women' });
    console.log(`✅ Removed ${deleteResult.deletedCount} existing products from Women category`);
    
    // Read and process the CSV file
    const products = [];
    const csvFilePath = 'women_collection_products.csv';
    
    if (!fs.existsSync(csvFilePath)) {
      console.error('❌ CSV file not found:', csvFilePath);
      return;
    }
    
    console.log('📖 Reading CSV file...');
    
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
            const productType = row.product_type?.trim() || 'ladies';
            const tags = parseTags(row.tags);
            const variants = parseVariants(row.variants);
            const images = parseImages(row.images);
            
            if (!title || !url) {
              console.warn('⚠️  Skipping row with missing title or URL:', row);
              return;
            }
            
            // Use the first image as the main image, or image_url if available
            const mainImage = imageUrl || images[0] || '';
            
            const product = {
              name: title,
              description: description || title || '',
              price: priceSale || 0,
              originalPrice: priceRegular > priceSale ? priceRegular : undefined,
              image: mainImage,
              images: images,
              category: 'Women', // Force to Women category
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
    
    // Insert products into database
    console.log('💾 Inserting products into database...');
    
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
          console.log(`✅ Imported: ${product.name}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error importing ${product.name}:`, error.message);
      }
    }
    
    // Ensure indexes (with error handling)
    console.log('🔧 Ensuring indexes...');
    try {
      await Product.collection.createIndex({ name: 'text', description: 'text', tags: 'text' });
      console.log('✅ Text search index created');
    } catch (error) {
      console.log('ℹ️  Text search index already exists');
    }
    
    try {
      await Product.collection.createIndex({ category: 1 });
      console.log('✅ Category index created');
    } catch (error) {
      console.log('ℹ️  Category index already exists');
    }
    
    try {
      await Product.collection.createIndex({ brand: 1 });
      console.log('✅ Brand index created');
    } catch (error) {
      console.log('ℹ️  Brand index already exists');
    }
    
    try {
      await Product.collection.createIndex({ price: 1 });
      console.log('✅ Price index created');
    } catch (error) {
      console.log('ℹ️  Price index already exists');
    }
    
    try {
      await Product.collection.createIndex({ rating: -1 });
      console.log('✅ Rating index created');
    } catch (error) {
      console.log('ℹ️  Rating index already exists');
    }
    
    try {
      await Product.collection.createIndex({ sourceUrl: 1 }, { sparse: true });
      console.log('✅ SourceUrl index created');
    } catch (error) {
      console.log('ℹ️  SourceUrl index already exists');
    }
    
    // Final verification
    const womenProducts = await Product.countDocuments({ category: 'Women' });
    const totalProducts = await Product.countDocuments();
    
    console.log('\n🎉 Women Collection import completed!');
    console.log('=====================================');
    console.log(`✅ Successfully imported: ${successCount} products`);
    console.log(`❌ Errors: ${errorCount} products`);
    console.log(`📊 Total Women products in database: ${womenProducts}`);
    console.log(`📊 Total products in database: ${totalProducts}`);
    
    // Show category breakdown
    const categoryBreakdown = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📈 Category Breakdown:');
    categoryBreakdown.forEach(cat => {
      console.log(`• ${cat._id}: ${cat.count} products`);
    });
    
  } catch (error) {
    console.error('❌ Error during import:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the import
connectDB().then(() => {
  importWomenCollection();
});

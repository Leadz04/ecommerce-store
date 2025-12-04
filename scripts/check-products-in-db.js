const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

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
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function checkProductsInDB() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI is not set in environment variables');
      process.exit(1);
    }

    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

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

    // Get total products in database
    const totalInDB = await Product.countDocuments({});
    console.log(`📊 Total products in database: ${totalInDB}`);

    // Get products with sourceUrl (from The Jacket Maker)
    const productsWithSourceUrl = await Product.countDocuments({ 
      sourceUrl: { $exists: true, $ne: null } 
    });
    console.log(`🔗 Products with sourceUrl: ${productsWithSourceUrl}`);

    // Check products from The Jacket Maker specifically
    const jacketMakerProducts = await Product.countDocuments({ 
      sourceUrl: { $regex: /thejacketmaker/i } 
    });
    console.log(`🧥 Products from The Jacket Maker: ${jacketMakerProducts}\n`);

    // Sample check: Check if first 10 products from JSON exist in DB
    console.log('🔍 Checking sample products from JSON file...\n');
    let foundCount = 0;
    let notFoundCount = 0;
    const sampleSize = Math.min(10, productsInFile.length);

    for (let i = 0; i < sampleSize; i++) {
      const jsonProduct = productsInFile[i];
      const sourceUrl = jsonProduct.sourceUrl;
      const title = jsonProduct.title;

      if (sourceUrl) {
        const found = await Product.findOne({ sourceUrl: sourceUrl });
        if (found) {
          foundCount++;
          console.log(`✅ [${i + 1}] Found: "${title}"`);
        } else {
          notFoundCount++;
          console.log(`❌ [${i + 1}] Not found: "${title}"`);
          console.log(`   URL: ${sourceUrl}`);
        }
      } else {
        // Try to find by name if no sourceUrl
        const found = await Product.findOne({ 
          name: { $regex: new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } 
        });
        if (found) {
          foundCount++;
          console.log(`✅ [${i + 1}] Found by name: "${title}"`);
        } else {
          notFoundCount++;
          console.log(`❌ [${i + 1}] Not found: "${title}"`);
        }
      }
    }

    console.log(`\n📈 Sample Check Results:`);
    console.log(`   ✅ Found: ${foundCount}/${sampleSize}`);
    console.log(`   ❌ Not found: ${notFoundCount}/${sampleSize}`);

    // Check by brand
    const brandsInFile = [...new Set(productsInFile.map(p => p.brand).filter(Boolean))];
    console.log(`\n🏷️  Brands in JSON file: ${brandsInFile.length}`);
    brandsInFile.slice(0, 5).forEach(brand => {
      console.log(`   - ${brand}`);
    });

    const brandsInDB = await Product.distinct('brand');
    console.log(`\n🏷️  Brands in database: ${brandsInDB.length}`);
    brandsInDB.slice(0, 5).forEach(brand => {
      console.log(`   - ${brand}`);
    });

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 SUMMARY`);
    console.log(`${'='.repeat(60)}`);
    console.log(`JSON File:     ${productsInFile.length} products`);
    console.log(`Database:      ${totalInDB} total products`);
    console.log(`With sourceUrl: ${productsWithSourceUrl} products`);
    console.log(`Jacket Maker:  ${jacketMakerProducts} products`);
    
    if (jacketMakerProducts >= productsInFile.length * 0.9) {
      console.log(`\n✅ It appears most products from the JSON file are already in the database!`);
    } else if (jacketMakerProducts > 0) {
      console.log(`\n⚠️  Some products are in the database, but not all.`);
      console.log(`   Consider importing the missing ones.`);
    } else {
      console.log(`\n❌ Products from the JSON file don't appear to be in the database.`);
      console.log(`   You may want to import them.`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkProductsInDB();


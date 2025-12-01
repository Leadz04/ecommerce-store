const mongoose = require('mongoose');
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
  isActive: {
    type: Boolean,
    default: true
  },
  productType: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  }
}, {
  timestamps: true
});

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

// Brand name to remove (case-insensitive)
const BRAND_NAME = 'Everstylecrafts';

// Function to remove brand name from a string
function removeBrandName(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }
  
  // Create a regex pattern that matches the brand name case-insensitively
  // This will match "Everstylecrafts" in any case variation
  const regex = new RegExp(BRAND_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  
  // Remove the brand name and clean up extra spaces
  let cleaned = text.replace(regex, '').trim();
  
  // Remove multiple spaces and clean up punctuation
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.replace(/\s*-\s*-/g, '-'); // Remove double dashes
  cleaned = cleaned.replace(/\s*,\s*,/g, ','); // Remove double commas
  cleaned = cleaned.replace(/^\s*[-\s,]+|[-\s,]+\s*$/g, ''); // Remove leading/trailing dashes, spaces, commas
  
  return cleaned.trim();
}

// Main function to remove brand name from products
async function removeBrandFromProducts() {
  try {
    await connectDB();
    
    console.log(`\n🔍 Starting to remove "${BRAND_NAME}" from product names and tags...\n`);
    
    // Find all products
    const products = await Product.find({});
    console.log(`📦 Found ${products.length} products to process\n`);
    
    let updatedCount = 0;
    let nameUpdatedCount = 0;
    let tagsUpdatedCount = 0;
    const updatedProducts = [];
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      let wasUpdated = false;
      const changes = [];
      
      // Check and update name
      const originalName = product.name;
      const cleanedName = removeBrandName(originalName);
      
      if (originalName !== cleanedName && cleanedName.length > 0) {
        product.name = cleanedName;
        wasUpdated = true;
        nameUpdatedCount++;
        changes.push(`Name: "${originalName}" → "${cleanedName}"`);
      }
      
      // Check and update tags
      if (product.tags && Array.isArray(product.tags) && product.tags.length > 0) {
        const originalTags = [...product.tags];
        const cleanedTags = product.tags
          .map(tag => removeBrandName(tag))
          .filter(tag => tag && tag.length > 0); // Remove empty tags
        
        // Check if tags were actually changed
        const tagsChanged = originalTags.length !== cleanedTags.length ||
          originalTags.some((tag, idx) => tag !== cleanedTags[idx]);
        
        if (tagsChanged) {
          product.tags = cleanedTags;
          wasUpdated = true;
          tagsUpdatedCount++;
          changes.push(`Tags: ${originalTags.length} → ${cleanedTags.length} tags`);
        }
      }
      
      // Save if updated
      if (wasUpdated) {
        await product.save();
        updatedCount++;
        updatedProducts.push({
          id: product._id.toString(),
          name: product.name,
          changes: changes
        });
        
        if (updatedCount % 100 === 0) {
          console.log(`✅ Processed ${i + 1}/${products.length} products, updated ${updatedCount} so far...`);
        }
      }
    }
    
    console.log(`\n✨ Process complete!\n`);
    console.log(`📊 Summary:`);
    console.log(`   Total products processed: ${products.length}`);
    console.log(`   Products updated: ${updatedCount}`);
    console.log(`   Names updated: ${nameUpdatedCount}`);
    console.log(`   Tags updated: ${tagsUpdatedCount}`);
    
    if (updatedProducts.length > 0) {
      console.log(`\n📝 Sample of updated products (first 10):`);
      updatedProducts.slice(0, 10).forEach((p, idx) => {
        console.log(`   ${idx + 1}. ${p.name}`);
        p.changes.forEach(change => console.log(`      - ${change}`));
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error removing brand name:', error);
    process.exit(1);
  }
}

// Run the script
removeBrandFromProducts();


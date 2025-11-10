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
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  publishAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function publishAllProducts() {
  try {
    console.log('🚀 Starting bulk product update...');
    
    // Get current counts
    const totalCount = await Product.countDocuments();
    console.log(`📊 Total products in database: ${totalCount}`);
    
    const statusCounts = await Product.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📈 Current status breakdown:');
    statusCounts.forEach(stat => {
      console.log(`• ${stat._id || 'null'}: ${stat.count} products`);
    });
    
    const categoryCounts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📈 Current category breakdown:');
    categoryCounts.forEach(cat => {
      console.log(`• ${cat._id || 'null'}: ${cat.count} products`);
    });
    
    const activeCount = await Product.countDocuments({ isActive: true });
    const inactiveCount = await Product.countDocuments({ isActive: false });
    console.log(`\n📊 Active products: ${activeCount}, Inactive: ${inactiveCount}`);
    
    // Update all products
    console.log('\n🔄 Updating all products...');
    console.log('   - Setting category to "Men"');
    console.log('   - Setting status to "published"');
    console.log('   - Setting isActive to true');
    
    const updateResult = await Product.updateMany(
      {},
      {
        $set: {
          category: 'Men',
          status: 'published',
          isActive: true,
          publishAt: new Date()
        }
      }
    );
    
    console.log(`\n✅ Update completed!`);
    console.log(`   - Matched: ${updateResult.matchedCount} products`);
    console.log(`   - Modified: ${updateResult.modifiedCount} products`);
    
    // Final verification
    const finalStatusCounts = await Product.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n🎉 Final status breakdown:');
    finalStatusCounts.forEach(stat => {
      console.log(`• ${stat._id || 'null'}: ${stat.count} products`);
    });
    
    const finalCategoryCounts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n🎉 Final category breakdown:');
    finalCategoryCounts.forEach(cat => {
      console.log(`• ${cat._id || 'null'}: ${cat.count} products`);
    });
    
    const finalActiveCount = await Product.countDocuments({ isActive: true });
    console.log(`\n✅ Active products: ${finalActiveCount}`);
    
  } catch (error) {
    console.error('❌ Error during update:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the update
connectDB().then(() => {
  publishAllProducts();
});


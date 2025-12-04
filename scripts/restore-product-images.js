const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Product Schema
const ProductSchema = new mongoose.Schema({
  name: String,
  image: String,
  images: [String]
}, { strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

// AuditLog Schema
const AuditLogSchema = new mongoose.Schema({
  action: String,
  resourceType: String,
  resourceId: String,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: Date
}, { strict: false });

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);

async function restoreProductImages() {
  try {
    await connectDB();
    
    console.log('🔍 Checking products for image restoration...\n');
    
    // Find products that might have been affected (have images array with Cloudinary URLs)
    const products = await Product.find({
      $or: [
        { image: { $regex: /res\.cloudinary\.com\/demo/ } },
        { image: { $regex: /images\.unsplash\.com/ } }
      ]
    }).lean();
    
    console.log(`Found ${products.length} products that might need restoration\n`);
    
    let restored = 0;
    let skipped = 0;
    let notFound = 0;
    
    for (const product of products) {
      try {
        // Strategy 1: Check if images array has original Cloudinary images (not demo/unsplash)
        const originalImages = (product.images || []).filter(img => 
          img && 
          typeof img === 'string' &&
          img.includes('cloudinary.com') &&
          !img.includes('res.cloudinary.com/demo') &&
          !img.includes('images.unsplash.com')
        );
        
        if (originalImages.length > 0) {
          // Restore from images array
          const originalImage = originalImages[0];
          await Product.updateOne(
            { _id: product._id },
            { $set: { image: originalImage } }
          );
          console.log(`✅ Restored "${product.name}" from images array`);
          restored++;
          continue;
        }
        
        // Strategy 2: Check AuditLog for previous image
        const auditLogs = await AuditLog.find({
          action: 'product:update',
          resourceType: 'Product',
          resourceId: String(product._id)
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
        
        let restoredFromAudit = false;
        for (const log of auditLogs) {
          if (log.metadata?.before?.image && 
              typeof log.metadata.before.image === 'string' &&
              !log.metadata.before.image.includes('res.cloudinary.com/demo') &&
              !log.metadata.before.image.includes('images.unsplash.com')) {
            
            await Product.updateOne(
              { _id: product._id },
              { $set: { image: log.metadata.before.image } }
            );
            console.log(`✅ Restored "${product.name}" from audit log`);
            restored++;
            restoredFromAudit = true;
            break;
          }
        }
        
        if (restoredFromAudit) {
          continue;
        }
        
        // Strategy 3: Check if images array has any valid URLs (not demo/unsplash)
        const validImages = (product.images || []).filter(img => 
          img && 
          typeof img === 'string' &&
          img.startsWith('http') &&
          !img.includes('res.cloudinary.com/demo') &&
          !img.includes('images.unsplash.com')
        );
        
        if (validImages.length > 0) {
          await Product.updateOne(
            { _id: product._id },
            { $set: { image: validImages[0] } }
          );
          console.log(`✅ Restored "${product.name}" from valid images array`);
          restored++;
          continue;
        }
        
        console.log(`⏭️  Skipping "${product.name}" - no original image found`);
        skipped++;
        
      } catch (error) {
        console.error(`❌ Error processing "${product.name}":`, error.message);
      }
    }
    
    console.log(`\n✨ Completed!`);
    console.log(`   Restored: ${restored} products`);
    console.log(`   Skipped: ${skipped} products (no original found)`);
    console.log(`   Not Found: ${notFound} products`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
restoreProductImages();


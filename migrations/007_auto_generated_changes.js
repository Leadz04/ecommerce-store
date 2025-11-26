const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Global connection cache
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

module.exports = {
  version: '007',
  name: 'auto_generated_changes',
  description: 'Auto-generated migration for schema changes',
  
  async up() {
    console.log('  📝 Applying auto-generated schema changes...');
    
    await connectDB();
    
    // Add field descriptionHtml to Product
    await mongoose.connection.db.collection('products').updateMany(
      { descriptionHtml: { $exists: false } },
      { $set: { descriptionHtml: "" } }
    );

    // Add field expectedReleaseDate to Product
    await mongoose.connection.db.collection('products').updateMany(
      { expectedReleaseDate: { $exists: false } },
      { $set: { expectedReleaseDate: new Date() } }
    );

    // Add field etsyExported to Product
    await mongoose.connection.db.collection('products').updateMany(
      { etsyExported: { $exists: false } },
      { $set: { etsyExported: false } }
    );

    // Add field etsyExportedAt to Product
    await mongoose.connection.db.collection('products').updateMany(
      { etsyExportedAt: { $exists: false } },
      { $set: { etsyExportedAt: null } }
    );

    // Add field sourceUrl to Product
    await mongoose.connection.db.collection('products').updateMany(
      { sourceUrl: { $exists: false } },
      { $set: { sourceUrl: "" } }
    );

    // Add field productType to Product
    await mongoose.connection.db.collection('products').updateMany(
      { productType: { $exists: false } },
      { $set: { productType: "" } }
    );

    // Add field status to Product
    await mongoose.connection.db.collection('products').updateMany(
      { status: { $exists: false } },
      { $set: { status: 'draft' } }
    );

    // Add field publishAt to Product
    await mongoose.connection.db.collection('products').updateMany(
      { publishAt: { $exists: false } },
      { $set: { publishAt: null } }
    );

    // Add field title to Product
    await mongoose.connection.db.collection('products').updateMany(
      { title: { $exists: false } },
      { $set: { title: "" } }
    );

    // Add field sku to Product
    await mongoose.connection.db.collection('products').updateMany(
      { sku: { $exists: false } },
      { $set: { sku: "" } }
    );

    // Add field available to Product
    await mongoose.connection.db.collection('products').updateMany(
      { available: { $exists: false } },
      { $set: { available: false } }
    );

    // Add field inventory to Product
    await mongoose.connection.db.collection('products').updateMany(
      { inventory: { $exists: false } },
      { $set: { inventory: 0 } }
    );

    // Add field policyReview to Product
    await mongoose.connection.db.collection('products').updateMany(
      { policyReview: { $exists: false } },
      { $set: { policyReview: null } }
    );

    // Add field score to Product
    await mongoose.connection.db.collection('products').updateMany(
      { score: { $exists: false } },
      { $set: { score: 0 } }
    );

    // Add field complianceRate to Product
    await mongoose.connection.db.collection('products').updateMany(
      { complianceRate: { $exists: false } },
      { $set: { complianceRate: 0 } }
    );

    // Add field summary to Product
    await mongoose.connection.db.collection('products').updateMany(
      { summary: { $exists: false } },
      { $set: { summary: 0 } }
    );

    // Add field criticalIssues to Product
    await mongoose.connection.db.collection('products').updateMany(
      { criticalIssues: { $exists: false } },
      { $set: { criticalIssues: 0 } }
    );

    // Add field warnings to Product
    await mongoose.connection.db.collection('products').updateMany(
      { warnings: { $exists: false } },
      { $set: { warnings: 0 } }
    );

    // Add field recommendations to Product
    await mongoose.connection.db.collection('products').updateMany(
      { recommendations: { $exists: false } },
      { $set: { recommendations: 0 } }
    );

    // Add field isCompliant to Product
    await mongoose.connection.db.collection('products').updateMany(
      { isCompliant: { $exists: false } },
      { $set: { isCompliant: false } }
    );

    // Add field aiReview to Product
    await mongoose.connection.db.collection('products').updateMany(
      { aiReview: { $exists: false } },
      { $set: { aiReview: null } }
    );

    // Add field resetPasswordToken to User
    await mongoose.connection.db.collection('users').updateMany(
      { resetPasswordToken: { $exists: false } },
      { $set: { resetPasswordToken: "" } }
    );

    // Add field resetPasswordExpires to User
    await mongoose.connection.db.collection('users').updateMany(
      { resetPasswordExpires: { $exists: false } },
      { $set: { resetPasswordExpires: new Date() } }
    );

    // Add field referralCode to User
    await mongoose.connection.db.collection('users').updateMany(
      { referralCode: { $exists: false } },
      { $set: { referralCode: "" } }
    );

    // Remove field theme from User
    await mongoose.connection.db.collection('users').updateMany(
      {},
      { $unset: { theme: 1 } }
    );

    // Remove field language from User
    await mongoose.connection.db.collection('users').updateMany(
      {},
      { $unset: { language: 1 } }
    );

    // Create new model AbandonedCartAnalytics
    // Note: Model will be created automatically when first document is inserted

    // Create new model AnalyticsEvent
    // Note: Model will be created automatically when first document is inserted

    // Create new model AuditLog
    // Note: Model will be created automatically when first document is inserted

    // Create new model Blog
    // Note: Model will be created automatically when first document is inserted

    // Create new model CartAbandonment
    // Note: Model will be created automatically when first document is inserted

    // Create new model ChatMessage
    // Note: Model will be created automatically when first document is inserted

    // Create new model CustomerAnalytics
    // Note: Model will be created automatically when first document is inserted

    // Create new model EmailPromoDiscount
    // Note: Model will be created automatically when first document is inserted

    // Create new model EmailSubscriber
    // Note: Model will be created automatically when first document is inserted

    // Create new model EmailTracking
    // Note: Model will be created automatically when first document is inserted

    // Create new model EtsyListing
    // Note: Model will be created automatically when first document is inserted

    // Create new model EtsyOrder
    // Note: Model will be created automatically when first document is inserted

    // Create new model EtsyShop
    // Note: Model will be created automatically when first document is inserted

    // Create new model KeywordResearch
    // Note: Model will be created automatically when first document is inserted

    // Create new model KnowledgeBase
    // Note: Model will be created automatically when first document is inserted

    // Create new model PreOrder
    // Note: Model will be created automatically when first document is inserted

    // Create new model PriceAlert
    // Note: Model will be created automatically when first document is inserted

    // Create new model ProcessedImage
    // Note: Model will be created automatically when first document is inserted

    // Create new model ProductBundle
    // Note: Model will be created automatically when first document is inserted

    // Create new model ProductQA
    // Note: Model will be created automatically when first document is inserted

    // Create new model ProductVersion
    // Note: Model will be created automatically when first document is inserted

    // Create new model PurchaseAnalytics
    // Note: Model will be created automatically when first document is inserted

    // Create new model Referral
    // Note: Model will be created automatically when first document is inserted

    // Create new model Review
    // Note: Model will be created automatically when first document is inserted

    // Create new model SavedPaymentMethod
    // Note: Model will be created automatically when first document is inserted

    // Create new model Scraped
    // Note: Model will be created automatically when first document is inserted

    // Create new model SearchEvent
    // Note: Model will be created automatically when first document is inserted

    // Create new model SeoKeyword
    // Note: Model will be created automatically when first document is inserted

    // Create new model SeoProduct
    // Note: Model will be created automatically when first document is inserted

    // Create new model SeoQuery
    // Note: Model will be created automatically when first document is inserted

    // Create new model SourcedProduct
    // Note: Model will be created automatically when first document is inserted

    // Create new model StockNotification
    // Note: Model will be created automatically when first document is inserted

    // Create new model Subscription
    // Note: Model will be created automatically when first document is inserted

    // Create new model SupportTicket
    // Note: Model will be created automatically when first document is inserted

    // Drop collection occasions
    await mongoose.connection.db.collection('occasions').drop();

    console.log('  ✅ Auto-generated schema changes applied');
  },

  async down() {
    console.log('  🔄 Rolling back auto-generated schema changes...');
    
    await connectDB();
    
    // Rollback logic would go here
    // Note: This is a basic rollback - you may need to customize it
    
    console.log('  ✅ Auto-generated schema changes rolled back');
  }
};

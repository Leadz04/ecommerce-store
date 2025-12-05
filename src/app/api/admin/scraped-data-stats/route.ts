import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requirePermission } from '@/lib/auth';
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
  brand: {
    type: String,
    required: false,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  productType: {
    type: String,
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

// Helper function to check if product is winter-related (same logic as scraping routes)
function isWinterProduct(product: any): boolean {
  const name = (product.name || '').toLowerCase();
  const description = (product.description || '').toLowerCase();
  const descriptionHtml = (product.descriptionHtml || '').toLowerCase();
  const productType = (product.productType || '').toLowerCase();
  const tags = (product.tags || []).map((tag: string) => tag.toLowerCase()).join(' ');
  
  const combinedText = `${name} ${productType} ${description} ${descriptionHtml} ${tags}`;
  
  // Winter-related keywords (matching the scraping routes)
  const winterKeywords = [
    'winter',
    'win',
    '25-win',
    'winter-24',
    'winter-25',
    'winter 2025',
    'winter-2025',
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
    'men winter',
    'women winter',
    'winter drop'
  ];
  
  // Check if any winter keyword is present
  return winterKeywords.some(keyword => combinedText.includes(keyword));
}

// GET /api/admin/scraped-data-stats - Get stats for all scraped brands
export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.PRODUCT_VIEW)(request);
    
    const conn = await getStage3Connection();
    const Product = conn.model('Product', ProductSchema);

    // Define the brands we're tracking
    const brands = ['breakout', 'furorjeans', 'engine', 'hustlenholla', 'almas', 'unze', '999pk'];
    
    const stats: Record<string, {
      totalProducts: number;
      winterProducts: number;
      hasProducts: boolean;
    }> = {};

    // Get stats for each brand
    for (const brand of brands) {
      // Count total products for this brand (case-insensitive)
      const totalProducts = await Product.countDocuments({ 
        brand: { $regex: new RegExp(`^${brand}$`, 'i') } 
      });

      // Get all products for this brand to check for winter products
      const products = await Product.find({ 
        brand: { $regex: new RegExp(`^${brand}$`, 'i') } 
      }).select('name description descriptionHtml productType tags');

      // Count winter products
      const winterProducts = products.filter(product => isWinterProduct(product)).length;

      stats[brand] = {
        totalProducts,
        winterProducts,
        hasProducts: totalProducts > 0
      };
    }

    return NextResponse.json({
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Scraped data stats API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch scraped data stats' },
      { status: error.message?.includes('permission') ? 403 : 500 }
    );
  }
}

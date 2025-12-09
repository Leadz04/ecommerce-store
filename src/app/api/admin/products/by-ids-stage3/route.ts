import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { verifyToken, requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';

let mainConnection: mongoose.Connection | null = null;

async function getMainConnection() {
  if (mainConnection && mainConnection.readyState === 1) {
    return mainConnection;
  }

  const mongooseInstance = await connectDB();
  if (!mongooseInstance) {
    throw new Error('MONGODB_URI is not configured');
  }
  
  mainConnection = mongooseInstance.connection;
  return mainConnection;
}

// Product Schema (same as in src/models/Product.ts)
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  descriptionHtml: { type: String },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, min: 0 },
  image: { type: String, required: true },
  images: [{ type: String }],
  imageAltTexts: [{ type: String, trim: true }],
  category: {
    type: String,
    enum: ['Men', 'Women', 'Office & Travel', 'Accessories', 'Gifting'],
    default: 'Accessories'
  },
  brand: { type: String, trim: true },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0, min: 0 },
  inStock: { type: Boolean, default: true },
  stockCount: { type: Number, default: 0, min: 0 },
  tags: [{ type: String, trim: true }],
  specifications: { type: Map, of: String },
  sourceUrl: { type: String, index: true, sparse: true },
  productType: { type: String },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true,
  },
  publishAt: { type: Date, default: null, index: true },
  variants: [{
    title: { type: String },
    sku: { type: String },
    price: { type: Number, min: 0 },
    originalPrice: { type: Number, min: 0 },
    available: { type: Boolean },
    inventory: { type: Number, min: 0, required: false },
  }],
  isActive: { type: Boolean, default: true },
  etsyExported: { type: Boolean, default: false, index: true },
  etsyExportedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// POST /api/admin/products/by-ids-stage3 - Get STAGE3 products by array of IDs
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(PERMISSIONS.PRODUCT_VIEW)(request);
    
    const conn = await getMainConnection();
    const Product = conn.model('Product', ProductSchema);

    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Product IDs array is required' },
        { status: 400 }
      );
    }

    // Limit to 1000 products at a time
    const productIds = ids.slice(0, 1000).filter((id: string) => {
      return mongoose.Types.ObjectId.isValid(id);
    });

    if (productIds.length === 0) {
      return NextResponse.json({ products: [] });
    }

    // Fetch products by IDs
    const foundProducts = await Product.find({
      _id: { $in: productIds }
    }).lean();

    return NextResponse.json({
      products: foundProducts,
      count: foundProducts.length,
      requested: productIds.length
    });

  } catch (error: any) {
    console.error('STAGE3 Products by IDs API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch STAGE3 products' },
      { status: 500 }
    );
  }
}

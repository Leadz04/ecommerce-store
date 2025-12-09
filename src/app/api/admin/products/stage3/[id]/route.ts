import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';

// Product Schema for STAGE3
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

// PUT /api/admin/products/stage3/[id] - Update STAGE3 product
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(PERMISSIONS.PRODUCT_UPDATE)(request);
    const { id } = await context.params;
    const body = await request.json();
    
    const conn = await getMainConnection();
    const Product = conn.model('Product', ProductSchema);

    const {
      name,
      description,
      price,
      originalPrice,
      image,
      images,
      category,
      brand,
      stockCount,
      tags,
      specifications,
      isActive,
      status,
    } = body;

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Validate price if provided
    if (price !== undefined && price < 0) {
      return NextResponse.json(
        { error: 'Price cannot be negative' },
        { status: 400 }
      );
    }

    // Validate stock count if provided
    if (stockCount !== undefined && stockCount < 0) {
      return NextResponse.json(
        { error: 'Stock count cannot be negative' },
        { status: 400 }
      );
    }

    // Update product fields
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (originalPrice !== undefined) product.originalPrice = originalPrice;
    if (image !== undefined) product.image = image;
    if (images !== undefined) product.images = images;
    if (category !== undefined) product.category = category;
    if (brand !== undefined) product.brand = brand;
    if (stockCount !== undefined) {
      product.stockCount = stockCount;
      product.inStock = stockCount > 0;
    }
    if (tags !== undefined) product.tags = tags;
    if (specifications !== undefined) product.specifications = specifications;
    if (typeof isActive === 'boolean') product.isActive = isActive;
    if (status !== undefined) product.status = status;

    await product.save();

    return NextResponse.json({
      message: 'Product updated successfully',
      product
    });

  } catch (error) {
    console.error('Update STAGE3 product error:', error);
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    const err: any = error;
    if (err?.name === 'ValidationError') {
      return NextResponse.json({ error: err.message, errors: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

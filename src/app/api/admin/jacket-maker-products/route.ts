import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { verifyToken, requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';

// Product Schema (same as in src/models/Product.ts)
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
  imageAltTexts: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    enum: ['Men', 'Women', 'Office & Travel', 'Accessories', 'Gifting'],
    default: 'Accessories'
  },
  brand: {
    type: String,
    required: false,
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
    required: false,
    default: 0,
    min: [0, 'Stock count cannot be negative']
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
    index: true,
    sparse: true,
  },
  productType: {
    type: String,
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true,
  },
  publishAt: {
    type: Date,
    default: null,
    index: true,
  },
  variants: [{
    title: { type: String },
    sku: { type: String },
    price: { type: Number, min: 0 },
    originalPrice: { type: Number, min: 0 },
    available: { type: Boolean },
    inventory: { type: Number, min: 0, required: false },
  }],
  isActive: {
    type: Boolean,
    default: true
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

// GET /api/admin/jacket-maker-products - Get all products from STAGE3 database
export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(PERMISSIONS.PRODUCT_VIEW)(request);
    
    const conn = await getStage3Connection();
    const Product = conn.model('Product', ProductSchema);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const brand = searchParams.get('brand') || '';
    const status = searchParams.get('status') || '';
    const isActive = searchParams.get('isActive') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query - only products from The Jacket Maker
    const query: any = {
      sourceUrl: { $regex: /thejacketmaker/i }
    };
    const andConditions: any[] = [];
    
    if (search) {
      andConditions.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ]
      });
    }
    
    if (category) {
      query.category = category;
    }
    
    if (brand) {
      query.brand = { $regex: brand, $options: 'i' };
    }

    if (status) {
      if (['draft', 'published', 'archived'].includes(status)) {
        query.status = status;
      }
    }

    if (isActive) {
      if (isActive === 'active') {
        query.isActive = true;
      } else if (isActive === 'inactive') {
        query.isActive = false;
      }
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    // Build sort
    const sort: any = {};
    if (sortBy === 'name') {
      sort.name = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'price') {
      sort.price = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'createdAt') {
      sort.createdAt = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'updatedAt') {
      sort.updatedAt = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Product.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Product.countDocuments(query)
    ]);

    // Get distinct brands and categories for filters
    const [brands, categories] = await Promise.all([
      Product.distinct('brand', query),
      Product.distinct('category', query)
    ]);

    return NextResponse.json({
      products: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        brands: brands.filter((b): b is string => Boolean(b) && typeof b === 'string').sort(),
        categories: categories.filter((c): c is string => Boolean(c) && typeof c === 'string').sort()
      }
    });

  } catch (error: any) {
    console.error('Jacket Maker Products API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch jacket maker products' },
      { status: error.message?.includes('permission') ? 403 : 500 }
    );
  }
}


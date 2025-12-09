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

// GET /api/admin/brand-products - Get products by brand from STAGE3 database
export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(PERMISSIONS.PRODUCT_VIEW)(request);
    
    const conn = await getMainConnection();
    const Product = conn.model('Product', ProductSchema);

    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const brand = searchParams.get('brand') || '';
    const status = searchParams.get('status') || '';
    const isActive = searchParams.get('isActive') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Check if any filters are active
    const hasActiveFilters = !!(search || category || status || isActive);
    
    // If filters are active and no page/limit provided, return all results
    // Otherwise, use pagination
    const usePagination = !hasActiveFilters && pageParam && limitParam;
    const page = usePagination ? parseInt(pageParam) : 1;
    const limit = usePagination ? Math.min(parseInt(limitParam), 1000) : 1000; // Default to 1000 when no limit

    // Build query - filter by brand if provided
    const query: any = {};
    const andConditions: any[] = [];
    
    // Brand is required for this endpoint
    if (brand) {
      query.brand = { $regex: new RegExp(`^${brand}$`, 'i') };
    } else {
      return NextResponse.json(
        { error: 'Brand parameter is required' },
        { status: 400 }
      );
    }
    
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

    const skip = usePagination ? (page - 1) * limit : 0;

    const [items, total] = await Promise.all([
      usePagination 
        ? Product.find(query).sort(sort).skip(skip).limit(limit).lean()
        : Product.find(query).sort(sort).lean(),
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
        page: usePagination ? page : 1,
        limit: usePagination ? limit : items.length,
        total,
        pages: usePagination ? Math.ceil(total / limit) : 1
      },
      filters: {
        brands: brands.filter((b): b is string => Boolean(b) && typeof b === 'string').sort(),
        categories: categories.filter((c): c is string => Boolean(c) && typeof c === 'string').sort()
      }
    });

  } catch (error: any) {
    console.error('Brand Products API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch brand products' },
      { status: error.message?.includes('permission') ? 403 : 500 }
    );
  }
}


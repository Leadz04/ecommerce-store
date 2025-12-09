import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { verifyToken, requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import { AuditLog } from '@/models';
import { applyDeduplication } from '@/lib/deduplication';

let mainConnection: mongoose.Connection | null = null;

async function getMainConnection() {
  if (mainConnection && mainConnection.readyState === 1) {
    return mainConnection;
  }

  // Use the main database connection (same as users)
  const mongooseInstance = await connectDB();
  if (!mongooseInstance) {
    throw new Error('MONGODB_URI is not configured');
  }
  
  mainConnection = mongooseInstance.connection;
  return mainConnection;
}

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

// GET /api/admin/products - Get all products with pagination and filtering (from STAGE3 database)
export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(PERMISSIONS.PRODUCT_VIEW)(request);
    
    const conn = await getMainConnection();
    const Product = conn.model('Product', ProductSchema);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const brand = searchParams.get('brand') || '';
    const status = searchParams.get('status') || '';
    const organized = searchParams.get('organized') || ''; // 'all', 'organized', 'unorganized'
    const stockCount = searchParams.get('stockCount') || '';
    const isActive = searchParams.get('isActive') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    const query: any = {};
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
      } else if (status === 'scheduled') {
        query.status = 'published';
        query.publishAt = { $gt: new Date() };
      } else if (status === 'live') {
        query.status = 'published';
        andConditions.push({
          $or: [{ publishAt: null }, { publishAt: { $lte: new Date() } }]
        });
      }
    }

    // Filter by organized status (products with Cloudinary images)
    if (organized && organized !== 'all') {
      const cloudinaryRegex = { $regex: 'cloudinary\\.com', $options: 'i' };
      if (organized === 'organized') {
        // Products that have at least one Cloudinary image
        // Check if image field exists and matches, or if images array has at least one match
        andConditions.push({
          $or: [
            { image: { $exists: true, $ne: null, $regex: 'cloudinary\\.com', $options: 'i' } },
            { images: { $exists: true, $ne: null, $elemMatch: cloudinaryRegex } }
          ]
        });
      } else if (organized === 'unorganized') {
        // Products that don't have any Cloudinary images
        // Use $nor to ensure neither image nor any image in images array contains cloudinary.com
        // Handle cases where fields might not exist or be null
        andConditions.push({
          $nor: [
            { image: { $exists: true, $ne: null, $regex: 'cloudinary\\.com', $options: 'i' } },
            { images: { $exists: true, $ne: null, $elemMatch: cloudinaryRegex } }
          ]
        });
      }
    }

    // Filter by stock count (exact match or range)
    if (stockCount) {
      const stockNum = parseInt(stockCount);
      if (!isNaN(stockNum)) {
        query.stockCount = stockNum;
      }
    }

    // Filter by isActive status
    if (isActive && isActive !== 'all') {
      if (isActive === 'active') {
        query.isActive = true;
      } else if (isActive === 'inactive') {
        query.isActive = false;
      }
    }

    // Combine all conditions with $and if needed
    // MongoDB will automatically combine top-level conditions with $and,
    // but we need explicit $and when we have multiple $or/$nor conditions
    if (andConditions.length > 0) {
      // If we have other query conditions, combine them with $and
      const otherConditions: any = {};
      Object.keys(query).forEach(key => {
        if (key !== '$and') {
          otherConditions[key] = query[key];
          delete query[key];
        }
      });
      
      if (Object.keys(otherConditions).length > 0) {
        query.$and = [otherConditions, ...andConditions];
      } else {
        query.$and = andConditions;
      }
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Debug: Log query structure in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Products API] Query:', JSON.stringify(query, null, 2));
    }

    // Get products with pagination
    const skip = (page - 1) * limit;
    let productsRaw;
    try {
      productsRaw = await Product.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
    } catch (dbError) {
      console.error('[Products API] Database query error:', dbError);
      throw new Error(`Database query failed: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
    }

    // Apply deduplication to ensure unique products
    const products = applyDeduplication(productsRaw, 'products');

    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Get unique categories and brands for filters
    const categories = await Product.distinct('category');
    const brands = await Product.distinct('brand');

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        categories,
        brands
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      if (error.message.includes('No token provided') || error.message.includes('Invalid token')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.includes('Insufficient permissions')) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
      // Return error details for debugging
      return NextResponse.json({ 
        error: 'Internal server error',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/products - Create new product (in STAGE3 database)
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(PERMISSIONS.PRODUCT_CREATE)(request);
    
    const conn = await getMainConnection();
    const Product = conn.model('Product', ProductSchema);
    
    // Also connect to main DB for audit logs
    await connectDB();

    const body = await request.json();
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
      isActive = true,
      productType,
      sourceUrl,
      variants,
      status = 'draft',
      publishAt = null
    } = body;

    // Validate required fields
    if (!name || !description || price === undefined || price === null || !image) {
      return NextResponse.json(
        { error: 'Name, description, price, and image are required' },
        { status: 400 }
      );
    }

    // Validate price
    if (price < 0) {
      return NextResponse.json(
        { error: 'Price cannot be negative' },
        { status: 400 }
      );
    }

    // Validate stock count
    if (stockCount !== undefined && stockCount < 0) {
      return NextResponse.json(
        { error: 'Stock count cannot be negative' },
        { status: 400 }
      );
    }

    // Create new product
    const normalizedStock = typeof stockCount === 'number' ? stockCount : 0;
    const normalizedBrand = (brand && brand !== 'Other') ? brand : 'EverStyleCrafts';
    const product = new Product({
      name,
      description,
      price,
      originalPrice,
      image,
      images: images || [],
      category,
      brand: normalizedBrand,
      stockCount: normalizedStock,
      inStock: normalizedStock > 0,
      tags: tags || [],
      specifications: specifications || {},
      isActive,
      productType,
      sourceUrl,
      variants,
      status,
      publishAt: publishAt ? new Date(publishAt) : null,
    });

    await product.save();

    // Audit log
    try {
      const ip = request.headers.get('x-forwarded-for') || '';
      const userAgent = request.headers.get('user-agent') || '';
      await AuditLog.create({
        userId: user.userId,
        action: 'product:create',
        resourceType: 'Product',
        resourceId: String(product._id),
        metadata: { name: product.name, status: product.status },
        ip,
        userAgent,
      });
    } catch {}

    return NextResponse.json({
      message: 'Product created successfully',
      product
    }, { status: 201 });

  } catch (error) {
    console.error('Create product error:', error);
    if (error instanceof Error) {
      if (error.message.includes('No token provided') || error.message.includes('Invalid token')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.includes('Insufficient permissions')) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
    }
    // Surface validation details when possible
    const err: any = error;
    if (err?.name === 'ValidationError') {
      return NextResponse.json({ error: err.message, errors: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

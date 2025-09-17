import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { verifyToken, requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';

// GET /api/admin/products - Get all products with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(PERMISSIONS.PRODUCT_VIEW)(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const brand = searchParams.get('brand') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    if (category) {
      query.category = category;
    }
    
    if (brand) {
      query.brand = { $regex: brand, $options: 'i' };
    }
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    } else if (status === 'out-of-stock') {
      query.stockCount = 0;
    } else if (status === 'low-stock') {
      query.stockCount = { $gt: 0, $lte: 10 };
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get products with pagination
    const skip = (page - 1) * limit;
    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);

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
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(PERMISSIONS.PRODUCT_CREATE)(request);
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
      variants
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
    const product = new Product({
      name,
      description,
      price,
      originalPrice,
      image,
      images: images || [],
      category,
      brand,
      stockCount: normalizedStock,
      inStock: normalizedStock > 0,
      tags: tags || [],
      specifications: specifications || {},
      isActive,
      productType,
      sourceUrl,
      variants
    });

    await product.save();

    return NextResponse.json({
      message: 'Product created successfully',
      product
    }, { status: 201 });

  } catch (error) {
    console.error('Create product error:', error);
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    // Surface validation details when possible
    const err: any = error;
    if (err?.name === 'ValidationError') {
      return NextResponse.json({ error: err.message, errors: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

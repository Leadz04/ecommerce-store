import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { applyDeduplication } from '@/lib/deduplication';

export async function GET(request: NextRequest) {
  console.log('[API /products] GET request received');
  try {
    console.log('[API /products] Connecting to database...');
    await connectDB();
    console.log('[API /products] Database connected successfully');
    
    const { searchParams } = new URL(request.url);
    console.log('[API /products] Search params:', searchParams.toString());
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'name';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const inStock = searchParams.get('inStock');
    const brand = searchParams.get('brand');
    const minRating = searchParams.get('minRating');
    const collection = (searchParams.get('collection') || '').toLowerCase();
    const style = searchParams.get('style');
    const color = searchParams.get('color');

    // Build query - include legacy products without status/publishAt
    const now = new Date();
    const query: any = { isActive: true };

    // Status/publish window
    query.$and = [
      { $or: [ { status: 'published' }, { status: { $exists: false } }, { status: null } ] },
      { $or: [ { publishAt: null }, { publishAt: { $lte: now } }, { publishAt: { $exists: false } } ] },
    ];
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Build $and array for complex filters
    const andConditions: any[] = [];

    if (search) {
      andConditions.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ]
      });
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    if (inStock === 'true') {
      query.inStock = true;
    }

    if (brand) {
      query.brand = { $regex: brand, $options: 'i' };
    }

    if (minRating) {
      const parsed = parseFloat(minRating);
      if (!Number.isNaN(parsed)) {
        query.rating = { $gte: parsed };
      }
    }

    // Style filter - search in tags and productType
    if (style) {
      andConditions.push({
        $or: [
          { tags: { $regex: style, $options: 'i' } },
          { productType: { $regex: style, $options: 'i' } },
          { name: { $regex: style, $options: 'i' } }
        ]
      });
    }

    // Color filter - search in tags, specifications, and name
    if (color) {
      andConditions.push({
        $or: [
          { tags: { $regex: color, $options: 'i' } },
          { name: { $regex: color, $options: 'i' } },
          { 'specifications.Color': { $regex: color, $options: 'i' } },
          { 'specifications.color': { $regex: color, $options: 'i' } }
        ]
      });
    }

    // Add all AND conditions to query
    if (andConditions.length > 0) {
      query.$and = [...(query.$and || []), ...andConditions];
    }

    // Collections can influence query and sort
    let sort: any = {};
    if (collection === 'new' || collection === 'new-arrivals') {
      sort.createdAt = -1; // newest first
    } else if (collection === 'best' || collection === 'best-sellers') {
      sort.rating = -1;
      sort.reviewCount = -1;
    } else if (collection === 'seasonal' || collection === 'season') {
      query.$or = [
        ...(query.$or || []),
        { tags: { $in: [/season/i] } },
        { productType: { $regex: 'season', $options: 'i' } }
      ];
      if (!sortBy || sortBy === 'name') {
        sort.createdAt = -1;
      }
    }

    if (Object.keys(sort).length === 0) {
      switch (sortBy) {
        case 'price-low':
          sort.price = 1;
          break;
        case 'price-high':
          sort.price = -1;
          break;
        case 'rating':
          sort.rating = -1;
          break;
        case 'newest':
          sort.createdAt = -1;
          break;
        default:
          sort.name = 1;
      }
    }

    console.log('[API /products] Executing query:', JSON.stringify(query));
    const productsRaw = await Product.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    console.log('[API /products] Found', productsRaw.length, 'products (before deduplication)');
    
    // Apply deduplication to ensure unique products
    const products = applyDeduplication(productsRaw, 'products');
    console.log('[API /products] After deduplication:', products.length, 'products');

    const total = await Product.countDocuments(query);
    console.log('[API /products] Total count:', total);

    const [categories, brands] = await Promise.all([
      Product.distinct('category', { isActive: true }),
      Product.distinct('brand', { isActive: true })
    ]);

    console.log('[API /products] Success - Returning', products.length, 'products');
    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: { categories, brands }
    });

  } catch (error) {
    console.error('❌ [API /products] Error:', error);
    console.error('[API /products] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const productData = await request.json();
    
    const product = new Product(productData);
    await product.save();

    return NextResponse.json({
      message: 'Product created successfully',
      product
    }, { status: 201 });

  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

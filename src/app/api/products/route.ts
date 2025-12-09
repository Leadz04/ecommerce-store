import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { applyDeduplication } from '@/lib/deduplication';
import Product from '@/models/Product';

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
  
  // Ensure connection is ready
  if (mongooseInstance.connection.readyState !== 1) {
    throw new Error('Database connection is not ready');
  }
  
  mainConnection = mongooseInstance.connection;
  return mainConnection;
}

export async function GET(request: NextRequest) {
  console.log('[API /products] GET request received');
  try {
    console.log('[API /products] Connecting to main database...');
    try {
      await getMainConnection();
    } catch (connError) {
      console.error('[API /products] Connection error:', connError);
      return NextResponse.json(
        { error: 'Database connection failed', details: connError instanceof Error ? connError.message : String(connError) },
        { status: 500 }
      );
    }
    
    console.log('[API /products] Database connected successfully');
    
    const { searchParams } = new URL(request.url);
    console.log('[API /products] Search params:', searchParams.toString());
    const page = parseInt(searchParams.get('page') || '1');
    const limitParam = searchParams.get('limit');
    // If limit is 0 or not provided when filters are active, return all results
    const limit = limitParam ? parseInt(limitParam) : 20;
    // Treat 0 as "no limit" - return all results
    const hasNoLimit = limit === 0;
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    // Check if search or any filters are active - if so, return all results
    const hasActiveFilters = !!(
      search ||
      searchParams.get('minPrice') ||
      searchParams.get('maxPrice') ||
      searchParams.get('inStock') ||
      searchParams.get('brand') ||
      searchParams.get('style') ||
      searchParams.get('color') ||
      searchParams.get('minRating') ||
      searchParams.get('collection')
    );
    
    // If filters are active or limit is 0 (meaning "no limit"), don't use pagination
    const usePagination = !hasActiveFilters && !hasNoLimit && page && limit > 0;
    const sortBy = searchParams.get('sortBy') || 'name';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const inStock = searchParams.get('inStock');
    const brand = searchParams.get('brand');
    const minRating = searchParams.get('minRating');
    const collection = (searchParams.get('collection') || '').toLowerCase();
    const style = searchParams.get('style');
    const color = searchParams.get('color');

    // Build query - get all products from main database, exclude test products
    const query: any = {};
    
    // Exclude test products (identified by name or sourceUrl containing 'test')
    // MongoDB will check array fields (tags) for regex matches automatically
    query.$and = [
      {
        $nor: [
          { name: { $regex: /test/i } },
          { sourceUrl: { $regex: /test/i } },
          { tags: /test/i }
        ]
      }
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
    
    // Ensure $and is an array
    if (query.$and && query.$and.length === 0) {
      delete query.$and;
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
    
    // Build query - always apply a reasonable limit to prevent memory issues
    // MongoDB has a 32MB memory limit for sorts, so we must limit results
    let queryBuilder = Product.find(query);
    
    // Apply sort
    if (Object.keys(sort).length > 0) {
      queryBuilder = queryBuilder.sort(sort);
    }
    
    // Always apply a limit to prevent "Sort exceeded memory limit" errors
    // When filters are active, cap at 5000 to prevent memory issues
    if (usePagination) {
      queryBuilder = queryBuilder.limit(limit).skip((page - 1) * limit);
    } else if (hasActiveFilters || hasNoLimit) {
      // When filters are active, limit to max 5000 to prevent memory issues
      // This prevents MongoDB from trying to sort 15,000+ products in memory
      const maxLimit = Math.min(limit || 5000, 5000);
      queryBuilder = queryBuilder.limit(maxLimit);
    } else {
      // Default limit if nothing specified
      queryBuilder = queryBuilder.limit(limit || 20);
    }
    
    let productsRaw;
    try {
      productsRaw = await queryBuilder.lean();
    } catch (queryError) {
      console.error('[API /products] Query execution error:', queryError);
      // Return empty results instead of error if query fails
      productsRaw = [];
    }

    console.log('[API /products] Found', productsRaw.length, 'products (before deduplication)');
    
    // Apply deduplication to ensure unique products
    const products = applyDeduplication(productsRaw, 'products');
    console.log('[API /products] After deduplication:', products.length, 'products');

    let total = 0;
    let categories: string[] = [];
    let brands: string[] = [];
    
    try {
      total = await Product.countDocuments(query);
      console.log('[API /products] Total count:', total);

      [categories, brands] = await Promise.all([
        Product.distinct('category', query).catch(() => []),
        Product.distinct('brand', query).catch(() => [])
      ]);
    } catch (countError) {
      console.error('[API /products] Count/distinct error:', countError);
      // Continue with empty arrays if count fails
    }

    console.log('[API /products] Success - Returning', products.length, 'products');
    return NextResponse.json({
      products,
      pagination: {
        page: usePagination ? page : 1,
        limit: usePagination ? limit : (hasNoLimit ? total : products.length),
        total,
        pages: usePagination ? Math.ceil(total / limit) : 1
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
    await getMainConnection();
    
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
